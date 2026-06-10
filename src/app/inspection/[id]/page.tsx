'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Camera,
  AlertCircle,
  Tag,
  PhoneCall,
  Wrench,
  Check,
  Power,
  Plus,
} from 'lucide-react'

interface Hazard {
  id: number
  type: string
  level: 'low' | 'medium' | 'high' | 'critical'
  description: string
  photos: string[]
  createdAt: string
}

interface Rectification {
  id: number
  hazardId: number
  status: string
  repairmanName: string | null
  repairDate: string | null
  description: string | null
  beforePhotos: string[]
  afterPhotos: string[]
  completedAt: string | null
  createdAt: string
}

interface Appointment {
  id: number
  servicePersonName: string
  scheduledDate: string
  status: string
  notes: string | null
  isSecondAttempt: boolean
  createdAt: string
}

interface HistoryNode {
  id: number
  type: string
  title: string
  description: string | null
  operator: string
  createdAt: string
}

interface InspectionDetail {
  id: number
  residentName: string
  phone: string
  address: string
  community: string
  building: string
  floor: number
  room: string
  meterNumber: string
  meterLocation: string | null
  meterInstallationDate: string | null
  inspectorName: string
  inspectionDate: string
  status: string
  notes: string | null
  hazards: Hazard[]
  rectifications: Rectification[]
  appointments: Appointment[]
  history: HistoryNode[]
}

export default function InspectionDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [detail, setDetail] = useState<InspectionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showRectificationForm, setShowRectificationForm] = useState(false)
  const [selectedHazardId, setSelectedHazardId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`/api/inspections/${params.id}`)
      const data = await response.json()
      setDetail(data)
      setLoading(false)
    }
    fetchData()
  }, [params.id])

  const handleCreateAppointment = async () => {
    if (!detail) return
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspectionId: detail.id,
        residentId: detail.residentName,
        servicePersonName: '客服人员',
        scheduledDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '新预约',
        isSecondAttempt: detail.status === 'rejected',
      }),
    })
    if (response.ok) {
      setShowAppointmentForm(false)
      window.location.reload()
    }
  }

  const handleSubmitRectification = async () => {
    if (!selectedHazardId || !detail) return
    const response = await fetch('/api/rectifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hazardId: selectedHazardId,
        status: 'completed',
        repairmanName: '维修师傅',
        repairDate: new Date().toISOString().split('T')[0],
        description: '已完成整改',
      }),
    })
    if (response.ok) {
      setShowRectificationForm(false)
      setSelectedHazardId(null)
      window.location.reload()
    }
  }

  const handleReview = async (action: 'approve' | 'stop') => {
    if (!detail) return
    const response = await fetch('/api/inspections/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspectionId: detail.id,
        action,
      }),
    })
    if (response.ok) {
      window.location.reload()
    }
  }

  const getHazardLevelConfig = (level: string) => {
    const config = {
      low: { label: '低风险', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      medium: { label: '中风险', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      high: { label: '高风险', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      critical: { label: '极高风险', color: 'bg-red-100 text-red-800', icon: XCircle },
    }
    return config[level as keyof typeof config] || {
      label: level,
      color: 'bg-gray-100 text-gray-800',
      icon: AlertTriangle,
    }
  }

  const getHazardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hose_aging: '软管老化',
      leak: '燃气泄漏',
      nozzle_damage: '喷嘴损坏',
      vent_blockage: '通风不畅',
      illegal_modification: '违规改装',
      other: '其他隐患',
    }
    return labels[type] || type
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待处理',
      completed: '已完成',
      rejected: '用户拒检',
    }
    return labels[status] || status
  }

  const getAppointmentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
      no_show: '未到场',
    }
    return labels[status] || status
  }

  const getRectificationStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待整改',
      scheduled: '已预约',
      in_progress: '整改中',
      completed: '已完成',
      overdue: '整改逾期',
      stopped: '已停气',
    }
    return labels[status] || status
  }

  const getHistoryTypeIcon = (type: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
      inspection: FileText,
      appointment: Calendar,
      rectification: AlertTriangle,
      review: CheckCircle,
    }
    return icons[type] || FileText
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">未找到记录</h3>
          <p className="text-gray-500">该安检记录不存在</p>
        </div>
      </div>
    )
  }

  const canCreateAppointment = detail.status !== 'completed'
  const canSubmitRectification = detail.hazards.some(h => 
    !detail.rectifications.some(r => r.hazardId === h.id)
  )
  const canReview = detail.rectifications.some(r => r.status === 'completed')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">安检详情</h1>
                <p className="text-sm text-gray-500">
                  {detail.community} {detail.building} {detail.floor}楼{detail.room}室
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {canCreateAppointment && (
                <button
                  onClick={() => setShowAppointmentForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  预约跟进
                </button>
              )}
              {canSubmitRectification && (
                <button
                  onClick={() => setShowRectificationForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  提交整改
                </button>
              )}
              {canReview && (
                <>
                  <button
                    onClick={() => handleReview('approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    复核通过
                  </button>
                  <button
                    onClick={() => handleReview('stop')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Power className="w-4 h-4" />
                    停气处理
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {detail.residentName}
                      </h2>
                      <span
                        className={`inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full ${
                          detail.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : detail.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {getStatusLabel(detail.status)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {detail.community} {detail.building} {detail.floor}楼
                        {detail.room}室
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{detail.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">安检日期</div>
                  <div className="text-lg font-medium text-gray-900">
                    {new Date(detail.inspectionDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">安检员</div>
                  <div className="text-sm font-medium text-gray-900">
                    {detail.inspectorName}
                  </div>
                </div>
              </div>

              {detail.notes && (
                <div className="border-t pt-4">
                  <div className="text-sm text-gray-500 mb-2">备注</div>
                  <p className="text-gray-700">{detail.notes}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">表具信息</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">表具编号</div>
                  <div className="font-medium text-gray-900">{detail.meterNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">安装位置</div>
                  <div className="font-medium text-gray-900">
                    {detail.meterLocation || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">安装日期</div>
                  <div className="font-medium text-gray-900">
                    {detail.meterInstallationDate
                      ? new Date(detail.meterInstallationDate).toLocaleDateString()
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {detail.hazards.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-gray-900">隐患信息</h3>
                  <span className="ml-auto px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    {detail.hazards.length} 项隐患
                  </span>
                </div>
                <div className="space-y-4">
                  {detail.hazards.map((hazard) => {
                    const levelConfig = getHazardLevelConfig(hazard.level)
                    const LevelIcon = levelConfig.icon
                    const rectification = detail.rectifications.find(r => r.hazardId === hazard.id)
                    return (
                      <div
                        key={hazard.id}
                        className="border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <LevelIcon className={`w-4 h-4 ${levelConfig.color.split(' ')[1]}`} />
                            <span className="font-medium text-gray-900">
                              {getHazardTypeLabel(hazard.type)}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${levelConfig.color}`}
                            >
                              {levelConfig.label}
                            </span>
                          </div>
                          {rectification && (
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                rectification.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : rectification.status === 'overdue'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {getRectificationStatusLabel(rectification.status)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{hazard.description}</p>
                        <div className="mt-3 flex gap-2">
                          {hazard.photos.length > 0 ? (
                            hazard.photos.map((photo, index) => (
                              <div
                                key={index}
                                className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center"
                              >
                                <img
                                  src={photo}
                                  alt={`隐患照片${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {detail.rectifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-gray-900">整改记录</h3>
                </div>
                <div className="space-y-4">
                  {detail.rectifications.map((rect) => {
                    const hazard = detail.hazards.find(h => h.id === rect.hazardId)
                    return (
                      <div
                        key={rect.id}
                        className="border border-gray-100 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              rect.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : rect.status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : rect.status === 'stopped'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {getRectificationStatusLabel(rect.status)}
                          </span>
                          {hazard && (
                            <span className="text-xs text-gray-500">
                              隐患类型: {getHazardTypeLabel(hazard.type)}
                            </span>
                          )}
                        </div>
                        {rect.repairmanName && (
                          <div className="text-sm text-gray-600 mb-1">
                            维修人员: {rect.repairmanName}
                          </div>
                        )}
                        {rect.repairDate && (
                          <div className="text-sm text-gray-600 mb-1">
                            维修日期: {new Date(rect.repairDate).toLocaleDateString()}
                          </div>
                        )}
                        {rect.description && (
                          <p className="text-sm text-gray-600">{rect.description}</p>
                        )}
                        <div className="mt-3 flex gap-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">整改前</div>
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                              {rect.beforePhotos.length > 0 ? (
                                <img
                                  src={rect.beforePhotos[0]}
                                  alt="整改前"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">整改后</div>
                            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                              {rect.afterPhotos.length > 0 ? (
                                <img
                                  src={rect.afterPhotos[0]}
                                  alt="整改后"
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Camera className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {detail.appointments.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">预约记录</h3>
                  </div>
                  {canCreateAppointment && (
                    <button
                      onClick={() => setShowAppointmentForm(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-blue-500" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {detail.appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="border border-gray-100 rounded-lg p-3"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            appt.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : appt.status === 'confirmed'
                              ? 'bg-blue-100 text-blue-800'
                              : appt.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {getAppointmentStatusLabel(appt.status)}
                        </span>
                        {appt.isSecondAttempt && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            二次预约
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        客服: {appt.servicePersonName}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(appt.scheduledDate).toLocaleDateString()}
                      </div>
                      {appt.notes && (
                        <p className="text-xs text-gray-500 mt-1">{appt.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                {detail.status === 'rejected' && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 mb-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">风险提示</span>
                    </div>
                    <p className="text-xs text-red-700">
                      用户拒绝安检，存在潜在安全风险。已发起二次预约，请跟进处理。
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-500" />
                <h3 className="font-semibold text-gray-900">历史节点</h3>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                <div className="space-y-4">
                  {detail.history.map((node, index) => {
                    const Icon = getHistoryTypeIcon(node.type)
                    return (
                      <div key={node.id} className="relative pl-10">
                        <div
                          className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                            index === detail.history.length - 1
                              ? 'bg-primary text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {node.title}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(node.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {node.description && (
                            <p className="text-sm text-gray-600">
                              {node.description}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            操作人: {node.operator}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAppointmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建预约</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客服人员</label>
                <input
                  type="text"
                  defaultValue="客服人员"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAppointmentForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateAppointment}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  确认创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRectificationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">提交整改</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择隐患</label>
                <select
                  value={selectedHazardId || ''}
                  onChange={(e) => setSelectedHazardId(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">请选择隐患</option>
                  {detail.hazards.map(hazard => (
                    <option key={hazard.id} value={hazard.id}>
                      {getHazardTypeLabel(hazard.type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">维修人员</label>
                <input
                  type="text"
                  defaultValue="维修师傅"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">维修日期</label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">整改说明</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="请描述整改内容..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRectificationForm(false)
                    setSelectedHazardId(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRectification}
                  disabled={!selectedHazardId}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交整改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
