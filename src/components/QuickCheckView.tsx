import { CoverageResult } from '../types';

interface QuickCheckViewProps {
  results: CoverageResult[];
  onClose: () => void;
  onDownload: () => void;
  onSelect: (id: string) => void;
}

export default function QuickCheckView({ results, onClose, onDownload, onSelect }: QuickCheckViewProps) {
  const top10 = results.slice(0, 10);
  
  const stateMapping: Record<string, string> = {
    'Mumbai': 'Maharashtra',
    'Delhi': 'NCR',
    'Bangalore': 'Karnataka',
    'Pune': 'Maharashtra',
    'Hyderabad': 'Telangana',
    'Chennai': 'Tamil Nadu',
    'Kolkata': 'West Bengal',
    'Ahmedabad': 'Gujarat',
    'Gurugram': 'Haryana',
    'Surat': 'Gujarat'
  };

  const excellentCount = results.filter(r => r.rating === 'Excellent').length;
  const goodCount = results.filter(r => r.rating === 'Good').length;
  const limitedCount = results.filter(r => r.rating === 'Limited').length;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(242, 236, 245, 0.97)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        height: 60,
        flexShrink: 0,
        background: 'rgba(254, 247, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0px 4px 20px rgba(30, 0, 75, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#360679', margin: 0 }}>VisionSure</h2>
          <div style={{ 
            width: 200, height: 32, borderRadius: 99, 
            background: '#e7e0ea', display: 'flex', alignItems: 'center', padding: '0 12px'
          }}>
            <span style={{ fontSize: 13, color: '#7b7483' }}>Search network...</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={onDownload}
            style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
              background: 'linear-gradient(135deg, #360679 0%, #1e004b 100%)',
              color: 'white', border: 'none', cursor: 'pointer'
            }}
          >
            Quick Check
          </button>
          <button 
            onClick={onClose}
            style={{
              fontSize: 24, color: '#7b7483', background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Left Panel */}
        <div style={{
          position: 'absolute', top: 20, left: 20, bottom: 20, width: 280,
          background: 'rgba(254, 247, 255, 0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 18, boxShadow: '0px 8px 32px rgba(30, 0, 75, 0.06)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          <div style={{ padding: '20px 20px 12px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#360679', margin: '0 0 2px' }}>Top 10 Business Hubs</h3>
            <p style={{ fontSize: 11, color: '#7b7483', margin: 0 }}>Real-time Coverage Index (India)</p>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px', scrollbarWidth: 'none' }}>
            {top10.map((result, idx) => {
              const isFirst = idx === 0;
              let badgeBg = '#fee2e2';
              let badgeText = '#E51E1E';
              
              if (result.rating === 'Excellent') {
                badgeBg = '#dcfce7';
                badgeText = '#16a34a';
              } else if (result.rating === 'Good') {
                badgeBg = '#fef9c3';
                badgeText = '#d97706';
              }

              return (
                <div 
                  key={result.office.id} 
                  onClick={() => { onSelect(result.office.id); onClose(); }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 10px', borderRadius: 12, cursor: 'pointer',
                    marginBottom: 6,
                    background: isFirst ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                    boxShadow: isFirst ? '0px 2px 8px rgba(30, 0, 75, 0.06)' : 'none',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => {
                    if (!isFirst) e.currentTarget.style.background = '#ffffff';
                  }}
                  onMouseLeave={e => {
                    if (!isFirst) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div style={{ 
                      width: 3, height: 24, borderRadius: 2, 
                      background: '#360679', 
                      opacity: 1.0 - (idx * 0.085)
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1d1a21', margin: 0 }}>{result.office.name}</p>
                      <p style={{ fontSize: 11, color: '#7b7483', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stateMapping[result.office.name] || 'India'}
                      </p>
                    </div>
                  </div>
                  <div style={{ 
                    padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: badgeBg, color: badgeText
                  }}>
                    {result.rating.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top-Right Panel */}
        <div style={{
          position: 'absolute', top: 20, right: 20, width: 240,
          background: 'rgba(254, 247, 255, 0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 18, boxShadow: '0px 8px 32px rgba(30, 0, 75, 0.06)',
          padding: 20
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7b7483', margin: '0 0 12px' }}>
            NATIONAL METRIC
          </p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#4a4552', margin: '0 0 2px' }}>
            {results.length} Total Locations
          </p>
          <p style={{ fontSize: 13, color: '#4a4552', margin: '0 0 20px' }}>
            <span style={{ fontWeight: 700, color: '#16a34a' }}>{excellentCount} Excellent</span> · <span style={{ fontWeight: 700, color: '#d97706' }}>{goodCount} Good</span>
          </p>
          
          <div style={{
            background: '#f8f1fb', borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20
          }}>
            <span style={{ color: '#16a34a', fontSize: 16 }}>✓</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1a21' }}>
              {limitedCount === 0 ? 'All Hubs in High Tier' : `${limitedCount} Hubs with Limited Access`}
            </span>
          </div>

          <button 
            onClick={onDownload}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10, fontWeight: 700,
              background: 'linear-gradient(135deg, #360679 0%, #1e004b 100%)',
              color: 'white', border: 'none', cursor: 'pointer'
            }}
          >
            ↓ Download National Report
          </button>
        </div>


        {/* Bottom Centre Legend */}
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          padding: '8px 24px', borderRadius: 99,
          background: 'rgba(254, 247, 255, 0.92)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0px 8px 24px rgba(30, 0, 75, 0.07)',
          display: 'flex', alignItems: 'center', gap: 20
        }}>
          {[
            { label: 'Lenskart', color: '#020047' },
            { label: "Dr. Agarwal's", color: '#0252a1' },
            { label: 'Lawrence & Mayo', color: '#E51E1E' }
          ].map((brand, i) => (
            <div key={brand.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <div style={{ width: 1, height: 12, background: '#cbc3d3', marginRight: 12 }} />}
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: brand.color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#4a4552' }}>{brand.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
