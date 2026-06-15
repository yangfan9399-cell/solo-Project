import { component$ } from '@builder.io/qwik';
import type { BlindBox } from '~/types/game';

interface BlindBoxCardProps {
  blindBox: BlindBox;
  revealAll?: boolean;
}

const conditionLabels: Record<string, { label: string; color: string }> = {
  excellent: { label: '极佳', color: 'text-green-700 bg-green-100' },
  good: { label: '良好', color: 'text-blue-700 bg-blue-100' },
  fair: { label: '一般', color: 'text-yellow-700 bg-yellow-100' },
  poor: { label: '较差', color: 'text-red-700 bg-red-100' },
};

const rarityLabels: Record<string, { label: string; color: string }> = {
  common: { label: '普通', color: 'text-gray-700 bg-gray-100' },
  uncommon: { label: '少见', color: 'text-blue-700 bg-blue-100' },
  rare: { label: '稀缺', color: 'text-purple-700 bg-purple-100' },
  first_edition: { label: '初版', color: 'text-amber-700 bg-amber-100' },
  out_of_print: { label: '绝版', color: 'text-red-700 bg-red-100' },
};

export const BlindBoxCard = component$<BlindBoxCardProps>(({ blindBox, revealAll = false }) => {
  return (
    <div class="book-card old-book-border">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-xl font-bold text-book-brown">{blindBox.name}</h3>
          <p class="text-sm text-gray-600 mt-1">{blindBox.description}</p>
        </div>
        <div class="price-tag">
          ¥{blindBox.totalBasePrice.toFixed(0)}
        </div>
      </div>
      
      <div class="space-y-4 mt-4">
        {blindBox.books.map((book, index) => (
          <div key={book.id} class="bg-white/50 rounded-lg p-3 border border-amber-200">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-book-sepia font-bold">{book.title}</span>
                  <span class={`text-xs px-2 py-0.5 rounded ${conditionLabels[book.condition].color}`}>
                    {conditionLabels[book.condition].label}
                  </span>
                  {book.isRare && (
                    <span class={`text-xs px-2 py-0.5 rounded ${rarityLabels[book.rarityLevel].color}`}>
                      {rarityLabels[book.rarityLevel].label}
                    </span>
                  )}
                </div>
                <p class="text-xs text-gray-500">{book.author} · {book.publishYear}年</p>
                
                {revealAll && (
                  <div class="mt-2 space-y-1 text-xs">
                    <p class="text-gray-600">
                      <span class="font-medium">书况:</span> {book.conditionDesc}
                    </p>
                    {book.hasInscription && (
                      <p class="text-blue-700 bg-blue-50 p-2 rounded">
                        ✍️ 题签: "{book.inscription}"
                      </p>
                    )}
                    {book.hasSeal && (
                      <p class="text-red-700 bg-red-50 p-2 rounded flex items-center gap-2">
                        <span class="stamp text-xs">{book.sealName}</span>
                        <span>藏书: {book.sealOwner}</span>
                      </p>
                    )}
                    <p class="text-amber-700">
                      <span class="font-medium">稀缺性:</span> {book.rarityDesc}
                    </p>
                    <p class="font-bold text-book-brown">
                      实际价值: ¥{book.actualValue.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
              
              {!revealAll && (
                <div class="text-2xl opacity-50">❓</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {revealAll && (
        <div class="mt-4 pt-4 border-t-2 border-amber-300">
          <div class="flex justify-between items-center">
            <span class="text-book-sepia font-bold">总实际价值:</span>
            <span class="text-2xl font-bold text-book-brown">
              ¥{blindBox.totalActualValue.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
