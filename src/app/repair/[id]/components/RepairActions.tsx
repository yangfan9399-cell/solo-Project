'use client'

import { useState } from 'react'
import { 
  assignTechnician, startRepair, addRepairLog, reportPartsShortage,
  completeRepair, performInspection, archiveRepair, restartRepair
} from '@/app/actions'
import { RepairStatus } from '@prisma/client'
import { 
  UserCog, Wrench, Package, ClipboardCheck, Archive, 
  RefreshCw, Play, Send, AlertTriangle, Eye
} from 'lucide-react'

type ViewMode = 'admin' | 'technician' | 'inspector'

export default function RepairActions({ order, technicians, inspectors }: {
  order: {
    id: string
    status: RepairStatus
    technicianId: string | null
    inspectorId: string | null
  }
  technicians: { id: string; name: string }[]
  inspectors: { id: string; name: string }[]
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('admin')
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [selectedInspector, setSelectedInspector] = useState('')
  const [logAction, setLogAction] = useState('')
  const [logDescription, setLogDescription] = useState('')
  const [logParts, setLogParts] = useState('')
  const [logTime, setLogTime] = useState('')
  const [blockingReason, setBlockingReason] = useState('')
  const [partsNeeded, setPartsNeeded] = useState('')
  const [estimatedDelay, setEstimatedDelay] = useState('')
  const [inspectionResult, setInspectionResult] = useState<boolean | null>(null)
  const [inspectionComments, setInspectionComments] = useState('')

  const handleAssign = async () => {
    if (selectedTechnician) {
      await assignTechnician(order.id, selectedTechnician)
    }
  }

  const handleStartRepair = async () => {
    if (order.technicianId) {
      await startRepair(order.id, order.technicianId)
    }
  }

  const handleAddLog = async () => {
    if (order.technicianId && logAction && logDescription) {
      await addRepairLog(
        order.id,
        order.technicianId,
        logAction,
        logDescription,
        logParts || undefined,
        logTime ? parseInt(logTime) : undefined
      )
      setLogAction('')
      setLogDescription('')
      setLogParts('')
      setLogTime('')
    }
  }

  const handleReportShortage = async () => {
    if (blockingReason && partsNeeded) {
      await reportPartsShortage(
        order.id,
        blockingReason,
        partsNeeded,
        estimatedDelay ? parseInt(estimatedDelay) : 1
      )
    }
  }

  const handleCompleteRepair = async () => {
    if (selectedInspector) {
      await completeRepair(order.id, selectedInspector)
    }
  }

  const handleInspection = async () => {
    if (order.inspectorId && inspectionResult !== null) {
      await performInspection(order.id, order.inspectorId, inspectionResult, inspectionComments)
    }
  }

  const handleArchive = async () => {
    await archiveRepair(order.id)
  }

  const handleRestart = async () => {
    await restartRepair(order.id)
  }

  const hasAdminActions = 
    order.status === RepairStatus.SUBMITTED ||
    order.status === RepairStatus.REJECTED ||
    order.status === RepairStatus.ACCEPTED

  const hasTechnicianActions = 
    (order.technicianId && order.status === RepairStatus.ASSIGNED) ||
    order.status === RepairStatus.IN_PROGRESS

  const hasInspectorActions = 
    order.status === RepairStatus.PENDING_ACCEPTANCE && order.inspectorId

  const ViewTabs = () => (
    <div className="flex border-b mb-4">
      <button
        onClick={() => setViewMode('admin')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
          viewMode === 'admin'
            ? 'text-primary-600 border-primary-600'
            : 'text-gray-500 border-transparent hover:text-gray-700'
        }`}
      >
        <UserCog className="h-4 w-4" />
        管理员
      </button>
      <button
        onClick={() => setViewMode('technician')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
          viewMode === 'technician'
            ? 'text-primary-600 border-primary-600'
            : 'text-gray-500 border-transparent hover:text-gray-700'
        }`}
      >
        <Wrench className="h-4 w-4" />
        维修员
      </button>
      <button
        onClick={() => setViewMode('inspector')}
        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
          viewMode === 'inspector'
            ? 'text-primary-600 border-primary-600'
            : 'text-gray-500 border-transparent hover:text-gray-700'
        }`}
      >
        <ClipboardCheck className="h-4 w-4" />
        验收员
      </button>
    </div>
  )

  const EmptyState = ({ message, icon: Icon }: { message: string; icon: typeof Eye }) => (
    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
      <Icon className="h-10 w-10 mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  )

  const AdminView = () => {
    if (!hasAdminActions) {
      return <EmptyState message="当前状态无管理员操作" icon={Eye} />
    }

    return (
      <div className="space-y-6">
        {order.status === RepairStatus.SUBMITTED && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary-600" /> 派工
            </h3>
            <p className="text-sm text-gray-500">选择维修员进行派工</p>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">请选择维修员 *</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
            {!selectedTechnician && (
              <p className="text-xs text-red-500">请选择维修员</p>
            )}
            <button
              onClick={handleAssign}
              disabled={!selectedTechnician}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认派工
            </button>
            {!selectedTechnician && (
              <p className="text-xs text-gray-400 text-center">选择维修员后可派工</p>
            )}
          </div>
        )}

        {order.status === RepairStatus.REJECTED && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-yellow-600" /> 重新处理
            </h3>
            <p className="text-sm text-gray-500">验收不通过，重新开始维修流程</p>
            <button
              onClick={handleRestart}
              className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重新开始维修
            </button>
          </div>
        )}

        {order.status === RepairStatus.ACCEPTED && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-600" /> 归档
            </h3>
            <p className="text-sm text-gray-500">验收通过后归档工单</p>
            <button
              onClick={handleArchive}
              className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <Archive className="h-4 w-4" />
              归档工单
            </button>
          </div>
        )}
      </div>
    )
  }

  const TechnicianView = () => {
    if (!hasTechnicianActions) {
      return <EmptyState message="当前状态无维修员操作" icon={Eye} />
    }

    if (order.status === RepairStatus.ASSIGNED) {
      return (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary-600" /> 开始维修
          </h3>
          <p className="text-sm text-gray-500">工单已派工，请开始维修</p>
          <button
            onClick={handleStartRepair}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" />
            开始维修
          </button>
        </div>
      )
    }

    if (order.status === RepairStatus.IN_PROGRESS) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary-600" /> 添加维修记录
            </h3>
            <input
              type="text"
              placeholder="操作名称 *（如：检查故障）"
              value={logAction}
              onChange={(e) => setLogAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            {!logAction && logAction !== '' && (
              <p className="text-xs text-red-500">请填写操作名称</p>
            )}
            <textarea
              placeholder="详细描述 *"
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
            {!logDescription && logDescription !== '' && (
              <p className="text-xs text-red-500">请填写详细描述</p>
            )}
            <input
              type="text"
              placeholder="使用配件（可选）"
              value={logParts}
              onChange={(e) => setLogParts(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="耗时（分钟，可选）"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleAddLog}
              disabled={!logAction || !logDescription}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              添加维修记录
            </button>
            {(!logAction || !logDescription) && (
              <p className="text-xs text-gray-400 text-center">填写操作名称和描述后可提交</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> 遇到配件缺货？
            </h4>
            <input
              type="text"
              placeholder="阻断原因 *"
              value={blockingReason}
              onChange={(e) => setBlockingReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            {!blockingReason && blockingReason !== '' && (
              <p className="text-xs text-red-500">请填写阻断原因</p>
            )}
            <input
              type="text"
              placeholder="所需配件 *"
              value={partsNeeded}
              onChange={(e) => setPartsNeeded(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            {!partsNeeded && partsNeeded !== '' && (
              <p className="text-xs text-red-500">请填写所需配件</p>
            )}
            <input
              type="number"
              placeholder="预计延期天数"
              value={estimatedDelay}
              onChange={(e) => setEstimatedDelay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleReportShortage}
              disabled={!blockingReason || !partsNeeded}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              报告配件缺货
            </button>
            {(!blockingReason || !partsNeeded) && (
              <p className="text-xs text-gray-400 text-center">填写阻断原因和所需配件后可报告</p>
            )}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-green-500" /> 维修完成提交验收
            </h4>
            <p className="text-sm text-gray-500">选择验收员后提交验收申请</p>
            <select
              value={selectedInspector}
              onChange={(e) => setSelectedInspector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">请选择验收员 *</option>
              {inspectors.map((inspector) => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.name}
                </option>
              ))}
            </select>
            {!selectedInspector && (
              <p className="text-xs text-red-500">请选择验收员</p>
            )}
            <button
              onClick={handleCompleteRepair}
              disabled={!selectedInspector}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              提交验收
            </button>
            {!selectedInspector && (
              <p className="text-xs text-gray-400 text-center">选择验收员后可提交</p>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  const InspectorView = () => {
    if (!hasInspectorActions) {
      return <EmptyState message="当前状态无验收员操作" icon={Eye} />
    }

    return (
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary-600" /> 验收操作
        </h3>
        <p className="text-sm text-gray-500">请检查维修结果并给出验收意见</p>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">验收结果 *</label>
          <div className="flex gap-2">
            <button
              onClick={() => setInspectionResult(true)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                inspectionResult === true
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              通过
            </button>
            <button
              onClick={() => setInspectionResult(false)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                inspectionResult === false
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              不通过
            </button>
          </div>
          {inspectionResult === null && (
            <p className="text-xs text-red-500">请选择验收结果</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">验收意见 *</label>
          <textarea
            placeholder="请填写验收意见..."
            value={inspectionComments}
            onChange={(e) => setInspectionComments(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />
          {!inspectionComments && inspectionComments !== '' && (
            <p className="text-xs text-red-500">请填写验收意见</p>
          )}
        </div>

        <button
          onClick={handleInspection}
          disabled={inspectionResult === null || !inspectionComments}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          提交验收结果
        </button>
        {(inspectionResult === null || !inspectionComments) && (
          <p className="text-xs text-gray-400 text-center">选择验收结果并填写意见后可提交</p>
        )}
      </div>
    )
  }

  if (!hasAdminActions && !hasTechnicianActions && !hasInspectorActions) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <ViewTabs />
        <EmptyState message="当前状态无可用操作" icon={Eye} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <ViewTabs />
      {viewMode === 'admin' && <AdminView />}
      {viewMode === 'technician' && <TechnicianView />}
      {viewMode === 'inspector' && <InspectorView />}
    </div>
  )
}
