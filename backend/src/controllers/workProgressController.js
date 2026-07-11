// src/controllers/workProgressController.js
const { pool }   = require('../config/database');
const { analyseWorkUpdate } = require('../config/groq');
const logger = require('../config/logger');

// GET /api/problems/:id/work-updates
exports.getWorkUpdates = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         wu.id, wu.description, wu.location_name, wu.status,
         wu.ai_analysis, wu.ai_work_completion_pct, wu.quality_assessment,
         wu.helpful_votes, wu.created_at,
         CASE WHEN u.anonymous_mode = 1 THEN 'Anonymous' ELSE u.name END AS reporter_name
       FROM work_updates wu
       JOIN users u ON u.id = wu.user_id
       WHERE wu.problem_id = ?
       ORDER BY wu.created_at DESC`,
      [req.params.id]
    );

    // Attach photos to each update
    for (const update of rows) {
      const [photos] = await pool.query(
        'SELECT id, s3_url, filename FROM work_update_photos WHERE work_update_id = ?',
        [update.id]
      );
      update.photos = photos;
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('getWorkUpdates error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/problems/:id/work-updates
exports.createWorkUpdate = async (req, res) => {
  const { description, location_name, work_completion_pct } = req.body;
  const problemId = req.params.id;

  if (!description?.trim()) return res.status(400).json({ success: false, message: 'Description is required' });
  if (!req.files?.length)   return res.status(400).json({ success: false, message: 'At least one photo is required' });

  try {
    // Verify problem exists
    const [[prob]] = await pool.query('SELECT id, title FROM problems WHERE id = ?', [problemId]);
    if (!prob) return res.status(404).json({ success: false, message: 'Problem not found' });

    // ── Groq AI: analyse the work update ─────────────────────
    const ai = await analyseWorkUpdate(description, work_completion_pct || null);
    // ─────────────────────────────────────────────────────────

    const [result] = await pool.query(
      `INSERT INTO work_updates
         (problem_id, user_id, description, location_name,
          ai_analysis, ai_work_completion_pct, quality_assessment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
      [problemId, req.user.id,
       description.trim(), location_name || null,
       ai.analysis, ai.estimated_completion_pct, ai.quality_assessment]
    );

    const updateId = result.insertId;

    // Save photos
    if (req.files?.length) {
      const vals = req.files.map(f => [updateId, f.originalname, f.key, f.location, f.size, f.mimetype]);
      await pool.query(
        'INSERT INTO work_update_photos (work_update_id, filename, s3_key, s3_url, size_bytes, mime_type) VALUES ?',
        [vals]
      );
    }

    // Update the problem's work_updates_count and avg completion
    await pool.query(
      `UPDATE problems SET
         work_updates_count = (SELECT COUNT(*) FROM work_updates WHERE problem_id = ?),
         avg_work_completion = (SELECT AVG(ai_work_completion_pct) FROM work_updates WHERE problem_id = ? AND ai_work_completion_pct IS NOT NULL)
       WHERE id = ?`,
      [problemId, problemId, problemId]
    );

    // Notify problem reporter
    const [[probInfo]] = await pool.query('SELECT user_id, title FROM problems WHERE id = ?', [problemId]);
    if (probInfo && probInfo.user_id !== req.user.id) {
      await pool.query(
        `INSERT INTO notifications (user_id, problem_id, type, title, message) VALUES (?, ?, 'work_update', ?, ?)`,
        [probInfo.user_id, problemId, 'Work Update Added',
         `A new work progress update was added to "${probInfo.title}"`]
      );
    }

    logger.info(`Work update #${updateId} for problem #${problemId} | AI completion: ${ai.estimated_completion_pct}%`);

    res.status(201).json({
      success:    true,
      message:    'Work update submitted! Groq AI has analysed it.',
      updateId,
      ai_analysis: ai.analysis,
      ai_work_completion_pct: ai.estimated_completion_pct,
    });
  } catch (err) {
    logger.error('createWorkUpdate error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/work-updates/:id/approve  (admin)
exports.approveUpdate = async (req, res) => {
  try {
    await pool.query(
      "UPDATE work_updates SET status = 'approved' WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: 'Work update approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PATCH /api/work-updates/:id/dispute  (admin)
exports.disputeUpdate = async (req, res) => {
  try {
    await pool.query(
      "UPDATE work_updates SET status = 'disputed' WHERE id = ?",
      [req.params.id]
    );
    res.json({ success: true, message: 'Work update marked as disputed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/work-updates/:id/helpful  (auth)
exports.markHelpful = async (req, res) => {
  try {
    await pool.query(
      'UPDATE work_updates SET helpful_votes = helpful_votes + 1 WHERE id = ?',
      [req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
