import { GameField } from '../types';

interface FieldDisplayProps {
  field: GameField;
  status: string;
  hiddenTriggered: boolean;
  winCondition: string;
  loseCondition: string;
}

export function FieldDisplay({ field, status, hiddenTriggered, winCondition, loseCondition }: FieldDisplayProps) {
  const statusColor = status === 'won' ? 'status-won' : status === 'lost' ? 'status-lost' : 'status-playing';
  const statusText = status === 'won' ? '推演成功' : status === 'lost' ? '推演失败' : '推演中';

  return (
    <div className="field-panel">
      <h2 className="section-title">蜡封迷宫局面字段</h2>
      <div className={`status-badge ${statusColor}`}>{statusText}</div>
      <div className="field-grid">
        <div className="field-item">
          <div className="field-label">蜡封迷宫点亮值</div>
          <div className="field-value light">{field.lightValue}</div>
        </div>
        <div className="field-item">
          <div className="field-label">蜡封迷宫描线槽</div>
          <div className="field-value groove">{field.grooveTracing.length}段</div>
        </div>
        <div className="field-item">
          <div className="field-label">蜡封迷宫倒排痕</div>
          <div className="field-value reverse">{field.reverseMark}</div>
        </div>
        <div className="field-item">
          <div className="field-label">甲号风险</div>
          <div className="field-value risk">{field.riskA}</div>
        </div>
        <div className="field-item">
          <div className="field-label">丁号奖励</div>
          <div className="field-value reward">{field.rewardD}</div>
        </div>
        <div className="field-item">
          <div className="field-label">乙号失败因子</div>
          <div className="field-value failure">{field.failureB}</div>
        </div>
      </div>
      {hiddenTriggered && (
        <div className="hidden-triggered">★ 隐藏条件已触发 ★</div>
      )}
      <div className="conditions">
        <div className="condition win">胜：{winCondition}</div>
        <div className="condition lose">负：{loseCondition}</div>
      </div>
    </div>
  );
}
