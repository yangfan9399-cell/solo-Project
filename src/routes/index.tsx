import { component$, useVisibleTask$, useSignal, $ } from '@builder.io/qwik';
import { useNavigate } from '@builder.io/qwik-city';
import { PlayerProfileCard } from '~/components/PlayerProfileCard';
import { LevelSelect } from '~/components/LevelSelect';
import { loadPlayer, savePlayer, loadAllSessions, clearAllGameData, getInitialLevels } from '~/game/storage';
import type { PlayerProfile, GameSession, GameLevel } from '~/game/types';
import { getReputationLevelName } from '~/game/engine';

export default component$(() => {
  const nav = useNavigate();
  const player = useSignal<PlayerProfile | null>(null);
  const levels = useSignal<GameLevel[]>([]);
  const sessions = useSignal<GameSession[]>([]);

  useVisibleTask$(() => {
    player.value = loadPlayer();
    levels.value = getInitialLevels();
    sessions.value = loadAllSessions();
  });

  const handleNameChange = $((name: string) => {
    if (player.value) {
      player.value.name = name;
      savePlayer(player.value);
    }
  });

  const handleReset = $(() => {
    clearAllGameData();
    player.value = loadPlayer();
    sessions.value = loadAllSessions();
  });

  const handleSelectLevel = $((levelId: number) => {
    nav(`/play?level=${levelId}`);
  });

  const handleContinueSession = $((sessionId: string) => {
    nav(`/play?session=${sessionId}`);
  });

  return (
    <div class="container">
      <div class="home-hero">
        <h1>⏳ 古代水钟校时经营</h1>
        <p>调节漏壶孔径，校准浮标刻度，顺应寒暑变化，经营一方水钟铺</p>
        {player.value && (
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div>
              <span class="text-dim">匠人: </span>
              <span class="text-accent" style={{ fontSize: '1.2rem' }}>{player.value.name}</span>
            </div>
            <div>
              <span class="text-dim">等级: </span>
              <span class="text-success" style={{ fontSize: '1.2rem' }}>
                {getReputationLevelName(player.value.reputation)}
              </span>
            </div>
            <div>
              <span class="text-dim">已通关: </span>
              <span class="text-accent" style={{ fontSize: '1.2rem' }}>{player.value.completedLevels.length} 关</span>
            </div>
          </div>
        )}
      </div>

      <div class="row">
        <div class="col">
          {player.value && (
            <PlayerProfileCard
              player={player.value}
              onNameChange$={handleNameChange}
              onReset$={handleReset}
            />
          )}
        </div>
        <div class="col" style={{ flex: 2 }}>
          <div class="home-section">
            <h2>玩法说明</h2>
            <div class="instructions">
              <ol>
                <li><strong>接单</strong>：从订单列表中选择客户订单，不同客户有不同的精度要求和报酬</li>
                <li><strong>调孔</strong>：调节漏壶孔径大小，孔径越大水流越快，计时越短</li>
                <li><strong>调刻度</strong>：调整浮标刻度格数，刻度越多每格代表时间越短</li>
                <li><strong>看温度</strong>：水温会影响水流速度，温度越高流速越快</li>
                <li><strong>校时</strong>：点击校时按钮，查看实际计时与目标的误差</li>
                <li><strong>交付</strong>：合格的订单可获得铜钱和声望，不合格会损失声望</li>
                <li><strong>过关</strong>：达到关卡要求的铜钱、声望和平均精度即可通关</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div class="home-section">
        <h2>关卡挑战</h2>
        {player.value && (
          <LevelSelect
            levels={levels.value}
            currentLevelId={player.value.currentLevel}
            completedLevels={player.value.completedLevels}
            reputation={player.value.reputation}
            onSelectLevel$={handleSelectLevel}
          />
        )}
      </div>

      {sessions.value.length > 0 && (
        <div class="home-section">
          <h2>历史对局</h2>
          <div class="panel">
            <div class="sessions-list">
              {sessions.value.slice(0, 5).map((session) => {
                const level = levels.value.find((l) => l.id === session.levelId);
                return (
                  <div key={session.id} class="session-card">
                    <div class="session-info">
                      <div>
                        <strong>{level ? `${level.name}` : `第${session.levelId}关`}</strong>
                        <span class="text-dim" style={{ marginLeft: '0.75rem' }}>
                          第 {session.currentDay}/{session.totalDays} 天
                        </span>
                      </div>
                      <div class="text-dim" style={{ fontSize: '0.85rem' }}>
                        铜钱: {session.copper} · 声望: {session.reputation} ·
                        状态: {
                          session.status === 'playing' ? '进行中' :
                          session.status === 'won' ? '已通关' :
                          session.status === 'lost' ? '失败' : '已放弃'
                        }
                        {session.finalScore != null && ` · 得分: ${session.finalScore}`}
                      </div>
                    </div>
                    {session.status === 'playing' && (
                      <div class="session-actions">
                        <button class="btn" onClick$={() => handleContinueSession(session.id)}>
                          继续
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
