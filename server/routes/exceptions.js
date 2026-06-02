import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { generateNo } from '../utils/generateNo.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, type, priority } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND e.status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND e.type = ?';
      params.push(type);
    }
    if (priority) {
      whereClause += ' AND e.priority = ?';
      params.push(priority);
    }

    const exceptions = db.prepare(`
      SELECT e.*, b.title, b.cover_image,
             m.name as member_name,
             ur.name as reported_by_name,
             uh.name as handled_by_name
      FROM exceptions e
      LEFT JOIN books b ON e.book_id = b.id
      LEFT JOIN members m ON e.member_id = m.id
      LEFT JOIN users ur ON e.reported_by = ur.id
      LEFT JOIN users uh ON e.handled_by = uh.id
      ${whereClause}
      ORDER BY
        CASE e.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low' THEN 4
        END,
        e.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM exceptions e ${whereClause}`).get(...params);

    const stats = db.prepare(`
      SELECT status, COUNT(*) as count FROM exceptions
      GROUP BY status
    `).all();

    res.json({
      data: exceptions,
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
    const exception = db.prepare(`
      SELECT e.*, b.title, b.isbn, b.cover_image,
             m.name as member_name, m.phone as member_phone,
             ur.name as reported_by_name,
             uh.name as handled_by_name
      FROM exceptions e
      LEFT JOIN books b ON e.book_id = b.id
      LEFT JOIN members m ON e.member_id = m.id
      LEFT JOIN users ur ON e.reported_by = ur.id
      LEFT JOIN users uh ON e.handled_by = uh.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!exception) {
      return res.status(404).json({ error: '异常记录不存在' });
    }

    res.json(exception);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { type, preorder_id, po_item_id, book_id, member_id, description, priority } = req.body;

    const exceptionNo = generateNo('EX');

    const result = db.prepare(`
      INSERT INTO exceptions (exception_no, type, preorder_id, po_item_id, book_id, member_id, description, priority, reported_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(exceptionNo, type, preorder_id, po_item_id, book_id, member_id, description, priority || 'normal', req.user.id);

    res.status(201).json({
      id: result.lastInsertRowid,
      exception_no: exceptionNo,
      message: '异常记录创建成功',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { type, description, status, priority, resolution } = req.body;

    db.prepare(`
      UPDATE exceptions SET
        type = ?, description = ?, status = ?, priority = ?, resolution = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(type, description, status, priority, resolution, req.params.id);

    res.json({ message: '异常记录更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/handle', (req, res) => {
  try {
    const { resolution } = req.body;

    db.prepare(`
      UPDATE exceptions SET
        status = 'processing', handled_by = ?, resolution = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user.id, resolution, req.params.id);

    res.json({ message: '开始处理异常' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/resolve', (req, res) => {
  try {
    const { resolution } = req.body;

    db.prepare(`
      UPDATE exceptions SET
        status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resolution, req.params.id);

    res.json({ message: '异常已解决' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/close', (req, res) => {
  try {
    const { resolution } = req.body;

    db.prepare(`
      UPDATE exceptions SET
        status = 'closed', resolution = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resolution, req.params.id);

    res.json({ message: '异常已关闭' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM exceptions WHERE id = ?').run(req.params.id);
    res.json({ message: '异常记录删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
