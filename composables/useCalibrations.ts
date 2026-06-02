import type { CalibrationRecord, CalibrationStatus } from '../types'

export function useCalibrations() {
  const records = ref<CalibrationRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCalibrations(params?: { status?: string; toolId?: number }) {
    loading.value = true
    error.value = null
    try {
      const queryParams: Record<string, string> = {}
      if (params?.status) queryParams.status = params.status
      if (params?.toolId) queryParams.toolId = params.toolId.toString()

      const { data } = await useFetch<{ records: CalibrationRecord[] }>('/api/calibrations', {
        query: queryParams
      })
      if (data.value) {
        records.value = data.value.records
      }
    } catch (e: any) {
      error.value = e.message || '获取校准记录失败'
    } finally {
      loading.value = false
    }
  }

  async function createCalibration(calibrationData: {
    toolId: number
    plannedDate: string
    calibrationAgency?: string
    inspectorId?: number
    inspectorName?: string
    remark?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ record: CalibrationRecord }>('/api/calibrations', {
        method: 'POST',
        body: calibrationData
      })
      return data.value?.record
    } catch (e: any) {
      error.value = e.message || '创建校准计划失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function startCalibration(id: number) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/calibrations/${id}/start`, {
        method: 'POST'
      })
    } catch (e: any) {
      error.value = e.message || '开始校准失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function completeCalibration(id: number, data: {
    passed: boolean
    actualDate: string
    certificateNumber?: string
    result?: string
    nextCalibrationDate?: string
    cost?: number
    remark?: string
  }) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/calibrations/${id}/complete`, {
        method: 'POST',
        body: data
      })
    } catch (e: any) {
      error.value = e.message || '完成校准失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    records,
    loading,
    error,
    fetchCalibrations,
    createCalibration,
    startCalibration,
    completeCalibration
  }
}

export function getCalibrationStatusLabel(status: CalibrationStatus): string {
  const labels: Record<CalibrationStatus, string> = {
    scheduled: '计划中',
    in_progress: '进行中',
    passed: '已通过',
    failed: '未通过'
  }
  return labels[status] || status
}

export function getCalibrationStatusColor(status: CalibrationStatus): string {
  const colors: Record<CalibrationStatus, string> = {
    scheduled: 'badge-blue',
    in_progress: 'badge-yellow',
    passed: 'badge-green',
    failed: 'badge-red'
  }
  return colors[status] || 'badge-gray'
}
