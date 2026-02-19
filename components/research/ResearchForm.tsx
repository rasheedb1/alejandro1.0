'use client'

import { useState } from 'react'
import type { ResearchInput, Industry, Region } from '@/lib/research/types'
import { INDUSTRIES, REGIONS, SDR_TEAM } from '@/lib/research/types'

interface ResearchFormProps {
  onSubmit: (input: ResearchInput) => void
  isLoading: boolean
}

export default function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [form, setForm] = useState<Omit<ResearchInput, 'additionalDomains'>>({
    companyName: '',
    domain: '',
    region: 'LATAM',
    industry: INDUSTRIES[0],
    sdrName: SDR_TEAM[0].name,
  })

  const [discoveredDomains, setDiscoveredDomains] = useState<string[]>([])
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set())
  const [discoveringDomains, setDiscoveringDomains] = useState(false)
  const [discoveryDone, setDiscoveryDone] = useState(false)

  async function discoverDomains() {
    if (!form.companyName.trim() || !form.domain.trim()) return
    setDiscoveringDomains(true)
    setDiscoveredDomains([])
    setSelectedDomains(new Set())
    setDiscoveryDone(false)

    try {
      const res = await fetch('/api/research/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName: form.companyName, domain: form.domain }),
      })
      const data = await res.json()
      const domains: string[] = data.domains ?? []
      setDiscoveredDomains(domains)
      setSelectedDomains(new Set(domains)) // all checked by default
    } catch {
      setDiscoveredDomains([])
    } finally {
      setDiscoveringDomains(false)
      setDiscoveryDone(true)
    }
  }

  function handleDomainBlur() {
    if (form.companyName.trim() && form.domain.trim() && !discoveryDone) {
      discoverDomains()
    }
  }

  function toggleDomain(d: string) {
    setSelectedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(d)) next.delete(d)
      else next.add(d)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.companyName.trim() || !form.domain.trim()) return
    onSubmit({
      ...form,
      additionalDomains: Array.from(selectedDomains),
    })
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
            onChange={(e) => {
              setForm({ ...form, companyName: e.target.value })
              setDiscoveryDone(false)
            }}
            placeholder="e.g. Mercado Libre"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website / Domain *
            {discoveringDomains && (
              <span className="ml-2 text-xs text-purple-500 font-normal inline-flex items-center gap-1">
                <span className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin inline-block" />
                Finding domains...
              </span>
            )}
          </label>
          <input
            type="text"
            value={form.domain}
            onChange={(e) => {
              setForm({ ...form, domain: e.target.value })
              setDiscoveryDone(false)
            }}
            onBlur={handleDomainBlur}
            placeholder="e.g. rappi.co"
            required
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Domain discovery results */}
      {discoveryDone && (
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Additional Domains Found
            </p>
            <button
              type="button"
              onClick={discoverDomains}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Refresh
            </button>
          </div>
          {discoveredDomains.length === 0 ? (
            <p className="text-xs text-gray-400">No additional domains found for this company.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {discoveredDomains.map((d) => (
                <label
                  key={d}
                  className="flex items-center gap-1.5 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedDomains.has(d)}
                    onChange={() => toggleDomain(d)}
                    className="accent-purple-600 w-3.5 h-3.5"
                  />
                  <span className={`text-xs font-mono rounded-md px-2 py-0.5 border transition-colors ${
                    selectedDomains.has(d)
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-white border-gray-200 text-gray-400 line-through'
                  }`}>
                    {d}
                  </span>
                </label>
              ))}
            </div>
          )}
          {selectedDomains.size > 0 && (
            <p className="text-xs text-gray-400">
              {selectedDomains.size} domain{selectedDomains.size > 1 ? 's' : ''} selected — research will cover all of them.
            </p>
          )}
        </div>
      )}

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
          'Run Full Research'
        )}
      </button>
    </form>
  )
}
