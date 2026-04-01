import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboard, getAdminStudents, getAdminSimulations, getSimulationDetails
} from '../services/api';
import Navbar from '../components/Navbar';

function StatCard({ icon, label, value, color = 'text-hunter-accent' }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono text-hunter-muted uppercase tracking-wider mb-2">{label}</p>
          <p className={`text-3xl font-black font-mono ${color}`}>{value ?? '—'}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [students, setStudents] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [selectedSim, setSelectedSim] = useState(null);
  const [simDetails, setSimDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, studRes, simRes] = await Promise.all([
        getAdminDashboard(),
        getAdminStudents(),
        getAdminSimulations()
      ]);
      setDashboard(dashRes.data);
      setStudents(studRes.data);
      setSimulations(simRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 15 seconds for real-time updates
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleViewSim = async (simId) => {
    setSelectedSim(simId);
    const res = await getSimulationDetails(simId);
    setSimDetails(res.data);
  };

  if (loading) return (
    <div className="min-h-screen bg-hunter-bg flex items-center justify-center">
      <div className="terminal-text animate-pulse">LOADING ADMIN TERMINAL...</div>
    </div>
  );

  const tabs = ['overview', 'students', 'simulations'];

  return (
    <div className="min-h-screen bg-hunter-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="terminal-text text-xs">ADMIN TERMINAL</span>
              <span className="w-1.5 h-1.5 bg-hunter-success rounded-full animate-pulse" />
              <span className="text-xs font-mono text-hunter-muted">LIVE</span>
            </div>
            <h1 className="text-3xl font-black text-hunter-bright">Admin Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="btn-ghost text-sm py-2 px-4">
              ↻ Refresh
            </button>
            <Link to="/admin/scenarios" className="btn-primary text-sm py-2 px-4">
              Manage Scenarios
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon="👥" label="Total Students" value={dashboard?.totalStudents} />
          <StatCard icon="🎯" label="Simulations Done" value={dashboard?.totalSimulations} />
          <StatCard
            icon="📊"
            label="Average Score"
            value={dashboard?.avgScore ? `${dashboard.avgScore}%` : '—'}
            color={dashboard?.avgScore >= 70 ? 'text-hunter-success' : 'text-hunter-warning'}
          />
          <StatCard icon="📧" label="Total Scenarios" value={dashboard?.totalScenarios} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-hunter-surface p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? 'bg-hunter-card text-hunter-bright border border-hunter-border'
                  : 'text-hunter-muted hover:text-hunter-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Most missed */}
            {dashboard?.mostMissed?.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-hunter-bright mb-4">⚠️ Most Missed Scenarios</h2>
                <div className="space-y-3">
                  {dashboard.mostMissed.map((s, i) => (
                    <div key={s.id} className="flex items-center gap-4 p-3 bg-hunter-surface rounded-lg">
                      <span className="text-2xl font-black text-hunter-muted font-mono w-8">#{i+1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-hunter-text truncate">{s.email_subject}</p>
                        <p className="text-xs text-hunter-muted font-mono">{s.totalAnswers} attempts</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-hunter-danger font-bold font-mono">{s.missRate}%</div>
                        <div className="text-xs text-hunter-muted">miss rate</div>
                      </div>
                      <div className="w-24 bg-hunter-border rounded-full h-2">
                        <div
                          className="h-full rounded-full bg-hunter-danger"
                          style={{ width: `${s.missRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent simulations */}
            <div className="card">
              <h2 className="text-lg font-bold text-hunter-bright mb-4">Recent Activity</h2>
              {simulations.length === 0 ? (
                <p className="text-hunter-muted text-sm">No simulations completed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hunter-border text-left">
                        <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Student</th>
                        <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Score</th>
                        <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hunter-border">
                      {simulations.slice(0, 8).map(sim => (
                        <tr key={sim.id} className="hover:bg-hunter-surface/50">
                          <td className="py-3 text-hunter-text font-mono text-xs">{sim.student_email}</td>
                          <td className="py-3">
                            <span className={`font-mono font-bold ${sim.percentage >= 80 ? 'text-hunter-success' : sim.percentage >= 60 ? 'text-hunter-warning' : 'text-hunter-danger'}`}>
                              {sim.score}/{sim.total_questions} ({sim.percentage}%)
                            </span>
                          </td>
                          <td className="py-3 text-hunter-muted text-xs font-mono">
                            {new Date(sim.completed_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="card">
            <h2 className="text-lg font-bold text-hunter-bright mb-6">All Students ({students.length})</h2>
            {students.length === 0 ? (
              <p className="text-hunter-muted">No students registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hunter-border text-left">
                      <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Email</th>
                      <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Simulations</th>
                      <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Avg Score</th>
                      <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Best</th>
                      <th className="pb-3 text-xs font-mono text-hunter-muted uppercase">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hunter-border">
                    {students.map(s => (
                      <tr key={s.id} className="hover:bg-hunter-surface/50">
                        <td className="py-3 text-hunter-text font-mono text-xs">{s.email}</td>
                        <td className="py-3 text-hunter-text font-mono">{s.totalSimulations}</td>
                        <td className="py-3">
                          {s.avgScore != null ? (
                            <span className={`font-mono font-bold ${s.avgScore >= 80 ? 'text-hunter-success' : s.avgScore >= 60 ? 'text-hunter-warning' : 'text-hunter-danger'}`}>
                              {s.avgScore}%
                            </span>
                          ) : <span className="text-hunter-muted">—</span>}
                        </td>
                        <td className="py-3 font-mono text-hunter-muted">
                          {s.bestScore != null ? `${Math.round((s.bestScore / s.totalQuestions) * 100)}%` : '—'}
                        </td>
                        <td className="py-3 text-hunter-muted text-xs font-mono">
                          {new Date(s.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Simulations Tab */}
        {activeTab === 'simulations' && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-bold text-hunter-bright mb-6">All Simulations</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {simulations.map(sim => (
                  <button
                    key={sim.id}
                    onClick={() => handleViewSim(sim.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedSim === sim.id
                        ? 'border-hunter-accent bg-hunter-accent/5'
                        : 'border-hunter-border hover:border-hunter-muted bg-hunter-surface/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono text-hunter-text truncate">{sim.student_email}</p>
                        <p className="text-xs text-hunter-muted font-mono">
                          {new Date(sim.completed_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`font-bold font-mono ml-3 ${sim.percentage >= 80 ? 'text-hunter-success' : sim.percentage >= 60 ? 'text-hunter-warning' : 'text-hunter-danger'}`}>
                        {sim.score}/{sim.total_questions}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedSim && (
              <div className="card">
                <h2 className="text-lg font-bold text-hunter-bright mb-4">Answer Details</h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {simDetails.map((ans, i) => (
                    <div key={ans.id} className={`p-3 rounded-lg border ${ans.is_correct ? 'border-hunter-success/20 bg-hunter-success/5' : 'border-hunter-danger/20 bg-hunter-danger/5'}`}>
                      <div className="flex gap-2 items-start">
                        <span>{ans.is_correct ? '✅' : '❌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-hunter-text truncate">{ans.email_subject}</p>
                          <p className="text-xs font-mono text-hunter-muted mt-0.5">
                            Student: <span className={ans.student_answer === 'phish' ? 'text-hunter-danger' : 'text-hunter-success'}>{ans.student_answer}</span>
                            {' · '}Answer: <span className={ans.correct_answer === 'phish' ? 'text-hunter-danger' : 'text-hunter-success'}>{ans.correct_answer}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
