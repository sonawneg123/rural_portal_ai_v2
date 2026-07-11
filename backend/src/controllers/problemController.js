// src/controllers/problemController.js
const { pool }   = require('../config/database');
const { generateProblemAnalysis } = require('../config/groq');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// POST /api/problems
exports.createProblem = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const {
    title, description, category_id, state, district, village,
    pincode, anonymous, budget_estimate,
  } = req.body;

  try {
    const [cat] = await pool.query('SELECT name FROM categories WHERE id = ? AND is_active = 1', [category_id]);
    if (!cat.length) return res.status(400).json({ success: false, message: 'Invalid category' });

    // ── Groq AI analysis ──────────────────────────────────────
    const location = `${village}, ${district}, ${state}`;
    const ai = await generateProblemAnalysis(title, description, cat[0].name, location);
    // ─────────────────────────────────────────────────────────

    const isAnon = anonymous === 'true' || anonymous === true;

    const [result] = await pool.query(
      `INSERT INTO problems
         (user_id, category_id, title, description, anonymous,
          ai_summary, ai_severity_score, ai_tags, ai_responsible_dept, ai_resolution_days,
          budget_estimate, state, district, village, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id, title, description, isAnon ? 1 : 0,
       ai.summary, ai.severity_score, ai.tags, ai.responsible_dept, ai.estimated_resolution_days,
       budget_estimate || null, state, district, village, pincode || null]
    );

    const problemId = result.insertId;

    // Save photos
    if (req.files?.length) {
      const vals = req.files.map(f => [problemId, f.originalname, f.key, f.location, f.size, f.mimetype]);
      await pool.query(
        'INSERT INTO problem_photos (problem_id, filename, s3_key, s3_url, size_bytes, mime_type) VALUES ?',
        [vals]
      );
    }

    logger.info(`Problem #${problemId} created by user #${req.user.id} | severity: ${ai.severity_score}`);

    res.status(201).json({
      success:    true,
      message:    'Problem reported successfully',
      problemId,
      ai_summary: ai.summary,
      ai_severity_score: ai.severity_score,
    });
  } catch (err) {
    logger.error('createProblem error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/problems
exports.getProblems = async (req, res) => {
  const {
    state, district, village, category_id, status,
    search, sort = 'newest', page = 1, limit = 12,
  } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const where  = ['1=1'];
  const params = [];

  if (state)       { where.push('p.state = ?');       params.push(state); }
  if (district)    { where.push('p.district = ?');     params.push(district); }
  if (village)     { where.push('p.village = ?');      params.push(village); }
  if (category_id) { where.push('p.category_id = ?'); params.push(category_id); }
  if (status)      { where.push('p.status = ?');       params.push(status); }
  if (search) {
    where.push('MATCH(p.title, p.description) AGAINST(? IN BOOLEAN MODE)');
    params.push(search + '*');
  }

  const orderMap = {
    newest:   'p.created_at DESC',
    oldest:   'p.created_at ASC',
    popular:  'p.upvotes DESC',
    severity: 'p.ai_severity_score DESC',
    views:    'p.views DESC',
  };
  const order = orderMap[sort] || 'p.created_at DESC';

  try {
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM problems p WHERE ${where.join(' AND ')}`, params
    );

    const [rows] = await pool.query(
      `SELECT
         p.id, p.title, p.description, p.ai_summary, p.ai_tags, p.ai_severity_score,
         p.anonymous, p.state, p.district, p.village, p.status, p.priority,
         p.upvotes, p.views, p.budget_estimate, p.created_at,
         p.work_updates_count,
         c.name AS category, c.color AS category_color,
         CASE WHEN p.anonymous = 1 THEN 'Anonymous' ELSE u.name END AS reporter_name,
         (SELECT s3_url FROM problem_photos WHERE problem_id = p.id LIMIT 1) AS thumbnail
       FROM problems p
       JOIN categories c ON c.id = p.category_id
       JOIN users u      ON u.id = p.user_id
       WHERE ${where.join(' AND ')}
       ORDER BY ${order}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Bump views async
    if (rows.length) {
      const ids = rows.map(r => r.id);
      pool.query(
        `UPDATE problems SET views = views + 1 WHERE id IN (${ids.map(() => '?').join(',')})`, ids
      );
    }

    res.json({
      success: true,
      data:    rows,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    logger.error('getProblems error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/problems/:id
exports.getProblemById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,
         c.name AS category, c.color AS category_color,
         CASE WHEN p.anonymous = 1 THEN 'Anonymous' ELSE u.name END AS reporter_name,
         CASE WHEN p.anonymous = 1 THEN NULL ELSE u.village END AS reporter_village,
         CASE WHEN p.anonymous = 1 THEN NULL ELSE u.district END AS reporter_district
       FROM problems p
       JOIN categories c ON c.id = p.category_id
       JOIN users u      ON u.id = p.user_id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Problem not found' });

    const prob = rows[0];

    const [photos]   = await pool.query('SELECT id, s3_url, filename FROM problem_photos WHERE problem_id = ? ORDER BY uploaded_at', [prob.id]);
    const [comments] = await pool.query(
      `SELECT cm.id, cm.content, cm.is_official, cm.created_at,
              CASE WHEN u.anonymous_mode = 1 THEN 'Anonymous' ELSE u.name END AS author
       FROM comments cm JOIN users u ON u.id = cm.user_id
       WHERE cm.problem_id = ? ORDER BY cm.created_at ASC`,
      [prob.id]
    );

    res.json({ success: true, data: { ...prob, photos, comments } });
  } catch (err) {
    logger.error('getProblemById error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/problems/:id/upvote
exports.upvoteProblem = async (req, res) => {
  try {
    await pool.query('INSERT IGNORE INTO upvotes (problem_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
    await pool.query(
      'UPDATE problems SET upvotes = (SELECT COUNT(*) FROM upvotes WHERE problem_id = ?) WHERE id = ?',
      [req.params.id, req.params.id]
    );
    const [[{ upvotes }]] = await pool.query('SELECT upvotes FROM problems WHERE id = ?', [req.params.id]);
    res.json({ success: true, upvotes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/problems/my
exports.getMyProblems = async (req, res) => {
  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.status, p.priority, p.upvotes, p.views,
            p.ai_summary, p.ai_severity_score, p.work_updates_count, p.created_at,
            c.name AS category, c.color AS category_color
     FROM problems p JOIN categories c ON c.id = p.category_id
     WHERE p.user_id = ? ORDER BY p.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: rows });
};

// GET /api/stats/summary
exports.getSummary = async (_req, res) => {
  try {
    const [[summary]] = await pool.query('SELECT * FROM v_dashboard_summary');
    res.json({ success: true, data: summary });
  } catch {
    res.json({ success: true, data: { total: 0, resolved: 0, users: 0, today: 0 } });
  }
};
