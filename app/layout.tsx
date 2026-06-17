import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '木版年画套色错位分析平台',
  description: '专业木版年画套色工艺工作台：多版扫描图层对齐、控制点分析、偏移统计与修版记录',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">
        <header className="sticky top-0 z-40 backdrop-blur bg-paper/85 border-b border-stone-200/70">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-ink text-paper flex items-center justify-center shadow-inner wood-pattern">
                <span className="font-serif text-lg font-bold">版</span>
              </div>
              <div className="leading-tight">
                <h1 className="wood-title text-lg font-bold">木版年画套色错位分析</h1>
                <p className="text-xs text-stone-500">Woodblock Print Chromatic Registration Workbench</p>
              </div>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded-md hover:bg-stone-200/50 text-ink/80 hover:text-ink transition">
                项目台账
              </Link>
              <span className="text-stone-300 px-1">|</span>
              <Link href="/about" className="px-3 py-1.5 rounded-md hover:bg-stone-200/50 text-ink/80 hover:text-ink transition">
                关于
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-[1600px] mx-auto px-6 py-6">{children}</main>
        <footer className="border-t border-stone-200/60 mt-12 py-6">
          <div className="max-w-[1600px] mx-auto px-6 text-xs text-stone-500 flex items-center justify-between">
            <span>© 2026 木版年画数字化保护工作站 · 套色工艺分析模块 v1.0</span>
            <span>数据本地持久化 · JSON / data/woodblock.json</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
