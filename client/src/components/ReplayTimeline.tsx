import React from 'react';
import type { GameEvent, GameState, LevelInfo } from '../types';

interface Props {
  level: LevelInfo;
  state: GameState;
  onRollback: (stepIndex: number) => void;
  rollingBack: boolean;
}

export const ReplayTimeline: React.FC<Props> = ({ level, state, onRollback, rollingBack }) => {
  const eventMap = new Map<string, GameEvent>();
  level.availableEvents.forEach(e => eventMap.set(e.id, e));

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#111827', fontWeight: 700 }}>⏱️ 云母矿灯协作闯关游戏·回放轴</h3>
        <div style={{
          fontSize: 12, color: '#6b7280',
        }}>
          共 {state.steps.length} 步 · 每步自动保存
        </div>
      </div>

      <div style={{
        padding: '8px 12px',
        background: '#dbeafe',
        borderRadius: 8,
        fontSize: 12,
        color: '#1e40af',
        border: '1px solid #93c5fd',
        marginBottom: 14,
      }}>
        🔄 刷新页面后自动从回放轴恢复；点击任意步骤可回滚至该步之前。
      </div>

      {state.steps.length === 0 ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 13,
          border: '2px dashed #e5e7eb',
          borderRadius: 12,
        }}>
          尚未开始协作，请从事件匣选择第一步操作。
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{
            position: 'absolute', left: 8, top: 0, bottom: 0,
            width: 2, background: '#e5e7eb',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.steps.map((s, idx) => {
              const ev = eventMap.get(s.eventId);
              const isLast = idx === state.steps.length - 1;
              return (
                <div
                  key={s.stepIndex}
                  style={{
                    position: 'relative',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${isLast ? '#60a5fa' : '#e5e7eb'}`,
                    background: isLast ? '#eff6ff' : '#ffffff',
                    cursor: rollingBack ? 'progress' : 'pointer',
                  }}
                  onClick={() => !rollingBack && !isLast && onRollback(idx)}
                >
                  <div style={{
                    position: 'absolute', left: -18, top: 14,
                    width: 12, height: 12, borderRadius: 6,
                    background: isLast ? '#3b82f6' : '#9ca3af',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 0 1px #d1d5db',
                  }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#1f2937',
                        background: '#f3f4f6', padding: '2px 8px', borderRadius: 8,
                      }}>第 {idx + 1} 步</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        {ev?.name || s.eventId}
                      </span>
                      {ev && (
                        <span style={{ fontSize: 11, color: '#6b7280' }}>（耗{ev.cost}）</span>
                      )}
                    </div>
                    {!isLast && (
                      <span style={{
                        fontSize: 11, color: '#2563eb', fontWeight: 600,
                      }}>↩ 回滚到此</span>
                    )}
                    {isLast && (
                      <span style={{
                        fontSize: 11, color: '#3b82f6', fontWeight: 700,
                      }}>当前</span>
                    )}
                  </div>
                  <div style={{
                    marginTop: 6,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    fontSize: 10,
                  }}>
                    <span style={{ padding: '1px 6px', background: '#eff6ff', color: '#1d4ed8', borderRadius: 6 }}>描{s.fieldAfter.traceValue}</span>
                    <span style={{ padding: '1px 6px', background: '#dcfce7', color: '#166534', borderRadius: 6 }}>量{s.fieldAfter.measureSlot}</span>
                    <span style={{ padding: '1px 6px', background: '#ede9fe', color: '#6d28d9', borderRadius: 6 }}>配{s.fieldAfter.balanceMark}</span>
                    <span style={{ padding: '1px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: 6 }}>戊{s.fieldAfter.wuRisk}</span>
                    <span style={{ padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 6 }}>丁{s.fieldAfter.dingReward}</span>
                    <span style={{ padding: '1px 6px', background: '#fce7f3', color: '#9d174d', borderRadius: 6 }}>未{s.fieldAfter.weiFailFactor}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
