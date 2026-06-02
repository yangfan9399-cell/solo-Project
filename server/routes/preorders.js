import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, member_id, book_id } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    if (member_id) {
      whereClause += ' AND p.member_id = ?';
      params.push(member_id);
    }
    if (book_id) {
      whereClause += ' AND p.book_id = ?';
      params.push(book_id);
    }

    const preorders = db.prepare(`
      SELECT p.*, b.title, b.author, b.cover_image, b.price,
             m.name as member_name, m.phone as member_phone, m.level as member_level
      FROM preorders p
      JOIN books b ON p.book_id = b.id
      JOIN members m ON p.member_id = m.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM preorders p ${whereClause}
    `).get(...params);

    const stats = db.prepare(`
      SELECT status, COUNT(*) as count FROM preorders
      GROUP BY status
    `).all();

    res.json({
      data: preorders,
      stats,
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
    const preorder = db.prepare(`
      SELECT p.*, b.title, b.author, b.cover_image, b.isbn, b.price,
             m.name as member_name, m.phone as member_phone, m.email as member_email,
             u.name as created_by_name
      FROM preorders p
      JOIN books b ON p.book_id = b.id
      JOIN members m ON p.member_id = m.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!preorder) {
      return res.status(404).json({ error: '预售订单不存在' });
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE preorder_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    preorder.notifications = notifications;

    res.json(preorder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { book_id, member_id, deposit_amount, quantity, expected_arrival, note } = req.body;

    const book = db.prepare('SELECT * FROM books WHERE id = ?').get(book_id);
    if (!book) {
      return res.status(404).json({ error: '图书不存在' });
    }

    const member = db.prepare('SELECT * FROM members WHERE id = ?').get(member_id);
    if (!member) {
      return res.status(404).json({ error: '会员不存在' });
    }

    const deposit = deposit_amount || book.deposit_amount || 10;
    if (member.balance < deposit) {
      return res.status(400).json({ error: '会员余额不足，请先充值' });
    }

    const preorder_no = generateNo('PO');
    const txNo = generateNo('TX');

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare(`
      INSERT INTO preorders (preorder_no, book_id, member_id, deposit_amount, quantity, expected_arrival, note, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `).run(preorder_no, book_id, member_id, deposit, quantity || 1, expected_arrival, note, req.user.id);

    db.prepare(`
      INSERT INTO transactions (tx_no, member_id, type, amount, status, preorder_id, payment_method, processed_by)
      VALUES (?, ?, 'deposit', ?, 'completed', ?, 'balance', ?)
    `).run(txNo, member_id, deposit, db.prepare('SELECT last_insert_rowid() as id').get().id, req.user.id);

    db.prepare(`
      UPDATE members SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(deposit, member_id);

    db.prepare('COMMIT').run();

    res.status(201).json({
      preorder_no,
      message: '预售订单创建成功',
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', (req, res) => {
  try {
    const { status, note } = req.body;
    const preorderId = req.params.id;

    const preorder = db.prepare('SELECT * FROM preorders WHERE id = ?').get(preorderId);
    if (!preorder) {
      return res.status(404).json({ error: '预售订单不存在' });
    }

    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['arrived', 'cancelled'],
      arrived: ['reserved', 'cancelled'],
      reserved: ['picked', 'cancelled'],
    };

    if (!validTransitions[preorder.status]?.includes(status)) {
      return res.status(400).json({ error: '无效的状态转换' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    if (status === 'cancelled') {
      const txNo = generateNo('TX');
      db.prepare(`
        INSERT INTO transactions (tx_no, member_id, type, amount, status, preorder_id, payment_method, processed_by, note)
        VALUES (?, ?, 'refund', ?, 'completed', ?, 'balance', ?, '订单取消退款')
      `).run(txNo, preorder.member_id, preorder.deposit_amount, preorderId, req.user.id);

      db.prepare(`
        UPDATE members SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(preorder.deposit_amount, preorder.member_id);

      db.prepare(`
        UPDATE preorders SET status = 'refunded', cancelled_at = CURRENT_TIMESTAMP, refunded_at = CURRENT_TIMESTAMP, note = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(note || preorder.note, preorderId);
    } else if (status === 'picked') {
      db.prepare(`
        UPDATE preorders SET status = ?, picked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, preorderId);

      db.prepare(`
        UPDATE stock SET quantity_reserved = quantity_reserved - ?, updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
      `).run(preorder.quantity, preorder.book_id);
    } else {
      db.prepare(`
        UPDATE preorders SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(status, preorderId);
    }

    db.prepare('COMMIT').run();

    res.json({ message: '状态更新成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const preorder = db.prepare('SELECT * FROM preorders WHERE id = ?').get(req.params.id);
    if (!preorder) {
      return res.status(404).json({ error: '预售订单不存在' });
    }

    if (!['pending', 'cancelled', 'refunded'].includes(preorder.status)) {
      return res.status(400).json({ error: '只能删除待处理或已取消的订单' });
    }

    db.prepare('DELETE FROM preorders WHERE id = ?').run(req.params.id);
    res.json({ message: '预售订单删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
