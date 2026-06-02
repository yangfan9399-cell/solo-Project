import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, category, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    const books = db.prepare(`
      SELECT b.*, 
             COALESCE(s.quantity_available, 0) as quantity_available,
             COALESCE(s.quantity_reserved, 0) as quantity_reserved,
             s.location
      FROM books b
      LEFT JOIN stock s ON b.id = s.book_id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, pageSize, offset);

    const total = db.prepare(`SELECT COUNT(*) as count FROM books ${whereClause}`).get(...params);

    const categories = db.prepare(`
      SELECT DISTINCT category FROM books WHERE category IS NOT NULL
    `).all().map(c => c.category);

    res.json({
      data: books,
      categories,
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
    const book = db.prepare(`
      SELECT b.*, 
             COALESCE(s.quantity_available, 0) as quantity_available,
             COALESCE(s.quantity_reserved, 0) as quantity_reserved,
             s.location
      FROM books b
      LEFT JOIN stock s ON b.id = s.book_id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!book) {
      return res.status(404).json({ error: '图书不存在' });
    }

    const preorders = db.prepare(`
      SELECT p.*, m.name as member_name, m.phone as member_phone
      FROM preorders p
      JOIN members m ON p.member_id = m.id
      WHERE p.book_id = ? AND p.status NOT IN ('picked', 'cancelled', 'refunded', 'expired')
      ORDER BY p.created_at DESC
    `).all(req.params.id);

    book.preorders = preorders;

    res.json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { isbn, title, author, publisher, publish_date, category, cover_image, description, price, preorder_price, deposit_amount, status } = req.body;

    const result = db.prepare(`
      INSERT INTO books (isbn, title, author, publisher, publish_date, category, cover_image, description, price, preorder_price, deposit_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(isbn, title, author, publisher, publish_date, category, cover_image, description, price, preorder_price, deposit_amount, status || 'active');

    res.status(201).json({
      id: result.lastInsertRowid,
      message: '图书创建成功',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { isbn, title, author, publisher, publish_date, category, cover_image, description, price, preorder_price, deposit_amount, status } = req.body;

    db.prepare(`
      UPDATE books SET
        isbn = ?, title = ?, author = ?, publisher = ?, publish_date = ?,
        category = ?, cover_image = ?, description = ?, price = ?, preorder_price = ?,
        deposit_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(isbn, title, author, publisher, publish_date, category, cover_image, description, price, preorder_price, deposit_amount, status, req.params.id);

    res.json({ message: '图书更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const hasPreorders = db.prepare(`
      SELECT COUNT(*) as count FROM preorders WHERE book_id = ? AND status NOT IN ('cancelled', 'refunded')
    `).get(req.params.id);

    if (hasPreorders.count > 0) {
      return res.status(400).json({ error: '该图书存在有效预售订单，无法删除' });
    }

    db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    res.json({ message: '图书删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
