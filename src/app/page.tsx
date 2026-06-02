'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from './actions/energyActions'
import { getRepairOrders } from './actions/repairActions'
import { getEnergyAbnormals } from './actions/energyActions'
import Loading, { LoadingPage } from '@/components/Loading'
import { ErrorState } from '@/components/EmptyState'
import {
  Wrench,
  Clock,
  CheckCircle,
  Zap,
  Building2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import Link from 'next/link'
import { useAuth } from '@/lib/auth'

interface Stats {
  totalRepairs: number
  pendingRepairs: number
  completedRepairs: number
  totalAbnormals: number
  pendingAbnormals: number
  totalFacilities: number
}

export default function HomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentRepairs, setRecentRepairs] = useState<any[]>([])
  const [recentAbnormals, setRecentAbnormals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [statsResult, repairsResult, abnormalsResult] = await Promise.all([
          getDashboardStats(),
          getRepairOrders(),
          getEnergyAbnormals(),
        ])

        if (statsResult.success) setStats(statsResult.data as Stats)
        if (repairsResult.success) setRecentRepairs((repairsResult.data as any[]).slice(0, 5))
        if (abnormalsResult.success) setRecentAbnormals((abnormalsResult.data as any[]).slice(0, 5))
      } catch (err) {
        setError('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <LoadingPage />
  if (error) return <ErrorState title={error} />

  const statCards = [
    {
      label: '总报修单',
      value: stats?.totalRepairs || 0,
      icon: Wrench,
      color: 'bg-blue-500',
      href: '/repairs',
      show: true,
    },
    {
      label: '待处理报修',
      value: stats?.pendingRepairs || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/repairs?status=PENDING',
      show: user?.role !== 'STUDENT',
    },
    {
      label: '已完成报修',
      value: stats?.completedRepairs || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      href: '/repairs?status=COMPLETED',
      show: true,
    },
    {
      label: '待处理异常',
      value: stats?.pendingAbnormals || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      href: '/energy',
      show: user?.role === 'DORM_MANAGER' || user?.role === 'ENERGY_ADMIN',
    },
    {
      label: '设施总数',
      value: stats?.totalFacilities || 0,
      icon: Building2,
      color: 'bg-purple-500',
      href: '/facilities',
      show: user?.role !== 'STUDENT',
    },
  ].filter((card) => card.show)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">欢迎回来，{user?.name}</h1>
        <p className="text-gray-500 mt-1">
          {formatDate(new Date())} · 这是今天的工作概览
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Link
              key={index}
              href={card.href}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">最近报修单</h2>
            <Link
              href="/repairs"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRepairs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无报修单</div>
            ) : (
              recentRepairs.map((repair) => (
                <div key={repair.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{repair.title}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {repair.room?.building?.name} {repair.room?.roomNumber} ·{' '}
                        {formatDate(repair.createdAt)}
                      </p>
                    </div>
                    <span className={`badge ${getStatusColor(repair.status)}`}>
                      {getStatusText(repair.status)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {(user?.role === 'DORM_MANAGER' || user?.role === 'ENERGY_ADMIN') && (
          <div className="card">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">能耗异常提醒</h2>
              <Link
                href="/energy"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                查看全部
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentAbnormals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">暂无异常记录</div>
              ) : (
                recentAbnormals.map((abnormal) => (
                  <div key={abnormal.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{abnormal.type}</p>
                          <span className="text-red-600 text-sm font-medium">
                            +{abnormal.abnormalValue}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {abnormal.building?.name}
                          {abnormal.room ? ` · ${abnormal.room.roomNumber}室` : ''} ·{' '}
                          {formatDate(abnormal.detectedDate)}
                        </p>
                      </div>
                      <span className={`badge ${getStatusColor(abnormal.status)}`}>
                        {getStatusText(abnormal.status)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
