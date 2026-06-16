import { component$, $, useSignal, useTask$ } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { getAllLevels, getSessionsByPlayer } from '~/lib/repositories';

export const useGameLobbyData = routeLoader$(async (requestEvent) => {
  const levels = await getAllLevels();
  const playerIdCookie = requestEvent.cookie.get('current_player_id');
  const playerId = playerIdCookie ? Number(playerIdCookie.value) : null;
  const recentSessions = playerId ? await getSessionsByPlayer(playerId, 5) : [];

  return { levels, playerId, recentSessions };
});

function useCurrentPlayerId() {
  const id = useSignal<string | null>(null);

  useTask$(() => {
    const match = document.cookie.match(/current_player_id=([^;]+)/);
    id.value = match ? decodeURIComponent(match[1]) : null;
  });

  return id;
}

export default component$(() => {
  const data = useGameLobbyData();
  const nav = useNavigate();
  const currentPlayerId = useCurrentPlayerId();
  const errorMsg = useSignal<string>('');
  const creatingSession = useSignal<number | null>(null);

  const startGame = $(async (levelId: number) => {
    errorMsg.value = '';
    if (!currentPlayerId.value) {
      errorMsg.value = '请先在玩家档案页面选择或创建玩家';
      return;
    }

    creatingSession.value = levelId;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: Number(currentPlayerId.value),
          levelId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        await nav(`/game/${result.data.id}`);
      } else {
        if (result.error?.includes('已有进行中的局次') && result.data?.sessionId) {
          await nav(`/game/${result.data.sessionId}`);
        } else {
          errorMsg.value = result.error || '创建局次失败';
        }
      }
    } catch (e) {
      errorMsg.value = '网络错误，请重试';
    } finally {
      creatingSession.value = null;
    }
  });

  const difficultyColors = ['#00ff88', '#00e5ff', '#ffcc00', '#ff6b35', '#ff3366'];
  const difficultyLabels = ['入门', '简单', '中等', '困难', '专家'];

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', color: '#00e5ff', marginBottom: '10px' }}>🎮 游戏大厅</h1>
          <p style={{ color: '#8899bb' }}>选择关卡，开始你的太空电梯调度任务</p>
        </div>
        {!currentPlayerId.value && (
          <a href="/profile" style={{ textDecoration: 'none' }}>
            <button class="btn btn-danger">⚠️ 请先选择玩家</button>
          </a>
        )}
      </div>

      {errorMsg.value && (
        <div style={{
          background: 'rgba(255, 51, 102, 0.15)',
          border: '1px solid #ff3366',
          color: '#ff3366',
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
        }}>
          {errorMsg.value}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {data.value.levels.map((level) => {
          const diffColor = difficultyColors[Math.min(level.difficulty - 1, 4)];
          const diffLabel = difficultyLabels[Math.min(level.difficulty - 1, 4)];

          return (
            <div key={level.id} class="panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#e8f0ff' }}>{level.name}</h2>
                <span style={{
                  background: `${diffColor}22`,
                  color: diffColor,
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  border: `1px solid ${diffColor}55`,
                }}>
                  {diffLabel}
                </span>
              </div>

              <p style={{ color: '#8899bb', fontSize: '0.9rem', lineHeight: '1.6', minHeight: '48px' }}>
                {level.description}
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                padding: '12px',
                background: 'rgba(10, 14, 26, 0.5)',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}>
                <div>
                  <span style={{ color: '#8899bb' }}>目标楼层: </span>
                  <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>{level.target_floor}</span>
                </div>
                <div>
                  <span style={{ color: '#8899bb' }}>基础分数: </span>
                  <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{level.base_score.toLocaleString()}</span>
                </div>
                <div>
                  <span style={{ color: '#8899bb' }}>初始能量: </span>
                  <span style={{ color: '#ffcc00', fontWeight: 'bold' }}>{level.initial_energy}</span>
                </div>
                <div>
                  <span style={{ color: '#8899bb' }}>时间限制: </span>
                  <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>{level.time_limit}s</span>
                </div>
              </div>

              <button
                class="btn btn-primary"
                style={{ marginTop: 'auto', padding: '12px' }}
                onClick$={() => startGame(level.id)}
                disabled={creatingSession.value === level.id || !currentPlayerId.value}
              >
                {creatingSession.value === level.id ? '创建中...' : '🚀 开始挑战'}
              </button>
            </div>
          );
        })}
      </div>

      {data.value.recentSessions.length > 0 && (
        <div class="panel" style={{ padding: '25px' }}>
          <h3 style={{ color: '#00e5ff', marginBottom: '18px', fontSize: '1.2rem' }}>📋 最近战绩</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.value.recentSessions.map((s) => (
              <div key={s.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '12px 16px',
                background: 'rgba(10, 14, 26, 0.5)',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '1.3rem' }}>
                  {s.status === 'won' ? '✅' : s.status === 'lost' ? '❌' : s.status === 'playing' ? '⏳' : '🚫'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e8f0ff', fontWeight: 500 }}>
                    {s.status === 'won' ? '通关' : s.status === 'lost' ? '失败' : s.status === 'playing' ? '进行中' : '放弃'}
                    {' '}· 到达 {s.current_floor}/{s.target_floor} 层
                  </div>
                  <div style={{ color: '#8899bb', fontSize: '0.8rem' }}>{s.created_at}</div>
                </div>
                <div style={{ color: '#00ff88', fontWeight: 'bold' }}>
                  {s.score.toLocaleString()}
                </div>
                {s.status === 'playing' && (
                  <a href={`/game/${s.id}`} style={{ textDecoration: 'none' }}>
                    <button class="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>继续</button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
