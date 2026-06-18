import React from 'react';
import { useGameStore } from '../store';
import { RESOURCE_ICONS, MAPS } from '../config';

const ReplayAxis: React.FC = () => {
  const { state, map, replayToStep, isLoading, clearSave, phase } = useGameStore();

  if (!state) {
    return (
      <div className="replay-box">
        <div className="box-title">⏳ 回放轴</div>
        <div className="box-empty">尚未开始，无回放记录。</div>
      </div>
    );
  }

  const nodeNames: Record<string, string> = {};
  map.nodes.forEach(n => { nodeNames[n.id] = n.name; });
  const slotNames: Record<string, { name: string; type: string }> = {};
  map.slots.forEach(s => { slotNames[s.id] = { name: s.name, type: s.resourceType }; });

  const steps = state.steps;

  return (
    <div className="replay-box">
      <div className="box-title-row">
        <div className="box-title">⏳ 回放轴 · {steps.length} 步记录</div>
        <button className="ghost-btn" onClick={() => { clearSave(); }}>清空存档</button>
      </div>

      <div className="replay-track">
        {steps.length === 0 && (
          <div className="track-empty">完成第一步调度后，这里将生成回放节点。</div>
        )}
        {steps.map((st, idx) => {
          const isLast = idx === steps.length - 1;
          const allocCount = st.allocations.reduce((s, a) => s + a.amount, 0);
          return (
            <div key={idx} className={`track-node ${isLast ? 'active' : ''}`}>
              <div className="track-dot" onClick={() => !isLoading && replayToStep(idx + 1)} title={`点击回放到此步之后`}>
                {idx + 1}
              </div>
              <div className="track-line" />
              <div className="track-card">
                <div className="track-head">
                  <span className="track-round">回合{st.round}</span>
                  {st.eventId && <span className="track-event">📌 {st.eventId}</span>}
                  {st.choiceIndex !== undefined && <span className="track-choice">→ 选项{st.choiceIndex + 1}</span>}
                </div>
                <div className="track-body">
                  {st.allocations.length > 0 ? (
                    <div className="track-allocs">
                      {st.allocations.map(a => {
                        const info = slotNames[a.slotId];
                        if (!info) return null;
                        return (
                          <span key={a.slotId} className="track-chip">
                            {RESOURCE_ICONS[info.type]} {info.name} +{a.amount}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="track-noalloc">无资源调度</div>
                  )}
                  <div className="track-stats">
                    <span>⚡量测和 {sum(st.measurements)}</span>
                    <span className={st.wuRisk > 60 ? 'neg' : ''}>🌡️风险 {st.wuRisk}</span>
                    <span className="gold">💰奖励 {st.dingReward}</span>
                    {st.jiFailure > 0 && <span className="neg">💥失败 {st.jiFailure}</span>}
                    {st.stains.length > 0 && <span>🌫️熏染 {st.stains.reduce((a, b) => a + b.intensity, 0)}</span>}
                  </div>
                </div>
                {!isLast && (
                  <button
                    className="replay-btn"
                    disabled={isLoading}
                    onClick={() => replayToStep(idx + 1)}
                  >
                    回退至此
                  </button>
                )}
                {isLast && <div className="track-current">📍 当前局面</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function sum(obj: Record<string, number>): number {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

export default ReplayAxis;
