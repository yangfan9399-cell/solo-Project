import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import type { User, UserRole } from '../types.js';

const userRoutes = new Hono<{ Variables: AuthContext }>();

userRoutes.use('*', authMiddleware());

const createUserSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(6, '密码至少6位'),
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('请输入有效的邮箱').optional().or(z.literal('')),
  role: z.enum(['reporter', 'admin', 'producer']),
  department: z.string().optional(),
  phone: z.string().optional(),
});

userRoutes.get('/', roleMiddleware(['admin']), async (c) => {
  const { role, keyword } = c.req.query();

  let query = 'SELECT id, username, name, email, role, department, phone, status, created_at FROM users WHERE 1=1';
  const params: (string | number)[] = [];

  if (role) {
    query += ' AND role = ?';
    params.push(role);
  }

  if (keyword) {
    query += ' AND (name LIKE ? OR username LIKE ? OR email LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }

  query += ' ORDER BY created_at DESC';

  const users = await all(query, params);
  return c.json({ success: true, data: users });
});

userRoutes.get('/:id', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const user = await get('SELECT id, username, name, email, role, department, phone, status, created_at FROM users WHERE id = ?', [id]);

  if (!user) {
    return c.json({ success: false, error: '用户不存在' }, 404);
  }

  return c.json({ success: true, data: user });
});

userRoutes.post('/', roleMiddleware(['admin']), async (c) => {
  try {
    const body = await c.req.json();
    const validated = createUserSchema.parse(body);

    const existing = await get('SELECT id FROM users WHERE username = ?', [validated.username]);
    if (existing) {
      return c.json({ success: false, error: '用户名已存在' }, 400);
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);

    const sql = `
      INSERT INTO users (username, password, name, email, role, department, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      validated.username,
      hashedPassword,
      validated.name,
      validated.email || '',
      validated.role,
      validated.department || '',
      validated.phone || ''
    ]);

    const user = await get('SELECT id, username, name, email, role, department, phone, status, created_at FROM users WHERE id = ?', [result.lastID]);
    return c.json({ success: true, data: user, message: '用户创建成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '创建用户失败' }, 500);
  }
});

userRoutes.put('/:id', roleMiddleware(['admin']), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const existing = await get<User>('SELECT * FROM users WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '用户不存在' }, 404);
    }

    const body = await c.req.json();
    const { password, ...rest } = body;

    const schema = createUserSchema.partial().omit({ password: true }).extend({
      password: z.string().min(6).optional(),
    });
    const validated = schema.parse(rest);

    if (validated.username && validated.username !== existing.username) {
      const usernameExists = await get('SELECT id FROM users WHERE username = ? AND id != ?', [validated.username, id]);
      if (usernameExists) {
        return c.json({ success: false, error: '用户名已存在' }, 400);
      }
    }

    let hashedPassword: string | undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const sql = `
      UPDATE users
      SET username = COALESCE(?, username),
          password = COALESCE(?, password),
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          role = COALESCE(?, role),
          department = COALESCE(?, department),
          phone = COALESCE(?, phone)
      WHERE id = ?
    `;

    await run(sql, [
      validated.username || null,
      hashedPassword || null,
      validated.name || null,
      validated.email || null,
      validated.role || null,
      validated.department || null,
      validated.phone || null,
      id
    ]);

    const user = await get('SELECT id, username, name, email, role, department, phone, status, created_at FROM users WHERE id = ?', [id]);
    return c.json({ success: true, data: user, message: '用户更新成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '更新用户失败' }, 500);
  }
});

userRoutes.delete('/:id', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get('SELECT * FROM users WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '用户不存在' }, 404);
  }

  const hasTasks = await get<{ count: number }>('SELECT COUNT(*) as count FROM shooting_tasks WHERE reporter_id = ? OR producer_id = ?', [id, id]);
  if (hasTasks && hasTasks.count > 0) {
    return c.json({ success: false, error: '该用户有关联的任务，无法删除' }, 400);
  }

  const hasReservations = await get<{ count: number }>('SELECT COUNT(*) as count FROM reservations WHERE requester_id = ? OR approver_id = ? OR pickup_handler_id = ? OR return_handler_id = ?', [id, id, id, id]);
  if (hasReservations && hasReservations.count > 0) {
    return c.json({ success: false, error: '该用户有关联的预约，无法删除' }, 400);
  }

  const hasDamageReports = await get<{ count: number }>('SELECT COUNT(*) as count FROM damage_reports WHERE reporter_id = ? OR handler_id = ?', [id, id]);
  if (hasDamageReports && hasDamageReports.count > 0) {
    return c.json({ success: false, error: '该用户有关联的损坏登记，无法删除' }, 400);
  }

  await run('DELETE FROM users WHERE id = ?', [id]);
  return c.json({ success: true, message: '用户删除成功' });
});

userRoutes.post('/:id/toggle-status', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get<User>('SELECT * FROM users WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '用户不存在' }, 404);
  }

  if (existing.role === 'admin' && existing.status === 'active') {
    return c.json({ success: false, error: '不能禁用管理员账户' }, 400);
  }

  const newStatus = existing.status === 'active' ? 'inactive' : 'active';
  
  await run('UPDATE users SET status = ? WHERE id = ?', [newStatus, id]);

  const user = await get('SELECT id, username, name, email, role, department, phone, status, created_at FROM users WHERE id = ?', [id]);
  return c.json({ success: true, data: user, message: `用户已${newStatus === 'active' ? '启用' : '禁用'}` });
});

userRoutes.get('/by-role/:role', roleMiddleware(['admin', 'producer']), async (c) => {
  const role = c.req.param('role') as UserRole;

  if (!['reporter', 'admin', 'producer'].includes(role)) {
    return c.json({ success: false, error: '无效的角色' }, 400);
  }

  const users = await all("SELECT id, name, role, department FROM users WHERE role = ? AND status = 'active' ORDER BY name", [role]);
  return c.json({ success: true, data: users });
});

export default userRoutes;
