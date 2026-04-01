import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import Navbar from '../components/Navbar';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const getRole = () => {
    if (email.endsWith('.admin.edu')) return 'admin';
    if (email.endsWith('.edu')) return 'student';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    if (password !== confirm) {
      setErrors([{ msg: 'Passwords do not match' }]);
      return;
    }

    setLoading(true);
    try {
      const res = await register(email, password);
      loginUser(res.data.token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else {
        setErrors([{ msg: data?.error || 'Registration failed. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const role = getRole();

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { level: 1, label: 'Too short', color: 'bg-hunter-danger' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { level: 2, label: 'Weak', color: 'bg-hunter-warning' };
    if (password.length >= 12) return { level: 4, label: 'Strong', color: 'bg-hunter-success' };
    return { level: 3, label: 'Good', color: 'bg-hunter-accent' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-hunter-bg grid-bg">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hunter-accent/10 border border-hunter-accent/30 mb-4">
              <svg className="w-8 h-8 text-hunter-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-hunter-bright">Create Account</h1>
            <p className="text-hunter-muted mt-2 text-sm">Join the Phishing Hunter training platform</p>
          </div>

          <div className="card">
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-hunter-danger/10 border border-hunter-danger/30 rounded-lg space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-hunter-danger text-sm font-mono">{e.msg}</p>
                ))}
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
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                {/* Role detection badge */}
                {email.includes('@') && (
                  <div className="mt-2">
                    {role === 'admin' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-hunter-warning/10 text-hunter-warning border border-hunter-warning/30 rounded-full px-3 py-1 font-mono">
                        ⚡ Admin account detected
                      </span>
                    )}
                    {role === 'student' && (
                      <span className="inline-flex items-center gap-1 text-xs bg-hunter-accent/10 text-hunter-accent border border-hunter-accent/30 rounded-full px-3 py-1 font-mono">
                        ✓ Student account
                      </span>
                    )}
                    {role === null && email.length > 5 && (
                      <span className="inline-flex items-center gap-1 text-xs bg-hunter-danger/10 text-hunter-danger border border-hunter-danger/30 rounded-full px-3 py-1 font-mono">
                        ✗ Must end with .edu
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {strength && (
                  <div className="mt-2">
                    <div className="flex gap-1 h-1.5">
                      {[1,2,3,4].map(l => (
                        <div
                          key={l}
                          className={`flex-1 rounded-full transition-all ${l <= strength.level ? strength.color : 'bg-hunter-border'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-hunter-muted mt-1 font-mono">{strength.label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={`input-field ${confirm && password !== confirm ? 'border-hunter-danger' : ''}`}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {confirm && password !== confirm && (
                  <p className="text-hunter-danger text-xs mt-1 font-mono">Passwords don't match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !role}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-hunter-bg border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-hunter-border text-center">
              <p className="text-hunter-muted text-sm">
                Already registered?{' '}
                <Link to="/login" className="text-hunter-accent hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
