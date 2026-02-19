import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { companyName, domain }: { companyName: string; domain: string } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const prompt = `You are a domain researcher. Your task is to find all the country-specific and regional domains that the company "${companyName}" operates under, in addition to the domain "${domain}" that was already provided.

Use web search to find all active domains for "${companyName}". Look for:
- Country-specific TLDs (e.g., rappi.com.br, rappi.com.mx, rappi.com.co, rappi.pe, rappi.cl)
- Regional variants (e.g., .com.ar, .com.pe, .co, .cl, .mx, etc.)
- Other top-level domains the company uses (e.g., .io, .co, .net if they redirect to the main product)

Important rules:
- Do NOT include "${domain}" in the results (it was already provided)
- Only include domains that are actually active/real for this company
- Focus on e-commerce/product domains, not just social media or press domains
- Do NOT include CDN, tracking, or infrastructure domains (e.g., no cdn.rappi.com, analytics.rappi.com)

Respond with ONLY a valid JSON object in this exact format:
{
  "domains": ["domain1.com", "domain2.com.br", "domain3.co"]
}

If no additional domains are found, return: {"domains": []}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
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

    let domains: string[] = []
    try {
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawText.trim()
      const parsed = JSON.parse(jsonStr)
      domains = Array.isArray(parsed.domains) ? parsed.domains : []
    } catch {
      domains = []
    }

    // Filter out the original domain and any duplicates
    domains = domains.filter(
      (d: string) => d && d !== domain && !d.includes(' ')
    )

    return NextResponse.json({ domains })
  } catch (err) {
    console.error('Domain discovery error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
