import { useStore } from '../store/AppStore'
import { Icon } from './Icon'

export function Toast() {
  const s = useStore()
  if (!s.toast) return null
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top fade-in duration-300">
      <div className="bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-2xl shadow-slate-900/30 border border-slate-700 flex items-center gap-2 text-sm backdrop-blur-md">
        <Icon.Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>{s.toast}</span>
      </div>
    </div>
  )
}
