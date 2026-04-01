const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireStudent } = require('../middleware/auth');

const router = express.Router();

// GET /api/simulations/scenarios - get 10 random scenarios for a new sim
router.get('/scenarios', authenticateToken, requireStudent, async (req, res) => {
  try {
    const [scenarios] = await pool.execute(
      'SELECT id, email_subject, email_from, email_body, difficulty FROM scenarios ORDER BY RAND() LIMIT 10'
    );
    res.json(scenarios);
  } catch (err) {
    console.error('Scenarios error:', err);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// POST /api/simulations/start - create a new simulation
router.post('/start', authenticateToken, requireStudent, async (req, res) => {
  try {
    // Check for incomplete simulation
    const [incomplete] = await pool.execute(
      'SELECT id FROM simulations WHERE user_id = ? AND completed = 0',
      [req.user.id]
    );
    if (incomplete.length > 0) {
      return res.json({ simulationId: incomplete[0].id, resumed: true });
    }

    const [result] = await pool.execute(
      'INSERT INTO simulations (user_id, score, total_questions, completed) VALUES (?, 0, 10, 0)',
      [req.user.id]
    );
    res.status(201).json({ simulationId: result.insertId, resumed: false });
  } catch (err) {
    console.error('Start simulation error:', err);
    res.status(500).json({ error: 'Failed to start simulation' });
  }
});

// POST /api/simulations/:id/answer - record a single answer in real-time
router.post('/:id/answer', authenticateToken, requireStudent, async (req, res) => {
  const { id } = req.params;
  const { scenarioId, studentAnswer } = req.body;

  if (!scenarioId || !studentAnswer || !['phish','legitimate'].includes(studentAnswer)) {
    return res.status(400).json({ error: 'Invalid answer data' });
  }

  try {
    // Verify this simulation belongs to this student
    const [sims] = await pool.execute(
      'SELECT * FROM simulations WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (sims.length === 0) {
      return res.status(403).json({ error: 'Simulation not found or access denied' });
    }
    if (sims[0].completed) {
      return res.status(400).json({ error: 'Simulation already completed' });
    }

    // Get correct answer
    const [scenarios] = await pool.execute(
      'SELECT correct_answer FROM scenarios WHERE id = ?',
      [scenarioId]
    );
    if (scenarios.length === 0) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const correctAnswer = scenarios[0].correct_answer;
    const isCorrect = studentAnswer === correctAnswer ? 1 : 0;

    // Check if already answered this scenario in this sim
    const [existing] = await pool.execute(
      'SELECT id FROM simulation_answers WHERE simulation_id = ? AND scenario_id = ?',
      [id, scenarioId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Already answered this scenario' });
    }

    // Record the answer immediately
    await pool.execute(
      `INSERT INTO simulation_answers 
       (simulation_id, scenario_id, student_answer, correct_answer, is_correct)
       VALUES (?, ?, ?, ?, ?)`,
      [id, scenarioId, studentAnswer, correctAnswer, isCorrect]
    );

    // Update running score
    if (isCorrect) {
      await pool.execute(
        'UPDATE simulations SET score = score + 1 WHERE id = ?',
        [id]
      );
    }

    res.json({
      isCorrect: !!isCorrect,
      correctAnswer,
      message: isCorrect ? 'Correct!' : 'Incorrect'
    });
  } catch (err) {
    console.error('Answer error:', err);
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// POST /api/simulations/:id/complete - mark simulation as done
router.post('/:id/complete', authenticateToken, requireStudent, async (req, res) => {
  const { id } = req.params;

  try {
    const [sims] = await pool.execute(
      'SELECT * FROM simulations WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    if (sims.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await pool.execute(
      'UPDATE simulations SET completed = 1, completed_at = NOW() WHERE id = ?',
      [id]
    );

    // Get full results with explanations
    const [answers] = await pool.execute(
      `SELECT sa.*, s.email_subject, s.email_from, s.explanation, s.difficulty
       FROM simulation_answers sa
       JOIN scenarios s ON sa.scenario_id = s.id
       WHERE sa.simulation_id = ?
       ORDER BY sa.answered_at ASC`,
      [id]
    );

    const sim = sims[0];
    res.json({
      simulationId: parseInt(id),
      score: sim.score,
      totalQuestions: sim.total_questions,
      percentage: Math.round((sim.score / sim.total_questions) * 100),
      answers
    });
  } catch (err) {
    console.error('Complete error:', err);
    res.status(500).json({ error: 'Failed to complete simulation' });
  }
});

// GET /api/simulations/my-history - student's own history
router.get('/my-history', authenticateToken, requireStudent, async (req, res) => {
  try {
    const [simulations] = await pool.execute(
      `SELECT s.id, s.score, s.total_questions, s.completed, s.created_at, s.completed_at,
              ROUND((s.score / s.total_questions) * 100) as percentage
       FROM simulations s
       WHERE s.user_id = ? AND s.completed = 1
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );
    res.json(simulations);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/simulations/:id/results - get detailed results for a completed sim
router.get('/:id/results', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const [sims] = await pool.execute(
      `SELECT s.*, u.email as student_email FROM simulations s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [id]
    );
    if (sims.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const sim = sims[0];
    // Students can only see their own; admins can see all
    if (req.user.role === 'student' && sim.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [answers] = await pool.execute(
      `SELECT sa.*, sc.email_subject, sc.email_from, sc.explanation, sc.difficulty
       FROM simulation_answers sa
       JOIN scenarios sc ON sa.scenario_id = sc.id
       WHERE sa.simulation_id = ?
       ORDER BY sa.answered_at ASC`,
      [id]
    );

    res.json({ simulation: sim, answers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
