'use client'

import { useState } from 'react'
import type { ModuleResult } from '@/lib/research/types'

interface ModuleCardProps {
  module: ModuleResult
  index: number
}

function renderValue(value: unknown, depth = 0): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-gray-400">—</span>
  if (typeof value === 'boolean') {
    return (
      <span className={value ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
        {value ? '✓ Yes' : '✗ No'}
      </span>
    )
  }
  if (typeof value === 'number') return <span className="font-semibold text-gray-800">{value}</span>
  if (typeof value === 'string') return <span className="text-gray-700">{value}</span>
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">None found</span>
    return (
      <ul className="space-y-1 mt-1">
        {value.map((item, i) => (
          <li key={i} className={`${depth === 0 ? 'ml-0' : 'ml-3'}`}>
            {typeof item === 'object' ? (
              <div className="bg-gray-50 rounded-lg p-3 mt-1">
                {renderObject(item as Record<string, unknown>, depth + 1)}
              </div>
            ) : (
              <span className="flex items-start gap-1.5">
                <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                <span className="text-gray-700">{String(item)}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    )
  }
  if (typeof value === 'object') {
    return (
      <div className={depth > 0 ? '' : 'space-y-2'}>
        {renderObject(value as Record<string, unknown>, depth)}
      </div>
    )
  }
  return <span className="text-gray-700">{String(value)}</span>
}

function renderObject(obj: Record<string, unknown>, depth = 0): React.ReactNode {
  const keyLabels: Record<string, string> = {
    what_they_do: 'What they do',
    hq_location: 'HQ Location',
    company_size: 'Company size',
    founded_year: 'Founded',
    business_model: 'Business model',
    key_products: 'Key products',
    funding: 'Funding',
    recent_highlights: 'Recent highlights',
    status: 'Status',
    latest_round: 'Latest round',
    total_raised: 'Total raised',
    investors: 'Investors',
    global_top_markets: 'Global top markets',
    target_region_markets: 'Target region markets',
    expanding_to: 'Expanding to',
    market_notes: 'Market notes',
    entities: 'Legal entities',
    cross_border_opportunity: 'Cross-border opportunity',
    has_local_entity: 'Local entity',
    entity_name: 'Entity name',
    processing_type: 'Processing type',
    fee_impact: 'Fee impact',
    evidence: 'Evidence',
    country: 'Country',
    relevance: 'Relevance',
    markets: 'Markets',
    biggest_gap: 'Biggest gap',
    total_missing_apms: 'Missing APMs count',
    available_methods: 'Available methods',
    missing_critical_apm: 'Missing APMs',
    opportunity_level: 'Opportunity',
    detected_psps: 'Detected PSPs',
    psp_count: 'PSP count',
    has_orchestrator: 'Has orchestrator',
    orchestrator_name: 'Orchestrator',
    redundancy_risk: 'Redundancy risk',
    processing_scope: 'Scope',
    yuno_angle: 'Yuno angle',
    name: 'Name',
    confidence: 'Confidence',
    type: 'Type',
    complaints_found: 'Complaints found',
    severity: 'Severity',
    complaint_themes: 'Complaint themes',
    affected_markets: 'Affected markets',
    fraud_mentions: 'Fraud mentions',
    checkout_ux_issues: 'Checkout UX issues',
    support_quality: 'Support quality',
    outreach_angle: 'Outreach angle',
    theme: 'Theme',
    frequency: 'Frequency',
    example: 'Example',
    payment_hires: 'Payment hires',
    recent_launches: 'Recent launches',
    ma_activity: 'M&A activity',
    expansion_urgency: 'Urgency',
    role: 'Role',
    level: 'Level',
    location: 'Location',
    signals: 'Signals',
    timeline: 'Timeline',
    news_items: 'News items',
    financial_health: 'Financial health',
    recent_payment_events: 'Payment events',
    trigger_events: 'Trigger events',
    headline: 'Headline',
    date: 'Date',
    source: 'Source',
    category: 'Category',
    summary: 'Summary',
    relevance_to_yuno: 'Relevance to Yuno',
    // company_overview new fields
    scale_metrics: 'Scale metrics',
    // local_entity new fields
    registration_id: 'Registration ID',
    // payment_methods new fields
    how_confirmed: 'How confirmed',
    // psp_detection new fields
    yuno_existing_relationship: 'Yuno relationship',
    yuno_relationship_details: 'Yuno details',
    // expansion new fields
    market: 'Market',
  }

  const skip = ['key_insight', 'parse_error', 'raw_text', 'notes']
  const highlight = ['key_insight']

  return (
    <div className="space-y-2">
      {Object.entries(obj).map(([key, val]) => {
        if (skip.includes(key) && key !== 'key_insight') return null
        const label = keyLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        return (
          <div key={key} className={highlight.includes(key) ? 'bg-purple-50 border border-purple-200 rounded-lg p-3' : ''}>
            {highlight.includes(key) ? (
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Key Insight</p>
                <p className="text-sm text-purple-900 font-medium">{String(val)}</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0 w-32 pt-0.5">{label}</span>
                <div className="flex-1 text-sm">{renderValue(val, depth + 1)}</div>
              </div>
            )}
          </div>
        )
      })}
      {!!obj.key_insight && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-1">Key Insight</p>
          <p className="text-sm text-purple-900 font-medium">{String(obj.key_insight)}</p>
        </div>
      )}
    </div>
  )
}

const MODULE_ICONS: Record<string, string> = {
  company_overview: '🏢',
  top_markets: '🌍',
  local_entity: '🏛️',
  payment_methods: '💳',
  psp_detection: '⚙️',
  complaints: '💬',
  expansion: '🚀',
  news: '📰',
}

export default function ModuleCard({ module, index }: ModuleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const icon = MODULE_ICONS[module.moduleId] || '📋'

  const statusColors = {
    pending: 'border-gray-100 bg-white',
    loading: 'border-purple-200 bg-purple-50',
    done: 'border-green-100 bg-white',
    error: 'border-red-200 bg-red-50',
  }

  const statusBadge = {
    pending: <span className="text-xs text-gray-400 font-medium">Waiting</span>,
    loading: (
      <span className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold">
        <span className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        Running...
      </span>
    ),
    done: <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full">✓ Done</span>,
    error: <span className="text-xs text-red-600 font-semibold bg-red-100 px-2 py-0.5 rounded-full">✗ Error</span>,
  }

  return (
    <div className={`rounded-2xl border shadow-sm transition-all ${statusColors[module.status]}`}>
      <button
        onClick={() => module.status === 'done' && setExpanded(!expanded)}
        className={`w-full text-left p-4 flex items-center gap-3 ${module.status === 'done' ? 'cursor-pointer hover:bg-gray-50/50' : 'cursor-default'}`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
          module.status === 'pending' ? 'bg-gray-100' :
          module.status === 'loading' ? 'bg-purple-100' :
          module.status === 'done' ? 'bg-green-100' :
          'bg-red-100'
        }`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Module {index + 1}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">{module.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge[module.status]}
          {module.status === 'done' && (
            <span className="text-gray-400 text-xs">{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </button>

      {module.status === 'error' && (
        <div className="px-4 pb-4">
          <p className="text-xs text-red-600">{module.error || 'Research failed for this module'}</p>
        </div>
      )}

      {module.status === 'done' && expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4">
          {module.data.parse_error ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Raw output — could not parse structured data
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap font-mono text-xs bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                {String(module.data.raw_text || '')}
              </p>
            </div>
          ) : (
            renderObject(module.data)
          )}
        </div>
      )}
    </div>
  )
}
