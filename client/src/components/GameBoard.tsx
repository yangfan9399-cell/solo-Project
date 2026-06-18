import React from 'react';
import type { GameField, GameState, LevelInfo, MapNode } from '../types';

interface Props {
  level: LevelInfo;
  state: GameState;
}

const FIELD_META: Record<keyof GameField, { label: string; color: string; danger?: boolean; max: number }> = {
  traceValue: { label: '描线值', color: '#3b82f6', max: 120 },
  measureSlot: { label: '量测槽', color: '#10b981', max: 120 },
  balanceMark: { label: '配平痕', color: '#8b5cf6', max: 120 },
  wuRisk: { label: '戊号风险', color: '#ef4444', danger: true, max: 100 },
  dingReward: { label: '丁号奖励', color: '#f59e0b', max: 100 },
  weiFailFactor: { label: '未号失败因子', color: '#ec4899', danger: true, max: 100 },
};

function ProgressBar({ value, meta }: { value: number; meta: typeof FIELD_META[keyof typeof FIELD_META] }) {
  const pct = Math.max(0, Math.min(100, (value / meta.max) * 100));
  const displayValue = Math.round(value * 10) / 10;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: '#1f2937' }}>{meta.label}</span>
        <span style={{ color: meta.danger ? '#dc2626' : '#374151', fontWeight: 600 }}>
          {displayValue} / {meta.max}
        </span>
      </div>
      <div style={{ height: 14, background: '#f3f4f6', borderRadius: 7, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: meta.danger && pct > 60 ? '#dc2626' : meta.color,
            transition: 'width 0.3s ease',
            borderRadius: 7,
          }}
        />
      </div>
    </div>
  );
}

function GameMap({ nodes, paths, stepCount, maxSteps, isFinished }: {
  nodes: MapNode[];
  paths: [string, string][];
  stepCount: number;
  maxSteps: number;
  isFinished: boolean;
}) {
  const progressRatio = Math.min(1, stepCount / Math.max(1, maxSteps - 1));
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: 12,
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      padding: 16,
      position: 'relative',
      height: 180,
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: 12, color: '#92400e', fontWeight: 600, marginBottom: 4 }}>🗺️ 矿脉地图</div>
      <svg width="100%" height="140" viewBox="0 0 100 100" preserveAspectRatio="none">
        {paths.map((p, i) => {
          const a = nodes.find(n => n.id === p[0])!;
          const b = nodes.find(n => n.id === p[1])!;
          const activated = i / paths.length < progressRatio + 0.01;
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={activated ? '#b45309' : '#d6d3d1'}
              strokeWidth="0.8"
              strokeDasharray={activated ? 'none' : '1.5,1.5'}
            />
          );
        })}
        {nodes.map(n => {
          const isCurrent = Math.floor(progressRatio * nodes.length) >= nodes.indexOf(n) - 0;
          const fillMap: Record<MapNode['type'], string> = {
            start: '#10b981', mid: '#3b82f6', end: '#8b5cf6', hidden: '#ec4899',
          };
          return (
            <g key={n.id}>
              <circle
                cx={n.x} cy={n.y} r="3.5"
                fill={isCurrent ? fillMap[n.type] : '#e7e5e4'}
                stroke="#ffffff" strokeWidth="0.8"
              />
              <text x={n.x} y={n.y - 5} textAnchor="middle" fontSize="3.2" fill="#78350f" fontWeight="600">
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const GameBoard: React.FC<Props> = ({ level, state }) => {
  const keys = Object.keys(FIELD_META) as (keyof GameField)[];
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 16,
      padding: 20,
      border: '1px solid #e5e7eb',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, color: '#111827', fontWeight: 700 }}>{level.name}</h2>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{level.subtitle} · {level.description}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 12, color: '#6b7280',
          }}>步数进度</div>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: state.steps.length >= level.maxSteps ? '#dc2626' : '#111827',
          }}>{state.steps.length} / {level.maxSteps}</div>
        </div>
      </div>

      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: state.isFinished
          ? (state.isWin ? 'linear-gradient(90deg, #d1fae5, #6ee7b7)' : 'linear-gradient(90deg, #fee2e2, #fca5a5)')
          : '#f0f9ff',
        border: `1px solid ${state.isFinished ? (state.isWin ? '#6ee7b7' : '#fca5a5') : '#bae6fd'}`,
        fontSize: 13, color: '#1f2937', marginBottom: 16, fontWeight: 500,
      }}>
        {state.isWin && state.hiddenTriggered ? '🌟 ' : state.isWin ? '✅ ' : state.isFinished ? '⚠️ ' : '💡 '}
        {state.message}
      </div>

      <GameMap
        nodes={level.mapNodes}
        paths={level.mapPaths}
        stepCount={state.steps.length}
        maxSteps={level.maxSteps}
        isFinished={state.isFinished}
      />

      <div style={{ height: 16 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a', marginBottom: 8 }}>⚡ 核心推进属性</div>
          {keys.filter(k => !FIELD_META[k].danger).map(k => (
            <ProgressBar key={k} value={state.currentField[k]} meta={FIELD_META[k]} />
          ))}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>⚠️ 风险监控面板</div>
          {keys.filter(k => FIELD_META[k].danger).map(k => (
            <ProgressBar key={k} value={state.currentField[k]} meta={FIELD_META[k]} />
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 12, padding: '10px 14px', background: '#f9fafb', borderRadius: 8,
        border: '1px dashed #d1d5db', fontSize: 12, color: '#4b5563',
      }}>
        <div><strong style={{ color: '#065f46' }}>🎯 胜利条件：</strong>{level.targetText}</div>
        <div style={{ marginTop: 4 }}><strong style={{ color: '#991b1b' }}>💥 失败条件：</strong>{level.failText}</div>
        {level.hiddenText && (
          <div style={{ marginTop: 4 }}><strong style={{ color: '#7c3aed' }}>🔮 隐藏条件：</strong>{level.hiddenText}</div>
        )}
      </div>
    </div>
  );
};
