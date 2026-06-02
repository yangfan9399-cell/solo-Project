import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const preorderStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM preorders
      GROUP BY status
    `).all();

    const memberStats = db.prepare(`
      SELECT level, COUNT(*) as count FROM members
      GROUP BY level
    `).all();

    const sortingStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM sorting_tasks
      WHERE DATE(created_at) >= DATE('now', '-7 days')
      GROUP BY status
    `).all();

    const exceptionStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM exceptions
      GROUP BY status
    `).all();

    const recentPreorders = db.prepare(`
      SELECT p.*, b.title, b.cover_image,
             m.name as member_name
      FROM preorders p
      JOIN books b ON p.book_id = b.id
      JOIN members m ON p.member_id = m.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all();

    const recentTransactions = db.prepare(`
      SELECT t.*, m.name as member_name
      FROM transactions t
      JOIN members m ON t.member_id = m.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();

    const todayTasks = db.prepare(`
      SELECT COUNT(*) as count FROM sorting_tasks
      WHERE DATE(created_at) = DATE('now')
    `).get();

    const pendingExceptions = db.prepare(`
      SELECT COUNT(*) as count FROM exceptions
      WHERE status IN ('open', 'processing')
    `).get();

    const totalMembers = db.prepare(`
      SELECT COUNT(*) as count FROM members
    `).get();

    const totalBooks = db.prepare(`
      SELECT COUNT(*) as count FROM books
    `).get();

    res.json({
      preorderStats,
      memberStats,
      sortingStats,
      exceptionStats,
      recentPreorders,
      recentTransactions,
      todayTasks: todayTasks.count,
      pendingExceptions: pendingExceptions.count,
      totalMembers: totalMembers.count,
      totalBooks: totalBooks.count,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
