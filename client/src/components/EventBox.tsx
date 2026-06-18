import React from 'react';
import type { GameEvent, GameField, GameState, LevelInfo } from '../types';

interface Props {
  level: LevelInfo;
  state: GameState;
  onExecute: (eventId: string) => void;
  loading: boolean;
}

const CATEGORY_META: Record<GameEvent['category'], { icon: string; color: string; label: string } = {
  trace: { icon: '✏️', color: '#3b82f6', label: '描线类' },
  measure: { icon: '📏', color: '#10b981', label: '量测类' },
  balance: { icon: '⚖️', color: '#8b5cf6', label: '配平类' },
  risk: { icon: '🛡️', color: '#ef4444', label: '风控类' },
  reward: { icon: '🎁', color: '#f59e0b', label: '奖励类' },
  fail: { icon: '🔧', color: '#ec4899', label: '压制类' },
};

const FIELD_LABELS: Record<keyof GameField, string> = {
  traceValue: '描线值', measureSlot: '量测槽', balanceMark: '配平痕',
  wuRisk: '戊号风险', dingReward: '丁号奖励', weiFailFactor: '未号失败因子',
};

function EffectBadge({ delta, field }: { delta: number; field: string }) {
  const positive = delta > 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 600,
    marginRight: 4, marginBottom: 4,
    background: positive ? '#dcfce7' : '#fee2e2',
    color: positive ? '#166534' : '#991b1b',
    border: `1px solid ${positive ? '#bbf7d0' : '#fecaca'}`,
    }}>
      {FIELD_LABELS[field as keyof GameField]} {positive ? '+' : ''}{delta}
    </span>
  );
}

export const EventBox: React.FC<Props> = ({ level, state, onExecute, loading }) => {
  const disabled = state.isFinished || loading;
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#111827', fontWeight: 700 }}>📦 云母矿灯协作闯关游戏·事件匣</h3>
        <div style={{
          fontSize: 12, color: '#6b7280'
        }}>
          可选操作 {level.availableEvents.length} 项
        </div>
      </div>

      <div style={{
        padding: '8px 12px',
        background: '#fef3c7',
        borderRadius: 8,
        fontSize: 12,
        color: '#92400e',
        border: '1px solid #fde68a',
        marginBottom: 14,
      }}>
        💡 提示：每选择一个事件，会消耗相应成本并修改局面字段。请谨慎选择协作步骤！
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 10 }}>
        {level.availableEvents.map(ev => {
          const meta = CATEGORY_META[ev.category];
          return (
            <div
              key={ev.id}
              onClick={() => !disabled && onExecute(ev.id)}
              style={{
                padding: 14,
                borderRadius: 12,
                border: `1.5px solid ${disabled ? '#e5e7eb' : '#e5e7eb'}`,
                background: disabled ? '#f9fafb' : '#ffffff',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.6 : 1,
              }}
              onMouseEnter={e => {
                if (!disabled) e.currentTarget.style.borderColor = meta.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-flex', width: 26, height: 26, borderRadius: 6,
                    alignItems: 'center', justifyContent: 'center',
                    background: `${meta.color}20`, fontSize: 14,
                  }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }}>{ev.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{meta.label}</div>
                  </div>
                </div>
                <div style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  background: '#eff6ff', color: '#1d4ed8',
                  fontSize: 11, fontWeight: 600,
                }}>成本 {ev.cost}</div>
              </div>
              <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 8, lineHeight: 1.5 }}>
                {ev.description}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {Object.entries(ev.effect).map(([k, v]) => (
                  <EffectBadge key={k} field={k} delta={v as number} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
