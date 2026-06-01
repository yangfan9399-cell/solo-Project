import { cn } from '../utils/cn';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

export function Loading({ size = 'md', className, fullScreen }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 z-50">
        <div className={cn('loading-spinner', sizeClasses[size], className)} />
      </div>
    );
  }

  return <div className={cn('loading-spinner', sizeClasses[size], className)} />;
}

export function LoadingCard() {
  return (
    <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow">
      <Loading size="lg" />
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow">
      {Icon && <Icon className="w-12 h-12 mb-4 text-gray-400" />}
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow">
      <div className="w-12 h-12 mb-4 text-red-500">
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900">出错了</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          重试
        </button>
      )}
    </div>
  );
}
