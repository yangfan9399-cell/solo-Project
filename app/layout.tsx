import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "传统弓箭调弓参数档案",
  description: "传统弓箭调弓参数档案管理工作台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="bg-bow-dark text-leather-100 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-3xl">🏹</span>
              <div>
                <h1 className="text-xl font-bold tracking-wide">传统弓箭调弓参数档案</h1>
                <p className="text-xs text-leather-300">Traditional Archery Tuning Archive Workbench</p>
              </div>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded hover:bg-bow/50 transition">工作台</Link>
              <Link href="/equipment" className="px-3 py-1.5 rounded hover:bg-bow/50 transition">器材库</Link>
              <Link href="/exports" className="px-3 py-1.5 rounded hover:bg-bow/50 transition">导出记录</Link>
              <Link href="/anomalies" className="px-3 py-1.5 rounded hover:bg-bow/50 transition">异常提示</Link>
              <Link href="/archives/new" className="btn btn-primary !py-1.5">＋ 新建档案</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-leather-200 mt-12 py-6 text-center text-sm text-leather-600">
          <p>《传统弓箭调弓参数档案》 · 专业冷门工具 · 弓长 / 弦距 / 箭重 / 撒放 / 靶纸 / 散布</p>
        </footer>
      </body>
    </html>
  );
}
