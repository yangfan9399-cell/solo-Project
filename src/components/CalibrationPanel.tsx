import { component$, $ } from '@builder.io/qwik';
import type { CalibrationResult, OrderWithStatus } from '~/game/types';
import { formatTime, formatDuration } from '~/game/engine';

interface CalibrationPanelProps {
  selectedOrder: OrderWithStatus | null;
  result: CalibrationResult | null;
  isCalibrating: boolean;
  onCalibrate$: () => void;
  onConfirmResult$?: (passed: boolean) => void;
  tolerance: number;
}

export const CalibrationPanel = component$<CalibrationPanelProps>((props) => {
  const { selectedOrder, result, isCalibrating, onCalibrate$, onConfirmResult$, tolerance } = props;

  if (!selectedOrder) {
    return (
      <div class="panel">
        <h3 class="panel-title">校时操作</h3>
        <p class="text-dim" style={{ textAlign: 'center', padding: '2rem' }}>
          请从左侧选择一个已接的订单开始校时
        </p>
      </div>
    );
  }

  const passed = result ? Math.abs(result.errorSeconds) <= tolerance : false;

  return (
    <div class="panel">
      <h3 class="panel-title">校时操作</h3>

      <div style={{ marginBottom: '1rem' }}>
        <div class="stat">
          <span class="stat-label">当前订单</span>
          <span class="stat-value">{selectedOrder.customerName}</span>
        </div>
        <div class="stat">
          <span class="stat-label">目标时长</span>
          <span class="stat-value text-accent">{formatTime(selectedOrder.targetDuration)}</span>
        </div>
        <div class="stat">
          <span class="stat-label">允许误差</span>
          <span class="stat-value">±{tolerance} 秒</span>
        </div>
      </div>

      {!result && (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <button
            class="btn"
            onClick$={onCalibrate$}
            disabled={isCalibrating}
            style={{ fontSize: '1.1rem', padding: '0.8rem 2rem' }}
          >
            {isCalibrating ? '校时中...' : '开始校时'}
          </button>
          <p class="text-dim" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
            调节好漏孔直径和浮标刻度后点击校时
          </p>
        </div>
      )}

      {result && (
        <div>
          <div class="calibration-result">
            <div class="stat">
              <span class="stat-label">实际时长</span>
              <span class="stat-value">{formatTime(result.actualDuration)}</span>
            </div>
            <div class="stat">
              <span class="stat-label">误差</span>
              <span class={{
                'stat-value': true,
                'text-success': passed,
                'text-danger': !passed,
              }}>
                {formatDuration(result.errorSeconds)}
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">精度得分</span>
              <span class={{
                'stat-value': true,
                'text-success': result.accuracyScore >= 80,
                'text-warning': result.accuracyScore >= 60 && result.accuracyScore < 80,
                'text-danger': result.accuracyScore < 60,
              }}>
                {result.accuracyScore}%
              </span>
            </div>
            <div class="stat">
              <span class="stat-label">判定</span>
              <span class={{
                'stat-value': true,
                'text-success': passed,
                'text-danger': !passed,
                'badge': true,
                'badge-success': passed,
                'badge-danger': !passed,
              }} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px' }}>
                {passed ? '合格' : '不合格'}
              </span>
            </div>
          </div>

          {onConfirmResult$ && (
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                class="btn"
                onClick$={() => onConfirmResult$(passed)}
                style={{ flex: 1 }}
              >
                {passed ? '交付订单' : '承认失败'}
              </button>
              <button
                class="btn btn-secondary"
                onClick$={onCalibrate$}
                style={{ flex: 1 }}
              >
                重新校时
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
