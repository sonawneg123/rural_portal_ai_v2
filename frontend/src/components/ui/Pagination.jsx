import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages[0] > 1 && (
        <>
          <button onClick={() => onChange(1)} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">1</button>
          {pages[0] > 2 && <span className="text-slate-400 text-sm px-1">…</span>}
        </>
      )}

      {pages.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={clsx(
            'w-9 h-9 rounded-xl text-sm font-semibold transition-all duration-150',
            p === page
              ? 'bg-navy text-white shadow-navy scale-105'
              : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
          )}>
          {p}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-slate-400 text-sm px-1">…</span>}
          <button onClick={() => onChange(totalPages)} className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{totalPages}</button>
        </>
      )}

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
