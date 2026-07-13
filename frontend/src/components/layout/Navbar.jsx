import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { ROLE_CONFIG } from '../../utils/helpers.js';
import {
  Leaf, Search, Bell, Sun, Moon, Menu, X,
  LogOut, ChevronDown, Bookmark, Map, Trophy,
  Home, FileText, PlusCircle, LayoutDashboard,
} from 'lucide-react';
import clsx from 'clsx';

export default function Navbar() {
  const { user, logout, notifCount } = useAuth();
  const { dark, toggle }  = useTheme();
  const navigate          = useNavigate();
  const [scrolled,  setScrolled]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ,   setSearchQ]   = useState('');

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const role    = user?.role || 'user';
  const roleCfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;

  const handleLogout = () => { logout(); navigate('/'); setUserMenu(false); };
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ(''); setSearchOpen(false);
    }
  };

  const navLinks = [
    { to: '/',         label: 'Home',     icon: Home,         end: true },
    { to: '/problems', label: 'Problems', icon: FileText },
    { to: '/map',      label: 'Map',      icon: Map },
    { to: '/leaderboard', label: 'Rankings', icon: Trophy },
    ...(user && role === 'user' ? [{ to: '/report', label: 'Report', icon: PlusCircle }] : []),
    ...(roleCfg.dash ? [{ to: roleCfg.dash, label: roleCfg.label + ' Portal', icon: LayoutDashboard }] : []),
  ];

  return (
    <>
      <nav className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700 shadow-sm'
          : 'bg-white dark:bg-slate-900'
      )}>
        <div className="container-custom flex items-center h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 mr-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy to-navy-mid flex items-center justify-center animate-float shadow-navy flex-shrink-0">
              <Leaf className="w-[18px] h-[18px] text-teal" />
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-extrabold text-[15px] text-navy dark:text-white leading-none">
                ग्रामीण पोर्टल
              </div>
              <div className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                Rural Governance
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1">
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-navy dark:text-teal font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700'
                )}>
                <Icon className="w-[14px] h-[14px]" />
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Search */}
            <AnimatePresence>
              {searchOpen ? (
                <motion.form onSubmit={handleSearch}
                  initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden">
                  <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search problems…"
                    className="w-full h-9 pl-3 pr-9 rounded-xl border-2 border-teal/40 focus:border-teal text-sm outline-none bg-white dark:bg-slate-800 text-ink dark:text-slate-100"
                    onBlur={() => !searchQ && setSearchOpen(false)}/>
                  <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                  </button>
                </motion.form>
              ) : (
                <button onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-navy transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              )}
            </AnimatePresence>

            {/* Dark mode */}
            <button onClick={toggle}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-navy dark:hover:text-teal transition-colors">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {user ? (
              <>
                {/* Bookmarks */}
                <Link to="/bookmarks"
                  className="hidden sm:flex w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-500 hover:text-purple-600 transition-colors">
                  <Bookmark className="w-4 h-4" />
                </Link>

                {/* Notifications */}
                <Link to="/notifications" className="relative w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-navy transition-colors">
                  <Bell className="w-4 h-4" />
                  {notifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal border-2 border-white animate-pulse-dot" />
                  )}
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button onClick={() => setUserMenu(!userMenu)}
                    className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center text-teal text-xs font-bold">
                      {user.name[0].toUpperCase()}
                    </div>
                    <span className="hidden md:block text-sm font-semibold text-ink dark:text-slate-100 max-w-[80px] truncate">
                      {user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className={clsx('w-3 h-3 text-slate-400 transition-transform duration-150', userMenu && 'rotate-180')} />
                  </button>

                  <AnimatePresence>
                    {userMenu && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setUserMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -8 }}
                          animate={{ opacity: 1, scale: 1,    y: 0 }}
                          exit={{   opacity: 0, scale: 0.95, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-[calc(100%+8px)] z-20 w-56 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-modal overflow-hidden"
                          style={{ transformOrigin: 'top right' }}>
                          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="text-sm font-bold text-ink dark:text-slate-100">{user.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{user.email}</div>
                            <span className={clsx('role-badge mt-1.5', roleCfg.tw)}>
                              {roleCfg.icon} {roleCfg.label}
                            </span>
                          </div>
                          {[
                            { to: '/profile',       label: '👤 My Profile' },
                            { to: '/my-problems',   label: '📋 My Reports' },
                            { to: '/bookmarks',     label: '🔖 Bookmarks' },
                            { to: '/notifications', label: '🔔 Notifications' },
                          ].map(item => (
                            <Link key={item.to} to={item.to}
                              onClick={() => setUserMenu(false)}
                              className="block px-4 py-2.5 text-sm text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                              {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-slate-100 dark:border-slate-700 p-2">
                            <button onClick={handleLogout}
                              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                              <LogOut className="w-4 h-4" /> Sign out
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="hidden sm:flex gap-2">
                <Link to="/login"    className="btn btn-ghost btn-sm">Sign in</Link>
                <Link to="/register" className="btn btn-navy  btn-sm">Register</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="px-4 py-3 space-y-1">
                {/* Mobile search */}
                <form onSubmit={handleSearch} className="flex gap-2 mb-3">
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search problems…"
                    className="input flex-1" />
                  <button type="submit" className="btn btn-navy btn-sm"><Search className="w-4 h-4" /></button>
                </form>
                {navLinks.map(({ to, label, icon: Icon, end }) => (
                  <Link key={to} to={to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Icon className="w-4 h-4" /> {label}
                  </Link>
                ))}
                {!user ? (
                  <div className="flex gap-2 pt-2">
                    <Link to="/login"    className="btn btn-outline flex-1 justify-center" onClick={() => setMobileOpen(false)}>Sign in</Link>
                    <Link to="/register" className="btn btn-navy  flex-1 justify-center" onClick={() => setMobileOpen(false)}>Register</Link>
                  </div>
                ) : (
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
