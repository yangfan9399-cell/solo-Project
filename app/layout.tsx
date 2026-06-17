import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "陶瓷釉料试片配方矩阵工具",
  description: "专业陶瓷釉料配方管理与试验工作台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans">
        <header className="bg-stone-800 text-stone-100 border-b border-stone-700">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-9 h-9 rounded bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                釉
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-wide">陶瓷釉料试片配方矩阵工具</h1>
                <p className="text-xs text-stone-400">Glaze Test Specimen Matrix Workbench</p>
              </div>
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:text-amber-400 transition-colors">工作台</Link>
              <Link href="/projects" className="hover:text-amber-400 transition-colors">项目台账</Link>
              <Link href="/recipes" className="hover:text-amber-400 transition-colors">配方库</Link>
              <Link href="/recipes/matrix-lab" className="hover:text-amber-400 transition-colors">矩阵实验</Link>
              <Link href="/specimens" className="hover:text-amber-400 transition-colors">试片画廊</Link>
              <Link href="/ingredients" className="hover:text-amber-400 transition-colors">原料库</Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="bg-stone-800 text-stone-400 text-xs py-3 border-t border-stone-700">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <span>陶瓷釉料配方矩阵系统 v1.0</span>
            <span>专业工作台 · 本地数据存储</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
