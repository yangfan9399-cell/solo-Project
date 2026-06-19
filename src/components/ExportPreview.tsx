import React, { useMemo, useState } from 'react'
import { useStore } from '../store/AppStore'
import { Icon } from './Icon'
import { Modal } from './Modal'

export function ExportPreview({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const rows = useMemo(() => s.exportRows(), [s])
  const [format, setFormat] = useState<'json' | 'csv' | 'tsv'>('tsv')

  const download = () => {
    let content = ''
    let mime = ''
    let ext = ''
    if (format === 'json') {
      content = JSON.stringify(rows, null, 2)
      mime = 'application/json'
      ext = 'json'
    } else {
      const sep = format === 'csv' ? ',' : '\t'
      const keys = Object.keys(rows[0] || {})
      const esc = (v: any) => {
        const t = v === null || v === undefined ? '' : String(v)
        return sep === ',' && /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
      }
      content = [keys.join(sep), ...rows.map(r => keys.map(k => esc(r[k as keyof typeof r])).join(sep))].join('\n')
      mime = 'text/plain'
      ext = format
    }
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `纸浆纤维样本_${new Date().toISOString().slice(0, 10)}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
    s.showToast('文件已生成并下载')
  }

  const cols = Object.keys(rows[0] || {})

  return (
    <Modal onClose={onClose} width="max-w-6xl" title={
      <div className="flex items-center gap-2">
        <Icon.Table className="w-5 h-5 text-brand-600" /> 导出预览
      </div>
    } footer={
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">导出格式</span>
          {(['tsv', 'csv', 'json'] as const).map(f => (
            <button key={f} onClick={() => setFormat(f)}
              className={`btn !py-1 !px-3 text-xs ${format === f ? 'bg-brand-600 text-white' : 'bg-paper-100 text-slate-600 hover:bg-paper-200'}`}>
              {f.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={onClose}>关闭</button>
          <button className="btn-primary" onClick={download}>
            <Icon.Download className="w-4 h-4" /> 下载 {format.toUpperCase()}
          </button>
        </div>
      </div>
    }>
      <div className="text-xs text-slate-500 mb-3">共 <b className="text-slate-700">{rows.length}</b> 条记录 · <b className="text-slate-700">{cols.length}</b> 个字段</div>
      <div className="max-h-[60vh] overflow-auto rounded-lg border border-paper-200 scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-paper-100 text-slate-600 z-10">
            <tr>
              <th className="px-2 py-2 text-left w-10">#</th>
              {cols.map(c => <th key={c} className="px-2 py-2 text-left whitespace-nowrap">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-paper-100 hover:bg-paper-50">
                <td className="px-2 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                {cols.map(c => <td key={c} className="px-2 py-1.5 font-mono whitespace-nowrap text-slate-700">
                  {r[c] === '' ? <span className="text-slate-300">—</span> : <span>{String(r[c])}</span>}
                </td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
