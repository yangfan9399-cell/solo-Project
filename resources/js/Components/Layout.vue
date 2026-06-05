<template>
    <div class="min-h-screen bg-gray-100">
        <nav class="bg-white border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <span class="text-xl font-bold text-green-600">农产品检测系统</span>
                        </div>
                        <div class="hidden space-x-8 sm:-my-px sm:ml-10 sm:flex">
                            <Link :href="route('dashboard')" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" :class="route().current('dashboard') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                                首页
                            </Link>
                            <Link :href="route('samples.index')" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" :class="route().current('samples.*') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                                样品管理
                            </Link>
                            <Link v-if="$page.props.auth.user.role === 'sampler' || $page.props.auth.user.role === 'inspector' || $page.props.auth.user.role === 'reviewer'" :href="route('inspections.index')" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" :class="route().current('inspections.*') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                                检测管理
                            </Link>
                            <Link v-if="$page.props.auth.user.role === 'reviewer'" :href="route('disposals.index')" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" :class="route().current('disposals.*') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                                处置管理
                            </Link>
                            <Link :href="route('reinspections.index')" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" :class="route().current('reinspections.*') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                                复检申请
                            </Link>
                            <Link :href="route('review.index')" class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium" :class="route().current('review.*') ? 'border-green-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
                                复盘查询
                            </Link>
                        </div>
                    </div>
                    <div class="hidden sm:flex sm:items-center sm:ml-6">
                        <div class="ml-3 relative">
                            <div class="flex items-center space-x-4">
                                <span class="text-sm text-gray-500">{{ $page.props.auth.user.name }}</span>
                                <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{{ $page.props.auth.user.role_name }}</span>
                                <form @submit.prevent="logout">
                                    <button type="submit" class="text-sm text-gray-500 hover:text-gray-700">退出</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <main class="py-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div v-if="$page.props.flash.success" class="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 px-4 rounded">
                    {{ $page.props.flash.success }}
                </div>
                <div v-if="$page.props.flash.error" class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 px-4 rounded">
                    {{ $page.props.flash.error }}
                </div>
                <slot />
            </div>
        </main>
    </div>
</template>

<script setup>
import { Link, router } from '@inertiajs/vue3';

const logout = () => {
    router.post(route('logout'));
};
</script>
