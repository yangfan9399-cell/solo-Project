import Link from "next/link";
import { getAllProjects, getAllRecipes, getAllIngredients } from "@/lib/data-store";

export default async function Home() {
  const projects = await getAllProjects();
  const recipes = await getAllRecipes();
  const ingredients = await getAllIngredients();

  const activeProjects = projects.filter(p => p.status === 'active');
  const totalSpecimens = recipes.reduce((sum, r) =>
    sum + r.versions.reduce((s, v) => s + v.specimens.length, 0), 0);
  const totalVersions = recipes.reduce((sum, r) => sum + r.versions.length, 0);

  const recentRecipes = recipes
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const tempRange = recipes.length > 0 ? {
    min: Math.min(...recipes.flatMap(r => r.versions.map(v => v.firingTemperature))),
    max: Math.max(...recipes.flatMap(r => r.versions.map(v => v.firingTemperature))),
  } : { min: 0, max: 0 };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-800 mb-2">配方工作台</h2>
        <p className="text-stone-500 text-sm">陶瓷釉料配方试验矩阵管理 · 二元三元梯度 · 版本追溯</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/projects" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-500 text-sm">在研项目</span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
                📋
              </span>
            </div>
            <div className="text-3xl font-bold text-stone-800 mb-1">{activeProjects.length}</div>
            <div className="text-xs text-stone-400">共 {projects.length} 个项目</div>
          </div>
        </Link>

        <Link href="/recipes" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-500 text-sm">配方总数</span>
              <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
                🧪
              </span>
            </div>
            <div className="text-3xl font-bold text-stone-800 mb-1">{recipes.length}</div>
            <div className="text-xs text-stone-400">{totalVersions} 个版本记录</div>
          </div>
        </Link>

        <Link href="/specimens" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-500 text-sm">试片总数</span>
              <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
                🔬
              </span>
            </div>
            <div className="text-3xl font-bold text-stone-800 mb-1">{totalSpecimens}</div>
            <div className="text-xs text-stone-400">烧成温度 {tempRange.min}-{tempRange.max}°C</div>
          </div>
        </Link>

        <Link href="/ingredients" className="block">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-500 text-sm">原料种类</span>
              <span className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center text-sm">
                🧱
              </span>
            </div>
            <div className="text-3xl font-bold text-stone-800 mb-1">{ingredients.length}</div>
            <div className="text-xs text-stone-400">6 大类原料</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">最近更新配方</h3>
              <Link href="/recipes" className="text-sm text-amber-600 hover:text-amber-700">查看全部 →</Link>
            </div>
            <div className="divide-y divide-stone-100">
              {recentRecipes.map(recipe => (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-stone-50 transition-colors"
                >
                  <div className={`w-2 h-12 rounded-full ${
                    recipe.status === 'active' ? 'bg-emerald-500' :
                    recipe.status === 'experimental' ? 'bg-amber-500' : 'bg-stone-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800 truncate">{recipe.name}</span>
                      <span className="text-xs text-stone-400 font-mono">{recipe.code}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-stone-500">
                        {recipe.versions.length} 个版本
                      </span>
                      <span className="text-xs text-stone-500">
                        {recipe.coneTarget} 锥
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        recipe.matrixType === 'binary' ? 'bg-blue-50 text-blue-600' :
                        recipe.matrixType === 'ternary' ? 'bg-purple-50 text-purple-600' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {recipe.matrixType === 'binary' ? '二元矩阵' :
                         recipe.matrixType === 'ternary' ? '三元矩阵' : '单一配方'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-stone-400">
                      {new Date(recipe.updatedAt).toLocaleDateString('zh-CN')}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {recipe.tags.slice(0, 2).map(t => (
                        <span key={t} className="mr-1">#{t}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="font-semibold text-stone-800">快捷操作</h3>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/projects/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  +
                </span>
                新建项目
              </Link>
              <Link
                href="/recipes/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  +
                </span>
                新建配方
              </Link>
              <Link
                href="/recipes?matrix=binary"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                  2×
                </span>
                二元矩阵实验
              </Link>
              <Link
                href="/recipes?matrix=ternary"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs">
                  3×
                </span>
                三元矩阵实验
              </Link>
              <Link
                href="/specimens"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center text-xs">
                  🖼
                </span>
                试片效果筛选
              </Link>
              <Link
                href="/ingredients"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-stone-50 transition-colors text-sm"
              >
                <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-xs">
                  📚
                </span>
                原料库查阅
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
            <h3 className="font-semibold text-amber-900 mb-2">🔥 今日提示</h3>
            <p className="text-sm text-amber-800 leading-relaxed">
              进行配方梯度实验时，建议从 5 个梯度点开始，
              待确定大致范围后再细化梯度，可有效提高实验效率。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
