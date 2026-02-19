'use client'

import { useState } from 'react'
import type { ResearchReport, ModuleResult, StrategicInsight, SimilarCompany, ProspectScore } from '@/lib/research/types'
import { MODULE_ORDER } from '@/lib/research/types'
import ModuleCard from './ModuleCard'
import OpportunityScore from './OpportunityScore'

interface ReportViewProps {
  report: ResearchReport
  modules: ModuleResult[]
  isSynthesizing?: boolean
  onSave?: () => void
  isSaving?: boolean
  saveError?: string | null
  savedId?: string | null
}

export default function ReportView({
  report,
  modules,
  isSynthesizing = false,
  onSave,
  isSaving = false,
  saveError = null,
  savedId = null,
}: ReportViewProps) {
  const [copied, setCopied] = useState(false)
  const [copiedPoint, setCopiedPoint] = useState<number | null>(null)

  function copyReport() {
    const lines: string[] = []
    lines.push(`ACCOUNT RESEARCH REPORT — ${report.input.companyName.toUpperCase()}`)
    lines.push(`Domain: ${report.input.domain} | Industry: ${report.input.industry} | Region: ${report.input.region}`)
    lines.push(`SDR: ${report.input.sdrName} | Date: ${new Date().toLocaleDateString()}`)
    lines.push(`Opportunity Score: ${report.opportunityScore}/10`)
    lines.push('')
    lines.push('EXECUTIVE SUMMARY')
    lines.push(report.executiveSummary)
    lines.push('')
    lines.push('KEY TALKING POINTS')
    report.talkingPoints.forEach((tp, i) => {
      lines.push(`${i + 1}. ${tp}`)
    })
    lines.push('')
    for (const m of modules) {
      if (m.status === 'done') {
        lines.push(`--- ${m.title.toUpperCase()} ---`)
        lines.push(JSON.stringify(m.data, null, 2))
        lines.push('')
      }
    }
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyTalkingPoint(point: string, idx: number) {
    navigator.clipboard.writeText(point)
    setCopiedPoint(idx)
    setTimeout(() => setCopiedPoint(null), 2000)
  }

  const doneCount = modules.filter((m) => m.status === 'done').length
  const totalCount = MODULE_ORDER.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{report.input.companyName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {report.input.domain} · {report.input.industry} · {report.input.region}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Research by {report.input.sdrName} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={copyReport}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? '✓ Copied!' : '📋 Copy Report'}
            </button>
            {onSave && !savedId && (
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-sm shadow-purple-200"
              >
                {isSaving ? 'Saving...' : '💾 Save Report'}
              </button>
            )}
            {savedId && (
              <span className="px-4 py-2 rounded-xl bg-green-100 text-green-700 text-sm font-semibold">
                ✓ Saved
              </span>
            )}
          </div>
        </div>
        {saveError && (
          <p className="mt-3 text-xs text-red-500">Save failed: {saveError}</p>
        )}
      </div>

      {/* Opportunity Score */}
      {report.opportunityScore > 0 && !isSynthesizing && (
        <OpportunityScore score={report.opportunityScore} breakdown={report.scoreBreakdown || []} />
      )}

      {isSynthesizing && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <p className="text-sm font-medium text-purple-700">Synthesizing findings and calculating opportunity score...</p>
        </div>
      )}

      {/* Executive Summary */}
      {report.executiveSummary && !isSynthesizing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Executive Summary</h2>
          <p className="text-sm text-gray-700 leading-relaxed">{report.executiveSummary}</p>
        </div>
      )}

      {/* Talking Points */}
      {report.talkingPoints?.length > 0 && !isSynthesizing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Key Talking Points for Outreach</h2>
          <div className="space-y-3">
            {report.talkingPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="flex-1 text-sm text-gray-700 leading-relaxed">{point}</p>
                <button
                  onClick={() => copyTalkingPoint(point, i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-xs text-gray-400 hover:text-purple-600 mt-0.5"
                >
                  {copiedPoint === i ? '✓' : '📋'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Insights */}
      {report.strategicInsights && report.strategicInsights.length > 0 && !isSynthesizing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Strategic Insights & Outreach Angles</h2>
          <div className="space-y-3">
            {report.strategicInsights.map((insight: StrategicInsight) => {
              const priorityColors: Record<string, string> = {
                High: 'bg-red-50 border-red-200 text-red-700',
                Medium: 'bg-amber-50 border-amber-200 text-amber-700',
                Low: 'bg-blue-50 border-blue-200 text-blue-700',
              }
              const dotColors: Record<string, string> = {
                High: 'bg-red-500',
                Medium: 'bg-amber-500',
                Low: 'bg-blue-400',
              }
              return (
                <div key={insight.number} className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {insight.number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${priorityColors[insight.priority] || 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[insight.priority] || 'bg-gray-400'}`} />
                        {insight.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{insight.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Similar Companies & Prospecting Pipeline */}
      {report.similarCompanies && !isSynthesizing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Similar Companies & Prospecting Pipeline</h2>

          {/* Direct Competitors */}
          {report.similarCompanies.direct_competitors?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-2">Direct Competitors</p>
              <div className="space-y-2">
                {report.similarCompanies.direct_competitors.map((c: SimilarCompany, i: number) => {
                  const oppColors: Record<string, string> = {
                    High: 'bg-green-100 text-green-700',
                    Medium: 'bg-yellow-100 text-yellow-700',
                    Low: 'bg-gray-100 text-gray-500',
                  }
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <span className="text-xs text-gray-400">{c.domain}</span>
                        </div>
                        <p className="text-xs text-gray-600">{c.why_relevant}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${oppColors[c.estimated_opportunity] || 'bg-gray-100 text-gray-500'}`}>
                        {c.estimated_opportunity}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Industry Peers */}
          {report.similarCompanies.industry_peers?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Industry Peers</p>
              <div className="space-y-2">
                {report.similarCompanies.industry_peers.map((c: SimilarCompany, i: number) => {
                  const oppColors: Record<string, string> = {
                    High: 'bg-green-100 text-green-700',
                    Medium: 'bg-yellow-100 text-yellow-700',
                    Low: 'bg-gray-100 text-gray-500',
                  }
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                          <span className="text-xs text-gray-400">{c.domain}</span>
                        </div>
                        <p className="text-xs text-gray-600">{c.why_relevant}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${oppColors[c.estimated_opportunity] || 'bg-gray-100 text-gray-500'}`}>
                        {c.estimated_opportunity}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Prospect Scoring */}
          {report.similarCompanies.prospect_scoring?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Prospect Scoring</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Company</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Domain</th>
                      <th className="text-center py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Est. Score</th>
                      <th className="text-left py-2 px-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.similarCompanies.prospect_scoring.map((p: ProspectScore, i: number) => {
                      const scoreColor = p.estimated_score >= 8 ? 'bg-green-100 text-green-700' : p.estimated_score >= 6 ? 'bg-yellow-100 text-yellow-700' : p.estimated_score >= 4 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-600'
                      return (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="py-2 px-3 font-semibold text-gray-900">{p.name}</td>
                          <td className="py-2 px-3 text-gray-400 text-xs">{p.domain}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor}`}>{p.estimated_score}/10</span>
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-600">{p.rationale}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Research Modules</h2>
          <span className="text-xs text-gray-500">{doneCount}/{totalCount} complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Module Cards */}
      <div className="space-y-2">
        {modules.map((module, i) => (
          <ModuleCard key={module.moduleId} module={module} index={i} />
        ))}
      </div>
    </div>
  )
}
