export type Industry =
  | 'Video & Music Streaming'
  | 'Super Apps & On-Demand Delivery'
  | 'Social Media & Ad Platforms'
  | 'Digital Banks / Neobanks'
  | 'Remittance'
  | 'Payment Service Providers'
  | 'Fitness & Wellness'
  | 'Telecom'
  | 'E-Learning & EdTech'
  | 'Event & Travel Ticketing'
  | 'Insurance'
  | 'Theaters & Cinemas'
  | 'Payroll & HR Tech'
  | 'Dating'
  | 'iGaming & Sports Betting'
  | 'Adult Entertainment'
  | 'Crypto & Digital Assets'
  | 'Investment Platforms'
  | 'Mobility & Ridesharing'
  | 'Airlines'
  | 'Passenger Transport & Ticketing'
  | 'Hospitality & Lodging'
  | 'Travel & Online Agencies (OTAs)'
  | 'Parking'
  | 'Car Rental'
  | 'Cosmetic & Personal Care Products'
  | 'Food & Beverage'
  | 'Luxury Goods & Fashion'
  | 'Online Marketplaces'
  | 'Retail'
  | 'Network & Direct Sales'
  | 'Healthcare'
  | 'Web & Cloud Hosting'
  | 'Cybersecurity and VPNs'
  | 'AI'
  | 'Digital Products & Subscriptions'
  | 'SaaS'

export type Region = 'US' | 'LATAM' | 'APAC' | 'EMEA' | 'Global'

export type ModuleId =
  | 'company_overview'
  | 'website_traffic'
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
  additionalDomains: string[]
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

export interface StrategicInsight {
  number: number
  title: string
  detail: string
  priority: 'High' | 'Medium' | 'Low'
}

export interface SimilarCompany {
  name: string
  domain: string
  why_relevant: string
  estimated_opportunity: 'High' | 'Medium' | 'Low'
}

export interface ProspectScore {
  name: string
  domain: string
  estimated_score: number
  rationale: string
}

export interface SimilarCompanies {
  direct_competitors: SimilarCompany[]
  industry_peers: SimilarCompany[]
  prospect_scoring: ProspectScore[]
}

export interface ResearchReport {
  id?: string
  input: ResearchInput
  opportunityScore: number
  scoreBreakdown: ScoreCriterion[]
  executiveSummary: string
  modules: ModuleResult[]
  talkingPoints: string[]
  strategicInsights?: StrategicInsight[]
  similarCompanies?: SimilarCompanies
  createdAt?: string
}

export const INDUSTRIES: Industry[] = [
  'Video & Music Streaming',
  'Super Apps & On-Demand Delivery',
  'Social Media & Ad Platforms',
  'Digital Banks / Neobanks',
  'Remittance',
  'Payment Service Providers',
  'Fitness & Wellness',
  'Telecom',
  'E-Learning & EdTech',
  'Event & Travel Ticketing',
  'Insurance',
  'Theaters & Cinemas',
  'Payroll & HR Tech',
  'Dating',
  'iGaming & Sports Betting',
  'Adult Entertainment',
  'Crypto & Digital Assets',
  'Investment Platforms',
  'Mobility & Ridesharing',
  'Airlines',
  'Passenger Transport & Ticketing',
  'Hospitality & Lodging',
  'Travel & Online Agencies (OTAs)',
  'Parking',
  'Car Rental',
  'Cosmetic & Personal Care Products',
  'Food & Beverage',
  'Luxury Goods & Fashion',
  'Online Marketplaces',
  'Retail',
  'Network & Direct Sales',
  'Healthcare',
  'Web & Cloud Hosting',
  'Cybersecurity and VPNs',
  'AI',
  'Digital Products & Subscriptions',
  'SaaS',
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
  website_traffic: 'Website Traffic Analysis',
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
  'website_traffic',
  'top_markets',
  'local_entity',
  'payment_methods',
  'psp_detection',
  'complaints',
  'expansion',
  'news',
]
