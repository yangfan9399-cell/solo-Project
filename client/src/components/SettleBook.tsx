import React from 'react';
import { useGameStore } from '../store';

const SettleBook: React.FC = () => {
  const { settleResult, showSettle, setShowSettle, triggerSettle, resetPhase, startPhase, phase, state, isLoading, phaseMetaList } = useGameStore();

  if (!settleResult) {
    const currentPhaseMeta = phaseMetaList.find(p => p.phase === phase);
    return (
      <div className="settle-box">
        <div className="box-title-row">
          <div className="box-title">🧮 结算簿</div>
          <div className="box-tag">{phase === 'wu' ? '学' : phase === 'ding' ? '缺' : '隐'}</div>
        </div>
        {currentPhaseMeta?.formulaMeta && (
          <div className="formula-preview">
            <div className="formula-preview-title">📜 本局胜负公式：{currentPhaseMeta.formulaMeta.name}</div>
            <div className="formula-preview-expr">{currentPhaseMeta.formulaMeta.expression}</div>
            <div className="formula-preview-desc">{currentPhaseMeta.formulaMeta.description}</div>
            <div className="formula-preview-threshold">达标线：<b>{currentPhaseMeta.formulaMeta.threshold}</b> 分</div>
            {currentPhaseMeta.formulaMeta.hiddenCondition && (
              <div className="formula-preview-hidden">
                ✨ 隐藏条件「{currentPhaseMeta.formulaMeta.hiddenCondition.name}」：
                {currentPhaseMeta.formulaMeta.hiddenCondition.description}（+{currentPhaseMeta.formulaMeta.hiddenCondition.bonus} 分）
              </div>
            )}
          </div>
        )}
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

  const { formula, breakdown, hiddenCheck, hiddenConditionTriggered } = settleResult;
  const currentMeta = phaseMetaList.find(p => p.phase === settleResult.phase);

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
          <span className="score-sep">/</span>
          <span className="score-thr">达标线 {currentMeta?.victoryThreshold || formula.threshold}</span>
        </div>
        <div className="settle-formula-name">使用公式：<b>{formula.name}</b></div>
        <div className="settle-formula-expr">{formula.expression}</div>
        <div className="settle-formula-desc">{formula.description}</div>
        {hiddenConditionTriggered && (
          <div className="settle-hidden settle-hidden-triggered">
            ✨ 隐藏条件触发：「{settleResult.hiddenConditionName}」<span className="settle-hidden-bonus">+{formula.hiddenCondition?.bonus || 150} 分</span>
          </div>
        )}
      </div>

      {hiddenCheck && (
        <div className={`hidden-check-card ${hiddenCheck.triggered ? 'triggered' : 'not-triggered'}`}>
          <div className="hidden-check-title">
            {hiddenCheck.triggered ? '✅' : '🔒'} 隐藏条件「{hiddenCheck.name}」{hiddenCheck.triggered ? '已触发' : '未触发'}
          </div>
          <div className="hidden-check-desc">{hiddenCheck.description}</div>
          <div className="hidden-check-grid">
            {hiddenCheck.checks.map((c, i) => (
              <div key={i} className={`hidden-check-item ${c.passed ? 'passed' : 'failed'}`}>
                <span className="hidden-check-label">{c.label}</span>
                <span className="hidden-check-actual">{c.actual}</span>
                <span className="hidden-check-req">{c.required}</span>
                <span className="hidden-check-mark">{c.passed ? '✓' : '✗'}</span>
              </div>
            ))}
          </div>
          <div className="hidden-check-bonus-line">
            奖励分：<b className={hiddenCheck.triggered ? 'pos' : ''}>{hiddenCheck.triggered ? `+${hiddenCheck.bonus}` : '—'}</b>
          </div>
        </div>
      )}

      <div className="breakdown-section">
        <div className="breakdown-title">📊 分步计算过程</div>
        <div className="breakdown-table">
          {breakdown.map((b, i) => (
            <div key={i} className="breakdown-row">
              <div className="breakdown-head">
                <span className="breakdown-label">{b.label}</span>
                {b.weight && <span className="breakdown-weight">{b.weight}</span>}
                <span className={`breakdown-value ${b.value >= 0 ? 'pos' : 'neg'}`}>
                  {b.value >= 0 ? '+' : ''}{b.value}
                </span>
              </div>
              <div className="breakdown-expr">{b.expression}</div>
            </div>
          ))}
          <div className="breakdown-row total">
            <div className="breakdown-head">
              <span className="breakdown-label">合计最终得分</span>
              <span className="breakdown-value total-val">{settleResult.finalScore}</span>
            </div>
          </div>
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
