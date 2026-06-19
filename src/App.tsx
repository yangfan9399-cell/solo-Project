import { AppProvider } from './store/AppStore'
import { AppHeader } from './components/AppHeader'
import { ImportPanel } from './components/ImportPanel'
import { SampleList } from './components/SampleList'
import { DetailPanel } from './components/DetailPanel'
import { Toast } from './components/Toast'

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-paper-100 via-paper-50 to-brand-50/30">
        <AppHeader />
        <main className="max-w-[1600px] mx-auto px-6 py-6">
          <ImportPanel />
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(480px,580px)] gap-5">
            <div className="min-w-0"><SampleList /></div>
            <div className="xl:sticky xl:top-[76px] xl:h-[calc(100vh-108px)] min-h-[600px]">
              <DetailPanel />
            </div>
          </div>
        </main>
        <footer className="mt-10 py-6 text-center text-xs text-slate-400 border-t border-paper-200 bg-white/50">
          纸浆纤维样本工作台 · 支持单条/批量录入 · 实时预检 · 烘干条件差异比对 · 审计时间线 · 全量本地持久化
        </footer>
        <Toast />
      </div>
    </AppProvider>
  )
}
