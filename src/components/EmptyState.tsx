interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: string;
}

export default function EmptyState({ title, description, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500 max-w-md">{description}</p>}
    </div>
  );
}
