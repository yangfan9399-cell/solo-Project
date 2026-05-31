import { component$ } from '@builder.io/qwik';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Loading = component$<LoadingProps>(({ size = 'md', text = '加载中...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div class="flex flex-col items-center justify-center p-8">
      <div class={`${sizeClasses[size]} border-2 border-antique-200 border-t-antique-600 rounded-full spinner`} />
      {text && <p class="mt-3 text-gray-500">{text}</p>}
    </div>
  );
});

export const PageLoading = component$(() => (
  <div class="min-h-[400px] flex items-center justify-center">
    <Loading size="lg" />
  </div>
));
