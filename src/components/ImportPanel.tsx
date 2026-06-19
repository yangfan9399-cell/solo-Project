import React, { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { Icon } from './Icon'
import { ImportRow } from '../types'
import * as API from '../api/mockApi'
import { OPERATORS } from '../data/seed'

export const SAMPLE_TSV = [
  ['样本编号', '纸浆批号', '短纤维%', '中纤维%', '长纤维%', '白度', '含水率%', '来源', '来源详情', '操作员', '责任人'].join('\t'),
  ['S-PK-20260619-041', 'PK-SW-2026-06-156', '16.8', '60.2', '23.0', '83.9', '5.95', 'PURCHASE', '山东博汇纸业 · 合同 HT-2026-0234', '张伟', '陈建国'].join('\t'),
  ['S-PD-20260619-022', 'PD-HW-2026-06-078', '', '61.5', '25.0', '', '6.12', 'PRODUCTION', '一号蒸煮车间 · 甲班', '张伟', '赵明辉'].join('\t'),
  ['S-PK-20260619-041', 'PK-SW-2026-06-156', '16.8', '60.2', '23.0', '83.9', '8.22', 'PURCHASE', '山东博汇 · 平行样（高温烘干）', '李娜', '陈建国'].join('\t'),
  ['S-RT-20260619-003', 'PD-SW-2026-05-117', '15.1', '59.3', '25.6', '82.1', '6.05', 'RETURNED', '退货 RT-2026-033 · 客户异议', '张伟', '孙丽萍'].join('\t'),
].join('\n')

export function ImportPanel() {
  const s = useStore()
  const [expanded, setExpanded] = useState(true)
  const rows = useMemo(() => s.pasteText.trim() ? API.parsePastedText(s.pasteText) : [], [s.pasteText])
  const validated = useMemo(() => s.pasteText.trim() ? API.validateRows(rows) : [], [rows])

  return (
    <div className="card mb-5">
      <button
        className="w-full flex items-center justify-between p-5 text-left select-none"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Icon.Upload className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">样本录入</h2>
            <p className="text-xs text-slate-500 mt-0.5">支持单条登记 · 批量粘贴导入 · 实时预检</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <button
              className="btn-outline"
              onClick={(e) => { e.stopPropagation(); s.setImportMode(s.importMode === 'SINGLE' ? 'NONE' : 'SINGLE'); setExpanded(true) }}
            >
              <Icon.Plus className="w-4 h-4" /> 单条登记
            </button>
            <button
              className="btn-outline"
              onClick={(e) => { e.stopPropagation(); s.setPasteText(SAMPLE_TSV); s.setImportMode('BATCH'); setExpanded(true) }}
            >
              <Icon.Paste className="w-4 h-4" /> 批量粘贴
            </button>
          </div>
          <Icon.ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5">
          {s.importMode === 'SINGLE' && <SingleForm onClose={() => s.setImportMode('NONE')} />}
          {s.importMode === 'BATCH' && <BatchPaste rows={rows} validated={validated} />}
          {s.importMode === 'REVIEW' && <PrecheckReview />}
          {s.importMode === 'NONE' && <ImportPlaceholder />}
        </div>
      )}
    </div>
  )
}

function ImportPlaceholder() {
  return (
    <div className="rounded-xl border-2 border-dashed border-paper-300 bg-paper-50 py-10 px-8 text-center">
      <Icon.FileText className="w-10 h-10 mx-auto text-paper-400" />
      <p className="mt-3 text-sm text-slate-500">选择「单条登记」填写一条完整样本；或点击「批量粘贴」从 Excel 粘贴 Tab/逗号分隔数据</p>
      <p className="mt-1 text-xs text-slate-400">列顺序：样本编号 · 纸浆批号 · 短纤维% · 中纤维% · 长纤维% · 白度 · 含水率% · 来源 · 来源详情 · 操作员 · 责任人</p>
    </div>
  )
}

function SingleForm({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [f, setF] = useState({
    sampleCode: '', pulpBatch: '',
    fiberShort: '', fiberMedium: '', fiberLong: '',
    whiteness: '', moistureContent: '',
    sourceType: 'PURCHASE' as 'PURCHASE' | 'PRODUCTION' | 'RETURNED',
    sourceInfo: '', operatorName: OPERATORS[0].name, responsiblePersonName: '陈建国',
  })
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }))

  const row: ImportRow = {
    sampleCode: f.sampleCode, pulpBatch: f.pulpBatch,
    fiberShort: f.fiberShort, fiberMedium: f.fiberMedium, fiberLong: f.fiberLong,
    whiteness: f.whiteness, moistureContent: f.moistureContent,
    sourceType: f.sourceType, sourceInfo: f.sourceInfo,
    operatorName: f.operatorName, responsiblePersonName: f.responsiblePersonName,
  }

  const v = useMemo(() => API.validateRows([row])[0], [row])
  const errors = v.errors.filter(e => e.severity === 'ERROR')
  const warnings = v.errors.filter(e => e.severity === 'WARNING')

  const submit = () => {
    const samples = API.convertValidatedToSamples([v], s.samples)
    s.insertSamples(samples)
    onClose()
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="样本编号 *" err={hasField(errors, 'sampleCode')}>
          <input className="input" value={f.sampleCode} onChange={e => set('sampleCode', e.target.value)} placeholder="如 S-PK-20260619-001" />
        </Field>
        <Field label="打浆批号 *" err={hasField(errors, 'pulpBatch')}>
          <input className="input" value={f.pulpBatch} onChange={e => set('pulpBatch', e.target.value)} placeholder="如 PK-SW-2026-06-156" />
        </Field>
        <Field label="来源类型 *">
          <select className="input" value={f.sourceType} onChange={e => set('sourceType', e.target.value as any)}>
            <option value="PURCHASE">采购入库 PURCHASE</option>
            <option value="PRODUCTION">生产批次 PRODUCTION</option>
            <option value="RETURNED">退货复检 RETURNED</option>
          </select>
        </Field>

        <Field label="短纤维 % *" err={hasField(errors, 'fiberLength') || hasField(errors, 'fiberLength.short')}>
          <input className="input" value={f.fiberShort} onChange={e => set('fiberShort', e.target.value)} placeholder="如 16.8" />
        </Field>
        <Field label="中纤维 % *">
          <input className="input" value={f.fiberMedium} onChange={e => set('fiberMedium', e.target.value)} placeholder="如 60.2" />
        </Field>
        <Field label="长纤维 % *">
          <input className="input" value={f.fiberLong} onChange={e => set('fiberLong', e.target.value)} placeholder="如 23.0" />
        </Field>

        <Field label="白度 (ISO) *" err={hasField(errors, 'whiteness')}>
          <input className="input" value={f.whiteness} onChange={e => set('whiteness', e.target.value)} placeholder="如 83.9" />
        </Field>
        <Field label="含水率 % *" err={hasField(errors, 'moistureContent')}>
          <input className="input" value={f.moistureContent} onChange={e => set('moistureContent', e.target.value)} placeholder="如 5.95" />
        </Field>
        <Field label="操作员 *">
          <select className="input" value={f.operatorName} onChange={e => set('operatorName', e.target.value)}>
            {OPERATORS.map(o => <option key={o.id} value={o.name}>{o.name} · {o.role}</option>)}
          </select>
        </Field>

        <Field label="责任人 *" span="md:col-span-2">
          <div className="flex gap-2 flex-wrap">
            {['陈建国', '赵明辉', '孙丽萍'].map(n => (
              <label key={n} className={`flex-1 min-w-[140px] border rounded-lg px-3 py-2 cursor-pointer text-sm ${f.responsiblePersonName === n ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-paper-300 hover:border-brand-300'}`}>
                <input type="radio" className="hidden" checked={f.responsiblePersonName === n} onChange={() => set('responsiblePersonName', n)} />
                {n}
              </label>
            ))}
          </div>
        </Field>
        <Field label="来源详情" span="md:col-span-3">
          <textarea className="input min-h-[72px]" value={f.sourceInfo} onChange={e => set('sourceInfo', e.target.value)} placeholder="供应商/车间班次/退货单号等备注信息" />
        </Field>
      </div>

      {(errors.length + warnings.length) > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-1.5">
          {errors.map((e, i) => (
            <p key={i} className="text-xs text-rose-700 flex items-start gap-2">
              <Icon.Alert className="w-4 h-4 mt-0.5 flex-shrink-0" /> {e.message}
            </p>
          ))}
          {warnings.map((w, i) => (
            <p key={`w${i}`} className="text-xs text-amber-700 flex items-start gap-2">
              <Icon.Warn className="w-4 h-4 mt-0.5 flex-shrink-0" /> {w.message}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button className="btn-ghost" onClick={onClose}><Icon.X className="w-4 h-4" /> 取消</button>
        <button className="btn-primary" onClick={submit} disabled={errors.length > 0}>
          <Icon.Check className="w-4 h-4" />
          {errors.length ? `存在 ${errors.length} 个错误` : `登记并预检 (${warnings.length ? warnings.length + ' 条警告' : '通过'})`}
        </button>
      </div>
    </div>
  )
}

function Field({ label, err, children, span = '' }: { label: string; err?: boolean; children: React.ReactNode; span?: string }) {
  return (
    <div className={span}>
      <label className={`label ${err ? 'text-rose-600' : ''}`}>{label}</label>
      {children}
    </div>
  )
}

function hasField(list: { field?: string }[], field: string) {
  return list.some(x => x.field === field)
}

function BatchPaste({ rows, validated }: { rows: ImportRow[]; validated: ReturnType<typeof API.validateRows> }) {
  const s = useStore()
  return (
    <div className="space-y-4">
      <div>
        <label className="label flex items-center justify-between">
          <span>粘贴数据（TSV / CSV / 多空格分隔均可，首行表头可识别）</span>
          <span className="text-slate-400">{rows.length} 行已识别</span>
        </label>
        <textarea
          className="input font-mono text-xs leading-relaxed"
          style={{ minHeight: 200 }}
          value={s.pasteText}
          onChange={e => s.setPasteText(e.target.value)}
          placeholder={`示例：\n样本编号\t纸浆批号\t短纤维%\t中纤维%\t长纤维%\t白度\t含水率%\t来源\t来源详情\t操作员\t责任人\nS-PK-20260619-041\tPK-SW-2026-06-156\t16.8\t60.2\t23.0\t83.9\t5.95\tPURCHASE\t山东博汇\t张伟\t陈建国`}
        />
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-paper-200 scrollbar-thin">
          <table className="w-full text-xs">
            <thead className="bg-paper-100 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left w-12">#</th>
                {['样本编号', '纸浆批号', '短/中/长', '白度', '含水率', '来源', '操作员', '责任人', '状态'].map(h => (
                  <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {validated.map((v, i) => {
                const errCount = v.errors.filter(e => e.severity === 'ERROR').length
                const warnCount = v.errors.filter(e => e.severity === 'WARNING').length
                return (
                  <tr key={i} className={`border-t border-paper-100 ${errCount ? 'bg-rose-50/40' : warnCount ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 font-mono">{v.row.sampleCode || <span className="text-rose-500">—</span>}</td>
                    <td className="px-3 py-2 font-mono">{v.row.pulpBatch || <span className="text-rose-500">—</span>}</td>
                    <td className="px-3 py-2 font-mono">
                      <span className="text-amber-700">{v.row.fiberShort || '-'}</span>/
                      <span className="text-emerald-700">{v.row.fiberMedium || '-'}</span>/
                      <span className="text-brand-700">{v.row.fiberLong || '-'}</span>
                    </td>
                    <td className="px-3 py-2 font-mono">{v.row.whiteness || <span className="text-rose-500">缺</span>}</td>
                    <td className="px-3 py-2 font-mono">{v.row.moistureContent || <span className="text-rose-500">缺</span>}</td>
                    <td className="px-3 py-2">{v.row.sourceType || <span className="text-slate-400">未填</span>}</td>
                    <td className="px-3 py-2">{v.row.operatorName}</td>
                    <td className="px-3 py-2">{v.row.responsiblePersonName}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {errCount ? <span className="badge bg-rose-50 text-rose-700 border border-rose-200">错误 {errCount}</span>
                        : warnCount ? <span className="badge bg-amber-50 text-amber-700 border border-amber-200">警告 {warnCount}</span>
                          : <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">通过</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          共 <b className="text-slate-700">{rows.length}</b> 行 · 预计通过 <b className="text-emerald-600">{validated.filter(v => !v.errors.some(e => e.severity === 'ERROR')).length}</b> · 错误 <b className="text-rose-600">{validated.reduce((a, v) => a + v.errors.filter(e => e.severity === 'ERROR').length, 0)}</b>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={s.discardPending}><Icon.X className="w-4 h-4" /> 清空</button>
          <button className="btn-primary" onClick={s.doPrecheck} disabled={rows.length === 0}>
            <Icon.Search className="w-4 h-4" /> 运行预检
          </button>
        </div>
      </div>
    </div>
  )
}

function PrecheckReview() {
  const s = useStore()
  const r = s.precheckResult
  if (!r) return null

  const issueByRow = new Map<number, typeof r.issues>()
  r.issues.forEach(i => {
    if (!issueByRow.has(i.rowIndex)) issueByRow.set(i.rowIndex, [])
    issueByRow.get(i.rowIndex)!.push(i)
  })

  const issues = [
    { k: 'MISSING_FIELD' as const, n: '缺测字段', color: 'rose', icon: <Icon.Alert className="w-4 h-4" /> },
    { k: 'DUPLICATE' as const, n: '重复样本', color: 'amber', icon: <Icon.Repeat className="w-4 h-4" /> },
    { k: 'CONFLICT_BATCH' as const, n: '批次冲突', color: 'orange', icon: <Icon.Split className="w-4 h-4" /> },
    { k: 'INVALID_RANGE' as const, n: '越界', color: 'yellow', icon: <Icon.Gauge className="w-4 h-4" /> },
    { k: 'INVALID_FORMAT' as const, n: '格式错误', color: 'red', icon: <Icon.X className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="总行数" value={r.totalRows} color="slate" />
        <Stat label="通过行" value={r.passRows} color="emerald" />
        <Stat label="问题数" value={r.issues.length} color="rose" />
        <Stat label="重复组" value={r.duplicateGroups.length} color="amber" />
        <Stat label="冲突组" value={r.conflictGroups.length} color="orange" />
      </div>

      {r.missingFieldSummary && Object.keys(r.missingFieldSummary).length > 0 && (
        <div className="rounded-xl border border-paper-200 p-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Icon.Info className="w-4 h-4 text-brand-600" /> 缺测字段汇总
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(r.missingFieldSummary).map(([f, n]) => (
              <span key={f} className="chip bg-rose-50 text-rose-700 border border-rose-200">
                <b>{n}</b> × {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {r.duplicateGroups.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <Icon.Repeat className="w-4 h-4" /> 重复样本分组
          </h4>
          <ul className="space-y-2">
            {r.duplicateGroups.map((g, i) => (
              <li key={i} className="text-xs text-amber-900 font-mono bg-white/70 rounded-lg px-3 py-2 border border-amber-100">
                {g.join('  ·  ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.conflictGroups.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <h4 className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
            <Icon.Split className="w-4 h-4" /> 同批次判读差异（含水率跨度 ≥1.5pp）
          </h4>
          <ul className="space-y-2">
            {r.conflictGroups.map((g, i) => (
              <li key={i} className="text-xs text-orange-900 font-mono bg-white/70 rounded-lg px-3 py-2 border border-orange-100">
                {g.join('  ·  ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-paper-200 overflow-hidden">
        <div className="bg-paper-100 px-4 py-2.5 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">逐行问题明细（共 {r.issues.length} 条）</h4>
          <div className="flex gap-1.5 flex-wrap">
            {issues.map(it => (
              <span key={it.k} className={`text-[11px] px-2 py-0.5 rounded-full bg-${it.color}-50 text-${it.color}-700 border border-${it.color}-200`}>
                {it.n} {r.issues.filter(x => x.type === it.k).length}
              </span>
            ))}
          </div>
        </div>
        <div className="max-h-72 overflow-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white/95 backdrop-blur text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 w-16">行</th>
                <th className="text-left px-3 py-2 w-24">级别</th>
                <th className="text-left px-3 py-2 w-28">类型</th>
                <th className="text-left px-3 py-2 w-40">字段</th>
                <th className="text-left px-3 py-2 w-40">样本</th>
                <th className="text-left px-3 py-2">说明</th>
              </tr>
            </thead>
            <tbody>
              {r.issues.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">✓ 未发现任何问题</td></tr>
              )}
              {r.issues.map((i, idx) => {
                const sev = i.severity === 'ERROR' ? { c: 'rose', t: '错误' } : i.severity === 'WARNING' ? { c: 'amber', t: '警告' } : { c: 'sky', t: '提示' }
                return (
                  <tr key={idx} className="border-t border-paper-100 hover:bg-paper-50">
                    <td className="px-3 py-2 font-mono text-slate-500">{i.rowIndex + 1}</td>
                    <td className="px-3 py-2"><span className={`badge bg-${sev.c}-50 text-${sev.c}-700 border border-${sev.c}-200`}>{sev.t}</span></td>
                    <td className="px-3 py-2 font-mono text-slate-600">{i.type}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">{i.field || '—'}</td>
                    <td className="px-3 py-2 font-mono">{i.sampleCode || '—'}</td>
                    <td className="px-3 py-2 text-slate-700">{i.message}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">提示：即使预检失败也可强制入库，系统会自动打上「预检失败 / 缺测」标签</div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={s.discardPending}><Icon.X className="w-4 h-4" /> 取消</button>
          <button className="btn-outline" onClick={() => s.setImportMode('BATCH')}><Icon.Edit3 className="w-4 h-4" /> 继续编辑</button>
          <button className="btn-primary" onClick={s.commitImport} disabled={s.pendingRows.length === 0}>
            <Icon.Send className="w-4 h-4" /> 确认入库 ({s.pendingRows.length})
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color: 'slate' | 'emerald' | 'rose' | 'amber' | 'orange' | 'brand' }) {
  const map: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
  }
  return (
    <div className={`rounded-xl p-4 border ${map[color]}`}>
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}
