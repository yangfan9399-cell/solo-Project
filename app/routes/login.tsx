import { useState } from 'react';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { createUserSession, getUserFromSession, verifyPassword } from '~/utils/session.server';

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUserFromSession(request);
  if (user) return redirect('/');
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return json({ error: '请输入用户名和密码' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return json({ error: '用户名或密码错误' }, { status: 400 });
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return json({ error: '用户名或密码错误' }, { status: 400 });
  }

  return createUserSession(user.id, '/');
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isLoading = navigation.state === 'submitting';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔥</div>
          <h1 className="text-2xl font-bold text-gray-800">消防隐患巡检系统</h1>
          <p className="text-gray-500 mt-2">请登录您的账户</p>
        </div>

        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="请输入用户名"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="请输入密码"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '登录中...' : '登 录'}
          </button>
        </Form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 font-medium mb-2">测试账号：</p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>巡检员: inspector / 123456</p>
            <p>物业经办人: property / 123456</p>
            <p>消防复核人: fire / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
