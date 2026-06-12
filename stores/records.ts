import { defineStore } from 'pinia'
import type { RecordSummary, RecordDetail, StatisticsData, NodeActionPayload, UserInfo, RecordStatus, SampleType, PumpStation } from '~/types'

interface RecordsState {
  list: RecordSummary[]
  detail: RecordDetail | null
  statistics: StatisticsData | null
  users: UserInfo[]
  stations: PumpStation[]
  filters: {
    status: string
    sampleType: string
    stationId: string
    keyword: string
  }
  currentUser: UserInfo | null
  loading: boolean
}

export const useRecordsStore = defineStore('records', {
  state: (): RecordsState => ({
    list: [],
    detail: null,
    statistics: null,
    users: [],
    stations: [],
    filters: {
      status: '',
      sampleType: '',
      stationId: '',
      keyword: ''
    },
    currentUser: null,
    loading: false
  }),

  getters: {
    getListSummary: (state) => {
      return (id: string) => state.list.find(r => r.id === id)
    },
    isApplicant: (state) => state.currentUser?.role === 'APPLICANT',
    isReviewer: (state) => state.currentUser?.role === 'REVIEWER' || state.currentUser?.role === 'ADMIN',
    canEdit: (state) => {
      if (!state.detail) return false
      if (state.detail.isArchived) return false
      const detail: any = state.detail
      if (state.currentUser?.role === 'APPLICANT') {
        return detail.currentHandlerId === state.currentUser.id
      }
      return state.currentUser?.role === 'REVIEWER' || state.currentUser?.role === 'ADMIN'
    }
  },

  actions: {
    setCurrentUser(user: UserInfo) {
      this.currentUser = user
    },

    async fetchUsers() {
      const res = await $fetch<{ success: boolean; data: UserInfo[] }>('/api/users')
      if (res.success) {
        this.users = res.data
      }
    },

    async fetchStations() {
      const res = await $fetch<{ success: boolean; data: PumpStation[] }>('/api/stations')
      if (res.success) {
        this.stations = res.data
      }
    },

    async fetchList() {
      this.loading = true
      try {
        const params = new URLSearchParams()
        if (this.filters.status) params.append('status', this.filters.status)
        if (this.filters.sampleType) params.append('sampleType', this.filters.sampleType)
        if (this.filters.stationId) params.append('stationId', this.filters.stationId)
        if (this.filters.keyword) params.append('keyword', this.filters.keyword)

        const res = await $fetch<{ success: boolean; data: RecordSummary[] }>(
          `/api/records?${params.toString()}`
        )
        if (res.success) {
          this.list = res.data
        }
      } finally {
        this.loading = false
      }
    },

    async fetchDetail(id: string) {
      this.loading = true
      try {
        const res = await $fetch<{ success: boolean; data: RecordDetail }>(`/api/records/${id}`)
        if (res.success) {
          this.detail = res.data
          const idx = this.list.findIndex(r => r.id === id)
          if (idx >= 0) {
            this.list[idx] = {
              id: res.data.id,
              recordNo: res.data.recordNo,
              title: res.data.title,
              status: res.data.status,
              source: res.data.source,
              stationName: res.data.stationName,
              currentHandlerId: res.data.currentHandlerId,
              keyObject: res.data.keyObject,
              currentHandlerName: res.data.currentHandlerName,
              occurrenceTime: res.data.occurrenceTime,
              amount: res.data.amount,
              evidenceConclusion: res.data.evidenceConclusion,
              sampleType: res.data.sampleType,
              isArchived: res.data.isArchived,
              updatedAt: res.data.updatedAt
            }
          }
        }
        return res.data
      } finally {
        this.loading = false
      }
    },

    async fetchStatistics() {
      this.loading = true
      try {
        const res = await $fetch<{ success: boolean; data: StatisticsData }>('/api/statistics')
        if (res.success) {
          this.statistics = res.data
        }
        return res.data
      } finally {
        this.loading = false
      }
    },

    syncFromDetail(id: string) {
      if (!this.detail || this.detail.id !== id) return
      const idx = this.list.findIndex(r => r.id === id)
      if (idx >= 0) {
        this.list[idx] = {
          id: this.detail.id,
          recordNo: this.detail.recordNo,
          title: this.detail.title,
          status: this.detail.status,
          source: this.detail.source,
          stationName: this.detail.stationName,
          currentHandlerId: this.detail.currentHandlerId,
          keyObject: this.detail.keyObject,
          currentHandlerName: this.detail.currentHandlerName,
          occurrenceTime: this.detail.occurrenceTime,
          amount: this.detail.amount,
          evidenceConclusion: this.detail.evidenceConclusion,
          sampleType: this.detail.sampleType,
          isArchived: this.detail.isArchived,
          updatedAt: this.detail.updatedAt
        }
      }
    },

    async performAction(action: string, id: string, payload: Partial<NodeActionPayload>) {
      if (!this.currentUser) throw new Error('请先选择当前用户')

      const fullPayload: NodeActionPayload = {
        recordId: id,
        operatorId: this.currentUser.id,
        operatorName: this.currentUser.name,
        ...payload
      }

      const res = await $fetch<{ success: boolean; data: any }>(
        `/api/records/${id}/${action}`,
        { method: 'POST', body: fullPayload }
      )

      if (res.success) {
        await this.fetchDetail(id)
        await this.fetchList()
        await this.fetchStatistics()
      }

      return res
    },

    async acceptRecord(id: string, remark: string) {
      return this.performAction('accept', id, { remark })
    },

    async processRecord(id: string, data: {
      remark: string
      evidenceConclusion: string
      attachments?: any[]
      updatedFields?: NodeActionPayload['updatedFields']
    }) {
      return this.performAction('process', id, {
        remark: data.remark,
        evidenceConclusion: data.evidenceConclusion,
        attachments: data.attachments,
        updatedFields: data.updatedFields
      })
    },

    async supplementRecord(id: string, data: {
      businessRecord: string
      siteDescription: string
      evidenceConclusion?: string
      attachments?: any[]
      updatedFields?: NodeActionPayload['updatedFields']
    }) {
      return this.performAction('supplement', id, {
        businessRecord: data.businessRecord,
        siteDescription: data.siteDescription,
        evidenceConclusion: data.evidenceConclusion,
        attachments: data.attachments,
        updatedFields: data.updatedFields
      })
    },

    async reviewRecord(id: string, data: {
      remark: string
      evidenceConclusion: string
      attachments?: any[]
      updatedFields?: NodeActionPayload['updatedFields']
    }) {
      return this.performAction('review', id, {
        remark: data.remark,
        evidenceConclusion: data.evidenceConclusion,
        attachments: data.attachments,
        updatedFields: data.updatedFields
      })
    },

    async archiveRecord(id: string, remark: string) {
      return this.performAction('archive', id, { remark })
    },

    async rejectRecord(id: string, data: {
      remark: string
      blockReason: string
      remedyPath: string
    }) {
      return this.performAction('reject', id, {
        remark: data.remark,
        blockReason: data.blockReason,
        remedyPath: data.remedyPath
      })
    },

    async reopenRecord(id: string, data: {
      remark: string
      blockReason: string
      remedyPath: string
      updatedFields?: NodeActionPayload['updatedFields']
    }) {
      return this.performAction('reopen', id, {
        remark: data.remark,
        blockReason: data.blockReason,
        remedyPath: data.remedyPath,
        updatedFields: data.updatedFields
      })
    },

    updateFilters(filters: Partial<RecordsState['filters']>) {
      this.filters = { ...this.filters, ...filters }
    }
  }
})
