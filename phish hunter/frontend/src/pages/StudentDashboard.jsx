import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyHistory } from '../services/api';
import Navbar from '../components/Navbar';

function ScoreBadge({ pct }) {
  if (pct >= 80) return <span className="text-hunter-success font-mono font-bold">{pct}%</span>;
  if (pct >= 60) return <span className="text-hunter-warning font-mono font-bold">{pct}%</span>;
  return <span className="text-hunter-danger font-mono font-bold">{pct}%</span>;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyHistory()
      .then(res => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const avgScore = history.length
    ? Math.round(history.reduce((a, s) => a + s.percentage, 0) / history.length)
    : 0;

  const bestScore = history.length
    ? Math.max(...history.map(s => s.percentage))
    : 0;

  return (
    <div className="min-h-screen bg-hunter-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="terminal-text text-xs">STUDENT TERMINAL</span>
            <span className="w-1.5 h-1.5 bg-hunter-success rounded-full animate-pulse" />
          </div>
          <h1 className="text-4xl font-black text-hunter-bright">
            Welcome back,{' '}
            <span className="text-hunter-accent">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-hunter-muted mt-2">Track your phishing detection progress below.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Simulations', value: history.length, icon: '🎯' },
            { label: 'Avg Score', value: history.length ? `${avgScore}%` : '—', icon: '📊' },
            { label: 'Best Score', value: history.length ? `${bestScore}%` : '—', icon: '🏆' },
            { label: 'Status', value: 'Active', icon: '✅' },
          ].map((stat, i) => (
            <div key={i} className="card text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-black text-hunter-accent font-mono">{stat.value}</div>
              <div className="text-xs text-hunter-muted mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Start simulation CTA */}
        <div className="card border-hunter-accent/30 bg-gradient-to-r from-hunter-accent/5 to-transparent mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-hunter-bright mb-1">Ready to test yourself?</h2>
              <p className="text-hunter-muted text-sm">10 realistic phishing emails. Can you spot them all?</p>
            </div>
            <Link
              to="/simulation"
              className="btn-primary whitespace-nowrap glow-accent"
            >
              ▶ Start Simulation
            </Link>
          </div>
        </div>

        {/* History table */}
        <div className="card">
          <h2 className="text-lg font-bold text-hunter-bright mb-6">Simulation History</h2>
          {loading ? (
            <div className="text-center py-10 text-hunter-muted font-mono animate-pulse">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🎯</div>
              <p className="text-hunter-muted">No simulations yet. Start your first one above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hunter-border text-left">
                    <th className="pb-3 text-xs font-mono text-hunter-muted uppercase tracking-wider">Date</th>
                    <th className="pb-3 text-xs font-mono text-hunter-muted uppercase tracking-wider">Score</th>
                    <th className="pb-3 text-xs font-mono text-hunter-muted uppercase tracking-wider">Result</th>
                    <th className="pb-3 text-xs font-mono text-hunter-muted uppercase tracking-wider">Grade</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-hunter-border">
                  {history.map(sim => (
                    <tr key={sim.id} className="hover:bg-hunter-surface/50 transition-colors">
                      <td className="py-3 text-hunter-muted font-mono text-xs">
                        {new Date(sim.completed_at || sim.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                      <td className="py-3">
                        <span className="text-hunter-text font-mono">{sim.score}/{sim.total_questions}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-hunter-border rounded-full h-1.5 max-w-24">
                            <div
                              className="h-full rounded-full bg-hunter-accent transition-all"
                              style={{ width: `${sim.percentage}%` }}
                            />
                          </div>
                          <ScoreBadge pct={sim.percentage} />
                        </div>
                      </td>
                      <td className="py-3">
                        {sim.percentage >= 80 ? (
                          <span className="text-xs px-2 py-1 bg-hunter-success/10 text-hunter-success rounded-full border border-hunter-success/30">Pass</span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-hunter-danger/10 text-hunter-danger rounded-full border border-hunter-danger/30">Review</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to={`/results/${sim.id}`}
                          className="text-xs text-hunter-accent hover:underline font-mono"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
