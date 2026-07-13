import clsx from 'clsx';

const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3', xl: 'w-16 h-16 border-4' };

export default function Spinner({ size = 'md', color = 'border-navy', className }) {
  return (
    <div className={clsx(
      'rounded-full border-slate-200 animate-spin-slow',
      sizes[size], color,
      'border-t-current',
      className
    )} role="status" aria-label="Loading" />
  );
}

export function PageSpinner() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center animate-float">
        <span className="text-2xl">🌿</span>
      </div>
      <Spinner size="lg" />
      <p className="text-sm text-slate-400 font-medium">Loading…</p>
    </div>
  );
}
