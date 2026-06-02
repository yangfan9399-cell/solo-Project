export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">出错了</h3>
      <p className="text-gray-500 mb-4">{message || '加载数据时发生错误'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          重试
        </button>
      )}
    </div>
  );
}
