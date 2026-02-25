import { NextResponse } from 'next/server'
import { getModulePrompt } from '@/lib/research/modules'
import type { ModuleId, ResearchInput } from '@/lib/research/types'

// Allow up to 5 minutes — two sequential Claude calls can take 60-120s
export const maxDuration = 300

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

    const basePrompt = getModulePrompt(moduleId, input)

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
        messages: [{ role: 'user', content: basePrompt }],
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
    // Call Sonnet WITHOUT web search. Single job: convert research text → JSON.
    // Using Sonnet (not Haiku) for reliable instruction-following on complex schemas.
    const structureRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: 'You are a JSON formatter. Your ONLY output must be a single valid JSON object. Start your response with { and end with }. No backticks, no markdown, no explanation, no text outside the JSON object.',
        messages: [{
          role: 'user',
          content: `${basePrompt}\n\n---\nResearch findings — use these to populate every field in the JSON schema above:\n\n${rawText}`,
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

    // Strip leading/trailing backticks that Sonnet occasionally adds
    const cleaned = structuredText.trim().replace(/^`+(?:json)?[\s]*/i, '').replace(/[\s]*`+$/, '')

    let data: Record<string, unknown> =
      tryParse(cleaned) ||
      tryParse(extractOutermostJSON(cleaned) ?? '') ||
      tryParse(extractOutermostJSON(structuredText) ?? '') ||
      {}

    if (!Object.keys(data).length) {
      console.error(`[research/module] ${moduleId} structure parse failed.\nstructuredText[:300]: ${structuredText.slice(0, 300)}\ncleaned[:300]: ${cleaned.slice(0, 300)}`)
      data = { raw_text: rawText, parse_error: true }
    }

    return NextResponse.json({ moduleId, data, rawText })
  } catch (err) {
    console.error('Research module error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
