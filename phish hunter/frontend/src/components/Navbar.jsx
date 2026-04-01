import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-hunter-border bg-hunter-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-hunter-accent/20 border border-hunter-accent/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-hunter-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="font-display font-bold text-hunter-bright text-lg tracking-tight group-hover:text-hunter-accent transition-colors">
              PHISHING<span className="text-hunter-accent">HUNTER</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin" className="text-hunter-text hover:text-hunter-accent transition-colors text-sm font-medium">Dashboard</Link>
                    <Link to="/admin/scenarios" className="text-hunter-text hover:text-hunter-accent transition-colors text-sm font-medium">Scenarios</Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" className="text-hunter-text hover:text-hunter-accent transition-colors text-sm font-medium">Dashboard</Link>
                    <Link to="/simulation" className="text-hunter-text hover:text-hunter-accent transition-colors text-sm font-medium">Start Sim</Link>
                  </>
                )}
                <div className="flex items-center gap-3 border-l border-hunter-border pl-6">
                  <div className="text-right">
                    <div className="text-xs text-hunter-muted font-mono">{user.role.toUpperCase()}</div>
                    <div className="text-sm text-hunter-text truncate max-w-40">{user.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-hunter-muted hover:text-hunter-danger transition-colors text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-hunter-text hover:text-hunter-accent transition-colors text-sm font-medium">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Register</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-hunter-text" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-hunter-border py-4 space-y-3">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <Link to="/admin" className="block text-hunter-text hover:text-hunter-accent py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/admin/scenarios" className="block text-hunter-text hover:text-hunter-accent py-2" onClick={() => setMenuOpen(false)}>Scenarios</Link>
                  </>
                ) : (
                  <>
                    <Link to="/dashboard" className="block text-hunter-text hover:text-hunter-accent py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/simulation" className="block text-hunter-text hover:text-hunter-accent py-2" onClick={() => setMenuOpen(false)}>Start Simulation</Link>
                  </>
                )}
                <button onClick={handleLogout} className="text-hunter-danger text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-hunter-text py-2" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block text-hunter-accent py-2" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
