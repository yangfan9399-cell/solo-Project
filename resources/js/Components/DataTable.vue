<template>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th v-for="(column, index) in columns" :key="index" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {{ column.label }}
                    </th>
                    <th v-if="actions" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                    </th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, rowIndex) in data" :key="rowIndex" class="hover:bg-gray-50 transition-colors cursor-pointer" @click="$emit('row-click', row)">
                    <td v-for="(column, colIndex) in columns" :key="colIndex" class="px-6 py-4 whitespace-nowrap">
                        <slot :name="`cell-${column.key}`" :row="row" :column="column">
                            <div v-if="column.key && row[column.key] !== undefined">
                                <component 
                                    v-if="column.component" 
                                    :is="column.component" 
                                    v-bind="getComponentProps(row, column)"
                                />
                                <span v-else>{{ row[column.key] }}</span>
                            </div>
                        </slot>
                    </td>
                    <td v-if="actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <slot name="actions" :row="row" />
                    </td>
                </tr>
                <tr v-if="!data || data.length === 0">
                    <td :colspan="columns.length + (actions ? 1 : 0)" class="px-6 py-12 text-center text-gray-500">
                        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p class="mt-2">暂无数据</p>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup>
const props = defineProps({
    columns: {
        type: Array,
        required: true
    },
    data: {
        type: Array,
        default: () => []
    },
    actions: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['row-click']);

const getComponentProps = (row, column) => {
    if (typeof column.props === 'function') {
        return column.props(row);
    }
    return column.props || {};
};
</script>
