import { component$, useSignal, $, useTask$ } from '@builder.io/qwik';
import { routeLoader$, routeAction$, useLocation, Form } from '@builder.io/qwik-city';
import { getAllPlayers, createPlayer, getPlayerByName } from '~/lib/repositories';

export const usePlayers = routeLoader$(async () => {
  return getAllPlayers();
});

export const useCreatePlayerAction = routeAction$(async (data) => {
  const name = (data.name as string)?.trim();
  const avatar = (data.avatar as string) || '👨‍🚀';

  if (!name || name.length < 2) {
    return { success: false, error: '玩家名称至少需要 2 个字符' };
  }

  const existing = await getPlayerByName(name);
  if (existing) {
    return { success: false, error: '该玩家名称已存在' };
  }

  const player = await createPlayer(name, avatar);
  return { success: true, player };
});

export const useSelectPlayerAction = routeAction$(async (data, { cookie }) => {
  const playerId = Number(data.playerId);
  if (!playerId) {
    return { success: false, error: '请选择玩家' };
  }
  cookie.set('current_player_id', String(playerId), { path: '/', httpOnly: false, maxAge: [30, 'days'] });
  return { success: true, playerId };
});

function useCurrentPlayerId() {
  const loc = useLocation();
  const id = useSignal<string | null>(null);

  useTask$(() => {
    const match = document.cookie.match(/current_player_id=([^;]+)/);
    id.value = match ? decodeURIComponent(match[1]) : null;
  });

  return id;
}

export default component$(() => {
  const players = usePlayers();
  const createAction = useCreatePlayerAction();
  const selectAction = useSelectPlayerAction();
  const currentPlayerId = useCurrentPlayerId();
  const selectedAvatar = useSignal<string>('👨‍🚀');

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.2rem', color: '#00e5ff', marginBottom: '10px' }}>👤 玩家档案</h1>
      <p style={{ color: '#8899bb', marginBottom: '30px' }}>选择或创建你的玩家身份，记录每一次太空征程</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        <div class="panel" style={{ padding: '25px' }}>
          <h2 style={{ color: '#00ff88', marginBottom: '20px', fontSize: '1.3rem' }}>选择玩家</h2>

          {players.value.length === 0 ? (
            <p style={{ color: '#8899bb' }}>暂无玩家，请先创建一个。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {players.value.map((p) => (
                <Form action={selectAction} key={p.id}>
                  <input type="hidden" name="playerId" value={p.id} />
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: currentPlayerId.value === String(p.id)
                        ? 'rgba(0, 229, 255, 0.15)'
                        : 'rgba(10, 14, 26, 0.6)',
                      border: currentPlayerId.value === String(p.id)
                        ? '2px solid #00e5ff'
                        : '1px solid rgba(0, 229, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#e8f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{p.avatar}</span>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{p.name}</div>
                      <div style={{ color: '#8899bb', fontSize: '0.85rem', marginTop: '3px' }}>
                        总分 {p.total_score.toLocaleString()} · 胜场 {p.games_won}/{p.games_played}
                      </div>
                    </div>
                    {currentPlayerId.value === String(p.id) && (
                      <span style={{ color: '#00e5ff', fontSize: '0.85rem' }}>当前</span>
                    )}
                  </button>
                </Form>
              ))}
            </div>
          )}
        </div>

        <div class="panel" style={{ padding: '25px' }}>
          <h2 style={{ color: '#ff6b35', marginBottom: '20px', fontSize: '1.3rem' }}>创建新玩家</h2>

          <Form action={createAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', color: '#8899bb', marginBottom: '6px', fontSize: '0.9rem' }}>玩家名称</label>
              <input type="text" name="name" placeholder="输入玩家名称" style={{ width: '100%' }} required minLength={2} />
            </div>

            <div>
              <label style={{ display: 'block', color: '#8899bb', marginBottom: '6px', fontSize: '0.9rem' }}>选择头像</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {['👨‍🚀', '👩‍🚀', '🧑‍🚀', '👨‍🔬', '👩‍🔬', '🤖', '👽', '🛸'].map((a) => (
                  <label key={a} style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="avatar"
                      value={a}
                      style={{ display: 'none' }}
                      checked={selectedAvatar.value === a}
                      onChange$={() => { selectedAvatar.value = a; }}
                    />
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '1.8rem',
                        padding: '8px 10px',
                        border: selectedAvatar.value === a
                          ? '2px solid #00e5ff'
                          : '1px solid rgba(0, 229, 255, 0.2)',
                        borderRadius: '8px',
                        background: selectedAvatar.value === a
                          ? 'rgba(0, 229, 255, 0.15)'
                          : 'rgba(10, 14, 26, 0.6)',
                        transition: 'all 0.2s',
                      }}
                    >{a}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style={{ marginTop: '10px' }}>创建玩家</button>
          </Form>

          {createAction.value?.error && (
            <p style={{ color: '#ff3366', marginTop: '15px' }}>{createAction.value.error}</p>
          )}
          {createAction.value?.success && (
            <p style={{ color: '#00ff88', marginTop: '15px' }}>玩家创建成功！请在左侧选择该玩家开始游戏。</p>
          )}
        </div>
      </div>
    </div>
  );
});
