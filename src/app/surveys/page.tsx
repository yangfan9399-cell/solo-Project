'use client'

import { useEffect, useState } from 'react'
import { getSatisfactionSurveys, createSatisfactionSurvey } from '../actions/energyActions'
import { getRepairOrders } from '../actions/repairActions'
import Loading, { LoadingPage } from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import { ErrorState } from '@/components/EmptyState'
import { formatDate, getSatisfactionText, getSatisfactionEmoji } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Search, Star, MessageSquare, ClipboardList } from 'lucide-react'
import { SatisfactionLevel, RepairStatus } from '@prisma/client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function SurveysPage() {
  const { user } = useAuth()
  const [surveys, setSurveys] = useState<any[]>([])
  const [repairs, setRepairs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<any>(null)
  const [formData, setFormData] = useState({
    satisfaction: SatisfactionLevel.NEUTRAL,
    responseTime: 3,
    serviceQuality: 3,
    repairQuality: 3,
    comment: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [surveysResult, repairsResult] = await Promise.all([
          getSatisfactionSurveys(),
          getRepairOrders(),
        ])

        if (surveysResult.success) setSurveys(surveysResult.data as any[])
        if (repairsResult.success) setRepairs(repairsResult.data as any[])
      } catch (err) {
        setError('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const completedRepairsWithoutSurvey = repairs.filter(
    (r) => r.status === RepairStatus.COMPLETED && !r.satisfactionSurvey
  )

  const filteredSurveys = surveys.filter((survey) => {
    return (
      survey.repairOrder?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      survey.repairOrder?.room?.building?.name?.includes(searchTerm) ||
      survey.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepair || !user) return

    setSubmitting(true)
    try {
      const result = await createSatisfactionSurvey({
        repairOrderId: selectedRepair.id,
        submitterId: user.id,
        ...formData,
      })
      if (result.success) {
        setSurveys([result.data as any, ...surveys])
        setShowSubmitModal(false)
        setSelectedRepair(null)
        setFormData({
          satisfaction: SatisfactionLevel.NEUTRAL,
          responseTime: 3,
          serviceQuality: 3,
          repairQuality: 3,
          comment: '',
        })
      }
    } catch (err) {
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const satisfactionStats = [
    { level: '非常满意', count: surveys.filter((s) => s.satisfaction === SatisfactionLevel.VERY_SATISFIED).length },
    { level: '满意', count: surveys.filter((s) => s.satisfaction === SatisfactionLevel.SATISFIED).length },
    { level: '一般', count: surveys.filter((s) => s.satisfaction === SatisfactionLevel.NEUTRAL).length },
    { level: '不满意', count: surveys.filter((s) => s.satisfaction === SatisfactionLevel.DISSATISFIED).length },
    { level: '非常不满意', count: surveys.filter((s) => s.satisfaction === SatisfactionLevel.VERY_DISSATISFIED).length },
  ].filter((s) => s.count > 0)

  const avgScores = {
    responseTime: surveys.length > 0 
      ? (surveys.reduce((sum, s) => sum + (s.responseTime || 0), 0) / surveys.length).toFixed(1)
      : 0,
    serviceQuality: surveys.length > 0
      ? (surveys.reduce((sum, s) => sum + (s.serviceQuality || 0), 0) / surveys.length).toFixed(1)
      : 0,
    repairQuality: surveys.length > 0
      ? (surveys.reduce((sum, s) => sum + (s.repairQuality || 0), 0) / surveys.length).toFixed(1)
      : 0,
  }

  if (loading) return <LoadingPage />
  if (error) return <ErrorState title={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">满意度调查</h1>
          <p className="text-gray-500 mt-1">共 {filteredSurveys.length} 条调查记录</p>
        </div>
        {user?.role === 'STUDENT' && completedRepairsWithoutSurvey.length > 0 && (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn btn-primary"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            填写评价
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">总评价数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{surveys.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">响应速度评分</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{avgScores.responseTime}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">服务质量评分</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{avgScores.serviceQuality}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">维修质量评分</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{avgScores.repairQuality}</p>
        </div>
      </div>

      {satisfactionStats.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">满意度分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={satisfactionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="数量" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索报修内容、楼栋、评价..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {filteredSurveys.length === 0 ? (
        <EmptyState
          title="暂无调查记录"
          description={searchTerm ? '没有找到符合条件的调查记录' : '还没有任何满意度调查记录'}
        />
      ) : (
        <div className="space-y-4">
          {filteredSurveys.map((survey) => (
            <div key={survey.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getSatisfactionEmoji(survey.satisfaction)}</span>
                    <span className="font-medium text-gray-900">
                      {getSatisfactionText(survey.satisfaction)}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {survey.repairOrder?.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {survey.repairOrder?.room?.building?.name}{' '}
                    {survey.repairOrder?.room?.roomNumber}室 · {survey.repairOrder?.assignedWorker?.name} ·{' '}
                    {formatDate(survey.submittedAt)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (survey.responseTime || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">响应速度</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (survey.serviceQuality || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">服务质量</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (survey.repairQuality || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">维修质量</p>
                </div>
              </div>
              {survey.comment && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-600 text-sm">{survey.comment}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showSubmitModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSubmitModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">提交满意度评价</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="label">选择报修单</label>
                <select
                  value={selectedRepair?.id || ''}
                  onChange={(e) =>
                    setSelectedRepair(completedRepairsWithoutSurvey.find((r) => r.id === e.target.value))
                  }
                  className="input"
                  required
                >
                  <option value="">请选择要评价的报修单</option>
                  {completedRepairsWithoutSurvey.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} - {r.room?.building?.name} {r.room?.roomNumber}室
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">整体满意度</label>
                <div className="flex gap-2">
                  {[
                    { value: SatisfactionLevel.VERY_DISSATISFIED, label: '非常不满意', emoji: '😞' },
                    { value: SatisfactionLevel.DISSATISFIED, label: '不满意', emoji: '😕' },
                    { value: SatisfactionLevel.NEUTRAL, label: '一般', emoji: '😐' },
                    { value: SatisfactionLevel.SATISFIED, label: '满意', emoji: '😊' },
                    { value: SatisfactionLevel.VERY_SATISFIED, label: '非常满意', emoji: '😄' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, satisfaction: item.value })}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${
                        formData.satisfaction === item.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{item.emoji}</span>
                      <p className="text-xs mt-1 text-gray-600">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">响应速度</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, responseTime: star })}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= formData.responseTime
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">服务质量</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, serviceQuality: star })}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= formData.serviceQuality
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">维修质量</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, repairQuality: star })}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          star <= formData.repairQuality
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">评价建议</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="请输入您的评价或建议..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting || !selectedRepair}>
                  {submitting ? <Loading size="sm" /> : '提交评价'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
