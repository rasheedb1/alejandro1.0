import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getModulePrompt } from '@/lib/research/modules'
import type { ModuleId, ResearchInput } from '@/lib/research/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { moduleId, input }: { moduleId: ModuleId; input: ResearchInput } = body

    if (!moduleId || !input) {
      return NextResponse.json({ error: 'Missing moduleId or input' }, { status: 400 })
    }

    const prompt = getModulePrompt(moduleId, input)

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    // Extract text content from the response
    let rawText = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        rawText += block.text
      }
    }

    // Parse JSON from the response
    // Claude may wrap JSON in markdown code blocks
    let data: Record<string, unknown> = {}
    try {
      // Try to extract JSON from markdown code block first
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        data = JSON.parse(jsonMatch[1].trim())
      } else {
        // Try direct parse
        data = JSON.parse(rawText.trim())
      }
    } catch {
      // If JSON parsing fails, return raw text in a structured way
      data = { raw_text: rawText, parse_error: true }
    }

    return NextResponse.json({ moduleId, data, rawText })
  } catch (err) {
    console.error('Research module error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
