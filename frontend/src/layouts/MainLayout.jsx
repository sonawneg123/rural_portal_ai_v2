import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';
import { AnnouncementBanner } from '../components/shared/DeadlineBadge.jsx';

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <AnnouncementBanner />
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  );
}
