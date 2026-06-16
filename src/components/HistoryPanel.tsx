import { component$, $ } from '@builder.io/qwik';
import type { ActionHistory } from '~/game/types';

interface HistoryPanelProps {
  history: ActionHistory[];
  currentIndex: number;
}

const actionTypeLabels: Record<ActionHistory['type'], string> = {
  adjust_hole: '调节漏孔',
  adjust_scale: '调节刻度',
  accept_order: '接受订单',
  complete_order: '完成订单',
  skip_day: '进入下一天',
  calibrate: '校时测试',
};

export const HistoryPanel = component$<HistoryPanelProps>((props) => {
  const { history, currentIndex } = props;

  if (history.length === 0) {
    return (
      <div class="panel">
        <h3 class="panel-title">操作历史</h3>
        <p class="text-dim" style={{ textAlign: 'center', padding: '1rem' }}>
          暂无操作记录
        </p>
      </div>
    );
  }

  return (
    <div class="panel">
      <h3 class="panel-title">操作历史（共 {history.length} 步）</h3>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {history.slice().reverse().map((action, reverseIdx) => {
          const actualIndex = history.length - 1 - reverseIdx;
          const isCurrent = actualIndex === currentIndex;
          const isFuture = actualIndex > currentIndex;

          return (
            <div
              key={action.id}
              class={{
                'history-item': true,
                'history-current': isCurrent,
                'history-future': isFuture,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>
                  {actualIndex + 1}. {actionTypeLabels[action.type]}
                </span>
                {isCurrent && (
                  <span class="badge badge-success">当前</span>
                )}
                {isFuture && (
                  <span class="badge">可重做</span>
                )}
              </div>
              <div class="text-dim" style={{ fontSize: '0.8rem' }}>
                第 {action.dayIndex} 天
                {action.type === 'adjust_hole' && ` · 孔径 ${(action.payload.holeDiameter as number).toFixed(2)}cm`}
                {action.type === 'adjust_scale' && ` · 刻度 ${action.payload.scaleMarks}格`}
                {action.type === 'complete_order' && (
                  ` · ${action.payload.success ? '成功' : '失败'} · ${action.payload.reward || 0}文`
                )}
                {action.type === 'skip_day' && ` · 温度 ${(action.payload.newTemp as number).toFixed(1)}°C`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
