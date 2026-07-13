import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import MainLayout from '../layouts/MainLayout.jsx';
import GovernanceLayout from '../layouts/GovernanceLayout.jsx';

// Lazy-loaded pages
const Home            = lazy(() => import('../pages/Home.jsx'));
const Login           = lazy(() => import('../pages/Login.jsx'));
const Register        = lazy(() => import('../pages/Register.jsx'));
const Problems        = lazy(() => import('../pages/Problems.jsx'));
const ProblemDetail   = lazy(() => import('../pages/ProblemDetail.jsx'));
const ReportProblem   = lazy(() => import('../pages/ReportProblem.jsx'));
const WorkProgress    = lazy(() => import('../pages/WorkProgress.jsx'));
const Profile         = lazy(() => import('../pages/Profile.jsx'));
const Notifications   = lazy(() => import('../pages/Notifications.jsx'));
const Bookmarks       = lazy(() => import('../pages/Bookmarks.jsx'));
const Search          = lazy(() => import('../pages/Search.jsx'));
const Leaderboard     = lazy(() => import('../pages/Leaderboard.jsx'));
const MapView         = lazy(() => import('../pages/MapView.jsx'));
const AdminDashboard  = lazy(() => import('../pages/AdminDashboard.jsx'));
const CMDashboard     = lazy(() => import('../pages/CMDashboard.jsx'));
const CollectorDashboard = lazy(() => import('../pages/CollectorDashboard.jsx'));
const MPDashboard     = lazy(() => import('../pages/MPDashboard.jsx'));
const MLADashboard    = lazy(() => import('../pages/MLADashboard.jsx'));
const SarpanchDashboard = lazy(() => import('../pages/SarpanchDashboard.jsx'));
const GramSevakDashboard = lazy(() => import('../pages/GramSevakDashboard.jsx'));
const NotFound        = lazy(() => import('../pages/NotFound.jsx'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Spinner size="lg" />
  </div>
);

// ── Route guards ─────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
}

function RoleRoute({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  if (Array.isArray(role) ? !role.includes(user.role) : user.role !== role)
    return <Navigate to="/" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/" replace /> : children;
}

// ── Scroll to top on route change ──────────────────────────
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function AppRoutes() {
  return (
    <>
      <ScrollTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes in main layout */}
          <Route element={<MainLayout />}>
            <Route path="/"            element={<Home />} />
            <Route path="/problems"    element={<Problems />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/search"      element={<Search />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/map"         element={<MapView />} />

            {/* Auth */}
            <Route path="/login"    element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

            {/* Authenticated */}
            <Route path="/report"         element={<PrivateRoute><ReportProblem /></PrivateRoute>} />
            <Route path="/problems/:id/work-progress" element={<WorkProgress />} />
            <Route path="/profile"        element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/my-problems"    element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/notifications"  element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/bookmarks"      element={<PrivateRoute><Bookmarks /></PrivateRoute>} />
          </Route>

          {/* Governance dashboards — sidebar layout */}
          <Route element={<GovernanceLayout />}>
            <Route path="/admin/*"      element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
            <Route path="/cm/*"         element={<RoleRoute role={['cm','admin']}><CMDashboard /></RoleRoute>} />
            <Route path="/collector/*"  element={<RoleRoute role={['collector','admin']}><CollectorDashboard /></RoleRoute>} />
            <Route path="/mp/*"         element={<RoleRoute role={['mp','admin']}><MPDashboard /></RoleRoute>} />
            <Route path="/mla/*"        element={<RoleRoute role={['mla','admin']}><MLADashboard /></RoleRoute>} />
            <Route path="/sarpanch/*"   element={<RoleRoute role={['sarpanch','admin']}><SarpanchDashboard /></RoleRoute>} />
            <Route path="/gramsevak/*"  element={<RoleRoute role={['gramsevak','admin']}><GramSevakDashboard /></RoleRoute>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
        </Routes>
      </Suspense>
    </>
  );
}
