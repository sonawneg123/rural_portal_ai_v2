// src/pages/NotFoundPage.js — Black hole fix: proper 404 page
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 96, fontWeight: 900, color: 'var(--border-dark)', lineHeight: 1, marginBottom: 20, animation: 'float 3s ease-in-out infinite' }}>
        404
      </div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🌿</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 10 }}>
        Page not found
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-60)', maxWidth: 360, lineHeight: 1.6, marginBottom: 32 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <ArrowLeft size={15}/> Go Back
        </button>
        <Link to="/"        className="btn btn-navy"><Home size={15}/> Home</Link>
        <Link to="/search"  className="btn btn-outline"><Search size={15}/> Search</Link>
      </div>
    </div>
  );
}
