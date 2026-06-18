import { StepRecord } from '../types';
import { useState } from 'react';

interface ReplayAxisProps {
  steps: StepRecord[];
}

export function ReplayAxis({ steps }: ReplayAxisProps) {
  const [hoverStep, setHoverStep] = useState<number | null>(null);

  return (
    <div className="replay-axis">
      <h2 className="section-title">回放轴（共 {steps.length} 步）</h2>
      <div className="replay-track">
        {steps.map((s, idx) => (
          <div
            key={s.step}
            className={`replay-dot ${idx === steps.length - 1 ? 'replay-current' : ''} ${
              hoverStep === idx ? 'replay-hover' : ''
            }`}
            onMouseEnter={() => setHoverStep(idx)}
            onMouseLeave={() => setHoverStep(null)}
          >
            <div className="replay-marker">{s.step}</div>
            {hoverStep === idx && (
              <div className="replay-tooltip">
                <div>位置：({s.position.x}, {s.position.y})</div>
                <div>点亮值：{s.field.lightValue}</div>
                <div>奖励/风险：{s.field.rewardD}/{s.field.riskA}</div>
                {s.eventsTriggered.length > 0 && (
                  <div>事件: {s.eventsTriggered.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="replay-path">
        航线：{steps.map((s) => `(${s.position.x},${s.position.y})`).join(' → ')}
      </div>
    </div>
  );
}
