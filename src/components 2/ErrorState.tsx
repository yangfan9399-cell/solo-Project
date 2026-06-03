interface Props {
  error: Error | string;
  onRetry?: () => void;
}

export default function ErrorState(props: Props) {
  const message = typeof props.error === "string" ? props.error : props.error.message;
  
  return (
    <div class="text-center py-12">
      <div class="text-6xl mb-4">❌</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">出错了</h3>
      <p class="text-red-500 mb-6 max-w-sm mx-auto">{message}</p>
      {props.onRetry && (
        <button onClick={props.onRetry} class="btn-primary">
          重试
        </button>
      )}
    </div>
  );
}
