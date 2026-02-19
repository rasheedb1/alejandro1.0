import { NextResponse } from 'next/server'
import { getSynthesisPrompt } from '@/lib/research/modules'
import type { ModuleResult, ResearchInput } from '@/lib/research/types'

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
        max_tokens: 3000,
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
      if (block.type === 'text' && block.text) {
        rawText += block.text
      }
    }

    let data: Record<string, unknown> = {}
    try {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1].trim())
      } else {
        data = JSON.parse(rawText.trim())
      }
    } catch {
      data = { raw_text: rawText, parse_error: true }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Synthesis error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
