import { component$, Slot } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';

export default component$(() => {
  return (
    <div id="container">
      <nav style={{
        padding: '16px 30px',
        background: 'rgba(10, 14, 26, 0.8)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ color: '#00e5ff', fontSize: '1.3rem', fontWeight: 'bold', textDecoration: 'none' }}>
          🚀 太空电梯
        </Link>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/game" style={{ color: '#e8f0ff', textDecoration: 'none', fontSize: '0.95rem', opacity: 0.85 }}>游戏</Link>
          <Link href="/leaderboard" style={{ color: '#e8f0ff', textDecoration: 'none', fontSize: '0.95rem', opacity: 0.85 }}>排行榜</Link>
          <Link href="/profile" style={{ color: '#e8f0ff', textDecoration: 'none', fontSize: '0.95rem', opacity: 0.85 }}>档案</Link>
        </div>
      </nav>
      <main style={{ flex: 1 }}>
        <Slot />
      </main>
    </div>
  );
});
