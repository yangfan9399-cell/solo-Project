import { component$ } from '@builder.io/qwik';

interface ClueCardProps {
  type: 'condition' | 'history' | 'result';
  title: string;
  description: string;
  icon: string;
  highlighted?: boolean;
  value?: string;
  hasBonus?: boolean;
}

export const ClueCard = component$<ClueCardProps>(({ 
  type, 
  title, 
  description, 
  icon, 
  highlighted = false,
  value,
  hasBonus = false
}) => {
  const typeStyles: Record<string, string> = {
    condition: 'border-green-600 bg-green-50',
    history: 'border-blue-600 bg-blue-50',
    result: 'border-amber-600 bg-amber-50',
  };
  
  const typeIcons: Record<string, string> = {
    condition: '📖',
    history: '🔖',
    result: '⭐',
  };
  
  return (
    <div class={`p-4 rounded-lg border-2 ${typeStyles[type]} ${highlighted ? 'ring-2 ring-yellow-400' : ''}`}>
      <div class="flex items-start gap-3">
        <span class="text-2xl">{icon || typeIcons[type]}</span>
        <div class="flex-1">
          <h4 class="font-bold text-book-sepia flex items-center gap-2">
            {title}
            {hasBonus && <span class="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded">有加成</span>}
          </h4>
          <p class="text-sm text-gray-700 mt-1">{description}</p>
          {value && (
            <p class="text-sm font-bold text-book-brown mt-2">
              估值系数: <span class="text-xl">{value}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
