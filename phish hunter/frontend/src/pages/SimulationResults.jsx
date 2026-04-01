import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSimulationResults } from '../services/api';
import Navbar from '../components/Navbar';

function GradeBadge({ pct }) {
  if (pct >= 90) return <span className="text-hunter-success font-black font-mono text-6xl">A</span>;
  if (pct >= 80) return <span className="text-hunter-accent font-black font-mono text-6xl">B</span>;
  if (pct >= 70) return <span className="text-hunter-warning font-black font-mono text-6xl">C</span>;
  if (pct >= 60) return <span className="text-orange-400 font-black font-mono text-6xl">D</span>;
  return <span className="text-hunter-danger font-black font-mono text-6xl">F</span>;
}

export default function SimulationResults() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getSimulationResults(id)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-hunter-bg flex items-center justify-center">
      <div className="terminal-text animate-pulse">Loading results...</div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-hunter-bg flex items-center justify-center">
      <div className="text-hunter-danger">Results not found</div>
    </div>
  );

  const { simulation, answers } = data;
  const pct = Math.round((simulation.score / simulation.total_questions) * 100);

  return (
    <div className="min-h-screen bg-hunter-bg">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Score hero */}
        <div className="card border-2 border-hunter-accent/20 text-center mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-hunter-accent/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="terminal-text text-xs mb-4">SIMULATION COMPLETE</div>
            <GradeBadge pct={pct} />
            <div className="text-hunter-muted text-sm mt-2 mb-6">
              {pct >= 80 ? 'Excellent phishing detection skills!' :
               pct >= 60 ? 'Good effort. Keep practicing!' :
               'More training recommended. Review the mistakes below.'}
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-hunter-surface rounded-lg p-4">
                <div className="text-3xl font-black text-hunter-bright font-mono">{simulation.score}</div>
                <div className="text-xs text-hunter-muted">Correct</div>
              </div>
              <div className="bg-hunter-surface rounded-lg p-4">
                <div className="text-3xl font-black text-hunter-accent font-mono">{pct}%</div>
                <div className="text-xs text-hunter-muted">Score</div>
              </div>
              <div className="bg-hunter-surface rounded-lg p-4">
                <div className="text-3xl font-black text-hunter-danger font-mono">
                  {simulation.total_questions - simulation.score}
                </div>
                <div className="text-xs text-hunter-muted">Missed</div>
              </div>
            </div>

            {/* Score bar */}
            <div className="bg-hunter-border rounded-full h-3 max-w-sm mx-auto">
              <div
                className="h-full rounded-full bg-gradient-to-r from-hunter-accent to-hunter-success transition-all duration-1000"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Answer review */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-hunter-bright mb-6">Answer Review</h2>
          <div className="space-y-3">
            {answers.map((ans, i) => (
              <div key={ans.id}>
                <button
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    ans.is_correct
                      ? 'border-hunter-success/30 bg-hunter-success/5 hover:bg-hunter-success/10'
                      : 'border-hunter-danger/30 bg-hunter-danger/5 hover:bg-hunter-danger/10'
                  }`}
                  onClick={() => setExpandedId(expandedId === ans.id ? null : ans.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl shrink-0">{ans.is_correct ? '✅' : '❌'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-hunter-text truncate">{ans.email_subject}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 capitalize font-mono ${
                          ans.difficulty === 'hard' ? 'border-hunter-danger/40 text-hunter-danger' :
                          ans.difficulty === 'medium' ? 'border-hunter-warning/40 text-hunter-warning' :
                          'border-hunter-success/40 text-hunter-success'
                        }`}>{ans.difficulty}</span>
                      </div>
                      <div className="flex gap-4 text-xs font-mono text-hunter-muted">
                        <span>Your answer: <span className={ans.student_answer === 'phish' ? 'text-hunter-danger' : 'text-hunter-success'}>{ans.student_answer}</span></span>
                        <span>Correct: <span className={ans.correct_answer === 'phish' ? 'text-hunter-danger' : 'text-hunter-success'}>{ans.correct_answer}</span></span>
                      </div>
                    </div>
                    <span className="text-hunter-muted text-xs">{expandedId === ans.id ? '▲' : '▼'}</span>
                  </div>
                </button>

                {expandedId === ans.id && ans.explanation && (
                  <div className="mt-1 p-4 bg-hunter-surface rounded-lg border-l-4 border-hunter-accent ml-4">
                    <p className="text-xs font-mono text-hunter-accent mb-1 uppercase">Explanation</p>
                    <p className="text-sm text-hunter-text leading-relaxed">{ans.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to="/simulation" className="btn-primary flex-1 text-center glow-accent">
            🔄 Try Again
          </Link>
          <Link to="/dashboard" className="btn-ghost flex-1 text-center">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
