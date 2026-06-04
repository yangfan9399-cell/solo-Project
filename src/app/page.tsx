import Link from 'next/link'
import { getRepairOrders, getSubmitters } from './actions'
import { STATUS_LABELS, STATUS_COLORS, DEVICE_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { MapPin, User, Clock, Eye, AlertTriangle, RefreshCw, CheckCircle } from 'lucide-react'
import RepairForm from './components/RepairForm'

export default async function Home() {
  const orders = await getRepairOrders()
  const submitters = await getSubmitters()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PARTS_SHORTAGE':
        return <AlertTriangle className="h-4 w-4" />
      case 'REJECTED':
        return <RefreshCw className="h-4 w-4" />
      case 'ACCEPTED':
      case 'ARCHIVED':
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">报修单列表</h2>
          <p className="text-gray-500 mt-1">共 {orders.length} 条报修记录</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
              <AlertTriangle className="h-4 w-4" /> 配件缺货样本
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
              <RefreshCw className="h-4 w-4" /> 验收不通过样本
            </span>
          </div>
          <RepairForm submitters={submitters} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/repair/${order.id}`}
            className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs text-gray-500 font-mono">{order.orderNumber}</span>
                <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">{order.title}</h3>
              </div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                {getStatusIcon(order.status)}
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">{order.deviceLocation}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>{DEVICE_TYPE_LABELS[order.deviceType]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{formatDate(order.submittedAt)}</span>
              </div>
              {order.technician && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span>处理人: {order.technician.name}</span>
                </div>
              )}
            </div>

            {order.reworkCount > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                <RefreshCw className="h-3 w-3" />
                重复报修 / 返工 {order.reworkCount} 次
              </div>
            )}

            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="text-xs text-gray-500">{order.source}</span>
              <span className="text-primary-600 text-sm font-medium flex items-center gap-1">
                <Eye className="h-4 w-4" />
                查看详情
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
