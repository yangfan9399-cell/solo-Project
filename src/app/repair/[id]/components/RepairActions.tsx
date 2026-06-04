'use client'

import { useState } from 'react'
import { 
  assignTechnician, startRepair, addRepairLog, reportPartsShortage,
  completeRepair, performInspection, archiveRepair, restartRepair
} from '@/app/actions'
import { RepairStatus } from '@prisma/client'
import { 
  UserCog, Wrench, Package, ClipboardCheck, Archive, 
  RefreshCw, Play, Send, AlertTriangle
} from 'lucide-react'

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

  const renderTechnicianActions = () => {
    if (!order.technicianId) return null

    if (order.status === RepairStatus.ASSIGNED) {
      return (
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Wrench className="h-4 w-4" /> 维修员操作
          </h3>
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
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Wrench className="h-4 w-4" /> 维修员操作
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="操作名称（如：检查故障）"
              value={logAction}
              onChange={(e) => setLogAction(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <textarea
              placeholder="详细描述"
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
            />
            <input
              type="text"
              placeholder="使用配件（可选）"
              value={logParts}
              onChange={(e) => setLogParts(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="耗时（分钟，可选）"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleAddLog}
              disabled={!logAction || !logDescription}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              添加维修记录
            </button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-gray-500">遇到配件缺货？</p>
            <input
              type="text"
              placeholder="阻断原因"
              value={blockingReason}
              onChange={(e) => setBlockingReason(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="所需配件"
              value={partsNeeded}
              onChange={(e) => setPartsNeeded(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <input
              type="number"
              placeholder="预计延期天数"
              value={estimatedDelay}
              onChange={(e) => setEstimatedDelay(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleReportShortage}
              disabled={!blockingReason || !partsNeeded}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              报告配件缺货
            </button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-3">维修完成后提交验收</p>
            <select
              value={selectedInspector}
              onChange={(e) => setSelectedInspector(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-3"
            >
              <option value="">选择验收员</option>
              {inspectors.map((inspector) => (
                <option key={inspector.id} value={inspector.id}>
                  {inspector.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCompleteRepair}
              disabled={!selectedInspector}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              提交验收
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  const renderInspectorActions = () => {
    if (order.status !== RepairStatus.PENDING_ACCEPTANCE || !order.inspectorId) return null

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" /> 验收员操作
        </h3>
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
        <textarea
          placeholder="验收意见"
          value={inspectionComments}
          onChange={(e) => setInspectionComments(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
        />
        <button
          onClick={handleInspection}
          disabled={inspectionResult === null || !inspectionComments}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          提交验收结果
        </button>
      </div>
    )
  }

  const renderAdminActions = () => {
    const actions = []

    if (order.status === RepairStatus.SUBMITTED) {
      actions.push(
        <div key="assign" className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <UserCog className="h-4 w-4" /> 管理员操作 - 派工
          </h3>
          <select
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">选择维修员</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedTechnician}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认派工
          </button>
        </div>
      )
    }

    if (order.status === RepairStatus.REJECTED) {
      actions.push(
        <div key="restart" className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> 重新处理
          </h3>
          <p className="text-sm text-gray-500">验收不通过，需要重新维修</p>
          <button
            onClick={handleRestart}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            重新开始维修
          </button>
        </div>
      )
    }

    if (order.status === RepairStatus.ACCEPTED) {
      actions.push(
        <div key="archive" className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Archive className="h-4 w-4" /> 归档
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
      )
    }

    return actions.length > 0 ? actions : null
  }

  const technicianActions = renderTechnicianActions()
  const inspectorActions = renderInspectorActions()
  const adminActions = renderAdminActions()

  if (!technicianActions && !inspectorActions && !adminActions) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <p className="text-gray-500 text-center">当前状态无可用操作</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      {adminActions}
      {technicianActions && adminActions && <div className="border-t" />}
      {technicianActions}
      {inspectorActions && (technicianActions || adminActions) && <div className="border-t" />}
      {inspectorActions}
    </div>
  )
}
