import { component$ } from '@builder.io/qwik';
import type { LedgerEntry } from '~/types/game';

interface LedgerViewProps {
  entries: LedgerEntry[];
  currentMoney: number;
  totalScore: number;
  onRollback$?: (entryId: number, roundNumber: number) => void;
  showRollback?: boolean;
}

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  inventory: { label: '进货成本', color: 'text-orange-600', icon: '📦' },
  sale: { label: '销售收入', color: 'text-green-600', icon: '💰' },
  return: { label: '退货退款', color: 'text-red-600', icon: '↩️' },
  refund: { label: '退款', color: 'text-red-600', icon: '💸' },
  penalty: { label: '罚金', color: 'text-red-600', icon: '⚠️' },
  rollback: { label: '回滚', color: 'text-gray-600', icon: '🔄' },
};

export const LedgerView = component$<LedgerViewProps>(({ 
  entries, 
  currentMoney, 
  totalScore, 
  onRollback$, 
  showRollback = false 
}) => {
  const totalIncome = entries
    .filter(e => e.amount > 0 && !e.rolledBack)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const totalExpense = entries
    .filter(e => e.amount < 0 && !e.rolledBack)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);
  
  return (
    <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
      <h3 class="text-lg font-bold text-book-brown mb-4">📒 进货台账</h3>
      
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-green-50 p-3 rounded-lg text-center">
          <p class="text-xs text-gray-500">总收入</p>
          <p class="text-xl font-bold text-green-600">¥{totalIncome.toFixed(2)}</p>
        </div>
        <div class="bg-red-50 p-3 rounded-lg text-center">
          <p class="text-xs text-gray-500">总支出</p>
          <p class="text-xl font-bold text-red-600">¥{totalExpense.toFixed(2)}</p>
        </div>
        <div class="bg-amber-50 p-3 rounded-lg text-center">
          <p class="text-xs text-gray-500">当前资金</p>
          <p class="text-xl font-bold text-amber-600">¥{currentMoney.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
        <span class="font-bold text-blue-800">总积分</span>
        <span class="text-2xl font-bold text-blue-600">{totalScore}</span>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-amber-100">
              <th class="text-left p-2 rounded-tl-lg">回合</th>
              <th class="text-left p-2">类型</th>
              <th class="text-left p-2">描述</th>
              <th class="text-right p-2">金额</th>
              <th class="text-left p-2 rounded-tr-lg">操作</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} class="p-4 text-center text-gray-500">暂无台账记录</td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  class={`border-b border-gray-100 ${entry.rolledBack ? 'bg-gray-100 text-gray-400' : ''}`}
                >
                  <td class="p-2">#{entry.roundNumber}</td>
                  <td class="p-2">
                    <span class="flex items-center gap-1">
                      <span>{typeConfig[entry.type]?.icon}</span>
                      <span class={typeConfig[entry.type]?.color}>
                        {typeConfig[entry.type]?.label}
                      </span>
                    </span>
                  </td>
                  <td class="p-2">
                    {entry.description}
                    {entry.rolledBack && (
                      <span class="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">已回滚</span>
                    )}
                    {entry.rollbackId && (
                      <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        回滚 #{entry.rollbackId}
                      </span>
                    )}
                  </td>
                  <td class={`p-2 text-right font-bold ${entry.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.amount >= 0 ? '+' : ''}¥{entry.amount.toFixed(2)}
                  </td>
                  <td class="p-2">
                    {showRollback && !entry.rolledBack && entry.type === 'inventory' && onRollback$ && (
                      <button
                        onClick$={() => onRollback$(entry.id, entry.roundNumber)}
                        class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                      >
                        回滚
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
