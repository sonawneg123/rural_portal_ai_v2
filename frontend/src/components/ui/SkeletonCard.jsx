export function SkeletonCard() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-40 rounded-t-2xl rounded-b-none" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-2/5 rounded-full" />
        <div className="skeleton h-4 w-full rounded-full" />
        <div className="skeleton h-4 w-4/5 rounded-full" />
        <div className="skeleton h-3 w-3/5 rounded-full" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-3 w-16 rounded-full" />
          <div className="skeleton h-3 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3.5 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-3.5 rounded-full ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
      ))}
    </div>
  );
}
