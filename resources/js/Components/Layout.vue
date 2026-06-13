<template>
    <div class="min-h-screen bg-gray-50">
        <nav class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 flex items-center">
                            <svg class="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span class="ml-2 text-xl font-bold text-gray-800">奖学金评审系统</span>
                        </div>
                        <div class="hidden md:ml-10 md:flex md:space-x-8">
                            <router-link 
                                :href="route('review.index')" 
                                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                                :class="currentPage === 'review' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                            >
                                <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                评审记录
                            </router-link>
                            <router-link 
                                :href="route('dashboard.index')" 
                                class="inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors"
                                :class="currentPage === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                            >
                                <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                统计复盘
                            </router-link>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <div class="flex items-center space-x-4">
                            <div v-if="auth?.user" class="text-right">
                                <div class="text-sm font-medium text-gray-700">{{ auth.user.name }}</div>
                                <div class="text-xs text-gray-500">{{ auth.user.role_name }}</div>
                            </div>
                            <form method="POST" :action="route('logout')" class="ml-4">
                                <input type="hidden" name="_token" :value="csrfToken">
                                <button type="submit" class="btn-secondary text-sm">
                                    退出
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <FlashMessage v-if="flash?.success || flash?.error" :flash="flash" />

        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <slot />
        </main>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import FlashMessage from './FlashMessage.vue';

const page = usePage();
const auth = computed(() => page.props.auth);
const flash = computed(() => page.props.flash);
const csrfToken = computed(() => document.querySelector('meta[name="csrf-token"]')?.content || '');

defineProps({
    currentPage: {
        type: String,
        default: 'review'
    }
});
</script>
