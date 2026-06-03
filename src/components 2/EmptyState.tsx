interface Props {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState(props: Props) {
  return (
    <div class="text-center py-12">
      <div class="text-6xl mb-4">{props.icon || "📭"}</div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">{props.title}</h3>
      {props.description && (
        <p class="text-gray-500 mb-6 max-w-sm mx-auto">{props.description}</p>
      )}
      {props.action && (
        <button onClick={props.action.onClick} class="btn-primary">
          {props.action.label}
        </button>
      )}
    </div>
  );
}
