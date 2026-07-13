/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy:    { DEFAULT: '#0A2540', light: '#123159', mid: '#1B4B82' },
        teal:    { DEFAULT: '#00D4B2', dark: '#00B89A' },
        purple:  { DEFAULT: '#635BFF', dark: '#4F46E5' },
        surface: { DEFAULT: '#FFFFFF', 2: '#F8FAFC' },
        ink:     { DEFAULT: '#1E293B', 60: '#64748B', 40: '#94A3B8', 20: '#CBD5E1' },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"',   'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease both',
        'fade-up':    'fadeUp 0.4s ease both',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.34,1.3,0.64,1) both',
        'slide-up':   'slideUp 0.35s ease both',
        'float':      'float 3.5s ease-in-out infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'spin-slow':  'spin 1.2s linear infinite',
        'shimmer':    'shimmer 1.6s ease-in-out infinite',
        'count-up':   'fadeUp 0.5s ease both',
        'blob':       'blob 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 },           to: { opacity: 1 } },
        fadeUp:   { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: 0, transform: 'scale(0.9)' }, to: { opacity: 1, transform: 'scale(1)' } },
        slideUp:  { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        shimmer:  { '0%': { backgroundPosition: '-600px 0' }, '100%': { backgroundPosition: '600px 0' } },
        blob:     { '0%,100%': { borderRadius: '60% 40% 55% 45%/55% 45% 60% 40%' }, '50%': { borderRadius: '45% 55% 40% 60%/60% 40% 55% 45%' } },
      },
      boxShadow: {
        'navy':  '0 4px 20px rgba(10,37,64,0.25)',
        'teal':  '0 4px 20px rgba(0,212,178,0.35)',
        'card':  '0 1px 4px rgba(10,37,64,0.06), 0 2px 8px rgba(10,37,64,0.04)',
        'modal': '0 16px 48px rgba(10,37,64,0.14)',
      },
    },
  },
  plugins: [],
};
