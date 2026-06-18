import React from 'react';
import { useGameStore } from '../store';

const SettleBook: React.FC = () => {
  const { settleResult, showSettle, setShowSettle, triggerSettle, resetPhase, startPhase, phase, state, isLoading, phaseMetaList } = useGameStore();

  if (!settleResult) {
    return (
      <div className="settle-box">
        <div className="box-title">🧮 结算簿</div>
        {state && !state.gameOver ? (
          <div className="settle-pre">
            <div className="pre-tip">本局尚未结束，可提前模拟结算查看当前局势。</div>
            <button className="sim-btn" onClick={triggerSettle} disabled={isLoading}>
              🔍 模拟当前结算
            </button>
          </div>
        ) : (
          <div className="box-empty">对局结束后可在此查看后端重算的最终结算。</div>
        )}
      </div>
    );
  }

  return (
    <div className="settle-box">
      <div className="box-title-row">
        <div className="box-title">🧮 结算簿 · {settleResult.phaseName}</div>
        <button className="ghost-btn" onClick={() => setShowSettle(false)}>收起</button>
      </div>

      <div className={`settle-head ${settleResult.victory ? 'win' : 'lose'}`}>
        <div className="settle-verdict">
          {settleResult.victory ? '🏆 局段达成' : '💔 局段未达成'}
        </div>
        <div className="settle-score">
          最终得分 <span className="score-val">{settleResult.finalScore}</span>
        </div>
        <div className="settle-threshold">
          达标线：{phaseMetaList.find(p => p.phase === settleResult.phase)?.victoryThreshold || '—'}
        </div>
        {settleResult.hiddenConditionTriggered && (
          <div className="settle-hidden">
            ✨ 隐藏条件触发：{settleResult.hiddenConditionName}
          </div>
        )}
      </div>

      <div className="settle-details">
        {settleResult.details.map((d, i) => (
          <div key={i} className="settle-row">
            <span className="settle-label">{d.label}</span>
            <span className={`settle-val ${d.value >= 0 ? 'pos' : 'neg'}`}>
              {d.value >= 0 ? '+' : ''}{d.value}
            </span>
          </div>
        ))}
        <div className="settle-row total">
          <span className="settle-label">合计</span>
          <span className="settle-val">{settleResult.finalScore}</span>
        </div>
      </div>

      <div className="settle-summary">
        <div>调度步数：<b>{settleResult.stepsCount}</b> 步</div>
        <div>灯阵量测合计：<b>{settleResult.measurementScore}</b></div>
        <div>熏染痕罚分：<b className="neg">−{settleResult.stainPenalty}</b></div>
      </div>

      <div className="settle-actions">
        <button className="primary-btn" onClick={resetPhase} disabled={isLoading}>🔁 重开本局</button>
        <div className="jump-actions">
          {settleResult.phase !== 'wu' && (
            <button className="ghost-btn" onClick={() => startPhase('wu')}>午局</button>
          )}
          {settleResult.phase !== 'ding' && (
            <button className="ghost-btn" onClick={() => startPhase('ding')}>丁局</button>
          )}
          {settleResult.phase !== 'ji' && (
            <button className="ghost-btn" onClick={() => startPhase('ji')}>己局</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettleBook;
