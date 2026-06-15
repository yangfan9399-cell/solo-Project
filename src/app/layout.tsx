import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: '手工银饰錾刻工序台账 | Silver Engraving Ledger',
  description: '手工银饰錾刻专业工序管理系统：记录錾子、退火次数、纹样进度、表面缺陷与交付要求',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Link href="/" className="app-logo">
              <div className="app-logo-mark">银</div>
              <div>
                <div>手工银饰錾刻工序台账</div>
                <div style={{ fontSize: 10, color: '#6a6a75', fontWeight: 400, marginTop: 1 }}>Silver Engraving Ledger · 手工档案管理</div>
              </div>
            </Link>
            <nav className="app-nav">
              <Link href="/" data-nav="home">工序台账</Link>
              <Link href="/tools" data-nav="tools">錾子工具库</Link>
              <Link href="/new" data-nav="new">新建档案</Link>
            </nav>
          </div>
          <div className="app-actions">
            <span className="pill">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#10b981" style={{ marginRight: 4 }}>
                <circle cx="12" cy="12" r="10" />
              </svg>
              数据：本地 JSON
            </span>
            <Link href="/new" className="btn btn-primary btn-sm">
              <span>+ 新建台账</span>
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
