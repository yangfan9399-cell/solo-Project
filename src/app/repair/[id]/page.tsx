import { notFound } from 'next/navigation'
import { getRepairOrder, getTechnicians, getInspectors } from '@/app/actions'
import { STATUS_LABELS, STATUS_COLORS, DEVICE_TYPE_LABELS, ROLE_LABELS } from '@/lib/constants'
import { formatDate, formatDuration } from '@/lib/utils'
import { RepairStatus } from '@prisma/client'
import { 
  MapPin, User, Clock, FileText, AlertTriangle, CheckCircle, 
  XCircle, Package, History, Wrench, ClipboardCheck,
  RefreshCw, UserCheck, Archive, UserCog, ArrowRight
} from 'lucide-react'
import RepairActions from './components/RepairActions'

export default async function RepairDetailPage({ params }: { params: { id: string } }) {
  const order = await getRepairOrder(params.id)
  const technicians = await getTechnicians()
  const inspectors = await getInspectors()

  if (!order) {
    notFound()
  }

  const getCurrentHandlerInfo = () => {
    switch (order.status) {
      case RepairStatus.SUBMITTED:
        return { role: 'ADMIN', name: '待管理员派工', icon: UserCog }
      case RepairStatus.ASSIGNED:
      case RepairStatus.IN_PROGRESS:
      case RepairStatus.PARTS_SHORTAGE:
        return { role: 'TECHNICIAN', name: order.technician?.name || '未指派', icon: Wrench }
      case RepairStatus.PENDING_ACCEPTANCE:
        return { role: 'INSPECTOR', name: order.inspector?.name || '未指派', icon: ClipboardCheck }
      case RepairStatus.ACCEPTED:
      case RepairStatus.REJECTED:
        return { role: 'ADMIN', name: '待管理员归档', icon: Archive }
      case RepairStatus.ARCHIVED:
        return { role: 'ARCHIVED', name: '已归档', icon: CheckCircle }
      default:
        return { role: 'UNKNOWN', name: '-', icon: User }
    }
  }

  const currentHandler = getCurrentHandlerInfo()

  type HistoryNode = {
    id: string
    type: 'submit' | 'assign' | 'repair' | 'shortage' | 'inspection' | 'archive'
    title: string
    description?: string
    handler: { name: string; role: string } | null
    date: Date
    result?: 'success' | 'warning' | 'error'
    icon: typeof Wrench
    metadata?: {
      partsUsed?: string
      timeSpent?: number
      partsNeeded?: string
      estimatedDelay?: number
    }
  }

  const buildHistoryNodes = (): HistoryNode[] => {
    const nodes: HistoryNode[] = []

    nodes.push({
      id: 'submit',
      type: 'submit',
      title: '提交报修',
      description: order.description,
      handler: { name: order.submitter.name, role: order.submitter.role },
      date: order.submittedAt,
      result: 'success',
      icon: FileText,
    })

    if (order.assignedAt && order.technician) {
      nodes.push({
        id: 'assign',
        type: 'assign',
        title: '派工',
        description: `工单已分配给 ${order.technician.name}`,
        handler: { name: '系统', role: 'ADMIN' },
        date: order.assignedAt,
        result: 'success',
        icon: UserCheck,
      })
    }

    for (const log of order.logs) {
      nodes.push({
        id: `repair-${log.id}`,
        type: 'repair',
        title: log.action,
        description: log.description,
        handler: { name: log.technician.name, role: log.technician.role },
        date: log.createdAt,
        result: 'success',
        icon: Wrench,
        metadata: {
          partsUsed: log.partsUsed || undefined,
          timeSpent: log.timeSpentMinutes || undefined,
        },
      })
    }

    if (order.status === RepairStatus.PARTS_SHORTAGE || order.blockingReason) {
      const shortageDate = order.logs.find(l => l.action.includes('缺货'))?.createdAt 
        || order.logs[order.logs.length - 1]?.createdAt 
        || new Date()
      nodes.push({
        id: 'shortage',
        type: 'shortage',
        title: '配件缺货',
        description: order.blockingReason || '',
        handler: order.technician ? { name: order.technician.name, role: order.technician.role } : null,
        date: shortageDate,
        result: 'warning',
        icon: AlertTriangle,
        metadata: {
          partsNeeded: order.partsNeeded || undefined,
          estimatedDelay: order.estimatedDelay || undefined,
        },
      })
    }

    for (const inspection of order.inspections) {
      nodes.push({
        id: `inspection-${inspection.id}`,
        type: 'inspection',
        title: inspection.result ? '验收通过' : '验收不通过',
        description: inspection.comments,
        handler: { name: inspection.inspector.name, role: inspection.inspector.role },
        date: inspection.createdAt,
        result: inspection.result ? 'success' : 'error',
        icon: inspection.result ? CheckCircle : XCircle,
      })
    }

    if (order.archivedAt) {
      nodes.push({
        id: 'archive',
        type: 'archive',
        title: '工单归档',
        description: '工单已完成归档',
        handler: { name: '系统', role: 'ADMIN' },
        date: order.archivedAt,
        result: 'success',
        icon: Archive,
      })
    }

    return nodes.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  const historyNodes = buildHistoryNodes()

  const getResultStyle = (result?: string) => {
    switch (result) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'warning':
        return 'bg-orange-500 text-white'
      case 'error':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-300 text-gray-600'
    }
  }

  const HandlerIcon = currentHandler.icon

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
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800">配件缺货 - 维修进度受阻</h3>
              <p className="text-orange-700 mt-1">{order.blockingReason}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {order.partsNeeded && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <Package className="h-4 w-4" />
                    <span>所需配件: {order.partsNeeded}</span>
                  </div>
                )}
                {order.estimatedDelay && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <Clock className="h-4 w-4" />
                    <span>预计延期: {order.estimatedDelay} 天</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                请在右侧操作区选择「管理员视角进行改派，或「维修员视角标记配件到货后继续。
              </p>
            </div>
          </div>
        </div>
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
                  <HandlerIcon className="h-4 w-4" /> 当前处理人
                </span>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{currentHandler.name}</p>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {currentHandler.role === 'ARCHIVED' ? '已完成' : ROLE_LABELS[currentHandler.role as keyof typeof ROLE_LABELS] || currentHandler.role}
                  </span>
                </div>
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
            {historyNodes.length > 0 ? (
              <div className="space-y-0">
                {historyNodes.map((node, index) => {
                  const NodeIcon = node.icon
                  const isLast = index === historyNodes.length - 1
                  return (
                    <div key={node.id} className="relative pb-5 last:pb-0">
                      {!isLast && (
                        <div className="absolute left-3 top-7 w-0.5 h-full bg-gray-200" />
                      )}
                      <div className="flex gap-3 relative">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${getResultStyle(node.result)}`}>
                          <NodeIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 text-sm">{node.title}</span>
                          </div>
                          {node.description && (
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{node.description}</p>
                          )}
                          {node.metadata && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {node.metadata.partsUsed && (
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Package className="h-3 w-3" /> {node.metadata.partsUsed}
                                </span>
                              )}
                              {node.metadata.timeSpent && (
                                <span className="text-xs text-gray-500">
                                  耗时 {formatDuration(node.metadata.timeSpent)}
                                </span>
                              )}
                              {node.metadata.partsNeeded && (
                                <span className="text-xs text-orange-600 flex items-center gap-1">
                                  <Package className="h-3 w-3" /> 需采购: {node.metadata.partsNeeded}
                                </span>
                              )}
                              {node.metadata.estimatedDelay && (
                                <span className="text-xs text-orange-600">
                                  延期约 {node.metadata.estimatedDelay} 天
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            {node.handler && (
                              <span className="text-xs text-gray-500">
                                {node.handler.name}
                              </span>
                            )}
                            <ArrowRight className="h-3 w-3 text-gray-300" />
                            <span className="text-xs text-gray-400">{formatDate(node.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">暂无流转记录</p>
            )}
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
