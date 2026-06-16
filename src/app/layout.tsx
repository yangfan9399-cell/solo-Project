import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "纸桥承重工程挑战",
  description: "用一张纸，搭起一座桥，看看能承载多少重量！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen paper-texture">
        {children}
      </body>
    </html>
  );
}
