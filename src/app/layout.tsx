import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '舞台威亚吊点载荷计算平台',
  description: '专业的舞台威亚吊点布置、演员载荷与运动路径计算工作台，含安全系数校验、审批签名与版本管理',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v5l-4 8M12 12l4 8M6 20h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  舞台威亚吊点载荷计算平台
                </h1>
                <p className="text-[11px] text-slate-500 leading-tight">
                  WYRA · Wire & Rigging Analysis Workstation
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              <a
                href="/"
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 transition"
              >
                项目台账
              </a>
              <a
                href="#docs"
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                计算标准
              </a>
              <div className="w-px h-6 bg-slate-200 mx-2" />
              <div className="flex items-center gap-2 pl-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow">
                  管
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-medium text-slate-800 leading-tight">系统管理员</p>
                  <p className="text-[10px] text-slate-500 leading-tight">机械组主管</p>
                </div>
              </div>
            </nav>
          </div>
        </header>
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-500">
            <p>© 2026 舞台工程技术中心 · 威亚载荷计算平台 v1.2.0</p>
            <div className="flex items-center gap-4">
              <span>执行标准：GB 50720-2011《建设工程施工现场消防安全技术规范》· JGJ/T 449-2018</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                本地存储正常
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
