import React, { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { Icon } from './Icon'
import { FiberStatus, STATUS_META, SOURCE_META } from '../types'
import { StatusBadge, SourceBadge, SampleIssueChips, formatDate, valPct, fiberBar, valueOr } from './CommonBadges'
import { ExportPreview } from './ExportPreview'

export function SampleList() {
  const s = useStore()
  const [showExport, setShowExport] = useState(false)

  return (
    <div className="card">
      <FilterBar />

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-paper-100 text-slate-600 text-xs">
            <tr>
              <th className="table-cell text-left w-48">样本编号 / 批号</th>
              <th className="table-cell text-left w-[260px]">纤维长度分布</th>
              <th className="table-cell text-left w-24">白度</th>
              <th className="table-cell text-left w-24">含水率</th>
              <th className="table-cell text-left w-28">来源</th>
              <th className="table-cell text-left w-32">责任人</th>
              <th className="table-cell text-left w-36">登记时间</th>
              <th className="table-cell text-left w-28">状态</th>
              <th className="table-cell text-left w-44">标识</th>
              <th className="table-cell text-right w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {s.pagedItems.length === 0 && (
              <tr><td colSpan={10} className="py-20 text-center text-slate-400">
                <Icon.Search className="w-8 h-8 mx-auto mb-2 opacity-50" /> 暂无匹配的样本
              </td></tr>
            )}
            {s.pagedItems.map(sa => (
              <tr key={sa.id}
                onClick={() => s.setActiveDetailId(sa.id)}
                className={`border-t border-paper-100 hover:bg-brand-50/40 cursor-pointer transition-colors ${s.activeDetailId === sa.id ? 'bg-brand-50' : ''}`}>
                <td className="table-cell">
                  <div className="font-mono text-xs font-semibold text-slate-800">{sa.sampleCode}</div>
                  <div className="font-mono text-[11px] text-slate-500 mt-0.5">#{sa.pulpBatch}</div>
                </td>
                <td className="table-cell">{fiberBar(sa)}</td>
                <td className="table-cell font-mono">
                  {sa.whiteness == null
                    ? <span className="text-rose-600 text-xs">缺测</span>
                    : <span className={sa.whiteness < 80 ? 'text-rose-600' : 'text-slate-700'}>{sa.whiteness.toFixed(1)}</span>}
                </td>
                <td className="table-cell font-mono">{valPct(sa.moistureContent, 2)}</td>
                <td className="table-cell"><SourceBadge t={sa.sourceType} /><div className="text-[11px] text-slate-500 mt-1 max-w-[200px] truncate">{valueOr(sa.sourceInfo)}</div></td>
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-semibold">
                      {sa.responsiblePersonName.slice(0, 1)}
                    </span>
                    <span>{sa.responsiblePersonName}</span>
                  </div>
                </td>
                <td className="table-cell text-xs text-slate-500">{formatDate(sa.registeredAt)}</td>
                <td className="table-cell"><StatusBadge status={sa.status} /></td>
                <td className="table-cell"><SampleIssueChips s={sa} /></td>
                <td className="table-cell text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); s.setActiveDetailId(sa.id) }}
                    className="btn-outline !py-1 !px-2 text-xs"
                  >
                    <Icon.Eye className="w-3.5 h-3.5" /> 详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination />

      {showExport && <ExportPreview onClose={() => setShowExport(false)} />}
    </div>
  )
}

function FilterBar() {
  const s = useStore()
  const f = s.filter
  const set = (k: keyof typeof f, v: any) => s.setFilter({ [k]: v } as any)
  const issueCounts = useMemo(() => {
    return {
      total: s.samples.length,
      missing: s.samples.filter(x => x.missingFields.length > 0).length,
      duplicate: s.samples.filter(x => x.isDuplicate).length,
      conflict: s.samples.filter(x => x.conflictWithSampleId).length,
      locked: s.samples.filter(x => x.status === 'LOCKED').length,
      recheck: s.samples.filter(x => x.status === 'RETURNED_FOR_REVIEW').length,
    }
  }, [s.samples])

  return (
    <div className="p-4 border-b border-paper-200 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[320px]">
          <div className="relative flex-1 max-w-md">
            <Icon.Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="搜索样本编号 / 批号 / 来源 / 责任人"
              value={f.keyword}
              onChange={e => set('keyword', e.target.value)}
            />
          </div>
          <select className="input !w-36" value={f.status} onChange={e => set('status', e.target.value)}>
            <option value="ALL">全部状态</option>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select className="input !w-32" value={f.sourceType} onChange={e => set('sourceType', e.target.value)}>
            <option value="ALL">全部来源</option>
            {Object.entries(SOURCE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select className="input !w-36" value={f.hasIssues} onChange={e => set('hasIssues', e.target.value)}>
            <option value="ALL">全部质量</option>
            <option value="YES">仅问题样本</option>
            <option value="NO">仅正常样本</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={s.resetAll} title="重置到种子数据">
            <Icon.Refresh className="w-4 h-4" /> 重置数据
          </button>
          <ExportButton />
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          <CountPill label="总样本" n={issueCounts.total} color="slate" active={f.hasIssues === 'ALL' && f.status === 'ALL'} onClick={() => s.setFilter({ hasIssues: 'ALL', status: 'ALL' })} />
          <CountPill label="缺测" n={issueCounts.missing} color="rose" active={f.hasIssues === 'YES'} onClick={() => s.setFilter({ hasIssues: 'YES' })} icon={<Icon.Alert className="w-3 h-3" />} />
          <CountPill label="重复" n={issueCounts.duplicate} color="amber" onClick={() => s.setFilter({ status: 'ALL' })} icon={<Icon.Repeat className="w-3 h-3" />} />
          <CountPill label="冲突" n={issueCounts.conflict} color="orange" icon={<Icon.Split className="w-3 h-3" />} />
          <CountPill label="锁定" n={issueCounts.locked} color="slate" onClick={() => s.setFilter({ status: 'LOCKED' as FiberStatus })} icon={<Icon.Lock className="w-3 h-3" />} />
          <CountPill label="待复判" n={issueCounts.recheck} color="violet" onClick={() => s.setFilter({ status: 'RETURNED_FOR_REVIEW' as FiberStatus })} icon={<Icon.ArrowLeftRight className="w-3 h-3" />} />
        </div>
        <div className="flex items-center gap-2">
          <input
            className="input !w-48"
            placeholder="按批号筛选"
            value={f.pulpBatch}
            onChange={e => set('pulpBatch', e.target.value)}
          />
          <select className="input !w-32" value={f.judgeConclusion} onChange={e => set('judgeConclusion', e.target.value)}>
            <option value="ALL">全部判读</option>
            <option value="PASS">合格</option>
            <option value="FAIL">不合格</option>
            <option value="CONFLICT">判读冲突</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function CountPill({ label, n, color, icon, active, onClick }: { label: string; n: number; color: string; icon?: React.ReactNode; active?: boolean; onClick?: () => void }) {
  const map: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 hover:border-rose-400',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400',
    orange: 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400',
    violet: 'bg-violet-50 text-violet-700 border-violet-200 hover:border-violet-400',
  }
  return (
    <button onClick={onClick} className={`chip ${map[color]} ${active ? 'ring-2 ring-offset-1 ring-brand-400' : ''} transition-all`}>
      {icon}
      <span>{label}</span>
      <b className="mx-0.5">{n}</b>
    </button>
  )
}

function ExportButton() {
  const s = useStore()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Icon.Download className="w-4 h-4" /> 导出预览
      </button>
      {open && <ExportPreview onClose={() => setOpen(false)} />}
    </>
  )
}

function Pagination() {
  const s = useStore()
  const { page, pageSize } = s.filter
  const total = s.totalItems
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const jump = (p: number) => s.setFilter({ page: Math.min(pages, Math.max(1, p)) })

  const items = [] as (number | '...')[]
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i)
    else if (items[items.length - 1] !== '...') items.push('...')
  }

  return (
    <div className="p-4 border-t border-paper-200 flex items-center justify-between flex-wrap gap-3">
      <div className="text-xs text-slate-500">
        共 <b className="text-slate-700">{total}</b> 条，
        当前第 <b className="text-brand-600">{page}</b> / {pages} 页
      </div>
      <div className="flex items-center gap-2">
        <select className="input !w-28 !py-1.5" value={pageSize} onChange={e => s.setFilter({ pageSize: Number(e.target.value), page: 1 })}>
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} 条/页</option>)}
        </select>
        <button className="btn-ghost !py-1.5 !px-2" disabled={page === 1} onClick={() => jump(page - 1)}>
          <Icon.ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex gap-1">
          {items.map((it, i) => it === '...'
            ? <span key={i} className="px-2 text-slate-400 text-sm">…</span>
            : <button key={i} onClick={() => jump(it)} className={`btn !py-1.5 !px-3 text-xs ${page === it ? 'bg-brand-600 text-white' : 'hover:bg-paper-100 text-slate-600'}`}>
              {it}
            </button>)}
        </div>
        <button className="btn-ghost !py-1.5 !px-2" disabled={page === pages} onClick={() => jump(page + 1)}>
          <Icon.ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
