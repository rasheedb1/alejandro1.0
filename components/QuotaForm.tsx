'use client'

import { useState, useRef } from 'react'
import { SDR, Region } from '@/types'
import { calculateTeamMetrics, calculateSDRMetrics, MONTHS } from '@/lib/calculations'
import { generateEmailHTML } from '@/lib/emailTemplate'
import EmailPreview from './EmailPreview'
import type { SheetSDRQuota } from '@/app/api/sheets-quota/route'

function normName(s: string): string[] {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/)
}
function namesMatch(formName: string, sheetFullName: string): boolean {
  return normName(formName)[0] === normName(sheetFullName)[0]
}

const DEFAULT_SDRS: SDR[] = [
  { id: '1', name: 'German Tatis', region: 'US', sqls: 0, quota: 0 },
  { id: '2', name: 'Samuel Carreño', region: 'US', sqls: 0, quota: 0 },
  { id: '3', name: 'Mariana Ojeda', region: 'LATAM', sqls: 0, quota: 0 },
  { id: '4', name: 'Alejandro Bernal', region: 'LATAM', sqls: 0, quota: 0 },
  { id: '5', name: 'Partha Aakash Cheepur', region: 'APAC', sqls: 0, quota: 0 },
  { id: '6', name: 'Kaiye', region: 'APAC', sqls: 0, quota: 0 },
  { id: '7', name: 'Yamin Lahmeur', region: 'EMEA', sqls: 0, quota: 0 },
  { id: '8', name: 'Magdalena Torrealba', region: 'Inbound', sqls: 0, quota: 0 },
]

const REGIONS: Region[] = ['US', 'LATAM', 'APAC', 'EMEA', 'Inbound']

const REGION_COLORS: Record<Region, string> = {
  US: 'bg-blue-50 text-blue-700',
  LATAM: 'bg-green-50 text-green-700',
  APAC: 'bg-orange-50 text-orange-700',
  EMEA: 'bg-pink-50 text-pink-700',
  Inbound: 'bg-gray-100 text-gray-600',
}

function achievementBadge(pct: number, hasQuota: boolean): string {
  if (!hasQuota) return 'bg-gray-100 text-gray-400'
  if (pct >= 100) return 'bg-green-50 text-green-700'
  if (pct >= 75) return 'bg-yellow-50 text-yellow-700'
  return 'bg-red-50 text-red-700'
}

export default function QuotaForm() {
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [teamQuota, setTeamQuota] = useState<number>(0)
  const [sqlsMTD, setSqlsMTD] = useState<number>(0)
  const [sdrs, setSdrs] = useState<SDR[]>(DEFAULT_SDRS)
  const [recipients, setRecipients] = useState('')
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotName, setScreenshotName] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isAutoLoading, setIsAutoLoading] = useState(false)
  const [autoLoadStatus, setAutoLoadStatus] = useState<{ type: 'success' | 'partial' | 'error'; message: string } | null>(null)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const metrics = calculateTeamMetrics(teamQuota, sqlsMTD, month, year)
  const calculatedSDRs = sdrs.map((s) =>
    calculateSDRMetrics(s, metrics.daysElapsed, metrics.daysInMonth)
  )

  const emailHTML = generateEmailHTML({
    metrics,
    teamQuota,
    sqlsMTD,
    sdrs: calculatedSDRs,
    screenshotSrc: screenshot ?? undefined,
  })

  function handleSDRChange(id: string, field: 'sqls' | 'quota' | 'name' | 'region', value: string) {
    setSdrs((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              [field]:
                field === 'sqls' || field === 'quota' ? Number(value) || 0 : value,
            }
          : s
      )
    )
  }

  function handleScreenshot(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setScreenshotName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => setScreenshot(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeScreenshot() {
    setScreenshot(null)
    setScreenshotName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAutoLoad() {
    setIsAutoLoading(true)
    setAutoLoadStatus(null)
    try {
      const [quotaRes, sqlsRes] = await Promise.all([
        fetch(`/api/sheets-quota?month=${month}&year=${year}`),
        fetch('/api/sf-sqls'),
      ])

      const quotaData = await quotaRes.json()
      const sqlsData = await sqlsRes.json()

      if (!quotaRes.ok) throw new Error(quotaData.error || 'Failed to load quotas')
      if (!sqlsRes.ok) throw new Error(sqlsData.error || 'Failed to load SQLs')

      const sheetSDRs: SheetSDRQuota[] = quotaData.sdrs ?? []
      const sfSQLs: { name: string; sqls: number }[] = sqlsData.sqls ?? []

      let matched = 0
      const updatedSDRs = sdrs.map((sdr) => {
        const sheetMatch = sheetSDRs.find((s) => namesMatch(sdr.name, s.fullName))
        const sfMatch = sfSQLs.find((s) => namesMatch(sdr.name, s.name))
        const newQuota = sheetMatch ? sheetMatch.quota : sdr.quota
        const newSqls = sfMatch ? sfMatch.sqls : sdr.sqls
        if (sheetMatch || sfMatch) matched++
        return { ...sdr, quota: newQuota, sqls: newSqls }
      })

      const newTeamQuota = updatedSDRs.reduce((sum, s) => sum + s.quota, 0)
      const newSqlsMTD = updatedSDRs.reduce((sum, s) => sum + s.sqls, 0)

      setSdrs(updatedSDRs)
      setTeamQuota(newTeamQuota)
      setSqlsMTD(newSqlsMTD)

      const total = sdrs.length
      if (matched === total) {
        setAutoLoadStatus({ type: 'success', message: `Loaded: quota from Sheets + SQLs from Salesforce (${total}/${total} SDRs matched)` })
      } else {
        setAutoLoadStatus({ type: 'partial', message: `Partial match: ${matched}/${total} SDRs matched. Check unmatched names.` })
      }
    } catch (err) {
      setAutoLoadStatus({ type: 'error', message: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsAutoLoading(false)
    }
  }

  async function handleSend() {
    setIsSending(true)
    setResult(null)
    try {
      const recipientList = recipients
        .split(/[\n,]+/)
        .map((e) => e.trim())
        .filter(Boolean)

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: emailHTML,
          recipients: recipientList,
          subject: `Mid-Week Quota Report — ${MONTHS[month - 1]} ${year} | Yuno SDR Team`,
          screenshotBase64: screenshot,
          screenshotName,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult({ success: true, message: '✅ Report sent successfully!' })
      } else {
        setResult({ success: false, message: `❌ ${data.error || 'Failed to send email'}` })
      }
    } catch {
      setResult({ success: false, message: '❌ Network error. Please try again.' })
    } finally {
      setIsSending(false)
    }
  }

  const hasQuota = teamQuota > 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-md shadow-purple-200">
            <span className="text-white font-black text-lg">Y</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SDR Quota Report</h1>
            <p className="text-sm text-gray-400">Mid-Week Report Generator · Yuno</p>
          </div>
        </div>

        {/* ── Report Period ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Report Period
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        {/* ── Team Metrics ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Team Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {MONTHS[month - 1]} Quota (total SQLs)
              </label>
              <input
                type="number"
                value={teamQuota || ''}
                onChange={(e) => setTeamQuota(Number(e.target.value))}
                placeholder="e.g. 46"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SQLs MTD</label>
              <input
                type="number"
                value={sqlsMTD || ''}
                onChange={(e) => setSqlsMTD(Number(e.target.value))}
                placeholder="e.g. 17"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Live Calculations */}
          {hasQuota && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <p className="text-xs text-purple-500 font-semibold uppercase tracking-wide">Should Be</p>
                <p className="text-3xl font-black text-purple-700 mt-1">{metrics.shouldBe}</p>
              </div>
              <div className={`rounded-xl p-4 text-center ${metrics.mtdAchievement >= 100 ? 'bg-green-50' : metrics.mtdAchievement >= 75 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${metrics.mtdAchievement >= 100 ? 'text-green-600' : metrics.mtdAchievement >= 75 ? 'text-yellow-600' : 'text-red-500'}`}>MTD Achievement</p>
                <p className={`text-3xl font-black mt-1 ${metrics.mtdAchievement >= 100 ? 'text-green-700' : metrics.mtdAchievement >= 75 ? 'text-yellow-700' : 'text-red-600'}`}>
                  {metrics.mtdAchievement.toFixed(1)}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Achievement</p>
                <p className="text-3xl font-black text-gray-700 mt-1">{metrics.totalAchievement.toFixed(1)}%</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Days Left</p>
                <p className="text-3xl font-black text-gray-700 mt-1">{metrics.daysRemaining}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Screenshot ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Salesforce Dashboard Screenshot <span className="text-gray-300 font-normal normal-case">(optional)</span>
          </h2>
          {screenshot ? (
            <div className="relative">
              <img
                src={screenshot}
                alt="Dashboard preview"
                className="w-full max-h-52 object-contain rounded-xl border border-gray-200"
              />
              <button
                onClick={removeScreenshot}
                className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 shadow-sm text-xs"
              >
                ✕
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">{screenshotName}</p>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            >
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm text-gray-400 group-hover:text-purple-500">Click to upload screenshot</p>
              <p className="text-xs text-gray-300 mt-1">PNG, JPG or GIF</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleScreenshot}
            className="hidden"
          />
        </div>

        {/* ── SDR Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            SDR Breakdown
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wide">SDR</th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Region</th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wide">SQLs</th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Quota</th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wide">Should Be</th>
                  <th className="text-center py-2 px-2 text-xs font-bold text-gray-400 uppercase tracking-wide">MTD %</th>
                </tr>
              </thead>
              <tbody>
                {calculatedSDRs.map((sdr) => (
                  <tr key={sdr.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2">
                      <input
                        value={sdr.name}
                        onChange={(e) => handleSDRChange(sdr.id, 'name', e.target.value)}
                        className="w-full font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-purple-400 focus:outline-none px-1 py-0.5 transition-colors"
                      />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <select
                        value={sdr.region}
                        onChange={(e) => handleSDRChange(sdr.id, 'region', e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer ${REGION_COLORS[sdr.region]}`}
                      >
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        value={sdr.sqls || ''}
                        onChange={(e) => handleSDRChange(sdr.id, 'sqls', e.target.value)}
                        placeholder="0"
                        className="w-16 text-center border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-purple-500 mx-auto block text-sm font-semibold"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="number"
                        value={sdr.quota || ''}
                        onChange={(e) => handleSDRChange(sdr.id, 'quota', e.target.value)}
                        placeholder="0"
                        className="w-16 text-center border border-gray-200 rounded-lg py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-purple-500 mx-auto block text-sm"
                      />
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="font-semibold text-gray-700">{sdr.shouldBe}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${achievementBadge(sdr.mtdAchievement, sdr.quota > 0)}`}>
                        {sdr.quota > 0 ? `${sdr.mtdAchievement.toFixed(1)}%` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recipients ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Email Recipients
          </h2>
          <textarea
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder="team@yuno.com, manager@yuno.com&#10;one@yuno.com"
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1.5">Separate multiple emails with commas or new lines</p>
        </div>

        {/* ── Auto-load Status ── */}
        {autoLoadStatus && (
          <div className={`rounded-xl px-5 py-4 text-sm font-medium ${
            autoLoadStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            autoLoadStatus.type === 'partial' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
            'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {autoLoadStatus.type === 'success' ? '✅ ' : autoLoadStatus.type === 'partial' ? '⚠️ ' : '❌ '}{autoLoadStatus.message}
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div className={`rounded-xl px-5 py-4 text-sm font-medium ${result.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {result.message}
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex flex-col gap-3 pb-10">
          <button
            onClick={handleAutoLoad}
            disabled={isAutoLoading}
            className="w-full py-3.5 rounded-xl border-2 border-indigo-500 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isAutoLoading ? '⏳ Loading from Salesforce & Sheets...' : '⚡ Auto-load Data'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 py-3.5 rounded-xl border-2 border-purple-600 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition-colors"
            >
              👁 Preview Email
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !recipients.trim()}
              className="flex-1 py-3.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-200"
            >
              {isSending ? 'Sending...' : '🚀 Send Report'}
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <EmailPreview html={emailHTML} onClose={() => setShowPreview(false)} />
      )}
    </div>
  )
}
