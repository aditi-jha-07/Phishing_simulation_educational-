import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      loginUser(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hunter-bg grid-bg">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hunter-accent/10 border border-hunter-accent/30 mb-4">
              <svg className="w-8 h-8 text-hunter-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-hunter-bright">Access Terminal</h1>
            <p className="text-hunter-muted mt-2 text-sm">Sign in to your Phishing Hunter account</p>
          </div>

          <div className="card">
            {error && (
              <div className="mb-6 p-4 bg-hunter-danger/10 border border-hunter-danger/30 rounded-lg">
                <p className="text-hunter-danger text-sm font-mono">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-hunter-bg border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-hunter-border text-center">
              <p className="text-hunter-muted text-sm">
                No account?{' '}
                <Link to="/register" className="text-hunter-accent hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="mt-6 card border-hunter-border/50 bg-hunter-surface/50">
            <p className="text-xs font-mono text-hunter-muted leading-relaxed">
              <span className="text-hunter-accent">STUDENT:</span> Use your .edu email<br />
              <span className="text-hunter-accent">ADMIN:</span> Use your .admin.edu email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
