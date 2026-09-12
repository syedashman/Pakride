import React, { useEffect, useRef, useState } from 'react';

export default function MapPickerWeb({ onSelect, selectedPlace, label }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  function initMap() {
    if (!mapRef.current || mapInstanceRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current).setView([24.8607, 67.0104], 12);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      placeMarker(lat, lng);

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const name = data.display_name?.split(',').slice(0, 2).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        onSelect({ name, lat, lng });
      } catch {
        onSelect({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng });
      }
    });
  }

  function placeMarker(lat, lng) {
    const L = window.L;
    if (!mapInstanceRef.current) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
    mapInstanceRef.current.setView([lat, lng], 14);
  }

  async function handleSearch(text) {
    setSearch(text);
    if (text.length < 2) { setSuggestions([]); return; }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=6&countrycodes=pk&viewbox=66.6,25.5,67.6,24.5&bounded=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSuggestions(data);
    } catch {
      setSuggestions([]);
    }
    setSearching(false);
  }

  function selectSuggestion(item) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name.split(',').slice(0, 2).join(', ');
    placeMarker(lat, lng);
    onSelect({ name, lat, lng });
    setSearch(name);
    setSuggestions([]);
  }

  return (
    <div style={{ width: '100%', marginBottom: 16, fontFamily: 'sans-serif' }}>
      <p style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>{label}</p>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder={`Search ${label.toLowerCase()}...`}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            backgroundColor: '#0f3460', color: '#fff', border: '1px solid #1a3a6e',
            fontSize: 14, outline: 'none', boxSizing: 'border-box'
          }}
        />
        {searching && <p style={{ color: '#888', fontSize: 12, margin: '4px 0' }}>Searching...</p>}
        {suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            backgroundColor: '#16213e', border: '1px solid #0f3460',
            borderRadius: 8, zIndex: 1000, maxHeight: 200, overflowY: 'auto'
          }}>
            {suggestions.map((item, i) => (
              <div
                key={i}
                onClick={() => selectSuggestion(item)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', color: '#fff',
                  fontSize: 13, borderBottom: '1px solid #0f3460'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = '#0f3460'}
                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
              >
                📍 {item.display_name.split(',').slice(0, 3).join(', ')}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlace && (
        <p style={{ color: '#4fc3f7', fontSize: 13, marginBottom: 6 }}>
          ✅ {selectedPlace.name}
        </p>
      )}

      <div
        ref={mapRef}
        style={{ width: '100%', height: 280, borderRadius: 10, overflow: 'hidden', border: '1px solid #0f3460' }}
      />
      <p style={{ color: '#888', fontSize: 11, marginTop: 4 }}>Click anywhere on map to select location</p>
    </div>
  );
}