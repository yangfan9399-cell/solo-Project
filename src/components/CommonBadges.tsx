import type { FiberStatus, FiberSample } from '../types'
import { STATUS_META, SOURCE_META, JUDGE_META } from '../types'

export function StatusBadge({ status }: { status: FiberStatus }) {
  const m = STATUS_META[status]
  return (
    <span className={`badge ${m.bg} ${m.color} ${m.border} border`}>{m.label}</span>
  )
}

export function SourceBadge({ t }: { t: FiberSample['sourceType'] }) {
  const m = SOURCE_META[t]
  return <span className={`badge ${m.bg} ${m.color} ${m.border} border`}>{m.label}</span>
}

export function JudgeBadge({ c }: { c: 'PASS' | 'FAIL' | 'CONFLICT' | null | undefined }) {
  if (!c) return null
  const m = JUDGE_META[c]
  return <span className={`badge ${m.bg} ${m.color}`}>{m.label}</span>
}

export function IssueTag({ kind }: { kind: 'missing' | 'duplicate' | 'conflict' | 'locked' | 'recheck' | string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    missing: { label: '缺测', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
    duplicate: { label: '重复', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    conflict: { label: '判读冲突', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
    locked: { label: '锁定', cls: 'bg-slate-100 text-slate-700 border border-slate-300' },
    recheck: { label: '退回复判', cls: 'bg-violet-50 text-violet-700 border border-violet-200' },
  }
  const c = cfg[kind] || { label: kind, cls: 'bg-slate-50 text-slate-600 border' }
  return <span className={`chip ${c.cls}`}>{c.label}</span>
}

export function SampleIssueChips({ s }: { s: FiberSample }) {
  const chips: string[] = []
  if (s.missingFields.length) chips.push('missing')
  if (s.isDuplicate) chips.push('duplicate')
  if (s.conflictWithSampleId) chips.push('conflict')
  if (s.status === 'LOCKED') chips.push('locked')
  if (s.status === 'RETURNED_FOR_REVIEW') chips.push('recheck')
  if (!chips.length) return null
  return <div className="flex flex-wrap gap-1">{chips.map(c => <IssueTag key={c} kind={c} />)}</div>
}

export function formatDate(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function relTime(iso: string): string {
  const d = new Date(iso).getTime()
  const now = Date.now()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)} 天前`
  return formatDate(iso)
}

export function valueOr(v: any, def = '—', suffix = ''): string {
  if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return def
  return `${v}${suffix}`
}

export function valPct(v: number | undefined | null, digits = 1): string {
  if (v === null || v === undefined || isNaN(v)) return '—'
  return `${v.toFixed(digits)}%`
}

export function fiberBar(s: FiberSample): React.ReactNode {
  const arr = [s.fiberLength.short, s.fiberLength.medium, s.fiberLength.long]
  if (!arr.every(n => Number.isFinite(n))) return <span className="text-rose-600 text-xs">缺测</span>
  return (
    <div className="flex items-center gap-2 w-[220px]">
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-paper-100 flex">
        {arr.map((v, i) => (
          <div
            key={i}
            style={{ width: `${v}%`, background: ['#f59e0b', '#10b981', '#3b82f6'][i] }}
            title={`${['短', '中', '长'][i]}纤维: ${v.toFixed(1)}%`}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 font-mono">
        {s.fiberLength.weightedAverage ? `${s.fiberLength.weightedAverage.toFixed(2)}mm` : '—'}
      </span>
    </div>
  )
}
