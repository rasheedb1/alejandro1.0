'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SavedReport } from '@/lib/research/supabase'

export default function ResearchDashboard() {
  const [reports, setReports] = useState<SavedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetch('/api/research/reports')
      .then((r) => r.json())
      .then((d) => {
        if (d.reports) setReports(d.reports)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/research/auth', { method: 'DELETE' })
    router.push('/research/login')
  }

  const filtered = reports.filter(
    (r) =>
      r.company_name.toLowerCase().includes(search.toLowerCase()) ||
      r.domain?.toLowerCase().includes(search.toLowerCase()) ||
      r.sdr_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.industry?.toLowerCase().includes(search.toLowerCase())
  )

  function scoreColor(score: number) {
    if (score >= 8) return 'bg-green-100 text-green-700'
    if (score >= 6) return 'bg-yellow-100 text-yellow-700'
    if (score >= 4) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
              <span className="text-white font-black text-xs tracking-tight">CH</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">CHIEF</h1>
              <p className="text-sm text-gray-400">Account Intelligence · Yuno SDR</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Weekly Report
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
            <Link
              href="/research/new"
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-md shadow-purple-200"
            >
              + New Research
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company, domain, SDR, or industry..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Loading reports...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-sm font-medium text-gray-500">
                {reports.length === 0 ? 'No research reports yet.' : 'No results for your search.'}
              </p>
              {reports.length === 0 && (
                <Link
                  href="/research/new"
                  className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  Run your first research
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Industry</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Region</th>
                    <th className="text-center py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Score</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">SDR</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">Date</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((report) => (
                    <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{report.company_name}</p>
                        <p className="text-xs text-gray-400">{report.domain}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{report.industry}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {report.region}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {report.opportunity_score ? (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${scoreColor(report.opportunity_score)}`}>
                            {report.opportunity_score}/10
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{report.sdr_name}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/research/${report.id}`}
                          className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
