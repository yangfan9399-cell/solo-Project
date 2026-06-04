import Link from 'next/link'
import { getReviewStats, getRepairOrders } from '../actions'
import { DEVICE_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { 
  BarChart3, Wrench, Clock, RefreshCw, CheckCircle, 
  XCircle, ListTodo, ChevronRight, AlertTriangle, Package
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
              <p className="text-sm text-gray-500">已验收</p>
              <p className="text-2xl font-bold text-gray-900">{stats.byResult.accepted}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">全局平均处理时长</p>
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

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary-600" />
          按设备类型统计
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.byDeviceType).map(([type, data]) => {
            const completionRate = data.total > 0 ? (data.completed / data.total) * 100 : 0
            const totalInspected = data.results.accepted + data.results.rejected
            const passRate = totalInspected > 0 ? (data.results.accepted / totalInspected) * 100 : 0

            return (
              <div key={type} className="bg-white rounded-xl shadow-sm border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {DEVICE_TYPE_LABELS[type as keyof typeof DEVICE_TYPE_LABELS] || type}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {data.completed}/{data.total} 完成
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs text-gray-500">完成率</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{completionRate.toFixed(0)}%</p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-yellow-500" />
                      <span className="text-xs text-gray-500">平均耗时</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{data.avgTime.toFixed(1)}h</p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <RefreshCw className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-xs text-gray-500">返工次数</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{data.reworkCount}</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BarChart3 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs text-gray-500">验收通过率</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{passRate.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t space-y-2">
                  <p className="text-xs font-medium text-gray-500">验收结果分布</p>
                  <div className="flex gap-1.5">
                    {data.results.accepted > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" /> 通过 {data.results.accepted}
                      </span>
                    )}
                    {data.results.rejected > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                        <XCircle className="h-3 w-3" /> 不通过 {data.results.rejected}
                      </span>
                    )}
                    {data.results.inProgress > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                        <Clock className="h-3 w-3" /> 处理中 {data.results.inProgress}
                      </span>
                    )}
                    {data.results.submitted > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
                        <ListTodo className="h-3 w-3" /> 待派工 {data.results.submitted}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary-600" />
            全局验收结果
          </h3>
          <div className="space-y-4">
            {[
              { label: '已验收', count: stats.byResult.accepted, color: 'bg-green-500', icon: CheckCircle },
              { label: '验收不通过', count: stats.byResult.rejected, color: 'bg-red-500', icon: XCircle },
              { label: '处理中', count: stats.byResult.inProgress, color: 'bg-yellow-500', icon: Clock },
              { label: '待派工', count: stats.byResult.submitted, color: 'bg-gray-400', icon: ListTodo },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  {item.label}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${stats.totalOrders > 0 ? (item.count / stats.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary-600" />
            各设备类型返工情况
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byDeviceType).map(([type, data]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  {DEVICE_TYPE_LABELS[type as keyof typeof DEVICE_TYPE_LABELS] || type}
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${data.reworkCount > 0 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${stats.totalRework > 0 ? (data.reworkCount / stats.totalRework) * 100 : 0}%` }}
                    />
                  </div>
                  <span className={`font-semibold w-8 text-right ${data.reworkCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {data.reworkCount}
                  </span>
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
