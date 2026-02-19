import type { ModuleId, ResearchInput } from './types'

const FIRECRAWL_API = 'https://api.firecrawl.dev/v1/scrape'
const MAX_CHARS_PER_PAGE = 3000
const SCRAPE_TIMEOUT_MS = 12000

// Scrape a single URL and return its markdown content, or null on failure
async function scrapeUrl(url: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(FIRECRAWL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 1000,
      }),
      signal: AbortSignal.timeout(SCRAPE_TIMEOUT_MS),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content: string = data?.data?.markdown ?? ''
    return content.length > 20 ? content.slice(0, MAX_CHARS_PER_PAGE) : null
  } catch {
    return null
  }
}

// Scrape multiple URLs in parallel and return a map of url → content
export async function scrapeUrls(
  urls: string[],
  apiKey: string
): Promise<Record<string, string>> {
  const results = await Promise.all(
    urls.map(async (url) => ({ url, content: await scrapeUrl(url, apiKey) }))
  )
  const map: Record<string, string> = {}
  for (const { url, content } of results) {
    if (content) map[url] = content
  }
  return map
}

// Returns the most valuable URLs to scrape for each module
export function getScrapeTargets(moduleId: ModuleId, input: ResearchInput): string[] {
  const { domain, companyName, additionalDomains } = input
  const allDomains = [domain, ...(additionalDomains ?? [])].filter(Boolean)
  const primary = allDomains[0]

  // Company name → URL slug: "Mercado Libre" → "mercado-libre"
  const slug = companyName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  // Root domain without TLD: "rappi.co" → "rappi", "mercadolibre.com" → "mercadolibre"
  const rootName = primary.replace(/^www\./, '').split('.')[0]

  switch (moduleId) {
    case 'payment_methods':
      // Scrape the company's help center / payment FAQ pages directly
      return [
        `https://${primary}/help`,
        `https://${primary}/support`,
        `https://${primary}/payment-methods`,
        `https://${primary}/faq`,
        `https://${primary}/help/payment`,
        `https://${primary}/how-to-pay`,
      ]

    case 'psp_detection':
      // Scrape PSP and orchestrator case study pages for this company
      return [
        `https://y.uno/success-cases/${slug}`,
        `https://spreedly.com/customers/${slug}`,
        `https://nuvei.com/posts/${slug}`,
        `https://dlocal.com/resources/${slug}`,
        `https://www.adyen.com/customers/${slug}`,
      ]

    case 'local_entity':
      // Legal/terms pages per domain (often have registered entity names + tax IDs)
      return [
        `https://${primary}/legal`,
        `https://${primary}/terms`,
        `https://${primary}/terms-and-conditions`,
        `https://${primary}/privacy`,
        // Also scrape additional country domains' legal pages
        ...allDomains.slice(1, 3).map((d) => `https://${d}/legal`),
        ...allDomains.slice(1, 3).map((d) => `https://${d}/terms`),
      ]

    case 'complaints':
      // Trustpilot and PissedConsumer for real user reviews
      return [
        `https://www.trustpilot.com/review/${rootName}.com`,
        `https://www.trustpilot.com/review/${primary}`,
        `https://${rootName}.pissedconsumer.com/review.html`,
      ]

    case 'company_overview':
      // About page + press/media kit for accurate facts
      return [
        `https://${primary}/about`,
        `https://${primary}/about-us`,
        `https://${primary}/company`,
        `https://${primary}/press`,
      ]

    case 'expansion':
    case 'news':
      // Blog + press + newsroom for latest announcements
      return [
        `https://${primary}/blog`,
        `https://${primary}/newsroom`,
        `https://${primary}/press`,
        `https://${primary}/news`,
        `https://${primary}/press-releases`,
      ]

    case 'website_traffic':
      // SimilarWeb profile + Business of Apps for traffic data and app download stats
      return [
        `https://www.similarweb.com/website/${primary}/`,
        `https://www.businessofapps.com/data/${slug}/`,
        `https://appfollow.io/apps/${rootName}`,
        `https://${primary}/press`,
      ]

    case 'top_markets':
      // Careers page reveals countries where they're actively hiring
      return [
        `https://${primary}/careers`,
        `https://${primary}/jobs`,
        `https://${primary}/about`,
      ]

    default:
      return []
  }
}

// Format scraped pages as a context block to prepend to Claude prompts
export function formatScrapedContext(
  scrapedPages: Record<string, string>,
  companyName: string
): string {
  const entries = Object.entries(scrapedPages)
  if (entries.length === 0) return ''

  const sections = entries
    .map(([url, content]) => `--- Scraped from: ${url} ---\n${content}`)
    .join('\n\n')

  return `
SCRAPED WEB CONTENT (direct from actual pages — treat as PRIMARY SOURCE, more reliable than search results):
The following content was scraped in real-time from ${companyName}'s actual web pages and from relevant third-party sites (PSP case studies, review platforms). Use this data first when filling in your JSON response, then use web search to fill any remaining gaps.

${sections}

--- END OF SCRAPED CONTENT ---
`
}
