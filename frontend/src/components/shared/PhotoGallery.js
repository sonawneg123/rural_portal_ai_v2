// src/components/shared/PhotoGallery.js — Feature 10: Swipeable lightbox gallery
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react';

export default function PhotoGallery({ photos = [], startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(false);

  const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(null);
  const onTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd   = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    setTouchStart(null);
  };

  const photo = photos[idx];
  const url   = photo?.s3_url || photo?.url || photo;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease both' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', flexShrink: 0 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
          {idx + 1} / {photos.length}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setZoom(z => !z)} style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: zoom ? 'rgba(0,212,178,0.2)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: zoom ? 'var(--teal)' : '#fff', transition: 'all 0.2s' }}>
            <ZoomIn size={16}/>
          </button>
          <a href={url} download target="_blank" rel="noreferrer" style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none', transition: 'all 0.2s' }}>
            <Download size={16}/>
          </a>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <X size={18}/>
          </button>
        </div>
      </div>

      {/* Main image */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {photos.length > 1 && (
          <button onClick={prev} style={{ position: 'absolute', left: 16, zIndex: 2, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background 0.2s', backdropFilter: 'blur(4px)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
            <ChevronLeft size={22}/>
          </button>
        )}

        <img src={url} alt={`Photo ${idx + 1}`}
          style={{ maxWidth: zoom ? '100%' : '85vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: zoom ? 0 : 'var(--r-lg)', boxShadow: '0 24px 64px rgba(0,0,0,0.6)', transform: zoom ? 'scale(1.5)' : 'scale(1)', transition: 'all 0.35s ease', cursor: zoom ? 'zoom-out' : 'zoom-in' }}
          onClick={() => setZoom(z => !z)}/>

        {photos.length > 1 && (
          <button onClick={next} style={{ position: 'absolute', right: 16, zIndex: 2, width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'background 0.2s', backdropFilter: 'blur(4px)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
            <ChevronRight size={22}/>
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: 6, padding: '16px 20px', overflowX: 'auto', flexShrink: 0, justifyContent: 'center' }}>
          {photos.map((ph, i) => {
            const pUrl = ph?.s3_url || ph?.url || ph;
            return (
              <div key={i} onClick={() => setIdx(i)}
                style={{ width: 52, height: 52, borderRadius: 'var(--r-sm)', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${i === idx ? 'var(--teal)' : 'transparent'}`, transition: 'border-color 0.2s', flexShrink: 0, opacity: i === idx ? 1 : 0.55 }}>
                <img src={pUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
