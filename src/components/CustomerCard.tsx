import { component$ } from '@builder.io/qwik';
import type { Customer } from '~/types/game';

interface CustomerCardProps {
  customer: Customer;
}

const personalityLabels: Record<string, string> = {
  casual: '随缘型',
  serious: '认真型',
  collector: '收藏家',
  bargain_hunter: '砍价高手',
};

export const CustomerCard = component$<CustomerCardProps>(({ customer }) => {
  return (
    <div class="bg-white rounded-xl shadow-lg p-4 border-2 border-amber-200">
      <div class="flex items-center gap-4">
        <div class="text-5xl">{customer.avatar}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-xl font-bold text-book-brown">{customer.name}</h3>
            <span class="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              {personalityLabels[customer.personality]}
            </span>
          </div>
          <div class="mt-2 space-y-1">
            <p class="text-sm text-gray-600">
              <span class="font-medium">预算范围:</span> ¥{customer.budgetRange[0]} - ¥{customer.budgetRange[1]}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">偏好类型:</span> {customer.preferences.join('、')}
            </p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">价格容忍度:</span> ±{(customer.tolerance * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
