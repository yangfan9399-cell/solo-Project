import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById, getRecipesByProject } from "@/lib/data-store";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  const recipes = await getRecipesByProject(id);

  const statusConfig = {
    active: { label: '进行中', class: 'bg-emerald-50 text-emerald-700' },
    completed: { label: '已完成', class: 'bg-blue-50 text-blue-700' },
    'on-hold': { label: '已暂停', class: 'bg-amber-50 text-amber-700' },
  };

  const totalSpecimens = recipes.reduce((sum, r) =>
    sum + r.versions.reduce((s, v) => s + v.specimens.length, 0), 0);
  const totalVersions = recipes.reduce((sum, r) => sum + r.versions.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/projects" className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回项目台账
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-stone-400">{project.code}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[project.status].class}`}>
                  {statusConfig[project.status].label}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-800 mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-stone-600">{project.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                编辑项目
              </button>
              <Link
                href={`/api/export?projectId=${project.id}&format=json`}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                导出数据
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-2xl font-bold text-stone-800">{recipes.length}</div>
              <div className="text-xs text-stone-500 mt-1">配方数</div>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-2xl font-bold text-stone-800">{totalVersions}</div>
              <div className="text-xs text-stone-500 mt-1">版本数</div>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-2xl font-bold text-stone-800">{totalSpecimens}</div>
              <div className="text-xs text-stone-500 mt-1">试片数</div>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-2xl font-bold text-stone-800">{project.targetCone || '-'}</div>
              <div className="text-xs text-stone-500 mt-1">目标锥号</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {project.tags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-800">配方列表</h2>
        <Link
          href={`/recipes/new?projectId=${project.id}`}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
        >
          + 添加配方
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        {recipes.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {recipes.map(recipe => {
              const currentVersion = recipe.versions.find(v => v.id === recipe.currentVersionId)
                || recipe.versions[recipe.versions.length - 1];

              return (
                <Link
                  key={recipe.id}
                  href={`/recipes/${recipe.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors"
                >
                  <div className={`w-2 h-14 rounded-full ${
                    recipe.status === 'active' ? 'bg-emerald-500' :
                    recipe.status === 'experimental' ? 'bg-amber-500' : 'bg-stone-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800">{recipe.name}</span>
                      <span className="text-xs text-stone-400 font-mono">{recipe.code}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        recipe.matrixType === 'binary' ? 'bg-blue-50 text-blue-600' :
                        recipe.matrixType === 'ternary' ? 'bg-purple-50 text-purple-600' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {recipe.matrixType === 'binary' ? '二元矩阵' :
                         recipe.matrixType === 'ternary' ? '三元矩阵' : '单一配方'}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-1 line-clamp-1">
                      {recipe.description || '暂无描述'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-stone-400">
                      <span>{recipe.versions.length} 个版本</span>
                      <span>{recipe.coneTarget} 锥</span>
                      {currentVersion && (
                        <span>{currentVersion.firingTemperature}°C</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-stone-500">
                      最新版本 v{recipe.versions.length}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {new Date(recipe.updatedAt).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🧪</div>
            <p className="text-stone-500 mb-4">项目中还没有配方</p>
            <Link
              href={`/recipes/new?projectId=${project.id}`}
              className="text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              创建第一个配方 →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
