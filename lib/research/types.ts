export type Industry =
  | 'Retail/Ecommerce'
  | 'Travel/OTAs'
  | 'Gaming/Gambling'
  | 'SaaS'
  | 'Ticketing'
  | 'Food & Drinks'
  | 'Healthcare'
  | 'Hospitality/Hotels'
  | 'Cosmetics'
  | 'Fintech'
  | 'Marketplaces'
  | 'Social Media'
  | 'Streaming'
  | 'Other'

export type Region = 'US' | 'LATAM' | 'APAC' | 'EMEA' | 'Global'

export type ModuleId =
  | 'company_overview'
  | 'top_markets'
  | 'local_entity'
  | 'payment_methods'
  | 'psp_detection'
  | 'complaints'
  | 'expansion'
  | 'news'

export type ModuleStatus = 'pending' | 'loading' | 'done' | 'error'

export interface ResearchInput {
  companyName: string
  domain: string
  region: Region
  industry: Industry
  sdrName: string
}

export interface ModuleResult {
  moduleId: ModuleId
  title: string
  status: ModuleStatus
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>
  error?: string
}

export interface ScoreCriterion {
  name: string
  present: boolean
  impact: number
  description: string
}

export interface ResearchReport {
  id?: string
  input: ResearchInput
  opportunityScore: number
  scoreBreakdown: ScoreCriterion[]
  executiveSummary: string
  modules: ModuleResult[]
  talkingPoints: string[]
  createdAt?: string
}

export const INDUSTRIES: Industry[] = [
  'Retail/Ecommerce',
  'Travel/OTAs',
  'Gaming/Gambling',
  'SaaS',
  'Ticketing',
  'Food & Drinks',
  'Healthcare',
  'Hospitality/Hotels',
  'Cosmetics',
  'Fintech',
  'Marketplaces',
  'Social Media',
  'Streaming',
  'Other',
]

export const REGIONS: Region[] = ['US', 'LATAM', 'APAC', 'EMEA', 'Global']

export const SDR_TEAM = [
  { name: 'German Tatis', region: 'US' },
  { name: 'Samuel Carreño', region: 'US' },
  { name: 'Mariana Ojeda', region: 'LATAM' },
  { name: 'Alejandro Bernal', region: 'LATAM' },
  { name: 'Partha Aakash Cheepur', region: 'APAC' },
  { name: 'Kaiye Xiong', region: 'APAC' },
  { name: 'Yamin Lahmeur', region: 'EMEA' },
  { name: 'Magdalena Torrealba', region: 'Inbound' },
]

export const MODULE_TITLES: Record<ModuleId, string> = {
  company_overview: 'Company Overview',
  top_markets: 'Top Markets Analysis',
  local_entity: 'Local Entity & Cross-Border Analysis',
  payment_methods: 'Checkout & Payment Methods',
  psp_detection: 'PSP / Payment Provider Detection',
  complaints: 'Customer Complaints & Payment Issues',
  expansion: 'Expansion Plans',
  news: 'Latest Payment & Financial News',
}

export const MODULE_ORDER: ModuleId[] = [
  'company_overview',
  'top_markets',
  'local_entity',
  'payment_methods',
  'psp_detection',
  'complaints',
  'expansion',
  'news',
]
