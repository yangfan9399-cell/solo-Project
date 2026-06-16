import { component$ } from '@builder.io/qwik';
import type { GameLevel } from '~/game/types';
import { getReputationLevelName } from '~/game/engine';

interface LevelSelectProps {
  levels: GameLevel[];
  currentLevelId: number;
  completedLevels: number[];
  reputation: number;
  onSelectLevel$: (levelId: number) => void;
}

export const LevelSelect = component$<LevelSelectProps>((props) => {
  const { levels, currentLevelId, completedLevels, reputation, onSelectLevel$ } = props;

  return (
    <div class="panel">
      <h3 class="panel-title">关卡选择</h3>
      <div class="grid">
        {levels.map((level) => {
          const isCompleted = completedLevels.includes(level.id);
          const isUnlocked = level.id === 1 || completedLevels.includes(level.id - 1);
          const isCurrent = level.id === currentLevelId;

          return (
            <div
              key={level.id}
              class={{
                'level-card': true,
                'level-completed': isCompleted,
                'level-locked': !isUnlocked,
                'level-current': isCurrent,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h4 style={{ color: 'var(--color-accent)' }}>
                  第{level.id}关 · {level.name}
                </h4>
                {isCompleted && <span class="badge badge-success">已通关</span>}
                {!isUnlocked && <span class="badge">未解锁</span>}
                {isCurrent && !isCompleted && <span class="badge badge-warning">进行中</span>}
              </div>

              <p class="text-dim" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                {level.description}
              </p>

              <div class="stat">
                <span class="stat-label">难度</span>
                <span class={{
                  'stat-value': true,
                  'text-success': level.difficulty === 'easy',
                  'text-warning': level.difficulty === 'medium',
                  'text-danger': level.difficulty === 'hard',
                }}>
                  {level.difficulty === 'easy' ? '简单' : level.difficulty === 'medium' ? '中等' : '困难'}
                </span>
              </div>
              <div class="stat">
                <span class="stat-label">天数</span>
                <span class="stat-value">{level.days} 天</span>
              </div>
              <div class="stat">
                <span class="stat-label">初始铜钱</span>
                <span class="stat-value text-accent">{level.startCopper} 文</span>
              </div>
              <div class="stat">
                <span class="stat-label">初始声望</span>
                <span class="stat-value text-success">{level.startReputation}</span>
              </div>
              <div class="stat">
                <span class="stat-label">通关条件</span>
                <span class="stat-value text-dim" style={{ fontSize: '0.8rem' }}>
                  {level.passCondition.minCopper}文 / {level.passCondition.minReputation}声望 / {Math.round(level.passCondition.minAccuracy * 100)}%精度
                </span>
              </div>

              <button
                class="btn"
                style={{ width: '100%', marginTop: '0.75rem' }}
                onClick$={() => onSelectLevel$(level.id)}
                disabled={!isUnlocked}
              >
                {isCompleted ? '再次挑战' : isCurrent ? '继续游戏' : '开始挑战'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});
