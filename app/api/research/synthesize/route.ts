import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSynthesisPrompt } from '@/lib/research/modules'
import type { ModuleResult, ResearchInput } from '@/lib/research/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const { input, modules }: { input: ResearchInput; modules: ModuleResult[] } = await req.json()

    const modulesJson = JSON.stringify(
      modules.map((m) => ({ module: m.title, findings: m.data })),
      null,
      2
    )

    const prompt = getSynthesisPrompt(input, modulesJson)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      // No web_search here — pure synthesis
      messages: [{ role: 'user', content: prompt }],
    })

    let rawText = ''
    for (const block of response.content) {
      if (block.type === 'text') {
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
