import { createMiddleware } from 'hono/factory';
import { jwt, sign } from 'hono/jwt';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config.js';
import { get } from '../db.js';
import type { User, UserRole } from '../types.js';

export interface AuthContext {
  user: Omit<User, 'password'>;
}

export function authMiddleware() {
  return createMiddleware(async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: '未提供认证令牌' }, 401);
      }

      const token = authHeader.slice(7);
      const payload = await jwt({ secret: JWT_SECRET, alg: 'HS256' })(c, async () => {});
      
      const userId = (c.get('jwtPayload') as { sub: number }).sub;
      const user = await get<Omit<User, 'password'>>('SELECT id, username, name, role, department, phone, created_at FROM users WHERE id = ?', [userId]);

      if (!user) {
        return c.json({ success: false, error: '用户不存在' }, 401);
      }

      c.set('user', user);
      await next();
    } catch (error) {
      return c.json({ success: false, error: '认证失败' }, 401);
    }
  });
}

export function roleMiddleware(roles: UserRole[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get('user') as Omit<User, 'password'>;
    if (!user) {
      return c.json({ success: false, error: '未认证' }, 401);
    }

    if (!roles.includes(user.role)) {
      return c.json({ success: false, error: '权限不足' }, 403);
    }

    await next();
  });
}

export async function generateToken(userId: number) {
  return await sign({ sub: userId, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 }, JWT_SECRET, 'HS256');
}
