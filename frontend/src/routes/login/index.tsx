import { component$, useContext, useStore, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { Layout } from '~/components/layout/layout';
import { Loading } from '~/components/ui/loading';
import { AppStore } from '~/constants';
import { fetchApi } from '~/utils/api';
import type { User } from '~/types';

export default component$(() => {
  const store = useContext(AppStore);
  const nav = useNavigate();
  const form = useStore({
    username: '',
    password: '',
    error: '',
  });

  const handleLogin = $(async () => {
    if (!form.username || !form.password) {
      form.error = '请输入用户名和密码';
      return;
    }

    try {
      store.isLoading = true;
      form.error = '';
      
      const response = await fetchApi<{ user: User; token: string }>('/login', {
        method: 'POST',
        body: JSON.stringify({ username: form.username, password: form.password }),
      });

      store.currentUser = response.user;
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      nav('/');
    } catch (e) {
      form.error = '用户名或密码错误';
    } finally {
      store.isLoading = false;
    }
  });

  return (
    <Layout>
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-antique-50 to-antique-100 p-4">
        <div class="card w-full max-w-md">
          <div class="text-center mb-8">
            <div class="text-5xl mb-4">📜</div>
            <h1 class="text-2xl font-bold text-antique-900">古籍修复馆</h1>
            <p class="text-gray-500 mt-2">纸张病害诊断与修复排程系统</p>
          </div>

          {form.error && (
            <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {form.error}
            </div>
          )}

          <div class="space-y-4">
            <div>
              <label class="label">用户名</label>
              <input
                type="text"
                class="input"
                placeholder="请输入用户名"
                value={form.username}
                onInput$={(_, el) => (form.username = el.value)}
                onKeyDown$={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label class="label">密码</label>
              <input
                type="password"
                class="input"
                placeholder="请输入密码"
                value={form.password}
                onInput$={(_, el) => (form.password = el.value)}
                onKeyDown$={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <button
              class="btn btn-primary w-full"
              onClick$={handleLogin}
              disabled={store.isLoading}
            >
              {store.isLoading ? <Loading size="sm" /> : '登录'}
            </button>
          </div>

          <div class="mt-6 pt-6 border-t text-sm text-gray-500">
            <p class="mb-2 font-medium">测试账号：</p>
            <ul class="space-y-1 text-xs">
              <li>修复师：zhanggxf / 123456</li>
              <li>管理员：wanggly / 123456</li>
              <li>专家：chenzj / 123456</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
});
