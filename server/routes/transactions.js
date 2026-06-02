import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, member_id, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    if (member_id) {
      whereClause += ' AND member_id = ?';
      params.push(member_id);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const transactions = db.prepare(`
      SELECT t.*, m.name as member_name, m.member_no,
             u.name as processed_by_name,
             b.title as book_title
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      LEFT JOIN users u ON t.processed_by = u.id
      LEFT JOIN preorders p ON t.preorder_id = p.id
      LEFT JOIN books b ON p.book_id = b.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM transactions ${whereClause}`).get(...params);

    const summary = db.prepare(`
      SELECT type, SUM(amount) as total_amount, COUNT(*) as count
      FROM transactions
      GROUP BY type
    `).all();

    res.json({
      data: transactions,
      summary,
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

router.post('/refund', (req, res) => {
  try {
    const { preorder_id, amount, payment_method, note } = req.body;

    const preorder = db.prepare('SELECT * FROM preorders WHERE id = ?').get(preorder_id);
    if (!preorder) {
      return res.status(404).json({ error: '预售订单不存在' });
    }

    if (['picked', 'refunded', 'expired'].includes(preorder.status)) {
      return res.status(400).json({ error: '该订单状态不允许退款' });
    }

    const refundAmount = amount || preorder.deposit_amount;

    db.prepare('BEGIN TRANSACTION').run();

    const txNo = generateNo('TX');
    db.prepare(`
      INSERT INTO transactions (tx_no, member_id, type, amount, status, preorder_id, payment_method, note, processed_by)
      VALUES (?, ?, 'refund', ?, 'completed', ?, ?, ?, ?)
    `).run(txNo, preorder.member_id, refundAmount, preorder_id, payment_method || 'balance', note || '手动退款', req.user.id);

    db.prepare(`
      UPDATE members SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(refundAmount, preorder.member_id);

    db.prepare(`
      UPDATE preorders SET status = 'refunded', refunded_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(preorder_id);

    if (preorder.status === 'reserved') {
      db.prepare(`
        UPDATE stock SET quantity_reserved = quantity_reserved - ?, updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
      `).run(preorder.quantity, preorder.book_id);
    }

    db.prepare('COMMIT').run();

    res.json({
      tx_no: txNo,
      message: '退款成功',
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

export default router;
