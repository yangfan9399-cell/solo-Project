import Link from 'next/link'
import { getReviewStats, getRepairOrders } from '../actions'
import { DEVICE_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { 
  BarChart3, Wrench, Clock, RefreshCw, CheckCircle, 
  XCircle, ListTodo, ChevronRight
} from 'lucide-react'

export default async function ReviewPage() {
  const stats = await getReviewStats()
  const orders = await getRepairOrders()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">统计复盘</h2>
        <p className="text-gray-500 mt-1">按设备类型、处理耗时、返工次数和验收结果聚合</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总工单</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byResult['已验收'] || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">平均处理时长</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime.toFixed(1)}h</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <RefreshCw className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总返工次数</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRework}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary-600" />
            按设备类型统计
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byDeviceType).map(([type, data]) => (
              <div key={type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {DEVICE_TYPE_LABELS[type as keyof typeof DEVICE_TYPE_LABELS] || type}
                  </span>
                  <span className="text-sm text-gray-500">
                    {data.completed}/{data.total} 完成
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${data.total > 0 ? (data.completed / data.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">平均耗时: {data.avgTime.toFixed(1)}h</span>
                  <span className="text-primary-600">
                    {data.total > 0 ? ((data.completed / data.total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary-600" />
            按验收结果统计
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byResult).map(([result, count]) => (
              <div key={result} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{result}</span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        result === '已验收' ? 'bg-green-500' :
                        result === '验收不通过' ? 'bg-red-500' :
                        result === '处理中' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${(count / stats.totalOrders) * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          工单明细 - 可跳转查看详情
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">工单编号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">标题</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">设备类型</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">返工次数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">维修记录</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-mono text-gray-500">{order.orderNumber}</td>
                  <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{order.title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {DEVICE_TYPE_LABELS[order.deviceType]}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className={order.reworkCount > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                      {order.reworkCount}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{order.logs.length} 条</td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/repair/${order.id}`}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                    >
                      查看 <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
