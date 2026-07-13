import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { ROLE_CONFIG } from '../utils/helpers.js';
import {
  LayoutDashboard, FileText, Users, BarChart2, IndianRupee,
  LogOut, Leaf, Menu, X, Bell, Sun, Moon, ChevronRight, Map,
} from 'lucide-react';
import clsx from 'clsx';

const SIDEBAR_NAV = {
  admin:     [
    { to: '/admin',         label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/admin/problems',label: 'Problems',   icon: FileText },
    { to: '/admin/users',   label: 'Users',      icon: Users },
  ],
  cm:        [
    { to: '/cm',            label: 'Overview',   icon: LayoutDashboard },
    { to: '/cm/budget',     label: 'Budget',     icon: IndianRupee },
    { to: '/cm/issues',     label: 'Issues',     icon: FileText },
    { to: '/cm/districts',  label: 'Districts',  icon: Map },
  ],
  collector: [
    { to: '/collector',           label: 'Overview',  icon: LayoutDashboard },
    { to: '/collector/budget',    label: 'Budget',    icon: IndianRupee },
    { to: '/collector/issues',    label: 'Issues',    icon: FileText },
    { to: '/collector/talukas',   label: 'Talukas',   icon: Map },
  ],
  mp:        [
    { to: '/mp',            label: 'Overview',   icon: LayoutDashboard },
    { to: '/mp/budget',     label: 'Budget',     icon: IndianRupee },
    { to: '/mp/issues',     label: 'Issues',     icon: FileText },
  ],
  mla:       [
    { to: '/mla',           label: 'Overview',   icon: LayoutDashboard },
    { to: '/mla/villages',  label: 'Villages',   icon: Map },
    { to: '/mla/budget',    label: 'Budget',     icon: IndianRupee },
    { to: '/mla/issues',    label: 'Issues',     icon: FileText },
  ],
  sarpanch:  [
    { to: '/sarpanch',         label: 'Overview',  icon: LayoutDashboard },
    { to: '/sarpanch/problems',label: 'Problems',  icon: FileText },
    { to: '/sarpanch/budget',  label: 'Budget',    icon: IndianRupee },
  ],
  gramsevak: [
    { to: '/gramsevak',        label: 'Field Ops', icon: LayoutDashboard },
    { to: '/gramsevak/pending',label: 'Pending',   icon: FileText },
  ],
};

export default function GovernanceLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const location          = useLocation();
  const navigate          = useNavigate();
  const [sideOpen, setSideOpen] = useState(false);

  const role    = user?.role || 'user';
  const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const navItems = SIDEBAR_NAV[role] || [];

  const handleLogout = () => { logout(); navigate('/'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={clsx(
      'flex flex-col h-full bg-gradient-to-b from-navy to-navy-light',
      mobile ? 'w-full' : 'w-64 min-h-screen sticky top-0'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-teal/20 border border-teal/30 flex items-center justify-center animate-float">
          <Leaf className="w-5 h-5 text-teal" />
        </div>
        <div>
          <div className="font-display font-bold text-sm text-white leading-none">ग्रामीण पोर्टल</div>
          <div className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Governance</div>
        </div>
        {mobile && (
          <button onClick={() => setSideOpen(false)} className="ml-auto text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/08">
        <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-navy font-bold text-base flex-shrink-0">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
          <div className="text-[10px] text-white/45 truncate">{roleCfg.icon} {roleCfg.label}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          const Icon   = item.icon;
          return (
            <Link key={item.to} to={item.to}
              onClick={() => mobile && setSideOpen(false)}
              className={clsx('sidebar-link', active && 'sidebar-link-active')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/08 pt-3">
        {/* Groq badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-400/20 mb-2">
          <span className="text-purple-300 text-[10px] font-bold animate-pulse-dot">✦</span>
          <div>
            <div className="text-[10px] font-semibold text-purple-200">Groq AI Active</div>
            <div className="text-[9px] text-purple-400">llama3-8b-8192</div>
          </div>
        </div>
        <button onClick={toggle} className="sidebar-link w-full">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <Link to="/notifications" className="sidebar-link">
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </Link>
        <Link to="/" className="sidebar-link">
          <Leaf className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-300 hover:text-red-200 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSideOpen(false)} />
          <div className="relative w-72 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy border-b border-white/10">
          <button onClick={() => setSideOpen(true)} className="text-white/70 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold text-white">{roleCfg.icon} {roleCfg.label}</div>
          <button onClick={handleLogout} className="text-white/70 hover:text-white">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
