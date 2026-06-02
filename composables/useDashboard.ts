import type { DashboardStats } from '../types'

export function useDashboard() {
  const stats = ref<DashboardStats | null>(null)
  const calibrationAlerts = ref<{ dueSoon: any[]; overdue: any[] }>({ dueSoon: [], overdue: [] })
  const borrowAlerts = ref<{ overdue: any[] }>({ overdue: [] })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchStats() {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ stats: DashboardStats }>('/api/dashboard/stats')
      if (data.value) {
        stats.value = data.value.stats
      }
    } catch (e: any) {
      error.value = e.message || '获取统计数据失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchCalibrationAlerts() {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ dueSoon: any[]; overdue: any[] }>('/api/dashboard/calibration-alerts')
      if (data.value) {
        calibrationAlerts.value = data.value
      }
    } catch (e: any) {
      error.value = e.message || '获取校准预警失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchBorrowAlerts() {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ overdue: any[] }>('/api/dashboard/borrow-alerts')
      if (data.value) {
        borrowAlerts.value = data.value
      }
    } catch (e: any) {
      error.value = e.message || '获取借用预警失败'
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    calibrationAlerts,
    borrowAlerts,
    loading,
    error,
    fetchStats,
    fetchCalibrationAlerts,
    fetchBorrowAlerts
  }
}
