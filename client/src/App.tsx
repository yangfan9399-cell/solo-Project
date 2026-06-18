import React, { useEffect } from 'react';
import { useGameStore } from './store';
import GameBoard from './components/GameBoard';
import EventBox from './components/EventBox';
import ReplayAxis from './components/ReplayAxis';
import SettleBook from './components/SettleBook';

const App: React.FC = () => {
  const {
    loadMeta, startPhase, resumeFromSave, phaseMetaList,
    phase, error, isLoading, state, resetPhase, triggerSettle
  } = useGameStore();

  useEffect(() => {
    (async () => {
      await loadMeta();
      const resumed = await resumeFromSave();
      if (!resumed) {
        // 不自动启动，等待用户选择
      }
    })();
  }, []);

  const phaseConfig = phaseMetaList.find(p => p.phase === phase);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-ic">🏮</span>
          <h1>雾港灯阵资源配给盘</h1>
        </div>
        <div className="phase-switcher">
          {phaseMetaList.map(p => (
            <button
              key={p.phase}
              className={`phase-btn ${state && state.phase === p.phase ? 'active' : ''} ${p.teaching ? 'teaching' : ''}`}
              onClick={() => startPhase(p.phase)}
              disabled={isLoading}
            >
              {p.phaseName.split(' · ')[0]}
              {p.teaching && <span className="phase-tag">学</span>}
              {p.hiddenCondition && <span className="phase-tag">隐</span>}
            </button>
          ))}
          {state && (
            <>
              <button className="phase-btn reset" onClick={resetPhase} disabled={isLoading}>🔁重开</button>
              <button className="phase-btn settle" onClick={triggerSettle} disabled={isLoading}>🧮结算</button>
            </>
          )}
        </div>
      </header>

      {error && <div className="error-bar">⚠️ {error}</div>}

      {phaseConfig && (
        <div className="phase-desc">
          <div className="phase-desc-main">
            <b>{phaseConfig.phaseName}</b>：{phaseConfig.description}
          </div>
          {phaseConfig.formulaMeta && (
            <div className="phase-formula-mini">
              <span className="formula-ic">📜</span>
              <span className="formula-mini-name">{phaseConfig.formulaMeta.name}</span>
              <span className="formula-mini-diff">
                达标线 <b>{phaseConfig.formulaMeta.threshold}</b>
                {phase === 'wu' && ' · 风险阈值 60 · 丁号 ×3'}
                {phase === 'ding' && ' · 量测×0.9衰减 · 风险阈值 50 · 丁号 ×5'}
                {phase === 'ji' && ' · 己号×6重罚 · 风险阈值 70'}
              </span>
            </div>
          )}
          {phaseConfig.hiddenCondition && (
            <div className="hidden-hint">
              <span className="hint-ic">✨</span> 隐藏条件：
              <b>{phaseConfig.hiddenCondition.name}</b> —
              {phaseConfig.hiddenCondition.description}（奖励 +{phaseConfig.hiddenCondition.bonus}）
            </div>
          )}
        </div>
      )}

      <main className="app-main">
        <section className="col-left">
          <GameBoard />
          <EventBox />
        </section>
        <section className="col-right">
          <SettleBook />
          <ReplayAxis />
        </section>
      </main>

      <footer className="app-footer">
        <span>※ 每一步操作均写入回放轴并持久化，刷新后可继续当前局。最终结算由后端按量测值与调度步骤重算。</span>
      </footer>
    </div>
  );
};

export default App;
