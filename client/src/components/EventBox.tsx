import React from 'react';
import { useGameStore } from '../store';

const typeLabel: Record<string, string> = {
  blessing: '福泽',
  hazard: '灾厄',
  mystery: '谜光',
  choice: '抉择'
};

const typeClass: Record<string, string> = {
  blessing: 'ev-blessing',
  hazard: 'ev-hazard',
  mystery: 'ev-mystery',
  choice: 'ev-choice'
};

const EventBox: React.FC = () => {
  const { state, currentEvent, submitStep, pendingAllocations, isLoading } = useGameStore();

  const hasAlloc = Object.values(pendingAllocations).some(v => v > 0);
  const needChoice = currentEvent?.type === 'choice' && (currentEvent.choices?.length || 0) > 0;

  if (!state) {
    return (
      <div className="event-box">
        <div className="box-title">📜 事件匣</div>
        <div className="box-empty">尚未开局，事件匣处于封印状态。</div>
      </div>
    );
  }

  if (state.gameOver) {
    return (
      <div className="event-box">
        <div className="box-title">📜 事件匣</div>
        <div className="box-empty">局段已结束，可在结算簿中查看最终结果。</div>
      </div>
    );
  }

  return (
    <div className="event-box">
      <div className="box-title">📜 事件匣 · 第{state.round}回合</div>
      {currentEvent ? (
        <div className={`event-card ${typeClass[currentEvent.type]}`}>
          <div className="event-head">
            <span className={`ev-type ${typeClass[currentEvent.type]}`}>【{typeLabel[currentEvent.type]}】</span>
            <span className="ev-title">{currentEvent.title}</span>
          </div>
          <div className="ev-desc">{currentEvent.description}</div>
          {currentEvent.effects.length > 0 && !needChoice && (
            <div className="ev-effects">
              {currentEvent.effects.map((e, i) => (
                <span key={i} className={`effect-chip ${e.delta >= 0 ? 'pos' : 'neg'}`}>
                  {formatEffect(e)}
                </span>
              ))}
            </div>
          )}
          {needChoice && currentEvent.choices && (
            <div className="ev-choices">
              {currentEvent.choices.map((c, idx) => (
                <button
                  key={idx}
                  className="choice-btn"
                  disabled={!hasAlloc || isLoading}
                  onClick={() => submitStep(idx)}
                >
                  <div className="choice-label">{c.label}</div>
                  <div className="choice-desc">{c.description}</div>
                  <div className="choice-effects">
                    {c.effects.map((e, i) => (
                      <span key={i} className={`effect-chip ${e.delta >= 0 ? 'pos' : 'neg'}`}>
                        {formatEffect(e)}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="event-empty">本回合无事件，可自由调配资源。</div>
      )}
      <div className="submit-row">
        {!needChoice && (
          <button
            className="submit-btn"
            disabled={!hasAlloc || isLoading}
            onClick={() => submitStep()}
          >
            {isLoading ? '施法中...' : (hasAlloc ? '⚡ 执行资源调度并推进回合' : '请先在局面盘中调配资源')}
          </button>
        )}
        {needChoice && (
          <div className="choice-hint">⬆️ 请选择选项以推进回合（必须先调配资源）</div>
        )}
      </div>
    </div>
  );
};

function formatEffect(e: any): string {
  const targetMap: Record<string, string> = {
    measurement: '灯阵量测',
    resource: '资源',
    stain: '熏染痕',
    wuRisk: '午号风险',
    dingReward: '丁号奖励',
    jiFailure: '己号失败因子'
  };
  const base = targetMap[e.target] || e.target;
  const sign = e.delta >= 0 ? '+' : '';
  const tId = e.targetId ? `(${short(e.targetId)})` : '';
  return `${base}${tId} ${sign}${e.delta}`;
}

function short(id: string): string {
  const table: Record<string, string> = {
    'w-n1': '迎潮台', 'w-n2': '中流塔', 'w-n3': '送舟门', 'w-n4': '浅湾浮', 'w-n5': '归航标',
    'd-n1': '暗礁灯', 'd-n2': '十字塔', 'd-n3': '孤门', 'd-n4': '雾中浮', 'd-n5': '断链标', 'd-n6': '险流标',
    'j-n1': '墟门', 'j-n2': '转心塔', 'j-n3': '冥渡台', 'j-n4': '忘川浮', 'j-n5': '三生标', 'j-n6': '彼岸标', 'j-n7': '归墟眼',
    'candle': '烛芯', 'oil': '灯油', 'breeze': '风引', 'talisman': '镇符'
  };
  return table[id] || id;
}

export default EventBox;
