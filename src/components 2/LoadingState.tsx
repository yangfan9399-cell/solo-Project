interface Props {
  message?: string;
}

export default function LoadingState(props: Props) {
  return (
    <div class="flex flex-col items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
      <p class="text-gray-500">{props.message || "加载中..."}</p>
    </div>
  );
}
