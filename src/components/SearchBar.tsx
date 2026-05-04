// src/components/SearchBar.tsx
import React, { useState, useRef } from 'react';
import type { Office } from '../types';
import pincodeData from '../data/pincodes_merged.json';

interface PincodeEntry {
  p: string; // pincode
  n: string; // name
  la: number; // lat
  lo: number; // lon
  d: string; // district
  s: string; // state
}

interface Props {
  onAdd:    (office: Office) => void;
  disabled?: boolean;
  externalRef?: React.RefObject<HTMLInputElement | null>;
  variant?: 'default' | 'header' | 'manual-panel';
  onAdded?: () => void;
}

function uid() {
  return `office_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SearchBar({ onAdd, disabled, externalRef, variant = 'default', onAdded }: Props) {
  // Use externalRef or internalRef
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = externalRef || internalInputRef;

  const [searchValue, setSearchValue] = useState('');
  const [pincodeResults, setPincodeResults] = useState<PincodeEntry[]>([]);
  const [error, setError]         = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    setError(null);

    // If numeric and 3+ chars, search locally
    if (/^\d{3,}$/.test(val)) {
      const results = (pincodeData as PincodeEntry[])
        .filter(entry => entry.p.startsWith(val))
        .slice(0, 8);
      setPincodeResults(results);
    } else {
      setPincodeResults([]);
    }
  };

  const handleSelectPincode = (entry: PincodeEntry) => {
    onAdd({
      id: uid(),
      name: `${entry.n}, ${entry.s || entry.d}`,
      lat: entry.la,
      lng: entry.lo,
      addedAt: new Date().toISOString()
    });
    setSearchValue('');
    setPincodeResults([]);
    if (activeInputRef.current) activeInputRef.current.value = '';
    onAdded?.();
  };

  const PincodeDropdown = () => {
    if (pincodeResults.length === 0) return null;
    return (
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0, 
        background: 'white', border: '1px solid #e1e1e1', borderRadius: '0 0 12px 12px',
        boxShadow: '0 8px 16px rgba(30, 0, 75, 0.12)', zIndex: 1000, 
        marginTop: 4, maxHeight: 280, overflowY: 'auto'
      }}>
        {pincodeResults.map((entry, idx) => (
          <div 
            key={`${entry.p}-${idx}-${entry.n}`}
            onMouseDown={() => handleSelectPincode(entry)}
            style={{
              padding: '10px 16px', fontSize: 13, cursor: 'pointer',
              borderBottom: idx < pincodeResults.length - 1 ? '1px solid #f5f5f5' : 'none',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f7f4f9'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={{ fontWeight: 600, color: '#360679' }}>{entry.p}</span> — {entry.n}, {entry.s || entry.d}
          </div>
        ))}
      </div>
    );
  };

  if (variant === 'header') {
    return (
      <div style={{ flex: 1, width: '100%', maxWidth: 480, margin: '0 32px', position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: '#7b7483', fontSize: 14, pointerEvents: 'none'
        }}>🔍</span>
        <input
          ref={activeInputRef as any}
          style={{
            width: '100%', 
            paddingLeft: 34, 
            paddingRight: 16, 
            paddingTop: 10, 
            paddingBottom: 10,
            background: '#f2ecf5', 
            border: '1px solid transparent', 
            borderRadius: 99,
            fontSize: 13, color: '#1d1a21', outline: 'none', fontFamily: 'inherit',
            transition: 'all 0.2s ease'
          }}
          placeholder="Search by pincode (e.g. 110001)..."
          value={searchValue}
          onChange={handleInputChange}
          onFocus={e => {
            e.currentTarget.style.boxShadow = '0 0 0 2px rgba(54,6,121,0.25)';
            e.currentTarget.style.background = 'white';
            e.currentTarget.style.borderColor = '#360679';
            setIsFocused(true);
          }}
          onBlur={e => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = '#f2ecf5';
            e.currentTarget.style.borderColor = 'transparent';
            setTimeout(() => setIsFocused(false), 180);
          }}
          disabled={disabled}
        />
        {isFocused && <PincodeDropdown />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#7b7483', marginBottom: 4, display: 'block' }}>
          Add Location by Pincode
        </label>
        <input
          ref={activeInputRef as any}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none transition-all"
          style={{
            boxShadow: isFocused ? '0 0 0 2px rgba(54,6,121,0.15)' : 'none',
            borderColor: isFocused ? '#360679' : '#e5e7eb'
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 180)}
          onChange={handleInputChange}
          value={searchValue}
          placeholder="Enter 6-digit pincode..."
          disabled={disabled}
        />
        {isFocused && <PincodeDropdown />}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
