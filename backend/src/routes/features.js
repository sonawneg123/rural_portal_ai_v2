// src/routes/features.js — new feature endpoints
// Leaderboard, search, profile update, password change, stats, MP dashboard
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const logger   = require('../config/logger');

/* ── Leaderboard ─────────────────────────────────────────── */
router.get('/stats/leaderboard', async (req, res) => {
  try {
    const [districts] = await pool.query(`
      SELECT district, state,
        COUNT(*) AS total,
        SUM(status='resolved') AS resolved,
        ROUND(AVG(ai_severity_score),1) AS avg_severity
      FROM problems
      GROUP BY district, state
      ORDER BY (SUM(status='resolved')/COUNT(*)) DESC, COUNT(*) DESC
      LIMIT 20`);

    const [villages] = await pool.query(`
      SELECT village, district, state,
        COUNT(*) AS total,
        SUM(status='resolved') AS resolved
      FROM problems
      GROUP BY village, district, state
      ORDER BY (SUM(status='resolved')/COUNT(*)) DESC, COUNT(*) DESC
      LIMIT 20`);

    const [categories] = await pool.query(`
      SELECT c.name, c.color,
        COUNT(p.id) AS total,
        SUM(p.status='resolved') AS resolved
      FROM categories c LEFT JOIN problems p ON p.category_id=c.id
      GROUP BY c.id ORDER BY resolved DESC LIMIT 10`);

    res.json({ success:true, districts, villages, categories });
  } catch (err) {
    logger.error('Leaderboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── User stats ─────────────────────────────────────────── */
router.get('/auth/my-stats', authenticate, async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_problems,
        SUM(status='resolved') AS resolved,
        SUM(upvotes) AS total_upvotes,
        SUM(views) AS total_views
      FROM problems WHERE user_id=?`, [req.user.id]);
    res.json({ success:true, ...stats });
  } catch (err) {
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── Profile update ─────────────────────────────────────── */
router.patch('/auth/profile', authenticate, async (req, res) => {
  const { name, phone, district, village, state } = req.body;
  try {
    const fields = []; const vals = [];
    if (name)     { fields.push('name=?');     vals.push(name); }
    if (phone)    { fields.push('phone=?');    vals.push(phone); }
    if (district) { fields.push('district=?'); vals.push(district); }
    if (village)  { fields.push('village=?');  vals.push(village); }
    if (state)    { fields.push('state=?');    vals.push(state); }
    if (!fields.length) return res.status(400).json({ success:false, message:'Nothing to update' });
    await pool.query(`UPDATE users SET ${fields.join(',')} WHERE id=?`, [...vals, req.user.id]);
    res.json({ success:true, message:'Profile updated' });
  } catch (err) {
    logger.error('Profile update error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── Change password ────────────────────────────────────── */
router.post('/auth/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ success:false, message:'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ success:false, message:'New password must be at least 8 characters' });
  try {
    const [[user]] = await pool.query('SELECT password FROM users WHERE id=?', [req.user.id]);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ success:false, message:'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password=? WHERE id=?', [hashed, req.user.id]);
    res.json({ success:true, message:'Password changed successfully' });
  } catch (err) {
    logger.error('Change password error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── MP Dashboard ───────────────────────────────────────── */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ success:false, message:'Access denied' });
  next();
};

router.get('/mp/dashboard', authenticate, requireRole('mp','admin'), async (req, res) => {
  try {
    const { state } = req.user;

    const [[summary]] = await pool.query(`
      SELECT COUNT(*) AS total_problems,
        SUM(status='pending') AS pending, SUM(status='resolved') AS resolved
      FROM problems WHERE state=?`, [state]);

    const [byDistrict] = await pool.query(`
      SELECT district, COUNT(*) AS count, SUM(status='resolved') AS resolved
      FROM problems WHERE state=? GROUP BY district ORDER BY count DESC`, [state]);

    const [districts] = await pool.query(`SELECT DISTINCT district FROM problems WHERE state=? ORDER BY district`, [state]);
    const [talukas]   = await pool.query(`SELECT DISTINCT taluka, district FROM problems WHERE state=? AND taluka IS NOT NULL ORDER BY taluka`, [state]);

    // Constituencies = unique talukas (MLA segments)
    const constituencies = talukas.map(t => t.taluka);

    res.json({ success:true, data: {
      summary: { ...summary, budget_allocated: 0 },
      byDistrict,
      districts: districts.map(d => d.district),
      talukas:   talukas.map(t => ({ name: t.taluka, district: t.district })),
      constituencies: [...new Set(constituencies)],
    }});
  } catch (err) {
    logger.error('MP dashboard error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

router.post('/mp/budget/allocate', authenticate, requireRole('mp','admin'), async (req, res) => {
  const { taluka, amount } = req.body;
  if (!taluka || !amount) return res.status(400).json({ success:false, message:'Taluka and amount required' });
  try {
    await pool.query(`
      INSERT INTO budget_allocations (state, district, taluka, budget_allocated, allocated_by, allocated_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE budget_allocated=budget_allocated+VALUES(budget_allocated)`,
      [req.user.state, req.user.district || '', taluka, Number(amount), req.user.id]
    );
    res.json({ success:true, message:`Allocated ₹${Number(amount).toLocaleString('en-IN')} to ${taluka}` });
  } catch (err) {
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── Deadline / resolution estimate ────────────────────── */
// Feature 8: AI-estimated deadline shown on problem detail
router.get('/problems/:id/deadline', async (req, res) => {
  try {
    const [[p]] = await pool.query(`
      SELECT created_at, ai_resolution_days, status, ai_severity_score
      FROM problems WHERE id=?`, [req.params.id]);
    if (!p) return res.status(404).json({ success:false, message:'Not found' });

    let estimatedDate = null;
    if (p.ai_resolution_days) {
      const d = new Date(p.created_at);
      d.setDate(d.getDate() + p.ai_resolution_days);
      estimatedDate = d.toISOString();
    }
    const overdue = estimatedDate && new Date(estimatedDate) < new Date() && p.status !== 'resolved';

    res.json({ success:true, estimatedDate, daysEstimated: p.ai_resolution_days, overdue, status: p.status });
  } catch (err) {
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── Tag cloud ─────────────────────────────────────────── */
// Feature 9: Tag cloud API
router.get('/stats/tags', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ai_tags FROM problems WHERE ai_tags IS NOT NULL AND ai_tags != '' LIMIT 500`);
    const counts = {};
    rows.forEach(r => {
      r.ai_tags.split(',').forEach(tag => {
        const t = tag.trim().toLowerCase();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    });
    const tags = Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
    res.json({ success:true, tags });
  } catch (err) {
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── Export problems CSV ────────────────────────────────── */
// Feature 12: Export to CSV
router.get('/admin/export/csv', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'cm' && req.user.role !== 'collector') {
    return res.status(403).json({ success:false, message:'Access denied' });
  }
  try {
    const { state, district, status } = req.query;
    const where = ['1=1']; const params = [];
    if (state)    { where.push('p.state=?');    params.push(state); }
    if (district) { where.push('p.district=?'); params.push(district); }
    if (status)   { where.push('p.status=?');   params.push(status); }

    const [rows] = await pool.query(`
      SELECT p.id, p.title, p.status, p.priority, p.state, p.district, p.village,
             p.ai_severity_score, p.upvotes, p.views, p.budget_estimate,
             p.work_updates_count, p.created_at, c.name AS category,
             CASE WHEN p.anonymous=1 THEN 'Anonymous' ELSE u.name END AS reporter
      FROM problems p
      JOIN categories c ON c.id=p.category_id
      JOIN users u ON u.id=p.user_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC`, params);

    const headers = ['ID','Title','Category','Status','Priority','State','District','Village','Severity','Upvotes','Views','Budget','Work Updates','Reporter','Created'];
    const csv = [
      headers.join(','),
      ...rows.map(r => [
        r.id, `"${r.title.replace(/"/g,'""')}"`, r.category, r.status, r.priority,
        r.state, r.district, r.village, r.ai_severity_score || '',
        r.upvotes, r.views, r.budget_estimate || '', r.work_updates_count,
        `"${r.reporter}"`, new Date(r.created_at).toLocaleDateString('en-IN'),
      ].join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="problems-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    logger.error('CSV export error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

/* ── Announcement CRUD ──────────────────────────────────── */
router.post('/announcements', authenticate, async (req, res) => {
  const allowedRoles = ['admin','cm','collector','mla','sarpanch','gramsevak'];
  if (!allowedRoles.includes(req.user.role))
    return res.status(403).json({ success:false, message:'Not allowed' });
  const { title, content, scope_district, scope_taluka, scope_village } = req.body;
  if (!title || !content) return res.status(400).json({ success:false, message:'Title and content required' });
  try {
    await pool.query(
      `INSERT INTO announcements (author_id, role, title, content, scope_state, scope_district, scope_taluka, scope_village)
       VALUES (?,?,?,?,?,?,?,?)`,
      [req.user.id, req.user.role, title, content, req.user.state,
       scope_district||null, scope_taluka||null, scope_village||null]
    );
    res.status(201).json({ success:true, message:'Announcement posted' });
  } catch (err) {
    logger.error('Announcement error:', err);
    res.status(500).json({ success:false, message:'Server error' });
  }
});

router.get('/announcements', async (req, res) => {
  const { state, district } = req.query;
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.title, a.content, a.role, a.is_pinned, a.created_at,
             u.name AS author_name
      FROM announcements a JOIN users u ON u.id=a.author_id
      WHERE (a.scope_state IS NULL OR a.scope_state=?)
        AND (a.scope_district IS NULL OR a.scope_district=?)
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT 20`,
      [state||'', district||'']
    );
    res.json({ success:true, data:rows });
  } catch (err) {
    res.status(500).json({ success:false, message:'Server error' });
  }
});

module.exports = router;
