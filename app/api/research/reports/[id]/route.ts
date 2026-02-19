import { NextResponse } from 'next/server'
import { getReport, deleteReport } from '@/lib/research/supabase'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const report = await getReport(id)
    return NextResponse.json({ report })
  } catch (err) {
    console.error('Get report error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteReport(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete report error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
