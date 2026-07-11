// src/controllers/authController.js
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { pool } = require('../config/database');
const { validationResult } = require('express-validator');

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, phone, state, district, village, anonymous_mode } = req.body;
  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, phone, state, district, village, anonymous_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashed, phone || null, state, district, village, anonymous_mode ? 1 : 0]
    );

    const user  = { id: result.insertId, role: 'user' };
    const token = signToken(user);
    res.status(201).json({ success: true, token, user: { id: user.id, name, email, state, district, village, role: 'user', anonymous_mode: !!anonymous_mode } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, password, role, state, district, village, is_active, anonymous_mode FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user = rows[0];
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account deactivated' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = signToken(user);
    const { password: _, ...safe } = user;
    res.json({ success: true, token, user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, state, district, village, role, anonymous_mode, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: rows[0] });
};
