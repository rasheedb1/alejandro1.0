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
    website_traffic: `${YUNO_CONTEXT}

Research web traffic, app usage, and audience analytics for "${companyName}" (${domainsNote}).

Search for:
- SimilarWeb: site:similarweb.com "${companyName}" OR "${domain}" — look for monthly visits, top countries, traffic share %, global rank
- SEMrush: "${companyName} semrush traffic by country"
- App downloads: "${companyName} app downloads" on Business of Apps (businessofapps.com), Sensor Tower, AppFollow, AppMagic
- "${companyName} monthly active users" OR "${companyName} MAU" OR "${companyName} DAU"
- "${companyName} user demographics" — age, gender breakdown
- "${companyName} traffic by country" OR "${companyName} top markets traffic"
- Any investor presentations, earnings calls, or press releases mentioning user numbers by country

For each top country, identify which local APMs are dominant there — because that tells us which payment methods ${companyName} NEEDS to support. Example: If Brazil is top 2 country, Pix is critical; if India is top 3, UPI is critical.

Return JSON:
{
  "monthly_visits_web": "~XX.XM (source: SimilarWeb/SEMrush, date)",
  "monthly_visits_trend": "Growing/Stable/Declining — YoY change if available",
  "app_downloads_total": "~XXM total downloads (source, date)",
  "app_downloads_breakdown": "US: 15%, India: 13%, etc. if available",
  "monthly_active_users": "~XX.XM MAU if found, null otherwise",
  "global_rank": "SimilarWeb global rank e.g. #131,556",
  "audience_demographics": {
    "gender": "XX% male, XX% female (source)",
    "largest_age_group": "25-34 (source)",
    "notes": "Any other demographic insight"
  },
  "top_countries": [
    {
      "country": "United States",
      "est_traffic_share": "35%",
      "signal": "High/Medium/Low",
      "critical_local_apms": "Apple Pay, Google Pay, Afterpay/BNPL",
      "notes": "Specific evidence: e.g. '35% of web traffic per SimilarWeb Jan 2025'"
    }
  ],
  "key_observations": [
    "High-priority markets for local APM coverage based on traffic: India (UPI — 80% of digital transactions), Brazil (Pix — dominant), Mexico (OXXO — 50% of cash transactions)",
    "Any other traffic insight relevant to payment localization"
  ],
  "data_sources": ["SimilarWeb", "Business of Apps", "etc. — list actual sources used"],
  "key_insight": "The single most important traffic finding for Yuno's pitch — which high-traffic markets are underserved by local payment methods?"
}

List at least 8-10 top countries with traffic signals. Focus on markets where local APM gaps would translate to real conversion losses.`,

    company_overview: `${YUNO_CONTEXT}

Research the company "${companyName}" (${domainsNote}) in the ${industry} industry.

Search for:
- Official company website, LinkedIn, Crunchbase, PitchBook
- Recent press releases, TechCrunch, Bloomberg, Reuters, local business media
- CEO/founder public statements about company scale and growth
- App store downloads, active user counts, GMV/revenue figures if public

Return a JSON object with this exact structure:
{
  "what_they_do": "2-3 sentence description of the company's core business, business model, and why customers use it",
  "hq_location": "City, Country",
  "company_size": "Approximate employee count or range (source it if possible, e.g. 'LinkedIn: 5,000-10,000')",
  "founded_year": "Year founded or null",
  "business_model": "B2C / B2B / Marketplace / Super App / etc.",
  "key_products": ["product1", "product2"],
  "scale_metrics": "Any available scale data: active users, GMV, downloads, transactions per day, cities, countries",
  "funding": {
    "status": "Private / Public / Bootstrapped / Unicorn",
    "latest_round": "Series X - $XXM - MonthYear or null",
    "total_raised": "$XXM or null",
    "investors": ["investor1", "investor2"]
  },
  "recent_highlights": [
    "Specific recent announcement with date and dollar amount or metric (e.g. 'Sep 2025 — Amazon invested $25M convertible note, warrants for up to 12% ownership')",
    "Another specific announcement with date"
  ]
}`,

    top_markets: `${YUNO_CONTEXT}

Research the top markets for "${companyName}" (${domainsNote}), especially in the ${region} region.

Search for:
- SimilarWeb or Semrush traffic data by country
- "${companyName} revenue by country" OR "${companyName} largest market"
- "${companyName} market share {country}" — find actual % if possible
- Job postings by country on LinkedIn (signals where they're investing)
- Press releases about entering or exiting markets

For each market, try to find SPECIFIC evidence: traffic %, revenue %, user count, market share %, or a named source (press release, earnings call, etc.). Vague guesses are less useful than specific data points.

Return a JSON object:
{
  "global_top_markets": [
    {
      "country": "Country name",
      "relevance": "High/Medium/Low",
      "evidence": "Specific evidence: e.g. '33M app downloads (Dec 2022), largest market by MAU as of Jan 2025' or 'Overtook Colombia in revenue by 2023'"
    }
  ],
  "target_region_markets": [
    {
      "country": "Country name",
      "relevance": "High/Medium/Low",
      "evidence": "Specific evidence with source"
    }
  ],
  "expanding_to": [
    "Country or region — source/evidence of expansion (e.g. 'CEO confirmed Central America expansion at Reuters summit, 2025')"
  ],
  "market_notes": "Summary of market strategy including any confirmed market share numbers, competitive dynamics, or geographic focus"
}

List at least 5-7 global markets and focus especially on ${region} markets. Include competitor market share comparisons where available.`,

    local_entity: `${YUNO_CONTEXT}

For "${companyName}" (${domainsNote}), research whether they have legal entities or subsidiaries in each of their key markets.

A local entity means they likely use local acquiring (lower fees, higher approval rates). No local entity = likely cross-border processing (higher fees, lower approval rates) — this is a key selling point for Yuno.

For each market, search:
- "${companyName} {country} legal entity" or "${companyName} {country} subsidiary"
- "${companyName} {country} office" or "${companyName} registered company {country}"
- Their legal terms/T&C pages per country (e.g. rappi.com/legal, terms.{domain}/country) — these often reveal registered entity names and tax IDs
- Local business registries: CNPJ (Brazil), RFC (Mexico), RUT (Chile), CUIT (Argentina), NIT (Colombia), RUC (Peru/Ecuador)
- Dun & Bradstreet, EMIS, Crunchbase for subsidiary listings

Return JSON — be specific about entity names and registration numbers when found. Include BOTH the detailed entity list AND the cross-border gap summary table:
{
  "entities": [
    {
      "country": "Country name",
      "has_local_entity": true,
      "entity_name": "Legal entity name e.g. 'Rappi Brasil Intermediação de Negócios Ltda.' or null if not found",
      "registration_id": "e.g. CNPJ 26.900.161/0001-25 or RFC TRA150604TW1 or null",
      "processing_type": "Local acquiring",
      "fee_impact": "Already processing locally — local entity confirmed",
      "evidence": "Specific source: e.g. 'Confirmed via Rappi Brazilian legal terms page (CNPJ 26.900.161/0001-25), São Paulo office confirmed'"
    },
    {
      "country": "Country name",
      "has_local_entity": false,
      "entity_name": null,
      "registration_id": null,
      "processing_type": "Cross-border (opportunity)",
      "fee_impact": "Likely paying higher cross-border fees — no local entity found",
      "evidence": "What you searched and why no entity was found"
    }
  ],
  "cross_border_gap_table": [
    {
      "market": "Brazil",
      "traffic_signal": "High/Medium/Low — from web traffic data if known",
      "has_local_entity": true,
      "entity_summary": "Rappi Brasil Ltda (CNPJ: 26.900.161/0001-25) — confirmed",
      "crossborder_probability": "Low",
      "crossborder_fee_risk": "Low — local entity confirmed, likely local acquiring",
      "yuno_opportunity": "APM coverage gaps (Boleto not confirmed), not cross-border fees"
    },
    {
      "market": "Uruguay",
      "traffic_signal": "Low",
      "has_local_entity": false,
      "entity_summary": "No entity found — only 2 cities (Montevideo, Punta del Este)",
      "crossborder_probability": "High",
      "crossborder_fee_risk": "High — likely paying 2-4% extra cross-border processing fees from Colombia hub",
      "yuno_opportunity": "Enable local acquiring via Yuno's local PSP network in Uruguay"
    }
  ],
  "cross_border_opportunity": "Summary: X of their Y key markets have no confirmed local entity. In those markets they are likely processing cross-border, paying 2-4% extra in fees. Specific Yuno opportunity: ...",
  "key_insight": "The single most important finding about their entity structure for a Yuno pitch"
}`,

    payment_methods: `${YUNO_CONTEXT}

Research the payment methods available at "${companyName}" (${domainsNote}) checkout for each of their key markets.

Search for:
- "${companyName} payment methods" or "${companyName} how to pay" (include country name variants)
- "${companyName} {country} checkout" — look for screenshots, help center pages, FAQs
- "${companyName} accepts {specific APM}" — e.g. "${companyName} accepts Pix", "${companyName} OXXO"
- The company's own help center, FAQ, or support pages listing accepted payment methods
- App store screenshots or reviews mentioning payment method issues

CRITICAL APMs by market — each one below has a market context you should reference:
- Brazil: Pix (instant transfer, dominant — 80%+ of digital transactions), Boleto Bancário (~25% market share, unbanked users)
- Colombia: PSE (main bank transfer rail), Nequi (largest digital wallet by users), Daviplata, Efecty (major cash network)
- Mexico: OXXO Pay (50% of all cash-based digital transactions, 20,000+ locations), SPEI (instant bank transfer), CoDi
- Argentina: Mercado Pago (dominant digital wallet), Rapipago (cash payment network), MODO (interbank digital wallet)
- Chile: Webpay/Transbank (74% market share of online bank transfers), Khipu (16% market share)
- Peru: PagoEfectivo (~19% of online transactions, ~$4.75B TPV), Yape (54% of in-person digital transactions), PLIN (34%)
- Uruguay: Redpagos, Abitab (major cash networks), OCA (local card network)
- Ecuador: De Una (central bank instant payment, 2023), Payphone, SafetyPay
- Costa Rica: SINPE Móvil (dominant instant payment, operated by central bank)
- India: UPI (dominant, 80%+ of digital transactions), Paytm wallet
- Indonesia: GoPay, OVO, Dana (top 3 digital wallets)
- US: Apple Pay, Google Pay, Buy Now Pay Later (Afterpay/Klarna)
- Europe: iDEAL (Netherlands), Bancontact (Belgium), MB Way (Portugal), Bizum (Spain), Klarna (Nordics)
- Southeast Asia: GCash (Philippines), PromptPay (Thailand), PayNow (Singapore), Touch 'n Go (Malaysia)

Return JSON with specific evidence for each market — "not confirmed" is different from "confirmed missing":
{
  "markets": [
    {
      "country": "Country",
      "available_methods": ["Visa", "Mastercard", "Pix"],
      "how_confirmed": "Source of confirmation (e.g. 'Official help center page', 'App screenshot in review', 'Press release')",
      "missing_critical_apm": [
        "OXXO Pay (50% of cash-based digital transactions in Mexico — explicitly stated on their own support page as NOT accepted)"
      ],
      "opportunity_level": "High/Medium/Low",
      "notes": "Specific context e.g. 'Their support page explicitly says OXXO is not supported. Only accepts 7-Eleven and Farmapronto for cash.'"
    }
  ],
  "biggest_gap": "The single most impactful missing APM — name the method, country, market share %, and the specific evidence of the gap",
  "total_missing_apms": 0,
  "key_insight": "Narrative of payment coverage gaps across markets — which markets have the most critical gaps and why it matters for conversion"
}`,

    psp_detection: `${YUNO_CONTEXT}

Research what PSPs (Payment Service Providers) and payment providers "${companyName}" (${domainsNote}) currently uses across all their markets.

Search for:
- "${companyName} payment provider" or "${companyName} PSP"
- "${companyName} Stripe", "${companyName} Adyen", "${companyName} Checkout.com", "${companyName} Braintree"
- "${companyName} dLocal", "${companyName} Nuvei", "${companyName} PayU", "${companyName} Kushki", "${companyName} Conekta"
- "${companyName} Worldpay", "${companyName} Fiserv", "${companyName} Elavon", "${companyName} Rapyd", "${companyName} AstroPay"
- "${companyName} SafetyPay", "${companyName} PayRetailers", "${companyName} Mercado Pago"

SEARCH FOR ORCHESTRATORS EXPLICITLY:
- "${companyName} Yuno" or "${companyName} y.uno" — check y.uno/success-cases for any case study
- "${companyName} Spreedly" — Spreedly publishes case studies at spreedly.com/customers/
- "${companyName} Primer" — check primer.io for case studies
- "${companyName} payment orchestration"
- "${companyName} Payrix", "${companyName} Paymentspring"

Also search:
- Case studies and press releases on PSP websites mentioning ${companyName}
- Job postings for payment/fintech roles (reveal their tech stack)
- "${companyName} PSP" in tech blogs, Money20/20, Fintech Futures, Pymnts.com
- Bank statement transaction descriptors that reveal which processor was used

Return JSON:
{
  "detected_psps": [
    {
      "name": "PSP or provider name",
      "type": "PSP / APM / Orchestrator / Banking Partner / Card Network",
      "confidence": "High/Medium/Low",
      "evidence": "Exact source — e.g. 'Official dLocal press release Feb 2022 confirming expanded partnership across 6 markets' or 'Adyen listed Rappi as customer in H1 2021 earnings press release'"
    }
  ],
  "psp_count": 0,
  "has_orchestrator": false,
  "orchestrator_name": "Name and details if they have one, null otherwise",
  "yuno_existing_relationship": false,
  "yuno_relationship_details": "If Yuno is detected: describe the relationship, when it started, what was achieved. If not detected: null",
  "redundancy_risk": "High (single PSP, 100% downtime risk) / Medium / Low",
  "processing_scope": "Global / Regional (specify) / Local only",
  "key_insight": "The most important finding about their payment stack — single PSP risk? existing orchestrator? fragmented multi-PSP with no unification?",
  "yuno_angle": "Specific pitch based on their current setup — if they already use Yuno, focus on expansion; if they use Spreedly/Primer, focus on switching; if single PSP, focus on redundancy"
}`,

    complaints: `${YUNO_CONTEXT}

Search for customer complaints about payment issues at "${companyName}" (${domainsNote}).

Search across ALL of these sources:
- Reddit: "${companyName} payment not working" site:reddit.com
- Reddit: "${companyName} card declined" site:reddit.com
- Trustpilot: "${companyName}" site:trustpilot.com (look for payment-related reviews)
- PissedConsumer: "${companyName}" site:pissedconsumer.com
- Google Play / App Store reviews mentioning payment issues (search "${companyName} payment error google play" or look for review aggregators)
- Twitter/X: "${companyName} payment failed" OR "${companyName} card declined"
- JustAnswer, Quora, or support forums
- "${companyName} card declined"
- "${companyName} checkout problems"
- "${companyName} payment fraud"
- "${companyName} unauthorized charge"
- "${companyName} chargeback"
- News articles about payment outages or customer refund issues

Look for SPECIFIC, quotable complaint examples with details about:
- What payment method failed
- Which market / country it happened in
- What the customer said exactly (quote if possible)
- How Rappi/the company responded (or didn't)

Return JSON:
{
  "complaints_found": true,
  "severity": "High/Medium/Low/None",
  "complaint_themes": [
    {
      "theme": "Theme name (e.g. 'Card declines at checkout')",
      "frequency": "Common/Occasional/Rare",
      "example": "Specific real complaint with detail — quote or paraphrase, source, and country/market if known"
    }
  ],
  "affected_markets": ["Countries where complaints are most common"],
  "fraud_mentions": false,
  "checkout_ux_issues": false,
  "support_quality": "Description of their customer support quality based on review data — response rate, resolution rate if known",
  "key_insight": "Summary of payment pain points and how Yuno's smart routing / failover could directly address the root cause",
  "outreach_angle": "The single most specific, quotable complaint or data point that could open a conversation — e.g. a founder quote, a review stat, a specific outage"
}`,

    expansion: `${YUNO_CONTEXT}

Research "${companyName}" (${domainsNote}) expansion plans and new market entries.

Search for:
- "${companyName} new market" OR "${companyName} expansion {year}" (use current year 2025/2026)
- "${companyName} entering {country}" or CEO/founder interviews about new markets
- LinkedIn job postings in NEW countries not in their current footprint — especially fintech/payment roles
- "${companyName} {country} launch" press releases
- M&A activity: acquisitions, strategic investments, or partnerships that imply geographic expansion
- Investor presentations or earnings calls mentioning new markets
- "${companyName} IPO" — if IPO-bound, payment efficiency before listing is critical

For payment hires specifically search:
- LinkedIn for "${companyName} payments manager", "${companyName} payment operations", "${companyName} fraud analyst"
- What level of hire (analyst vs. VP vs. C-suite) — C-suite signals strategic shift
- What the hire signals: e.g. CFO hire = IPO prep, Head of Payments = payment infrastructure buildout

Return JSON:
{
  "expanding_to": [
    {
      "market": "Country or region",
      "evidence": "Specific evidence — CEO quote from article, press release, job posting location",
      "timeline": "Confirmed date / 'H1 2026' / 'Unknown'"
    }
  ],
  "payment_hires": [
    {
      "role": "Exact job title",
      "level": "C-suite / Director / Manager / Analyst",
      "location": "Country",
      "signals": "What this hire signals about their payment strategy — e.g. 'Director-level fraud hire in Mexico City signals RappiPay scaling rapidly'"
    }
  ],
  "recent_launches": [
    "Specific product/market launch with date and detail — e.g. 'Nov 2025: Amazon Now launched in 10 Mexican cities with Rappi, 5,000+ products in under 15 min'"
  ],
  "ma_activity": "Any M&A or partnerships with payment implications — name the deal, amount, date, and what it means for payment infrastructure",
  "expansion_urgency": "High/Medium/Low",
  "key_insight": "How their specific expansion plans create payment infrastructure needs that only an orchestration layer like Yuno can solve at scale"
}`,

    news: `${YUNO_CONTEXT}

Find the most recent and relevant news about "${companyName}" (${domainsNote}) related to payments, finance, and growth.

Search for news from the last 18 months specifically:
- Recent funding rounds, debt financing, or IPO news
- Payment provider changes, integrations, or PSP partnerships
- Payment outages or incidents that hit the press
- Revenue, GMV, or transaction volume growth announcements
- Partnerships with payment companies (press releases on both sides)
- Quarterly earnings or investor calls mentioning payment costs or approval rates
- C-suite hires that signal payment or fintech strategy changes
- "${companyName} fintech", "${companyName} payment news" in Pymnts, Fintech Futures, The Paypers, Reuters, Bloomberg

For each news item, include the SPECIFIC DATE (month + year) and a named source (outlet name or URL). Avoid vague dates like "recently."

Return JSON:
{
  "news_items": [
    {
      "headline": "Exact or paraphrased headline",
      "date": "Month Year (e.g. 'September 2025')",
      "source": "Publication name (e.g. Reuters, TechCrunch, Pymnts)",
      "category": "Funding / Debt Financing / Payment Integration / PSP Partnership / Outage / Growth / IPO / Executive Hire / M&A",
      "summary": "2-3 sentence summary of what happened and why it matters",
      "relevance_to_yuno": "Specific reason this creates a Yuno conversation opportunity — e.g. 'New CFO hired to prep IPO — will scrutinize payment costs and approval rates'"
    }
  ],
  "financial_health": "Strong / Stable / Uncertain — brief rationale",
  "recent_payment_events": "Narrative summary of payment-specific news in the last 12-18 months",
  "trigger_events": [
    "Specific event that makes NOW a good time to reach out — be concrete, e.g. 'CFO Tiago Azevedo hired April 2024 to lead IPO prep — payment cost optimization is top of mind'"
  ],
  "key_insight": "The single most compelling recent development for Yuno outreach — the hook that would make a VP of Payments take the call"
}`
  }

  return prompts[moduleId]
}

export function getSynthesisPrompt(input: ResearchInput, modulesJson: string): string {
  return `${YUNO_CONTEXT}

Based on the following research findings about "${input.companyName}" (${input.domain}), provide a synthesis and opportunity assessment for the Yuno SDR team.

RESEARCH FINDINGS:
${modulesJson}

Return a JSON object with this exact structure:
{
  "opportunity_score": 7,
  "score_breakdown": [
    {"name": "Multi-market presence", "present": true, "impact": 1.5, "description": "Be specific: e.g. 'Operates in 9 LATAM countries across 400+ cities with 35M+ active users'"},
    {"name": "Single PSP / high redundancy risk", "present": true, "impact": 1.5, "description": "Be specific: e.g. 'Only confirmed PSP is Stripe globally — any outage = 100% downtime with no failover'"},
    {"name": "Missing APMs in key markets", "present": true, "impact": 1.5, "description": "Be specific: e.g. '16 critical APM gaps — no OXXO Pay in Mexico (50% of cash transactions), no Webpay in Chile (74% bank transfer share)'"},
    {"name": "Cross-border processing in key markets", "present": true, "impact": 1.0, "description": "Be specific: e.g. 'No confirmed local entity in Uruguay and Ecuador — likely processing cross-border from Colombia hub'"},
    {"name": "Customer payment complaints", "present": true, "impact": 1.0, "description": "Be specific: e.g. 'High severity — card declines, ghost charges, and checkout abandonment documented across Trustpilot, Reddit, and Google Play'"},
    {"name": "Active expansion plans", "present": true, "impact": 1.0, "description": "Be specific: e.g. 'CEO confirmed Central America expansion 2025-2026; $100M credit line earmarked for Mexico growth'"},
    {"name": "No payment orchestrator", "present": true, "impact": 1.0, "description": "Be specific: e.g. 'No orchestration layer detected — manually managing 3 PSPs per market with no unified routing or failover'"},
    {"name": "Strong financial health / IPO track", "present": true, "impact": 0.5, "description": "Be specific: e.g. 'Series C funded ($180M), profitable 2 quarters, IPO exploratory per CEO interview Q3 2025'"}
  ],
  "executive_summary": "3-4 sentence summary that immediately establishes: (1) what makes this prospect unique or complex as a payment environment, (2) the single most important Yuno opportunity, (3) the urgency or trigger event. Do NOT use generic language. Reference specific findings from the research — numbers, company names, events.",
  "talking_points": [
    "TALKING POINT INSTRUCTIONS — Replace this with 5 real talking points. Each talking point must: (1) Open with a SPECIFIC named finding from the research — a quote, a statistic, an event, an executive hire, a product launch, or a competitor data point. (2) Connect that finding to a specific business impact (lost revenue, conversion drag, competitive pressure, investor scrutiny). (3) Close with the specific Yuno value prop that solves this exact problem. (4) Be 3-5 sentences long, not a one-liner. (5) Never use generic language like 'you might benefit from' — be direct and specific.",
    "Example format: '[Company] explicitly confirmed on their [country] support page that [specific APM] is NOT accepted — a method that accounts for [X]% of [country]'s [digital/cash] transactions. In a market where [Company] competes directly with [Competitor] ([market share]% vs [market share]% MAU), leaving [specific APM] uncovered translates directly into checkout abandonment for [millions of / the X% of] users who prefer or depend on [cash/instant transfer/wallet]. Yuno can close this gap through a single API call — no new engineering sprint required from [Company]'s dev team.'",
    "Second talking point — focus on PSP risk / redundancy if relevant, or biggest APM gap",
    "Third talking point — focus on expansion: specific new market entry and the payment infrastructure need it creates",
    "Fourth talking point — focus on financial pressure: IPO prep, CFO hire, investor scrutiny on approval rates or processing costs",
    "Fifth talking point — tie it together: the compounding nature of their payment complexity and why Yuno's orchestration layer is the right-size solution"
  ],
  "strategic_insights": [
    {
      "number": 1,
      "title": "Short title for this insight (e.g. 'APM Coverage Gap in Brazil')",
      "detail": "2-4 sentence detailed explanation of the specific opportunity for Yuno. Reference exact data points from the research. Explain the business impact, the root cause, and HOW Yuno solves it specifically for this company. Be strategic and specific — this is for a deeper discovery conversation, not cold outreach.",
      "priority": "High"
    },
    {
      "number": 2,
      "title": "Second strategic insight title",
      "detail": "Detailed explanation...",
      "priority": "High"
    },
    {
      "number": 3,
      "title": "Third strategic insight title",
      "detail": "Detailed explanation...",
      "priority": "Medium"
    },
    {
      "number": 4,
      "title": "Fourth strategic insight title",
      "detail": "Detailed explanation...",
      "priority": "Medium"
    },
    {
      "number": 5,
      "title": "Fifth strategic insight title",
      "detail": "Detailed explanation...",
      "priority": "Low"
    }
  ],
  "similar_companies": {
    "direct_competitors": [
      {
        "name": "Competitor company name",
        "domain": "competitor.com",
        "why_relevant": "Direct competitor in same vertical and markets — likely has same payment challenges. If we win them, we can use as a reference.",
        "estimated_opportunity": "High"
      }
    ],
    "industry_peers": [
      {
        "name": "Peer company name",
        "domain": "peer.com",
        "why_relevant": "Same industry, similar payment complexity — multi-market, multi-PSP, same APM gaps likely apply",
        "estimated_opportunity": "Medium"
      }
    ],
    "prospect_scoring": [
      {
        "name": "Company name",
        "domain": "company.com",
        "estimated_score": 8,
        "rationale": "Brief rationale for score — why this competitor/peer is a strong Yuno prospect"
      }
    ]
  }
}

CRITICAL RULES for talking points:
- Every talking point must reference AT LEAST ONE specific data point from the research (%, $, named executive, named APM, named PSP, named country, specific date)
- If the research found an EXISTING Yuno relationship, talking points should focus on EXPANSION and DEEPENING the relationship, not acquisition
- If no orchestrator was detected, the talking points should emphasize operational risk
- If an IPO or fundraise was found, at least one talking point must reference investor scrutiny on payment metrics
- Each talking point should be usable as a verbatim opening line in a cold outreach email or call

The opportunity_score should be between 1-10. Sum the "impact" values of criteria where "present": true, then normalize to a 10-point scale based on the maximum possible score (7.5 = 10/10).

For strategic_insights: These should be DIFFERENT from talking_points. Talking points are short hooks for cold outreach. Strategic insights are deeper, more analytical explanations for discovery calls — explain the root cause, the business impact with numbers, and the specific Yuno solution architecture that addresses it. Think "what would a payment consultant say in a 30-minute discovery call."

For similar_companies: Based on what you know about the research company's industry, geography, and payment complexity, identify 3-5 direct competitors and 3-5 industry peers who likely face the same payment challenges. These become a prospecting list for the SDR. Score each one 1-10 based on likely Yuno fit (multi-market = +2, no orchestrator = +2, many APM gaps = +2, active expansion = +2, strong financials = +2).`
}
