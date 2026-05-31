import { component$, Slot } from '@builder.io/qwik';

interface CardProps {
  title?: string;
  subtitle?: string;
  class?: string;
}

export const Card = component$<CardProps>(({ title, subtitle, class: className }) => {
  return (
    <div class={`bg-white rounded-xl shadow-sm border border-gray-200 ${className || ''}`}>
      {(title || subtitle) && (
        <div class="px-6 py-4 border-b border-gray-100">
          {title && <h3 class="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p class="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div class="p-6">
        <Slot />
      </div>
    </div>
  );
});

export const StatCard = component$<{
  title: string;
  value: number | string;
  icon?: any;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}>(({ title, value, icon: Icon, trend, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">{title}</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        {Icon && (
          <div class={`p-3 rounded-lg ${colors[color]}`}>
            <Icon class="w-6 h-6" />
          </div>
        )}
      </div>
      {trend && (
        <div class={`mt-4 text-sm ${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-500'}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} 较昨日
        </div>
      )}
    </div>
  );
});
