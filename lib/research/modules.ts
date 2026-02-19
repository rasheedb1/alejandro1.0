import type { ModuleId, ResearchInput } from './types'

const YUNO_CONTEXT = `
You are a research analyst for Yuno (y.uno), a digital payment orchestration company. Yuno helps businesses connect to multiple PSPs (Payment Service Providers), APMs (Alternative Payment Methods), and fraud tools through a single integration.

Key value propositions of Yuno:
- Single API integration to access 100+ payment providers globally
- Smart routing between PSPs for higher approval rates and lower costs
- Instant failover if one PSP goes down (no single point of failure)
- Local payment methods (APMs) in every market through one integration
- Reduce cross-border fees by enabling local acquiring in new markets
- Unified analytics and reporting across all payment providers

The goal of this research is to identify pain points and opportunities for Yuno to help this prospect.

IMPORTANT: Always respond with ONLY a valid JSON object. No markdown, no explanation outside the JSON. The JSON must parse correctly.
`

export function getModulePrompt(moduleId: ModuleId, input: ResearchInput): string {
  const { companyName, domain, industry, region, additionalDomains } = input

  const allDomains = [domain, ...(additionalDomains ?? [])].filter(Boolean)
  const domainsNote = allDomains.length > 1
    ? `The company operates across multiple domains: ${allDomains.join(', ')}. When searching, use all of these domains to find market-specific information.`
    : `Website: ${domain}`

  const prompts: Record<ModuleId, string> = {
    company_overview: `${YUNO_CONTEXT}

Research the company "${companyName}" (${domainsNote}) in the ${industry} industry.

Search for current, accurate information about this company and return a JSON object with this exact structure:
{
  "what_they_do": "1-2 sentence description of the company's core business",
  "hq_location": "City, Country",
  "company_size": "Approximate employee count or range",
  "founded_year": "Year founded or null",
  "business_model": "B2C / B2B / Marketplace / etc.",
  "key_products": ["product1", "product2"],
  "funding": {
    "status": "Private / Public / Bootstrapped",
    "latest_round": "Series X - $XXM - MonthYear or null",
    "total_raised": "$XXM or null",
    "investors": ["investor1", "investor2"]
  },
  "recent_highlights": ["Recent growth announcement or financial result 1", "Recent announcement 2"]
}`,

    top_markets: `${YUNO_CONTEXT}

Research the top markets for "${companyName}" (${domainsNote}), especially in the ${region} region.

Search for web traffic data, revenue distribution, job postings by country, and market expansion news. Return a JSON object:
{
  "global_top_markets": [
    {"country": "Country name", "relevance": "High/Medium/Low", "evidence": "Why this market matters (traffic %, revenue mention, etc.)"}
  ],
  "target_region_markets": [
    {"country": "Country name", "relevance": "High/Medium/Low", "evidence": "Why this market matters"}
  ],
  "expanding_to": ["Country or region they seem to be entering"],
  "market_notes": "Any additional context about their market strategy"
}

List at least 5 global markets and focus especially on ${region} markets.`,

    local_entity: `${YUNO_CONTEXT}

For "${companyName}" (${domainsNote}), research whether they have legal entities or subsidiaries in each of their key markets.

A local entity means they likely use local acquiring (lower fees, higher approval rates). No local entity = likely cross-border processing (higher fees, lower approval rates) — this is a key selling point for Yuno.

Search for "{companyName} subsidiary {country}", "{companyName} office {country}", and legal entity databases. Return JSON:
{
  "entities": [
    {
      "country": "Country name",
      "has_local_entity": true,
      "entity_name": "Legal entity name if found, null otherwise",
      "processing_type": "Local acquiring" or "Cross-border (opportunity)",
      "fee_impact": "Likely paying higher cross-border fees" or "Already processing locally",
      "evidence": "How you determined this"
    }
  ],
  "cross_border_opportunity": "Summary of how many markets they're likely overpaying in and the Yuno opportunity",
  "key_insight": "The single most important finding about their entity structure"
}`,

    payment_methods: `${YUNO_CONTEXT}

Research the payment methods available at "${companyName}" (${domainsNote}) checkout for each of their key markets.

Search for:
- "${companyName} payment methods {country}"
- "${companyName} how to pay {country}"
- "${companyName} checkout {country}"
- Their help center or FAQ pages listing payment methods

Critical APMs by market that they should have:
- Brazil: Pix, Boleto
- Colombia: PSE, Nequi
- Mexico: OXXO, SPEI
- India: UPI, Paytm
- Argentina: Mercado Pago, Rapipago
- Chile: Webpay, Khipu
- Peru: PagoEfectivo
- Indonesia: GoPay, OVO, Dana
- US: Apple Pay, Google Pay, Afterpay/BNPL
- Europe: iDEAL (NL), Bancontact (BE), MB Way (PT), Bizum (ES), Klarna

Return JSON:
{
  "markets": [
    {
      "country": "Country",
      "available_methods": ["Visa", "Mastercard", "Pix", etc.],
      "missing_critical_apm": ["APM they're missing", "Another APM"],
      "opportunity_level": "High/Medium/Low",
      "notes": "Any context"
    }
  ],
  "biggest_gap": "The single most impactful missing payment method and market",
  "total_missing_apms": 0,
  "key_insight": "Summary of payment method coverage gaps"
}`,

    psp_detection: `${YUNO_CONTEXT}

Research what PSP(s) and payment providers "${companyName}" (${domainsNote}) currently uses.

Search for:
- "${companyName} payment provider"
- "${companyName} PSP"
- "${companyName} Stripe", "${companyName} Adyen", "${companyName} dLocal", "${companyName} Checkout.com", "${companyName} PayU", "${companyName} Braintree", "${companyName} Worldpay", "${companyName} Fiserv", "${companyName} Nuvei", "${companyName} Rapyd"
- "${companyName} payment orchestration", "${companyName} Spreedly", "${companyName} Primer"
- Case studies, press releases, job postings mentioning payment tech stack

Return JSON:
{
  "detected_psps": [
    {"name": "PSP name", "confidence": "High/Medium/Low", "evidence": "Where you found this"}
  ],
  "psp_count": 0,
  "has_orchestrator": false,
  "orchestrator_name": "Name if they have one, null otherwise",
  "redundancy_risk": "High (single PSP) / Medium / Low",
  "processing_scope": "Global / Regional / Local",
  "key_insight": "The most important finding about their payment stack",
  "yuno_angle": "How Yuno can specifically help based on their current setup"
}`,

    complaints: `${YUNO_CONTEXT}

Search for customer complaints about payment issues at "${companyName}" (${domainsNote}).

Search for:
- "${companyName} payment not working" site:reddit.com
- "${companyName} card declined"
- "${companyName} checkout problems"
- "${companyName} can't pay"
- "${companyName} payment failed"
- "${companyName} fraud"
- Twitter/X mentions of payment issues

Return JSON:
{
  "complaints_found": true,
  "severity": "High/Medium/Low/None",
  "complaint_themes": [
    {"theme": "Theme name (e.g. Card declines)", "frequency": "Common/Occasional/Rare", "example": "Example complaint or mention"}
  ],
  "affected_markets": ["Countries where complaints are most common"],
  "fraud_mentions": false,
  "checkout_ux_issues": false,
  "key_insight": "Summary of payment pain points and how Yuno could help",
  "outreach_angle": "Specific complaint detail that can be used in outreach"
}`,

    expansion: `${YUNO_CONTEXT}

Research "${companyName}" (${domainsNote}) expansion plans and new market entries.

Search for:
- Recent press releases about entering new countries/markets
- Job postings in new countries (especially payment-related roles)
- New product launches requiring payment infrastructure
- M&A activity or partnerships suggesting geographic expansion
- Investor presentations mentioning new markets

Return JSON:
{
  "expanding_to": [
    {"market": "Country or region", "evidence": "Job posting / press release / announcement", "timeline": "Announced timeline or 'Unknown'"}
  ],
  "payment_hires": [
    {"role": "Job title", "location": "Country", "signals": "What this role signals"}
  ],
  "recent_launches": ["New product or market launched recently"],
  "ma_activity": "Any M&A or partnerships with payment implications",
  "expansion_urgency": "High/Medium/Low",
  "key_insight": "How their expansion creates payment infrastructure needs that Yuno can solve"
}`,

    news: `${YUNO_CONTEXT}

Find the most recent and relevant news about "${companyName}" (${domainsNote}) related to payments, finance, and growth.

Search for:
- Recent funding rounds or IPO news
- Payment provider changes or integrations
- Payment outages or incidents
- Revenue or volume growth announcements
- Partnerships with payment companies
- Quarterly earnings mentioning payment costs

Return JSON:
{
  "news_items": [
    {
      "headline": "News headline",
      "date": "Month Year",
      "category": "Funding / Payment Integration / Outage / Growth / Partnership / Earnings",
      "summary": "1-2 sentence summary",
      "relevance_to_yuno": "Why this matters for a Yuno conversation"
    }
  ],
  "financial_health": "Strong / Stable / Uncertain",
  "recent_payment_events": "Summary of any payment-specific news",
  "trigger_events": ["Specific event that makes now a good time to reach out"],
  "key_insight": "The most compelling recent development for Yuno outreach"
}`
  }

  return prompts[moduleId]
}

export function getSynthesisPrompt(input: ResearchInput, modulesJson: string): string {
  return `${YUNO_CONTEXT}

Based on the following research findings about "${input.companyName}" (${input.domain}), provide a synthesis and opportunity assessment.

RESEARCH FINDINGS:
${modulesJson}

Return a JSON object with this exact structure:
{
  "opportunity_score": 7,
  "score_breakdown": [
    {"name": "Multi-market presence", "present": true, "impact": 1.5, "description": "Operates in 10+ markets across LATAM and APAC"},
    {"name": "Single PSP / no redundancy", "present": true, "impact": 1.5, "description": "Only uses Stripe globally — 100% downtime risk"},
    {"name": "Missing APMs in key markets", "present": true, "impact": 1.5, "description": "No Pix in Brazil, no OXXO in Mexico"},
    {"name": "Cross-border processing", "present": true, "impact": 1.0, "description": "Processing cross-border in 3 key markets without local entities"},
    {"name": "Customer payment complaints", "present": false, "impact": 0, "description": "No significant payment complaints found"},
    {"name": "Active expansion plans", "present": true, "impact": 1.0, "description": "Expanding to India and Southeast Asia in 2025"},
    {"name": "No payment orchestrator", "present": true, "impact": 1.0, "description": "No orchestration layer detected"},
    {"name": "Strong financial health", "present": true, "impact": 0.5, "description": "Series C funded, growing 40% YoY"}
  ],
  "executive_summary": "3-4 sentence summary of why this is or isn't a good Yuno prospect, highlighting top 2-3 findings",
  "talking_points": [
    "Specific, personalized talking point referencing a real finding",
    "Another talking point with a specific data point or observation",
    "A third talking point referencing their expansion or growth",
    "A fourth talking point about payment risk or missed revenue",
    "A fifth talking point tying it all together with a clear Yuno value prop"
  ]
}

The opportunity_score should be between 1-10 based on the sum of impact scores in score_breakdown, normalized to 10.
Each talking point must be specific, referencing actual findings — not generic. Start each with a specific observation.`
}
