<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { recordStore } from '$lib/stores/recordStore';
  import { getRoleLabel } from '$lib/utils/format';

  let users: Array<{ id: string; name: string; role: string; employeeId: string }> = [];
  let selectedUserId = '';

  onMount(async () => {
    try {
      const res = await fetch('/api/users');
      users = await res.json();
      if (users.length > 0) {
        selectedUserId = users[0].id;
        selectUser(users[0]);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
    recordStore.fetchRecords();
  });

  function selectUser(user: { id: string; name: string; role: string; employeeId: string }) {
    recordStore.setCurrentUser(user);
  }

  $: currentUser = $recordStore.currentUser;

  const navItems = [
    { path: '/', label: '记录列表', icon: '📋' },
    { path: '/process', label: '处理台', icon: '🔧' },
    { path: '/review', label: '复核台', icon: '✅' },
    { path: '/dashboard', label: '复盘看板', icon: '📊' }
  ];
</script>

<div class="min-h-screen bg-gray-50">
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">🏟️</span>
          <h1 class="text-xl font-bold text-gray-900">体育场馆赛事器材布置验收与赛后回收系统</h1>
        </div>

        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <label class="text-sm text-gray-500">当前用户：</label>
            <select
              bind:value={selectedUserId}
              on:change={() => {
                const user = users.find(u => u.id === selectedUserId);
                if (user) selectUser(user);
              }}
              class="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {#each users as user}
                <option value={user.id}>{user.name} ({getRoleLabel(user.role)})</option>
              {/each}
            </select>
          </div>

          {#if currentUser}
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {currentUser.name}
              </span>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </header>

  <nav class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex space-x-1">
        {#each navItems as item}
          <a
            href={item.path}
            class="px-4 py-3 text-sm font-medium border-b-2 transition-colors {
              $page.url.pathname === item.path
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }"
          >
            <span class="mr-2">{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    {#if $recordStore.loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-500">加载中...</span>
      </div>
    {:else if $recordStore.error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
        错误：{$recordStore.error}
      </div>
    {:else}
      <slot />
    {/if}
  </main>

  <footer class="bg-white border-t border-gray-200 mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <p class="text-center text-sm text-gray-500">
        © 2026 体育场馆赛事器材管理系统 · 数据同步 · 流程可追溯
      </p>
    </div>
  </footer>
</div>
