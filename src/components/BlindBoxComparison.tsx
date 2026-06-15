import { component$ } from '@builder.io/qwik';
import type { RoundSummary } from '~/types/game';

interface BlindBoxComparisonProps {
  summary: RoundSummary;
}

const rarityMultiplierMap: Record<string, number> = {
  common: 1.0,
  uncommon: 1.3,
  rare: 1.8,
  first_edition: 2.5,
  out_of_print: 3.0,
};

export const BlindBoxComparison = component$<BlindBoxComparisonProps>(({ summary }) => {
  const { blindBoxBefore, blindBoxAfter, playerPrice, actualValue, profit, scoreGained } = summary;
  
  return (
    <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
      <h3 class="text-lg font-bold text-book-brown mb-4">📦 盲盒组合价值对比</h3>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-gray-50 rounded-lg p-4">
          <h4 class="font-bold text-gray-600 mb-3 flex items-center gap-2">
            <span>📋</span> 组合前（基础价值）
          </h4>
          <div class="space-y-3">
            {blindBoxBefore.books.map((book, i) => (
              <div key={book.id} class="bg-white p-3 rounded border border-gray-200">
                <p class="font-medium text-sm">{book.title}</p>
                <div class="flex justify-between text-xs mt-1">
                  <span class="text-gray-500">基础价格: ¥{book.basePrice}</span>
                  <span class="text-gray-700">书况: {book.condition}</span>
                </div>
              </div>
            ))}
            <div class="pt-3 border-t-2 border-gray-300">
              <div class="flex justify-between">
                <span class="font-bold">总基础价格:</span>
                <span class="font-bold text-lg">¥{blindBoxBefore.totalBasePrice.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-sm text-gray-500">
                <span>进货成本 (60%):</span>
                <span>¥{(blindBoxBefore.totalBasePrice * 0.6).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-green-50 rounded-lg p-4">
          <h4 class="font-bold text-green-700 mb-3 flex items-center gap-2">
            <span>✨</span> 组合后（实际价值）
          </h4>
          <div class="space-y-3">
            {blindBoxAfter.books.map((book, i) => {
              const beforeBook = blindBoxBefore.books[i];
              const diff = book.actualValue - beforeBook.basePrice;
              const diffPercent = ((book.actualValue - beforeBook.basePrice) / beforeBook.basePrice) * 100;
              
              return (
                <div key={book.id} class="bg-white p-3 rounded border border-green-200">
                  <p class="font-medium text-sm">{book.title}</p>
                  <div class="flex justify-between text-xs mt-1">
                    <span class="text-gray-500">
                      调整后: ¥{book.actualValue.toFixed(2)}
                    </span>
                    <span class={diff > 0 ? 'text-green-600' : 'text-red-600'}>
                      {diff > 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div class="text-xs text-gray-400 mt-1">
                    {book.hasSeal && <span class="mr-2">🔖藏书章</span>}
                    {book.hasInscription && <span class="mr-2">✍️题签</span>}
                    {book.isRare && <span>⭐{book.rarityLevel}</span>}
                  </div>
                </div>
              );
            })}
            <div class="pt-3 border-t-2 border-green-300">
              <div class="flex justify-between">
                <span class="font-bold">总实际价值:</span>
                <span class="font-bold text-lg text-green-700">
                  ¥{blindBoxAfter.totalActualValue.toFixed(2)}
                </span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">增值:</span>
                <span class="text-green-600 font-bold">
                  +¥{(blindBoxAfter.totalActualValue - blindBoxBefore.totalBasePrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-amber-50 rounded-lg">
        <h4 class="font-bold text-amber-800 mb-3">💵 结算详情</h4>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500">你的定价</p>
            <p class="text-xl font-bold text-blue-600">¥{playerPrice.toFixed(2)}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">实际价值</p>
            <p class="text-xl font-bold text-green-600">¥{actualValue.toFixed(2)}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">利润</p>
            <p class={`text-xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}¥{profit.toFixed(2)}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500">本轮得分</p>
            <p class={`text-xl font-bold ${scoreGained >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {scoreGained >= 0 ? '+' : ''}{scoreGained}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
