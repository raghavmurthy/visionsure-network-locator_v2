// src/components/MapView.tsx
// Leaflet map. Partner pins are color-coded by brand.
// Office pins are violet. Clicking any pin shows a popup.
//
// Install deps if not already present:
//   npm install leaflet react-leaflet
//   npm install -D @types/leaflet

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  MapContainer, TileLayer, CircleMarker, Popup, useMap, Polyline, Tooltip, Marker
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Partner, CoverageResult } from '../types';
import { PARTNER_BRANDS, OFFICE_PIN_COLOR } from '../constants/config';

// Fix Leaflet's broken default icon paths in Vite builds
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import iconShadowUrl from 'leaflet/dist/images/marker-shadow.png';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl: iconShadowUrl });

const INDIA_BOUNDS: L.LatLngBoundsExpression = [[6.5, 68.0], [37.5, 97.5]];
const DEFAULT_CENTER: [number, number] = [22.5, 82.0];
const DEFAULT_ZOOM = 5;

// Helper to create a teardrop pin icon
const createPinIcon = (color: string, size: number = 24, isBreathing: boolean = false, isDimmed: boolean = false) => {
  const scale = isBreathing ? 1.4 : 1;
  const opacity = isDimmed ? 0.3 : 1;
  const width = size * scale;
  const height = (size * 1.33) * scale;
  
  return L.divIcon({
    className: `bg-transparent ${isBreathing ? 'animate-pulse' : ''}`,
    html: `
      <svg width="${width}" height="${height}" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: ${opacity}; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3))">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${color}" stroke="white" stroke-width="${size < 15 ? 1 : 1.5}"/>
        <circle cx="12" cy="12" r="${size < 15 ? 3 : 4}" fill="white"/>
      </svg>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height]
  });
};

// Helper to create a subtle distance label icon
const createDistanceIcon = (distance: number) => L.divIcon({
  className: 'bg-transparent',
  html: `<div class="text-[11px] font-bold text-gray-700 bg-white/80 px-1.5 py-0.5 rounded border border-gray-300 shadow-sm backdrop-blur-[2px]">${distance.toFixed(1)} km</div>`,
  iconSize: [46, 18],
  iconAnchor: [23, 9]
});

// Auto-fits map bounds whenever offices are added or cleared
function AutoFit({ results }: { results: CoverageResult[] }) {
  const map = useMap();
  useEffect(() => {
    if (results.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    const points: [number, number][] = results.map((r) => [r.office.lat, r.office.lng] as [number, number]);
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 12 });
  }, [results, map]);
  return null;
}

// Handles panning to selected office
function SelectionHandler({ selectedId, results }: { selectedId?: string | null, results: CoverageResult[] }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const result = results.find(r => r.office.id === selectedId);
    if (result) {
      map.flyTo([result.office.lat, result.office.lng], 14, { duration: 1.5 });
    }
  }, [selectedId, results, map]);
  return null;
}

// Handles initial flyTo when user location is detected
function UserLocationHandler({ location }: { location?: { lat: number; lng: number } | null }) {
  const map = useMap();
  const prevLocation = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (location && !prevLocation.current) {
      map.flyTo([location.lat, location.lng], 13, { duration: 1.8 });
    }
    prevLocation.current = location || null;
  }, [location, map]);

  return null;
}

// Handles proximity lines from user to nearest partners
function ProximityLines({ 
  userLocation, 
  nearestToUser, 
  resultsCount 
}: { 
  userLocation?: { lat: number; lng: number } | null;
  nearestToUser?: MapViewProps['nearestToUser'];
  resultsCount: number;
}) {
  const map = useMap();
  const linesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    // Clear existing lines
    linesRef.current.forEach(l => l.remove());
    linesRef.current = [];

    // Only draw if results.length === 0 (Screen 1B)
    if (resultsCount > 0 || !userLocation || !nearestToUser) return;

    const pairs = [
      { data: nearestToUser.lenskart, color: '#020047' },
      { data: nearestToUser.lawrenceMayo, color: '#E51E1E' },
      { data: nearestToUser.drAgarwal, color: '#0252a1' },
    ];

    pairs.forEach(p => {
      if (p.data) {
        const poly = L.polyline(
          [[userLocation.lat, userLocation.lng], [p.data.store.lat, p.data.store.lng]],
          { color: p.color, weight: 1.5, opacity: 0.5, dashArray: '4 4' }
        ).addTo(map);
        linesRef.current.push(poly);
      }
    });

    return () => {
      linesRef.current.forEach(l => l.remove());
      linesRef.current = [];
    };
  }, [userLocation, nearestToUser, resultsCount, map]);

  return null;
}

interface MapViewProps {
  partners: Partner[];
  results:  CoverageResult[];
  selectedId?: string | null;
  activeFilters: string[];
  highlightType: string | null;
  onHighlightEnd: () => void;
  userLocation?: { lat: number; lng: number } | null;
  nearestToUser?: {
    lenskart: { store: { lat: number; lng: number; storeName: string }; km: number } | null;
    drAgarwal: { store: { lat: number; lng: number; storeName: string }; km: number } | null;
    lawrenceMayo: { store: { lat: number; lng: number; storeName: string }; km: number } | null;
  } | null;
}

export function MapView({ 
  partners, 
  results, 
  selectedId, 
  activeFilters, 
  highlightType, 
  onHighlightEnd,
  userLocation,
  nearestToUser
}: MapViewProps) {
  const [showAllPartners, setShowAllPartners] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<Set<string | number>>(new Set());
  const [breathingType, setBreathingType] = useState<string | null>(null);

  // Legend highlight logic
  useEffect(() => {
    if (!highlightType) return;
    
    setBreathingType(highlightType);
    const timer = setTimeout(() => {
      setBreathingType(null);
      onHighlightEnd();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [highlightType, onHighlightEnd]);

  // Standout animation logic for nearest partners on office selection
  useEffect(() => {
    if (!selectedId) {
      setHighlightedIds(new Set());
      return;
    }

    const result = results.find(r => r.office.id === selectedId);
    if (result) {
      const ids = new Set<string | number>();
      if (result.nearestLenskart) ids.add(result.nearestLenskart.id);
      if (result.nearestDrAgarwal) ids.add(result.nearestDrAgarwal.id);
      if (result.nearestLawrenceMayo) ids.add(result.nearestLawrenceMayo.id);
      
      setHighlightedIds(ids);
      
      const timer = setTimeout(() => {
        setHighlightedIds(new Set());
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedId, results]);

  // If results exist, we only show all partners if the toggle is ON.
  // Otherwise, we show only partners within radius of any office.
  // If no results, we show all partners.
  const displayedPartners = useMemo(() => {
    if (results.length === 0) return partners;
    if (showAllPartners) return partners;

    // Get unique partners within radius of any office
    const partnerIds = new Set<string | number>();
    const nearby: Partner[] = [];
    results.forEach(r => {
      r.partnersWithinRadius.forEach(p => {
        if (!partnerIds.has(p.id)) {
          partnerIds.add(p.id);
          nearby.push(p);
        }
      });
    });
    return nearby;
  }, [partners, results, showAllPartners]);

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={4}
        maxZoom={17}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        className="h-full w-full rounded-xl"
      >
        <TileLayer
          url="https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&hl=en&region=IN"
          subdomains={['0','1','2','3']}
          attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
          maxZoom={17}
        />

        <AutoFit results={results} />
        <SelectionHandler selectedId={selectedId} results={results} />
        <UserLocationHandler location={userLocation} />
        <ProximityLines 
          userLocation={userLocation} 
          nearestToUser={nearestToUser} 
          resultsCount={results.length} 
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              html: `<div style="width:14px;height:14px;border-radius:50%;background:#360679;border:2px solid white;box-shadow:0 0 0 4px rgba(54,6,121,0.15)"></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
              className: 'user-location-marker'
            })}
            zIndexOffset={1000}
          />
        )}

        {/* Connection Lines and Distance Labels */}
        {results.map((r) => {
          const lines = [];
          const isSelected = selectedId === r.office.id;
          
          if (r.nearestLenskart) {
            const midLat = (r.office.lat + r.nearestLenskart.lat) / 2;
            const midLng = (r.office.lng + r.nearestLenskart.lng) / 2;
            lines.push(
              <div key={`${r.office.id}-lk`}>
                <Polyline
                  positions={[[r.office.lat, r.office.lng], [r.nearestLenskart.lat, r.nearestLenskart.lng]]}
                  pathOptions={{ 
                    color: '#020047', 
                    weight: isSelected ? 4 : 3, 
                    dashArray: '4, 4', 
                    opacity: isSelected ? 0.9 : 0.6,
                    interactive: true
                  }}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      const map = e.target._map;
                      map.flyTo([r.nearestLenskart!.lat, r.nearestLenskart!.lng], 15);
                    }
                  }}
                >
                  <Tooltip sticky>Click to see nearest Lenskart</Tooltip>
                </Polyline>
                <Marker 
                  position={[midLat, midLng]} 
                  icon={createDistanceIcon(r.nearestLenskartKm || 0)}
                  interactive={false}
                />
              </div>
            );
          }

          if (r.nearestDrAgarwal) {
            const midLat = (r.office.lat + r.nearestDrAgarwal.lat) / 2;
            const midLng = (r.office.lng + r.nearestDrAgarwal.lng) / 2;
            lines.push(
              <div key={`${r.office.id}-da`}>
                <Polyline
                  positions={[[r.office.lat, r.office.lng], [r.nearestDrAgarwal.lat, r.nearestDrAgarwal.lng]]}
                  pathOptions={{ 
                    color: '#0252a1', 
                    weight: isSelected ? 4 : 3, 
                    dashArray: '4, 4', 
                    opacity: isSelected ? 0.9 : 0.6,
                    interactive: true
                  }}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      const map = e.target._map;
                      map.flyTo([r.nearestDrAgarwal!.lat, r.nearestDrAgarwal!.lng], 15);
                    }
                  }}
                >
                  <Tooltip sticky>Click to see nearest Dr Agarwal</Tooltip>
                </Polyline>
                <Marker 
                  position={[midLat, midLng]} 
                  icon={createDistanceIcon(r.nearestDrAgarwalKm || 0)}
                  interactive={false}
                />
              </div>
            );
          }

          if (r.nearestLawrenceMayo) {
            const midLat = (r.office.lat + r.nearestLawrenceMayo.lat) / 2;
            const midLng = (r.office.lng + r.nearestLawrenceMayo.lng) / 2;
            lines.push(
              <div key={`${r.office.id}-lm`}>
                <Polyline
                  positions={[[r.office.lat, r.office.lng], [r.nearestLawrenceMayo.lat, r.nearestLawrenceMayo.lng]]}
                  pathOptions={{ 
                    color: '#E51E1E', 
                    weight: isSelected ? 4 : 3, 
                    dashArray: '4, 4', 
                    opacity: isSelected ? 0.9 : 0.6,
                    interactive: true
                  }}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      const map = e.target._map;
                      map.flyTo([r.nearestLawrenceMayo!.lat, r.nearestLawrenceMayo!.lng], 15);
                    }
                  }}
                >
                  <Tooltip sticky>Click to see nearest Lawrence & Mayo</Tooltip>
                </Polyline>
                <Marker 
                  position={[midLat, midLng]} 
                  icon={createDistanceIcon(r.nearestLawrenceMayoKm || 0)}
                  interactive={false}
                />
              </div>
            );
          }

          return <div key={r.office.id}>{lines}</div>;
        })}

        {/* Partner pins */}
        {displayedPartners.map((p) => {
          const color = PARTNER_BRANDS[p.partner]?.color ?? '#6B7280';
          const isHighlighted = highlightedIds.has(p.id);
          const brand = p.partner === 'Dr.Agarwal' ? 'Dr Agarwal' : p.partner;
          const isBreathing = breathingType === brand;
          const isDimmed = breathingType && breathingType !== brand;
          
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={createPinIcon(color, 12, isHighlighted || isBreathing, isDimmed)}
            >
              <Popup>
                <p className="font-semibold text-sm">{p.storeName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.address}</p>
              </Popup>
            </Marker>
          );
        })}

        {/* Office pins */}
        {activeFilters.includes('office') && results.map((r) => {
          const isBreathing = breathingType === 'office';
          const isDimmed = breathingType && breathingType !== 'office';
          const isSelected = selectedId === r.office.id;

          return (
            <Marker
              key={r.office.id}
              position={[r.office.lat, r.office.lng]}
              icon={createPinIcon(OFFICE_PIN_COLOR, 18, isSelected || isBreathing, isDimmed)}
            >
              <Popup>
                <p className="font-semibold text-sm">{r.office.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nearest: {r.nearestPartner ? `${r.nearestPartner.storeName} (${r.nearestDistanceKm} km)` : 'No partners found'}
                </p>
                <p className="text-xs text-gray-500">
                  {r.countWithinRadius} stores within radius
                </p>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Toggle Button */}
      {results.length > 0 && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={() => setShowAllPartners(!showAllPartners)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {showAllPartners ? 'Hide other partners' : 'Show all partners'}
          </button>
        </div>
      )}
    </div>
  );
}
