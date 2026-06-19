import React, { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { Icon } from './Icon'
import { STATUS_META, FiberStatus, FiberSample, JUDGE_META } from '../types'
import { StatusBadge, SourceBadge, JudgeBadge, SampleIssueChips, formatDate, relTime, valPct, fiberBar, valueOr } from './CommonBadges'
import { Modal } from './Modal'
import { DRYING_CONDITIONS, OPERATORS } from '../data/seed'
import type { DryingRecord } from '../types'

export function DetailPanel() {
  const s = useStore()
  const sample = useMemo(() => s.samples.find(x => x.id === s.activeDetailId) || null, [s.samples, s.activeDetailId])

  if (!sample) {
    return (
      <div className="card h-full flex flex-col items-center justify-center text-center p-10 text-slate-400">
        <Icon.Eye className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">从左侧列表选择一条样本查看详情</p>
        <p className="text-xs mt-1">显微照片 · 烘干称重 · 状态流转 · 审计时间线</p>
      </div>
    )
  }

  return (
    <div className="card flex flex-col h-full overflow-hidden">
      <DetailHeader sample={sample} />

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-5">
        <section>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">纤维核心指标</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Metric label="白度 (ISO)" val={sample.whiteness} unit="" ok={sample.whiteness != null && sample.whiteness >= 80} hint="≥80 合格" />
            <Metric label="含水率" val={sample.moistureContent} unit="%" ok={sample.moistureContent != null && sample.moistureContent <= 7} hint="≤7% 合格" />
            <Metric label="加权平均纤维长" val={sample.fiberLength.weightedAverage} unit="mm" />
            <Metric label="烘干记录" val={sample.dryingRecords.length} unit="组" hint="不同烘干条件" />
          </div>
          <div className="mt-3 rounded-xl bg-paper-50 p-4">
            <div className="text-xs font-semibold text-slate-600 mb-2">纤维长度分布</div>
            <div className="flex items-center gap-4 mb-3">{fiberBar(sample)}</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[['短纤维', sample.fiberLength.short, 'bg-amber-400'], ['中纤维', sample.fiberLength.medium, 'bg-emerald-400'], ['长纤维', sample.fiberLength.long, 'bg-brand-400']].map(([n, v, c]) => (
                <div key={n as string} className="rounded-lg bg-white border border-paper-200 p-2">
                  <div className="text-slate-500">{n as string}</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${c}`}></span>
                    <span className="text-base font-semibold font-mono text-slate-800">
                      {Number.isFinite(v as number) ? (v as number).toFixed(1) : '—'}
                    </span>
                    <span className="text-slate-400 text-[11px]">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MicroPhotoSection sample={sample} />
        <DryingRecordsSection sample={sample} />
        <SourceSection sample={sample} />
        <JudgeSection sample={sample} />
        <ConflictCompareSection sample={sample} />
        <StatusFlowSection sample={sample} />
        <AuditTimeline sample={sample} />
      </div>
    </div>
  )
}

function DetailHeader({ sample }: { sample: FiberSample }) {
  const s = useStore()
  const locked = sample.status === 'LOCKED'
  return (
    <div className="border-b border-paper-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-mono text-lg font-bold text-slate-800 truncate">{sample.sampleCode}</h3>
            <StatusBadge status={sample.status} />
            <JudgeBadge c={sample.judgeConclusion} />
            {locked && <span className="badge bg-slate-800 text-white flex items-center gap-1"><Icon.Lock className="w-3 h-3" /> 锁定保护</span>}
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="font-mono">#{sample.pulpBatch}</span>
            <span>·</span>
            <SourceBadge t={sample.sourceType} />
            <span>·</span>
            <span>{relTime(sample.registeredAt)} 由 {sample.operatorName} 登记</span>
          </div>
          <div className="mt-2"><SampleIssueChips s={sample} /></div>
        </div>
        <button className="btn-ghost !p-2" title="关闭详情" onClick={() => s.setActiveDetailId(null)}>
          <Icon.X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function Metric({ label, val, unit, ok, hint }: { label: string; val: number | null | undefined; unit?: string; ok?: boolean; hint?: string }) {
  const has = val !== null && val !== undefined && Number.isFinite(val)
  return (
    <div className={`rounded-xl p-3 border ${has === false ? 'border-rose-200 bg-rose-50/50' : ok === false ? 'border-amber-200 bg-amber-50/50' : 'border-paper-200 bg-white'}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-xl font-bold font-mono ${has === false ? 'text-rose-500' : ok === false ? 'text-amber-600' : 'text-slate-800'}`}>
          {has ? (typeof val === 'number' ? val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2) : String(val)) : '缺测'}
        </span>
        {has && unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  )
}

function MicroPhotoSection({ sample }: { sample: FiberSample }) {
  const s = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const locked = sample.status === 'LOCKED'
  const [viewUrl, setViewUrl] = useState<string | null>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Icon.MicrScope className="w-4 h-4" /> 显微照片 ({sample.microPhotos.length})
        </h4>
        <button className="btn-outline !py-1.5 text-xs" disabled={locked} onClick={() => setShowAdd(true)}>
          <Icon.Camera className="w-3.5 h-3.5" /> 上传照片
        </button>
      </div>
      {sample.microPhotos.length === 0
        ? <EmptyHint icon={<Icon.Camera className="w-8 h-8" />} text="暂无显微照片，建议采集×400 光学 / ×800 SEM / 荧光图像" />
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sample.microPhotos.map(p => (
            <div key={p.id} className="group rounded-xl overflow-hidden border border-paper-200 bg-paper-50">
              <div className="aspect-[4/3] overflow-hidden cursor-zoom-in" onClick={() => setViewUrl(p.url)}>
                <img src={p.url} alt={p.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3 bg-white">
                <div className="font-medium text-sm text-slate-800">{p.caption}</div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 flex-wrap">
                  <span className="badge bg-paper-100 text-slate-600">{p.magnification}</span>
                  <span>{formatDate(p.capturedAt)}</span>
                  <span>拍摄：{p.capturedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>}

      {viewUrl && <Modal onClose={() => setViewUrl(null)} title="显微照片查看" width="max-w-4xl">
        <img src={viewUrl} className="w-full rounded-lg" />
      </Modal>}

      {showAdd && <AddPhotoModal sampleId={sample.id} onClose={() => setShowAdd(false)} />}
    </section>
  )
}

function AddPhotoModal({ sampleId, onClose }: { sampleId: string; onClose: () => void }) {
  const s = useStore()
  const [f, setF] = useState({
    caption: '纤维形态观测',
    magnification: '×400 光学显微镜',
    capturedBy: OPERATORS[2].name,
  })
  const submit = () => {
    // 生成一张 SVG 占位显微照片
    const hues = [30, 180, 210, 270, 330]
    const h = hues[Math.floor(Math.random() * hues.length)]
    const n = Date.now() % 100
    const svg = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'>
        <defs><radialGradient id='g' cx='50%' cy='50%'><stop offset='0%' stop-color='hsl(${h},35%,85%)'/><stop offset='100%' stop-color='hsl(${h},40%,55%)'/></radialGradient></defs>
        <rect width='400' height='300' fill='url(#g)'/>
        ${Array.from({ length: 40 + n % 15 }).map((_, i) => {
          const x = (i * 41 + 13) % 380 + 10
          const y = (i * 73 + 27) % 280 + 10
          const len = 25 + (i % 7) * 25
          const rot = (i * 37) % 180 - 90
          return `<rect x='${x}' y='${y}' width='${len}' height='${2 + (i % 3)}' fill='hsla(${h},60%,${25 + i % 20}%,0.8)' transform='rotate(${rot} ${x} ${y})'/>`
        }).join('')}
        <text x='20' y='25' font-family='monospace' font-size='12' fill='white' opacity='0.9'>${f.caption}</text>
      </svg>`
    )}`
    s.addPhoto(sampleId, { url: svg, caption: f.caption, magnification: f.magnification, capturedBy: f.capturedBy })
    onClose()
  }
  return (
    <Modal onClose={onClose} title={<>
      <Icon.Camera className="w-5 h-5 text-brand-600" /> 新增显微照片记录
    </>} footer={<>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>取消</button>
        <button className="btn-primary" onClick={submit}><Icon.Check className="w-4 h-4" /> 保存</button>
      </div>
    </>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">照片说明</label>
          <input className="input" value={f.caption} onChange={e => setF(p => ({ ...p, caption: e.target.value }))} />
        </div>
        <div><label className="label">放大倍数 / 设备</label>
          <select className="input" value={f.magnification} onChange={e => setF(p => ({ ...p, magnification: e.target.value }))}>
            {['×100 光学显微镜', '×400 光学显微镜', '×600 荧光显微镜', '×800 SEM', '×1200 TEM'].map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div><label className="label">拍摄人</label>
          <select className="input" value={f.capturedBy} onChange={e => setF(p => ({ ...p, capturedBy: e.target.value }))}>
            {OPERATORS.map(o => <option key={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 text-xs text-slate-500 bg-paper-50 rounded-lg p-3 border border-paper-200">
          💡 照片将使用算法生成占位显微图像，真实系统可在此处接入文件上传。
        </div>
      </div>
    </Modal>
  )
}

function DryingRecordsSection({ sample }: { sample: FiberSample }) {
  const s = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const locked = sample.status === 'LOCKED'

  const span = sample.dryingRecords.length >= 2
    ? (Math.max(...sample.dryingRecords.map(r => r.moistureContent)) - Math.min(...sample.dryingRecords.map(r => r.moistureContent))).toFixed(2)
    : null

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Icon.Scale className="w-4 h-4" /> 烘干称重记录 ({sample.dryingRecords.length})
          {span && Number(span) >= 1.5 && (
            <span className="badge bg-orange-50 text-orange-700 border border-orange-200 ml-2">
              跨度 {span}pp · 判读差异警告
            </span>
          )}
        </h4>
        <button className="btn-outline !py-1.5 text-xs" disabled={locked} onClick={() => setShowAdd(true)}>
          <Icon.Plus className="w-3.5 h-3.5" /> 新增烘干记录
        </button>
      </div>
      {sample.dryingRecords.length === 0
        ? <EmptyHint icon={<Icon.Scale className="w-8 h-8" />} text="暂无烘干称重记录，建议进行标准条件 105℃×2h 测试" />
        : <div className="overflow-hidden rounded-xl border border-paper-200">
          <table className="w-full text-xs">
            <thead className="bg-paper-100 text-slate-600">
              <tr>
                <th className="text-left px-3 py-2">烘干条件</th>
                <th className="text-left px-3 py-2">温度</th>
                <th className="text-left px-3 py-2">时长</th>
                <th className="text-left px-3 py-2">湿重(g)</th>
                <th className="text-left px-3 py-2">干重(g)</th>
                <th className="text-left px-3 py-2">含水率</th>
                <th className="text-left px-3 py-2">操作员</th>
                <th className="text-left px-3 py-2">时间</th>
                <th className="text-left px-3 py-2">备注</th>
              </tr>
            </thead>
            <tbody>
              {sample.dryingRecords.map((r, i) => {
                const isSpan = span && i > 0 && Math.abs(r.moistureContent - sample.dryingRecords[0].moistureContent) >= 1.5
                return (
                  <tr key={r.id} className={`border-t border-paper-100 ${isSpan ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-3 py-2 font-medium text-slate-700">{r.conditionName}</td>
                    <td className="px-3 py-2 font-mono">{r.temperatureC}℃</td>
                    <td className="px-3 py-2 font-mono">{r.durationMin}min</td>
                    <td className="px-3 py-2 font-mono">{r.wetWeightG.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono">{r.dryWeightG.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono">
                      <span className={`${r.moistureContent > 7 ? 'text-rose-600 font-semibold' : 'text-emerald-700'}`}>
                        {r.moistureContent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-3 py-2">{r.operatorName}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(r.recordedAt)}</td>
                    <td className="px-3 py-2 text-slate-500 max-w-[220px]">{r.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>}

      {showAdd && <AddDryingModal sampleId={sample.id} onClose={() => setShowAdd(false)} />}
    </section>
  )
}

function AddDryingModal({ sampleId, onClose }: { sampleId: string; onClose: () => void }) {
  const s = useStore()
  const [condId, setCondId] = useState(DRYING_CONDITIONS[0].id)
  const cond = DRYING_CONDITIONS.find(c => c.id === condId)!
  const [f, setF] = useState({
    wetWeightG: '10.000',
    dryWeightG: '9.400',
    operatorName: OPERATORS[2].name,
    notes: '',
  })
  const op = OPERATORS.find(o => o.name === f.operatorName) || OPERATORS[2]
  const wet = Number(f.wetWeightG), dry = Number(f.dryWeightG)
  const mc = wet > dry ? (((wet - dry) / wet) * 100) : NaN

  const submit = () => {
    s.addDrying(sampleId, {
      conditionId: cond.id, conditionName: cond.name,
      temperatureC: cond.temperatureC, durationMin: cond.durationMin,
      wetWeightG: wet, dryWeightG: dry,
      operatorId: op.id, operatorName: op.name, notes: f.notes,
    })
    onClose()
  }
  return (
    <Modal onClose={onClose} title={<>
      <Icon.Scale className="w-5 h-5 text-brand-600" /> 新增烘干称重记录
    </>} footer={<>
      <div className="flex justify-end gap-2">
        <button className="btn-ghost" onClick={onClose}>取消</button>
        <button className="btn-primary" onClick={submit} disabled={!Number.isFinite(mc)}>
          <Icon.Check className="w-4 h-4" /> 保存记录
        </button>
      </div>
    </>}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">烘干条件</label>
          <div className="grid grid-cols-3 gap-2">
            {DRYING_CONDITIONS.map(c => (
              <label key={c.id} className={`border rounded-lg px-3 py-2 cursor-pointer text-xs ${condId === c.id ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-paper-300 hover:border-brand-300'}`}>
                <input type="radio" className="hidden" checked={condId === c.id} onChange={() => setCondId(c.id)} />
                <div className="font-medium">{c.name}</div>
                <div className="text-[11px] opacity-70">{c.temperatureC}℃ × {c.durationMin}min</div>
              </label>
            ))}
          </div>
        </div>
        <div><label className="label">湿样重量 (g)</label><input className="input font-mono" value={f.wetWeightG} onChange={e => setF(p => ({ ...p, wetWeightG: e.target.value }))} /></div>
        <div><label className="label">干样重量 (g)</label><input className="input font-mono" value={f.dryWeightG} onChange={e => setF(p => ({ ...p, dryWeightG: e.target.value }))} /></div>
        <div><label className="label">操作员</label>
          <select className="input" value={f.operatorName} onChange={e => setF(p => ({ ...p, operatorName: e.target.value }))}>
            {OPERATORS.map(o => <option key={o.id}>{o.name} · {o.role}</option>)}
          </select>
        </div>
        <div><label className="label">计算含水率</label>
          <div className={`input font-mono font-semibold ${Number.isFinite(mc) ? (mc > 7 ? 'text-rose-600' : 'text-emerald-700') : 'text-slate-400'}`}>
            {Number.isFinite(mc) ? `${mc.toFixed(2)}%` : '湿重需大于干重'}
          </div>
        </div>
        <div className="col-span-2"><label className="label">备注</label><input className="input" value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="如：平行样 / 高温测试 / 与标准样对比" /></div>
      </div>
    </Modal>
  )
}

function SourceSection({ sample }: { sample: FiberSample }) {
  return (
    <section>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon.Layers className="w-4 h-4" /> 来源 / 责任人
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-paper-200 p-4 bg-gradient-to-br from-white to-paper-50">
          <div className="text-[11px] uppercase text-slate-400 tracking-wide mb-1">来源信息</div>
          <div className="mb-2"><SourceBadge t={sample.sourceType} /></div>
          <div className="text-sm text-slate-700 leading-relaxed">{sample.sourceInfo}</div>
          <div className="mt-3 pt-3 border-t border-paper-100 text-[11px] text-slate-500">
            <div>打浆批号：<span className="font-mono text-slate-700">{sample.pulpBatch}</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-paper-200 p-4 bg-gradient-to-br from-white to-brand-50/30 space-y-3">
          <div>
            <div className="text-[11px] uppercase text-slate-400 tracking-wide mb-1">登记人</div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">{sample.operatorName.slice(0, 1)}</span>
              <div>
                <div className="font-medium text-slate-800">{sample.operatorName}</div>
                <div className="text-[11px] text-slate-500">{formatDate(sample.registeredAt)}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase text-slate-400 tracking-wide mb-1">责任人</div>
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-semibold">{sample.responsiblePersonName.slice(0, 1)}</span>
              <div>
                <div className="font-medium text-slate-800">{sample.responsiblePersonName}</div>
                <div className="text-[11px] text-slate-500">ID: {sample.responsiblePersonId}</div>
              </div>
            </div>
          </div>
          {sample.tags.length > 0 && (
            <div>
              <div className="text-[11px] uppercase text-slate-400 tracking-wide mb-1">标签</div>
              <div className="flex flex-wrap gap-1">{sample.tags.map(t => <span key={t} className="chip bg-white text-slate-600 border-paper-300">#{t}</span>)}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function JudgeSection({ sample }: { sample: FiberSample }) {
  const s = useStore()
  const [showJudge, setShowJudge] = useState(false)
  const locked = sample.status === 'LOCKED'
  const canJudge = !locked && (sample.status === 'PENDING_JUDGE' || sample.status === 'RETURNED_FOR_REVIEW' || sample.status === 'JUDGED_FAIL' || sample.status === 'JUDGED_PASS')

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Icon.Gauge className="w-4 h-4" /> 判读结论
        </h4>
        <button className="btn-outline !py-1.5 text-xs" disabled={!canJudge} onClick={() => setShowJudge(true)}>
          <Icon.Edit3 className="w-3.5 h-3.5" /> {locked ? '已锁定' : sample.judgeConclusion ? '重新判读' : '进行判读'}
        </button>
      </div>

      {!sample.judgeConclusion
        ? <EmptyHint icon={<Icon.Gauge className="w-8 h-8" />} text={sample.status === 'PRECHECK_FAIL' ? '预检未通过，补全缺测字段后才可判读' : '待主管质检员完成判读'} />
        : <div className={`rounded-xl border p-4 ${sample.judgeConclusion === 'PASS' ? 'border-green-200 bg-green-50/50' : sample.judgeConclusion === 'FAIL' ? 'border-rose-200 bg-rose-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <JudgeBadge c={sample.judgeConclusion} />
            <span className="text-xs text-slate-500">由 <b className="text-slate-700">{sample.judgeBy}</b> 于 {formatDate(sample.judgeAt)} 判读</span>
          </div>
          <div className="text-sm text-slate-700 leading-relaxed">{sample.judgeRemark}</div>
        </div>}

      {showJudge && <JudgeModal sample={sample} onClose={() => setShowJudge(false)} />}
    </section>
  )
}

function JudgeModal({ sample, onClose }: { sample: FiberSample; onClose: () => void }) {
  const s = useStore()
  const [c, setC] = useState<'PASS' | 'FAIL' | 'CONFLICT'>(sample.judgeConclusion as any || 'PASS')
  const [remark, setRemark] = useState(sample.judgeRemark || '')
  const submit = () => {
    s.judge(sample.id, c, remark)
    onClose()
  }
  return (
    <Modal onClose={onClose} title={<><Icon.Gauge className="w-5 h-5 text-brand-600" /> 判读结论 · {sample.sampleCode}</>}
      footer={<>
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>取消</button>
          <button className="btn-primary" onClick={submit} disabled={!remark.trim()}>
            <Icon.Check className="w-4 h-4" /> 确认判读
          </button>
        </div>
      </>}>
      <div className="space-y-4">
        <div><label className="label">判读结果</label>
          <div className="grid grid-cols-3 gap-2">
            {(['PASS', 'FAIL', 'CONFLICT'] as const).map(k => {
              const m = JUDGE_META[k]
              return (
                <label key={k} className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${c === k ? `${m.bg} border-current ${m.color} ring-2 ring-offset-1 ring-brand-400/50` : 'border-paper-200 hover:border-brand-300'}`}>
                  <input type="radio" className="hidden" checked={c === k} onChange={() => setC(k)} />
                  <div className="font-semibold text-center">{m.label}</div>
                </label>
              )
            })}
          </div>
        </div>
        <div><label className="label">判读说明（必填）</label>
          <textarea className="input min-h-[120px]" value={remark}
            onChange={e => setRemark(e.target.value)}
            placeholder={`例如：纤维长度分布均衡，白度达标，含水率${valPct(sample.moistureContent, 2)}，准予入库。`} />
        </div>
        {sample.missingFields.length > 0 && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            存在缺测字段：{sample.missingFields.join('、')}，判读将标记为「预检失败」状态。
          </div>
        )}
      </div>
    </Modal>
  )
}

function ConflictCompareSection({ sample }: { sample: FiberSample }) {
  const s = useStore()
  const group = s.getConflictGroup(sample).filter(g => g.id !== sample.id)
  if (group.length === 0 && !sample.conflictWithSampleId) return null

  const all = [sample, ...group]
  const moistures = all.map(a => a.dryingRecords.map(r => r.moistureContent)).flat()
  const span = moistures.length >= 2 ? (Math.max(...moistures) - Math.min(...moistures)).toFixed(2) : null

  return (
    <section className="rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/70 to-amber-50/50 p-4">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-semibold text-orange-800 uppercase tracking-wider flex items-center gap-2">
            <Icon.Split className="w-4 h-4" /> 特殊场景：同批次 · 不同烘干条件判读差异
          </h4>
          <p className="text-xs text-orange-700 mt-1">批次 {sample.pulpBatch} · 关联 <b>{all.length}</b> 条平行样本
            {span && <> · 含水率最大跨度 <b className="text-rose-700">{span}pp</b></>}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {all.map(a => (
            <button key={a.id} onClick={() => s.setActiveDetailId(a.id)}
              className={`chip text-xs ${a.id === sample.id ? 'bg-orange-200 text-orange-900 border-orange-400' : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-100'}`}>
              {a.id === sample.id && '● '}{a.sampleCode.slice(-10)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-orange-200/70 bg-white/80">
        <table className="w-full text-xs">
          <thead className="bg-orange-100/60 text-orange-800">
            <tr>
              <th className="text-left px-3 py-2">样本</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2">判读</th>
              <th className="text-left px-3 py-2">烘干条件</th>
              <th className="text-left px-3 py-2">湿重</th>
              <th className="text-left px-3 py-2">干重</th>
              <th className="text-left px-3 py-2">含水率</th>
              <th className="text-left px-3 py-2">Δ 与最小</th>
              <th className="text-left px-3 py-2">备注</th>
            </tr>
          </thead>
          <tbody>
            {all.flatMap(a => a.dryingRecords.length === 0
              ? [<tr key={a.id} className="border-t border-orange-100">
                <td className="px-3 py-2 font-mono text-orange-900">{a.sampleCode}</td>
                <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                <td className="px-3 py-2"><JudgeBadge c={a.judgeConclusion} /></td>
                <td className="px-3 py-2" colSpan={5}><span className="text-slate-400">无烘干记录</span></td>
              </tr>]
              : a.dryingRecords.map(r => {
                const min = Math.min(...moistures)
                const delta = r.moistureContent - min
                const warn = delta >= 1.5
                return (
                  <tr key={r.id} className={`border-t border-orange-100 ${warn ? 'bg-rose-50/40' : ''}`}>
                    <td className="px-3 py-2 font-mono text-orange-900">
                      {a.id === sample.id ? '▶ ' : ''}{a.sampleCode}
                    </td>
                    <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                    <td className="px-3 py-2"><JudgeBadge c={a.judgeConclusion} /></td>
                    <td className="px-3 py-2">{r.conditionName}</td>
                    <td className="px-3 py-2 font-mono">{r.wetWeightG.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono">{r.dryWeightG.toFixed(3)}</td>
                    <td className="px-3 py-2 font-mono font-semibold">{r.moistureContent.toFixed(2)}%</td>
                    <td className="px-3 py-2 font-mono">
                      {delta === 0 ? <span className="text-slate-400">基准</span> : <span className={warn ? 'text-rose-600' : 'text-slate-600'}>+{delta.toFixed(2)}pp</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[200px]">{r.notes || a.judgeRemark || '—'}</td>
                  </tr>
                )
              }))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function StatusFlowSection({ sample }: { sample: FiberSample }) {
  const s = useStore()
  const locked = sample.status === 'LOCKED'

  const nextOptions: Array<{ next: FiberStatus; label: string; color: string; desc: string }> = []
  switch (sample.status) {
    case 'DRAFT':
    case 'PRECHECK_FAIL':
      nextOptions.push({ next: 'PENDING_JUDGE', label: '提交判读', color: 'brand', desc: '提交给主管进行判读' })
      break
    case 'PRECHECK_PASS':
      nextOptions.push({ next: 'PENDING_JUDGE', label: '提交判读', color: 'brand', desc: '预检通过，提交判读' })
      break
    case 'PENDING_JUDGE':
      nextOptions.push({ next: 'RETURNED_FOR_REVIEW', label: '退回补录', color: 'amber', desc: '退回登记人员补充信息' })
      break
    case 'JUDGED_PASS':
    case 'JUDGED_FAIL':
      nextOptions.push({ next: 'ARCHIVED', label: '归档', color: 'slate', desc: '流程结束归档' })
      nextOptions.push({ next: 'LOCKED', label: '锁定样本', color: 'slate', desc: '审计样本锁定保护' })
      nextOptions.push({ next: 'RETURNED_FOR_REVIEW', label: '启动复判', color: 'amber', desc: '对判读结果有异议，启动复判' })
      break
    case 'RETURNED_FOR_REVIEW':
      nextOptions.push({ next: 'PENDING_JUDGE', label: '重新提交判读', color: 'brand', desc: '补充信息后提交' })
      break
    case 'LOCKED':
      nextOptions.push({ next: 'ARCHIVED', label: '归档', color: 'slate', desc: '审计完成归档' })
      break
    case 'ARCHIVED':
    default:
      break
  }

  const flowSteps: Array<FiberStatus> = ['DRAFT', 'PRECHECK_PASS', 'PENDING_JUDGE', 'JUDGED_PASS']
  const currentIdx = Math.max(0, flowSteps.indexOf(sample.status))

  return (
    <section>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Icon.ArrowLeftRight className="w-4 h-4" /> 状态流转
      </h4>

      <div className="mb-4 overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1 min-w-[640px]">
          {flowSteps.map((st, i) => {
            const m = STATUS_META[st]
            const done = i < currentIdx
            const here = st === sample.status
            return (
              <React.Fragment key={st}>
                <div className={`flex-1 min-w-[140px] rounded-lg p-3 border-2 transition-all ${here ? `${m.bg} ${m.border} border-current shadow-sm` : done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-paper-200 opacity-60'}`}>
                  <div className={`text-[11px] ${done ? 'text-emerald-600' : here ? m.color : 'text-slate-400'} font-medium mb-1 flex items-center gap-1`}>
                    {done && <Icon.Check className="w-3 h-3" />}
                    {here && <Icon.Clock className="w-3 h-3" />}
                    STEP {i + 1}
                  </div>
                  <div className={`text-sm font-semibold ${done ? 'text-emerald-800' : here ? m.color : 'text-slate-500'}`}>{m.label}</div>
                </div>
                {i < flowSteps.length - 1 && (
                  <div className={`px-1 ${i < currentIdx ? 'text-emerald-400' : 'text-paper-300'}`}>
                    <Icon.ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {nextOptions.length > 0 && (
        <div>
          <div className="text-[11px] text-slate-400 uppercase mb-2">可执行操作</div>
          <div className="flex gap-2 flex-wrap">
            {locked && <span className="chip bg-slate-100 text-slate-600 border-slate-300"><Icon.Lock className="w-3 h-3" /> 锁定中，禁止状态流转</span>}
            {!locked && nextOptions.map(op => (
              <button key={op.next}
                onClick={() => {
                  const note = prompt(`状态变更为「${STATUS_META[op.next].label}」，请输入变更说明：`, op.desc)
                  if (note !== null) s.changeStatus(sample.id, op.next, note || op.desc)
                }}
                className={`btn ${op.color === 'brand' ? 'bg-brand-600 text-white hover:bg-brand-700' : op.color === 'amber' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-600 text-white hover:bg-slate-700'} text-xs !py-1.5`}>
                → {op.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function AuditTimeline({ sample }: { sample: FiberSample }) {
  const logs = [...sample.auditLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Icon.Clock className="w-4 h-4" /> 审计时间线 ({logs.length})
        </h4>
        <span className="text-[11px] text-slate-400">最早：{formatDate(logs[0]?.timestamp)} · 最新：{relTime(logs[logs.length - 1]?.timestamp || '')}</span>
      </div>
      <div className="relative pl-6">
        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-paper-200" />
        <div className="space-y-4">
          {logs.map(l => {
            const hasTrans = l.fromStatus && l.toStatus
            return (
              <div key={l.id} className="relative">
                <div className={`absolute -left-[22px] top-1 w-4 h-4 rounded-full border-2 bg-white ${hasTrans ? 'border-brand-500' : 'border-paper-400'} flex items-center justify-center`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${hasTrans ? 'bg-brand-500' : 'bg-paper-400'}`} />
                </div>
                <div className="bg-white rounded-lg border border-paper-200 p-3 hover:border-brand-200 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge bg-brand-50 text-brand-700 border border-brand-200">{l.action}</span>
                      {hasTrans && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <StatusBadge status={l.fromStatus!} />
                          <Icon.ChevronRight className="w-3 h-3" />
                          <StatusBadge status={l.toStatus!} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1"><Icon.User className="w-3 h-3" />{l.operatorName}</span>
                      <span>·</span>
                      <span>{relTime(l.timestamp)}</span>
                    </div>
                  </div>
                  {l.note && <div className="mt-2 text-sm text-slate-600 leading-relaxed">{l.note}</div>}
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">{formatDate(l.timestamp)}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-paper-300 bg-paper-50/70 py-6 px-4 text-center">
      <div className="mx-auto text-paper-400 mb-2 w-fit">{icon}</div>
      <div className="text-sm text-slate-500">{text}</div>
    </div>
  )
}
