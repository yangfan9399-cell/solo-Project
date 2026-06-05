import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '跨境订单清关处理台',
  description: '跨境订单清关资料收集与放行确认系统',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <nav className="bg-primary text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/" className="text-xl font-bold">
                  📦 清关处理台
                </Link>
                <div className="flex space-x-4">
                  <Link
                    href="/"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors"
                  >
                    订单列表
                  </Link>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-light transition-colors"
                  >
                    复盘统计
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm">当前用户：李明 (关务复核人)</span>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
