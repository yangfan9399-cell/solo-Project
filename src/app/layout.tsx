import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '古城影壁拼图修复游戏',
  description: '修复千年影壁，重现古韵光华 — 一款融合古建筑美学的拼图修复游戏',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-serif-cn min-h-screen bg-ancient-50 bg-paper-texture text-ancient-950 antialiased">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
