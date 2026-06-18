import React from 'react';
import type { LevelInfo } from '../types';

interface Props {
  levels: LevelInfo[];
  onSelect: (id: LevelInfo['id']) => void;
}

export const LevelSelect: React.FC<Props> = ({ levels, onSelect }) => {
  return (
    <div style={{
      maxWidth: 1100, margin: '0 auto', padding: '40px 24px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>💡⛏️✨</div>
        <h1 style={{
          fontSize: 28, fontWeight: 800, color: '#111827', margin: '0 0 8px 0',
          letterSpacing: 0.5,
        }}>
          云母矿灯协作闯关游戏
        </h1>
        <div style={{ fontSize: 14, color: '#6b7280', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          在云母矿脉深处，你与伙伴手持矿灯协作闯关。通过精心选择事件，
          平衡「描线值、量测槽、配平痕」三大核心属性，
          监控「戊号风险、丁号奖励、未号失败因子」，挑战通关！
        </div>
      </div>

      {levels.length === 0 ? (
        <div style={{
          padding: 60,
          textAlign: 'center',
          border: '2px dashed #e5e7eb',
          borderRadius: 16,
          background: '#fafafa',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>正在加载关卡配置...</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {levels.map((lv, idx) => {
            const colors = [
              { bg: '#eff6ff', border: '#93c5fd', badge: '#2563eb', glow: 'rgba(37,99,235,0.15)' },
              { bg: '#fff7ed', border: '#fdba74', badge: '#ea580c', glow: 'rgba(234,88,12,0.15)' },
              { bg: '#f5f3ff', border: '#c4b5fd', badge: '#7c3aed', glow: 'rgba(124,58,237,0.15)' },
            ];
            const c = colors[idx % 3];
            return (
              <div
                key={lv.id}
                onClick={() => onSelect(lv.id)}
                style={{
                  background: `linear-gradient(145deg, ${c.bg}, #ffffff)`,
                  borderRadius: 18,
                  padding: 24,
                  border: `1.5px solid ${c.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: `0 4px 16px ${c.glow}`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 10px 28px ${c.glow}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${c.glow}`;
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 999,
                  background: c.badge,
                  color: '#ffffff',
                  fontSize: 11, fontWeight: 700,
                  marginBottom: 10,
                }}>
                  {lv.id === 'wu' ? '戊局 · LEVEL 1' : lv.id === 'ding' ? '丁局 · LEVEL 2' : '未局 · LEVEL 3'}
                </div>
                <h3 style={{
                  margin: 0, fontSize: 16, fontWeight: 700, color: '#111827',
                  lineHeight: 1.4,
                }}>{lv.name}</h3>
                <div style={{
                  fontSize: 12, color: c.badge, fontWeight: 600,
                  marginTop: 4, marginBottom: 10,
                }}>{lv.subtitle}</div>
                <div style={{
                  fontSize: 12, color: '#4b5563', lineHeight: 1.6,
                  marginBottom: 14,
                  minHeight: 60,
                }}>{lv.description}</div>

                <div style={{
                  borderTop: `1px dashed ${c.border}`,
                  paddingTop: 12,
                }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                    🎯 胜利条件
                  </div>
                  <div style={{ fontSize: 11, color: '#1f2937', fontWeight: 500, marginBottom: 6 }}>
                    {lv.targetText}
                  </div>
                  {lv.hiddenText && (
                    <>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, marginTop: 6 }}>
                        🔮 隐藏条件
                      </div>
                      <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
                        存在隐藏结局，探索解锁
                      </div>
                    </>
                  )}
                </div>

                <div style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, color: '#6b7280' }}>
                    最多 {lv.maxSteps} 步 · 事件 {lv.availableEvents.length} 个
                  </span>
                  <span style={{
                    padding: '6px 14px',
                    background: c.badge, color: '#ffffff',
                    borderRadius: 8,
                    fontSize: 12, fontWeight: 600,
                  }}>开始挑战 →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: 36,
        padding: 20,
        background: '#f9fafb',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 10 }}>📖 六大局面字段说明</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12, color: '#4b5563' }}>
          <div>✏️ <strong style={{ color: '#1d4ed8' }}>描线值</strong>：矿脉描线的完整度，核心胜利指标</div>
          <div>📏 <strong style={{ color: '#065f46' }}>量测槽</strong>：矿层深度与含量的量化测量</div>
          <div>⚖️ <strong style={{ color: '#6d28d9' }}>配平痕</strong>：矿灯配重平衡度，稳定矿脉信号</div>
          <div>🛡️ <strong style={{ color: '#991b1b' }}>戊号风险</strong>：越高越容易触发失败（核心风控）</div>
          <div>🎁 <strong style={{ color: '#92400e' }}>丁号奖励</strong>：矿中发现的额外加成</div>
          <div>🔧 <strong style={{ color: '#9d174d' }}>未号失败因子</strong>：潜在隐患累积，触发即失败</div>
        </div>
      </div>
    </div>
  );
};
