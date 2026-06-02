import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', (req, res) => {
  try {
    const toSendArrival = db.prepare(`
      SELECT COUNT(*) as count FROM preorders p
      WHERE p.status = 'arrived'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.preorder_id = p.id AND n.type = 'arrival'
      )
    `).get();

    const toSendReminder = db.prepare(`
      SELECT COUNT(*) as count FROM preorders p
      WHERE p.status = 'reserved'
      AND p.picked_at IS NULL
      AND p.actual_arrival_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.preorder_id = p.id AND n.type = 'reminder'
      )
    `).get();

    const notified = db.prepare(`
      SELECT COUNT(*) as count FROM preorders p
      WHERE EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.preorder_id = p.id AND n.type IN ('arrival', 'reminder')
      )
    `).get();

    const released = db.prepare(`
      SELECT COUNT(*) as count FROM preorders p
      WHERE p.status IN ('expired', 'refunded', 'cancelled')
    `).get();

    res.json({
      toSend: toSendArrival.count + toSendReminder.count,
      toSendArrival: toSendArrival.count,
      toSendReminder: toSendReminder.count,
      notified: notified.count,
      released: released.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    if (!['arrived', 'reserved'].includes(preorder.status)) {
      return res.status(400).json({ error: '订单状态不支持发送到货通知' });
    }

    const existingNotification = db.prepare(`
      SELECT id FROM notifications
      WHERE preorder_id = ? AND type = 'arrival'
    `).get(preorder_id);

    if (existingNotification) {
      return res.status(400).json({ error: '已发送过到货通知' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    const notificationNo = generateNo('N');
    const title = `您预订的《${preorder.title}》已到货`;
    const content = `尊敬的${preorder.member_name}会员，您预订的《${preorder.title}》已到货，请于14天内前来取书。`;

    db.prepare(`
      INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
      VALUES (?, ?, ?, 'arrival', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
    `).run(notificationNo, preorder.member_id, preorder_id, title, content);

    if (preorder.status === 'arrived') {
      db.prepare(`
        UPDATE preorders SET notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(preorder_id);
    }

    db.prepare('COMMIT').run();

    res.json({
      notification_no: notificationNo,
      message: '到货通知已发送',
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-arrival', (req, res) => {
  try {
    const { status = 'arrived' } = req.body;

    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM preorders p WHERE p.status = ?
    `).get(status);

    const preorders = db.prepare(`
      SELECT p.*, m.name as member_name, b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.status = ?
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.preorder_id = p.id AND n.type = 'arrival'
      )
    `).all(status);

    const notifications = [];
    const skipped = totalCount.count - preorders.length;

    db.prepare('BEGIN TRANSACTION').run();

    for (const preorder of preorders) {
      const notificationNo = generateNo('N');
      const title = `您预订的《${preorder.title}》已到货`;
      const content = `尊敬的${preorder.member_name}会员，您预订的《${preorder.title}》已到货，请于14天内前来取书。`;

      db.prepare(`
        INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
        VALUES (?, ?, ?, 'arrival', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
      `).run(notificationNo, preorder.member_id, preorder.id, title, content);

      db.prepare(`
        UPDATE preorders SET notified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(preorder.id);

      notifications.push(notificationNo);
    }

    db.prepare('COMMIT').run();

    res.json({
      count: notifications.length,
      skipped,
      total: totalCount.count,
      notifications,
      message: skipped > 0
        ? `成功发送 ${notifications.length} 条到货通知，跳过 ${skipped} 条已通知订单`
        : `成功发送 ${notifications.length} 条到货通知`,
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
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

    if (!['arrived', 'reserved'].includes(preorder.status)) {
      return res.status(400).json({ error: '订单状态不支持发送提醒' });
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

router.post('/batch-reminder', (req, res) => {
  try {
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM preorders p
      WHERE p.status = 'reserved'
      AND p.picked_at IS NULL
      AND p.actual_arrival_date IS NOT NULL
    `).get();

    const preorders = db.prepare(`
      SELECT p.*, m.name as member_name, b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.status = 'reserved'
      AND p.picked_at IS NULL
      AND p.actual_arrival_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.preorder_id = p.id AND n.type = 'reminder'
      )
      ORDER BY p.actual_arrival_date ASC
    `).all();

    const notifications = [];
    const skipped = totalCount.count - preorders.length;

    for (const preorder of preorders) {
      const notificationNo = generateNo('N');
      const title = '取书提醒';
      const content = `尊敬的${preorder.member_name}会员，温馨提醒：您预订的《${preorder.title}》已到货，请尽快前来取书。`;

      db.prepare(`
        INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
        VALUES (?, ?, ?, 'reminder', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
      `).run(notificationNo, preorder.member_id, preorder.id, title, content);

      notifications.push(notificationNo);
    }

    res.json({
      count: notifications.length,
      skipped,
      total: totalCount.count,
      notifications,
      message: skipped > 0
        ? `成功发送 ${notifications.length} 条取书提醒，跳过 ${skipped} 条已提醒订单`
        : `成功发送 ${notifications.length} 条取书提醒`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/overdue-check', (req, res) => {
  try {
    const overdueDays = parseInt(process.env.OVERDUE_DAYS) || 14;

    const totalExpired = db.prepare(`
      SELECT COUNT(*) as count
      FROM preorders p
      WHERE p.status = 'reserved'
      AND DATE(p.actual_arrival_date, '+' || ? || ' days') <= DATE('now')
    `).get(overdueDays);

    const alreadyReleased = db.prepare(`
      SELECT COUNT(*) as count
      FROM preorders p
      WHERE p.status IN ('expired', 'refunded', 'cancelled')
      AND DATE(p.actual_arrival_date, '+' || ? || ' days') <= DATE('now')
    `).get(overdueDays);

    const expiredPreorders = db.prepare(`
      SELECT p.*, m.name as member_name, m.level as member_level, b.title
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      JOIN books b ON p.book_id = b.id
      WHERE p.status = 'reserved'
      AND DATE(p.actual_arrival_date, '+' || ? || ' days') <= DATE('now')
      ORDER BY p.book_id ASC,
               CASE m.level
                 WHEN 'platinum' THEN 1
                 WHEN 'gold' THEN 2
                 WHEN 'silver' THEN 3
                 ELSE 4
               END ASC,
               p.created_at ASC
    `).all(overdueDays);

    const bookStock = {};
    const stockStmt = db.prepare(`
      SELECT COALESCE(quantity_reserved, 0) as quantity_reserved
      FROM stock WHERE book_id = ?
    `);
    for (const preorder of expiredPreorders) {
      if (!bookStock[preorder.book_id]) {
        const stock = stockStmt.get(preorder.book_id);
        bookStock[preorder.book_id] = stock ? stock.quantity_reserved : 0;
      }
    }

    const processed = [];
    const insufficientStock = [];
    const updateStockStmt = db.prepare(`
      UPDATE stock SET quantity_reserved = quantity_reserved - ?, updated_at = CURRENT_TIMESTAMP
      WHERE book_id = ? AND quantity_reserved >= ?
    `);

    for (const preorder of expiredPreorders) {
      const remainingReserved = bookStock[preorder.book_id] || 0;

      if (preorder.quantity > remainingReserved) {
        insufficientStock.push({
          preorder_id: preorder.id,
          preorder_no: preorder.preorder_no,
          book_title: preorder.title,
          member_name: preorder.member_name,
          quantity: preorder.quantity,
          remaining_reserved: remainingReserved,
        });
        continue;
      }

      try {
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

        const stockResult = updateStockStmt.run(preorder.quantity, preorder.book_id, preorder.quantity);
        if (stockResult.changes === 0) {
          throw new Error('库存扣减失败，预留库存不足');
        }

        bookStock[preorder.book_id] = remainingReserved - preorder.quantity;

        const notificationNo = generateNo('N');
        db.prepare(`
          INSERT INTO notifications (notification_no, member_id, preorder_id, type, title, content, channel, status, sent_at)
          VALUES (?, ?, ?, 'overdue', ?, ?, 'sms', 'sent', CURRENT_TIMESTAMP)
        `).run(notificationNo, preorder.member_id, preorder.id, '取书逾期通知', `尊敬的${preorder.member_name}会员，您预订的《${preorder.title}》已逾期未取，订单已自动取消，订金已退还至您的账户。`);

        db.prepare('COMMIT').run();

        processed.push({
          preorder_id: preorder.id,
          preorder_no: preorder.preorder_no,
          book_title: preorder.title,
          member_name: preorder.member_name,
          amount: preorder.deposit_amount,
        });
      } catch (err) {
        db.prepare('ROLLBACK').run();
        insufficientStock.push({
          preorder_id: preorder.id,
          preorder_no: preorder.preorder_no,
          book_title: preorder.title,
          member_name: preorder.member_name,
          quantity: preorder.quantity,
          remaining_reserved: remainingReserved,
          reason: err.message,
        });
      }
    }

    const totalReleased = alreadyReleased.count + processed.length;

    const messageParts = [];
    if (processed.length > 0) {
      messageParts.push(`已处理 ${processed.length} 个逾期订单`);
    }
    if (insufficientStock.length > 0) {
      messageParts.push(`${insufficientStock.length} 个因库存不足跳过`);
    }
    if (alreadyReleased.count > 0) {
      messageParts.push(`${alreadyReleased.count} 个此前已释放`);
    }

    res.json({
      processed: processed.length,
      insufficient_stock: insufficientStock.length,
      already_released: alreadyReleased.count,
      total_eligible: totalExpired.count,
      total_released: totalReleased,
      processed_details: processed,
      insufficient_details: insufficientStock,
      message: messageParts.length > 0 ? messageParts.join('，') : '没有需要处理的逾期订单',
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
