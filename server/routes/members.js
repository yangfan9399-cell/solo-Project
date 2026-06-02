import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateMemberNo, generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, level } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (name LIKE ? OR phone LIKE ? OR member_no LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (level) {
      whereClause += ' AND level = ?';
      params.push(level);
    }

    const members = db.prepare(`
      SELECT * FROM members
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM members ${whereClause}`).get(...params);

    res.json({
      data: members,
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
    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);

    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }

    const preorders = db.prepare(`
      SELECT p.*, b.title, b.author, b.cover_image
      FROM preorders p
      JOIN books b ON p.book_id = b.id
      WHERE p.member_id = ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all(req.params.id);

    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE member_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(req.params.id);

    member.preorders = preorders;
    member.transactions = transactions;

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, phone, email, level, address, note } = req.body;

    const existing = db.prepare('SELECT id FROM members WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ error: '该手机号已注册会员' });
    }

    const member_no = generateMemberNo();

    const result = db.prepare(`
      INSERT INTO members (member_no, name, phone, email, level, address, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(member_no, name, phone, email, level || 'normal', address, note);

    res.status(201).json({
      id: result.lastInsertRowid,
      member_no,
      message: '会员创建成功',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, phone, email, level, balance, address, note } = req.body;

    db.prepare(`
      UPDATE members SET
        name = ?, phone = ?, email = ?, level = ?, balance = ?, address = ?, note = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, phone, email, level, balance, address, note, req.params.id);

    res.json({ message: '会员更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/deposit', (req, res) => {
  try {
    const { amount, payment_method, note } = req.body;
    const memberId = req.params.id;

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }

    const txNo = generateNo('TX');

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare(`
      INSERT INTO transactions (tx_no, member_id, type, amount, payment_method, note, processed_by)
      VALUES (?, ?, 'recharge', ?, ?, ?, ?)
    `).run(txNo, memberId, amount, payment_method || 'cash', note, req.user.id);

    db.prepare(`
      UPDATE members SET balance = balance + ?, total_deposit = total_deposit + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(amount, amount, memberId);

    db.prepare('COMMIT').run();

    res.json({ message: '充值成功', tx_no: txNo });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

export default router;
