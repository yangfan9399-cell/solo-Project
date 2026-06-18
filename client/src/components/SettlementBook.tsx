import React from 'react';
import type { GameEvent, Settlement, LevelInfo } from '../types';

interface Props {
  settlement: Settlement | null;
  loading: boolean;
  level: LevelInfo;
  onRequest: () => void;
}

function StatRow({ label, value, accent, positive }: { label: string; value: string | number; accent?: boolean; positive?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid #f3f4f6',
      fontSize: 13,
    }}>
      <span style={{ color: accent ? '#111827' : '#4b5563', fontWeight: accent ? 700 : 500 }}>{label}</span>
      <span style={{
        color: positive === true ? '#166534' : positive === false ? '#991b1b' : '#1f2937',
        fontWeight: accent ? 700 : 600,
        fontSize: accent ? 15 : 13,
      }}>{value}</span>
    </div>
  );
}

export const SettlementBook: React.FC<Props> = ({ settlement, loading, level, onRequest }) => {
  const eventMap = new Map<string, GameEvent>();
  level.availableEvents.forEach(e => eventMap.set(e.id, e));

  const getResultBorder = () => {
    if (settlement?.hiddenTriggered && settlement?.isWin) return '#a78bfa';
    if (settlement?.isWin) return '#34d399';
    return '#f87171';
  };

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 20,
      border: settlement ? `2px solid ${getResultBorder()}` : '1px solid #e5e7eb',
      boxShadow: settlement ? '0 4px 16px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: '#111827', fontWeight: 700 }}>📒 云母矿灯协作闯关游戏·结算簿</h3>
        <button
          onClick={onRequest}
          disabled={loading}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            background: loading ? '#9ca3af' : '#4c1d95',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'progress' : 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            if (!loading) e.currentTarget.style.background = '#5b21b6';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = loading ? '#9ca3af' : '#4c1d95';
          }}
        >
          {loading ? '⏳ 后端重算中...' : settlement ? '🔄 再次重算' : '🔄 请求重算结算'}
        </button>
      </div>

      {!settlement ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          color: '#6b7280',
          fontSize: 13,
          border: '2px dashed #e5e7eb',
          borderRadius: 12,
          background: '#fafafa',
        }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🧮</div>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: 6 }}>尚未生成结算</div>
          <div style={{ fontSize: 12, lineHeight: 1.7 }}>
            点击右上角按钮，由后端根据当前「描线值」<br />
            与「协作闯关步骤」重算完整结算明细。
          </div>
        </div>
      ) : (
        <div>
          <div style={{
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            background: settlement.hiddenTriggered && settlement.isWin
              ? 'linear-gradient(135deg, #ddd6fe, #f0abfc)'
              : settlement.isWin
              ? 'linear-gradient(135deg, #d1fae5, #6ee7b7)'
              : 'linear-gradient(135deg, #fee2e2, #fca5a5)',
            border: `1px solid ${getResultBorder()}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              {settlement.hiddenTriggered && settlement.isWin ? '🌟 结算结果：隐藏胜利' : settlement.isWin ? '✅ 结算结果：挑战胜利' : '❌ 结算结果：挑战失败'}
            </div>
            <div style={{ fontSize: 12, color: '#1f2937', lineHeight: 1.6 }}>
              {settlement.detailText}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <StatRow label="总步数" value={`${settlement.totalSteps} 步`} />
            <StatRow label="最终描线值" value={settlement.finalTraceValue} />
            <StatRow label="奖励得分" value={`+${settlement.rewardScore}`} positive />
            <StatRow label="风险惩罚" value={`-${settlement.riskPenalty}`} positive={false} />
            <StatRow label="效率奖励（剩余步数×30）" value={`+${settlement.efficiencyBonus}`} positive />
            {settlement.hiddenTriggered && (
              <StatRow label="🌟 隐藏结局奖励" value={`+500`} positive />
            )}
            <StatRow
              label="综合得分（后端重算）"
              value={settlement.totalScore}
              accent
              positive={settlement.isWin}
            />
          </div>

          <div style={{
            fontSize: 12, fontWeight: 600, color: '#374151',
            marginBottom: 8,
          }}>📋 协作步骤贡献明细</div>
          <div style={{
            maxHeight: 180, overflowY: 'auto',
            border: '1px solid #f3f4f6', borderRadius: 8,
            background: '#fafafa',
          }}>
            {settlement.stepReview.length === 0 ? (
              <div style={{
                padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12,
              }}>
                暂无步骤记录，结算基于初始局面
              </div>
            ) : (
              settlement.stepReview.map((sr, idx) => {
                const ev = eventMap.get(sr.eventId);
                const isLast = idx === settlement.stepReview.length - 1;
                return (
                  <div key={sr.step} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 12px',
                    fontSize: 12,
                    borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
                    background: '#ffffff',
                  }}>
                    <span style={{ color: '#4b5563' }}>
                      <span style={{ fontWeight: 700, color: '#1f2937' }}>#{sr.step}</span>
                      {' '}{ev?.name || sr.eventId}
                    </span>
                    <span style={{
                      fontWeight: 600,
                      color: sr.contribution >= 0 ? '#166534' : '#991b1b',
                    }}>
                      {sr.contribution >= 0 ? '+' : ''}{sr.contribution}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <div style={{
            marginTop: 10, fontSize: 11, color: '#9ca3af',
            textAlign: 'right',
          }}>
            结算由后端基于描线值与协作步骤实时重算
          </div>
        </div>
      )}
    </div>
  );
};
