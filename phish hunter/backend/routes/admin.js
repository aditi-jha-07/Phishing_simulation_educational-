const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticateToken, requireAdmin);

// GET /api/admin/dashboard - overall stats
router.get('/dashboard', async (req, res) => {
  try {
    const [[{ totalStudents }]] = await pool.execute(
      "SELECT COUNT(*) as totalStudents FROM users WHERE role = 'student'"
    );
    const [[{ totalSimulations }]] = await pool.execute(
      'SELECT COUNT(*) as totalSimulations FROM simulations WHERE completed = 1'
    );
    const [[{ avgScore }]] = await pool.execute(
      'SELECT ROUND(AVG((score / total_questions) * 100), 1) as avgScore FROM simulations WHERE completed = 1'
    );
    const [[{ totalScenarios }]] = await pool.execute(
      'SELECT COUNT(*) as totalScenarios FROM scenarios'
    );

    // Most missed scenarios
    const [mostMissed] = await pool.execute(
      `SELECT sc.id, sc.email_subject, sc.difficulty,
              COUNT(*) as totalAnswers,
              SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) as wrongAnswers,
              ROUND((SUM(CASE WHEN sa.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as missRate
       FROM simulation_answers sa
       JOIN scenarios sc ON sa.scenario_id = sc.id
       GROUP BY sc.id, sc.email_subject, sc.difficulty
       HAVING totalAnswers > 0
       ORDER BY missRate DESC
       LIMIT 5`
    );

    res.json({
      totalStudents,
      totalSimulations,
      avgScore: avgScore || 0,
      totalScenarios,
      mostMissed
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/students - all student results
router.get('/students', async (req, res) => {
  try {
    const [results] = await pool.execute(
      `SELECT u.id, u.email, u.created_at,
              COUNT(s.id) as totalSimulations,
              MAX(s.completed_at) as lastSimulation,
              ROUND(AVG((s.score / s.total_questions) * 100), 1) as avgScore,
              MAX(s.score) as bestScore,
              MAX(s.total_questions) as totalQuestions
       FROM users u
       LEFT JOIN simulations s ON u.id = s.user_id AND s.completed = 1
       WHERE u.role = 'student'
       GROUP BY u.id, u.email, u.created_at
       ORDER BY lastSimulation DESC`
    );
    res.json(results);
  } catch (err) {
    console.error('Students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/admin/simulations - all completed simulations with details
router.get('/simulations', async (req, res) => {
  try {
    const [simulations] = await pool.execute(
      `SELECT s.id, s.score, s.total_questions, s.created_at, s.completed_at,
              ROUND((s.score / s.total_questions) * 100) as percentage,
              u.email as student_email
       FROM simulations s
       JOIN users u ON s.user_id = u.id
       WHERE s.completed = 1
       ORDER BY s.completed_at DESC
       LIMIT 100`
    );
    res.json(simulations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulations' });
  }
});

// GET /api/admin/simulations/:id/details - answers for a specific sim
router.get('/simulations/:id/details', async (req, res) => {
  try {
    const [answers] = await pool.execute(
      `SELECT sa.*, sc.email_subject, sc.difficulty, sc.explanation
       FROM simulation_answers sa
       JOIN scenarios sc ON sa.scenario_id = sc.id
       WHERE sa.simulation_id = ?
       ORDER BY sa.answered_at`,
      [req.params.id]
    );
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch simulation details' });
  }
});

// GET /api/admin/scenarios - all scenarios
router.get('/scenarios', async (req, res) => {
  try {
    const [scenarios] = await pool.execute(
      'SELECT id, email_subject, email_from, email_body, correct_answer, explanation, difficulty, created_at FROM scenarios ORDER BY id DESC'
    );
    res.json(scenarios);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// POST /api/admin/scenarios - create new scenario
router.post('/scenarios', [
  body('email_subject').notEmpty().trim().escape(),
  body('email_from').notEmpty().isEmail(),
  body('email_body').notEmpty(),
  body('correct_answer').isIn(['phish', 'legitimate']),
  body('explanation').notEmpty().trim(),
  body('difficulty').isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email_subject, email_from, email_body, correct_answer, explanation, difficulty } = req.body;

  try {
    const [result] = await pool.execute(
      'INSERT INTO scenarios (email_subject, email_from, email_body, correct_answer, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?)',
      [email_subject, email_from, email_body, correct_answer, explanation, difficulty]
    );
    res.status(201).json({ id: result.insertId, message: 'Scenario created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// PUT /api/admin/scenarios/:id - update scenario
router.put('/scenarios/:id', [
  body('email_subject').notEmpty().trim(),
  body('email_from').notEmpty().isEmail(),
  body('email_body').notEmpty(),
  body('correct_answer').isIn(['phish', 'legitimate']),
  body('explanation').notEmpty().trim(),
  body('difficulty').isIn(['easy', 'medium', 'hard'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email_subject, email_from, email_body, correct_answer, explanation, difficulty } = req.body;

  try {
    await pool.execute(
      'UPDATE scenarios SET email_subject=?, email_from=?, email_body=?, correct_answer=?, explanation=?, difficulty=? WHERE id=?',
      [email_subject, email_from, email_body, correct_answer, explanation, difficulty, req.params.id]
    );
    res.json({ message: 'Scenario updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// DELETE /api/admin/scenarios/:id
router.delete('/scenarios/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM scenarios WHERE id = ?', [req.params.id]);
    res.json({ message: 'Scenario deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// GET /api/admin/analytics - detailed analytics
router.get('/analytics', async (req, res) => {
  try {
    // Score distribution
    const [scoreDistribution] = await pool.execute(
      `SELECT 
        CASE 
          WHEN (score/total_questions)*100 >= 90 THEN '90-100%'
          WHEN (score/total_questions)*100 >= 80 THEN '80-89%'
          WHEN (score/total_questions)*100 >= 70 THEN '70-79%'
          WHEN (score/total_questions)*100 >= 60 THEN '60-69%'
          ELSE 'Below 60%'
        END as grade,
        COUNT(*) as count
       FROM simulations
       WHERE completed = 1
       GROUP BY grade
       ORDER BY grade DESC`
    );

    // Phish vs Legitimate accuracy
    const [[phishStats]] = await pool.execute(
      `SELECT 
        SUM(CASE WHEN correct_answer = 'phish' AND is_correct = 1 THEN 1 ELSE 0 END) as phishCorrect,
        SUM(CASE WHEN correct_answer = 'phish' AND is_correct = 0 THEN 1 ELSE 0 END) as phishWrong,
        SUM(CASE WHEN correct_answer = 'legitimate' AND is_correct = 1 THEN 1 ELSE 0 END) as legCorrect,
        SUM(CASE WHEN correct_answer = 'legitimate' AND is_correct = 0 THEN 1 ELSE 0 END) as legWrong
       FROM simulation_answers`
    );

    // Per-scenario stats
    const [scenarioStats] = await pool.execute(
      `SELECT sc.id, sc.email_subject, sc.correct_answer, sc.difficulty,
              COUNT(sa.id) as timesAnswered,
              SUM(sa.is_correct) as timesCorrect,
              ROUND((SUM(sa.is_correct) / COUNT(sa.id)) * 100, 1) as accuracy
       FROM scenarios sc
       LEFT JOIN simulation_answers sa ON sc.id = sa.scenario_id
       GROUP BY sc.id
       ORDER BY accuracy ASC`
    );

    res.json({ scoreDistribution, phishStats, scenarioStats });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
