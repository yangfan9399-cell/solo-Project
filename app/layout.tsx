import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "连锁药房近效期药品调拨与销毁复核平台",
  description: "连锁药房近效期药品管理系统 - 门店上报、调拨建议、销毁申请、复核归档",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-gray-50 min-h-screen">
        <Navbar />
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
