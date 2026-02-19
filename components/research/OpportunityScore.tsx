import type { ScoreCriterion } from '@/lib/research/types'

interface OpportunityScoreProps {
  score: number
  breakdown: ScoreCriterion[]
}

export default function OpportunityScore({ score, breakdown }: OpportunityScoreProps) {
  const scoreColor =
    score >= 8 ? 'text-green-600' :
    score >= 6 ? 'text-yellow-600' :
    score >= 4 ? 'text-orange-500' :
    'text-red-500'

  const scoreBg =
    score >= 8 ? 'bg-green-50 border-green-200' :
    score >= 6 ? 'bg-yellow-50 border-yellow-200' :
    score >= 4 ? 'bg-orange-50 border-orange-200' :
    'bg-red-50 border-red-200'

  const scoreLabel =
    score >= 8 ? 'Hot Prospect' :
    score >= 6 ? 'Good Fit' :
    score >= 4 ? 'Moderate Fit' :
    'Low Priority'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Opportunity Score</h2>

      <div className="flex items-center gap-6 mb-6">
        <div className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center ${scoreBg}`}>
          <span className={`text-4xl font-black ${scoreColor}`}>{score}</span>
          <span className={`text-xs font-semibold ${scoreColor}`}>/10</span>
        </div>
        <div>
          <p className={`text-xl font-bold ${scoreColor}`}>{scoreLabel}</p>
          <p className="text-sm text-gray-500 mt-1">
            {score >= 8
              ? 'Strong product-market fit. High priority for outreach.'
              : score >= 6
              ? 'Good opportunity. Personalize outreach to key pain points.'
              : score >= 4
              ? 'Some opportunity. Research further before investing time.'
              : 'Limited fit detected. Consider deprioritizing.'}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {breakdown.map((criterion, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={`text-sm mt-0.5 shrink-0 ${criterion.present ? 'text-green-500' : 'text-gray-300'}`}>
              {criterion.present ? '✅' : '❌'}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${criterion.present ? 'text-gray-900' : 'text-gray-400'}`}>
                  {criterion.name}
                </span>
                {criterion.present && criterion.impact > 0 && (
                  <span className="text-xs text-purple-600 font-semibold">+{criterion.impact}</span>
                )}
              </div>
              <p className={`text-xs mt-0.5 ${criterion.present ? 'text-gray-600' : 'text-gray-400'}`}>
                {criterion.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
