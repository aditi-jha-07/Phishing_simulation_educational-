import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const stats = [
  { value: '10', label: 'Email Scenarios', icon: '📧' },
  { value: 'Real-Time', label: 'Score Tracking', icon: '⚡' },
  { value: '100%', label: 'Browser Based', icon: '🌐' },
];

const features = [
  {
    icon: '🎯',
    title: 'Realistic Simulations',
    desc: 'Practice with authentic-looking phishing emails crafted to mirror real-world attacks.'
  },
  {
    icon: '⚡',
    title: 'Instant Feedback',
    desc: 'Learn immediately whether each answer was correct, with explanations of red flags.'
  },
  {
    icon: '📊',
    title: 'Performance Analytics',
    desc: 'Track your progress over time and identify areas where you need improvement.'
  },
  {
    icon: '🛡️',
    title: 'Role-Based Access',
    desc: 'Admins manage content and monitor all students. Students focus on learning.'
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-hunter-bg grid-bg">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-32 px-4">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-hunter-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-hunter-card border border-hunter-border rounded-full px-4 py-2 text-xs font-mono text-hunter-accent mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-hunter-accent rounded-full animate-pulse" />
            CYBERSECURITY TRAINING PLATFORM — BETA
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black text-hunter-bright leading-tight mb-6 animate-slide-up">
            Train Your Team to<br />
            <span className="text-hunter-accent">Spot Phishing</span>
          </h1>

          <p className="text-xl text-hunter-text max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Interactive email simulation platform where students learn to identify phishing attacks through hands-on practice. Real threats, realistic scenarios, real-time feedback.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="btn-primary text-lg py-4 px-10 glow-accent">
              Start Training Free
            </Link>
            <Link to="/login" className="btn-ghost text-lg py-4 px-10">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-20 max-w-lg mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="text-center animate-fade-in" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <div className="text-3xl mb-1">{s.icon}</div>
                <div className="text-2xl font-black text-hunter-accent font-mono">{s.value}</div>
                <div className="text-xs text-hunter-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-hunter-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="terminal-text text-sm">HOW IT WORKS</span>
            <h2 className="text-3xl font-black text-hunter-bright mt-2">Three Steps to Phishing Mastery</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register', desc: 'Create your account with your .edu email. The system auto-detects if you\'re a student or admin.' },
              { step: '02', title: 'Simulate', desc: 'You\'ll receive 10 realistic emails. Classify each as Phishing or Legitimate before time reveals all.' },
              { step: '03', title: 'Learn', desc: 'See your score with detailed explanations for every email. Admins track your progress in real time.' },
            ].map((item, i) => (
              <div key={i} className="card card-hover relative">
                <div className="text-6xl font-black font-mono text-hunter-border absolute top-4 right-6">{item.step}</div>
                <h3 className="text-xl font-bold text-hunter-bright mb-3">{item.title}</h3>
                <p className="text-hunter-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 border-t border-hunter-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="terminal-text text-sm">FEATURES</span>
            <h2 className="text-3xl font-black text-hunter-bright mt-2">Built for Security Education</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card card-hover flex gap-4">
                <div className="text-3xl">{f.icon}</div>
                <div>
                  <h3 className="font-bold text-hunter-bright mb-1">{f.title}</h3>
                  <p className="text-hunter-muted text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-hunter-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-hunter-bright mb-4">Ready to Test Your Skills?</h2>
          <p className="text-hunter-muted mb-8">Join students learning to identify phishing threats before they become victims.</p>
          <Link to="/register" className="btn-primary text-lg py-4 px-12 glow-accent">
            Get Started — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-hunter-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-hunter-bright">PHISHING<span className="text-hunter-accent">HUNTER</span></span>
          <p className="text-hunter-muted text-sm">© 2024 PhishingHunter — Cybersecurity Training Platform</p>
        </div>
      </footer>
    </div>
  );
}
