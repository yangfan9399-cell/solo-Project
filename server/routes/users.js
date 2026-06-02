import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 10, role, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const users = db.prepare(`
      SELECT id, username, name, role, email, phone, status, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params);

    res.json({
      data: users,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: total.count,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, username, name, role, email, phone, status, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { username, password, name, role, email, phone } = req.body;

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (username, password, name, role, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, hashedPassword, name, role, email, phone);

    res.status(201).json({
      id: result.lastInsertRowid,
      message: '用户创建成功',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, role, email, phone, status, password } = req.body;

    const fields = ['name', 'role', 'email', 'phone', 'status'];
    const values = [name, role, email, phone, status];

    if (password) {
      fields.push('password');
      values.push(bcrypt.hashSync(password, 10));
    }

    fields.push('updated_at');
    values.push(new Date().toISOString());
    values.push(req.params.id);

    const setClause = fields.map(f => `${f} = ?`).join(', ');

    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values);

    res.json({ message: '用户更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: '不能删除自己的账户' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: '用户删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
