import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Layers } from 'lucide-react';
import { problemsApi } from '../api/problems.js';
import { StatusBadge } from '../components/ui/Badge.jsx';

export default function MapView() {
  const mapRef  = useRef(null);
  const mapObj  = useRef(null);
  const [selected, setSelected] = useState(null);

  const { data } = useQuery({
    queryKey: ['problems-map'],
    queryFn: () => problemsApi.getAll({ limit: 100, sort: 'severity' }).then(r => r.data),
  });
  const problems = data?.data || [];

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return;
    const withCoords = problems.filter(p => p.latitude && p.longitude);
    const center = withCoords.length ? [withCoords[0].latitude, withCoords[0].longitude] : [22.9734, 78.6569];
    const map = L.map(mapRef.current).setView(center, withCoords.length ? 8 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 18 }).addTo(map);

    withCoords.forEach(p => {
      const colour = p.ai_severity_score >= 8 ? '#EF4444' : p.ai_severity_score >= 5 ? '#F59E0B' : '#10B981';
      const icon = L.divIcon({ className: '', html: `<div style="width:20px;height:20px;border-radius:50%;background:${colour};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] });
      L.marker([p.latitude, p.longitude], { icon }).addTo(map).on('click', () => setSelected(p));
    });

    mapObj.current = map;
    return () => { map.remove(); mapObj.current = null; };
  }, [problems]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-navy to-navy-light py-6">
        <div className="container-custom flex items-center gap-3">
          <Layers className="w-[22px] h-[22px] text-teal" />
          <div>
            <h1 className="font-display text-xl md:text-2xl font-extrabold text-white tracking-tight">Problem Map</h1>
            <p className="text-[13px] text-white/60 mt-0.5">Geographic view — coloured by severity</p>
          </div>
          <div className="ml-auto hidden sm:flex gap-3">
            {[{ color: '#EF4444', label: 'High (8-10)' }, { color: '#F59E0B', label: 'Med (5-7)' }, { color: '#10B981', label: 'Low (1-4)' }].map(l => (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-white/75">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} /> {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px]" style={{ height: 'calc(100vh - 130px)' }}>
        <div ref={mapRef} className="w-full h-full bg-slate-200" />

        <div className="bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-y-auto">
          {selected ? (
            <div className="p-5">
              <button onClick={() => setSelected(null)} className="text-xs text-slate-400 mb-4">← Back to list</button>
              <StatusBadge status={selected.status} />
              <h3 className="font-display text-lg font-bold text-ink dark:text-slate-100 my-2.5 leading-snug">{selected.title}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" />{selected.village}, {selected.district}, {selected.state}</div>
              {selected.ai_summary && <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500 italic leading-relaxed mb-3">{selected.ai_summary}</div>}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[{ label: 'Severity', val: `${selected.ai_severity_score || '—'}/10` }, { label: 'Upvotes', val: selected.upvotes || 0 }, { label: 'Views', val: selected.views || 0 }, { label: 'Updates', val: selected.work_updates_count || 0 }].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                    <div className="font-display text-lg font-extrabold text-ink dark:text-slate-100">{s.val}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">{s.label}</div>
                  </div>
                ))}
              </div>
              <a href={`/problems/${selected.id}`} className="btn btn-navy w-full justify-center">View Full Problem</a>
            </div>
          ) : (
            <div>
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 font-display text-[15px] font-bold text-ink dark:text-slate-100">{problems.length} Problems</div>
              {problems.map(p => (
                <div key={p.id} onClick={() => setSelected(p)} className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.ai_severity_score >= 8 ? '#EF4444' : p.ai_severity_score >= 5 ? '#F59E0B' : '#10B981' }} />
                    <span className="text-[13px] font-semibold text-ink dark:text-slate-200 truncate">{p.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400"><MapPin className="w-2.5 h-2.5 inline -mt-0.5" /> {p.village}, {p.district}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
