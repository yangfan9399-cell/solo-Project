import { component$, Slot } from '@builder.io/qwik';

interface TableProps {
  columns: string[];
}

export const DataTable = component$<TableProps>(({ columns }) => {
  return (
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <Slot />
        </tbody>
      </table>
    </div>
  );
});

export const EmptyState = component$<{ message: string; description?: string }>(
  ({ message, description }) => (
    <div class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">{message}</h3>
      {description && <p class="mt-1 text-sm text-gray-500">{description}</p>}
    </div>
  )
);

export const LoadingState = component$(() => (
  <div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    <span class="ml-3 text-gray-500">加载中...</span>
  </div>
));

export const ErrorState = component$<{ message: string; onRetry?: () => void }>(
  ({ message, onRetry }) => (
    <div class="text-center py-12">
      <div class="mx-auto h-12 w-12 text-red-400 flex items-center justify-center">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 class="mt-2 text-sm font-medium text-gray-900">加载失败</h3>
      <p class="mt-1 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick$={onRetry}
          class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          重试
        </button>
      )}
    </div>
  )
);
