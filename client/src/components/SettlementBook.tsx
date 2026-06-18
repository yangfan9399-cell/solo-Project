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

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
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
            background: loading ? '#9ca3af' : '#111827',
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'progress' : 'pointer',
          }}
        >
          {loading ? '重算中...' : '🔄 后端重算结算'}
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
        }}>
          点击右上角按钮，由后端根据「描线值」与「协作闯关步骤」重算完整结算。
        </div>
      ) : (
        <div>
          <div style={{
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
            background: settlement.hiddenTriggered && settlement.isWin
              ? 'linear-gradient(135deg, #c4b5fd, #f0abfc)'
              : settlement.isWin
              ? 'linear-gradient(135deg, #a7f3d0, #6ee7b7)'
              : 'linear-gradient(135deg, #fecaca, #fca5a5)',
            border: `1px solid ${settlement.isWin ? '#6ee7b7' : '#fca5a5'}`,
          }}>
            <div style={{ fontSize: 13, color: '#111827', marginBottom: 6 }}>
              <strong>结算结果：</strong>
              {settlement.hiddenTriggered && settlement.isWin ? '🌟 隐藏胜利' : settlement.isWin ? '✅ 常规胜利' : '❌ 挑战失败'}
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
          }}>
            {settlement.stepReview.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                尚未执行任何步骤
              </div>
            ) : (
              settlement.stepReview.map(sr => {
                const ev = eventMap.get(sr.eventId);
                return (
                  <div key={sr.step} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '8px 12px',
                    fontSize: 12,
                    borderBottom: '1px solid #f9fafb',
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
        </div>
      )}
    </div>
  );
};
