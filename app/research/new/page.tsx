'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ResearchForm from '@/components/research/ResearchForm'
import ReportView from '@/components/research/ReportView'
import type { ResearchInput, ModuleResult, ResearchReport } from '@/lib/research/types'
import { MODULE_ORDER, MODULE_TITLES } from '@/lib/research/types'

function buildInitialModules(): ModuleResult[] {
  return MODULE_ORDER.map((id) => ({
    moduleId: id,
    title: MODULE_TITLES[id],
    status: 'pending',
    data: {},
  }))
}

export default function NewResearchPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentModuleIdx, setCurrentModuleIdx] = useState(-1)
  const [modules, setModules] = useState<ModuleResult[]>(buildInitialModules())
  const [report, setReport] = useState<ResearchReport | null>(null)
  const [isSynthesizing, setIsSynthesizing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const router = useRouter()

  function updateModule(moduleId: string, update: Partial<ModuleResult>) {
    setModules((prev) =>
      prev.map((m) => (m.moduleId === moduleId ? { ...m, ...update } : m))
    )
  }

  async function runResearch(input: ResearchInput) {
    setIsRunning(true)
    setCurrentModuleIdx(0)
    setModules(buildInitialModules())
    setReport(null)
    setSavedId(null)
    setSaveError(null)

    const completedModules: ModuleResult[] = []

    for (let i = 0; i < MODULE_ORDER.length; i++) {
      const moduleId = MODULE_ORDER[i]
      setCurrentModuleIdx(i)

      updateModule(moduleId, { status: 'loading' })

      try {
        const res = await fetch('/api/research/module', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleId, input }),
        })

        if (!res.ok) {
          const err = await res.json()
          updateModule(moduleId, { status: 'error', error: err.error || 'Module failed' })
          completedModules.push({
            moduleId,
            title: MODULE_TITLES[moduleId],
            status: 'error',
            data: {},
            error: err.error || 'Module failed',
          })
        } else {
          const data = await res.json()
          const moduleResult: ModuleResult = {
            moduleId,
            title: MODULE_TITLES[moduleId],
            status: 'done',
            data: data.data || {},
          }
          updateModule(moduleId, { status: 'done', data: data.data || {} })
          completedModules.push(moduleResult)
        }
      } catch (err) {
        const errMsg = String(err)
        updateModule(moduleId, { status: 'error', error: errMsg })
        completedModules.push({
          moduleId,
          title: MODULE_TITLES[moduleId],
          status: 'error',
          data: {},
          error: errMsg,
        })
      }
    }

    // Synthesize results
    setIsSynthesizing(true)
    const baseReport: ResearchReport = {
      input,
      opportunityScore: 0,
      scoreBreakdown: [],
      executiveSummary: '',
      modules: completedModules,
      talkingPoints: [],
    }
    setReport(baseReport)

    try {
      const synthRes = await fetch('/api/research/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, modules: completedModules }),
      })
      const synthData = await synthRes.json()

      const finalReport: ResearchReport = {
        ...baseReport,
        opportunityScore: synthData.opportunity_score || 0,
        scoreBreakdown: synthData.score_breakdown || [],
        executiveSummary: synthData.executive_summary || '',
        talkingPoints: synthData.talking_points || [],
        strategicInsights: synthData.strategic_insights || [],
        similarCompanies: synthData.similar_companies || undefined,
      }
      setReport(finalReport)
    } catch (err) {
      console.error('Synthesis error:', err)
    }

    setIsSynthesizing(false)
    setIsRunning(false)
    setCurrentModuleIdx(-1)
  }

  async function handleSave() {
    if (!report) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/research/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      })
      const data = await res.json()
      if (data.success) {
        setSavedId(data.id)
      } else {
        setSaveError(data.error || 'Failed to save')
      }
    } catch (err) {
      setSaveError(String(err))
    }
    setIsSaving(false)
  }

  const progressLabel =
    isRunning && currentModuleIdx >= 0
      ? `Running Module ${currentModuleIdx + 1} of ${MODULE_ORDER.length}: ${MODULE_TITLES[MODULE_ORDER[currentModuleIdx]]}...`
      : null

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
              <h1 className="text-xl font-black text-gray-900 tracking-tight">CHIEF</h1>
              <p className="text-sm text-gray-400">New Account Research</p>
            </div>
          </div>
          <Link
            href="/research"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Form */}
        {!isRunning && !report && (
          <ResearchForm onSubmit={runResearch} isLoading={isRunning} />
        )}

        {/* Progress bar */}
        {progressLabel && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin shrink-0" />
              <p className="text-sm font-semibold text-purple-700">{progressLabel}</p>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${((currentModuleIdx) / MODULE_ORDER.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Report View (shows during and after research) */}
        {(isRunning || report) && (
          <>
            {report ? (
              <ReportView
                report={report}
                modules={modules}
                isSynthesizing={isSynthesizing}
                onSave={handleSave}
                isSaving={isSaving}
                saveError={saveError}
                savedId={savedId}
              />
            ) : (
              <div className="space-y-2">
                {modules.map((m, i) => (
                  <div
                    key={m.moduleId}
                    className={`rounded-2xl border p-4 flex items-center gap-3 ${
                      m.status === 'loading' ? 'border-purple-200 bg-purple-50' :
                      m.status === 'done' ? 'border-green-100 bg-white' :
                      m.status === 'error' ? 'border-red-200 bg-red-50' :
                      'border-gray-100 bg-white'
                    }`}
                  >
                    <span className="text-gray-400 text-xs w-5">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-700 flex-1">{m.title}</span>
                    {m.status === 'loading' && (
                      <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {m.status === 'done' && <span className="text-green-500 text-sm">✓</span>}
                    {m.status === 'error' && <span className="text-red-500 text-sm">✗</span>}
                  </div>
                ))}
              </div>
            )}

            {savedId && (
              <button
                onClick={() => router.push(`/research/${savedId}`)}
                className="w-full py-3 rounded-xl border-2 border-purple-600 text-purple-600 font-semibold text-sm hover:bg-purple-50 transition-colors"
              >
                View saved report →
              </button>
            )}

            {!isRunning && !isSynthesizing && (
              <button
                onClick={() => {
                  setReport(null)
                  setModules(buildInitialModules())
                  setSavedId(null)
                }}
                className="w-full py-3 rounded-xl border border-gray-200 text-gray-500 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Research another account
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
