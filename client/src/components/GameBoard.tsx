import React, { useMemo } from 'react';
import { useGameStore } from '../store';
import { RESOURCE_ICONS, NODE_TYPE_ICONS } from '../config';

const GameBoard: React.FC = () => {
  const { state, map, pendingAllocations, setAllocation } = useGameStore();

  const stainByNode = useMemo(() => {
    const m: Record<string, number> = {};
    if (!state) return m;
    state.stains.forEach(s => { m[s.nodeId] = (m[s.nodeId] || 0) + s.intensity; });
    return m;
  }, [state]);

  if (!state) {
    return (
      <div className="board-empty">
        <div className="empty-title">请选择局段开始挑战</div>
        <div className="empty-hint">或从右侧恢复已有存档</div>
      </div>
    );
  }

  const measurementColor = (v: number) => {
    if (v >= 85) return '#ffd700';
    if (v >= 60) return '#7fff00';
    if (v >= 40) return '#87ceeb';
    return '#ff6347';
  };

  return (
    <div className="board-wrap">
      <div className="board-header">
        <div className="board-title">{map.phaseName} · 局面盘</div>
        <div className="board-round">
          第 <span className="round-num">{state.round}</span> / {state.maxRounds} 回合
        </div>
      </div>

      <div
        className="board-map"
        style={{ width: map.width, height: map.height, background: map.background }}
      >
        <svg className="board-lines" width={map.width} height={map.height}>
          {map.slots.map(sl => {
            if (!sl.requiredForId) return null;
            const node = map.nodes.find(n => n.id === sl.requiredForId);
            if (!node) return null;
            const slotIdx = map.slots.indexOf(sl);
            const side = slotIdx % 2 === 0 ? 'left' : 'right';
            const sx = side === 'left' ? 40 + (slotIdx * 12) % 200 : map.width - 40 - (slotIdx * 12) % 200;
            const sy = 40 + Math.floor(slotIdx / 2) * 30;
            return (
              <line
                key={`line-${sl.id}`}
                x1={sx} y1={sy}
                x2={node.x} y2={node.y}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        {map.nodes.map(node => {
          const v = Math.round(state.measurements[node.id] || 0);
          const stain = stainByNode[node.id] || 0;
          const brightness = 0.3 + (v / 100) * 0.7;
          return (
            <div
              key={node.id}
              className="board-node"
              style={{
                left: node.x,
                top: node.y,
                filter: `brightness(${brightness}) drop-shadow(0 0 ${10 + v / 4}px ${measurementColor(v)})`
              }}
            >
              <div className="node-icon" style={{ color: measurementColor(v) }}>
                {NODE_TYPE_ICONS[node.type]}
              </div>
              <div className="node-name">{node.name}</div>
              <div className="node-measure" style={{ color: measurementColor(v) }}>
                ⚡{v}
              </div>
              {stain > 0 && (
                <div className="node-stain" title={`熏染痕强度 ${stain}`}>
                  🌫️{stain}
                </div>
              )}
            </div>
          );
        })}

        {map.slots.map((sl, idx) => {
          const side = idx % 2 === 0 ? 'left' : 'right';
          const sx = side === 'left' ? 20 + (idx * 8) % 160 : map.width - 130 - (idx * 8) % 160;
          const sy = 20 + Math.floor(idx / 2) * 30;
          const current = state.slotFill[sl.id] || 0;
          const pending = pendingAllocations[sl.id] || 0;
          const total = current + pending;
          const pct = Math.min(100, (total / sl.capacity) * 100);
          const rt = state.resources[sl.resourceType] || 0;
          const pendingThisType = Object.entries(pendingAllocations).reduce((acc, [sid, v]) => {
            const s = map.slots.find(x => x.id === sid);
            return s && s.resourceType === sl.resourceType ? acc + v : acc;
          }, 0);
          const realMaxAdd = Math.min(
            sl.capacity - current,
            rt - pendingThisType + pending
          );
          return (
            <div
              key={sl.id}
              className="board-slot"
              style={{ left: sx, top: sy }}
            >
              <div className="slot-name">
                {RESOURCE_ICONS[sl.resourceType]} {sl.name}
              </div>
              <div className="slot-bar">
                <div className="slot-fill" style={{ width: `${pct}%` }}>
                  <div className="slot-current" style={{ width: `${(current / Math.max(total, 1)) * 100}%` }} />
                  {pending > 0 && (
                    <div className="slot-pending" style={{ width: `${(pending / Math.max(total, 1)) * 100}%` }} />
                  )}
                </div>
                <span className="slot-text">{total}/{sl.capacity}</span>
              </div>
              <div className="slot-input">
                <button
                  className="mini-btn"
                  disabled={pending <= 0}
                  onClick={() => setAllocation(sl.id, pending - 1)}
                >−</button>
                <span className="pend-val">{pending > 0 ? pending : '·'}</span>
                <button
                  className="mini-btn"
                  disabled={realMaxAdd - pending <= 0}
                  onClick={() => setAllocation(sl.id, pending + 1)}
                >＋</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="board-metrics">
        <div className="metric risk">
          <span className="metric-label">午号风险</span>
          <div className="bar"><div className="bar-fill red" style={{ width: `${Math.min(100, state.wuRisk)}%` }} /></div>
          <span className="metric-val">{state.wuRisk}</span>
        </div>
        <div className="metric reward">
          <span className="metric-label">丁号奖励</span>
          <span className="metric-val gold">+{state.dingReward}</span>
        </div>
        <div className="metric failure">
          <span className="metric-label">己号失败因子</span>
          <span className="metric-val red">{state.jiFailure}</span>
        </div>
        <div className="metric resources">
          {Object.entries(state.resources).map(([k, v]) => (
            <div key={k} className="res-chip">
              {RESOURCE_ICONS[k]} {k === 'candle' ? '烛芯' : k === 'oil' ? '灯油' : k === 'breeze' ? '风引' : '镇符'}：<b>{v}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
