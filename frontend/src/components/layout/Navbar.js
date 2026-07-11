// src/components/layout/Navbar.js — v3.1 with search, bookmarks, map
import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIG } from '../../utils/helpers';
import { Leaf, Menu, X, Bell, LogOut, ChevronDown, Home, FileText, PlusCircle, LayoutDashboard, Search, Bookmark, Map, Trophy } from 'lucide-react';
import DarkModeToggle from '../ui/DarkModeToggle';

const ROLE_DASHBOARDS = {
  admin:'      /admin', cm:'/cm', collector:'/collector',
  mp:'/mp', mla:'/mla', sarpanch:'/sarpanch', gramsevak:'/gramsevak',
};

export default function Navbar() {
  const { user, logout, notifCount } = useAuth();
  const navigate = useNavigate();
  const [open,      setOpen]      = useState(false);
  const [scrolled,  setScrolled]  = useState(false);
  const [userMenu,  setUserMenu]  = useState(false);
  const [searchQ,   setSearchQ]   = useState('');
  const [showSearch,setShowSearch]= useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setUserMenu(false); };
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) { navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`); setSearchQ(''); setShowSearch(false); }
  };

  const role     = user?.role || 'user';
  const roleCfg  = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const dashPath = ROLE_DASHBOARDS[role]?.trim();

  const navLinks = [
    { to: '/',            label: 'Home',     icon: <Home size={14}/> },
    { to: '/problems',    label: 'Problems', icon: <FileText size={14}/> },
    { to: '/map',         label: 'Map',      icon: <Map size={14}/> },
    { to: '/leaderboard', label: 'Rankings', icon: <Trophy size={14}/> },
    ...(user && role === 'user' ? [{ to: '/report', label: 'Report', icon: <PlusCircle size={14}/> }] : []),
    ...(dashPath ? [{ to: dashPath, label: roleCfg.label + ' Portal', icon: <LayoutDashboard size={14}/> }] : []),
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: scrolled ? 'rgba(255,255,255,0.97)' : 'var(--surface)',
      borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginRight: 28, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--navy),var(--navy-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'float 4s ease-in-out infinite', flexShrink: 0 }}>
            <Leaf size={18} color="var(--teal)"/>
          </div>
          <div className="hide-mobile">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--navy)', lineHeight: 1 }}>ग्रामीण पोर्टल</div>
            <div style={{ fontSize: 9, color: 'var(--text-40)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 }}>Rural Governance</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 'var(--r-md)',
                textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--navy)' : 'var(--text-60)',
                background: isActive ? 'var(--bg-alt)' : 'transparent',
                transition: 'all var(--t-fast)',
              })}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-alt)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>
              {l.icon}{l.label}
            </NavLink>
          ))}
        </div>

        {/* Right area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {/* Inline search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            {showSearch ? (
              <input autoFocus value={searchQ} onChange={e => setSearchQ(e.target.value)}
                onBlur={() => !searchQ && setShowSearch(false)}
                placeholder="Search problems…"
                style={{ width: 200, padding: '7px 32px 7px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--teal)', fontSize: 13, outline: 'none', background: 'var(--surface)', color: 'var(--text)', transition: 'all 0.25s', animation: 'fadeInRight 0.2s ease both' }}/>
            ) : null}
            <button type={showSearch ? 'submit' : 'button'} onClick={() => setShowSearch(true)}
              style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: showSearch ? 'transparent' : 'var(--bg-alt)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-60)', position: showSearch ? 'absolute' : 'static', right: showSearch ? 2 : 'auto', transition: 'all var(--t-fast)' }}>
              <Search size={16}/>
            </button>
          </form>

          <DarkModeToggle/>

          {user ? (
            <>
              {/* Bookmarks */}
              <Link to="/bookmarks" style={{ width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-60)', transition: 'all var(--t-fast)' }}
                title="Saved problems"
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--purple)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-alt)'; e.currentTarget.style.color = 'var(--text-60)'; }}>
                <Bookmark size={16}/>
              </Link>

              {/* Notification bell */}
              <Link to="/notifications" style={{ position: 'relative', width: 36, height: 36, borderRadius: 'var(--r-md)', background: 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-60)', transition: 'all var(--t-fast)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--border)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-alt)'; }}>
                <Bell size={16}/>
                {notifCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', border: '2px solid var(--surface)', animation: 'pulse 2s ease-in-out infinite' }}/>}
              </Link>

              {/* User dropdown */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setUserMenu(!userMenu)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 'var(--r-md)', background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', transition: 'background var(--t-fast)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-alt)'}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)', fontSize: 13, fontWeight: 700 }}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className="hide-mobile">
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>{user.name.split(' ')[0]}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-40)', marginTop: 1 }}>{roleCfg.label}</div>
                  </div>
                  <ChevronDown size={12} color="var(--text-60)" style={{ transform: userMenu ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }}/>
                </button>

                {userMenu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setUserMenu(false)}/>
                    <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', minWidth: 220, zIndex: 20, animation: 'scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both', transformOrigin: 'top right', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-60)', marginBottom: 6 }}>{user.email}</div>
                        <span className={`badge role-${role}`} style={{ fontSize: 10, padding: '2px 8px' }}>{roleCfg.icon} {roleCfg.label}</span>
                      </div>
                      {[
                        { to: '/profile',       label: '👤 My Profile' },
                        { to: '/my-problems',   label: '📋 My Reports' },
                        { to: '/bookmarks',     label: '🔖 Bookmarks' },
                        { to: '/notifications', label: '🔔 Notifications' },
                      ].map(item => (
                        <Link key={item.to} to={item.to} onClick={() => setUserMenu(false)}
                          style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text)', textDecoration: 'none', transition: 'background var(--t-fast)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          {item.label}
                        </Link>
                      ))}
                      <div style={{ borderTop: '1px solid var(--border)', padding: '6px 8px' }}>
                        <button onClick={handleLogout}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 10px', borderRadius: 'var(--r-md)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13, fontWeight: 500, transition: 'background var(--t-fast)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <LogOut size={14}/> Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="hide-mobile" style={{ display: 'flex', gap: 6 }}>
              <Link to="/login"    className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-navy  btn-sm">Register</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button className="btn btn-icon btn-ghost show-mobile-only" onClick={() => setOpen(!open)} aria-label="Menu">
            <span style={{ display: 'flex', transition: 'transform 0.25s', transform: open ? 'rotate(90deg)' : 'none' }}>
              {open ? <X size={20}/> : <Menu size={20}/>}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div style={{ maxHeight: open ? '600px' : '0', overflow: 'hidden', transition: 'max-height 0.35s ease', borderTop: open ? '1px solid var(--border)' : 'none', background: 'var(--surface)' }}>
        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Mobile search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search problems…"
              style={{ flex: 1, padding: '9px 12px', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-dark)', fontSize: 13, outline: 'none', background: 'var(--surface)', color: 'var(--text)' }}/>
            <button type="submit" className="btn btn-navy btn-sm"><Search size={14}/></button>
          </form>
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--r-md)', textDecoration: 'none', fontSize: 15, fontWeight: 500, color: 'var(--text)', transition: 'background var(--t-fast)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-alt)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {l.icon}{l.label}
            </Link>
          ))}
          {!user ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Link to="/login"    className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Sign in</Link>
              <Link to="/register" className="btn btn-navy"    style={{ flex: 1, justifyContent: 'center' }} onClick={() => setOpen(false)}>Register</Link>
            </div>
          ) : (
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 15, fontWeight: 500, marginTop: 4 }}>
              <LogOut size={15}/> Sign out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
