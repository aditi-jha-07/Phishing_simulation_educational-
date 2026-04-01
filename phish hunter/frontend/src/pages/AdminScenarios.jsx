import React, { useState, useEffect } from 'react';
import { getAdminScenarios, createScenario, updateScenario, deleteScenario } from '../services/api';
import Navbar from '../components/Navbar';

const EMPTY_FORM = {
  email_subject: '',
  email_from: '',
  email_body: '',
  correct_answer: 'phish',
  explanation: '',
  difficulty: 'medium'
};

function ScenarioModal({ scenario, onClose, onSave }) {
  const [form, setForm] = useState(scenario ? { ...scenario } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (scenario) {
        await updateScenario(scenario.id, form);
      } else {
        await createScenario(form);
      }
      onSave();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.errors?.map(e => e.msg).join(', ') ||
        data?.error ||
        'Failed to save scenario'
      );
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-hunter-card border border-hunter-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-hunter-border">
          <h2 className="text-xl font-bold text-hunter-bright">
            {scenario ? 'Edit Scenario' : 'Add New Scenario'}
          </h2>
          <button onClick={onClose} className="text-hunter-muted hover:text-hunter-text transition-colors text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-hunter-danger/10 border border-hunter-danger/30 rounded-lg">
              <p className="text-hunter-danger text-sm font-mono">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase">Email Subject</label>
              <input className="input-field" value={form.email_subject} onChange={set('email_subject')} required placeholder="Subject line" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase">From Address</label>
              <input className="input-field" type="email" value={form.email_from} onChange={set('email_from')} required placeholder="sender@domain.com" />
            </div>

            <div>
              <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase">Correct Answer</label>
              <select className="input-field" value={form.correct_answer} onChange={set('correct_answer')}>
                <option value="phish">🎣 Phishing</option>
                <option value="legitimate">✉️ Legitimate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase">Difficulty</label>
              <select className="input-field" value={form.difficulty} onChange={set('difficulty')}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase">
                Email Body (HTML supported)
              </label>
              <textarea
                className="input-field h-48 resize-y font-mono text-xs"
                value={form.email_body}
                onChange={set('email_body')}
                required
                placeholder="<div>Email HTML content here...</div>"
              />
              <p className="text-xs text-hunter-muted mt-1">Tip: Use inline styles for email content. HTML is rendered.</p>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-mono text-hunter-muted mb-2 uppercase">Explanation (shown after answer)</label>
              <textarea
                className="input-field h-24 resize-y"
                value={form.explanation}
                onChange={set('explanation')}
                required
                placeholder="Explain why this email is phishing or legitimate..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : (scenario ? 'Update Scenario' : 'Create Scenario')}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost px-6">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminScenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | scenario object
  const [deleting, setDeleting] = useState(null);
  const [previewId, setPreviewId] = useState(null);

  const fetchScenarios = async () => {
    try {
      const res = await getAdminScenarios();
      setScenarios(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchScenarios(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scenario? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await deleteScenario(id);
      setScenarios(s => s.filter(x => x.id !== id));
    } catch (err) {
      alert('Failed to delete scenario');
    } finally {
      setDeleting(null);
    }
  };

  const preview = scenarios.find(s => s.id === previewId);

  return (
    <div className="min-h-screen bg-hunter-bg">
      <Navbar />

      {modal && (
        <ScenarioModal
          scenario={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={fetchScenarios}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="terminal-text text-xs mb-1">SCENARIO MANAGEMENT</div>
            <h1 className="text-3xl font-black text-hunter-bright">Email Scenarios</h1>
          </div>
          <button onClick={() => setModal('add')} className="btn-primary">
            + Add Scenario
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 terminal-text animate-pulse">Loading scenarios...</div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Scenario list */}
            <div className="space-y-3">
              {scenarios.map(s => (
                <div
                  key={s.id}
                  className={`card card-hover cursor-pointer transition-all ${previewId === s.id ? 'border-hunter-accent' : ''}`}
                  onClick={() => setPreviewId(previewId === s.id ? null : s.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono uppercase ${
                          s.correct_answer === 'phish'
                            ? 'border-hunter-danger/40 text-hunter-danger bg-hunter-danger/5'
                            : 'border-hunter-success/40 text-hunter-success bg-hunter-success/5'
                        }`}>
                          {s.correct_answer === 'phish' ? '🎣 Phish' : '✉️ Legit'}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-mono capitalize ${
                          s.difficulty === 'hard' ? 'border-hunter-danger/30 text-hunter-danger' :
                          s.difficulty === 'medium' ? 'border-hunter-warning/30 text-hunter-warning' :
                          'border-hunter-success/30 text-hunter-success'
                        }`}>{s.difficulty}</span>
                      </div>
                      <p className="font-medium text-hunter-bright text-sm truncate">{s.email_subject}</p>
                      <p className="text-xs font-mono text-hunter-muted mt-0.5">{s.email_from}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); setModal(s); }}
                        className="text-xs px-3 py-1.5 border border-hunter-border text-hunter-muted hover:text-hunter-accent hover:border-hunter-accent rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        disabled={deleting === s.id}
                        className="text-xs px-3 py-1.5 border border-hunter-border text-hunter-muted hover:text-hunter-danger hover:border-hunter-danger rounded-lg transition-colors"
                      >
                        {deleting === s.id ? '...' : 'Del'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview pane */}
            <div className="sticky top-20">
              {preview ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="terminal-text text-xs">EMAIL PREVIEW</span>
                  </div>
                  <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-gray-200 text-gray-900">
                    <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex gap-3">
                          <span className="text-gray-500 w-14 shrink-0">From:</span>
                          <span className="font-mono text-gray-800 text-xs bg-gray-200 px-2 py-0.5 rounded">{preview.email_from}</span>
                        </div>
                        <div className="flex gap-3">
                          <span className="text-gray-500 w-14 shrink-0">Subject:</span>
                          <span className="font-semibold text-gray-900">{preview.email_subject}</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="p-4 text-sm max-h-80 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: preview.email_body }}
                    />
                  </div>
                  <div className="mt-4 card border-l-4 border-hunter-accent">
                    <p className="text-xs font-mono text-hunter-accent mb-1">EXPLANATION</p>
                    <p className="text-sm text-hunter-text">{preview.explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="card border-dashed text-center py-20">
                  <p className="text-hunter-muted">Click a scenario to preview it</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
