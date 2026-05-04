// src/types/index.ts

export interface Partner {
  id: string | number;      // Lenskart uses strings, Dr Agarwal uses numbers
  partner: string;
  storeName: string;
  address: string;
  lat: number;
  lng: number;
  city: string;
  state?: string;           // Lenskart has this, Dr Agarwal doesn't — both fine
  phone?: string | null;
  pinCode?: string;
}

// Store is just an alias — your existing files use Store, our components use Partner
// They are the same shape, so this alias means zero refactoring needed
export type Store = Partner;

export interface Office {
  id: string;
  name: string;
  lat: number;
  lng: number;
  pincode?: string;
  addedAt: string;
}

export type CoverageRating = 'Excellent' | 'Good' | 'Limited';

export interface CoverageResult {
  office: Office;
  nearestPartner: Partner | null;
  nearestDistanceKm: number | null;
  nearestLenskart: Partner | null;
  nearestLenskartKm: number | null;
  nearestDrAgarwal: Partner | null;
  nearestDrAgarwalKm: number | null;
  nearestLawrenceMayo: Partner | null;
  nearestLawrenceMayoKm: number | null;
  partnersWithinRadius: Partner[];
  countWithinRadius: number;
  rating: CoverageRating;
}

export interface CoverageSummary {
  total: number;
  excellent: number;
  good: number;
  limited: number;
  excellentPct: number;
  goodPct: number;
}
