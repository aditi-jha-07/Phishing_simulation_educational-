import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScenarios, startSimulation, submitAnswer, completeSimulation } from '../services/api';
import Navbar from '../components/Navbar';

function EmailViewer({ scenario }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200 text-gray-900">
      {/* Email client chrome */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
        <div className="flex gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex gap-3">
            <span className="text-gray-500 w-14 shrink-0">From:</span>
            <span className="font-mono text-gray-800 bg-gray-200 px-2 py-0.5 rounded text-xs">{scenario.email_from}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-500 w-14 shrink-0">Subject:</span>
            <span className="font-semibold text-gray-900">{scenario.email_subject}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-500 w-14 shrink-0">To:</span>
            <span className="text-gray-600 text-sm">you@university.edu</span>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div
        className="p-6 min-h-48 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: scenario.email_body }}
      />
    </div>
  );
}

function FeedbackOverlay({ feedback, onNext }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`card max-w-md w-full border-2 ${feedback.isCorrect ? 'border-hunter-success glow-success' : 'border-hunter-danger glow-danger'} animate-slide-up`}>
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">{feedback.isCorrect ? '✅' : '❌'}</div>
          <h2 className={`text-2xl font-black ${feedback.isCorrect ? 'text-hunter-success' : 'text-hunter-danger'}`}>
            {feedback.isCorrect ? 'Correct!' : 'Incorrect!'}
          </h2>
          <p className="text-hunter-muted mt-2 text-sm">
            This email was{' '}
            <span className={`font-bold uppercase ${feedback.correctAnswer === 'phish' ? 'text-hunter-danger' : 'text-hunter-success'}`}>
              {feedback.correctAnswer === 'phish' ? '🎣 Phishing' : '✉️ Legitimate'}
            </span>
          </p>
        </div>

        {feedback.explanation && (
          <div className="bg-hunter-surface rounded-lg p-4 mb-6 border-l-4 border-hunter-accent">
            <p className="text-xs font-mono text-hunter-accent mb-1 uppercase">Why?</p>
            <p className="text-hunter-text text-sm leading-relaxed">{feedback.explanation}</p>
          </div>
        )}

        <button onClick={onNext} className="btn-primary w-full">
          {feedback.isLast ? 'View Final Results →' : 'Next Email →'}
        </button>
      </div>
    </div>
  );
}

export default function Simulation() {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [simulationId, setSimulationId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const [scenRes, simRes] = await Promise.all([
          getScenarios(),
          startSimulation()
        ]);
        setScenarios(scenRes.data);
        setSimulationId(simRes.data.simulationId);
      } catch (err) {
        setError('Failed to start simulation. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleAnswer = useCallback(async (answer) => {
    if (submitting || !simulationId) return;
    const scenario = scenarios[currentIndex];
    setSubmitting(true);

    try {
      const res = await submitAnswer(simulationId, scenario.id, answer);
      const { isCorrect, correctAnswer } = res.data;
      if (isCorrect) setScore(s => s + 1);

      setAnsweredIds(prev => new Set([...prev, scenario.id]));
      setFeedback({
        isCorrect,
        correctAnswer,
        explanation: null, // Will be shown in final results for brevity during sim
        isLast: currentIndex === scenarios.length - 1
      });
    } catch (err) {
      if (err.response?.status === 409) {
        // Already answered, move on
        setCurrentIndex(i => i + 1);
      } else {
        setError('Failed to submit answer. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [currentIndex, scenarios, simulationId, submitting]);

  const handleNext = async () => {
    if (feedback?.isLast) {
      // Complete the simulation
      try {
        await completeSimulation(simulationId);
        navigate(`/results/${simulationId}`);
      } catch (err) {
        setError('Failed to complete simulation.');
      }
    } else {
      setCurrentIndex(i => i + 1);
      setFeedback(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-hunter-bg grid-bg flex items-center justify-center">
      <div className="text-center">
        <div className="terminal-text text-lg animate-pulse mb-2">LOADING SCENARIOS...</div>
        <div className="text-hunter-muted text-sm font-mono">Fetching 10 email scenarios</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-hunter-bg flex items-center justify-center">
      <div className="card text-center max-w-md">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-hunter-danger mb-4">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn-ghost">Back to Dashboard</button>
      </div>
    </div>
  );

  const scenario = scenarios[currentIndex];
  const progress = ((currentIndex) / scenarios.length) * 100;

  return (
    <div className="min-h-screen bg-hunter-bg">
      <Navbar />

      {/* Feedback overlay */}
      {feedback && <FeedbackOverlay feedback={feedback} onNext={handleNext} />}

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Progress header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="terminal-text text-xs">EMAIL {currentIndex + 1} OF {scenarios.length}</span>
              <span className="text-xs px-2 py-0.5 border border-hunter-border rounded-full text-hunter-muted font-mono capitalize">
                {scenario?.difficulty || 'medium'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-hunter-accent font-mono font-bold">{score}</span>
              <span className="text-hunter-muted font-mono text-sm">/{currentIndex} correct</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-hunter-border rounded-full h-2">
            <div
              className="bg-hunter-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {scenarios.map((_, i) => (
              <div
                key={i}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  i < currentIndex ? 'bg-hunter-accent' :
                  i === currentIndex ? 'bg-hunter-accent/50 animate-pulse' :
                  'bg-hunter-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Instruction */}
        <div className="mb-4 flex items-center gap-2">
          <div className="w-2 h-2 bg-hunter-warning rounded-full animate-pulse" />
          <p className="text-hunter-muted text-sm font-mono">
            Analyze this email carefully. Is it phishing or legitimate?
          </p>
        </div>

        {/* Email viewer */}
        <div className="mb-6 shadow-2xl">
          <EmailViewer scenario={scenario} />
        </div>

        {/* Answer buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleAnswer('phish')}
            disabled={submitting}
            className="group relative py-5 px-6 rounded-xl border-2 border-hunter-danger/30 bg-hunter-danger/5 hover:bg-hunter-danger/15 hover:border-hunter-danger transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🎣</div>
            <div className="text-hunter-danger font-black text-lg">PHISHING</div>
            <div className="text-hunter-muted text-xs mt-1">This is a scam email</div>
          </button>

          <button
            onClick={() => handleAnswer('legitimate')}
            disabled={submitting}
            className="group relative py-5 px-6 rounded-xl border-2 border-hunter-success/30 bg-hunter-success/5 hover:bg-hunter-success/15 hover:border-hunter-success transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">✉️</div>
            <div className="text-hunter-success font-black text-lg">LEGITIMATE</div>
            <div className="text-hunter-muted text-xs mt-1">This is a real email</div>
          </button>
        </div>

        {submitting && (
          <div className="text-center mt-4 text-hunter-muted text-sm font-mono animate-pulse">
            Recording answer...
          </div>
        )}
      </div>
    </div>
  );
}
