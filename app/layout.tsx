import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '磁带档案倒带修复游戏',
  description: '修复霉变、断裂或转速漂移的历史磁带档案',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="min-h-screen bg-tape-bg">
          {children}
        </div>
      </body>
    </html>
  );
}
