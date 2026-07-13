import { useEffect, useRef, useState, useCallback } from 'react';

export function useScrollReveal(threshold = 0.12, once = true) {
  const ref     = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el  = ref.current;
    if (!el)  return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVis(true); if (once) obs.unobserve(el); }
        else if (!once)             setVis(false);
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  return [ref, vis];
}

export function useCountUp(target, duration = 1200, trigger = true) {
  const [val, setVal] = useState(0);
  const frame = useRef(null);

  useEffect(() => {
    if (!trigger || !target) return;
    const start = performance.now();
    const step  = (now) => {
      const p    = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(2, -10 * p);
      setVal(Math.floor(ease * target));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, trigger]);

  return val;
}

export function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useLocalStorage(key, defaultValue) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch { return defaultValue; }
  });

  const setStored = useCallback((v) => {
    const next = typeof v === 'function' ? v(val) : v;
    setVal(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  }, [key, val]);

  return [val, setStored];
}
