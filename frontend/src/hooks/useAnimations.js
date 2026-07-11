// src/hooks/useAnimations.js
import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Scroll reveal ──────────────────────────────────────────── */
export function useScrollReveal(threshold = 0.15, once = true) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  return [ref, visible];
}

/* ── Count-up number animation ──────────────────────────────── */
export function useCountUp(target, duration = 1400, trigger = true) {
  const [value, setValue] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!trigger || !target) return;
    const start = performance.now();
    const step = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(ease * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, trigger]);

  return value;
}

/* ── Hover state helper ─────────────────────────────────────── */
export function useHover() {
  const [hovered, setHovered] = useState(false);
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
  return [hovered, handlers];
}

/* ── Stagger children delays ────────────────────────────────── */
export function useStaggerDelay(count, base = 0.07) {
  return Array.from({ length: count }, (_, i) => ({
    animationDelay: `${i * base}s`,
    animationFillMode: 'both',
  }));
}

/* ── Progress bar fill ──────────────────────────────────────── */
export function useProgressFill(target, trigger = true, duration = 1200) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setWidth(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, trigger, duration]);

  return width;
}

/* ── Ripple effect ──────────────────────────────────────────── */
export function useRipple() {
  const [ripples, setRipples] = useState([]);
  const addRipple = useCallback((e) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = e.clientX - rect.left - size / 2;
    const y    = e.clientY - rect.top  - size / 2;
    const id   = Date.now();
    setRipples((r) => [...r, { x, y, size, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
  }, []);
  return [ripples, addRipple];
}

/* ── Typewriter ─────────────────────────────────────────────── */
export function useTypewriter(text, speed = 50, trigger = true) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    if (!trigger) return;
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, trigger]);
  return displayed;
}
