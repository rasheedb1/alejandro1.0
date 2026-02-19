'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { SavedReport } from '@/lib/research/supabase'
import ReportView from '@/components/research/ReportView'
import type { ResearchReport } from '@/lib/research/types'

export default function SavedReportPage() {
  const { id } = useParams()
  const router = useRouter()
  const [saved, setSaved] = useState<SavedReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/research/reports/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.report) setSaved(d.report)
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!confirm('Delete this report permanently?')) return
    setDeleting(true)
    await fetch(`/api/research/reports/${id}`, { method: 'DELETE' })
    router.push('/research')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading report...</p>
        </div>
      </div>
    )
  }

  if (!saved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-sm font-medium text-gray-500">Report not found.</p>
          <Link href="/research" className="mt-4 inline-block text-sm text-purple-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const report = saved.full_report as ResearchReport

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
              <span className="text-white font-black text-xs tracking-tight">CH</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{saved.company_name}</h1>
              <p className="text-sm text-gray-400">CHIEF · Saved Report</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/research" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Dashboard
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <ReportView
          report={report}
          modules={report.modules || []}
        />
      </div>
    </div>
  )
}
