// src/services/partnerService.ts
// Imports from your existing store files — no JSON needed.
// To move to a real API later, swap the getAllPartners() body only.

import type { Partner } from '../types';
import { allStores } from '../data/stores';

export async function getAllPartners(): Promise<Partner[]> {
  // ✅ MVP — reads from your typed store arrays
  return Promise.resolve(allStores as Partner[]);

  // 🔁 Production (uncomment when backend is ready):
  // const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/partners`);
  // if (!res.ok) throw new Error(`Partner fetch failed: ${res.status}`);
  // return res.json();
}

export function getUniqueBrands(partners: Partner[]): string[] {
  return [...new Set(partners.map((p) => p.partner))].sort();
}

export function getUniqueCities(partners: Partner[]): string[] {
  return [...new Set(partners.map((p) => p.city))].sort();
}
