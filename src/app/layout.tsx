import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '燃气入户安检隐患整改与复查系统',
  description: '城市燃气入户安检隐患整改与复查管理系统',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
