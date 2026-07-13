import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from 'lucide-react';

export default function PhotoGallery({ photos = [], startIndex = 0, onClose }) {
  const [idx, setIdx]   = useState(startIndex);
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
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [prev, next, onClose]);

  const [touchStart, setTouchStart] = useState(null);
  const onTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const onTouchEnd   = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) (diff > 0 ? next() : prev());
    setTouchStart(null);
  };

  const photo = photos[idx];
  const url   = photo?.s3_url || photo?.url || photo;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
        onClick={(e) => e.target === e.currentTarget && onClose()}>

        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
          <span className="text-sm text-white/60 font-medium">{idx + 1} / {photos.length}</span>
          <div className="flex gap-2">
            <button onClick={() => setZoom(z => !z)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${zoom ? 'bg-teal/20 text-teal' : 'bg-white/10 text-white'}`}>
              <ZoomIn className="w-4 h-4" />
            </button>
            <a href={url} download target="_blank" rel="noreferrer"
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Download className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center relative overflow-hidden"
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {photos.length > 1 && (
            <button onClick={prev}
              className="absolute left-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <motion.img key={idx} src={url} alt={`Photo ${idx + 1}`}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: zoom ? 1.5 : 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-[85vw] max-h-[75vh] object-contain rounded-2xl shadow-2xl cursor-zoom-in"
            onClick={() => setZoom(z => !z)} />

          {photos.length > 1 && (
            <button onClick={next}
              className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-1.5 px-5 py-4 overflow-x-auto justify-center flex-shrink-0">
            {photos.map((ph, i) => {
              const pUrl = ph?.s3_url || ph?.url || ph;
              return (
                <button key={i} onClick={() => setIdx(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === idx ? 'border-teal opacity-100' : 'border-transparent opacity-50'}`}>
                  <img src={pUrl} alt="" className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
