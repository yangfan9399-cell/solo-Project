import { component$ } from '@builder.io/qwik';

interface EmptyProps {
  icon?: string;
  title: string;
  description?: string;
}

export const Empty = component$<EmptyProps>(({ icon = '📭', title, description }) => (
  <div class="flex flex-col items-center justify-center p-12 text-center">
    <span class="text-5xl mb-4">{icon}</span>
    <h3 class="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    {description && (
      <p class="text-gray-500">{description}</p>
    )}
  </div>
));

interface ErrorProps {
  message: string;
  onRetry$?: () => void;
}

export const ErrorState = component$<ErrorProps>(({ message, onRetry$ }) => (
  <div class="flex flex-col items-center justify-center p-12 text-center">
    <span class="text-5xl mb-4">⚠️</span>
    <h3 class="text-lg font-medium text-red-600 mb-2">出错了</h3>
    <p class="text-gray-500 mb-4">{message}</p>
    {onRetry$ && (
      <button onClick$={onRetry$} class="btn btn-primary">
        重试
      </button>
    )}
  </div>
));
