import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { getLeaderboard, getAllLevels } from '~/lib/repositories';

export const useLeaderboardData = routeLoader$(async (requestEvent) => {
  const levelId = requestEvent.query.get('levelId');
  const lid = levelId ? Number(levelId) : undefined;
  const leaderboard = await getLeaderboard(lid, 20);
  const levels = await getAllLevels();
  return { leaderboard, levels, selectedLevelId: lid };
});

export default component$(() => {
  const data = useLeaderboardData();
  const { leaderboard, levels, selectedLevelId } = data.value;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.2rem', color: '#ffcc00', marginBottom: '10px' }}>🏆 赛季排行榜</h1>
      <p style={{ color: '#8899bb', marginBottom: '30px' }}>全服最佳调度员战绩榜</p>

      <div class="panel" style={{ padding: '20px', marginBottom: '25px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#8899bb', marginRight: '10px' }}>筛选关卡:</span>
          <a href="/leaderboard" style={{ textDecoration: 'none' }}>
            <button
              class="btn"
              style={{
                background: !selectedLevelId ? 'linear-gradient(135deg, #00e5ff, #0099bb)' : undefined,
                color: !selectedLevelId ? '#050810' : undefined,
              }}
            >
              全部
            </button>
          </a>
          {levels.map((lv) => (
            <a href={`/leaderboard?levelId=${lv.id}`} key={lv.id} style={{ textDecoration: 'none' }}>
              <button
                class="btn"
                style={{
                  background: selectedLevelId === lv.id ? 'linear-gradient(135deg, #00e5ff, #0099bb)' : undefined,
                  color: selectedLevelId === lv.id ? '#050810' : undefined,
                }}
              >
                Lv.{lv.difficulty} {lv.name.split('：')[1] || lv.name}
              </button>
            </a>
          ))}
        </div>
      </div>

      <div class="panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 229, 255, 0.1)' }}>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#00e5ff', fontWeight: 600 }}>排名</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#00e5ff', fontWeight: 600 }}>玩家</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#00e5ff', fontWeight: 600 }}>关卡</th>
              <th style={{ padding: '16px 20px', textAlign: 'right', color: '#00e5ff', fontWeight: 600 }}>得分</th>
              <th style={{ padding: '16px 20px', textAlign: 'right', color: '#00e5ff', fontWeight: 600 }}>用时</th>
              <th style={{ padding: '16px 20px', textAlign: 'left', color: '#00e5ff', fontWeight: 600 }}>完成时间</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: '#8899bb' }}>
                  暂无排行数据，快去挑战第一名吧！
                </td>
              </tr>
            ) : (
              leaderboard.map((entry) => {
                const rankColors = ['#ffcc00', '#c0c0c0', '#cd7f32'];
                const rankColor = entry.rank <= 3 ? rankColors[entry.rank - 1] : '#8899bb';
                const rankBadge = entry.rank <= 3
                  ? ['🥇', '🥈', '🥉'][entry.rank - 1]
                  : `#${entry.rank}`;

                return (
                  <tr key={`${entry.player_id}-${entry.created_at}`} style={{ borderTop: '1px solid rgba(0, 229, 255, 0.1)' }}>
                    <td style={{ padding: '14px 20px', color: rankColor, fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {rankBadge}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#e8f0ff', fontWeight: 500 }}>
                      {entry.player_name}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#8899bb', fontSize: '0.9rem' }}>
                      {entry.level_name}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: '#00ff88', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {entry.score.toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right', color: '#8899bb', fontSize: '0.9rem' }}>
                      {Math.floor(entry.time_played / 60)}:{String(entry.time_played % 60).padStart(2, '0')}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#8899bb', fontSize: '0.85rem' }}>
                      {entry.created_at}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
