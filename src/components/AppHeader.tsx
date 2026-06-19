import React from 'react'
import { useStore } from '../store/AppStore'
import { Icon } from './Icon'

export function AppHeader() {
  const s = useStore()
  return (
    <header className="bg-white border-b border-paper-200 sticky top-0 z-30 backdrop-blur-md bg-white/90">
      <div className="max-w-[1600px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/20 flex items-center justify-center">
            <Icon.Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 leading-tight">纸浆纤维样本工作台</h1>
            <p className="text-xs text-slate-500">入库质检台 · 预检 · 判读 · 审计留痕</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <StatChip icon={<Icon.Layers className="w-4 h-4" />} label="样本总数" val={s.samples.length} color="brand" />
          <StatChip icon={<Icon.Clock className="w-4 h-4" />} label="待判读" val={s.samples.filter(x => x.status === 'PENDING_JUDGE').length} color="amber" />
          <StatChip icon={<Icon.Alert className="w-4 h-4" />} label="问题" val={s.samples.filter(x => x.missingFields.length || x.isDuplicate || x.conflictWithSampleId).length} color="rose" />
          <div className="h-6 w-px bg-paper-300 mx-1" />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-rose-100 text-slate-700 flex items-center justify-center text-sm font-bold shadow-sm">
              李
            </div>
            <div className="text-xs leading-tight">
              <div className="font-semibold text-slate-700">李娜</div>
              <div className="text-slate-500">质检主管</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function StatChip({ icon, label, val, color }: { icon: React.ReactNode; label: string; val: number; color: 'brand' | 'amber' | 'rose' }) {
  const m: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  return (
    <div className={`chip ${m[color]} !py-1.5 !px-3 gap-2`}>
      {icon}
      <span className="opacity-75">{label}</span>
      <b className="text-base">{val}</b>
    </div>
  )
}
