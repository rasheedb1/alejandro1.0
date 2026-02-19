'use client'

import { useState } from 'react'
import type { ResearchInput, Industry, Region } from '@/lib/research/types'
import { INDUSTRIES, REGIONS, SDR_TEAM } from '@/lib/research/types'

interface ResearchFormProps {
  onSubmit: (input: ResearchInput) => void
  isLoading: boolean
}

export default function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [form, setForm] = useState<ResearchInput>({
    companyName: '',
    domain: '',
    region: 'LATAM',
    industry: 'Retail/Ecommerce',
    sdrName: SDR_TEAM[0].name,
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyName.trim() || !form.domain.trim()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account Details</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input
            type="text"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            placeholder="e.g. Mercado Libre"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website / Domain *</label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => setForm({ ...form, domain: e.target.value })}
            placeholder="e.g. mercadolibre.com"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Region</label>
          <select
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value as Region })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
          <select
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value as Industry })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SDR</label>
          <select
            value={form.sdrName}
            onChange={(e) => setForm({ ...form, sdrName: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {SDR_TEAM.map((sdr) => (
              <option key={sdr.name} value={sdr.name}>{sdr.name} ({sdr.region})</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !form.companyName.trim() || !form.domain.trim()}
        className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Research Running...
          </>
        ) : (
          '🔍 Run Full Research'
        )}
      </button>
    </form>
  )
}
