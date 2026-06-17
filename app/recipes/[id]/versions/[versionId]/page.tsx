import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/data-store";

export default async function VersionDetailPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  const recipe = await getRecipeById(id);
  if (!recipe) notFound();

  const version = recipe.versions.find(v => v.id === versionId);
  if (!version) notFound();

  const versionIndex = recipe.versions.findIndex(v => v.id === versionId);
  const prevVersion = versionIndex > 0 ? recipe.versions[versionIndex - 1] : null;

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

  function getComponentDiff(comp1: any, comp2: any) {
    if (!comp1 || !comp2) return null;
    const diff = comp1.percentage - comp2.percentage;
    if (Math.abs(diff) < 0.01) return { diff: 0, changed: false };
    return { diff, changed: true };
  }

  const allIngredientNames = Array.from(new Set([
    ...version.components.map(c => c.ingredientName),
    ...(prevVersion?.components.map(c => c.ingredientName) || []),
  ]));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-4">
        <Link href={`/recipes/${recipe.id}`} className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回配方详情
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-stone-400">{recipe.code}</span>
                <span className="text-xl font-bold text-stone-800">v{version.versionNumber}</span>
                {version.isLocked ? (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    🔒 已锁定
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    可编辑
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-stone-800 mb-2">{recipe.name}</h1>
              <p className="text-stone-600">版本详情与历史对比</p>
            </div>
            <div className="flex gap-2">
              {!version.isLocked ? (
                <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                  🔒 锁定版本
                </button>
              ) : (
                <button className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm">
                  🔓 解锁版本
                </button>
              )}
              <button className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm">
                基于此版本新建
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-xl font-bold text-stone-800">{version.firingTemperature}°C</div>
              <div className="text-xs text-stone-500 mt-1">烧成温度</div>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-xl font-bold text-stone-800">
                {firingTypeLabels[version.firingType] || version.firingType}
              </div>
              <div className="text-xs text-stone-500 mt-1">烧成气氛</div>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-xl font-bold text-stone-800">{version.holdTime} 分钟</div>
              <div className="text-xs text-stone-500 mt-1">保温时间</div>
            </div>
            <div className="text-center p-4 bg-stone-50 rounded-lg">
              <div className="text-xl font-bold text-stone-800">{version.specimens.length}</div>
              <div className="text-xs text-stone-500 mt-1">试片数量</div>
            </div>
          </div>

          {version.changeNotes && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-sm font-medium text-amber-900 mb-1">变更说明</div>
              <p className="text-sm text-amber-800">{version.changeNotes}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm text-stone-500">
            <span>创建人: {version.createdBy}</span>
            <span>创建时间: {new Date(version.createdAt).toLocaleString('zh-CN')}</span>
            {version.batchNumber && (
              <span>批次: <span className="font-mono">{version.batchNumber}</span></span>
            )}
          </div>
        </div>
      </div>

      {prevVersion && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-800">
              版本对比
              <span className="text-sm text-stone-400 font-normal ml-2">
                v{prevVersion.versionNumber} → v{version.versionNumber}
              </span>
            </h2>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 px-3 font-medium text-stone-500">原料</th>
                    <th className="text-right py-2 px-3 font-medium text-stone-500">v{prevVersion.versionNumber}</th>
                    <th className="text-right py-2 px-3 font-medium text-stone-500">v{version.versionNumber}</th>
                    <th className="text-right py-2 px-3 font-medium text-stone-500">变化</th>
                  </tr>
                </thead>
                <tbody>
                  {allIngredientNames.map(name => {
                    const oldComp = prevVersion.components.find(c => c.ingredientName === name);
                    const newComp = version.components.find(c => c.ingredientName === name);
                    const diff = getComponentDiff(newComp, oldComp);

                    return (
                      <tr key={name} className={`border-b border-stone-100 ${
                        diff?.changed ? 'bg-amber-50' : ''
                      }`}>
                        <td className="py-3 px-3">
                          <span className="font-medium text-stone-800">{name}</span>
                          {(newComp?.locked || oldComp?.locked) && (
                            <span className="ml-2 text-xs text-amber-600">🔒</span>
                          )}
                        </td>
                        <td className="text-right py-3 px-3 font-mono text-stone-500">
                          {oldComp ? `${oldComp.percentage.toFixed(1)}%` : '-'}
                        </td>
                        <td className="text-right py-3 px-3 font-mono text-stone-800">
                          {newComp ? `${newComp.percentage.toFixed(1)}%` : '-'}
                        </td>
                        <td className={`text-right py-3 px-3 font-mono font-medium ${
                          diff && diff.changed
                            ? diff.diff > 0 ? 'text-emerald-600' : 'text-red-600'
                            : 'text-stone-400'
                        }`}>
                          {diff ? (
                            diff.changed
                              ? `${diff.diff > 0 ? '+' : ''}${diff.diff.toFixed(1)}%`
                              : '—'
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-stone-200 font-medium">
                    <td className="py-3 px-3 text-stone-600">总计</td>
                    <td className="text-right py-3 px-3 font-mono text-stone-500">
                      {prevVersion.totalPercentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-3 font-mono text-stone-800">
                      {version.totalPercentage.toFixed(1)}%
                    </td>
                    <td className="text-right py-3 px-3 font-mono">
                      {(version.totalPercentage - prevVersion.totalPercentage) > 0 ? '+' : ''}
                      {(version.totalPercentage - prevVersion.totalPercentage).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${
                version.firingTemperature !== prevVersion.firingTemperature
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-stone-50'
              }`}>
                <div className="text-xs text-stone-500 mb-1">烧成温度</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-stone-800">
                    {version.firingTemperature}°C
                  </span>
                  {version.firingTemperature !== prevVersion.firingTemperature && (
                    <span className={`text-sm font-medium ${
                      version.firingTemperature > prevVersion.firingTemperature
                        ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {version.firingTemperature > prevVersion.firingTemperature ? '↑' : '↓'}
                      {Math.abs(version.firingTemperature - prevVersion.firingTemperature)}°C
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                version.firingType !== prevVersion.firingType
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-stone-50'
              }`}>
                <div className="text-xs text-stone-500 mb-1">烧成气氛</div>
                <div className="text-lg font-bold text-stone-800">
                  {firingTypeLabels[version.firingType] || version.firingType}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                version.holdTime !== prevVersion.holdTime
                  ? 'bg-amber-50 border border-amber-200'
                  : 'bg-stone-50'
              }`}>
                <div className="text-xs text-stone-500 mb-1">保温时间</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-stone-800">
                    {version.holdTime} 分钟
                  </span>
                  {version.holdTime !== prevVersion.holdTime && (
                    <span className="text-sm text-amber-600 font-medium">
                      {version.holdTime > prevVersion.holdTime ? '+' : ''}
                      {version.holdTime - prevVersion.holdTime} 分钟
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-stone-800">
            试片记录 <span className="text-sm text-stone-400 font-normal">({version.specimens.length})</span>
          </h2>
          <button className="text-sm text-amber-600 hover:text-amber-700">+ 添加试片</button>
        </div>

        <div className="p-6">
          {version.specimens.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {version.specimens.map(specimen => (
                <div
                  key={specimen.id}
                  className="bg-stone-50 rounded-lg overflow-hidden border border-stone-200"
                >
                  <div
                    className="aspect-square flex items-center justify-center"
                    style={{ backgroundColor: specimen.firedColor || '#e5e5e5' }}
                  >
                    <span className="text-xs text-white/90 font-medium bg-black/30 px-2 py-1 rounded">
                      {specimen.label}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-stone-800">{specimen.label}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">表面质量</span>
                        <span className={`px-1.5 py-0.5 rounded ${qualityConfig[specimen.surfaceQuality]?.class || ''}`}>
                          {qualityConfig[specimen.surfaceQuality]?.label || specimen.surfaceQuality}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">光泽度</span>
                        <span className="text-stone-700">
                          {glossLabels[specimen.glossLevel] || specimen.glossLevel}
                        </span>
                      </div>
                    </div>
                    {specimen.defects.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-stone-200">
                        <div className="text-xs text-stone-500 mb-1">缺陷:</div>
                        <div className="flex flex-wrap gap-1">
                          {specimen.defects.map((defect, i) => (
                            <span key={i} className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                              {defect}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {specimen.notes && (
                      <div className="mt-2 pt-2 border-t border-stone-200">
                        <p className="text-xs text-stone-600 line-clamp-2">{specimen.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">🔬</div>
              <p className="text-stone-500">此版本暂无试片记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
