// src/pages/MapViewPage.js — Feature 14: Village map view (OpenStreetMap)
import React, { useEffect, useState } from 'react';
import api, { getError } from '../utils/api';
import { StatusBadge } from '../components/ui';
import { MapPin, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MapViewPage() {
  const [problems, setProblems] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    api.get('/problems?limit=100&sort=severity')
      .then(r => setProblems(r.data.data || []))
      .catch(e => toast.error(getError(e)))
      .finally(() => setLoading(false));
  }, []);

  // Inject Leaflet dynamically
  useEffect(() => {
    if (document.getElementById('leaflet-css')) { setMapLoaded(true); return; }
    const link = document.createElement('link');
    link.id  = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !problems.length) return;
    const L = window.L;
    if (!L || document.getElementById('rp-map')._leaflet_id) return;

    const withCoords = problems.filter(p => p.latitude && p.longitude);
    const center = withCoords.length
      ? [withCoords[0].latitude, withCoords[0].longitude]
      : [22.9734, 78.6569]; // India centre

    const map = L.map('rp-map').setView(center, withCoords.length ? 8 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 18,
    }).addTo(map);

    withCoords.forEach(p => {
      const colour = p.ai_severity_score >= 8 ? '#EF4444' : p.ai_severity_score >= 5 ? '#F59E0B' : '#10B981';
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:20px;height:20px;border-radius:50%;background:${colour};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer"></div>`,
        iconSize: [20, 20], iconAnchor: [10, 10],
      });
      L.marker([p.latitude, p.longitude], { icon })
        .addTo(map)
        .on('click', () => setSelected(p));
    });

    // Show message if no coords
    if (!withCoords.length) {
      L.popup().setLatLng([22.9734, 78.6569]).setContent('<div style="font-size:13px;padding:4px">No GPS coordinates available for current problems.<br/>Map will populate as problems are reported with location data.</div>').openOn(map);
    }
  }, [mapLoaded, problems]);

  return (
    <div className="page-enter" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--navy), var(--navy-light))', padding: '28px 0 36px' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Layers size={22} color="var(--teal)"/>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.4px' }}>
              Problem Map
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
              Geographic view of all reported problems — coloured by severity
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
            {[{ color: '#EF4444', label: 'High (8-10)' }, { color: '#F59E0B', label: 'Med (5-7)' }, { color: '#10B981', label: 'Low (1-4)' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }}/>
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', height: 'calc(100vh - 130px)' }}>
        {/* Map */}
        <div id="rp-map" style={{ width: '100%', height: '100%', background: '#e8e8e8' }}>
          {!mapLoaded && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--navy)', borderTopColor: 'transparent', animation: 'spin 0.75s linear infinite' }}/>
              <span style={{ fontSize: 14, color: 'var(--text-60)' }}>Loading map…</span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {selected ? (
            <div style={{ padding: 20 }}>
              <button onClick={() => setSelected(null)} style={{ fontSize: 12, color: 'var(--text-60)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4 }}>
                ← Back to list
              </button>
              <StatusBadge status={selected.status}/>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)', margin: '10px 0 8px', lineHeight: 1.3 }}>{selected.title}</h3>
              <div style={{ fontSize: 12, color: 'var(--text-60)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                <MapPin size={12}/>{selected.village}, {selected.district}, {selected.state}
              </div>
              {selected.ai_summary && (
                <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', padding: '10px 12px', fontSize: 12, color: 'var(--text-60)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 12 }}>
                  {selected.ai_summary}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Severity', val: `${selected.ai_severity_score || '—'}/10` },
                  { label: 'Upvotes',  val: selected.upvotes || 0 },
                  { label: 'Views',    val: selected.views || 0 },
                  { label: 'Updates',  val: selected.work_updates_count || 0 },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-alt)', borderRadius: 'var(--r-md)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-60)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <a href={`/problems/${selected.id}`} className="btn btn-navy" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                View Full Problem
              </a>
            </div>
          ) : (
            <div>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                {problems.length} Problems
              </div>
              {problems.map(p => (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: p.ai_severity_score >= 8 ? 'var(--danger)' : p.ai_severity_score >= 5 ? 'var(--warning)' : 'var(--success)' }}/>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-60)' }}><MapPin size={10} style={{ verticalAlign: -1 }}/> {p.village}, {p.district}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
