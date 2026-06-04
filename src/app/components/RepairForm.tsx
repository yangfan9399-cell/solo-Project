'use client'

import { useState } from 'react'
import { createRepairOrder } from '../actions'
import { DeviceType } from '@prisma/client'
import { Send, Plus, X } from 'lucide-react'

const DEVICE_TYPE_OPTIONS = [
  { value: DeviceType.PROJECTOR, label: '投影仪' },
  { value: DeviceType.COMPUTER, label: '电脑' },
  { value: DeviceType.AIR_CONDITIONER, label: '空调' },
  { value: DeviceType.LIGHTING, label: '照明' },
  { value: DeviceType.OTHER, label: '其他' },
]

const SOURCE_OPTIONS = [
  '教师在线报修',
  '学生反馈',
  '教学楼管理员上报',
  '日常巡检发现',
]

const LOCATION_PREFIXES = [
  '教学楼A栋',
  '教学楼B栋',
  '教学楼C栋',
  '教学楼D栋',
  '实验楼A栋',
  '图书馆',
]

export default function RepairForm({ submitters }: {
  submitters: { id: string; name: string }[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deviceType, setDeviceType] = useState('')
  const [deviceLocation, setDeviceLocation] = useState('')
  const [source, setSource] = useState('')
  const [submitterId, setSubmitterId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormValid = title && description && deviceType && deviceLocation && source && submitterId
  const disabledReason = !isFormValid ? '请填写所有必填项' : ''

  const showRequiredHint = (value: string) => !value
  const showDisabledHint = (condition: boolean) => condition

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsSubmitting(true)
    try {
      await createRepairOrder({
        title,
        description,
        deviceType: deviceType as DeviceType,
        deviceLocation,
        source,
        submitterId,
      })
      setTitle('')
      setDescription('')
      setDeviceType('')
      setDeviceLocation('')
      setSource('')
      setSubmitterId('')
      setIsOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
      >
        <Plus className="h-5 w-5" />
        提交报修
      </button>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-600" />
          教学楼设备报修
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            报修标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请简要描述故障问题"
            className={`w-full px-3 py-2 border rounded-lg text-sm ${
              showRequiredHint(title) ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {showRequiredHint(title) && (
            <p className="mt-1 text-xs text-red-500">请填写报修标题</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              设备类型 <span className="text-red-500">*</span>
            </label>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">请选择设备类型</option>
              {DEVICE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {showRequiredHint(deviceType) && (
              <p className="mt-1 text-xs text-red-500">请选择设备类型</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              报修来源 <span className="text-red-500">*</span>
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">请选择报修来源</option>
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {showRequiredHint(source) && (
              <p className="mt-1 text-xs text-red-500">请选择报修来源</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            设备位置 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={deviceLocation.split(' ')[0]}
              onChange={(e) => {
                const rest = deviceLocation.split(' ').slice(1).join(' ')
                setDeviceLocation(e.target.value + (rest ? ' ' + rest : ''))
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-32"
            >
              <option value="">选择楼栋</option>
              {LOCATION_PREFIXES.map((prefix) => (
                <option key={prefix} value={prefix}>{prefix}</option>
              ))}
            </select>
            <input
              type="text"
              value={deviceLocation.split(' ').slice(1).join(' ')}
              onChange={(e) => {
                const prefix = deviceLocation.split(' ')[0]
                setDeviceLocation(prefix ? prefix + ' ' + e.target.value : e.target.value)
              }}
              placeholder="如：302教室"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <input
            type="text"
            value={deviceLocation}
            onChange={(e) => setDeviceLocation(e.target.value)}
            placeholder="完整位置（或直接填写）"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-2"
          />
          {showRequiredHint(deviceLocation) && (
            <p className="mt-1 text-xs text-red-500">请填写设备位置</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            问题描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请详细描述设备故障情况..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          />
          {showRequiredHint(description) && (
            <p className="mt-1 text-xs text-red-500">请填写问题描述</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            报修人 <span className="text-red-500">*</span>
          </label>
          <select
            value={submitterId}
            onChange={(e) => setSubmitterId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">请选择报修人</option>
            {submitters.map((submitter) => (
              <option key={submitter.id} value={submitter.id}>
                {submitter.name}
              </option>
            ))}
          </select>
          {showRequiredHint(submitterId) && (
            <p className="mt-1 text-xs text-red-500">请选择报修人</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          {showDisabledHint(!isFormValid) && (
            <p className="text-sm text-gray-500">{disabledReason}</p>
          )}
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? '提交中...' : '提交报修'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
