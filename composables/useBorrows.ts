import type { BorrowRecord, BorrowStatus } from '../types'

export function useBorrows() {
  const records = ref<BorrowRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchBorrows(params?: { status?: string; toolId?: number; applicantId?: number }) {
    loading.value = true
    error.value = null
    try {
      const queryParams: Record<string, string> = {}
      if (params?.status) queryParams.status = params.status
      if (params?.toolId) queryParams.toolId = params.toolId.toString()
      if (params?.applicantId) queryParams.applicantId = params.applicantId.toString()

      const { data } = await useFetch<{ records: BorrowRecord[] }>('/api/borrows', {
        query: queryParams
      })
      if (data.value) {
        records.value = data.value.records
      }
    } catch (e: any) {
      error.value = e.message || '获取借用记录失败'
    } finally {
      loading.value = false
    }
  }

  async function createBorrow(borrowData: {
    toolId: number
    applicantId: number
    applicantName: string
    applicantDepartment: string
    purpose: string
    expectedReturnDate: string
  }) {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ record: BorrowRecord }>('/api/borrows', {
        method: 'POST',
        body: borrowData
      })
      return data.value?.record
    } catch (e: any) {
      error.value = e.message || '创建借用申请失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function approveBorrow(id: number, approved: boolean, approverId: number, approverName: string, remark?: string) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/borrows/${id}/approve`, {
        method: 'POST',
        body: { approved, approverId, approverName, remark }
      })
    } catch (e: any) {
      error.value = e.message || '审批失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function handoverBorrow(id: number, handoverPersonId: number, handoverPersonName: string) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/borrows/${id}/handover`, {
        method: 'POST',
        body: { handoverPersonId, handoverPersonName }
      })
    } catch (e: any) {
      error.value = e.message || '交接失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function returnBorrow(id: number, inspectorId: number, inspectorName: string, condition?: string) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/borrows/${id}/return`, {
        method: 'POST',
        body: { inspectorId, inspectorName, condition }
      })
    } catch (e: any) {
      error.value = e.message || '归还失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    records,
    loading,
    error,
    fetchBorrows,
    createBorrow,
    approveBorrow,
    handoverBorrow,
    returnBorrow
  }
}

export function getBorrowStatusLabel(status: BorrowStatus): string {
  const labels: Record<BorrowStatus, string> = {
    pending: '待审批',
    approved: '已审批',
    rejected: '已拒绝',
    borrowed: '借用中',
    returned: '已归还',
    overdue: '已逾期'
  }
  return labels[status] || status
}

export function getBorrowStatusColor(status: BorrowStatus): string {
  const colors: Record<BorrowStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    borrowed: 'bg-green-100 text-green-800',
    returned: 'bg-gray-100 text-gray-800',
    overdue: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}
