import { NextResponse } from 'next/server'
import { getModulePrompt } from '@/lib/research/modules'
import { getScrapeTargets, scrapeUrls, formatScrapedContext } from '@/lib/research/firecrawl'
import type { ModuleId, ResearchInput } from '@/lib/research/types'

function tryParse(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str) } catch { /* fall through */ }
  try { return JSON.parse(str.replace(/,(\s*[}\]])/g, '$1')) } catch { /* fall through */ }
  return null
}

function extractOutermostJSON(text: string): string | null {
  const end = text.lastIndexOf('}')
  if (end === -1) return null
  let depth = 0
  for (let i = end; i >= 0; i--) {
    if (text[i] === '}') depth++
    if (text[i] === '{') {
      depth--
      if (depth === 0) return text.slice(i, end + 1)
    }
  }
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { moduleId, input }: { moduleId: ModuleId; input: ResearchInput } = body

    if (!moduleId || !input) {
      return NextResponse.json({ error: 'Missing moduleId or input' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // Step 1: Firecrawl — scrape relevant pages (with short timeout to stay within Vercel limits)
    let scrapedContext = ''
    const firecrawlKey = process.env.FIRECRAWL_API_KEY
    if (firecrawlKey) {
      const targets = getScrapeTargets(moduleId, input)
      if (targets.length > 0) {
        const scrapedPages = await scrapeUrls(targets, firecrawlKey)
        scrapedContext = formatScrapedContext(scrapedPages, input.companyName)
      }
    }

    const basePrompt = getModulePrompt(moduleId, input)
    const promptWithContext = scrapedContext
      ? `${scrapedContext}\n\n${basePrompt}`
      : basePrompt

    // ── STEP 2: RESEARCH ─────────────────────────────────────────────────────
    // Call Sonnet with web search. Goal: gather thorough findings as free text.
    // No JSON output required here — just comprehensive research paragraphs.
    const researchRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: 'You are a research analyst. Use web search to gather thorough findings. Write your findings as detailed paragraphs with specific data points, dates, and sources. Do NOT output JSON — just write clear research notes.',
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: promptWithContext }],
      }),
    })

    if (!researchRes.ok) {
      const err = await researchRes.text()
      return NextResponse.json({ error: `Claude research error: ${err}` }, { status: 500 })
    }

    const researchResult = await researchRes.json()

    // Collect the research text (shown in UI as rawText)
    let rawText = ''
    for (const block of (researchResult.content ?? []) as Array<{ type: string; text?: string }>) {
      if (block.type === 'text' && block.text) rawText += block.text
    }

    // ── STEP 3: STRUCTURE ────────────────────────────────────────────────────
    // Call Haiku WITHOUT web search. Goal: format the research into the JSON schema.
    // This call has one job — convert research text to structured JSON.
    const structureRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 16000,
        system: 'You are a JSON formatter. Output ONLY a valid JSON object. No text before or after it. No markdown backticks. No explanation. Start with { and end with }.',
        messages: [{
          role: 'user',
          content: `${basePrompt}\n\n---\nUse the following research findings to populate the JSON above:\n\n${rawText}`,
        }],
      }),
    })

    if (!structureRes.ok) {
      const err = await structureRes.text()
      return NextResponse.json({ error: `Claude structure error: ${err}` }, { status: 500 })
    }

    const structureResult = await structureRes.json()

    let structuredText = ''
    for (const block of (structureResult.content ?? []) as Array<{ type: string; text?: string }>) {
      if (block.type === 'text' && block.text) structuredText += block.text
    }

    // Parse — Haiku should output clean JSON, but keep fallbacks
    let data: Record<string, unknown> =
      tryParse(structuredText.trim()) ||
      tryParse(extractOutermostJSON(structuredText) ?? '') ||
      {}

    if (!Object.keys(data).length) {
      console.error(`[research/module] ${moduleId} structure parse failed. structuredText: ${structuredText.slice(0, 300)}`)
      data = { raw_text: rawText, parse_error: true }
    }

    return NextResponse.json({ moduleId, data, rawText })
  } catch (err) {
    console.error('Research module error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
