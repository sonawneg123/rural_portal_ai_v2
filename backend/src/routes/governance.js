// src/routes/governance.js
// All governance role endpoints: CM, Collector, MLA, Sarpanch, GramSevak
const express  = require('express');
const router   = express.Router();
const { pool } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const logger   = require('../config/logger');

/* ── Role middleware helpers ──────────────────────────────── */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ success:false, message:`Access denied. Required role: ${roles.join(' or ')}` });
  next();
};

/* ═══════════════════════════════════════════════════════════
   CHIEF MINISTER ENDPOINTS
═══════════════════════════════════════════════════════════ */

// GET /api/cm/dashboard
router.get('/cm/dashboard', authenticate, requireRole('cm','admin'), async (req, res) => {
  try {
    const state = req.user.state;

    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*)                                            AS total_problems,
        SUM(status='pending')                               AS pending,
        SUM(status='in_progress')                           AS in_progress,
        SUM(status='resolved')                              AS resolved,
        (SELECT COUNT(*) FROM users WHERE role='user')      AS total_users,
        SUM(p.budget_estimate)                              AS total_budget
      FROM problems p WHERE p.state = ?`, [state]);

    const [byCategory] = await pool.query(`
      SELECT c.name, c.color, COUNT(p.id) AS count
      FROM categories c LEFT JOIN problems p ON p.category_id=c.id AND p.state=?
      GROUP BY c.id ORDER BY count DESC`, [state]);

    const [byDistrict] = await pool.query(`
      SELECT district,
        COUNT(*) AS count,
        SUM(status='resolved') AS resolved,
        AVG(ai_severity_score) AS avg_severity
      FROM problems WHERE state=? GROUP BY district ORDER BY count DESC`, [state]);

    const [urgent] = await pool.query(`
      SELECT p.id, p.title, p.status, p.upvotes, p.district, p.village,
             p.ai_severity_score, p.work_updates_count, c.name AS category
      FROM problems p JOIN categories c ON c.id=p.category_id
      WHERE p.state=? AND p.status != 'resolved'
      ORDER BY p.ai_severity_score DESC, p.upvotes DESC LIMIT 20`, [state]);

    const [districts]  = await pool.query(`SELECT DISTINCT district FROM problems WHERE state=? ORDER BY district`, [state]);
    const [talukas]    = await pool.query(`SELECT DISTINCT taluka, district FROM problems WHERE state=? AND taluka IS NOT NULL ORDER BY taluka`, [state]);
    const [villages]   = await pool.query(`SELECT DISTINCT village, taluka FROM problems WHERE state=? ORDER BY village`, [state]);

    const [districtBudgets] = await pool.query(`
      SELECT district, SUM(budget_allocated) AS allocated, SUM(budget_used) AS used
      FROM budget_allocations WHERE state=? GROUP BY district`, [state]).catch(() => [[]] );

    res.json({ success:true, data: {
      summary, byCategory, byDistrict,
      urgent, districts: districts.map(d=>d.district),
      talukas: talukas.map(t=>({ name:t.taluka, district:t.district })),
      villages: villages.map(v=>({ name:v.village, taluka:v.taluka })),
      districtBudgets,
    }});
  } catch (err) {
    logger.error('CM dashboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// POST /api/cm/budget/allocate
router.post('/cm/budget/allocate', authenticate, requireRole('cm','admin'), async (req, res) => {
  const { district, amount } = req.body;
  if (!district || !amount) return res.status(400).json({ success:false, message:'District and amount required' });
  try {
    await pool.query(`
      INSERT INTO budget_allocations (state, district, budget_allocated, allocated_by, allocated_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE budget_allocated = budget_allocated + VALUES(budget_allocated), allocated_at = NOW()`,
      [req.user.state, district, Number(amount), req.user.id]
    );
    logger.info(`CM allocated ₹${amount} to ${district}`);
    res.json({ success:true, message:`₹${Number(amount).toLocaleString('en-IN')} allocated to ${district}` });
  } catch (err) {
    logger.error('CM budget allocate error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ═══════════════════════════════════════════════════════════
   COLLECTOR ENDPOINTS
═══════════════════════════════════════════════════════════ */

// GET /api/collector/dashboard
router.get('/collector/dashboard', authenticate, requireRole('collector','admin'), async (req, res) => {
  try {
    const { state, district } = req.user;

    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*)                   AS total_problems,
        SUM(status='pending')      AS pending,
        SUM(status='in_review')    AS in_review,
        SUM(status='in_progress')  AS in_progress,
        SUM(status='resolved')     AS resolved,
        AVG(ai_severity_score)     AS avg_severity
      FROM problems WHERE state=? AND district=?`, [state, district]);

    const [byTaluka] = await pool.query(`
      SELECT COALESCE(taluka,'Unknown') AS taluka, COUNT(*) AS count,
             SUM(status='resolved') AS resolved
      FROM problems WHERE state=? AND district=? GROUP BY taluka ORDER BY count DESC`,
      [state, district]);

    const [critical] = await pool.query(`
      SELECT p.id, p.title, p.status, p.ai_severity_score, p.village, p.taluka,
             p.upvotes, p.work_updates_count, c.name AS category
      FROM problems p JOIN categories c ON c.id=p.category_id
      WHERE p.state=? AND p.district=? AND p.status != 'resolved'
      ORDER BY p.ai_severity_score DESC LIMIT 15`, [state, district]);

    const [talukas]  = await pool.query(`SELECT DISTINCT taluka FROM problems WHERE state=? AND district=? AND taluka IS NOT NULL ORDER BY taluka`, [state, district]);
    const [villages] = await pool.query(`SELECT DISTINCT village, taluka FROM problems WHERE state=? AND district=? ORDER BY village`, [state, district]);

    const [budgetRow] = await pool.query(`
      SELECT COALESCE(SUM(budget_allocated),0) AS budget_allocated,
             COALESCE(SUM(budget_used),0)      AS budget_remaining
      FROM budget_allocations WHERE state=? AND district=?`, [state, district]).catch(() => [[{ budget_allocated:0, budget_remaining:0 }]]);

    const [talukaBudgets] = await pool.query(`
      SELECT taluka, budget_allocated AS allocated, budget_used AS used
      FROM budget_allocations WHERE state=? AND district=? AND taluka IS NOT NULL`,
      [state, district]).catch(() => [[]]);

    const [talukaStats] = await pool.query(`
      SELECT COALESCE(p.taluka,'Unknown') AS taluka,
             COUNT(*) AS total, SUM(p.status='resolved') AS resolved,
             COUNT(DISTINCT p.village) AS villages,
             ROUND(AVG(p.ai_severity_score),1) AS avg_severity
      FROM problems p WHERE p.state=? AND p.district=?
      GROUP BY p.taluka ORDER BY total DESC`, [state, district]);

    res.json({ success:true, data: {
      summary: { ...summary, ...budgetRow[0] },
      byTaluka, critical,
      talukas: talukas.map(t=>t.taluka),
      villages: villages.map(v=>({ name:v.village, taluka:v.taluka })),
      talukaBudgets, talukaStats,
    }});
  } catch (err) {
    logger.error('Collector dashboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// POST /api/collector/budget/allocate
router.post('/collector/budget/allocate', authenticate, requireRole('collector','admin'), async (req, res) => {
  const { taluka, amount } = req.body;
  if (!taluka || !amount) return res.status(400).json({ success:false, message:'Taluka and amount required' });
  try {
    const { state, district } = req.user;
    await pool.query(`
      INSERT INTO budget_allocations (state, district, taluka, budget_allocated, allocated_by, allocated_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE budget_allocated = budget_allocated + VALUES(budget_allocated), allocated_at = NOW()`,
      [state, district, taluka, Number(amount), req.user.id]
    );
    res.json({ success:true, message:`₹${Number(amount).toLocaleString('en-IN')} allocated to ${taluka}` });
  } catch (err) {
    logger.error('Collector budget allocate error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ═══════════════════════════════════════════════════════════
   MLA ENDPOINTS
═══════════════════════════════════════════════════════════ */

// GET /api/mla/dashboard
router.get('/mla/dashboard', authenticate, requireRole('mla','admin'), async (req, res) => {
  try {
    const { state, district, taluka } = req.user;
    const tFilter = taluka ? 'AND p.taluka = ?' : '';
    const params  = taluka ? [state, district, taluka] : [state, district];

    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*)                   AS total_problems,
        SUM(status='pending')      AS pending,
        SUM(status='in_progress')  AS in_progress,
        SUM(status='resolved')     AS resolved,
        SUM(work_updates_count)    AS work_updates
      FROM problems p WHERE p.state=? AND p.district=? ${tFilter}`, params);

    const [byVillage] = await pool.query(`
      SELECT p.village,
        COUNT(*) AS problems,
        SUM(p.status='resolved') AS resolved,
        SUM(p.work_updates_count) AS work_updates,
        AVG(p.ai_severity_score) AS avg_severity
      FROM problems p WHERE p.state=? AND p.district=? ${tFilter}
      GROUP BY p.village ORDER BY problems DESC`, params);

    const [urgent] = await pool.query(`
      SELECT p.id, p.title, p.status, p.ai_severity_score, p.village, p.upvotes,
             c.name AS category
      FROM problems p JOIN categories c ON c.id=p.category_id
      WHERE p.state=? AND p.district=? ${tFilter} AND p.status != 'resolved'
      ORDER BY p.ai_severity_score DESC, p.upvotes DESC LIMIT 10`, params);

    const [budgetRow] = await pool.query(`
      SELECT COALESCE(SUM(budget_allocated),0) AS budget_allocated,
             COALESCE(SUM(budget_used),0)      AS budget_distributed
      FROM budget_allocations WHERE state=? AND district=? ${taluka?'AND taluka=?':''}`,
      taluka ? [state, district, taluka] : [state, district]
    ).catch(() => [[{ budget_allocated:0, budget_distributed:0 }]]);

    const [villageBudgets] = await pool.query(`
      SELECT village, budget_allocated AS allocated, budget_used AS used
      FROM budget_allocations WHERE state=? AND district=? ${taluka?'AND taluka=?':''} AND village IS NOT NULL`,
      taluka ? [state, district, taluka] : [state, district]
    ).catch(() => [[]]);

    // Enrich villages with population stub
    const villages = byVillage.map(v => ({ ...v, name:v.village, population: Math.floor(Math.random()*2000)+500 }));

    res.json({ success:true, data: {
      summary: { ...summary, ...budgetRow[0] },
      urgent, villages,
      villageBudgets: villageBudgets.map(v => ({ village:v.village||'Unknown', allocated:v.allocated||0, used:v.used||0 })),
    }});
  } catch (err) {
    logger.error('MLA dashboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// POST /api/mla/budget/allocate
router.post('/mla/budget/allocate', authenticate, requireRole('mla','admin'), async (req, res) => {
  const { village, amount } = req.body;
  if (!village || !amount) return res.status(400).json({ success:false, message:'Village and amount required' });
  try {
    const { state, district, taluka } = req.user;
    await pool.query(`
      INSERT INTO budget_allocations (state, district, taluka, village, budget_allocated, allocated_by, allocated_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE budget_allocated = budget_allocated + VALUES(budget_allocated), allocated_at = NOW()`,
      [state, district, taluka||null, village, Number(amount), req.user.id]
    );
    res.json({ success:true, message:`₹${Number(amount).toLocaleString('en-IN')} allocated to ${village}` });
  } catch (err) {
    logger.error('MLA budget allocate error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ═══════════════════════════════════════════════════════════
   SARPANCH ENDPOINTS
═══════════════════════════════════════════════════════════ */

// GET /api/sarpanch/dashboard
router.get('/sarpanch/dashboard', authenticate, requireRole('sarpanch','admin'), async (req, res) => {
  try {
    const { state, district, village } = req.user;

    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*)                   AS total_problems,
        SUM(status='pending')      AS pending,
        SUM(status='in_progress')  AS in_progress,
        SUM(status='resolved')     AS resolved,
        SUM(work_updates_count)    AS work_updates
      FROM problems WHERE state=? AND district=? AND village=?`, [state, district, village]);

    const [recentProblems] = await pool.query(`
      SELECT p.id, p.title, p.status, p.priority, p.upvotes,
             p.ai_severity_score, p.work_updates_count, p.avg_work_completion,
             p.created_at, c.name AS category,
             CASE WHEN p.anonymous=1 THEN 'Anonymous' ELSE u.name END AS reporter_name
      FROM problems p
      JOIN categories c ON c.id=p.category_id
      JOIN users u ON u.id=p.user_id
      WHERE p.state=? AND p.district=? AND p.village=?
      ORDER BY p.created_at DESC LIMIT 20`, [state, district, village]);

    const [allProblems] = await pool.query(`
      SELECT p.id, p.title, p.status, p.priority, p.ai_severity_score,
             p.work_updates_count, p.budget_estimate, c.name AS category,
             CASE WHEN p.anonymous=1 THEN 'Anonymous' ELSE u.name END AS reporter_name
      FROM problems p
      JOIN categories c ON c.id=p.category_id
      JOIN users u ON u.id=p.user_id
      WHERE p.state=? AND p.district=? AND p.village=?
      ORDER BY p.ai_severity_score DESC, p.created_at DESC`, [state, district, village]);

    const [budgetRow] = await pool.query(`
      SELECT COALESCE(SUM(budget_allocated),0) AS budget_allocated,
             COALESCE(SUM(budget_used),0) AS budget_used
      FROM budget_allocations WHERE state=? AND district=? AND village=?`,
      [state, district, village]
    ).catch(() => [[{ budget_allocated:0, budget_used:0 }]]);

    const budgetBreakdown = allProblems.filter(p => p.budget_estimate > 0);

    res.json({ success:true, data: {
      summary: { ...summary, ...budgetRow[0] },
      recentProblems, allProblems, budgetBreakdown,
    }});
  } catch (err) {
    logger.error('Sarpanch dashboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

// PATCH /api/sarpanch/problems/:id/status
router.patch('/sarpanch/problems/:id/status', authenticate, requireRole('sarpanch','admin'), async (req, res) => {
  const { status } = req.body;
  const allowed = ['in_review','in_progress','resolved'];
  if (!allowed.includes(status)) return res.status(400).json({ success:false, message:'Invalid status' });
  try {
    const { state, district, village } = req.user;
    const [[prob]] = await pool.query('SELECT id, user_id, title, state, district, village FROM problems WHERE id=?', [req.params.id]);
    if (!prob) return res.status(404).json({ success:false, message:'Problem not found' });
    if (prob.state !== state || prob.district !== district || prob.village !== village)
      return res.status(403).json({ success:false, message:'Problem not in your village' });

    await pool.query('UPDATE problems SET status=? WHERE id=?', [status, req.params.id]);
    await pool.query(
      `INSERT INTO status_history (problem_id, changed_by, old_status, new_status) VALUES (?, ?, 'pending', ?)`,
      [req.params.id, req.user.id, status]
    );

    if (prob.user_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (user_id, problem_id, type, title, message) VALUES (?, ?, 'status_change', ?, ?)`,
        [prob.user_id, req.params.id, 'Problem Status Updated',
         `Sarpanch updated your problem "${prob.title}" to ${status}`]
      );
    }
    res.json({ success:true, message:'Status updated' });
  } catch (err) {
    logger.error('Sarpanch status update error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ═══════════════════════════════════════════════════════════
   GRAM SEVAK ENDPOINTS
═══════════════════════════════════════════════════════════ */

// GET /api/gramsevak/dashboard
router.get('/gramsevak/dashboard', authenticate, requireRole('gramsevak','admin'), async (req, res) => {
  try {
    const { state, district, village } = req.user;

    const [[summary]] = await pool.query(`
      SELECT
        COUNT(*)                   AS total_problems,
        SUM(status='pending')      AS pending,
        SUM(status='in_progress')  AS in_progress,
        SUM(status='resolved')     AS resolved,
        SUM(work_updates_count)    AS work_updates
      FROM problems WHERE state=? AND district=? AND village=?`, [state, district, village]);

    const [problems] = await pool.query(`
      SELECT p.id, p.title, p.status, p.priority, p.ai_severity_score, p.ai_summary,
             p.work_updates_count, p.avg_work_completion, p.village, p.created_at,
             c.name AS category,
             CASE WHEN p.anonymous=1 THEN 'Anonymous' ELSE u.name END AS reporter_name
      FROM problems p
      JOIN categories c ON c.id=p.category_id
      JOIN users u ON u.id=p.user_id
      WHERE p.state=? AND p.district=? AND p.village=?
      ORDER BY
        FIELD(p.status,'pending','in_review','in_progress','resolved','rejected'),
        p.ai_severity_score DESC`,
      [state, district, village]);

    res.json({ success:true, data: { summary, problems } });
  } catch (err) {
    logger.error('GramSevak dashboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
