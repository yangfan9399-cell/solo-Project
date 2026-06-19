import { create } from 'zustand'
import type {
  Specimen,
  SpecimenDetail,
  SpecimenFilter,
  User,
  ExportPreviewResponse,
  ExportBatch,
  Assignment,
  Rejection,
  LockRecord,
  HistoryRecord,
  BatchAssignRequest,
  BatchRejectRequest,
  ReviewRequest,
  LockRequest,
} from '@/types'
import { specimenApi, assignmentApi, rejectionApi, exportApi } from '@/lib/api'

const mockUsers: User[] = [
  { id: '1', name: '李主任', role: '主任' },
  { id: '2', name: '王研究员', role: '研究员' },
  { id: '3', name: '张博士', role: '博士' },
]

interface SpecimenState {
  specimens: Specimen[]
  selectedSpecimenIds: number[]
  specimenDetail: SpecimenDetail | null
  specimenHistory: HistoryRecord[]
  assignments: Assignment[]
  rejections: Rejection[]
  lockRecords: LockRecord[]
  exportBatches: ExportBatch[]
  exportPreview: ExportPreviewResponse | null
  lastExportBatch: ExportBatch | null
  filter: SpecimenFilter
  users: User[]
  currentUser: User
  isLoading: boolean
  error: string | null
  showAssignDialog: boolean
  showRejectDialog: boolean
  showExportDialog: boolean
  showDetailSidebar: boolean
  detailSpecimenId: number | null
  showHistory: boolean
  historySpecimenId: number | null
}

interface SpecimenActions {
  fetchSpecimens: (status?: string) => Promise<void>
  setSpecimens: (specimens: Specimen[]) => void
  fetchSpecimenDetail: (id: number) => Promise<void>
  fetchAssignments: () => Promise<void>
  fetchRejections: () => Promise<void>
  fetchExportBatches: () => Promise<void>
  batchAssign: (data: Omit<BatchAssignRequest, 'specimen_ids'>) => Promise<void>
  batchReject: (data: Omit<BatchRejectRequest, 'specimen_ids'>) => Promise<void>
  reviewSpecimen: (id: number, data: ReviewRequest) => Promise<void>
  toggleLock: (id: number, data: LockRequest) => Promise<void>
  fetchExportPreview: () => Promise<void>
  executeExport: () => Promise<void>
  fetchHistory: (id: number) => Promise<void>
  moveSpecimenToStatus: (id: number, targetStatus: string) => Promise<void>
  updateSpecimenStatus: (id: number, status: string) => Promise<void>
  updateSpecimenStatusOptimistic: (id: number, status: string) => void
  toggleSelectSpecimen: (id: number) => void
  selectAllSpecimens: (ids: number[]) => void
  clearSelection: () => void
  setCurrentUser: (user: User) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  openDetail: (specimen: Specimen) => void
  closeDetail: () => void
  openHistory: (specimenId: number) => void
  closeHistory: () => void
  openAssignDialog: () => void
  closeAssignDialog: () => void
  openRejectDialog: () => void
  closeRejectDialog: () => void
  openExportDialog: () => void
  closeExportDialog: () => void
  resetAll: () => void
}

const initialFilter: SpecimenFilter = {
  status: undefined,
  substrate: undefined,
  spore_density: undefined,
  humidity_exposure: undefined,
  season: undefined,
  search: undefined,
  date_from: undefined,
  date_to: undefined,
}

export const useSpecimenStore = create<SpecimenState & SpecimenActions>((set, get) => ({
  specimens: [],
  selectedSpecimenIds: [],
  specimenDetail: null,
  specimenHistory: [],
  assignments: [],
  rejections: [],
  lockRecords: [],
  exportBatches: [],
  exportPreview: null,
  lastExportBatch: null,
  filter: initialFilter,
  users: mockUsers,
  currentUser: mockUsers[0],
  isLoading: false,
  error: null,
  showAssignDialog: false,
  showRejectDialog: false,
  showExportDialog: false,
  showDetailSidebar: false,
  detailSpecimenId: null,
  showHistory: false,
  historySpecimenId: null,

  fetchSpecimens: async (status?: string) => {
    set({ isLoading: true, error: null })
    try {
      const data = await specimenApi.getSpecimens(status)
      set({ specimens: data, isLoading: false })
    } catch (error) {
      set({ error: '获取标本列表失败', isLoading: false })
      console.error(error)
    }
  },

  setSpecimens: (specimens: Specimen[]) => {
    set({ specimens })
  },

  fetchSpecimenDetail: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const data = await specimenApi.getSpecimen(id)
      set({ specimenDetail: data, isLoading: false })
    } catch (error) {
      set({ error: '获取标本详情失败', isLoading: false })
      console.error(error)
    }
  },

  fetchAssignments: async () => {
    try {
      const data = await assignmentApi.getAssignments()
      set({ assignments: data })
    } catch (error) {
      console.error(error)
    }
  },

  fetchRejections: async () => {
    try {
      const data = await rejectionApi.getRejections()
      set({ rejections: data })
    } catch (error) {
      console.error(error)
    }
  },

  fetchExportBatches: async () => {
    try {
      const data = await exportApi.getExportBatches()
      set({ exportBatches: data })
    } catch (error) {
      console.error(error)
    }
  },

  batchAssign: async (data) => {
    const { selectedSpecimenIds, currentUser } = get()
    if (selectedSpecimenIds.length === 0) return

    set({ isLoading: true, error: null })
    try {
      const result = await assignmentApi.batchAssign({
        specimen_ids: selectedSpecimenIds,
        assign_from: currentUser.name,
        ...data,
      })
      set({
        assignments: [...get().assignments, ...result],
        isLoading: false,
        showAssignDialog: false,
        selectedSpecimenIds: [],
      })
      await get().fetchSpecimens()
    } catch (error) {
      set({ error: '批量分配失败', isLoading: false })
      console.error(error)
    }
  },

  batchReject: async (data) => {
    const { selectedSpecimenIds } = get()
    if (selectedSpecimenIds.length === 0) return

    set({ isLoading: true, error: null })
    try {
      const result = await rejectionApi.batchReject({
        specimen_ids: selectedSpecimenIds,
        ...data,
      })
      set({
        rejections: [...get().rejections, ...result],
        isLoading: false,
        showRejectDialog: false,
        selectedSpecimenIds: [],
      })
      await get().fetchSpecimens()
    } catch (error) {
      set({ error: '批量退回失败', isLoading: false })
      console.error(error)
    }
  },

  reviewSpecimen: async (id: number, data: ReviewRequest) => {
    set({ isLoading: true, error: null })
    try {
      const result = await specimenApi.reviewSpecimen(id, data)
      set((state) => ({
        specimens: state.specimens.map((s) => (s.id === id ? result : s)),
        specimenDetail: state.specimenDetail?.id === id
          ? { ...state.specimenDetail, ...result }
          : state.specimenDetail,
        isLoading: false,
      }))
    } catch (error) {
      set({ error: '保存判读意见失败', isLoading: false })
      console.error(error)
    }
  },

  toggleLock: async (id: number, data: LockRequest) => {
    set({ isLoading: true, error: null })
    try {
      const result = await specimenApi.toggleLock(id, data)
      set((state) => ({
        lockRecords: [...state.lockRecords, result],
        specimens: state.specimens.map((s) =>
          s.id === id
            ? { ...s, status: result.is_locked ? '已锁定' : '复判中' as const }
            : s
        ),
        isLoading: false,
      }))
      await get().fetchSpecimenDetail(id)
    } catch (error) {
      set({ error: '操作失败', isLoading: false })
      console.error(error)
    }
  },

  fetchExportPreview: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await exportApi.previewExport()
      set({ exportPreview: data, isLoading: false })
    } catch (error) {
      set({ error: '获取导出预览失败', isLoading: false })
      console.error(error)
    }
  },

  executeExport: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await exportApi.executeExport()
      set({
        lastExportBatch: result,
        exportBatches: [...get().exportBatches, result],
        isLoading: false,
      })
      await get().fetchSpecimens()
    } catch (error) {
      set({ error: '执行导出失败', isLoading: false })
      console.error(error)
    }
  },

  fetchHistory: async (id: number) => {
    set({ isLoading: true, error: null })
    try {
      const data = await specimenApi.getHistory(id)
      set({ specimenHistory: data, isLoading: false })
    } catch (error) {
      set({ error: '获取历史记录失败', isLoading: false })
      console.error(error)
    }
  },

  moveSpecimenToStatus: async (id: number, targetStatus: string) => {
    const { specimens, currentUser } = get()
    const originalSpecimen = specimens.find((s) => s.id === id)
    if (!originalSpecimen) return
    if (originalSpecimen.status === targetStatus) return

    set((state) => ({
      specimens: state.specimens.map((s) =>
        s.id === id ? { ...s, status: targetStatus as Specimen['status'] } : s
      ),
    }))

    try {
      if (targetStatus === '已锁定' && originalSpecimen.status !== '已锁定') {
        await specimenApi.toggleLock(id, { locked_by: currentUser.name })
      } else if (originalSpecimen.status === '已锁定' && targetStatus !== '已锁定') {
        await specimenApi.toggleLock(id, {
          locked_by: currentUser.name,
          unlock_reason: '看板拖拽调整状态',
        })
      } else {
        await specimenApi.updateStatus(id, targetStatus)
      }
    } catch (error: any) {
      if (originalSpecimen) {
        set((state) => ({
          specimens: state.specimens.map((s) =>
            s.id === id ? { ...s, status: originalSpecimen.status } : s
          ),
          error: error?.response?.data?.detail || '状态流转失败，已回滚',
        }))
      }
      console.error(error)
    }
  },

  updateSpecimenStatus: async (id: number, status: string) => {
    const { specimens } = get()
    const originalSpecimen = specimens.find((s) => s.id === id)
    if (!originalSpecimen) return

    set((state) => ({
      specimens: state.specimens.map((s) =>
        s.id === id ? { ...s, status: status as Specimen['status'] } : s
      ),
    }))

    try {
      await specimenApi.updateStatus(id, status)
    } catch (error) {
      if (originalSpecimen) {
        set((state) => ({
          specimens: state.specimens.map((s) =>
            s.id === id ? { ...s, status: originalSpecimen.status } : s
          ),
          error: '状态更新失败，已回滚',
        }))
      }
      console.error(error)
    }
  },

  updateSpecimenStatusOptimistic: (id: number, status: string) => {
    set((state) => ({
      specimens: state.specimens.map((s) =>
        s.id === id ? { ...s, status: status as Specimen['status'] } : s
      ),
    }))
  },

  toggleSelectSpecimen: (id: number) => {
    set((state) => ({
      selectedSpecimenIds: state.selectedSpecimenIds.includes(id)
        ? state.selectedSpecimenIds.filter((sid) => sid !== id)
        : [...state.selectedSpecimenIds, id],
    }))
  },

  selectAllSpecimens: (ids: number[]) => {
    set({ selectedSpecimenIds: ids })
  },

  clearSelection: () => {
    set({ selectedSpecimenIds: [] })
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user })
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  openDetail: (specimen: Specimen) => {
    set({
      showDetailSidebar: true,
      detailSpecimenId: specimen.id,
    })
    get().fetchSpecimenDetail(specimen.id)
  },

  closeDetail: () => {
    set({
      showDetailSidebar: false,
      detailSpecimenId: null,
      specimenDetail: null,
    })
  },

  openHistory: (specimenId: number) => {
    set({
      showHistory: true,
      historySpecimenId: specimenId,
    })
    get().fetchHistory(specimenId)
  },

  closeHistory: () => {
    set({
      showHistory: false,
      historySpecimenId: null,
      specimenHistory: [],
    })
  },

  openAssignDialog: () => {
    set({ showAssignDialog: true })
  },

  closeAssignDialog: () => {
    set({ showAssignDialog: false })
  },

  openRejectDialog: () => {
    set({ showRejectDialog: true })
  },

  closeRejectDialog: () => {
    set({ showRejectDialog: false })
  },

  openExportDialog: () => {
    set({ showExportDialog: true, lastExportBatch: null })
    get().fetchExportPreview()
  },

  closeExportDialog: () => {
    set({
      showExportDialog: false,
      exportPreview: null,
      lastExportBatch: null,
    })
  },

  resetAll: () => {
    set({
      selectedSpecimenIds: [],
      showAssignDialog: false,
      showRejectDialog: false,
      showExportDialog: false,
      showDetailSidebar: false,
      showHistory: false,
      error: null,
    })
  },
}))
