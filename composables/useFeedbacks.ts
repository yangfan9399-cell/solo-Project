import type { Feedback, FeedbackStatus } from '../types'

export function useFeedbacks() {
  const records = ref<Feedback[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchFeedbacks(params?: { status?: string; toolId?: number }) {
    loading.value = true
    error.value = null
    try {
      const queryParams: Record<string, string> = {}
      if (params?.status) queryParams.status = params.status
      if (params?.toolId) queryParams.toolId = params.toolId.toString()

      const { data } = await useFetch<{ records: Feedback[] }>('/api/feedbacks', {
        query: queryParams
      })
      if (data.value) {
        records.value = data.value.records
      }
    } catch (e: any) {
      error.value = e.message || '获取反馈记录失败'
    } finally {
      loading.value = false
    }
  }

  async function createFeedback(feedbackData: {
    toolId?: number
    toolCode?: string
    reporterId: number
    reporterName: string
    type: string
    title: string
    description: string
  }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ record: Feedback }>('/api/feedbacks', {
        method: 'POST',
        body: feedbackData
      })
      return data.value?.record
    } catch (e: any) {
      error.value = e.message || '创建反馈失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function handleFeedback(id: number, data: {
    status: FeedbackStatus
    handlerId: number
    handlerName: string
    result?: string
  }) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/feedbacks/${id}/handle`, {
        method: 'POST',
        body: data
      })
    } catch (e: any) {
      error.value = e.message || '处理反馈失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    records,
    loading,
    error,
    fetchFeedbacks,
    createFeedback,
    handleFeedback
  }
}

export function getFeedbackStatusLabel(status: FeedbackStatus): string {
  const labels: Record<FeedbackStatus, string> = {
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return labels[status] || status
}

export function getFeedbackStatusColor(status: FeedbackStatus): string {
  const colors: Record<FeedbackStatus, string> = {
    open: 'badge-red',
    processing: 'badge-yellow',
    resolved: 'badge-green',
    closed: 'badge-gray'
  }
  return colors[status] || 'badge-gray'
}
