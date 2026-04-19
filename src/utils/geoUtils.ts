// src/utils/geoUtils.ts
// Pure functions — no React, no side effects.
// Can be copy-pasted to a Node.js backend unchanged.

import type { Partner, Office, CoverageResult, CoverageRating } from '../types';
import { COVERAGE_THRESHOLDS, DEFAULT_RADIUS_KM } from '../constants/config';

// ── Haversine formula ────────────────────────────────────────────────────────
// Returns straight-line distance in km between two lat/lng points.
// Accurate to ~0.5% for distances under 1000 km — sufficient for city-level coverage.

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function getDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Coverage rating ──────────────────────────────────────────────────────────
// Thresholds come from config.ts — tune there without touching this logic.

export function getCoverageRating(
  nearestKm: number,
  countWithinRadius: number
): CoverageRating {
  const { excellent, good } = COVERAGE_THRESHOLDS;
  if (nearestKm <= excellent.maxNearestKm || countWithinRadius >= excellent.minCount)
    return 'Excellent';
  if (nearestKm <= good.maxNearestKm || countWithinRadius >= good.minCount)
    return 'Good';
  return 'Limited';
}

// ── Core analysis ────────────────────────────────────────────────────────────
// Given one office + all partners, returns the full CoverageResult.
// This is the function your backend API will eventually mirror.

export function analyzeOfficeCoverage(
  office: Office,
  partners: Partner[],
  radiusKm: number = DEFAULT_RADIUS_KM
): CoverageResult {
  const ranked = partners
    .map((p) => ({
      partner: p,
      distanceKm: getDistanceKm(office.lat, office.lng, p.lat, p.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = ranked[0] || null;
  const withinRadius = ranked.filter((p) => p.distanceKm <= radiusKm);

  // Brand-specific nearest
  const lenskart = ranked.find((r) => r.partner.partner === 'Lenskart');
  const drAgarwal = ranked.find((r) => r.partner.partner === 'Dr Agarwal' || r.partner.partner === 'Dr.Agarwal');
  const lawrenceMayo = ranked.find((r) => r.partner.partner === 'Lawrence & Mayo');

  return {
    office,
    nearestPartner: nearest?.partner ?? null,
    nearestDistanceKm: nearest ? parseFloat(nearest.distanceKm.toFixed(1)) : null,
    nearestLenskart: lenskart?.partner ?? null,
    nearestLenskartKm: lenskart ? parseFloat(lenskart.distanceKm.toFixed(1)) : null,
    nearestDrAgarwal: drAgarwal?.partner ?? null,
    nearestDrAgarwalKm: drAgarwal ? parseFloat(drAgarwal.distanceKm.toFixed(1)) : null,
    nearestLawrenceMayo: lawrenceMayo?.partner ?? null,
    nearestLawrenceMayoKm: lawrenceMayo ? parseFloat(lawrenceMayo.distanceKm.toFixed(1)) : null,
    partnersWithinRadius: withinRadius.map((p) => p.partner),
    countWithinRadius: withinRadius.length,
    rating: nearest ? getCoverageRating(nearest.distanceKm, withinRadius.length) : 'Limited',
  };
}

// ── Partner Display Logic ───────────────────────────────────────────────────
// Extracts a meaningful locality from storeName and formats it for display.

export function formatPartnerDisplay(partner: Partner | null): { line1: string; line2?: string } {
  if (!partner) return { line1: '—' };

  let locality = partner.storeName;
  const isLenskart = partner.partner === 'Lenskart';
  const isLawrenceMayo = partner.partner === 'Lawrence & Mayo';

  // Lenskart specific: strip "Flagship Store" from the beginning
  if (isLenskart && locality.toLowerCase().startsWith('flagship store')) {
    locality = locality.slice(14).trim();
  }

  // Lawrence & Mayo specific: strip "Lawrence & Mayo -" from the beginning
  if (isLawrenceMayo && locality.startsWith('Lawrence & Mayo -')) {
    locality = locality.slice(18).trim();
  }

  // Check for generic words
  const genericWords = [
    'flagship store',
    'eye clinic',
    'eye super speciality hospital',
    'eye hospital'
  ];

  const isGeneric = genericWords.some(word => locality.toLowerCase().includes(word));

  if (isGeneric) {
    return { line1: partner.city };
  }

  // If locality is same as city, just show one line
  if (locality.toLowerCase() === partner.city.toLowerCase()) {
    return { line1: partner.city };
  }

  return { line1: locality, line2: partner.city };
}

// ── Google Maps link parser ──────────────────────────────────────────────────
// Handles full browser URLs. Short goo.gl links are NOT supported client-side
// (they require a server-side redirect follow). Show the user a message instead.

export function extractNameFromUrl(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url);
    // Pattern for /maps/place/Name/@lat,lng
    const placeMatch = decoded.match(/\/maps\/place\/([^/@?]+)/);
    if (placeMatch) {
      return placeMatch[1].replace(/\+/g, ' ').trim();
    }
    // Pattern for search?q=Name
    const qMatch = decoded.match(/[?&]q=([^&@]+)/);
    if (qMatch) {
      // If q is just coords, ignore it
      if (qMatch[1].match(/^-?\d+\.\d+,-?\d+\.\d+$/)) return null;
      return qMatch[1].replace(/\+/g, ' ').trim();
    }
  } catch (e) {
    // Ignore decode errors
  }
  return null;
}

export function extractCoordsFromUrl(
  url: string
): { lat: number; lng: number } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /\/(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}
