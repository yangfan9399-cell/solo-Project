<template>
    <div class="mb-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
        <div class="flex">
            <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.339 2.721-1.339 3.486 0l6.75 11.779c.767 1.34-.192 2.998-1.743 2.998H3.243c-1.551 0-2.51-1.659-1.743-2.998l6.75-11.779zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
            </div>
            <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">样品编号冲突</h3>
                <div class="mt-2 text-sm text-red-700">
                    <p>{{ conflictNote }}</p>
                    <p v-if="conflictSample" class="mt-1">
                        冲突来源: 
                        <Link :href="route('samples.show', conflictSample.id)" class="underline">
                            {{ conflictSample.sample_number }} - {{ conflictSample.product_name }}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    </div>
    </template>

<script setup>
import { Link } from '@inertiajs/vue3';

defineProps({
    conflictNote: {
        type: String,
        required: true,
    },
    conflictSample: {
        type: Object,
        default: null,
    },
});
</script>
