import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, supplier } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (supplier) {
      whereClause += ' AND supplier LIKE ?';
      params.push(`%${supplier}%`);
    }

    const orders = db.prepare(`
      SELECT po.*, u.name as created_by_name
      FROM purchase_orders po
      LEFT JOIN users u ON po.created_by = u.id
      ${whereClause}
      ORDER BY po.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM purchase_orders ${whereClause}`).get(...params);

    res.json({
      data: orders,
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
    const order = db.prepare(`
      SELECT po.*, u.name as created_by_name
      FROM purchase_orders po
      LEFT JOIN users u ON po.created_by = u.id
      WHERE po.id = ?
    `).get(req.params.id);

    if (!order) {
      return res.status(404).json({ error: '采购单不存在' });
    }

    const items = db.prepare(`
      SELECT pi.*, b.title, b.author, b.isbn, b.cover_image
      FROM purchase_items pi
      JOIN books b ON pi.book_id = b.id
      WHERE pi.po_id = ?
    `).all(req.params.id);

    order.items = items;

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole('purchaser', 'manager', 'admin'), (req, res) => {
  try {
    const { supplier, expected_date, note, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: '采购单至少需要一项商品' });
    }

    const po_no = generateNo('PUR');
    const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity_ordered, 0);

    db.prepare('BEGIN TRANSACTION').run();

    const result = db.prepare(`
      INSERT INTO purchase_orders (po_no, supplier, total_amount, expected_date, note, created_by, status)
      VALUES (?, ?, ?, ?, ?, ?, 'draft')
    `).run(po_no, supplier, total_amount, expected_date, note, req.user.id);

    const poId = result.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO purchase_items (po_id, book_id, quantity_ordered, unit_price, note)
      VALUES (?, ?, ?, ?, ?)
    `);

    items.forEach(item => {
      insertItem.run(poId, item.book_id, item.quantity_ordered, item.unit_price, item.note);
    });

    db.prepare('COMMIT').run();

    res.status(201).json({
      id: poId,
      po_no,
      message: '采购单创建成功',
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole('purchaser', 'manager', 'admin'), (req, res) => {
  try {
    const { supplier, status, expected_date, note, items } = req.body;
    const poId = req.params.id;

    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    if (!order) {
      return res.status(404).json({ error: '采购单不存在' });
    }

    if (order.status === 'received') {
      return res.status(400).json({ error: '已完成的采购单不能修改' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare(`
      UPDATE purchase_orders SET
        supplier = ?, status = ?, expected_date = ?, note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(supplier, status || order.status, expected_date, note, poId);

    if (items && items.length > 0) {
      db.prepare('DELETE FROM purchase_items WHERE po_id = ?').run(poId);

      const insertItem = db.prepare(`
        INSERT INTO purchase_items (po_id, book_id, quantity_ordered, unit_price, note)
        VALUES (?, ?, ?, ?, ?)
      `);

      items.forEach(item => {
        insertItem.run(poId, item.book_id, item.quantity_ordered, item.unit_price, item.note);
      });

      const total_amount = items.reduce((sum, item) => sum + item.unit_price * item.quantity_ordered, 0);
      db.prepare('UPDATE purchase_orders SET total_amount = ? WHERE id = ?').run(total_amount, poId);
    }

    db.prepare('COMMIT').run();

    res.json({ message: '采购单更新成功' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/receive', requireRole('purchaser', 'manager', 'admin'), (req, res) => {
  try {
    const { items } = req.body;
    const poId = req.params.id;

    const order = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(poId);
    if (!order) {
      return res.status(404).json({ error: '采购单不存在' });
    }

    if (!['submitted', 'partial'].includes(order.status)) {
      return res.status(400).json({ error: '只能对已提交的采购单进行到货操作' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    let allReceived = true;
    const generatedTaskCount = { value: 0 };

    for (const item of items) {
      const poItem = db.prepare('SELECT * FROM purchase_items WHERE id = ? AND po_id = ?').get(item.item_id, poId);
      if (!poItem) continue;

      const newReceived = poItem.quantity_received + (item.quantity || 0);
      if (newReceived > poItem.quantity_ordered) {
        throw new Error('到货数量不能超过订购数量');
      }

      const itemStatus = newReceived === poItem.quantity_ordered ? 'received' : newReceived > 0 ? 'partial' : 'pending';
      if (itemStatus !== 'received') allReceived = false;

      db.prepare(`
        UPDATE purchase_items SET
          quantity_received = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newReceived, itemStatus, item.item_id);

      const stock = db.prepare('SELECT * FROM stock WHERE book_id = ?').get(poItem.book_id);
      if (stock) {
        db.prepare(`
          UPDATE stock SET quantity_available = quantity_available + ?, last_restock_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE book_id = ?
        `).run(item.quantity || 0, poItem.book_id);
      } else {
        db.prepare(`
          INSERT INTO stock (book_id, quantity_available, last_restock_date)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(poItem.book_id, item.quantity || 0);
      }

      if (item.quantity > 0) {
        const preorders = db.prepare(`
          SELECT * FROM preorders
          WHERE book_id = ? AND status = 'confirmed'
          ORDER BY created_at ASC
        `).all(poItem.book_id);

        let remainingQty = item.quantity || 0;
        for (const preorder of preorders) {
          if (remainingQty <= 0) break;
          if (preorder.quantity <= remainingQty) {
            db.prepare(`
              UPDATE preorders SET status = 'arrived', actual_arrival_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(preorder.id);
            remainingQty -= preorder.quantity;

            const existingTask = db.prepare(`
              SELECT id FROM sorting_tasks
              WHERE preorder_id = ? AND status NOT IN ('delivered', 'cancelled')
            `).get(preorder.id);
            if (!existingTask) {
              const taskNo = generateNo('ST');
              db.prepare(`
                INSERT INTO sorting_tasks (task_no, po_item_id, preorder_id, book_id, member_id, quantity)
                VALUES (?, ?, ?, ?, ?, ?)
              `).run(taskNo, poItem.id, preorder.id, poItem.book_id, preorder.member_id, preorder.quantity);
              generatedTaskCount.value++;
            }
          }
        }
      }
    }

    const poStatus = allReceived ? 'received' : 'partial';

    if (allReceived) {
      db.prepare(`
        UPDATE purchase_orders SET status = ?, received_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(poStatus, poId);
    } else {
      db.prepare(`
        UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(poStatus, poId);
    }

    db.prepare('COMMIT').run();

    res.json({
      message: '到货确认成功',
      generatedTasks: generatedTaskCount.value,
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

export default router;
