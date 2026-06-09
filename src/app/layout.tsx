import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "海关查验实验室样品送检与结论复核平台",
  description: "进出口查验样品取样、送检、结果录入到处置结论归档全流程管理平台",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session?.user) {
    return (
      <html lang="zh-CN">
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="zh-CN">
      <body>
        <div className="flex h-screen bg-slate-100">
          <Sidebar role={session.user.role} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header user={session.user} />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
