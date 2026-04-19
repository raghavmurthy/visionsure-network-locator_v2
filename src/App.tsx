// src/App.tsx
// Orchestrator. All shared state lives here.
// Child components are purely presentational — they receive props, emit events.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Download } from 'lucide-react';
import { MapView }           from './components/MapView';
import { SearchBar }         from './components/SearchBar';
import { ResultsTable }      from './components/ResultsTable';
import { CoverageScorecard } from './components/CoverageScorecard';
import { LeftPanel }         from './components/LeftPanel';
import QuickCheckView        from './components/QuickCheckView';
import { getAllPartners }     from './services/partnerService';
import { analyzeOfficeCoverage, formatPartnerDisplay } from './utils/geoUtils';
import type { Partner, Office, CoverageResult, CoverageSummary } from './types';
import { DEFAULT_RADIUS_KM } from './constants/config';

const MAJOR_CITIES = [
  { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Gurugram', lat: 28.4943, lng: 77.0893 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
  { name: 'Surat', lat: 21.1702, lng: 72.8311 },
];

declare global {
  interface Window {
    XLSX: any;
  }
}

export default function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [partners,    setPartners]    = useState<Partner[]>([]);
  const [results,     setResults]     = useState<CoverageResult[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [radiusKm,    setRadiusKm]    = useState(DEFAULT_RADIUS_KM);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>(['Lenskart', 'Dr Agarwal', 'Lawrence & Mayo', 'office']);
  const [highlightType, setHighlightType] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showManualPanel, setShowManualPanel] = useState(false);
  const [showQuickCheck, setShowQuickCheck] = useState(false);

  const avgLenskart = useMemo(() => {
    const valid = results.filter(r => r.nearestLenskartKm != null);
    if (valid.length === 0) return null;
    return parseFloat((valid.reduce((s,r) => s + (r.nearestLenskartKm ?? 0), 0) / valid.length).toFixed(1));
  }, [results]);

  const avgDrAgarwal = useMemo(() => {
    const valid = results.filter(r => r.nearestDrAgarwalKm != null);
    if (valid.length === 0) return null;
    return parseFloat((valid.reduce((s,r) => s + (r.nearestDrAgarwalKm ?? 0), 0) / valid.length).toFixed(1));
  }, [results]);

  const avgLawrenceMayo = useMemo(() => {
    const valid = results.filter(r => r.nearestLawrenceMayoKm != null);
    if (valid.length === 0) return null;
    return parseFloat((valid.reduce((s,r) => s + (r.nearestLawrenceMayoKm ?? 0), 0) / valid.length).toFixed(1));
  }, [results]);

  const panelMode = results.length === 0
    ? (userLocation ? 'geo' : 'welcome')
    : (selectedId ? 'selected' : 'active');

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      const brand = p.partner === 'Dr.Agarwal' ? 'Dr Agarwal' : p.partner;
      return activeFilters.includes(brand);
    });
  }, [partners, activeFilters]);

  const lenskartCount = useMemo(() =>
    partners.filter(p => p.partner === 'Lenskart').length, [partners]);
  const drAgarwalCount = useMemo(() =>
    partners.filter(p => p.partner === 'Dr.Agarwal').length, [partners]);
  const lawrenceMayoCount = useMemo(() =>
    partners.filter(p => p.partner === 'Lawrence & Mayo').length, [partners]);

  const nearestToUser = useMemo(() => {
    if (!userLocation || partners.length === 0) return null;
    const calc = (brand: string) => {
      const filtered = partners.filter(p => p.partner === brand);
      let best: typeof partners[0] | null = null;
      let bestDist = Infinity;
      filtered.forEach(p => {
        const d = Math.sqrt(
          Math.pow(p.lat - userLocation.lat, 2) + Math.pow(p.lng - userLocation.lng, 2)
        );
        if (d < bestDist) { bestDist = d; best = p; }
      });
      // Convert degrees to km approx
      const km = bestDist * 111;
      return best ? { store: best, km: parseFloat(km.toFixed(1)) } : null;
    };
    return {
      lenskart: calc('Lenskart'),
      drAgarwal: calc('Dr.Agarwal'),
      lawrenceMayo: calc('Lawrence & Mayo'),
    };
  }, [userLocation, partners]);

  // Recalculate all results when radius or filtered partners change
  useEffect(() => {
    if (results.length === 0 || partners.length === 0) return;
    setResults(prev => prev.map(r => analyzeOfficeCoverage(r.office, filteredPartners, radiusKm)));
  }, [radiusKm, filteredPartners]);

  // Load partner data once on mount
  useEffect(() => {
    getAllPartners()
      .then(setPartners)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {} // user declined — stay on default view silently
    );
  }, []);

  const addOffice = useCallback((office: Office) => {
    if (partners.length === 0) return;
    setResults((prev) => {
      if (prev.find((r) => r.office.id === office.id)) return prev;
      const namedOffice = {
        ...office,
        name: office.name || `Office ${prev.length + 1}`
      };
      return [...prev, analyzeOfficeCoverage(namedOffice, filteredPartners, radiusKm)];
    });
  }, [filteredPartners, radiusKm]);

  const removeOffice = (id: string) =>
    setResults((prev) => prev.filter((r) => r.office.id !== id));

  const clearAll = () => { setResults([]); setSelectedId(null); };

  const addQuickCities = () => {
    if (partners.length === 0) return;
    const now = new Date().toISOString();
    const newResults = MAJOR_CITIES.map((city, index) => {
      const office: Office = {
        id: `city_${Date.now()}_${index}`,
        name: city.name,
        lat: city.lat,
        lng: city.lng,
        addedAt: now
      };
      return analyzeOfficeCoverage(office, filteredPartners, radiusKm);
    });

    setResults(prev => {
      // Filter out cities that might already be added by name to avoid duplicates if user clicks twice
      const existingNames = new Set(prev.map(r => r.office.name));
      const filteredNew = newResults.filter(r => !existingNames.has(r.office.name));
      return [...prev, ...filteredNew];
    });
  };

  const downloadReport = () => {
    if (results.length === 0 || !window.XLSX) return;

    const XLSX = window.XLSX;

    // 1. Prepare Summary Block
    let lkSum = 0, lkCount = 0;
    let daSum = 0, daCount = 0;
    let lmSum = 0, lmCount = 0;
    
    results.forEach(r => {
      if (r.nearestLenskartKm !== null) { lkSum += r.nearestLenskartKm; lkCount++; }
      if (r.nearestDrAgarwalKm !== null) { daSum += r.nearestDrAgarwalKm; daCount++; }
      if (r.nearestLawrenceMayoKm !== null) { lmSum += r.nearestLawrenceMayoKm; lmCount++; }
    });

    const avgLk = lkCount > 0 ? `${(lkSum / lkCount).toFixed(1)} km` : '—';
    const avgDa = daCount > 0 ? `${(daSum / daCount).toFixed(1)} km` : '—';
    const avgLm = lmCount > 0 ? `${(lmSum / lmCount).toFixed(1)} km` : '—';

    const excellentCount = results.filter(r => r.rating === 'Excellent').length;
    const goodCount = results.filter(r => r.rating === 'Good').length;
    const excellentPct = Math.round((excellentCount / results.length) * 100);
    const goodPct = Math.round((goodCount / results.length) * 100);
    
    let overallRating = "Limited";
    if (excellentPct >= 70) overallRating = "Excellent";
    else if (excellentPct + goodPct >= 50) overallRating = "Good";

    const summaryData = [
      ["VisionSure Network Locator - Coverage Report", "", "", "", "", ""],
      ["", "", "", "", "", ""],
      ["SUMMARY", "", "", "", "", ""],
      ["Total Locations Analyzed", results.length, "", "", "", ""],
      ["Avg. Distance to Lenskart", avgLk, "", "", "", ""],
      ["Avg. Distance to Dr Agarwal", avgDa, "", "", "", ""],
      ["Avg. Distance to Lawrence & Mayo", avgLm, "", "", "", ""],
      ["Overall Coverage Rating", overallRating, "", "", "", ""],
      ["", "", "", "", "", ""],
    ];

    // 2. Prepare Data Table
    const headers = [
      "Location",
      "Nearest Lenskart",
      "Nearest Dr Agarwal",
      "Nearest Lawrence & Mayo",
      "Total Stores Within Radius",
      "Rating",
    ];

    const tableData = results.map((r) => {
      const lk = formatPartnerDisplay(r.nearestLenskart);
      const da = formatPartnerDisplay(r.nearestDrAgarwal);
      const lm = formatPartnerDisplay(r.nearestLawrenceMayo);

      const lkCell = r.nearestLenskart ? `${lk.line1} (${r.nearestLenskartKm?.toFixed(1)} km)` : '—';
      const daCell = r.nearestDrAgarwal ? `${da.line1} (${r.nearestDrAgarwalKm?.toFixed(1)} km)` : '—';
      const lmCell = r.nearestLawrenceMayo ? `${lm.line1} (${r.nearestLawrenceMayoKm?.toFixed(1)} km)` : '—';

      return [
        r.office.name,
        lkCell,
        daCell,
        lmCell,
        r.countWithinRadius,
        r.rating,
      ];
    });

    // Combine all data
    const allData = [...summaryData, headers, ...tableData];
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // 3. Styling
    const range = XLSX.utils.decode_range(ws['!ref']!);
    const headerRowIdx = summaryData.length; // Row 10 (0-indexed 9)

    // Common styles
    const borderStyle = {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellRef];
        if (!cell) continue;

        // Default style
        cell.s = {
          font: { name: "Arial", sz: 10 },
          alignment: { vertical: "center", wrapText: true },
          border: borderStyle
        };

        // Title styling
        if (R === 0) {
          cell.s = {
            font: { color: { rgb: "360679" }, bold: true, sz: 16 },
            alignment: { vertical: "center" }
          };
        }

        // Summary Label styling
        if (R === 2) {
          cell.s = {
            font: { bold: true, sz: 12, name: "Arial" },
            fill: { patternType: "solid", fgColor: { rgb: "F3F4F6" } },
            alignment: { vertical: "center" }
          };
        }

        // Summary Content styling
        if (R >= 3 && R <= 7) {
          if (C === 0) {
            cell.s.font.bold = true;
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "F9FAFB" } };
          }
          if (C === 1) {
            cell.s.alignment.horizontal = "left";
            if (R === 7) { // Overall Rating color
              let color = "000000";
              if (cell.v === 'Excellent') color = "059669";
              else if (cell.v === 'Good') color = "D97706";
              else if (cell.v === 'Limited') color = "DC2626";
              cell.s.font.color = { rgb: color };
              cell.s.font.bold = true;
            }
          }
        }

        // Table Header styling
        if (R === headerRowIdx) {
          cell.s = {
            fill: { patternType: "solid", fgColor: { rgb: "360679" } },
            font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11, name: "Arial" },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: borderStyle
          };
        }

        // Table Data styling
        if (R > headerRowIdx) {
          // Alternating row colors
          const isAlt = (R - headerRowIdx) % 2 === 0;
          if (isAlt) {
            cell.s.fill = { patternType: "solid", fgColor: { rgb: "F9FAFB" } };
          }

          // Total Stores column (Bold)
          if (C === 4) {
            cell.s.font.bold = true;
            cell.s.alignment.horizontal = "center";
          }

          // Rating column (Colors)
          if (C === 5) {
            let color = "000000";
            if (cell.v === 'Excellent') color = "059669";
            else if (cell.v === 'Good') color = "D97706";
            else if (cell.v === 'Limited') color = "DC2626";
            cell.s.font.color = { rgb: color };
            cell.s.font.bold = true;
            cell.s.alignment.horizontal = "center";
          }
        }
      }
    }

    // Freeze Header Row
    ws['!freeze'] = { xSplit: 0, ySplit: headerRowIdx + 1, topLeftCell: `A${headerRowIdx + 2}`, activePane: 'bottomLeft', state: 'frozen' };

    // Column widths
    ws['!cols'] = [
      { wch: 30 }, // Location
      { wch: 45 }, // Lenskart
      { wch: 45 }, // Dr Agarwal
      { wch: 45 }, // Lawrence Mayo
      { wch: 25 }, // Total Stores
      { wch: 15 }, // Rating
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coverage Report");
    XLSX.writeFile(wb, "VisionSure_Network_Locator_Report.xlsx");
  };

  // Pre-compute summary for the scorecard
  const filteredResults = useMemo(() => {
    return activeFilters.includes('office') ? results : [];
  }, [results, activeFilters]);

  const summary: CoverageSummary = {
    total:       filteredResults.length,
    excellent:   filteredResults.filter((r) => r.rating === 'Excellent').length,
    good:        filteredResults.filter((r) => r.rating === 'Good').length,
    limited:     filteredResults.filter((r) => r.rating === 'Limited').length,
    excellentPct: filteredResults.length
      ? Math.round((filteredResults.filter((r) => r.rating === 'Excellent').length / filteredResults.length) * 100)
      : 0,
    goodPct: filteredResults.length
      ? Math.round((filteredResults.filter((r) => r.rating === 'Good').length / filteredResults.length) * 100)
      : 0,
  };

  function handleCTA() {
    window.open('https://bevisionsure.com/contact', '_blank');
  }

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen lg:h-screen bg-gray-50 lg:overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between bg-white border-b border-gray-200 shrink-0 relative z-50" style={{ padding: '0 20px', height: 60 }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#360679' }}>
            <span className="text-white text-xs font-bold">VS</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-800">VisionSure Network Locator</h1>
            <p className="text-xs text-gray-400 hidden sm:block">Partner network coverage for your offices</p>
          </div>
        </div>

        {/* Centre: search bar + filters + manual */}
        <div className="flex items-center flex-1 justify-center gap-4">
          <SearchBar 
            onAdd={addOffice} 
            externalRef={searchInputRef} 
            variant="header" 
            disabled={loading}
          />
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
            {[
              { id: 'Lenskart', color: '#020047' },
              { id: 'Dr Agarwal', label: "Dr Agarwal's", color: '#0252a1' },
              { id: 'Lawrence & Mayo', color: '#E51E1E' },
            ].map(item => {
              const active = activeFilters.includes(item.id);
              return (
                <button key={item.id}
                  onClick={() => setActiveFilters(prev =>
                    prev.includes(item.id) ? prev.filter(f => f !== item.id) : [...prev, item.id]
                  )}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600, background: 'none',
                    border: 'none', cursor: 'pointer', padding: '4px 2px',
                    color: active ? '#1d1a21' : '#9ca3af',
                    opacity: active ? 1 : 0.5
                  }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                  {item.label ?? item.id}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowManualPanel(!showManualPanel)}
            style={{
              padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
              background: 'transparent', border: '1.5px solid #e7e0ea', color: '#4a4552',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            Manual Input
          </button>

          <button
            onClick={addQuickCities}
            disabled={loading}
            style={{
              padding: '7px 16px', borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: 'linear-gradient(135deg, #360679 0%, #1e004b 100%)',
              color: 'white', border: 'none', cursor: 'pointer',
              opacity: loading ? 0.5 : 1, whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            ⚡ Quick Check
          </button>
        </div>
      </header>

      {/* Manual Input Panel */}
      {showManualPanel && (
        <div style={{
          position: 'fixed',
          top: 64, // below header
          right: 32,
          width: 320,
          zIndex: 60,
          background: 'rgba(254, 247, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0px 12px 32px rgba(30,0,75,0.08)',
          borderRadius: 16,
          padding: 16,
          border: '1px solid rgba(54, 6, 121, 0.1)'
        }}>
          <SearchBar 
            onAdd={addOffice} 
            variant="manual-panel" 
            onAdded={() => setShowManualPanel(false)}
            disabled={loading}
          />
        </div>
      )}

      {/* Split screen content */}
      {results.length === 0 ? (
        <div style={{ 
          position: 'fixed', 
          top: 52, 
          left: 0, right: 0, bottom: 0,
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <MapView
              partners={filteredPartners}
              results={filteredResults}
              selectedId={selectedId}
              activeFilters={activeFilters}
              highlightType={highlightType}
              onHighlightEnd={() => setHighlightType(null)}
              userLocation={userLocation}
              nearestToUser={nearestToUser}
            />
          </div>
          <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 30 }}>
            <LeftPanel 
              mode={panelMode}
              lenskartCount={lenskartCount}
              drAgarwalCount={drAgarwalCount}
              lawrenceMayoCount={lawrenceMayoCount}
              nearestToUser={nearestToUser}
              results={results}
              summary={summary}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeOffice}
              radiusKm={radiusKm}
              onDownload={downloadReport}
              clearAll={clearAll}
              avgLenskart={avgLenskart}
              avgDrAgarwal={avgDrAgarwal}
              avgLawrenceMayo={avgLawrenceMayo}
            />
          </div>
        </div>
      ) : (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, overflow: 'hidden' }}
             ref={el => { if (el) { const h = document.querySelector('header')?.offsetHeight ?? 52; el.style.top = h + 'px'; } }}>
          
          <div style={{ position: 'absolute', top: 24, left: 24, zIndex: 30 }}>
            <LeftPanel 
              mode={panelMode}
              lenskartCount={lenskartCount}
              drAgarwalCount={drAgarwalCount}
              lawrenceMayoCount={lawrenceMayoCount}
              nearestToUser={nearestToUser}
              results={results}
              summary={summary}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRemove={removeOffice}
              radiusKm={radiusKm}
              onDownload={downloadReport}
              clearAll={clearAll}
              avgLenskart={avgLenskart}
              avgDrAgarwal={avgDrAgarwal}
              avgLawrenceMayo={avgLawrenceMayo}
            />
          </div>

          {/* Map — fills everything */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <MapView
              partners={filteredPartners}
              results={filteredResults}
              selectedId={selectedId}
              activeFilters={activeFilters}
              highlightType={highlightType}
              onHighlightEnd={() => setHighlightType(null)}
              userLocation={userLocation}
              nearestToUser={nearestToUser}
            />
          </div>
        </div>
      )}
    </div>
  );
}
