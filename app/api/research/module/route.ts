import { NextResponse } from 'next/server'
import { getModulePrompt } from '@/lib/research/modules'
import { getScrapeTargets, scrapeUrls, formatScrapedContext } from '@/lib/research/firecrawl'
import type { ModuleId, ResearchInput } from '@/lib/research/types'

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

    // Step 1: Firecrawl — scrape relevant pages in parallel before calling Claude
    let scrapedContext = ''
    const firecrawlKey = process.env.FIRECRAWL_API_KEY
    if (firecrawlKey) {
      const targets = getScrapeTargets(moduleId, input)
      if (targets.length > 0) {
        const scrapedPages = await scrapeUrls(targets, firecrawlKey)
        scrapedContext = formatScrapedContext(scrapedPages, input.companyName)
      }
    }

    // Step 2: Build the module prompt, injecting scraped content if available
    const basePrompt = getModulePrompt(moduleId, input)
    const prompt = scrapedContext
      ? `${scrapedContext}\n\n${basePrompt}`
      : basePrompt

    // Step 3: Call Claude with web search
    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const result = await response.json()

    // Warn if response was cut off due to token limit
    if (result.stop_reason === 'max_tokens') {
      console.warn(`[research/module] ${moduleId} hit max_tokens — response may be truncated`)
    }

    // Extract text content from the response
    let rawText = ''
    for (const block of (result.content ?? []) as Array<{ type: string; text?: string }>) {
      if (block.type === 'text' && block.text) {
        rawText += block.text
      }
    }

    // Parse JSON — try multiple strategies since Claude sometimes wraps it in text/code blocks
    let data: Record<string, unknown> = {}
    try {
      // Strategy 1: JSON in a markdown code block (```json ... ``` or ``` ... ```)
      const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        data = JSON.parse(codeBlockMatch[1].trim())
      } else {
        // Strategy 2: Raw JSON starting at first { and ending at last }
        const start = rawText.indexOf('{')
        const end = rawText.lastIndexOf('}')
        if (start !== -1 && end !== -1 && end > start) {
          data = JSON.parse(rawText.slice(start, end + 1))
        } else {
          data = JSON.parse(rawText.trim())
        }
      }
    } catch {
      // Strategy 3: try trimming leading/trailing text and parsing the largest JSON-like block
      try {
        const jsonLike = rawText.match(/\{[\s\S]*\}/)
        if (jsonLike) {
          data = JSON.parse(jsonLike[0])
        } else {
          data = { raw_text: rawText, parse_error: true }
        }
      } catch {
        data = { raw_text: rawText, parse_error: true }
      }
    }

    return NextResponse.json({ moduleId, data, rawText })
  } catch (err) {
    console.error('Research module error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
