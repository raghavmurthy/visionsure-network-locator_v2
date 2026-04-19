// src/components/ResultsTable.tsx
// One row per added office. Click a row to highlight it on the map.

import type { CoverageResult } from '../types';
import { COVERAGE_BADGE } from '../constants/config';
import { formatPartnerDisplay } from '../utils/geoUtils';

interface Props {
  results:    CoverageResult[];
  radiusKm:   number;
  selectedId: string | null;
  onSelect:   (id: string) => void;
  onRemove:   (id: string) => void;
}

export function ResultsTable({ results, radiusKm, selectedId, onSelect, onRemove }: Props) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
        <span className="text-3xl">📍</span>
        Add an office location above to see coverage
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <th className="text-left py-2 px-2 sm:px-3">Location</th>
            <th className="text-left py-2 px-2 sm:px-3">Nearest Lenskart</th>
            <th className="text-left py-2 px-2 sm:px-3">Nearest Dr Agarwal</th>
            <th className="text-left py-2 px-2 sm:px-3">Nearest Lawrence & Mayo</th>
            <th className="text-right py-2 px-2 sm:px-3 hidden md:table-cell">Total Stores Within {radiusKm} km</th>
            <th className="text-center py-2 px-2 sm:px-3">Rating</th>
            <th className="py-2 px-2 sm:px-3" />
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const badge  = COVERAGE_BADGE[r.rating];
            const active = r.office.id === selectedId;

            const lkDisplay = formatPartnerDisplay(r.nearestLenskart);
            const daDisplay = formatPartnerDisplay(r.nearestDrAgarwal);
            const lmDisplay = formatPartnerDisplay(r.nearestLawrenceMayo);

            const lkText = r.nearestLenskart 
              ? `${lkDisplay.line1} (${r.nearestLenskartKm?.toFixed(1)} km)` 
              : '—';
            const daText = r.nearestDrAgarwal 
              ? `${daDisplay.line1} (${r.nearestDrAgarwalKm?.toFixed(1)} km)` 
              : '—';
            const lmText = r.nearestLawrenceMayo 
              ? `${lmDisplay.line1} (${r.nearestLawrenceMayoKm?.toFixed(1)} km)` 
              : '—';

            return (
              <tr
                key={r.office.id}
                onClick={() => onSelect(r.office.id)}
                className="border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50"
                style={active ? { backgroundColor: '#3606791a' } : {}}
              >
                <td className="py-3 px-2 sm:px-3">
                  <p className="font-medium text-gray-800 text-xs sm:text-sm">{r.office.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
                    {r.office.lat.toFixed(4)}, {r.office.lng.toFixed(4)}
                  </p>
                </td>
                <td className="py-3 px-2 sm:px-3">
                  <p className="text-gray-700 text-[10px] sm:text-xs leading-tight">{lkText}</p>
                </td>
                <td className="py-3 px-2 sm:px-3">
                  <p className="text-gray-700 text-[10px] sm:text-xs leading-tight">{daText}</p>
                </td>
                <td className="py-3 px-2 sm:px-3">
                  <p className="text-gray-700 text-[10px] sm:text-xs leading-tight">{lmText}</p>
                </td>
                <td className="py-3 px-2 sm:px-3 text-right hidden md:table-cell">
                  <span className="font-bold text-gray-700 text-xs">
                    {r.countWithinRadius}
                  </span>
                </td>
                <td className="py-3 px-2 sm:px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg} ${badge.text}`}>
                    {r.rating}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(r.office.id); }}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none transition-colors"
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
