// src/components/SearchBar.tsx
// Two input modes:
//   • Search — Google Places Autocomplete (needs VITE_GOOGLE_MAPS_API_KEY in .env)
//   • Paste  — extracts lat/lng from a full Google Maps URL
// If no API key is set, only Paste mode is available.

import React, { useState, useRef, useEffect } from 'react';
import type { Office } from '../types';
import { extractCoordsFromUrl, extractNameFromUrl } from '../utils/geoUtils';

interface Props {
  onAdd:    (office: Office) => void;
  disabled?: boolean;
  externalRef?: React.RefObject<HTMLInputElement | null>;
  variant?: 'default' | 'header' | 'manual-panel';
  onAdded?: () => void;
}

declare global {
  interface Window { google?: any; }
}

function uid() {
  return `office_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function SearchBar({ onAdd, disabled, externalRef, variant = 'default', onAdded }: Props) {
  const [internalMode, setInternalMode] = useState<'search' | 'manual'>('search');
  // Use externalRef or internalRef
  const internalInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = externalRef || internalInputRef;

  const mode = variant === 'header' ? 'search' : (variant === 'manual-panel' ? 'manual' : internalMode);

  const [manualInput, setManualInput] = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [googleReady, setReady]   = useState(false);
  const [apiError, setApiError]   = useState(false);

  const acRef     = useRef<any>(null);
  const pendingXY = useRef<{ lat: number; lng: number; name?: string } | null>(null);

  const [isFocused, setIsFocused] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  // Load the Google Maps script once
  useEffect(() => {
    const cb = '__gmInit';
    const authFailCb = 'gm_authFailure';

    if (!apiKey) {
      setApiError(true);
      return;
    }

    if (window.google?.maps?.places) { 
      setReady(true); 
      setApiError(false);
      return; 
    }

    (window as any)[cb] = () => {
      setReady(true);
      setApiError(false);
    };

    (window as any)[authFailCb] = () => {
      setApiError(true);
      setReady(false);
    };

    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${cb}`;
    s.async = true;
    s.onerror = () => setApiError(true);
    document.head.appendChild(s);

    return () => { 
      try {
        if (document.head.contains(s)) {
          document.head.removeChild(s);
        }
      } catch (e) { /* ignore */ }
      delete (window as any)[cb];
      delete (window as any)[authFailCb];
    };
  }, [apiKey]);

  // Attach Autocomplete once Google is ready
  useEffect(() => {
    if (!googleReady || !activeInputRef.current || acRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(activeInputRef.current, {
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'name', 'formatted_address'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      pendingXY.current = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        name: place.name || ''
      };
    });
    acRef.current = ac;
  }, [googleReady]);

  function submit() {
    setError(null);

    if (mode === 'manual') {
      const trimmed = manualInput.trim();
      if (!trimmed) {
        setError('Please enter a Google Maps link or coordinates.');
        return;
      }

      // 1. Detect Google Maps URL
      if (trimmed.includes('http://') || trimmed.includes('https://')) {
        if (trimmed.includes('goo.gl') || trimmed.includes('maps.app.goo.gl')) {
          setError("This is a short link. To get the full link: open Google Maps → search your address → copy the URL from the browser address bar (not the Share button).");
          return;
        }

        const coords = extractCoordsFromUrl(trimmed);
        if (!coords) {
          setError('Could not read coordinates from URL. Use the full URL from your browser bar.');
          return;
        }
        
        const extractedName = extractNameFromUrl(trimmed) || 'New Office';
        onAdd({ id: uid(), name: extractedName, ...coords, addedAt: new Date().toISOString() });
        setManualInput('');
        return;
      }

      // 2. Detect Bulk or Single Coordinate Entry
      const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
      const newOffices: Office[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(',').map(p => p.trim());
        
        if (parts.length < 3) {
          setError(`Invalid format on line ${i + 1}. Expected: Name, lat, lng`);
          return;
        }

        const name = parts.slice(0, parts.length - 2).join(', ');
        const latStr = parts[parts.length - 2];
        const lngStr = parts[parts.length - 1];

        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);

        if (isNaN(lat) || isNaN(lng)) {
          setError(`Invalid coordinates on line ${i + 1}.`);
          return;
        }

        newOffices.push({
          id: uid() + `_${i}`,
          name,
          lat,
          lng,
          addedAt: new Date().toISOString()
        });
      }

      newOffices.forEach(off => onAdd(off));
      setManualInput('');
      onAdded?.();
      return;
    }

    if (!pendingXY.current) {
      setError('Pick a location from the dropdown first.');
      return;
    }
    onAdd({ 
      id: uid(), 
      name: pendingXY.current.name || '', 
      lat: pendingXY.current.lat, 
      lng: pendingXY.current.lng, 
      addedAt: new Date().toISOString() 
    });
    pendingXY.current = null;
    if (activeInputRef.current) activeInputRef.current.value = '';
    onAdded?.();
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none disabled:opacity-50';
  const focusStyle = isFocused ? { boxShadow: '0 0 0 2px #360679' } : {};

  const helpText = {
    search: '',
    manual: '📍 Paste a Google Maps URL OR coordinates (Format: Name, lat, lng)'
  }[mode];

  if (variant === 'header') {
    return (
      <div style={{ flex: 1, maxWidth: 480, margin: '0 32px', position: 'relative' }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: '#7b7483', fontSize: 14, pointerEvents: 'none'
        }}>🔍</span>
        <input
          ref={activeInputRef as any}
          style={{
            width: '100%', paddingLeft: 34, paddingRight: 16, paddingTop: 8, paddingBottom: 8,
            background: '#f2ecf5', border: 'none', borderRadius: 99,
            fontSize: 13, color: '#1d1a21', outline: 'none', fontFamily: 'inherit'
          }}
          placeholder="Search for an office location..."
          onFocus={e => e.currentTarget.style.boxShadow = '0 0 0 2px rgba(54,6,121,0.25)'}
          onBlur={e => e.currentTarget.style.boxShadow = 'none'}
          disabled={disabled || apiError}
        />
        {apiError && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
             <span title="API Limit Reached" className="text-red-500 cursor-help">⚠️</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'manual-panel') {
    return (
      <div className="space-y-3">
        <p className="text-[11px] text-gray-400 leading-tight">
          📍 Paste a Google Maps URL OR coordinates (Format: Name, lat, lng)
        </p>
        <textarea
          className={`${inputCls} min-h-[120px] resize-none`}
          style={focusStyle}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Paste Google Maps link OR multiple lines:&#10;Green Park, 28.5594, 77.2001&#10;Cyber City, 28.4943, 77.0893"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="w-full disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          style={{ backgroundColor: '#360679' }}
        >
          Add location
        </button>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-full text-xs font-medium">
        {(['search', 'manual'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setInternalMode(m); setError(null); }}
            className={`flex-1 px-2 py-1.5 rounded-md transition-colors ${
              mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m === 'search' ? 'Company Search' : 'Manual Input'}
          </button>
        ))}
      </div>

      {/* Help Text */}
      {helpText && (
        <p className="text-[11px] text-gray-400 leading-tight">
          {helpText}
        </p>
      )}

      {/* Main input */}
      {mode === 'search' && (
        <div className="space-y-2">
          <input
            key="search-input"
            ref={activeInputRef as any}
            className={`${inputCls} ${apiError ? 'border-red-300 bg-red-50/30' : ''}`}
            style={focusStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search address…"
            disabled={disabled || apiError}
          />
          {apiError && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-md">
              <span className="text-red-500 text-xs">⚠️</span>
              <p className="text-[11px] font-semibold text-red-600">
                API Limit Reached, Contact Admin For Further Use
              </p>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div className="space-y-2">
          <textarea
            className={`${inputCls} min-h-[100px] resize-none`}
            style={focusStyle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste Google Maps link OR multiple lines:&#10;Green Park, 28.5594, 77.2001&#10;Cyber City, 28.4943, 77.0893"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      <button
        onClick={submit}
        disabled={disabled}
        className="w-full disabled:bg-gray-300 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
        style={{ backgroundColor: '#360679' }}
      >
        Add location
      </button>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
