import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { FiberSample, FilterState, ImportRow, PrecheckResult, FiberStatus, DryingRecord, MicroPhoto } from '../types'
import { api } from '../api/client'
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
  loading: boolean

  precheckResult: PrecheckResult | null
  pendingRows: ImportRow[]
  importMode: 'NONE' | 'SINGLE' | 'BATCH' | 'REVIEW'
  setImportMode: (m: 'NONE' | 'SINGLE' | 'BATCH' | 'REVIEW') => void
  pasteText: string
  setPasteText: (s: string) => void

  doPrecheck: () => Promise<void>
  commitImport: () => Promise<{ added: number }>
  discardPending: () => void

  changeStatus: (id: string, next: FiberStatus, note: string) => Promise<void>
  judge: (id: string, c: 'PASS' | 'FAIL' | 'CONFLICT', remark: string) => Promise<void>
  addDrying: (id: string, r: Omit<DryingRecord, 'id' | 'moistureContent' | 'recordedAt'>) => Promise<void>
  addPhoto: (id: string, p: Omit<MicroPhoto, 'id' | 'capturedAt'>) => Promise<void>
  updateSample: (id: string, patch: Partial<FiberSample>) => void

  getConflictGroup: (s: FiberSample) => FiberSample[]
  exportRows: () => any[]
  insertSamples: (newOnes: FiberSample[]) => void
  removeSamples: (ids: string[]) => void

  resetAll: () => Promise<void>
  toast: string | null
  showToast: (m: string) => void

  refreshSamples: () => Promise<void>
}

const AppContext = createContext<Ctx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [samples, setSamples] = useState<FiberSample[]>([])
  const [filter, setFilterState] = useState<FilterState>({
    keyword: '', status: 'ALL', sourceType: 'ALL', pulpBatch: '',
    hasIssues: 'ALL', judgeConclusion: 'ALL', page: 1, pageSize: 10,
  })
  const [activeDetailId, setActiveDetailIdState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  const refreshSamples = useCallback(async () => {
    try {
      const res = await api.getAllSamples()
      setSamples(res.samples)
    } catch (e: any) {
      showToast(`加载失败：${e.message}`)
    }
  }, [showToast])

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const [sRes, fRes, dRes] = await Promise.all([
          api.getAllSamples(),
          api.getFilter(),
          api.getActiveDetail(),
        ])
        setSamples(sRes.samples)
        setFilterState(fRes.filter)
        setActiveDetailIdState(dRes.id)
      } catch (e: any) {
        showToast(`初始化失败：${e.message}`)
      } finally {
        setLoading(false)
      }
    })()
  }, [showToast])

  const setFilter = useCallback((patch: Partial<FilterState>) => {
    setFilterState(f => {
      const next = { ...f, ...patch, page: patch.page ?? (Object.keys(patch).some(k => k !== 'page' && k !== 'pageSize') ? 1 : f.page) }
      api.saveFilter(next).catch(() => {})
      return next
    })
  }, [])

  const setActiveDetailId = useCallback((id: string | null) => {
    setActiveDetailIdState(id)
    api.saveActiveDetail(id).catch(() => {})
  }, [])

  const { items: pagedItems, total: totalItems } = useMemo(() => {
    let list = [...samples]
    if (filter.keyword) {
      const kw = filter.keyword.toLowerCase()
      list = list.filter(s =>
        s.sampleCode.toLowerCase().includes(kw) || s.pulpBatch.toLowerCase().includes(kw) ||
        s.sourceInfo.toLowerCase().includes(kw) || s.operatorName.includes(kw) ||
        s.responsiblePersonName.includes(kw))
    }
    if (filter.status !== 'ALL') list = list.filter(s => s.status === filter.status)
    if (filter.sourceType !== 'ALL') list = list.filter(s => s.sourceType === filter.sourceType)
    if (filter.pulpBatch) list = list.filter(s => s.pulpBatch.toLowerCase().includes(filter.pulpBatch.toLowerCase()))
    if (filter.hasIssues !== 'ALL') {
      const has = (s: FiberSample) => s.missingFields.length > 0 || !!s.isDuplicate || !!s.conflictWithSampleId
      list = filter.hasIssues === 'YES' ? list.filter(has) : list.filter(s => !has(s))
    }
    if (filter.judgeConclusion !== 'ALL') list = list.filter(s => s.judgeConclusion === filter.judgeConclusion)
    const total = list.length
    const page = Math.max(1, filter.page)
    const size = Math.max(1, filter.pageSize)
    const start = (page - 1) * size
    return { items: list.slice(start, start + size), total }
  }, [samples, filter])

  const doPrecheck = useCallback(async () => {
    try {
      const res = await api.precheck(pasteText)
      setPendingRows(res.rows)
      setPrecheckResult(res.data)
      setImportMode('REVIEW')
      showToast(`预检完成：${res.rows.length} 条，通过 ${res.data.passRows}，问题 ${res.data.issues.length}`)
    } catch (e: any) {
      showToast(`预检失败：${e.message}`)
    }
  }, [pasteText, showToast])

  const commitImport = useCallback(async () => {
    if (!precheckResult || pendingRows.length === 0) return { added: 0 }
    try {
      const res = await api.doImport(pasteText)
      await refreshSamples()
      showToast(`已导入 ${res.added} 条样本`)
      setPendingRows([])
      setPrecheckResult(null)
      setPasteText('')
      setImportMode('NONE')
      return { added: res.added }
    } catch (e: any) {
      showToast(`导入失败：${e.message}`)
      return { added: 0 }
    }
  }, [pendingRows, precheckResult, pasteText, refreshSamples, showToast])

  const discardPending = useCallback(() => {
    setPendingRows([])
    setPrecheckResult(null)
    setPasteText('')
    setImportMode('NONE')
  }, [])

  const changeStatus = useCallback(async (id: string, next: FiberStatus, note: string) => {
    try {
      const res = await api.changeStatus(id, next, note)
      setSamples(cur => cur.map(s => s.id === id ? res.sample : s))
      showToast(`状态已更新 → ${next}`)
    } catch (e: any) {
      showToast(`状态更新失败：${e.message}`)
    }
  }, [showToast])

  const judge = useCallback(async (id: string, c: 'PASS' | 'FAIL' | 'CONFLICT', remark: string) => {
    try {
      const res = await api.judge(id, c, remark)
      setSamples(cur => cur.map(s => s.id === id ? res.sample : s))
      showToast(`判读完成：${c}`)
    } catch (e: any) {
      showToast(`判读失败：${e.message}`)
    }
  }, [showToast])

  const addDrying = useCallback(async (id: string, r: Omit<DryingRecord, 'id' | 'moistureContent' | 'recordedAt'>) => {
    try {
      const res = await api.addDrying(id, r)
      setSamples(cur => cur.map(s => s.id === id ? res.sample : s))
      showToast('烘干称重记录已保存')
    } catch (e: any) {
      showToast(`保存失败：${e.message}`)
    }
  }, [showToast])

  const addPhoto = useCallback(async (id: string, p: Omit<MicroPhoto, 'id' | 'capturedAt'>) => {
    try {
      const res = await api.addPhoto(id, p)
      setSamples(cur => cur.map(s => s.id === id ? res.sample : s))
      showToast('显微照片已保存')
    } catch (e: any) {
      showToast(`保存失败：${e.message}`)
    }
  }, [showToast])

  const updateSample = useCallback((id: string, patch: Partial<FiberSample>) => {
    setSamples(cur => cur.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])

  const getConflictGroup = useCallback((s: FiberSample) => {
    const group = [s]
    if (s.conflictWithSampleId) {
      const other = samples.find(x => x.id === s.conflictWithSampleId)
      if (other) group.push(other)
    }
    samples.forEach(x => {
      if (x.id !== s.id && x.pulpBatch === s.pulpBatch && !group.find(g => g.id === x.id)) group.push(x)
    })
    return group
  }, [samples])

  const exportRows = useMemo(() => {
    return samples.map(s => ({
      样本编号: s.sampleCode, 纸浆批号: s.pulpBatch,
      短纤维_: s.fiberLength.short, 中纤维_: s.fiberLength.medium, 长纤维_: s.fiberLength.long,
      加权平均_mm: s.fiberLength.weightedAverage ?? '',
      白度_: s.whiteness ?? '', 含水率_: s.moistureContent ?? '',
      来源: ({ PURCHASE: '采购', PRODUCTION: '生产', RETURNED: '退货' } as any)[s.sourceType],
      来源详情: s.sourceInfo, 录入人: s.operatorName, 责任人: s.responsiblePersonName,
      登记时间: s.registeredAt, 状态: s.status, 判读结论: s.judgeConclusion ?? '',
      判读人: s.judgeBy ?? '', 判读时间: s.judgeAt ?? '',
      烘干记录数: s.dryingRecords.length, 显微照片数: s.microPhotos.length,
      缺测字段: s.missingFields.join(','), 重复样本: s.isDuplicate ? '是' : '否',
      冲突关联: s.conflictWithSampleId ? samples.find(x => x.id === s.conflictWithSampleId)?.sampleCode ?? s.conflictWithSampleId : '',
    }))
  }, [samples])

  const insertSamples = useCallback((newOnes: FiberSample[]) => {
    setSamples(cur => [...newOnes, ...cur])
    showToast(`新增 ${newOnes.length} 条`)
  }, [showToast])

  const removeSamples = useCallback((ids: string[]) => {
    setSamples(cur => cur.filter(s => !ids.includes(s.id)))
    showToast(`删除 ${ids.length} 条`)
    ids.forEach(id => { if (activeDetailId === id) setActiveDetailIdState(null) })
  }, [activeDetailId, showToast])

  const resetAll = useCallback(async () => {
    try {
      const res = await api.reset()
      setSamples(res.samples)
      const fRes = await api.getFilter()
      setFilterState(fRes.filter)
      setActiveDetailIdState(null)
      showToast('已重置到种子数据')
    } catch (e: any) {
      showToast(`重置失败：${e.message}`)
    }
  }, [showToast])

  const value: Ctx = {
    samples, filter, setFilter,
    activeDetailId, setActiveDetailId,
    pagedItems, totalItems,
    pagedTotal: Math.ceil(totalItems / Math.max(1, filter.pageSize)),
    loading,

    precheckResult, pendingRows, importMode, setImportMode,
    pasteText, setPasteText,

    doPrecheck, commitImport, discardPending,

    changeStatus, judge, addDrying, addPhoto, updateSample,

    getConflictGroup, exportRows, insertSamples, removeSamples,
    resetAll, toast, showToast,

    refreshSamples,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useStore(): Ctx {
  const c = useContext(AppContext)
  if (!c) throw new Error('useStore must be used inside AppProvider')
  return c
}

export { DRYING_CONDITIONS, OPERATORS }
