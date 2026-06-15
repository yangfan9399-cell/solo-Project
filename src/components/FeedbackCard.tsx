import { component$ } from '@builder.io/qwik';
import type { PricingFeedback, ReturnEvent } from '~/types/game';

interface FeedbackCardProps {
  feedback: PricingFeedback;
  returnEvent?: ReturnEvent | null;
}

const reactionConfig: Record<string, { emoji: string; label: string; bgColor: string; textColor: string }> = {
  delighted: { emoji: '🤩', label: '欣喜若狂', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  satisfied: { emoji: '😊', label: '满意', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
  neutral: { emoji: '😐', label: '一般', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
  disappointed: { emoji: '😞', label: '失望', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
  angry: { emoji: '😠', label: '愤怒', bgColor: 'bg-red-100', textColor: 'text-red-800' },
};

export const FeedbackCard = component$<FeedbackCardProps>(({ feedback, returnEvent }) => {
  const config = reactionConfig[feedback.reaction];
  
  return (
    <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
      <div class="flex items-center gap-4 mb-4">
        <div class="text-5xl">{config.emoji}</div>
        <div>
          <div class="flex items-center gap-2">
            <span class={`px-3 py-1 rounded-full text-sm font-bold ${config.bgColor} ${config.textColor}`}>
              {config.label}
            </span>
            {feedback.purchased ? (
              <span class="px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800">
                ✅ 已购买
              </span>
            ) : (
              <span class="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800">
                ❌ 未购买
              </span>
            )}
          </div>
          <p class="text-sm text-gray-500 mt-1">顾客: {feedback.customerName}</p>
        </div>
      </div>
      
      <div class="bg-amber-50 rounded-lg p-4 mb-4">
        <p class="text-gray-700 italic">"{feedback.feedback}"</p>
      </div>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="text-gray-500">价格差额</p>
          <p class={`text-lg font-bold ${feedback.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {feedback.priceDifference > 0 ? '+' : ''}¥{feedback.priceDifference.toFixed(2)}
          </p>
        </div>
        <div class="bg-gray-50 p-3 rounded-lg">
          <p class="text-gray-500">差额比例</p>
          <p class={`text-lg font-bold ${feedback.priceDifferencePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {feedback.priceDifferencePercent > 0 ? '+' : ''}{feedback.priceDifferencePercent.toFixed(1)}%
          </p>
        </div>
      </div>
      
      {returnEvent && (
        <div class="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <h4 class="font-bold text-red-800 flex items-center gap-2">
            ⚠️ 退货事件
          </h4>
          <p class="text-sm text-red-700 mt-2">{returnEvent.reason}</p>
          <div class="grid grid-cols-2 gap-4 mt-3 text-sm">
            <div>
              <p class="text-gray-500">退款金额</p>
              <p class="font-bold text-red-600">-¥{returnEvent.refundAmount.toFixed(2)}</p>
            </div>
            <div>
              <p class="text-gray-500">损坏罚金</p>
              <p class="font-bold text-red-600">-¥{returnEvent.damagePenalty.toFixed(2)}</p>
            </div>
          </div>
          <p class="text-sm text-red-600 mt-2">
            声誉影响: -{returnEvent.impactOnReputation.toFixed(1)} 分
          </p>
        </div>
      )}
    </div>
  );
});
