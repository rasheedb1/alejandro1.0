import { NextResponse } from 'next/server'
import { saveReport } from '@/lib/research/supabase'
import type { ResearchReport } from '@/lib/research/types'

export async function POST(req: Request) {
  try {
    const report: ResearchReport = await req.json()
    const saved = await saveReport(report)
    return NextResponse.json({ success: true, id: saved.id })
  } catch (err) {
    console.error('Save report error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
