import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { ResearchReport } from './types'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) throw new Error('Supabase env vars not configured')
    _client = createClient(url, key)
  }
  return _client
}

export interface SavedReport {
  id: string
  company_name: string
  domain: string
  industry: string
  region: string
  sdr_name: string
  opportunity_score: number
  executive_summary: string
  full_report: ResearchReport
  talking_points: string[]
  created_at: string
  updated_at: string
}

export async function saveReport(report: ResearchReport): Promise<SavedReport> {
  const { data, error } = await getClient()
    .from('account_research')
    .insert({
      company_name: report.input.companyName,
      domain: report.input.domain,
      industry: report.input.industry,
      region: report.input.region,
      sdr_name: report.input.sdrName,
      opportunity_score: report.opportunityScore,
      executive_summary: report.executiveSummary,
      full_report: report,
      talking_points: report.talkingPoints,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as SavedReport
}

export async function listReports(): Promise<SavedReport[]> {
  const { data, error } = await getClient()
    .from('account_research')
    .select('id, company_name, domain, industry, region, sdr_name, opportunity_score, executive_summary, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data as SavedReport[]
}

export async function getReport(id: string): Promise<SavedReport> {
  const { data, error } = await getClient()
    .from('account_research')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as SavedReport
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await getClient()
    .from('account_research')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
