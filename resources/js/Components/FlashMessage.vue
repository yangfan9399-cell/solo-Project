<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div v-if="flash.success" class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <svg class="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span class="text-green-700">{{ flash.success }}</span>
        </div>
        <div v-if="flash.error" class="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <svg class="w-5 h-5 text-red-400 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span class="text-red-700">{{ flash.error }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    flash: {
        type: Object,
        required: true
    }
});
</script>
