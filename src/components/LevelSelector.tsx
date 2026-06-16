import type { Level, PlayerProfile, GameSession } from '@/types/game';
import { listSessionsByPlayer } from '@/utils/storage';

interface LevelSelectorProps {
  levels: Level[];
  playerProfile: PlayerProfile | null;
  onSelectLevel: (levelId: string) => void;
  onResumeSession: (sessionId: string) => void;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: '入门', color: '#4caf50' },
  intermediate: { label: '进阶', color: '#2196f3' },
  expert: { label: '大师', color: '#f44336' },
};

function LevelSelector({ levels, playerProfile, onSelectLevel, onResumeSession }: LevelSelectorProps) {
  const sessions = playerProfile ? listSessionsByPlayer(playerProfile.id) : [];
  const activeSessions = sessions.filter((s) => s.status === 'playing');

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        padding: '24px',
      }}
    >
      {levels.map((level) => {
        const diff = difficultyConfig[level.difficulty] || difficultyConfig.beginner;
        const isUnlocked =
          !playerProfile ||
          !level.unlockRequirement ||
          playerProfile.totalScore >= level.unlockRequirement;
        const bestScore = playerProfile?.bestScores[level.id];
        let inProgressSession: GameSession | undefined;
        for (const s of activeSessions) {
          if (s.levelId === level.id) {
            inProgressSession = s;
            break;
          }
        }

        return (
          <div
            key={level.id}
            onClick={() => {
              if (isUnlocked) onSelectLevel(level.id);
            }}
            style={{
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
              opacity: isUnlocked ? 1 : 0.5,
              cursor: isUnlocked ? 'pointer' : 'not-allowed',
              transition: 'opacity 0.2s, transform 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (isUnlocked) {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>
                {level.name}
              </h3>
              <span
                style={{
                  background: diff.color,
                  color: '#fff',
                  fontSize: '12px',
                  padding: '2px 10px',
                  borderRadius: '10px',
                  fontWeight: 600,
                }}
              >
                {diff.label}
              </span>
            </div>

            <p
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '14px',
                margin: '0 0 14px 0',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: '1.5',
              }}
            >
              {level.description}
            </p>

            {bestScore !== undefined && (
              <div
                style={{
                  color: '#ffd700',
                  fontSize: '13px',
                  marginBottom: '10px',
                }}
              >
                最高分: {bestScore}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isUnlocked ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLevel(level.id);
                  }}
                  style={{
                    background: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  ▶ 开始
                </button>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  需要 {level.unlockRequirement} 分解锁
                </span>
              )}

              {isUnlocked && inProgressSession && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResumeSession(inProgressSession.id);
                  }}
                  style={{
                    background: '#2196f3',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  继续游戏
                </button>
              )}
            </div>

            {isUnlocked && (
              <span
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  fontSize: '11px',
                  color: '#4caf50',
                  background: 'rgba(76,175,80,0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                已解锁
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default LevelSelector;
