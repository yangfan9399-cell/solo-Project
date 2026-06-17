import Link from "next/link";
import { getAllRecipes, getAllProjects } from "@/lib/data-store";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; matrix?: string; projectId?: string }>;
}) {
  const { q = '', status = '', matrix = '', projectId = '' } = await searchParams;
  const recipes = await getAllRecipes();
  const projects = await getAllProjects();

  const query = q;
  const statusFilter = status;
  const matrixFilter = matrix;
  const projectFilter = projectId;

  let filteredRecipes = recipes;
  if (query) {
    const q = query.toLowerCase();
    filteredRecipes = filteredRecipes.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (statusFilter) {
    filteredRecipes = filteredRecipes.filter(r => r.status === statusFilter);
  }
  if (matrixFilter) {
    filteredRecipes = filteredRecipes.filter(r => r.matrixType === matrixFilter);
  }
  if (projectFilter) {
    filteredRecipes = filteredRecipes.filter(r => r.projectId === projectFilter);
  }

  const statusCounts = {
    active: recipes.filter(r => r.status === 'active').length,
    experimental: recipes.filter(r => r.status === 'experimental').length,
    archived: recipes.filter(r => r.status === 'archived').length,
  };

  const matrixCounts = {
    single: recipes.filter(r => r.matrixType === 'single').length,
    binary: recipes.filter(r => r.matrixType === 'binary').length,
    ternary: recipes.filter(r => r.matrixType === 'ternary').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">配方库</h2>
          <p className="text-stone-500 text-sm mt-1">浏览和管理所有釉料配方</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/recipes/new?type=single"
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
          >
            + 单一配方
          </Link>
          <Link
            href="/recipes/new?type=binary"
            className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            + 二元矩阵
          </Link>
          <Link
            href="/recipes/new?type=ternary"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            + 三元矩阵
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-stone-100 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索配方名称、编号、描述、标签..."
                defaultValue={query}
                className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <select
              defaultValue={projectFilter}
              className="px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">全部项目</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <span className="text-sm text-stone-500 py-2">状态:</span>
              <Link
                href={getFilterUrl({ status: '', matrix: matrixFilter, projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  !statusFilter ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                全部 ({recipes.length})
              </Link>
              <Link
                href={getFilterUrl({ status: 'active', matrix: matrixFilter, projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  statusFilter === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                在用 ({statusCounts.active})
              </Link>
              <Link
                href={getFilterUrl({ status: 'experimental', matrix: matrixFilter, projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  statusFilter === 'experimental' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                实验中 ({statusCounts.experimental})
              </Link>
              <Link
                href={getFilterUrl({ status: 'archived', matrix: matrixFilter, projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  statusFilter === 'archived' ? 'bg-stone-200 text-stone-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                已归档 ({statusCounts.archived})
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <span className="text-sm text-stone-500 py-2">矩阵类型:</span>
              <Link
                href={getFilterUrl({ status: statusFilter, matrix: '', projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  !matrixFilter ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                全部
              </Link>
              <Link
                href={getFilterUrl({ status: statusFilter, matrix: 'single', projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  matrixFilter === 'single' ? 'bg-stone-200 text-stone-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                单一配方 ({matrixCounts.single})
              </Link>
              <Link
                href={getFilterUrl({ status: statusFilter, matrix: 'binary', projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  matrixFilter === 'binary' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                二元矩阵 ({matrixCounts.binary})
              </Link>
              <Link
                href={getFilterUrl({ status: statusFilter, matrix: 'ternary', projectId: projectFilter, q: query })}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  matrixFilter === 'ternary' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                三元矩阵 ({matrixCounts.ternary})
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecipes.map(recipe => {
          const project = projects.find(p => p.id === recipe.projectId);
          const currentVersion = recipe.versions.find(v => v.id === recipe.currentVersionId)
            || recipe.versions[recipe.versions.length - 1];

          return (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="bg-white rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-stone-400">{recipe.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        recipe.matrixType === 'binary' ? 'bg-blue-50 text-blue-600' :
                        recipe.matrixType === 'ternary' ? 'bg-purple-50 text-purple-600' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {recipe.matrixType === 'binary' ? '二元矩阵' :
                         recipe.matrixType === 'ternary' ? '三元矩阵' : '单一配方'}
                      </span>
                    </div>
                    <h3 className="font-semibold text-stone-800 group-hover:text-amber-700 transition-colors">
                      {recipe.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    recipe.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    recipe.status === 'experimental' ? 'bg-amber-50 text-amber-700' :
                    'bg-stone-100 text-stone-600'
                  }`}>
                    {recipe.status === 'active' ? '在用' :
                     recipe.status === 'experimental' ? '实验中' : '已归档'}
                  </span>
                </div>

                {recipe.description && (
                  <p className="text-sm text-stone-500 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {currentVersion && (
                  <div className="bg-stone-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span>当前版本 v{currentVersion.versionNumber}</span>
                      {currentVersion.isLocked && (
                        <span className="text-amber-600">🔒 已锁定</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-sm font-medium text-stone-800">{currentVersion.firingTemperature}°C</div>
                        <div className="text-xs text-stone-400">烧成温度</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-stone-800">
                          {currentVersion.firingType === 'oxidation' ? '氧化' :
                           currentVersion.firingType === 'reduction' ? '还原' : currentVersion.firingType}
                        </div>
                        <div className="text-xs text-stone-400">气氛</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-stone-800">{currentVersion.specimens.length}</div>
                        <div className="text-xs text-stone-400">试片</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {recipe.tags.length > 2 && (
                      <span className="text-xs text-stone-400">+{recipe.tags.length - 2}</span>
                    )}
                  </div>
                  {project && (
                    <span className="text-xs text-stone-400">{project.code}</span>
                  )}
                </div>
              </div>
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-400">
                更新于 {new Date(recipe.updatedAt).toLocaleDateString('zh-CN')}
              </div>
            </Link>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-stone-500">没有找到匹配的配方</p>
        </div>
      )}
    </div>
  );
}

function getFilterUrl(params: { status?: string; matrix?: string; projectId?: string; q?: string }): string {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.matrix) searchParams.set('matrix', params.matrix);
  if (params.projectId) searchParams.set('projectId', params.projectId);
  if (params.q) searchParams.set('q', params.q);
  const query = searchParams.toString();
  return query ? `/recipes?${query}` : '/recipes';
}
