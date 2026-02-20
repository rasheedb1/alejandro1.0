import { NextResponse } from 'next/server'
import { getSynthesisPrompt } from '@/lib/research/modules'
import type { ModuleResult, ResearchInput } from '@/lib/research/types'

function tryParse(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str) } catch { /* fall through */ }
  try { return JSON.parse(str.replace(/,(\s*[}\]])/g, '$1')) } catch { /* fall through */ }
  return null
}

export async function POST(req: Request) {
  try {
    const { input, modules }: { input: ResearchInput; modules: ModuleResult[] } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const modulesJson = JSON.stringify(
      modules.map((m) => ({ module: m.title, findings: m.data })),
      null,
      2
    )

    const prompt = getSynthesisPrompt(input, modulesJson)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: 'You are a research analyst. You MUST end your response with a valid JSON object wrapped in ===JSON_START=== and ===JSON_END=== delimiters.',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Claude API error: ${err}` }, { status: 500 })
    }

    const result = await response.json()

    let rawText = ''
    for (const block of (result.content ?? []) as Array<{ type: string; text?: string }>) {
      if (block.type === 'text' && block.text) rawText += block.text
    }

    let data: Record<string, unknown> = {}

    // Strategy 1: Explicit delimiters (most reliable)
    const delimiterMatch = rawText.match(/===JSON_START===([\s\S]*?)===JSON_END===/)
    if (delimiterMatch) {
      const parsed = tryParse(delimiterMatch[1].trim())
      if (parsed) data = parsed
    }

    // Strategy 2: Markdown code block
    if (!Object.keys(data).length) {
      const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        const parsed = tryParse(codeBlockMatch[1].trim())
        if (parsed) data = parsed
      }
    }

    // Strategy 3: Walk backwards from last '}' to find outermost JSON
    if (!Object.keys(data).length) {
      const end = rawText.lastIndexOf('}')
      if (end !== -1) {
        let depth = 0
        for (let i = end; i >= 0; i--) {
          if (rawText[i] === '}') depth++
          if (rawText[i] === '{') {
            depth--
            if (depth === 0) {
              const parsed = tryParse(rawText.slice(i, end + 1))
              if (parsed) { data = parsed; break }
            }
          }
        }
      }
    }

    if (!Object.keys(data).length) {
      console.error('Synthesis parse failed. rawText start:', rawText.slice(0, 300))
      data = { parse_error: true, raw_text: rawText }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Synthesis error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
