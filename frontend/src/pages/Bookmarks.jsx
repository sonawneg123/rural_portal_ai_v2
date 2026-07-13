import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { problemsApi } from '../api/problems.js';
import ProblemCard from '../components/shared/ProblemCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { PageSpinner } from '../components/ui/Spinner.jsx';
import { useLocalStorage } from '../hooks/useAnimations.js';

export default function Bookmarks() {
  const [ids] = useLocalStorage('rp_bookmarks', []);

  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['bookmarks', ids],
    queryFn: async () => {
      if (!ids.length) return [];
      const results = await Promise.all(ids.map(id => problemsApi.getById(id).then(r => r.data.data).catch(() => null)));
      return results.filter(Boolean);
    },
    enabled: ids.length > 0,
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen pb-16">
      <div className="bg-gradient-to-br from-navy to-navy-light py-9">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-1.5">
            <Bookmark className="w-6 h-6 text-teal" />
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Saved Problems</h1>
          </div>
          <p className="text-[13px] text-white/60">{problems.length} bookmarked problem{problems.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="container-custom py-7">
        {isLoading ? <PageSpinner /> : problems.length === 0 ? (
          <EmptyState emoji="🔖" title="No bookmarks yet" description="Save problems you care about by clicking the bookmark icon on any problem card" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {problems.map((p, i) => <ProblemCard key={p.id} problem={p} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
