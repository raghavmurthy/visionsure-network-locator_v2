// src/constants/config.ts

export const DEFAULT_RADIUS_KM = 20;

export const COVERAGE_THRESHOLDS = {
  excellent: { maxNearestKm: 3,  minCount: 5 },
  good:      { maxNearestKm: 8,  minCount: 2 },
} as const;

export const PARTNER_BRANDS: Record<string, { color: string; label: string }> = {
  'Lenskart':        { color: '#020047', label: 'Lenskart'        },
  'Dr Agarwal':      { color: '#0252a1', label: "Dr Agarwal's"    },
  'Dr.Agarwal':      { color: '#0252a1', label: "Dr Agarwal's"    },
  'Lawrence & Mayo': { color: '#E51E1E', label: 'Lawrence & Mayo' },
};

export const COVERAGE_BADGE: Record<string, { bg: string; text: string }> = {
  Excellent: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Good:      { bg: 'bg-amber-100',   text: 'text-amber-700'  },
  Limited:   { bg: 'bg-red-100',     text: 'text-red-700'    },
};

export const MAP_CENTER: [number, number] = [20.5937, 78.9629];
export const MAP_ZOOM = 5;
export const BRAND_COLOR = '#360679';
export const OFFICE_PIN_COLOR = '#7be3ff';
