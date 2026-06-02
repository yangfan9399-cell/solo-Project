import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, book_id, member_id } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND st.status = ?';
      params.push(status);
    }
    if (book_id) {
      whereClause += ' AND st.book_id = ?';
      params.push(book_id);
    }
    if (member_id) {
      whereClause += ' AND st.member_id = ?';
      params.push(member_id);
    }

    const tasks = db.prepare(`
      SELECT st.*, b.title, b.author, b.cover_image,
             m.name as member_name, m.phone as member_phone,
             u.name as sorted_by_name
      FROM sorting_tasks st
      JOIN books b ON st.book_id = b.id
      JOIN members m ON st.member_id = m.id
      LEFT JOIN users u ON st.sorted_by = u.id
      ${whereClause}
      ORDER BY st.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM sorting_tasks st ${whereClause}
    `).get(...params);

    const stats = db.prepare(`
      SELECT status, COUNT(*) as count FROM sorting_tasks
      GROUP BY status
    `).all();

    res.json({
      data: tasks,
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

router.get('/board', (req, res) => {
  try {
    const pending = db.prepare(`
      SELECT st.*, b.title, b.author, b.cover_image,
             m.name as member_name, m.phone as member_phone,
             m.level as member_level
      FROM sorting_tasks st
      JOIN books b ON st.book_id = b.id
      JOIN members m ON st.member_id = m.id
      WHERE st.status = 'pending'
      ORDER BY st.created_at ASC
    `).all();

    const sorting = db.prepare(`
      SELECT st.*, b.title, b.author, b.cover_image,
             m.name as member_name, m.phone as member_phone,
             u.name as sorted_by_name
      FROM sorting_tasks st
      JOIN books b ON st.book_id = b.id
      JOIN members m ON st.member_id = m.id
      LEFT JOIN users u ON st.sorted_by = u.id
      WHERE st.status = 'sorting'
      ORDER BY st.sorted_at DESC
    `).all();

    const sorted = db.prepare(`
      SELECT st.*, b.title, b.author, b.cover_image,
             m.name as member_name, m.phone as member_phone,
             u.name as sorted_by_name
      FROM sorting_tasks st
      JOIN books b ON st.book_id = b.id
      JOIN members m ON st.member_id = m.id
      LEFT JOIN users u ON st.sorted_by = u.id
      WHERE st.status = 'sorted'
      ORDER BY st.sorted_at DESC
      LIMIT 20
    `).all();

    const stats = db.prepare(`
      SELECT status, COUNT(*) as count FROM sorting_tasks
      GROUP BY status
    `).all();

    res.json({
      pending,
      sorting,
      sorted,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', (req, res) => {
  try {
    const { po_item_id } = req.body;

    const poItem = db.prepare('SELECT * FROM purchase_items WHERE id = ?').get(po_item_id);
    if (!poItem) {
      return res.status(404).json({ error: '采购项不存在' });
    }

    const preorders = db.prepare(`
      SELECT * FROM preorders
      WHERE book_id = ? AND status = 'arrived'
      ORDER BY created_at ASC
    `).all(poItem.book_id);

    if (preorders.length === 0) {
      return res.status(400).json({ error: '没有待分拣的预售订单' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    const generatedTasks = [];

    for (const preorder of preorders) {
      const taskNo = generateNo('ST');

      const existingTask = db.prepare(`
        SELECT id FROM sorting_tasks
        WHERE preorder_id = ? AND status NOT IN ('delivered', 'cancelled')
      `).get(preorder.id);

      if (existingTask) continue;

      db.prepare(`
        INSERT INTO sorting_tasks (task_no, po_item_id, preorder_id, book_id, member_id, quantity)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(taskNo, po_item_id, preorder.id, poItem.book_id, preorder.member_id, preorder.quantity);

      generatedTasks.push(taskNo);
    }

    db.prepare('COMMIT').run();

    res.json({
      message: `成功生成 ${generatedTasks.length} 个分拣任务`,
      tasks: generatedTasks,
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/start', (req, res) => {
  try {
    const taskId = req.params.id;

    const task = db.prepare('SELECT * FROM sorting_tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: '分拣任务不存在' });
    }

    if (task.status !== 'pending') {
      return res.status(400).json({ error: '只能开始待处理的任务' });
    }

    db.prepare(`
      UPDATE sorting_tasks
      SET status = 'sorting', sorted_by = ?, sorted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, taskId);

    res.json({ message: '分拣任务已开始' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/complete', (req, res) => {
  try {
    const { shelf_location, note } = req.body;
    const taskId = req.params.id;

    const task = db.prepare('SELECT * FROM sorting_tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: '分拣任务不存在' });
    }

    if (!['sorting', 'pending'].includes(task.status)) {
      return res.status(400).json({ error: '任务状态不正确' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare(`
      UPDATE sorting_tasks
      SET status = 'sorted', shelf_location = ?, note = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(shelf_location, note, taskId);

    if (task.preorder_id) {
      db.prepare(`
        UPDATE preorders SET status = 'reserved', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(task.preorder_id);

      db.prepare(`
        UPDATE stock SET quantity_reserved = quantity_reserved + ?, updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
      `).run(task.quantity, task.book_id);
    }

    db.prepare('COMMIT').run();

    res.json({ message: '分拣完成，已为会员预留书籍' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/deliver', (req, res) => {
  try {
    const taskId = req.params.id;

    const task = db.prepare('SELECT * FROM sorting_tasks WHERE id = ?').get(taskId);
    if (!task) {
      return res.status(404).json({ error: '分拣任务不存在' });
    }

    if (task.status !== 'sorted') {
      return res.status(400).json({ error: '只能交付已分拣的任务' });
    }

    db.prepare('BEGIN TRANSACTION').run();

    db.prepare(`
      UPDATE sorting_tasks SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(taskId);

    if (task.preorder_id) {
      db.prepare(`
        UPDATE preorders SET status = 'picked', picked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(task.preorder_id);

      db.prepare(`
        UPDATE stock SET quantity_reserved = quantity_reserved - ?, updated_at = CURRENT_TIMESTAMP
        WHERE book_id = ?
      `).run(task.quantity, task.book_id);
    }

    db.prepare('COMMIT').run();

    res.json({ message: '书籍已交付给会员' });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM sorting_tasks WHERE id = ?').get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '分拣任务不存在' });
    }

    if (task.status === 'delivered') {
      return res.status(400).json({ error: '已交付的任务不能删除' });
    }

    db.prepare('DELETE FROM sorting_tasks WHERE id = ?').run(req.params.id);
    res.json({ message: '分拣任务删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
