import Link from "next/link";
import { getAllRecipes } from "@/lib/data-store";

export default async function SpecimensPage({
  searchParams,
}: {
  searchParams: Promise<{
    quality?: string;
    gloss?: string;
    defects?: string;
    color?: string;
    recipeId?: string;
  }>;
}) {
  const params = await searchParams;
  const recipes = await getAllRecipes();

  const qualityFilter = params.quality || '';
  const glossFilter = params.gloss || '';
  const defectsFilter = params.defects || '';
  const recipeFilter = params.recipeId || '';

  const allSpecimens: Array<any> = [];
  recipes.forEach(recipe => {
    recipe.versions.forEach(version => {
      version.specimens.forEach(specimen => {
        allSpecimens.push({
          ...specimen,
          recipeName: recipe.name,
          recipeCode: recipe.code,
          recipeId: recipe.id,
          versionNumber: version.versionNumber,
          versionId: version.id,
        });
      });
    });
  });

  let filteredSpecimens = allSpecimens;

  if (qualityFilter) {
    filteredSpecimens = filteredSpecimens.filter(s => s.surfaceQuality === qualityFilter);
  }
  if (glossFilter) {
    filteredSpecimens = filteredSpecimens.filter(s => s.glossLevel === glossFilter);
  }
  if (defectsFilter === 'none') {
    filteredSpecimens = filteredSpecimens.filter(s => s.defects.length === 0);
  } else if (defectsFilter === 'has') {
    filteredSpecimens = filteredSpecimens.filter(s => s.defects.length > 0);
  }
  if (recipeFilter) {
    filteredSpecimens = filteredSpecimens.filter(s => s.recipeId === recipeFilter);
  }

  const qualityOptions = [
    { value: '', label: '全部质量' },
    { value: 'excellent', label: '优秀' },
    { value: 'good', label: '良好' },
    { value: 'fair', label: '一般' },
    { value: 'poor', label: '较差' },
  ];

  const glossOptions = [
    { value: '', label: '全部光泽' },
    { value: 'high', label: '高光' },
    { value: 'medium', label: '半光' },
    { value: 'low', label: '低光' },
    { value: 'matte', label: '哑光' },
  ];

  const defectsOptions = [
    { value: '', label: '全部缺陷' },
    { value: 'none', label: '无缺陷' },
    { value: 'has', label: '有缺陷' },
  ];

  const recipeCounts: Record<string, number> = {};
  allSpecimens.forEach(s => {
    recipeCounts[s.recipeId] = (recipeCounts[s.recipeId] || 0) + 1;
  });

  const qualityCounts = {
    excellent: allSpecimens.filter(s => s.surfaceQuality === 'excellent').length,
    good: allSpecimens.filter(s => s.surfaceQuality === 'good').length,
    fair: allSpecimens.filter(s => s.surfaceQuality === 'fair').length,
    poor: allSpecimens.filter(s => s.surfaceQuality === 'poor').length,
  };

  const glossCounts = {
    high: allSpecimens.filter(s => s.glossLevel === 'high').length,
    medium: allSpecimens.filter(s => s.glossLevel === 'medium').length,
    low: allSpecimens.filter(s => s.glossLevel === 'low').length,
    matte: allSpecimens.filter(s => s.glossLevel === 'matte').length,
  };

  const qualityConfig: Record<string, { label: string; class: string; dot: string }> = {
    excellent: { label: '优秀', class: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    good: { label: '良好', class: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    fair: { label: '一般', class: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    poor: { label: '较差', class: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  };

  const glossLabels: Record<string, string> = {
    high: '高光',
    medium: '半光',
    low: '低光',
    matte: '哑光',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">试片画廊</h2>
          <p className="text-stone-500 text-sm mt-1">
            共 {allSpecimens.length} 个试片 · 筛选后 {filteredSpecimens.length} 个
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              表面质量
            </label>
            <div className="space-y-1">
              {qualityOptions.map(opt => (
                <Link
                  key={opt.value}
                  href={`/specimens?${buildQuery({ quality: opt.value, gloss: glossFilter, defects: defectsFilter, recipeId: recipeFilter })}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                    qualityFilter === opt.value
                      ? 'bg-amber-100 text-amber-800'
                      : 'hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-stone-400">
                    {opt.value === '' ? allSpecimens.length : qualityCounts[opt.value as keyof typeof qualityCounts] || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              光泽度
            </label>
            <div className="space-y-1">
              {glossOptions.map(opt => (
                <Link
                  key={opt.value}
                  href={`/specimens?${buildQuery({ quality: qualityFilter, gloss: opt.value, defects: defectsFilter, recipeId: recipeFilter })}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                    glossFilter === opt.value
                      ? 'bg-amber-100 text-amber-800'
                      : 'hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-xs text-stone-400">
                    {opt.value === '' ? allSpecimens.length : glossCounts[opt.value as keyof typeof glossCounts] || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              缺陷状态
            </label>
            <div className="space-y-1">
              {defectsOptions.map(opt => (
                <Link
                  key={opt.value}
                  href={`/specimens?${buildQuery({ quality: qualityFilter, gloss: glossFilter, defects: opt.value, recipeId: recipeFilter })}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                    defectsFilter === opt.value
                      ? 'bg-amber-100 text-amber-800'
                      : 'hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <span>{opt.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              配方筛选
            </label>
            <div className="space-y-1 max-h-56 overflow-y-auto">
              <Link
                href={`/specimens?${buildQuery({ quality: qualityFilter, gloss: glossFilter, defects: defectsFilter, recipeId: '' })}`}
                className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                  recipeFilter === ''
                    ? 'bg-amber-100 text-amber-800'
                    : 'hover:bg-stone-50 text-stone-600'
                }`}
              >
                <span className="truncate">全部配方</span>
                <span className="text-xs text-stone-400 ml-2 flex-shrink-0">{allSpecimens.length}</span>
              </Link>
              {recipes.map(r => (
                <Link
                  key={r.id}
                  href={`/specimens?${buildQuery({ quality: qualityFilter, gloss: glossFilter, defects: defectsFilter, recipeId: r.id })}`}
                  className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                    recipeFilter === r.id
                      ? 'bg-amber-100 text-amber-800'
                      : 'hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <span className="truncate">
                    <span className="font-mono text-stone-400 text-xs mr-1">{r.code}</span>
                    {r.name}
                  </span>
                  <span className="text-xs text-stone-400 ml-2 flex-shrink-0">{recipeCounts[r.id] || 0}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {(qualityFilter || glossFilter || defectsFilter || recipeFilter) && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <Link
              href="/specimens"
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              × 清除所有筛选
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredSpecimens.map(specimen => (
          <Link
            key={specimen.id}
            href={`/recipes/${specimen.recipeId}/versions/${specimen.versionId}`}
            className="group bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md hover:border-amber-200 transition-all"
          >
            <div
              className="aspect-square relative"
              style={{ backgroundColor: specimen.firedColor || '#e5e5e5' }}
            >
              {!specimen.photoUrl && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs text-white/90 font-medium bg-black/30 px-2 py-1 rounded">
                    {specimen.label}
                  </span>
                </div>
              )}
              <div className="absolute top-2 right-2">
                <span className={`w-3 h-3 rounded-full inline-block ${qualityConfig[specimen.surfaceQuality]?.dot || 'bg-stone-400'}`} title={qualityConfig[specimen.surfaceQuality]?.label || specimen.surfaceQuality} />
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-stone-800 truncate">
                  {specimen.label}
                </span>
              </div>
              <div className="text-xs text-stone-500 truncate">
                {specimen.recipeCode}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${qualityConfig[specimen.surfaceQuality]?.class || ''}`}>
                  {qualityConfig[specimen.surfaceQuality]?.label || specimen.surfaceQuality}
                </span>
                <span className="text-xs text-stone-500">
                  {glossLabels[specimen.glossLevel] || specimen.glossLevel}
                </span>
              </div>
              {specimen.defects.length > 0 && (
                <div className="mt-2 pt-2 border-t border-stone-100">
                  <div className="flex flex-wrap gap-1">
                    {specimen.defects.slice(0, 2).map((defect: string, i: number) => (
                      <span key={i} className="text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                        {defect}
                      </span>
                    ))}
                    {specimen.defects.length > 2 && (
                      <span className="text-xs text-stone-400">+{specimen.defects.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filteredSpecimens.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-stone-500 mb-2">没有找到匹配的试片</p>
          <Link href="/specimens" className="text-amber-600 hover:text-amber-700 text-sm">
            清除筛选条件
          </Link>
        </div>
      )}
    </div>
  );
}

function buildQuery(params: { quality: string; gloss: string; defects: string; recipeId: string }): string {
  const sp = new URLSearchParams();
  if (params.quality) sp.set('quality', params.quality);
  if (params.gloss) sp.set('gloss', params.gloss);
  if (params.defects) sp.set('defects', params.defects);
  if (params.recipeId) sp.set('recipeId', params.recipeId);
  return sp.toString();
}
