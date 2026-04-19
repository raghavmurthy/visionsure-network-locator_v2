// src/components/CoverageScorecard.tsx
// The sales layer. Appears after the first office is analysed.
// Shows an at-a-glance % score + breakdown + CTA.
// Intentionally simple — the goal is confidence, not complexity.

import type { CoverageSummary } from '../types';

interface Props {
  summary: CoverageSummary;
  onCTA:   () => void;
}

// Visual bar for the score
function ScoreBar({ pct }: { pct: number }) {
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 50 ? 'bg-amber-400'   :
                'bg-red-400';
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CoverageScorecard({ summary, onCTA }: Props) {
  if (summary.total === 0) return null;

  const { total, excellent, good, limited, excellentPct } = summary;

  const headline =
    excellentPct >= 80 ? 'Your team has excellent VisionSure coverage.' :
    excellentPct >= 50 ? 'Good coverage — a few locations need attention.' :
                         'Some office locations have limited coverage nearby.';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Coverage score</p>
          <p className="text-3xl font-bold text-gray-800 mt-0.5">{excellentPct}%</p>
          <p className="text-xs text-gray-500 mt-0.5">{headline}</p>
        </div>
        <div className="text-4xl select-none">
          {excellentPct >= 80 ? '🟢' : excellentPct >= 50 ? '🟡' : '🔴'}
        </div>
      </div>

      <ScoreBar pct={excellentPct} />

      {/* Breakdown pills */}
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        {excellent > 0 && (
          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
            {excellent} Excellent
          </span>
        )}
        {good > 0 && (
          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
            {good} Good
          </span>
        )}
        {limited > 0 && (
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
            {limited} Limited
          </span>
        )}
        <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
          {total} location{total !== 1 ? 's' : ''} total
        </span>
      </div>

      {/* CTA */}
      <button
        onClick={onCTA}
        className="w-full text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        style={{ backgroundColor: '#360679' }}
      >
        Get VisionSure for your team →
      </button>
    </div>
  );
}
