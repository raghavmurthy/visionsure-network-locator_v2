import { Partner, CoverageResult, CoverageSummary } from '../types';

interface LeftPanelProps {
  mode: 'welcome' | 'geo' | 'active' | 'selected';
  // counts
  lenskartCount: number;
  drAgarwalCount: number;
  lawrenceMayoCount: number;
  // geo
  nearestToUser: {
    lenskart: { store: Partner; km: number } | null;
    drAgarwal: { store: Partner; km: number } | null;
    lawrenceMayo: { store: Partner; km: number } | null;
  } | null;
  // offices
  results: CoverageResult[];
  summary: CoverageSummary;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  radiusKm: number;
  onDownload: () => void;
  clearAll: () => void;
  // averages
  avgLenskart: number | null;
  avgDrAgarwal: number | null;
  avgLawrenceMayo: number | null;
}

export function LeftPanel(props: LeftPanelProps) {
  const { 
    mode, 
    lenskartCount, drAgarwalCount, lawrenceMayoCount, 
    nearestToUser, 
    results, summary, selectedId, 
    onSelect, onRemove, radiusKm, onDownload, clearAll,
    avgLenskart, avgDrAgarwal, avgLawrenceMayo
  } = props;

  const selectedResult = results.find(r => r.office.id === selectedId);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: 320,
      minHeight: 200,
      maxHeight: 'calc(100vh - 100px)',
      overflowY: 'auto',
      background: 'rgba(254,247,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 20,
      boxShadow: '0px 12px 32px rgba(30,0,75,0.08)',
      border: '1px solid rgba(255,255,255,0.5)',
      scrollbarWidth: 'thin' as any,
    }}>
      {mode === 'welcome' && (
        <div style={{ padding: '28px 24px' }}>
          {/* VS logo mark */}
          <div style={{
            width: 40, height: 40, borderRadius: 10, marginBottom: 16,
            background: 'linear-gradient(135deg, #360679 0%, #1e004b 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 800
          }}>VS</div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1d1a21', margin: '0 0 6px', lineHeight: 1.3 }}>
            Check VisionSure coverage near you
          </h2>
          <p style={{ fontSize: 13, color: '#4a4552', margin: '0 0 24px', lineHeight: 1.5 }}>
            2,400+ partner locations across India. Find what's nearest to your offices.
          </p>

          {/* Partner counts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'Lenskart stores', count: lenskartCount, color: '#020047' },
              { label: 'Dr. Agarwal clinics', count: drAgarwalCount, color: '#0252a1' },
              { label: 'Lawrence & Mayo stores', count: lawrenceMayoCount, color: '#E51E1E' },
            ].map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: '#f8f1fb', borderRadius: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 13, color: '#1d1a21', fontWeight: 500 }}>{p.label}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>
                  {p.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#7b7483', textAlign: 'center', lineHeight: 1.5 }}>
            Use the search bar above to add your office locations, or allow location access when prompted.
          </p>
        </div>
      )}

      {mode === 'geo' && (
        <div style={{ padding: '24px 24px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: '0 0 4px' }}>
            Near you
          </p>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1d1a21', margin: '0 0 16px' }}>
            Nearest VisionSure partners
          </h2>

          {/* 3 partner rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Lenskart', data: nearestToUser?.lenskart, icon: '👁', color: '#020047' },
              { label: 'Lawrence & Mayo', data: nearestToUser?.lawrenceMayo, icon: '🏥', color: '#E51E1E' },
              { label: "Dr. Agarwal's", data: nearestToUser?.drAgarwal, icon: '🛡', color: '#0252a1' },
            ].filter(p => p.data != null).map(p => (
              <div key={p.label} style={{
                display: 'flex', alignItems: 'center', padding: '10px 12px',
                background: '#ffffff', borderRadius: 12,
                boxShadow: '0px 1px 4px rgba(30,0,75,0.06)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, marginRight: 10, flexShrink: 0,
                  background: '#f2ecf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1d1a21', margin: 0 }}>{p.label}</p>
                  <p style={{ fontSize: 11, color: '#4a4552', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.data!.store.storeName}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#360679', margin: 0 }}>{p.data!.km} km</p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#7b7483', textAlign: 'center' }}>
            Search above to check coverage for your offices
          </p>
        </div>
      )}

      {mode === 'active' && (
        <>
          <div style={{ padding: '20px 24px', paddingTop: 20 }}>
            {/* Fleet overview header */}
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: '0 0 4px' }}>
              Fleet Overview
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#360679', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
              {summary.excellentPct}% covered
            </p>
            <p style={{ fontSize: 12, color: '#4a4552', margin: '0 0 10px' }}>
              {summary.total} location{summary.total !== 1 ? 's' : ''} analysed
            </p>

            {/* Progress bar */}
            <div style={{ height: 4, background: '#e7e0ea', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{
                height: '100%', borderRadius: 99, transition: 'width 0.6s ease',
                background: summary.excellentPct >= 80 ? '#16a34a' : summary.excellentPct >= 50 ? '#d97706' : '#dc2626',
                width: `${summary.excellentPct}%`
              }} />
            </div>

            {/* Rating pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {summary.excellent > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#dcfce7', color: '#166534' }}>{summary.excellent} Excellent</span>}
              {summary.good > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#fef9c3', color: '#854d0e' }}>{summary.good} Good</span>}
              {summary.limited > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: '#fee2e2', color: '#991b1b' }}>{summary.limited} Limited</span>}
            </div>
          </div>

          {/* Tonal divider */}
          <div style={{ height: 1, background: '#f2ecf5' }} />

          {/* Locations list */}
          <div style={{ padding: '12px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: 0 }}>
                Locations
              </p>
              <button onClick={clearAll}
                style={{ fontSize: 11, color: '#7b7483', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                onMouseLeave={e => (e.currentTarget.style.color = '#7b7483')}>
                Clear all
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {results.map(r => {
                const ratingStyle = {
                  Excellent: { bg: '#dcfce7', text: '#166534' },
                  Good: { bg: '#fef9c3', text: '#854d0e' },
                  Limited: { bg: '#fee2e2', text: '#991b1b' }
                }[r.rating];
                return (
                  <div key={r.office.id} onClick={() => onSelect(r.office.id)}
                    style={{ padding: '10px 12px', borderRadius: 12, cursor: 'pointer', background: '#ffffff', boxShadow: '0 1px 4px rgba(30,0,75,0.06)', transition: 'box-shadow 0.15s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1d1a21', margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.office.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: ratingStyle.bg, color: ratingStyle.text }}>{r.rating}</span>
                        <button onClick={e => { e.stopPropagation(); onRemove(r.office.id); }}
                          style={{ fontSize: 16, color: '#cbc3d3', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#dc2626')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#cbc3d3')}>×</button>
                      </div>
                    </div>
                    {/* Partner distance mini-grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginTop: 7 }}>
                      {[
                        { label: 'LK', km: r.nearestLenskartKm, color: '#020047' },
                        { label: 'DA', km: r.nearestDrAgarwalKm, color: '#0252a1' },
                        { label: 'L&M', km: r.nearestLawrenceMayoKm, color: '#E51E1E' },
                      ].map(p => (
                        <div key={p.label} style={{ background: '#f8f1fb', borderRadius: 7, padding: '4px 6px', textAlign: 'center' }}>
                          <p style={{ fontSize: 9, fontWeight: 700, color: p.color, margin: 0, textTransform: 'uppercase' }}>{p.label}</p>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#1d1a21', margin: '1px 0 0' }}>
                            {p.km != null ? `${p.km.toFixed(1)}km` : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Averages */}
          {results.length > 1 && avgLenskart != null && (
            <div style={{ margin: '0 24px 12px', padding: '12px 14px', background: '#f8f1fb', borderRadius: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: '0 0 8px' }}>
                Avg. Distance to Nearest
              </p>
              {[
                { label: 'Lenskart', color: '#020047', avg: avgLenskart },
                { label: "Dr Agarwal's", color: '#0252a1', avg: avgDrAgarwal },
                { label: 'Lawrence & Mayo', color: '#E51E1E', avg: avgLawrenceMayo },
              ].map(p => (
                <div key={p.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#4a4552' }}>{p.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#1d1a21' }}>{p.avg} km</span>
                </div>
              ))}
            </div>
          )}

          {/* Download */}
          <div style={{ padding: '8px 24px 20px' }}>
            <button onClick={onDownload} style={{
              width: '100%', padding: '11px 0',
              background: 'linear-gradient(135deg, #360679 0%, #1e004b 100%)',
              color: 'white', fontWeight: 700, fontSize: 13, borderRadius: 12,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit'
            }}>↓ Download Report</button>
          </div>
        </>
      )}

      {mode === 'selected' && (
        <>
          <div style={{ padding: '20px 24px 0' }}>
            {/* Label + close */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: '#eaddff', color: '#543097', padding: '2px 8px', borderRadius: 4 }}>
                Active Selection
              </span>
              <button onClick={() => onSelect(null)}
                style={{ color: '#7b7483', fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>×</button>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1d1a21', margin: '6px 0 4px', lineHeight: 1.2 }}>
              {selectedResult?.office.name}
            </h2>
            <p style={{ fontSize: 11, color: '#4a4552', margin: 0 }}>
              {selectedResult?.office.lat.toFixed(4)}, {selectedResult?.office.lng.toFixed(4)}
            </p>
          </div>

          {/* Coverage rating card */}
          <div style={{ margin: '14px 24px 0', background: '#f8f1fb', borderRadius: 14, padding: '16px 18px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: '0 0 8px' }}>
              Coverage Rating
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Rating badge — Excellent/Good/Limited */}
              {(() => {
                const results = {
                  Excellent: { bg: '#dcfce7', text: '#166534', bar: '#16a34a', pct: 100 },
                  Good:      { bg: '#fef9c3', text: '#854d0e', bar: '#d97706', pct: 60  },
                  Limited:   { bg: '#fee2e2', text: '#991b1b', bar: '#dc2626', pct: 25  },
                };
                const styles = results[selectedResult?.rating ?? 'Limited'];
                return (
                  <div>
                    <span style={{ fontSize: 22, fontWeight: 800, padding: '4px 14px', borderRadius: 10, background: styles.bg, color: styles.text }}>
                      {selectedResult?.rating}
                    </span>
                    <p style={{ fontSize: 11, color: '#4a4552', margin: '8px 0 0' }}>
                      {selectedResult?.countWithinRadius} stores within {radiusKm} km
                    </p>
                    <div style={{ marginTop: 8, height: 4, background: '#e7e0ea', borderRadius: 99, width: 160, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: styles.bar, width: `${styles.pct}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Nearby partners */}
          <div style={{ margin: '14px 24px 0' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: '0 0 10px' }}>
              Nearby Partners
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Lenskart', km: selectedResult?.nearestLenskartKm, icon: '👁', color: '#020047' },
                { label: 'Lawrence & Mayo', km: selectedResult?.nearestLawrenceMayoKm, icon: '🏥', color: '#E51E1E' },
                { label: "Dr. Agarwal's", km: selectedResult?.nearestDrAgarwalKm, icon: '🛡', color: '#0252a1' },
              ].filter(p => p.km != null).map(p => (
                <div key={p.label} style={{
                  display: 'flex', alignItems: 'center', padding: '10px 12px',
                  background: '#ffffff', borderRadius: 12, boxShadow: '0px 1px 4px rgba(30,0,75,0.06)',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, marginRight: 10, flexShrink: 0, background: '#f2ecf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{p.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1d1a21', margin: 0 }}>{p.label}</p>
                    <p style={{ fontSize: 11, color: '#4a4552', margin: '2px 0 0' }}>{p.km?.toFixed(1)} km distance</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#360679', margin: 0 }}>{Math.round((p.km ?? 0) * 3)} min</p>
                    <p style={{ fontSize: 9, color: '#7b7483', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '1px 0 0' }}>Travel time</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Download CTA */}
          <div style={{ padding: '14px 24px 24px' }}>
            <button onClick={onDownload} style={{
              width: '100%', padding: '13px 0',
              background: 'linear-gradient(135deg, #360679 0%, #1e004b 100%)',
              color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>↓ Download Executive Report</button>
            <p style={{ fontSize: 10, textAlign: 'center', color: '#7b7483', margin: '6px 0 0', lineHeight: 1.5 }}>
              Detailed report includes partner quality ratings and coverage analysis.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
