import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, type, member_id } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    if (member_id) {
      whereClause += ' AND member_id = ?';
      params.push(member_id);
    }

    const notifications = db.prepare(`
      SELECT n.*, m.name as member_name, m.phone as member_phone,
             b.title as book_title
      FROM notifications n
      JOIN members m ON n.member_id = m.id
      LEFT JOIN preorders p ON n.preorder_id = p.id
      LEFT JOIN books b ON p.book_id = b.id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM notifications ${whereClause}`).get(...params);

    const stats = db.prepare(`
      SELECT status, COUNT(*) as count FROM notifications
      GROUP BY status
    `).all();

    res.json({
      data: notifications,
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

router.post('/arrival', (req, res) => {
  try {
    const { preorder_id } = req.body;

    const preorder = db.prepare(`
      SELECT p.*, m.name as member_name, m.phone as member_phone,
             b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.id = ?
    `).get(preorder_id);

    if (!preorder) {
      return res.status(404).json({ error: '预售订单不存在' });
    }

    const notificationNo = generateNo('N');
    const title = `您预订的《${preorder.title}》已到货`;
    const content = `尊敬的${preorder.member_name}会员，您预订的《${preorder.title}》已到货，请于14天内前来取书。`;

    db.prepare(`
      INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status)
      VALUES (?, ?, ?, 'arrival', ?, ?, 'sms', 'sent')
    `).run(notificationNo, preorder.member_id, preorder_id, title, content);

    res.json({
      notification_no: notificationNo,
      message: '到货通知已发送',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-arrival', (req, res) => {
  try {
    const { status = 'arrived' } = req.body;

    const preorders = db.prepare(`
      SELECT p.*, m.name as member_name, b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.status = ?
    `).all(status);

    const notifications = [];

    for (const preorder of preorders) {
      const notificationNo = generateNo('N');
      const title = `您预订的《${preorder.title}》已到货`;
      const content = `尊敬的${preorder.member_name}会员，您预订的《${preorder.title}》已到货，请于14天内前来取书。`;

      db.prepare(`
        INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
        VALUES (?, ?, ?, 'arrival', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
      `).run(notificationNo, preorder.member_id, preorder.id, title, content);

      notifications.push(notificationNo);
    }

    res.json({
      count: notifications.length,
      notifications,
      message: `成功发送 ${notifications.length} 条到货通知`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reminder', (req, res) => {
  try {
    const { preorder_id } = req.body;

    const preorder = db.prepare(`
      SELECT p.*, m.name as member_name, b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.id = ?
    `).get(preorder_id);

    if (!preorder) {
      return res.status(404).json({ error: '预售订单不存在' });
    }

    const notificationNo = generateNo('N');
    const title = '取书提醒';
    const content = `尊敬的${preorder.member_name}会员，温馨提醒：您预订的《${preorder.title}》已到货，请尽快前来取书。`;

    db.prepare(`
      INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
      VALUES (?, ?, ?, 'reminder', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
    `).run(notificationNo, preorder.member_id, preorder_id, title, content);

    res.json({
      notification_no: notificationNo,
      message: '提醒通知已发送',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/overdue-check', (req, res) => {
  try {
    const overdueDays = parseInt(process.env.OVERDUE_DAYS) || 14;

    const expiredPreorders = db.prepare(`
      SELECT p.*, m.name as member_name, b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.status = 'reserved'
      AND DATE(p.actual_arrival_date, '+' || ? || ' days') <= DATE('now')
    `).all(overdueDays);

    const results = [];

    for (const preorder of expiredPreorders) {
      db.prepare('BEGIN TRANSACTION').run();

      db.prepare(`
        UPDATE preorders
        SET status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(preorder.id);

      const txNo = generateNo('TX');
      db.prepare(`
        INSERT INTO transactions (tx_no, member_id, type, amount, status, preorder_id, payment_method, note)
        VALUES (?, ?, 'refund', ?, 'completed', ?, 'balance', '逾期取书，订金自动退还')
      `).run(txNo, preorder.member_id, preorder.deposit_amount, preorder.id);

      db.prepare(`
        UPDATE members SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(preorder.deposit_amount, preorder.member_id);

      db.prepare(`
        UPDATE stock SET quantity_reserved = quantity_reserved - ?, updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
      `).run(preorder.quantity, preorder.book_id);

      const notificationNo = generateNo('N');
      db.prepare(`
        INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
        VALUES (?, ?, ?, 'overdue', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
      `).run(notificationNo, preorder.member_id, preorder.id, '取书逾期通知', `尊敬的${preorder.member_name}会员，您预订的《${preorder.title}》已逾期未取，订单已自动取消，订金已退还至您的账户。`);

      db.prepare('COMMIT').run();

      results.push(preorder.id);
    }

    res.json({
      processed: results.length,
      message: `已处理 ${results.length} 个逾期订单`,
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/read', (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET status = 'read', read_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: '通知已标记为已读' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
    res.json({ message: '通知删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
