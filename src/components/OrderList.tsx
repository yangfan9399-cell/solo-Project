import { component$, $ } from '@builder.io/qwik';
import type { OrderWithStatus } from '~/game/types';
import { formatTime } from '~/game/engine';

interface OrderListProps {
  orders: OrderWithStatus[];
  currentDay: number;
  onAccept$?: (orderId: string) => void;
  onSelect$?: (orderId: string) => void;
  selectedOrderId?: string | null;
  showCompleted?: boolean;
}

const customerTypeLabel: Record<OrderWithStatus['customerType'], string> = {
  farmer: '农户',
  merchant: '商贾',
  scholar: '文人',
  official: '官差',
  noble: '贵族',
};

const difficultyLabel: Record<OrderWithStatus['difficulty'], string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const OrderList = component$<OrderListProps>((props) => {
  const { orders, currentDay, onAccept$, onSelect$, selectedOrderId, showCompleted } = props;

  const displayOrders = showCompleted
    ? orders
    : orders.filter((o) => o.status === 'pending' || o.status === 'accepted');

  if (displayOrders.length === 0) {
    return (
      <div class="panel">
        <h3 class="panel-title">{showCompleted ? '已完成订单' : '订单列表'}</h3>
        <p class="text-dim" style={{ textAlign: 'center', padding: '1rem' }}>
          {showCompleted ? '暂无完成的订单' : '今日暂无新订单'}
        </p>
      </div>
    );
  }

  return (
    <div class="panel">
      <h3 class="panel-title">{showCompleted ? '已完成订单' : '订单列表'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {displayOrders.map((order) => {
          const isSelected = order.id === selectedOrderId;
          const daysLeft = order.deadline - currentDay;
          const isUrgent = daysLeft <= 1 && order.status === 'accepted';

          return (
            <div
              key={order.id}
              class={{
                'order-card': true,
                'order-selected': isSelected,
                'order-urgent': isUrgent,
                'order-completed': order.status === 'completed',
                'order-failed': order.status === 'failed',
              }}
              onClick$={() => onSelect$ && onSelect$(order.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong>{order.customerName}</strong>
                    <span class={`badge badge-${order.difficulty === 'easy' ? 'success' : order.difficulty === 'medium' ? 'warning' : 'danger'}`}>
                      {difficultyLabel[order.difficulty]}
                    </span>
                    <span class="badge">{customerTypeLabel[order.customerType]}</span>
                  </div>
                  <p class="text-dim" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    {order.description}
                  </p>
                </div>
                {order.status === 'pending' && !showCompleted && onAccept$ && (
                  <button
                    class="btn"
                    onClick$={(e) => {
                      e.stopPropagation();
                      onAccept$(order.id);
                    }}
                  >
                    接单
                  </button>
                )}
              </div>

              <div class="row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span class="text-dim">目标时长: </span>
                  <span class="stat-value">{formatTime(order.targetDuration)}</span>
                </div>
                <div>
                  <span class="text-dim">容差: </span>
                  <span class="stat-value">±{order.targetTolerance}秒</span>
                </div>
                <div>
                  <span class="text-dim">报酬: </span>
                  <span class="stat-value text-accent">{order.rewardCopper} 文</span>
                </div>
                <div>
                  <span class="text-dim">声望: </span>
                  <span class="stat-value text-success">+{order.reputationReward}</span>
                </div>
                {!showCompleted && (
                  <div>
                    <span class="text-dim">剩余: </span>
                    <span class={{
                      'stat-value': true,
                      'text-danger': isUrgent,
                      'text-warning': daysLeft === 2,
                    }}>
                      {daysLeft > 0 ? `${daysLeft}天` : '今日到期'}
                    </span>
                  </div>
                )}
              </div>

              {order.actualResult && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                  <div class="row" style={{ gap: '1rem' }}>
                    <div>
                      <span class="text-dim">实际: </span>
                      <span class="stat-value">{formatTime(order.actualResult.actualDuration)}</span>
                    </div>
                    <div>
                      <span class="text-dim">误差: </span>
                      <span class={{
                        'stat-value': true,
                        'text-success': Math.abs(order.actualResult.errorSeconds) <= order.targetTolerance,
                        'text-danger': Math.abs(order.actualResult.errorSeconds) > order.targetTolerance,
                      }}>
                        {order.actualResult.errorSeconds > 0 ? '+' : ''}{order.actualResult.errorSeconds}秒
                      </span>
                    </div>
                    <div>
                      <span class="text-dim">精度: </span>
                      <span class="stat-value text-accent">{order.actualResult.accuracyScore}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
