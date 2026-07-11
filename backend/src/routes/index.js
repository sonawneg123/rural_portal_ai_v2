// src/routes/index.js
const express  = require('express');
const { body } = require('express-validator');
const router   = express.Router();

const authCtrl         = require('../controllers/authController');
const problemCtrl      = require('../controllers/problemController');
const workCtrl         = require('../controllers/workProgressController');
const adminCtrl        = require('../controllers/adminController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');
const { uploadProblem, uploadWork } = require('../config/s3');
const { pool }         = require('../config/database');

// ── Health ────────────────────────────────────────────────────
router.get('/health', (_req, res) =>
  res.json({ status: 'ok', version: '2.0.0', ts: new Date().toISOString() })
);

// ── Auth ──────────────────────────────────────────────────────
router.post('/auth/register',
  [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('state').trim().notEmpty(),
    body('district').trim().notEmpty(),
    body('village').trim().notEmpty(),
  ],
  authCtrl.register
);
router.post('/auth/login',
  [body('email').isEmail(), body('password').notEmpty()],
  authCtrl.login
);
router.get('/auth/me', authenticate, authCtrl.getMe);

// ── Categories ────────────────────────────────────────────────
router.get('/categories', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, color, icon, description FROM categories WHERE is_active = 1 ORDER BY name'
  );
  res.json({ success: true, data: rows });
});

// ── Stats summary ─────────────────────────────────────────────
router.get('/stats/summary', problemCtrl.getSummary);

// ── Problems ──────────────────────────────────────────────────
router.get('/problems',          optionalAuth, problemCtrl.getProblems);
router.get('/problems/my',       authenticate, problemCtrl.getMyProblems);
router.get('/problems/:id',      optionalAuth, problemCtrl.getProblemById);
router.post('/problems/:id/upvote', authenticate, problemCtrl.upvoteProblem);

// Create problem with photo upload
router.post('/problems',
  authenticate,
  (req, res, next) => {
    uploadProblem(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  [
    body('title').trim().notEmpty().isLength({ max: 255 }),
    body('description').trim().isLength({ min: 20 }),
    body('category_id').isInt({ min: 1 }),
    body('state').trim().notEmpty(),
    body('district').trim().notEmpty(),
    body('village').trim().notEmpty(),
  ],
  problemCtrl.createProblem
);

// Add comment to problem
router.post('/problems/:id/comment', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
  try {
    await pool.query(
      'INSERT INTO comments (problem_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content.trim()]
    );
    res.json({ success: true, message: 'Comment added' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Work Progress ─────────────────────────────────────────────
router.get('/problems/:id/work-updates', optionalAuth, workCtrl.getWorkUpdates);
router.post('/problems/:id/work-updates',
  authenticate,
  (req, res, next) => {
    uploadWork(req, res, (err) => {
      if (err) return res.status(400).json({ success: false, message: err.message });
      next();
    });
  },
  workCtrl.createWorkUpdate
);
router.patch('/work-updates/:id/approve', authenticate, requireAdmin, workCtrl.approveUpdate);
router.patch('/work-updates/:id/dispute', authenticate, requireAdmin, workCtrl.disputeUpdate);
router.post('/work-updates/:id/helpful',  authenticate, workCtrl.markHelpful);

// ── Notifications ─────────────────────────────────────────────
router.get('/notifications', authenticate, async (req, res) => {
  const { unread, limit = 20 } = req.query;
  const where = 'user_id = ?' + (unread === 'true' ? ' AND is_read = 0' : '');
  const [rows] = await pool.query(
    `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT ?`,
    unread === 'true' ? [req.user.id, parseInt(limit)] : [req.user.id, parseInt(limit)]
  );
  const [[{ unreadCount }]] = await pool.query(
    'SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );
  res.json({ success: true, data: rows, unreadCount });
});

router.patch('/notifications/:id/read', authenticate, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

router.patch('/notifications/read-all', authenticate, async (req, res) => {
  await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
  res.json({ success: true });
});

// ── Admin ─────────────────────────────────────────────────────
router.get('/admin/dashboard',              authenticate, requireAdmin, adminCtrl.getDashboard);
router.get('/admin/problems',               authenticate, requireAdmin, adminCtrl.getAllProblems);
router.patch('/admin/problems/:id/status',  authenticate, requireAdmin, adminCtrl.updateProblemStatus);
router.get('/admin/problems/:id/insight',   authenticate, requireAdmin, adminCtrl.getProblemInsight);
router.get('/admin/users',                  authenticate, requireAdmin, adminCtrl.getUsers);
router.patch('/admin/users/:id/toggle',     authenticate, requireAdmin, adminCtrl.toggleUser);

// Admin official comment
router.post('/admin/problems/:id/comment', authenticate, requireAdmin, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, message: 'Content required' });
  try {
    await pool.query(
      'INSERT INTO comments (problem_id, user_id, content, is_official) VALUES (?, ?, ?, 1)',
      [req.params.id, req.user.id, content.trim()]
    );

    // Notify reporter
    const [[prob]] = await pool.query('SELECT user_id, title FROM problems WHERE id = ?', [req.params.id]);
    if (prob) {
      await pool.query(
        `INSERT INTO notifications (user_id, problem_id, type, title, message) VALUES (?, ?, 'comment', ?, ?)`,
        [prob.user_id, req.params.id, 'Official Comment Added',
         `An official response was added to your problem "${prob.title}"`]
      );
    }
    res.json({ success: true, message: 'Official comment added' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── Location helpers ──────────────────────────────────────────
router.get('/locations/states', async (_req, res) => {
  const [rows] = await pool.query('SELECT DISTINCT state FROM problems ORDER BY state');
  res.json({ success: true, data: rows.map(r => r.state) });
});

router.get('/locations/districts', async (req, res) => {
  const { state } = req.query;
  if (!state) return res.status(400).json({ success: false, message: 'State required' });
  const [rows] = await pool.query(
    'SELECT DISTINCT district FROM problems WHERE state = ? ORDER BY district', [state]
  );
  res.json({ success: true, data: rows.map(r => r.district) });
});

module.exports = router;

// ── Governance routes ─────────────────────────────────────────
const governanceRouter = require('./governance');
router.use('/', governanceRouter);

// ── Feature routes ────────────────────────────────────────────
const featuresRouter = require('./features');
router.use('/', featuresRouter);
