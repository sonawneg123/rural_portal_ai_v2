import { Link } from 'react-router-dom';
import { Leaf, Github, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy text-white/60 mt-auto">
      <div className="container-custom py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-teal" />
              </div>
              <span className="font-display font-bold text-white text-base">ग्रामीण पोर्टल</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered civic accountability platform for rural India. Report problems, track progress, hold authorities accountable.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-white font-semibold text-sm mb-3">Portal</div>
            <div className="space-y-2">
              {[
                { to: '/problems',    label: 'Browse Problems' },
                { to: '/report',      label: 'Report Issue' },
                { to: '/leaderboard', label: 'Leaderboard' },
                { to: '/map',         label: 'Problem Map' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm hover:text-teal transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-white font-semibold text-sm mb-3">Account</div>
            <div className="space-y-2">
              {[
                { to: '/login',         label: 'Sign In' },
                { to: '/register',      label: 'Register' },
                { to: '/profile',       label: 'My Profile' },
                { to: '/notifications', label: 'Notifications' },
              ].map(l => (
                <Link key={l.to} to={l.to} className="block text-sm hover:text-teal transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span>© 2026 ग्रामीण पोर्टल. Built with</span>
            <Heart className="w-3 h-3 text-red-400 fill-current" />
            <span>for rural India</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-dot" />
              Groq AI active
            </span>
            <span>llama3-8b-8192</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
