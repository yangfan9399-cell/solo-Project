'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Phone, MapPin, AlertTriangle, Save, ArrowLeft } from 'lucide-react'
import type { PipeSection, LeakLevel } from '@/lib/db'

const leakLevelOptions: { value: LeakLevel; label: string; description: string }[] = [
  { value: 'LOW', label: '低', description: '轻微渗漏，无明显积水' },
  { value: 'MEDIUM', label: '中', description: '明显漏水，有少量积水' },
  { value: 'HIGH', label: '高', description: '严重漏水，影响正常用水' },
  { value: 'CRITICAL', label: '紧急', description: '大面积停水，需立即抢修' },
]

export default function ReportPage() {
  const [pipeSections, setPipeSections] = useState<PipeSection[]>([])
  const [formData, setFormData] = useState({
    reporterName: '',
    reporterPhone: '',
    pipeSectionId: '',
    leakLevel: 'MEDIUM' as LeakLevel,
    waterStopArea: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/pipe-sections')
      .then(res => res.json())
      .then(data => setPipeSections(data))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    const pipeSection = pipeSections.find(ps => ps.id === formData.pipeSectionId)
    
    await fetch('/api/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        pipeSection,
      }),
    })
    
    setSubmitting(false)
    setSuccess(true)
    
    setTimeout(() => {
      setSuccess(false)
      setFormData({
        reporterName: '',
        reporterPhone: '',
        pipeSectionId: '',
        leakLevel: 'MEDIUM',
        waterStopArea: '',
        description: '',
      })
    }, 3000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
          返回
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">登记报修</h2>
          <p className="text-sm text-gray-500 mt-1">填写漏损报修信息</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg text-green-700">
          报修登记成功！工单已创建。
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            报修人信息
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">姓名</label>
              <input
                type="text"
                required
                value={formData.reporterName}
                onChange={e => setFormData({ ...formData, reporterName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">联系电话</label>
              <input
                type="tel"
                required
                value={formData.reporterPhone}
                onChange={e => setFormData({ ...formData, reporterPhone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="请输入手机号"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            管段信息
          </label>
          <select
            required
            value={formData.pipeSectionId}
            onChange={e => setFormData({ ...formData, pipeSectionId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">请选择管段</option>
            {pipeSections.map(section => (
              <option key={section.id} value={section.id}>
                {section.name} - {section.area} ({section.diameter})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            漏损等级
          </label>
          <div className="grid grid-cols-2 gap-3">
            {leakLevelOptions.map(level => (
              <label
                key={level.value}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.leakLevel === level.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="leakLevel"
                  value={level.value}
                  checked={formData.leakLevel === level.value}
                  onChange={e => setFormData({ ...formData, leakLevel: e.target.value as LeakLevel })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className={`font-medium ${
                    level.value === 'CRITICAL' ? 'text-red-600' :
                    level.value === 'HIGH' ? 'text-orange-600' : 'text-gray-700'
                  }`}>
                    {level.label}
                  </div>
                  <div className="text-xs text-gray-500">{level.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">停水范围（选填）</label>
          <input
            type="text"
            value={formData.waterStopArea}
            onChange={e => setFormData({ ...formData, waterStopArea: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="如：XX小区1-3号楼"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">报修描述</label>
          <textarea
            required
            rows={4}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            placeholder="请描述漏水情况..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {submitting ? '提交中...' : '提交报修'}
          </button>
        </div>
      </form>
    </div>
  )
}