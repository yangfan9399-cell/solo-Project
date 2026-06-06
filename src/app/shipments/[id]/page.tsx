import { getShipmentDetail } from '@/lib/services'
import { TemperatureChart } from '@/components/TemperatureChart'
import { StatusBadge } from '@/components/StatusBadge'
import {
  Package,
  Thermometer,
  User,
  Calendar,
  Truck,
  Activity,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import { DeviationTypeLabels, DeviationLevelLabels, DisposalActionLabels, RoleLabels, ProbeStatusLabels } from '@/lib/types'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function ShipmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const { id } = params
  const shipment = await getShipmentDetail(id)

  if (!shipment) {
    notFound()
  }

  const latestDeviation = shipment.deviations[shipment.deviations.length - 1]
  const latestDisposal = shipment.disposals[shipment.disposals.length - 1]
  const isProbeOffline = shipment.probe.status === 'OFFLINE'
  const hasOfflineReading = shipment.temperatureReadings.some((r) => r.isOffline)
  const hasProbeOffline = isProbeOffline || hasOfflineReading
  const offlineReadingsCount = shipment.temperatureReadings.filter((r) => r.isOffline).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回列表
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Package className="w-6 h-6 mr-2 text-blue-600" />
              {shipment.batchNumber}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {shipment.medicine.name} - {shipment.medicine.specification}
            </p>
          </div>
          <StatusBadge type="shipment" value={shipment.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Thermometer className="w-5 h-5 mr-2 text-blue-600" />
                温度曲线
              </h2>
              {hasProbeOffline && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  存在离线情况
                </span>
              )}
            </div>
            <TemperatureChart
              readings={shipment.temperatureReadings}
              minTemp={shipment.medicine.minTemp}
              maxTemp={shipment.medicine.maxTemp}
            />
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>
                采集时间: {shipment.temperatureReadings.length > 0
                  ? new Date(shipment.temperatureReadings[0].timestamp).toLocaleString('zh-CN')
                  : '无数据'}
              </span>
              <span>
                数据点: {shipment.temperatureReadings.length} 个
                {hasOfflineReading && (
                  <span className="text-red-600 ml-2">
                    (含 {offlineReadingsCount} 条离线记录)
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              历史节点
            </h2>
            <div className="flow-root">
              <ul className="-mb-8">
                {shipment.historyLogs.map((log, index) => (
                  <li key={log.id} className="relative pb-8">
                    {index !== shipment.historyLogs.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                          <Activity className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.action}</p>
                          <p className="mt-0.5 text-sm text-gray-500">{log.comment}</p>
                          <p className="mt-1 text-xs text-gray-400">
                            {log.user.name} ({RoleLabels[log.user.role as keyof typeof RoleLabels] || log.user.role})
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              批次信息
            </h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">药品名称</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.medicine.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">药品类别</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.medicine.category}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">规格</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.medicine.specification}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">生产厂家</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.medicine.manufacturer}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">数量</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.quantity}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  <Truck className="w-4 h-4 inline mr-1" />
                  承运商
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.carrier.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  到货时间
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(shipment.arrivalTime).toLocaleString('zh-CN')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  <User className="w-4 h-4 inline mr-1" />
                  登记人
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.warehouseClerk.name}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-orange-600" />
              探头信息
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">探头编号</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">
                  {shipment.probe.serialNumber}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">探头型号</dt>
                <dd className="mt-1 text-sm text-gray-900">{shipment.probe.model}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">探头状态</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      shipment.probe.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : shipment.probe.status === 'OFFLINE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {ProbeStatusLabels[shipment.probe.status as keyof typeof ProbeStatusLabels] || shipment.probe.status}
                  </span>
                </dd>
              </div>
              {hasProbeOffline && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="p-2 bg-red-50 rounded-md">
                    <p className="text-xs font-medium text-red-700 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      离线情况说明
                    </p>
                    <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                      {isProbeOffline && (
                        <li>• 探头当前状态为离线</li>
                      )}
                      {hasOfflineReading && (
                        <li>• 温度记录含 {offlineReadingsCount} 条离线数据</li>
                      )}
                    </ul>
                    <p className="text-xs text-red-700 font-medium mt-1">
                      放行需人工复核证据
                    </p>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {latestDeviation && latestDeviation.type !== 'NONE' && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                偏差信息
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">偏差类型</dt>
                  <dd className="mt-1">
                    <StatusBadge type="deviation-type" value={latestDeviation.type} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">偏差等级</dt>
                  <dd className="mt-1">
                    <StatusBadge type="deviation-level" value={latestDeviation.level} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">偏差描述</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestDeviation.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">处置建议</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestDeviation.judgment}</dd>
                </div>
                {latestDeviation.judgedAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">判定时间</dt>
                    <dd className="mt-1 text-sm text-gray-500">
                      {new Date(latestDeviation.judgedAt).toLocaleString('zh-CN')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {latestDisposal && latestDisposal.action !== 'PENDING' && (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-green-600" />
                处置结果
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">处置方式</dt>
                  <dd className="mt-1">
                    <StatusBadge type="disposal" value={latestDisposal.action} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">复核意见</dt>
                  <dd className="mt-1 text-sm text-gray-900">{latestDisposal.comment}</dd>
                </div>
                {latestDisposal.evidenceUrl && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">复核证据</dt>
                    <dd className="mt-1 text-sm text-blue-600">
                      <a href={latestDisposal.evidenceUrl} target="_blank" rel="noopener noreferrer">
                        查看证据
                      </a>
                    </dd>
                  </div>
                )}
                {latestDisposal.handledAt && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">处理时间</dt>
                    <dd className="mt-1 text-sm text-gray-500">
                      {new Date(latestDisposal.handledAt).toLocaleString('zh-CN')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" />
              当前责任人
            </h2>
            {shipment.currentHandler ? (
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium">
                    {shipment.currentHandler.name.charAt(0)}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {shipment.currentHandler.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {RoleLabels[shipment.currentHandler.role as keyof typeof RoleLabels] || shipment.currentHandler.role}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">当前批次已结案</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
