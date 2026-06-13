<template>
    <div v-if="pagination.total > 0" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
                <p class="text-sm text-gray-700">
                    显示第 <span class="font-medium">{{ startIndex }}</span> 到 
                    <span class="font-medium">{{ endIndex }}</span> 条，
                    共 <span class="font-medium">{{ pagination.total }}</span> 条
                </p>
            </div>
            <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                        @click="changePage(pagination.current_page - 1)"
                        :disabled="pagination.current_page <= 1"
                        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span class="sr-only">上一页</span>
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        v-for="page in visiblePages"
                        :key="page"
                        @click="changePage(page)"
                        class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                        :class="page === pagination.current_page 
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                    >
                        {{ page }}
                    </button>

                    <button
                        @click="changePage(pagination.current_page + 1)"
                        :disabled="pagination.current_page >= pagination.last_page"
                        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span class="sr-only">下一页</span>
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </nav>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    pagination: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['page-change']);

const startIndex = computed(() => {
    return (props.pagination.current_page - 1) * props.pagination.per_page + 1;
});

const endIndex = computed(() => {
    const end = props.pagination.current_page * props.pagination.per_page;
    return Math.min(end, props.pagination.total);
});

const visiblePages = computed(() => {
    const current = props.pagination.current_page;
    const last = props.pagination.last_page;
    const delta = 2;
    const pages = [];

    for (let i = Math.max(1, current - delta); i <= Math.min(last, current + delta); i++) {
        pages.push(i);
    }

    return pages;
});

const changePage = (page) => {
    if (page >= 1 && page <= props.pagination.last_page) {
        emit('page-change', page);
    }
};
</script>
