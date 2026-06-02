import type { Tool, ToolStatus } from '../types'

export function useTools() {
  const tools = ref<Tool[]>([])
  const tool = ref<Tool | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchTools(params?: { status?: string; search?: string; department?: string }) {
    loading.value = true
    error.value = null
    try {
      const queryParams: Record<string, string> = {}
      if (params?.status) queryParams.status = params.status
      if (params?.search) queryParams.search = params.search
      if (params?.department) queryParams.department = params.department

      const { data } = await useFetch<{ tools: Tool[] }>('/api/tools', {
        query: queryParams
      })
      if (data.value) {
        tools.value = data.value.tools
      }
    } catch (e: any) {
      error.value = e.message || '获取量具列表失败'
    } finally {
      loading.value = false
    }
  }

  async function fetchTool(id: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ tool: Tool }>(`/api/tools/${id}`)
      if (data.value) {
        tool.value = data.value.tool
      }
    } catch (e: any) {
      error.value = e.message || '获取量具详情失败'
    } finally {
      loading.value = false
    }
  }

  async function createTool(toolData: Partial<Tool>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ tool: Tool }>('/api/tools', {
        method: 'POST',
        body: toolData
      })
      return data.value?.tool
    } catch (e: any) {
      error.value = e.message || '创建量具失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateTool(id: number, toolData: Partial<Tool>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await useFetch<{ tool: Tool }>(`/api/tools/${id}`, {
        method: 'PUT',
        body: toolData
      })
      return data.value?.tool
    } catch (e: any) {
      error.value = e.message || '更新量具失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function scrapTool(id: number, reason: string) {
    loading.value = true
    error.value = null
    try {
      await useFetch(`/api/tools/${id}/scrap`, {
        method: 'POST',
        body: { reason }
      })
    } catch (e: any) {
      error.value = e.message || '报废量具失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    tools,
    tool,
    loading,
    error,
    fetchTools,
    fetchTool,
    createTool,
    updateTool,
    scrapTool
  }
}

export function getToolStatusLabel(status: ToolStatus): string {
  const labels: Record<ToolStatus, string> = {
    available: '可用',
    borrowed: '借用中',
    calibrating: '校准中',
    maintenance: '维护中',
    scrapped: '已报废'
  }
  return labels[status] || status
}

export function getToolStatusColor(status: ToolStatus): string {
  const colors: Record<ToolStatus, string> = {
    available: 'bg-green-100 text-green-800',
    borrowed: 'bg-blue-100 text-blue-800',
    calibrating: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-orange-100 text-orange-800',
    scrapped: 'bg-gray-100 text-gray-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function canBorrowTool(tool: Tool): boolean {
  if (tool.status === 'scrapped') return false
  if (tool.status === 'borrowed') return false
  if (tool.status === 'calibrating') return false
  if (tool.status === 'maintenance') return false
  if (tool.hasPendingBorrow) return false
  if (tool.isBorrowedActive) return false
  return tool.status === 'available'
}

export function getBorrowDisableReason(tool: Tool): string {
  if (tool.status === 'scrapped') return '该量具已报废，无法借用'
  if (tool.status === 'borrowed') return '该量具已被借用'
  if (tool.status === 'calibrating') return '该量具正在校准中'
  if (tool.status === 'maintenance') return '该量具正在维护中'
  if (tool.hasPendingBorrow) return '该量具已有待审批的借用申请'
  if (tool.isBorrowedActive) return '该量具已被借出'
  if (tool.status !== 'available') return '该量具当前状态不可借用'
  return ''
}
