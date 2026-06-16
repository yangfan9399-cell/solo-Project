import { component$ } from '@builder.io/qwik';
import type { DocumentHead } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#00e5ff', textShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}>
        🚀 太空电梯配重调度游戏
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#8899bb', marginBottom: '40px' }}>
        平衡配重 · 精准调度 · 征服星辰大海
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <Link href="/game" style={{ textDecoration: 'none' }}>
          <div class="panel" style={{ padding: '30px', cursor: 'pointer', transition: 'all 0.3s', height: '100%' }}>
            <h2 style={{ color: '#00e5ff', marginBottom: '15px', fontSize: '1.5rem' }}>🎮 开始游戏</h2>
            <p style={{ color: '#8899bb', lineHeight: '1.6' }}>
              进入游戏大厅，选择关卡开始你的太空电梯调度之旅。
            </p>
          </div>
        </Link>

        <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
          <div class="panel" style={{ padding: '30px', cursor: 'pointer', transition: 'all 0.3s', height: '100%' }}>
            <h2 style={{ color: '#ffcc00', marginBottom: '15px', fontSize: '1.5rem' }}>🏆 排行榜</h2>
            <p style={{ color: '#8899bb', lineHeight: '1.6' }}>
              查看全服最佳调度员的战绩，挑战最高分记录。
            </p>
          </div>
        </Link>

        <Link href="/profile" style={{ textDecoration: 'none' }}>
          <div class="panel" style={{ padding: '30px', cursor: 'pointer', transition: 'all 0.3s', height: '100%' }}>
            <h2 style={{ color: '#00ff88', marginBottom: '15px', fontSize: '1.5rem' }}>👤 玩家档案</h2>
            <p style={{ color: '#8899bb', lineHeight: '1.6' }}>
              创建或选择玩家身份，记录你的每一次太空征程。
            </p>
          </div>
        </Link>
      </div>

      <div class="panel" style={{ padding: '30px' }}>
        <h3 style={{ color: '#00e5ff', marginBottom: '20px', fontSize: '1.3rem' }}>📖 游戏规则</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ color: '#ff6b35', marginBottom: '10px' }}>⬆️ 货舱升降</h4>
            <p style={{ color: '#8899bb', fontSize: '0.95rem', lineHeight: '1.6' }}>
              控制电梯上升和下降，将货物安全送到目标楼层。每层消耗能量。
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ff6b35', marginBottom: '10px' }}>⚖️ 配重交换</h4>
            <p style={{ color: '#8899bb', fontSize: '0.95rem', lineHeight: '1.6' }}>
              调整左右两侧配重来保持电梯平衡，失衡会触发警报并扣分。
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ff6b35', marginBottom: '10px' }}>⚡ 能量窗口</h4>
            <p style={{ color: '#8899bb', fontSize: '0.95rem', lineHeight: '1.6' }}>
              所有操作都消耗能量，合理规划行动路线，在能量耗尽前完成任务。
            </p>
          </div>
          <div>
            <h4 style={{ color: '#ff6b35', marginBottom: '10px' }}>🚨 失衡报警</h4>
            <p style={{ color: '#8899bb', fontSize: '0.95rem', lineHeight: '1.6' }}>
              当倾斜度过大时会触发警报，严重失衡将导致任务失败！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: '太空电梯配重调度游戏',
  meta: [
    {
      name: 'description',
      content: '一款策略调度类游戏，平衡配重、精准调度，征服星辰大海。',
    },
  ],
};
