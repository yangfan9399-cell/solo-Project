import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { FiberSample, FilterState, ImportRow, PrecheckResult, FiberStatus, DryingRecord, MicroPhoto } from '../types'
import * as API from '../api/mockApi'
import { DRYING_CONDITIONS, OPERATORS } from '../data/seed'

interface Ctx {
  samples: FiberSample[]
  filter: FilterState
  setFilter: (patch: Partial<FilterState>) => void
  activeDetailId: string | null
  setActiveDetailId: (id: string | null) => void
  pagedItems: FiberSample[]
  totalItems: number
  pagedTotal: number

  precheckResult: PrecheckResult | null
  pendingRows: ImportRow[]
  importMode: 'NONE' | 'SINGLE' | 'BATCH' | 'REVIEW'
  setImportMode: (m: 'NONE' | 'SINGLE' | 'BATCH' | 'REVIEW') => void
  pasteText: string
  setPasteText: (s: string) => void

  doPrecheck: () => void
  commitImport: () => { added: number }
  discardPending: () => void

  changeStatus: (id: string, next: FiberStatus, note: string) => void
  judge: (id: string, c: 'PASS' | 'FAIL' | 'CONFLICT', remark: string) => void
  addDrying: (id: string, r: Omit<DryingRecord, 'id' | 'moistureContent' | 'recordedAt'>) => void
  addPhoto: (id: string, p: Omit<MicroPhoto, 'id' | 'capturedAt'>) => void
  updateSample: (id: string, patch: Partial<FiberSample>) => void

  getConflictGroup: (s: FiberSample) => FiberSample[]
  exportRows: () => any[]
  insertSamples: (newOnes: FiberSample[]) => void
  removeSamples: (ids: string[]) => void

  resetAll: () => void
  toast: string | null
  showToast: (m: string) => void
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [samples, setSamples] = useState<FiberSample[]>(() => API.ensureSeed())
  const [filter, setFilterState] = useState<FilterState>(() => API.loadFilter())
  const [activeDetailId, setActiveDetailIdState] = useState<string | null>(() => API.loadActiveDetail())

  const [precheckResult, setPrecheckResult] = useState<PrecheckResult | null>(null)
  const [pendingRows, setPendingRows] = useState<ImportRow[]>([])
  const [importMode, setImportMode] = useState<'NONE' | 'SINGLE' | 'BATCH' | 'REVIEW'>('NONE')
  const [pasteText, setPasteText] = useState('')

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  const showToast = useCallback((m: string) => {
    setToast(m)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    localStorage.setItem('__pulp_samples__', JSON.stringify(samples.map(s => s.id)))
    API.saveFilter(filter)
    API.saveActiveDetail(activeDetailId)
  }, [samples, filter, activeDetailId])

  const setFilter = useCallback((patch: Partial<FilterState>) => {
    setFilterState(f => ({ ...f, ...patch, page: patch.page ?? (Object.keys(patch).some(k => k !== 'page' && k !== 'pageSize') ? 1 : f.page) }))
  }, [])

  const setActiveDetailId = useCallback((id: string | null) => setActiveDetailIdState(id), [])

  const { items: pagedItems, total: totalItems } = useMemo(
    () => API.listSamples(filter, samples),
    [filter, samples]
  )

  const doPrecheck = useCallback(() => {
    let rows: ImportRow[] = []
    if (pasteText.trim()) {
      rows = API.parsePastedText(pasteText)
    }
    setPendingRows(rows)
    const res = API.runPrecheck(rows, samples)
    setPrecheckResult(res)
    setImportMode('REVIEW')
    showToast(`预检完成：${rows.length} 条，通过 ${res.passRows}，问题 ${res.issues.length}`)
  }, [pasteText, samples, showToast])

  const commitImport = useCallback(() => {
    if (!precheckResult || pendingRows.length === 0) return { added: 0 }
    const validated = API.validateRows(pendingRows)
    const newSamples = API.convertValidatedToSamples(validated, samples)
    setSamples(cur => API.addSamples(newSamples, cur))
    showToast(`已导入 ${newSamples.length} 条样本`)
    setPendingRows([])
    setPrecheckResult(null)
    setPasteText('')
    setImportMode('NONE')
    return { added: newSamples.length }
  }, [pendingRows, precheckResult, samples, showToast])

  const discardPending = useCallback(() => {
    setPendingRows([])
    setPrecheckResult(null)
    setPasteText('')
    setImportMode('NONE')
  }, [])

  const changeStatus = useCallback((id: string, next: FiberStatus, note: string) => {
    setSamples(cur => API.changeStatus(id, next, note, cur))
    showToast(`状态已更新 → ${next}`)
  }, [showToast])

  const judge = useCallback((id: string, c: 'PASS' | 'FAIL' | 'CONFLICT', remark: string) => {
    setSamples(cur => API.judgeSample(id, c, remark, cur))
    showToast(`判读完成：${c}`)
  }, [showToast])

  const addDrying = useCallback((id: string, r: Omit<DryingRecord, 'id' | 'moistureContent' | 'recordedAt'>) => {
    setSamples(cur => API.addDryingRecord(id, r, cur))
    showToast('烘干称重记录已保存')
  }, [showToast])

  const addPhoto = useCallback((id: string, p: Omit<MicroPhoto, 'id' | 'capturedAt'>) => {
    setSamples(cur => API.addMicroPhoto(id, p, cur))
    showToast('显微照片已保存')
  }, [showToast])

  const updateSample = useCallback((id: string, patch: Partial<FiberSample>) => {
    setSamples(cur => API.updateSample(id, patch, cur))
  }, [])

  const getConflictGroup = useCallback((s: FiberSample) => API.getConflictGroup(s, samples), [samples])
  const exportRows = useCallback(() => API.exportPreview(samples), [samples])
  const insertSamples = useCallback((newOnes: FiberSample[]) => {
    setSamples(cur => API.addSamples(newOnes, cur))
    showToast(`新增 ${newOnes.length} 条`)
  }, [showToast])
  const removeSamples = useCallback((ids: string[]) => {
    setSamples(cur => cur.filter(s => !ids.includes(s.id)))
    showToast(`删除 ${ids.length} 条`)
    ids.forEach(id => { if (activeDetailId === id) setActiveDetailIdState(null) })
  }, [activeDetailId, showToast])
  const resetAll = useCallback(() => {
    const s = API.resetAllData()
    setSamples(s)
    setFilterState(API.loadFilter())
    setActiveDetailIdState(null)
    showToast('已重置到种子数据')
  }, [showToast])

  const value: Ctx = {
    samples,
    filter, setFilter,
    activeDetailId, setActiveDetailId,
    pagedItems, totalItems,
    pagedTotal: Math.ceil(totalItems / Math.max(1, filter.pageSize)),

    precheckResult, pendingRows, importMode, setImportMode,
    pasteText, setPasteText,

    doPrecheck, commitImport, discardPending,

    changeStatus, judge, addDrying, addPhoto, updateSample,

    getConflictGroup, exportRows, insertSamples, removeSamples,
    resetAll, toast, showToast,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useStore(): Ctx {
  const c = useContext(AppContext)
  if (!c) throw new Error('useStore must be used inside AppProvider')
  return c
}

export { DRYING_CONDITIONS, OPERATORS }
