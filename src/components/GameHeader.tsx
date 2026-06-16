import { component$ } from '@builder.io/qwik';
import type { GameSession, GameLevel } from '~/game/types';
import { getReputationLevelName } from '~/game/engine';

interface GameHeaderProps {
  session: GameSession;
  level: GameLevel;
  onUndo$?: () => void;
  onRedo$?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSettle$?: () => void;
  onBack$?: () => void;
}

export const GameHeader = component$<GameHeaderProps>((props) => {
  const { session, level, onUndo$, onRedo$, canUndo, canRedo, onSettle$, onBack$ } = props;
  const reputationName = getReputationLevelName(session.reputation);

  return (
    <div class="panel game-header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 class="text-accent" style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>
            第{level.id}关 · {level.name}
          </h2>
          <div class="text-dim" style={{ fontSize: '0.9rem' }}>
            第 <span class="text-accent">{session.currentDay}</span> / {session.totalDays} 天
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div class="stat" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', padding: 0 }}>
            <span class="stat-label">铜钱</span>
            <span class="stat-value text-accent" style={{ fontSize: '1.3rem' }}>
              {session.copper} 文
              <span class="text-dim" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                (目标: {level.passCondition.minCopper})
              </span>
            </span>
          </div>
          <div class="stat" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', padding: 0 }}>
            <span class="stat-label">声望 ({reputationName})</span>
            <span class="stat-value text-success" style={{ fontSize: '1.3rem' }}>
              {session.reputation}
              <span class="text-dim" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                (目标: {level.passCondition.minReputation})
              </span>
            </span>
          </div>
          <div class="stat" style={{ flexDirection: 'column', alignItems: 'flex-start', border: 'none', padding: 0 }}>
            <span class="stat-label">气温</span>
            <span class="stat-value" style={{ fontSize: '1.3rem' }}>
              {session.environment.temperature.toFixed(1)}°C
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {onBack$ && (
            <button class="btn btn-secondary" onClick$={onBack$}>
              返回
            </button>
          )}
          {onUndo$ && (
            <button class="btn btn-secondary" onClick$={onUndo$} disabled={!canUndo}>
              撤销
            </button>
          )}
          {onRedo$ && (
            <button class="btn btn-secondary" onClick$={onRedo$} disabled={!canRedo}>
              重做
            </button>
          )}
          {onSettle$ && (
            <button class="btn" onClick$={onSettle$}>
              结算
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
