import { notFound } from 'next/navigation'
import { getRepairOrder, getTechnicians, getInspectors } from '@/app/actions'
import { STATUS_LABELS, STATUS_COLORS, DEVICE_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatDuration } from '@/lib/utils'
import { 
  MapPin, User, Clock, FileText, AlertTriangle, CheckCircle, 
  XCircle, Package, ArrowRight, History, Wrench, ClipboardCheck,
  RefreshCw, Calendar, UserCheck, MessageSquare
} from 'lucide-react'
import RepairActions from './components/RepairActions'
import PartsShortageBanner from './components/PartsShortageBanner'

export default async function RepairDetailPage({ params }: { params: { id: string } }) {
  const order = await getRepairOrder(params.id)
  const technicians = await getTechnicians()
  const inspectors = await getInspectors()

  if (!order) {
    notFound()
  }

  const timeline = [
    { status: 'SUBMITTED', label: '提交报修', date: order.submittedAt, done: true },
    { status: 'ASSIGNED', label: '派工', date: order.assignedAt, done: !!order.assignedAt },
    { status: 'IN_PROGRESS', label: '维修中', date: order.logs[0]?.createdAt || null, done: order.logs.length > 0 },
    { status: 'PENDING_ACCEPTANCE', label: '待验收', date: order.completedAt, done: !!order.completedAt },
    { status: 'INSPECTED', label: '验收完成', date: order.inspectedAt, done: !!order.inspectedAt },
    { status: 'ARCHIVED', label: '归档', date: order.archivedAt, done: !!order.archivedAt },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-mono">{order.orderNumber}</span>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
            {order.reworkCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <RefreshCw className="h-3 w-3" />
                返工 {order.reworkCount} 次
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{order.title}</h1>
        </div>
      </div>

      {order.status === 'PARTS_SHORTAGE' && (
        <PartsShortageBanner order={order} technicians={technicians} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              报修详情
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> 设备位置
                </span>
                <p className="font-medium text-gray-900">{order.deviceLocation}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Wrench className="h-4 w-4" /> 设备类型
                </span>
                <p className="font-medium text-gray-900">{DEVICE_TYPE_LABELS[order.deviceType]}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="h-4 w-4" /> 报修来源
                </span>
                <p className="font-medium text-gray-900">{order.source}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <UserCheck className="h-4 w-4" /> 报修人
                </span>
                <p className="font-medium text-gray-900">{order.submitter.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-4 w-4" /> 提交时间
                </span>
                <p className="font-medium text-gray-900">{formatDate(order.submittedAt)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="h-4 w-4" /> 当前处理人
                </span>
                <p className="font-medium text-gray-900">
                  {order.technician?.name || '未派工'}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <span className="text-sm text-gray-500">问题描述</span>
              <p className="mt-2 text-gray-700">{order.description}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary-600" />
              维修记录
            </h2>
            {order.logs.length > 0 ? (
              <div className="space-y-4">
                {order.logs.map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Wrench className="h-4 w-4 text-primary-600" />
                      </div>
                      {index < order.logs.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{log.action}</span>
                        <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{log.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>维修员: {log.technician.name}</span>
                        {log.timeSpentMinutes && (
                          <span>耗时: {formatDuration(log.timeSpentMinutes)}</span>
                        )}
                        {log.partsUsed && (
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" /> {log.partsUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无维修记录</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary-600" />
              验收意见
            </h2>
            {order.inspections.length > 0 ? (
              <div className="space-y-4">
                {order.inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className={`p-4 rounded-lg border ${
                      inspection.result
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {inspection.result ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">
                          {inspection.result ? '验收通过' : '验收不通过'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(inspection.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700">{inspection.comments}</p>
                    <p className="mt-2 text-sm text-gray-500">
                      验收人: {inspection.inspector.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无验收记录</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary-600" />
              流转记录
            </h2>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={item.status} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.done
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    {index < timeline.length - 1 && (
                      <div
                        className={`w-0.5 h-8 ${
                          item.done ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className={`font-medium ${
                        item.done ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.date && (
                      <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <RepairActions
            order={order}
            technicians={technicians}
            inspectors={inspectors}
          />
        </div>
      </div>
    </div>
  )
}
