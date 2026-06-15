import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "海岛潮池生态观察游戏",
  description: "在涨落潮之间探索潮池生态，记录螃蟹、海葵和小鱼的出现条件",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <div className="min-h-screen bg-gradient-to-b from-sky-100 via-cyan-50 to-sky-100">
          {children}
        </div>
      </body>
    </html>
  );
}
