import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById, getProjectById, validateRecipeComponents, validateFiringParams } from "@/lib/data-store";
import { NewVersionButton, AddSpecimenButton } from "@/components/RecipeActions";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const project = recipe.projectId ? await getProjectById(recipe.projectId) : null;
  const currentVersion = recipe.versions.find(v => v.id === recipe.currentVersionId)
    || recipe.versions[recipe.versions.length - 1];

  const componentIssues = currentVersion ? validateRecipeComponents(currentVersion.components) : [];
  const firingIssues = currentVersion && recipe.coneTarget
    ? validateFiringParams(currentVersion.firingTemperature, recipe.coneTarget)
    : [];
  const allIssues = [...componentIssues, ...firingIssues];

  const statusConfig = {
    active: { label: '在用', class: 'bg-emerald-50 text-emerald-700' },
    experimental: { label: '实验中', class: 'bg-amber-50 text-amber-700' },
    archived: { label: '已归档', class: 'bg-stone-100 text-stone-600' },
  };

  const firingTypeLabels: Record<string, string> = {
    oxidation: '氧化焰',
    reduction: '还原焰',
    soda: '苏打焰',
    wood: '柴烧',
    salt: '盐烧',
  };

  const qualityConfig: Record<string, { label: string; class: string }> = {
    excellent: { label: '优秀', class: 'bg-emerald-100 text-emerald-700' },
    good: { label: '良好', class: 'bg-blue-100 text-blue-700' },
    fair: { label: '一般', class: 'bg-amber-100 text-amber-700' },
    poor: { label: '较差', class: 'bg-red-100 text-red-700' },
  };

  const glossLabels: Record<string, string> = {
    high: '高光',
    medium: '半光',
    low: '低光',
    matte: '哑光',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href="/recipes" className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回配方库
        </Link>
      </div>

      {allIssues.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">⚠️</span>
            <span className="font-medium text-amber-900">数据校验提示</span>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              {allIssues.length} 个问题
            </span>
          </div>
          <ul className="space-y-1">
            {allIssues.map((issue, idx) => (
              <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                <span className={
                  issue.severity === 'error' ? 'text-red-500' :
                  issue.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                }>
                  {issue.severity === 'error' ? '●' : issue.severity === 'warning' ? '●' : '○'}
                </span>
                {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-6 border-b border-stone-100">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-stone-400">{recipe.code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[recipe.status].class}`}>
                      {statusConfig[recipe.status].label}
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
                  <h1 className="text-2xl font-bold text-stone-800 mb-2">{recipe.name}</h1>
                  {recipe.description && (
                    <p className="text-stone-600">{recipe.description}</p>
                  )}
                  {project && (
                    <div className="mt-3">
                      <Link href={`/projects/${project.id}`} className="text-sm text-amber-600 hover:text-amber-700">
                        所属项目: {project.name}
                      </Link>
                    </div>
                  )}
                </div>
                <div>
                  <NewVersionButton recipeId={recipe.id} currentVersionId={currentVersion.id} />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {recipe.tags.map(tag => (
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

          {currentVersion && (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-stone-800">配方成分</h2>
                  <span className="text-sm text-stone-400">v{currentVersion.versionNumber}</span>
                  {currentVersion.isLocked ? (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                      🔒 已锁定
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      可编辑
                    </span>
                  )}
                </div>
                <div className="text-sm text-stone-500">
                  总计: <span className={
                    Math.abs(currentVersion.totalPercentage - 100) < 0.1
                      ? 'text-emerald-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }>{currentVersion.totalPercentage.toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {currentVersion.components.map((comp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 bg-stone-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-medium">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800">{comp.ingredientName}</span>
                          {comp.locked && (
                            <span className="text-xs text-amber-600" title="已锁定">🔒</span>
                          )}
                        </div>
                        <div className="w-full bg-stone-200 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${Math.min(comp.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-semibold text-stone-800 font-mono">
                          {comp.percentage.toFixed(1)}
                        </span>
                        <span className="text-sm text-stone-400">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentVersion && (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <h2 className="font-semibold text-stone-800">
                  试片效果 <span className="text-sm text-stone-400 font-normal">({currentVersion.specimens.length} 个)</span>
                </h2>
                <AddSpecimenButton recipeId={recipe.id} versionId={currentVersion.id} />
              </div>
              {currentVersion.specimens.length > 0 && (

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {currentVersion.specimens.map(specimen => (
                    <div
                      key={specimen.id}
                      className="group relative bg-stone-50 rounded-lg overflow-hidden border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer"
                    >
                      <div
                        className="aspect-square flex items-center justify-center"
                        style={{ backgroundColor: specimen.firedColor || '#e5e5e5' }}
                      >
                        {!specimen.photoUrl && (
                          <span className="text-xs text-white/80 font-medium bg-black/20 px-2 py-1 rounded">
                            {specimen.label}
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-stone-800">{specimen.label}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${qualityConfig[specimen.surfaceQuality]?.class || ''}`}>
                            {qualityConfig[specimen.surfaceQuality]?.label || specimen.surfaceQuality}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500">
                          {glossLabels[specimen.glossLevel] || specimen.glossLevel}
                        </div>
                        {specimen.defects.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {specimen.defects.map((defect, i) => (
                              <span key={i} className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                                {defect}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
              {currentVersion.specimens.length === 0 && (
                <div className="p-8 text-center text-stone-500">
                  <div className="text-3xl mb-2">🔬</div>
                  <p className="text-sm">暂无试片记录，点击右上角添加</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {currentVersion && (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100">
                <h3 className="font-semibold text-stone-800">烧成参数</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">目标锥号</span>
                  <span className="font-medium text-stone-800">{recipe.coneTarget}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">烧成温度</span>
                  <span className="font-medium text-stone-800">{currentVersion.firingTemperature}°C</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">烧成气氛</span>
                  <span className="font-medium text-stone-800">
                    {firingTypeLabels[currentVersion.firingType] || currentVersion.firingType}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-stone-500">保温时间</span>
                  <span className="font-medium text-stone-800">{currentVersion.holdTime} 分钟</span>
                </div>
                {currentVersion.batchNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">批次号</span>
                    <span className="font-medium text-stone-800 font-mono">{currentVersion.batchNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">版本历史</h3>
              <span className="text-xs text-stone-400">{recipe.versions.length} 个版本</span>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <div className="divide-y divide-stone-100">
                {[...recipe.versions].reverse().map((version, idx) => (
                  <Link
                    key={version.id}
                    href={`/recipes/${recipe.id}/versions/${version.id}`}
                    className={`p-4 hover:bg-stone-50 transition-colors ${
                      version.id === recipe.currentVersionId ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-stone-800">
                        v{version.versionNumber}
                        {version.id === recipe.currentVersionId && (
                          <span className="ml-2 text-xs text-amber-600">当前</span>
                        )}
                      </span>
                      {version.isLocked && <span className="text-amber-500 text-xs">🔒</span>}
                    </div>
                    {version.changeNotes && (
                      <p className="text-xs text-stone-500 line-clamp-2 mb-2">
                        {version.changeNotes}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-stone-400">
                      <span>{version.firingTemperature}°C</span>
                      <span>{version.specimens.length} 试片</span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {new Date(version.createdAt).toLocaleDateString('zh-CN')} · {version.createdBy}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h3 className="font-semibold text-stone-800">导出数据</h3>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href={`/api/export?projectId=${recipe.projectId}&format=json`}
                className="block w-full px-4 py-2 text-center border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                导出 JSON
              </Link>
              <Link
                href={`/api/export?projectId=${recipe.projectId}&format=csv`}
                className="block w-full px-4 py-2 text-center border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors"
              >
                导出 CSV
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
