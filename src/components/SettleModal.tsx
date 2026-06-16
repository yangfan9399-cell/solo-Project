import { component$ } from '@builder.io/qwik';
import type { SettleResult, GameLevel } from '~/game/types';

interface SettleModalProps {
  result: SettleResult | null;
  level: GameLevel | null;
  onClose$: () => void;
  onRestart$?: () => void;
  onNextLevel$?: () => void;
}

export const SettleModal = component$<SettleModalProps>((props) => {
  const { result, level, onClose$, onRestart$, onNextLevel$ } = props;

  if (!result || !level) return null;

  return (
    <div class="modal-backdrop" onClick$={onClose$}>
      <div class="modal-content" onClick$={(e) => e.stopPropagation()}>
        <h2 class={{
          'text-success': result.won,
          'text-danger': !result.won,
        }} style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: '0.5rem' }}>
          {result.won ? '通关成功！' : '挑战失败'}
        </h2>
        <p class="text-dim" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {result.message}
        </p>

        <div class="panel" style={{ marginBottom: '1rem' }}>
          <h3 class="panel-title">本局成绩</h3>
          <div class="stat">
            <span class="stat-label">服务器计算得分</span>
            <span class="stat-value text-accent" style={{ fontSize: '1.5rem' }}>
              {result.serverCalculatedScore}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">平均精度</span>
            <span class="stat-value">{result.averageAccuracy}%</span>
          </div>
          <div class="stat">
            <span class="stat-label">完成订单</span>
            <span class="stat-value text-success">{result.ordersCompleted} 个</span>
          </div>
          <div class="stat">
            <span class="stat-label">失败订单</span>
            <span class="stat-value text-danger">{result.ordersFailed} 个</span>
          </div>
          <div class="stat">
            <span class="stat-label">过期订单</span>
            <span class="stat-value text-warning">{result.ordersExpired} 个</span>
          </div>
        </div>

        <div class="panel" style={{ marginBottom: '1rem' }}>
          <h3 class="panel-title">收支结算</h3>
          <div class="stat">
            <span class="stat-label">铜钱变动</span>
            <span class={{
              'stat-value': true,
              'text-success': result.copperEarned >= 0,
              'text-danger': result.copperEarned < 0,
            }}>
              {result.copperEarned >= 0 ? '+' : ''}{result.copperEarned} 文
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">最终铜钱</span>
            <span class="stat-value text-accent">{result.copperFinal} 文</span>
          </div>
          <div class="stat">
            <span class="stat-label">声望变动</span>
            <span class={{
              'stat-value': true,
              'text-success': result.reputationEarned >= 0,
              'text-danger': result.reputationEarned < 0,
            }}>
              {result.reputationEarned >= 0 ? '+' : ''}{result.reputationEarned}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">最终声望</span>
            <span class="stat-value text-success">{result.reputationFinal}</span>
          </div>
        </div>

        <div class="panel" style={{ marginBottom: '1.5rem' }}>
          <h3 class="panel-title">通关条件</h3>
          <div class="stat">
            <span class="stat-label">最低铜钱 ({level.passCondition.minCopper})</span>
            <span class={{
              'stat-value': true,
              'text-success': result.passConditionMet.minCopper,
              'text-danger': !result.passConditionMet.minCopper,
            }}>
              {result.passConditionMet.minCopper ? '✓ 达成' : '✗ 未达成'}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">最低声望 ({level.passCondition.minReputation})</span>
            <span class={{
              'stat-value': true,
              'text-success': result.passConditionMet.minReputation,
              'text-danger': !result.passConditionMet.minReputation,
            }}>
              {result.passConditionMet.minReputation ? '✓ 达成' : '✗ 未达成'}
            </span>
          </div>
          <div class="stat">
            <span class="stat-label">最低精度 ({Math.round(level.passCondition.minAccuracy * 100)}%)</span>
            <span class={{
              'stat-value': true,
              'text-success': result.passConditionMet.minAccuracy,
              'text-danger': !result.passConditionMet.minAccuracy,
            }}>
              {result.passConditionMet.minAccuracy ? '✓ 达成' : '✗ 未达成'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button class="btn btn-secondary" onClick$={onClose$} style={{ flex: 1 }}>
            关闭
          </button>
          {onRestart$ && (
            <button class="btn btn-secondary" onClick$={onRestart$} style={{ flex: 1 }}>
              重新挑战
            </button>
          )}
          {result.won && onNextLevel$ && (
            <button class="btn" onClick$={onNextLevel$} style={{ flex: 1 }}>
              下一关
            </button>
          )}
        </div>

        <p class="text-dim" style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem' }}>
          分数由服务器端重新计算并验证
        </p>
      </div>
    </div>
  );
});
