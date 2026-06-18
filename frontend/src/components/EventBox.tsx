import { StepRecord, MazeConfig } from '../types';

interface EventBoxProps {
  maze: MazeConfig;
  steps: StepRecord[];
}

export function EventBox({ maze, steps }: EventBoxProps) {
  const recentEvents: { step: number; eventIds: string[] }[] = [];
  steps.forEach((s) => {
    if (s.eventsTriggered.length > 0) {
      recentEvents.push({ step: s.step, eventIds: s.eventsTriggered });
    }
  });
  const displayed = recentEvents.slice(-8).reverse();

  const resolveEvent = (id: string) => {
    if (id === 'hidden_awakening') {
      return { name: '隐藏觉醒', type: 'hidden' as const, description: '隐藏封印全面激活！点亮值+8，丁号奖励+3' };
    }
    if (id === 'hidden_revealed') {
      return { name: '隐藏格揭示', type: 'hidden' as const, description: '点亮值+4，丁号奖励+2' };
    }
    return maze.events[id];
  };

  return (
    <div className="event-box">
      <h2 className="section-title">事件匣</h2>
      <div className="event-list">
        {displayed.length === 0 && (
          <div className="event-empty">尚未触发事件，探索迷宫...</div>
        )}
        {displayed.map(({ step, eventIds }) => (
          eventIds.map((eid) => {
            const evt = resolveEvent(eid);
            if (!evt) return null;
            return (
              <div key={`${step}-${eid}`} className={`event-item event-${evt.type}`}>
                <div className="event-step">第{step}步</div>
                <div className="event-body">
                  <div className="event-name">{evt.name}</div>
                  <div className="event-desc">{evt.description}</div>
                </div>
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}
