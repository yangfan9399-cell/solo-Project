import { Wrench, BarChart3 } from 'lucide-react'

export function Header() {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">质量索赔平台</h1>
              <p className="text-xs text-secondary">汽车零部件质量索赔与供应商扣款</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1">
            <a
              href="/"
              className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              索赔列表
            </a>
            <a
              href="/report"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              数据复盘
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
