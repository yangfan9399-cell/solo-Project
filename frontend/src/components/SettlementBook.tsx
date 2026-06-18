import { Settlement } from '../types';

interface SettlementBookProps {
  settlement: Settlement | null;
  loading: boolean;
  onCalculate: () => void;
}

export function SettlementBook({ settlement, loading, onCalculate }: SettlementBookProps) {
  return (
    <div className="settlement-book">
      <h2 className="section-title">结算簿</h2>
      <button className="btn btn-primary" onClick={onCalculate} disabled={loading}>
        {loading ? '推演中...' : '后端重算结算'}
      </button>
      {settlement && (
        <div className="settlement-content">
          <div className="settlement-grade">
            <span className={`grade grade-${settlement.grade}`}>{settlement.grade}</span>
            <div className="settlement-score">{settlement.finalScore} 分</div>
          </div>
          <div className="settlement-breakdown">
            <div className="breakdown-row">
              <span>蜡封迷宫点亮值分</span>
              <span>{settlement.lightScore}</span>
            </div>
            <div className="breakdown-row">
              <span>路径解谜步骤分</span>
              <span>{settlement.stepScore}</span>
            </div>
            <div className="breakdown-row">
              <span>奖励/风险/隐藏加成</span>
              <span>{settlement.bonusScore}</span>
            </div>
          </div>
          <div className="settlement-details">
            {settlement.details.map((d, i) => (
              <div key={i} className="detail-line">· {d}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
