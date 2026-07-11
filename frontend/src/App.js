// src/App.js — v3.1 all routes + black hole fixes
import React, { Suspense, Component, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster }            from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider }     from 'react-helmet-async';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar                 from './components/layout/Navbar';
import DarkModeToggle         from './components/ui/DarkModeToggle';
import { PageLoader }         from './components/ui';

// Pages
import Home               from './pages/Home';
import Login, { Register } from './pages/Login';
import Problems           from './pages/Problems';
import ProblemDetail      from './pages/ProblemDetail';
import ReportProblem      from './pages/ReportProblem';
import WorkProgress       from './pages/WorkProgress';
import Admin              from './pages/Admin';
import CMDashboard        from './pages/CMDashboard';
import CollectorDashboard from './pages/CollectorDashboard';
import MPDashboard        from './pages/MPDashboard';
import MLADashboard       from './pages/MLADashboard';
import SarpanchDashboard  from './pages/SarpanchDashboard';
import GramSevakDashboard from './pages/GramSevakDashboard';
import ProfilePage        from './pages/ProfilePage';
import NotificationsPage  from './pages/NotificationsPage';
import LeaderboardPage    from './pages/LeaderboardPage';
import SearchPage         from './pages/SearchPage';
import MapViewPage        from './pages/MapViewPage';
import BookmarksPage      from './pages/BookmarksPage';
import NotFoundPage       from './pages/NotFoundPage';

import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5*60*1000, cacheTime: 10*60*1000, retry: 1, refetchOnWindowFocus: false } },
});

/* ── Route guards ─────────────────────────────────────────── */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader/>;
  return user ? children : <Navigate to="/login" replace/>;
}
function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading)              return <PageLoader/>;
  if (!user)                return <Navigate to="/login" replace/>;
  if (user.role !== role)   return <Navigate to="/" replace/>;
  return children;
}
function MultiRoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading)                      return <PageLoader/>;
  if (!user)                        return <Navigate to="/login" replace/>;
  if (!roles.includes(user.role))   return <Navigate to="/" replace/>;
  return children;
}
function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader/>;
  return user ? <Navigate to="/" replace/> : children;
}

/* ── Error boundary ─────────────────────────────────────────── */
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>Something went wrong</h2>
        <p style={{ fontSize: 14, color: 'var(--text-60)', marginBottom: 24, maxWidth: 400 }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.location.reload()} className="btn btn-navy">Refresh page</button>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }} className="btn btn-ghost">Go home</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

/* ── Layout — fixed: uses useLocation hook correctly ─────── */
const GOVERNANCE_PATHS = ['/admin','/cm','/collector','/mp','/mla','/sarpanch','/gramsevak'];

function Layout({ children }) {
  const location = useLocation();
  const hideNav  = GOVERNANCE_PATHS.some(p => location.pathname.startsWith(p));
  return (
    <>
      {!hideNav && <Navbar/>}
      {!hideNav && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 999 }}>
          <DarkModeToggle/>
        </div>
      )}
      <main>{children}</main>
    </>
  );
}

/* ── Scroll to top on route change ──────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <ScrollToTop/>
              <Toaster position="top-right" toastOptions={{
                duration: 3500,
                style: { fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500, borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' },
                success: { iconTheme: { primary: 'var(--teal)', secondary: 'var(--navy)' } },
              }}/>
              <Layout>
                <Suspense fallback={<PageLoader/>}>
                  <Routes>
                    {/* Public */}
                    <Route path="/"              element={<Home/>}/>
                    <Route path="/problems"      element={<Problems/>}/>
                    <Route path="/problems/:id"  element={<ProblemDetail/>}/>
                    <Route path="/problems/:id/work-progress" element={<WorkProgress/>}/>
                    <Route path="/search"        element={<SearchPage/>}/>
                    <Route path="/leaderboard"   element={<LeaderboardPage/>}/>
                    <Route path="/map"           element={<MapViewPage/>}/>

                    {/* Auth */}
                    <Route path="/login"    element={<PublicOnly><Login/></PublicOnly>}/>
                    <Route path="/register" element={<PublicOnly><Register/></PublicOnly>}/>

                    {/* Authenticated */}
                    <Route path="/report"        element={<PrivateRoute><ReportProblem/></PrivateRoute>}/>
                    <Route path="/profile"       element={<PrivateRoute><ProfilePage/></PrivateRoute>}/>
                    <Route path="/my-problems"   element={<PrivateRoute><ProfilePage/></PrivateRoute>}/>
                    <Route path="/notifications" element={<PrivateRoute><NotificationsPage/></PrivateRoute>}/>
                    <Route path="/bookmarks"     element={<PrivateRoute><BookmarksPage/></PrivateRoute>}/>

                    {/* Governance */}
                    <Route path="/admin/*"      element={<RoleRoute role="admin"><Admin/></RoleRoute>}/>
                    <Route path="/cm/*"         element={<RoleRoute role="cm"><CMDashboard/></RoleRoute>}/>
                    <Route path="/collector/*"  element={<RoleRoute role="collector"><CollectorDashboard/></RoleRoute>}/>
                    <Route path="/mp/*"         element={<RoleRoute role="mp"><MPDashboard/></RoleRoute>}/>
                    <Route path="/mla/*"        element={<RoleRoute role="mla"><MLADashboard/></RoleRoute>}/>
                    <Route path="/sarpanch/*"   element={<RoleRoute role="sarpanch"><SarpanchDashboard/></RoleRoute>}/>
                    <Route path="/gramsevak/*"  element={<RoleRoute role="gramsevak"><GramSevakDashboard/></RoleRoute>}/>

                    {/* 404 — fixes black hole of silent redirects */}
                    <Route path="*" element={<NotFoundPage/>}/>
                  </Routes>
                </Suspense>
              </Layout>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
