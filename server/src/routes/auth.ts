import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { get } from '../db.js';
import { generateToken, authMiddleware, type AuthContext } from '../middleware/auth.js';
import type { User } from '../types.js';

const authRoutes = new Hono<{ Variables: AuthContext }>();

const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空'),
});

authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const validated = loginSchema.parse(body);

    const user = await get<User>('SELECT * FROM users WHERE username = ?', [validated.username]);

    if (!user) {
      return c.json({ success: false, error: '用户名或密码错误' }, 401);
    }

    const isValid = await bcrypt.compare(validated.password, user.password);
    if (!isValid) {
      return c.json({ success: false, error: '用户名或密码错误' }, 401);
    }

    const token = await generateToken(user.id);
    const { password, ...userWithoutPassword } = user;

    return c.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: '登录成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '登录失败' }, 500);
  }
});

authRoutes.get('/me', authMiddleware(), async (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    data: user,
  });
});

authRoutes.post('/logout', authMiddleware(), async (c) => {
  return c.json({
    success: true,
    message: '登出成功',
  });
});

export default authRoutes;
