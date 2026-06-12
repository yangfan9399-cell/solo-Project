<template>
    <div class="min-h-screen flex">
        <aside class="w-60 bg-slate-900 text-white flex flex-col">
            <div class="p-5 border-b border-slate-700">
                <h1 class="text-lg font-bold">机务工具管理</h1>
                <p class="text-xs text-slate-400 mt-1">借还清点与遗失追责平台</p>
            </div>
            <nav class="flex-1 p-3 space-y-1">
                <Link
                    v-for="item in navItems"
                    :key="item.href"
                    :href="item.href"
                    class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition"
                    :class="isActive(item.href) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
                >
                    <span>{{ item.icon }}</span>
                    <span>{{ item.label }}</span>
                </Link>
            </nav>
            <div class="p-4 border-t border-slate-700">
                <div class="text-sm font-medium">{{ $page.props.auth?.user?.name || '访客' }}</div>
                <div class="text-xs text-slate-400">{{ roleLabel }}</div>
                <div class="flex gap-2 mt-3">
                    <Link :href="route('switch-role')" class="text-xs text-blue-400 hover:text-blue-300">切换身份</Link>
                </div>
            </div>
        </aside>
        <main class="flex-1 flex flex-col">
            <header class="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h2 class="text-xl font-semibold text-slate-800">{{ title }}</h2>
                    <p v-if="subtitle" class="text-sm text-slate-500 mt-0.5">{{ subtitle }}</p>
                </div>
                <div class="flex items-center gap-3">
                    <slot name="actions"></slot>
                </div>
            </header>
            <div class="flex-1 p-6 overflow-auto">
                <slot></slot>
            </div>
        </main>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

const page = usePage();
defineProps({
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
});

const navItems = [
    { href: route('dashboard'), label: '看板统计', icon: '📊' },
    { href: route('cases.index'), label: '案件列表', icon: '📋' },
];

const roleLabel = computed(() => {
    const role = page.props.auth?.user?.role;
    if (role === 'approver') return '审批负责人';
    if (role === 'clerk') return '业务专员';
    return '';
});

function isActive(href) {
    return page.url.startsWith(href.replace('/dashboard', '/').replace(/\/$/, '') || '/') ||
           (href === route('dashboard') && page.url === '/') ||
           (href === route('dashboard') && page.url === '/dashboard');
}
</script>
