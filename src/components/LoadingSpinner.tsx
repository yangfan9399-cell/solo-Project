interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({ text = '加载中...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="mt-4 text-sm text-gray-500">{text}</p>
    </div>
  );
}
