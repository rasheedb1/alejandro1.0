import { NextResponse } from 'next/server'
import { listReports } from '@/lib/research/supabase'

export async function GET() {
  try {
    const reports = await listReports()
    return NextResponse.json({ reports })
  } catch (err) {
    console.error('List reports error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
