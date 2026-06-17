import { component$, useSignal, $, useComputed$, useStore } from '@builder.io/qwik';
import { routeLoader$, useNavigate, Link } from '@builder.io/qwik-city';
import { sectionDao } from '~/server/dao';
import { exportDetailToMarkdown } from '~/server/export';
import { SeverityBadge, ModeBadge, VersionBadge } from '~/components/badges';
import { InterferenceChart, MichelLevyChart } from '~/components/interference-chart';
import type { SectionDetail } from '~/types/mineral';
import { useUpdateSection } from '~/routes/api/sections/index';

export const useSectionDetail = routeLoader$(async (requestEvent) => {
  const id = parseInt(requestEvent.params.id);
  const exportFormat = requestEvent.url.searchParams.get('export');
  
  const section = await sectionDao.getById(id);
  if (!section) {
    throw requestEvent.error(404, '薄片记录不存在');
  }

  if (exportFormat === 'md') {
    const md = exportDetailToMarkdown(section);
    throw requestEvent.send(
      new Response(md, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${section.mineralName}-${section.thinSectionNumber}.md"`,
        },
      })
    );
  }

  return { section };
});

export default component$(() => {
  const data = useSectionDetail();
  const nav = useNavigate();
  const section = data.value.section as SectionDetail;
  
  const activeTab = useSignal<'photos' | 'optics' | 'interference' | 'cleavage' | 'association' | 'history' | 'anomalies'>('photos');
  const selectedPhotoId = useSignal<number | null>(section.micrographs[0]?.id || null);
  const isEditing = useSignal(false);
  const showLevyChart = useSignal(false);
  const action = useUpdateSection();
  const isStoreInitialized = useSignal(false);

  const editStore = useStore({
    basicInfo: {
      sampleNumber: '',
      mineralName: '',
      mineralFormula: '',
      crystalSystem: '',
      locality: '',
      collectionDate: '',
      collector: '',
      thinSectionNumber: '',
      thicknessMicrometers: 30 as number | undefined,
      coverSlip: true as boolean | string,
      mountingMedium: '',
      grainSizeMm: undefined as number | undefined,
      rockType: '',
      alterationDegree: undefined as number | undefined,
      sampleBoxId: undefined as number | string | undefined,
      boxPosition: '',
      notes: '',
    },
    optics: {
      relief: 0 as number | undefined,
      refractiveIndexMin: undefined as number | undefined,
      refractiveIndexMax: undefined as number | undefined,
      birefringence: undefined as number | undefined,
      opticSign: 'unknown' as 'positive' | 'negative' | 'unknown',
      opticAxisAngle: undefined as number | undefined,
      extinctionType: '' as string,
      extinctionAngle: undefined as number | undefined,
      pleochroism: '',
      pleochroismColors: '',
      absorptionFormula: '',
      twinningType: 'none' as string,
      twinningDescription: '',
      zoning: 0 as number,
      inclusionsDescription: '',
    },
    photos: [] as Array<{
      mode: 'ppl' | 'xpl' | 'cnl';
      magnification: number;
      hasPhoto: boolean;
      imagePath?: string;
      scaleBarMicrometers?: number;
      notes?: string;
    }>,
    associations: [] as Array<{
      associatedMineral: string;
      relationshipType: string;
      texturalRelation: string;
      abundancePercent: number;
      grainSizeMm?: number;
      parageneticStage: string;
      notes: string;
    }>,
  });

  const crystalSystemOptions = [
    '等轴晶系', '四方晶系', '六方晶系', '三方晶系',
    '斜方晶系', '单斜晶系', '三斜晶系'
  ];

  const extinctionTypeOptions = [
    { value: 'parallel', label: '平行消光' },
    { value: 'symmetrical', label: '对称消光' },
    { value: 'oblique', label: '斜消光' },
    { value: 'undulose', label: '波状消光' },
  ];

  const twinningTypeOptions = [
    { value: 'none', label: '无' },
    { value: 'simple', label: '简单双晶' },
    { value: 'polysynthetic', label: '聚片双晶' },
    { value: 'cyclic', label: '环状双晶' },
  ];

  const opticSignOptions = [
    { value: 'positive', label: '正光性' },
    { value: 'negative', label: '负光性' },
    { value: 'unknown', label: '未知' },
  ];

  const initializeEditStore = $(() => {
    if (isStoreInitialized.value) return;

    editStore.basicInfo = {
      sampleNumber: section.sampleNumber || '',
      mineralName: section.mineralName || '',
      mineralFormula: section.mineralFormula || '',
      crystalSystem: section.crystalSystem || '',
      locality: section.locality || '',
      collectionDate: section.collectionDate || '',
      collector: section.collector || '',
      thinSectionNumber: section.thinSectionNumber || '',
      thicknessMicrometers: section.thicknessMicrometers,
      coverSlip: section.coverSlip,
      mountingMedium: section.mountingMedium || '',
      grainSizeMm: section.grainSizeMm,
      rockType: section.rockType || '',
      alterationDegree: section.alterationDegree,
      sampleBoxId: section.sampleBoxId,
      boxPosition: section.boxPosition || '',
      notes: section.notes || '',
    };

    if (section.optics) {
      editStore.optics = {
        relief: section.optics.relief,
        refractiveIndexMin: section.optics.refractiveIndexMin,
        refractiveIndexMax: section.optics.refractiveIndexMax,
        birefringence: section.optics.birefringence,
        opticSign: section.optics.opticSign || 'unknown',
        opticAxisAngle: section.optics.opticAxisAngle,
        extinctionType: section.optics.extinctionType || '',
        extinctionAngle: section.optics.extinctionAngle,
        pleochroism: section.optics.pleochroism || '',
        pleochroismColors: section.optics.pleochroismColors || '',
        absorptionFormula: section.optics.absorptionFormula || '',
        twinningType: section.optics.twinningType || 'none',
        twinningDescription: section.optics.twinningDescription || '',
        zoning: section.optics.zoning,
        inclusionsDescription: section.optics.inclusionsDescription || '',
      };
    } else {
      editStore.optics = {
        relief: 0,
        refractiveIndexMin: undefined,
        refractiveIndexMax: undefined,
        birefringence: undefined,
        opticSign: 'unknown',
        opticAxisAngle: undefined,
        extinctionType: '',
        extinctionAngle: undefined,
        pleochroism: '',
        pleochroismColors: '',
        absorptionFormula: '',
        twinningType: 'none',
        twinningDescription: '',
        zoning: 0,
        inclusionsDescription: '',
      };
    }

    editStore.photos = section.micrographs.map(m => ({
      mode: m.mode,
      magnification: m.magnification,
      hasPhoto: true,
      imagePath: m.imagePath,
      scaleBarMicrometers: m.scaleBarMicrometers,
      notes: m.notes,
    }));

    editStore.associations = section.associations.map(a => ({
      associatedMineral: a.associatedMineral,
      relationshipType: a.relationshipType,
      texturalRelation: a.texturalRelation,
      abundancePercent: a.abundancePercent,
      grainSizeMm: a.grainSizeMm,
      parageneticStage: a.parageneticStage || '',
      notes: a.notes || '',
    }));

    isStoreInitialized.value = true;
  });

  const addAssociation = $(() => {
    editStore.associations.push({
      associatedMineral: '',
      relationshipType: '共生',
      texturalRelation: '',
      abundancePercent: 5,
      grainSizeMm: 0.3,
      parageneticStage: '',
      notes: '',
    });
  });

  const removeAssociation = $((index: number) => {
    editStore.associations.splice(index, 1);
  });

  const handleEditClick = $(async () => {
    if (!isEditing.value) {
      await initializeEditStore();
      isEditing.value = true;
    } else {
      const submitData = {
        id: section.id,
        ...editStore.basicInfo,
        optics: editStore.optics,
        photos: editStore.photos,
        associations: editStore.associations,
      };

      const result = await action.submit(submitData as any);

      if (result.value?.success) {
        alert('保存成功');
        isEditing.value = false;
        nav(`/sections/${section.id}`);
      } else if (result.value?.error) {
        alert(`保存失败: ${result.value.error}`);
      }
    }
  });

  const selectedPhoto = useComputed$(() => {
    return section.micrographs.find(m => m.id === selectedPhotoId.value) || section.micrographs[0];
  });

  const unresolvedAnomalies = useComputed$(() => {
    return section.anomalies.filter(a => !a.resolvedAt);
  });

  const exportMarkdown = $(() => {
    nav(`/sections/${section.id}?export=md`);
  });

  const photoModeGroups = useComputed$(() => {
    const groups: Record<string, typeof section.micrographs> = {
      ppl: [],
      xpl: [],
      cnl: [],
    };
    section.micrographs.forEach(m => {
      groups[m.mode].push(m);
    });
    return groups;
  });

  const totalAbundance = useComputed$(() => {
    const list = isEditing.value ? editStore.associations : section.associations;
    return list.reduce((sum, a) => sum + a.abundancePercent, 0);
  });

  const opticSignLabel: Record<string, string> = {
    positive: '正光性',
    negative: '负光性',
    unknown: '未知',
  };

  const extinctionTypeLabel: Record<string, string> = {
    parallel: '平行消光',
    symmetrical: '对称消光',
    oblique: '斜消光',
    undulose: '波状消光',
  };

  const cleavageQualityLabel: Record<string, string> = {
    perfect: '完全解理',
    good: '好',
    distinct: '清楚',
    indistinct: '不清楚',
    absent: '无解理',
  };

  const twinningTypeLabel: Record<string, string> = {
    simple: '简单双晶',
    polysynthetic: '聚片双晶',
    cyclic: '环状双晶',
    none: '无',
  };

  const orientationLabel: Record<string, string> = {
    parallel: '平行光轴',
    inclined: '斜交光轴',
    perpendicular: '垂直光轴',
  };

  const tabs = [
    { id: 'photos', label: '📷 显微照片', count: section.micrographs.length },
    { id: 'optics', label: '🔬 光学性质', count: section.optics ? 1 : 0 },
    { id: 'interference', label: '🌈 干涉色', count: section.interferenceColors.length },
    { id: 'cleavage', label: '📐 解理特征', count: section.cleavages.length },
    { id: 'association', label: '🔗 伴生关系', count: section.associations.length },
    { id: 'history', label: '📜 版本历史', count: section.versionHistory.length },
    { id: 'anomalies', label: '⚠️ 数据异常', count: unresolvedAnomalies.value.length, warn: unresolvedAnomalies.value.length > 0 },
  ];

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-mineral-50">
              {isEditing.value ? (
                <input
                  type="text"
                  class="input-field text-2xl font-bold"
                  value={editStore.basicInfo.mineralName}
                  onInput$={(e) => editStore.basicInfo.mineralName = (e.target as HTMLInputElement).value}
                />
              ) : (
                section.mineralName
              )}
            </h1>
            {isEditing.value ? (
              <input
                type="text"
                class="px-2 py-0.5 bg-mineral-700 text-mineral-200 rounded font-mono text-sm"
                value={editStore.basicInfo.mineralFormula}
                onInput$={(e) => editStore.basicInfo.mineralFormula = (e.target as HTMLInputElement).value}
                placeholder="矿物分子式"
              />
            ) : (
              section.mineralFormula && (
                <span class="px-2 py-0.5 bg-mineral-700 text-mineral-200 rounded font-mono text-sm">
                  {section.mineralFormula}
                </span>
              )
            )}
            <VersionBadge version={section.currentVersion} isLatest={true} />
            {unresolvedAnomalies.value.length > 0 && (
              <SeverityBadge severity={unresolvedAnomalies.value[0].severity} />
            )}
          </div>
          <p class="text-mineral-400">
            薄片编号: <span class="font-mono text-mineral-200">
              {isEditing.value ? (
                <input
                  type="text"
                  class="input-field inline w-32"
                  value={editStore.basicInfo.thinSectionNumber}
                  onInput$={(e) => editStore.basicInfo.thinSectionNumber = (e.target as HTMLInputElement).value}
                />
              ) : (
                section.thinSectionNumber
              )}
            </span>
            {section.locality && <span class="mx-2">·</span>}
            {isEditing.value ? (
              <>
                <span class="mx-2">·</span>
                <span>产地: 
                  <input
                    type="text"
                    class="input-field inline w-40"
                    value={editStore.basicInfo.locality}
                    onInput$={(e) => editStore.basicInfo.locality = (e.target as HTMLInputElement).value}
                  />
                </span>
              </>
            ) : (
              section.locality && <span>产地: {section.locality}</span>
            )}
            {section.crystalSystem && <span class="mx-2">·</span>}
            {isEditing.value ? (
              <>
                <span class="mx-2">·</span>
                <span>晶系: 
                  <select
                    class="select-field inline w-32"
                    value={editStore.basicInfo.crystalSystem as any}
                    onChange$={(e) => editStore.basicInfo.crystalSystem = (e.target as HTMLSelectElement).value as any}
                  >
                    <option value="">请选择晶系</option>
                    {crystalSystemOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </span>
              </>
            ) : (
              section.crystalSystem && <span>晶系: {section.crystalSystem}</span>
            )}
          </p>
        </div>
        <div class="flex gap-2">
          <button onClick$={exportMarkdown} class="btn-secondary">
            📄 导出报告
          </button>
          <button 
            onClick$={handleEditClick}
            class={isEditing.value ? 'btn-warning' : 'btn-primary'}
            disabled={action.isRunning}
          >
            {action.isRunning ? '保存中...' : (isEditing.value ? '✓ 保存' : '✏️ 编辑')}
          </button>
          <Link href="/sections" class="btn-secondary">
            ← 返回列表
          </Link>
        </div>
      </div>

      {action.value?.error && (
        <div class="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
          ⚠️ {action.value.error}
        </div>
      )}

      {unresolvedAnomalies.value.length > 0 && (
        <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-red-400 text-xl">⚠️</span>
            <span class="text-red-300 font-medium">检测到 {unresolvedAnomalies.value.length} 条数据异常需要处理</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {unresolvedAnomalies.value.slice(0, 3).map(a => (
              <div key={a.id} class="flex items-center gap-2 bg-red-900/30 rounded-lg px-3 py-1.5">
                <SeverityBadge severity={a.severity} />
                <span class="text-red-200 text-sm">{a.description}</span>
              </div>
            ))}
            {unresolvedAnomalies.value.length > 3 && (
              <button 
                onClick$={() => activeTab.value = 'anomalies'}
                class="text-red-300 text-sm hover:text-red-100"
              >
                还有 {unresolvedAnomalies.value.length - 3} 条 →
              </button>
            )}
          </div>
        </div>
      )}

      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 card p-4">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-mineral-100 mb-3">基本信息</h2>
            {isEditing.value ? (
              <div class="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <label class="label">样品编号</label>
                  <input
                    type="text"
                    class="input-field"
                    value={editStore.basicInfo.sampleNumber}
                    onInput$={(e) => editStore.basicInfo.sampleNumber = (e.target as HTMLInputElement).value}
                  />
                </div>
                <div>
                  <label class="label">薄片厚度 (μm)</label>
                  <input
                    type="number"
                    class="input-field"
                    min="10"
                    max="60"
                    value={editStore.basicInfo.thicknessMicrometers}
                    onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.basicInfo.thicknessMicrometers = v === '' ? undefined as any : parseFloat(v); }}
                  />
                </div>
                <div>
                  <label class="label">盖玻片</label>
                  <select
                    class="select-field"
                    value={editStore.basicInfo.coverSlip as any}
                    onChange$={(e) => editStore.basicInfo.coverSlip = (e.target as HTMLSelectElement).value as any}
                  >
                    <option value="true">有</option>
                    <option value="false">无</option>
                  </select>
                </div>
                <div>
                  <label class="label">封固剂</label>
                  <input
                    type="text"
                    class="input-field"
                    value={editStore.basicInfo.mountingMedium}
                    onInput$={(e) => editStore.basicInfo.mountingMedium = (e.target as HTMLInputElement).value}
                    placeholder="例如: 环氧树脂"
                  />
                </div>
                <div>
                  <label class="label">粒度 (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    class="input-field"
                    value={editStore.basicInfo.grainSizeMm}
                    onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.basicInfo.grainSizeMm = v === '' ? undefined as any : parseFloat(v); }}
                  />
                </div>
                <div>
                  <label class="label">岩石类型</label>
                  <input
                    type="text"
                    class="input-field"
                    value={editStore.basicInfo.rockType}
                    onInput$={(e) => editStore.basicInfo.rockType = (e.target as HTMLInputElement).value}
                    placeholder="例如: 花岗伟晶岩"
                  />
                </div>
                <div>
                  <label class="label">蚀变程度 (%)</label>
                  <input
                    type="number"
                    class="input-field"
                    value={editStore.basicInfo.alterationDegree}
                    onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.basicInfo.alterationDegree = v === '' ? undefined as any : parseFloat(v); }}
                  />
                </div>
                <div>
                  <label class="label">采集日期</label>
                  <input
                    type="date"
                    class="input-field"
                    value={editStore.basicInfo.collectionDate}
                    onInput$={(e) => editStore.basicInfo.collectionDate = (e.target as HTMLInputElement).value}
                  />
                </div>
                <div>
                  <label class="label">采集者</label>
                  <input
                    type="text"
                    class="input-field"
                    value={editStore.basicInfo.collector}
                    onInput$={(e) => editStore.basicInfo.collector = (e.target as HTMLInputElement).value}
                  />
                </div>
                <div>
                  <label class="label">盒内位置</label>
                  <input
                    type="text"
                    class="input-field font-mono"
                    value={editStore.basicInfo.boxPosition}
                    onInput$={(e) => editStore.basicInfo.boxPosition = (e.target as HTMLInputElement).value}
                    placeholder="例如: A1, B3"
                  />
                </div>
                <div>
                  <label class="label">创建时间</label>
                  <p class="text-mineral-200 text-xs font-mono">{new Date(section.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <label class="label">更新时间</label>
                  <p class="text-mineral-200 text-xs font-mono">{new Date(section.updatedAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            ) : (
              <div class="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-mineral-500">样品编号</p>
                  <p class="text-mineral-200 font-mono">{section.sampleNumber}</p>
                </div>
                <div>
                  <p class="text-mineral-500">薄片厚度</p>
                  <p class={`font-mono ${section.thicknessMicrometers < 15 || section.thicknessMicrometers > 45 ? 'text-orange-400' : 'text-mineral-200'}`}>
                    {section.thicknessMicrometers} μm
                  </p>
                </div>
                <div>
                  <p class="text-mineral-500">盖玻片</p>
                  <p class="text-mineral-200">{section.coverSlip ? '有' : '无'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">封固剂</p>
                  <p class="text-mineral-200">{section.mountingMedium || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">粒度</p>
                  <p class="text-mineral-200">{section.grainSizeMm ? `${section.grainSizeMm} mm` : '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">岩石类型</p>
                  <p class="text-mineral-200">{section.rockType || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">蚀变程度</p>
                  <p class="text-mineral-200">{section.alterationDegree !== undefined ? `${section.alterationDegree}%` : '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">采集日期</p>
                  <p class="text-mineral-200">{section.collectionDate || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">采集者</p>
                  <p class="text-mineral-200">{section.collector || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">储存位置</p>
                  <p class="text-mineral-200">
                    {section.box ? `${section.box.name} (${section.box.position || '-'})` : '-'}
                  </p>
                </div>
                <div>
                  <p class="text-mineral-500">创建时间</p>
                  <p class="text-mineral-200 text-xs font-mono">{new Date(section.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <div>
                  <p class="text-mineral-500">更新时间</p>
                  <p class="text-mineral-200 text-xs font-mono">{new Date(section.updatedAt).toLocaleString('zh-CN')}</p>
                </div>
              </div>
            )}
            {isEditing.value ? (
              <div class="mt-4 pt-4 border-t border-mineral-700">
                <label class="label">备注</label>
                <textarea
                  class="input-field min-h-[80px]"
                  value={editStore.basicInfo.notes}
                  onInput$={(e) => editStore.basicInfo.notes = (e.target as HTMLTextAreaElement).value}
                  placeholder="记录样品的特殊处理、观察条件等信息..."
                />
              </div>
            ) : (
              section.notes && (
                <div class="mt-4 pt-4 border-t border-mineral-700">
                  <p class="text-mineral-500 text-sm mb-1">备注</p>
                  <p class="text-mineral-300">{section.notes}</p>
                </div>
              )
            )}
          </div>
        </div>

        <div class="card p-4">
          <h2 class="text-lg font-semibold text-mineral-100 mb-3">快速统计</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
              <span class="text-mineral-400">显微照片</span>
              <span class="text-xl font-bold text-mineral-100">{section.micrographs.length} 张</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
              <span class="text-mineral-400">干涉色记录</span>
              <span class="text-xl font-bold text-purple-400">{section.interferenceColors.length} 条</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
              <span class="text-mineral-400">解理记录</span>
              <span class="text-xl font-bold text-blue-400">{section.cleavages.length} 条</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
              <span class="text-mineral-400">伴生矿物</span>
              <span class="text-xl font-bold text-green-400">{section.associations.length} 种</span>
            </div>
            {section.optics?.birefringence && (
              <div class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
                <span class="text-mineral-400">双折射率</span>
                <span class="text-xl font-bold text-orange-400 font-mono">{section.optics.birefringence}</span>
              </div>
            )}
            <div class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
              <span class="text-mineral-400">版本迭代</span>
              <span class="text-xl font-bold text-mineral-100">{section.versionHistory.length} 次</span>
            </div>
          </div>
          
          <button 
            onClick$={() => showLevyChart.value = !showLevyChart.value}
            class="w-full mt-4 py-2 bg-polar-purple/20 hover:bg-polar-purple/30 text-purple-300 rounded-lg transition-colors text-sm"
          >
            {showLevyChart.value ? '▼ 隐藏干涉色图' : '▶ 查看米歇尔-列维干涉色图'}
          </button>
        </div>
      </div>

      {showLevyChart.value && (
        <div class="card p-6">
          <h2 class="text-lg font-semibold text-mineral-100 mb-4">米歇尔-列维干涉色图</h2>
          <MichelLevyChart 
            height={200} 
            highlightBirefringence={section.optics?.birefringence}
            highlightThickness={section.thicknessMicrometers}
            interferenceColors={section.interferenceColors}
          />
        </div>
      )}

      <div class="card overflow-hidden">
        <div class="flex border-b border-mineral-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick$={() => activeTab.value = tab.id as any}
              class={[
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab.value === tab.id
                  ? 'text-mineral-100 bg-mineral-800/50'
                  : 'text-mineral-400 hover:text-mineral-200 hover:bg-mineral-800/30'
              ]}
            >
              {tab.label}
              {tab.count > 0 && (
                <span class={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  tab.warn ? 'bg-red-600 text-white' : 'bg-mineral-700 text-mineral-300'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab.value === tab.id && (
                <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-mineral-500"></span>
              )}
            </button>
          ))}
        </div>

        <div class="p-6">
          {activeTab.value === 'photos' && (
            <div class="space-y-6">
              <div class="flex gap-4">
                {(['ppl', 'xpl', 'cnl'] as const).map(mode => (
                  <div key={mode} class="flex-1">
                    <div class="flex items-center gap-2 mb-3">
                      <ModeBadge mode={mode} />
                      <span class="text-mineral-400 text-sm">{photoModeGroups.value[mode].length} 张</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                      {photoModeGroups.value[mode].map(photo => (
                        <button
                          key={photo.id}
                          onClick$={() => selectedPhotoId.value = photo.id}
                          class={[
                            'aspect-square rounded-lg overflow-hidden border-2 transition-all',
                            selectedPhotoId.value === photo.id
                              ? 'border-mineral-400 ring-2 ring-mineral-400/50'
                              : 'border-mineral-700 hover:border-mineral-600'
                          ]}
                        >
                          <img 
                            src={photo.imagePath} 
                            alt={`${mode} ${photo.magnification}x`}
                            class="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                      {photoModeGroups.value[mode].length === 0 && (
                        <div class="col-span-3 aspect-square rounded-lg border-2 border-dashed border-mineral-700 flex items-center justify-center text-mineral-600">
                          暂无照片
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {selectedPhoto.value && (
                <div class="bg-mineral-900 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <ModeBadge mode={selectedPhoto.value.mode} />
                      <span class="text-mineral-200">{selectedPhoto.value.magnification}× 放大</span>
                      <span class="text-mineral-500 text-sm font-mono">
                        比例尺: {selectedPhoto.value.scaleBarMicrometers} μm
                      </span>
                      {selectedPhoto.value.analyzerAngle !== undefined && (
                        <span class="text-mineral-500 text-sm">
                          检偏角: {selectedPhoto.value.analyzerAngle}°
                        </span>
                      )}
                      {selectedPhoto.value.accessoryPlate && (
                        <span class="text-mineral-500 text-sm">
                          补色器: {selectedPhoto.value.accessoryPlate}
                        </span>
                      )}
                    </div>
                    {selectedPhoto.value.capturedAt && (
                      <span class="text-mineral-500 text-xs font-mono">
                        拍摄: {new Date(selectedPhoto.value.capturedAt).toLocaleString('zh-CN')}
                        {selectedPhoto.value.capturedBy && ` · ${selectedPhoto.value.capturedBy}`}
                      </span>
                    )}
                  </div>
                  <div class="relative">
                    <img 
                      src={selectedPhoto.value.imagePath} 
                      alt="显微照片"
                      class="w-full rounded-lg"
                    />
                    <div class="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                      ─── {selectedPhoto.value.scaleBarMicrometers} μm
                    </div>
                  </div>
                  {selectedPhoto.value.notes && (
                    <p class="mt-3 text-mineral-400 text-sm">
                      视域描述: {selectedPhoto.value.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab.value === 'optics' && isEditing.value && (
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-md font-semibold text-mineral-200 mb-4">基本光学参数</h3>
                <div>
                  <label class="label">突起</label>
                  <input
                    type="number"
                    step="0.5"
                    min="-2"
                    max="6"
                    class="input-field"
                    placeholder="例如: +2"
                    value={editStore.optics.relief}
                    onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.optics.relief = v === '' ? undefined as any : parseFloat(v); }}
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">最小折射率 Np</label>
                    <input
                      type="number"
                      step="0.001"
                      class="input-field font-mono"
                      placeholder="例如: 1.648"
                      value={editStore.optics.refractiveIndexMin}
                      onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.optics.refractiveIndexMin = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                  <div>
                    <label class="label">最大折射率 Ng</label>
                    <input
                      type="number"
                      step="0.001"
                      class="input-field font-mono"
                      placeholder="例如: 1.670"
                      value={editStore.optics.refractiveIndexMax}
                      onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.optics.refractiveIndexMax = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">双折射率</label>
                    <input
                      type="number"
                      step="0.001"
                      class="input-field font-mono"
                      placeholder="例如: 0.022"
                      value={editStore.optics.birefringence}
                      onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.optics.birefringence = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                  <div>
                    <label class="label">光轴角 2V</label>
                    <input
                      type="number"
                      class="input-field"
                      placeholder="例如: 75"
                      value={editStore.optics.opticAxisAngle}
                      onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.optics.opticAxisAngle = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                </div>

                <div>
                  <label class="label">光性符号</label>
                  <select
                    class="select-field"
                    value={editStore.optics.opticSign as any}
                    onChange$={(e) => editStore.optics.opticSign = (e.target as HTMLSelectElement).value as any}
                  >
                    {opticSignOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-md font-semibold text-mineral-200 mb-4">消光与多色性</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">消光类型</label>
                    <select
                      class="select-field"
                      value={editStore.optics.extinctionType as any}
                      onChange$={(e) => editStore.optics.extinctionType = (e.target as HTMLSelectElement).value as any}
                    >
                      <option value="">未观察</option>
                      {extinctionTypeOptions.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="label">消光角</label>
                    <input
                      type="number"
                      class="input-field"
                      placeholder="例如: 35"
                      value={editStore.optics.extinctionAngle}
                      onInput$={(e) => { const v = (e.target as HTMLInputElement).value; editStore.optics.extinctionAngle = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                </div>

                <div>
                  <label class="label">多色性</label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: 弱-强"
                    value={editStore.optics.pleochroism}
                    onInput$={(e) => editStore.optics.pleochroism = (e.target as HTMLInputElement).value}
                  />
                </div>

                <div>
                  <label class="label">多色性公式</label>
                  <input
                    type="text"
                    class="input-field font-mono"
                    placeholder="例如: Ng = 淡紫色, Nm = 淡紫色, Np = 近无色"
                    value={editStore.optics.pleochroismColors}
                    onInput$={(e) => editStore.optics.pleochroismColors = (e.target as HTMLInputElement).value}
                  />
                </div>

                <div>
                  <label class="label">吸收公式</label>
                  <input
                    type="text"
                    class="input-field font-mono"
                    placeholder="例如: Ng > Nm > Np"
                    value={editStore.optics.absorptionFormula}
                    onInput$={(e) => editStore.optics.absorptionFormula = (e.target as HTMLInputElement).value}
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">双晶类型</label>
                    <select
                      class="select-field"
                      value={editStore.optics.twinningType as any}
                      onChange$={(e) => editStore.optics.twinningType = (e.target as HTMLSelectElement).value as any}
                    >
                      {twinningTypeOptions.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="label">环带结构</label>
                    <select
                      class="select-field"
                      value={editStore.optics.zoning as any}
                      onChange$={(e) => editStore.optics.zoning = parseInt((e.target as HTMLSelectElement).value)}
                    >
                      <option value={0}>无</option>
                      <option value={1}>有</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="col-span-2">
                <label class="label">双晶描述</label>
                <input
                  type="text"
                  class="input-field"
                  placeholder="描述双晶的特征，如聚片双晶的结合面方向等"
                  value={editStore.optics.twinningDescription}
                  onInput$={(e) => editStore.optics.twinningDescription = (e.target as HTMLInputElement).value}
                />
              </div>

              <div class="col-span-2">
                <label class="label">包体特征</label>
                <textarea
                  class="input-field min-h-[80px]"
                  placeholder="描述矿物中的包体类型、形态、分布特征等"
                  value={editStore.optics.inclusionsDescription}
                  onInput$={(e) => editStore.optics.inclusionsDescription = (e.target as HTMLTextAreaElement).value}
                />
              </div>
            </div>
          )}

          {activeTab.value === 'optics' && !isEditing.value && section.optics && (
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="text-md font-semibold text-mineral-200 mb-4">基本光学参数</h3>
                <div class="grid grid-cols-2 gap-4">
                  <div class="p-4 bg-mineral-800/50 rounded-lg">
                    <p class="text-mineral-500 text-sm">突起</p>
                    <p class="text-2xl font-bold text-mineral-100">
                      {section.optics.relief > 0 ? '+' : ''}{section.optics.relief}
                    </p>
                  </div>
                  <div class="p-4 bg-mineral-800/50 rounded-lg">
                    <p class="text-mineral-500 text-sm">光性符号</p>
                    <p class="text-2xl font-bold text-purple-400">
                      {opticSignLabel[section.optics.opticSign || 'unknown']}
                    </p>
                  </div>
                  {section.optics.refractiveIndexMin && section.optics.refractiveIndexMax && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg col-span-2">
                      <p class="text-mineral-500 text-sm">折射率范围</p>
                      <p class="text-2xl font-bold text-mineral-100 font-mono">
                        {section.optics.refractiveIndexMin} - {section.optics.refractiveIndexMax}
                      </p>
                    </div>
                  )}
                  {section.optics.birefringence && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg">
                      <p class="text-mineral-500 text-sm">双折射率</p>
                      <p class="text-2xl font-bold text-orange-400 font-mono">
                        {section.optics.birefringence}
                      </p>
                    </div>
                  )}
                  {section.optics.opticAxisAngle && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg">
                      <p class="text-mineral-500 text-sm">光轴角 2V</p>
                      <p class="text-2xl font-bold text-mineral-100">
                        {section.optics.opticAxisAngle}°
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="text-md font-semibold text-mineral-200 mb-4">消光与多色性</h3>
                <div class="grid grid-cols-2 gap-4">
                  {section.optics.extinctionType && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg">
                      <p class="text-mineral-500 text-sm">消光类型</p>
                      <p class="text-xl font-bold text-green-400">
                        {extinctionTypeLabel[section.optics.extinctionType]}
                      </p>
                    </div>
                  )}
                  {section.optics.extinctionAngle !== undefined && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg">
                      <p class="text-mineral-500 text-sm">消光角</p>
                      <p class="text-xl font-bold text-mineral-100">
                        {section.optics.extinctionAngle}°
                      </p>
                    </div>
                  )}
                  {section.optics.pleochroism && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg col-span-2">
                      <p class="text-mineral-500 text-sm">多色性</p>
                      <p class="text-lg font-bold text-purple-400">{section.optics.pleochroism}</p>
                      {section.optics.pleochroismColors && (
                        <p class="text-mineral-400 text-sm mt-1">
                          多色性公式: {section.optics.pleochroismColors}
                        </p>
                      )}
                      {section.optics.absorptionFormula && (
                        <p class="text-mineral-400 text-sm mt-1">
                          吸收公式: {section.optics.absorptionFormula}
                        </p>
                      )}
                    </div>
                  )}
                  {section.optics.twinningType && (
                    <div class="p-4 bg-mineral-800/50 rounded-lg col-span-2">
                      <p class="text-mineral-500 text-sm">双晶</p>
                      <p class="text-lg font-bold text-blue-400">
                        {twinningTypeLabel[section.optics.twinningType]}
                      </p>
                      {section.optics.twinningDescription && (
                        <p class="text-mineral-400 text-sm mt-1">{section.optics.twinningDescription}</p>
                      )}
                    </div>
                  )}
                  <div class="p-4 bg-mineral-800/50 rounded-lg">
                    <p class="text-mineral-500 text-sm">环带结构</p>
                    <p class="text-xl font-bold text-mineral-100">
                      {section.optics.zoning ? '有' : '无'}
                    </p>
                  </div>
                </div>
              </div>

              {section.optics.inclusionsDescription && (
                <div class="col-span-2 p-4 bg-mineral-800/50 rounded-lg">
                  <p class="text-mineral-500 text-sm mb-2">包体特征</p>
                  <p class="text-mineral-200">{section.optics.inclusionsDescription}</p>
                </div>
              )}
            </div>
          )}

          {activeTab.value === 'optics' && !isEditing.value && !section.optics && (
            <div class="text-center py-12 text-mineral-500">
              <span class="text-4xl block mb-2">🔬</span>
              <p>暂无光学性质数据</p>
            </div>
          )}

          {activeTab.value === 'interference' && (
            <div class="space-y-6">
              <InterferenceChart 
                interferenceColors={section.interferenceColors}
                sectionThickness={section.thicknessMicrometers}
              />
              
              {section.interferenceColors.length > 0 ? (
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr class="border-b border-mineral-700">
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">颗粒编号</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">级序</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">颜色</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">色样</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">估算双折率</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">厚度</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">颗粒方位</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">异常</th>
                        <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">备注</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-mineral-700/50">
                      {section.interferenceColors.map(ic => (
                        <tr key={ic.id} class="hover:bg-mineral-800/30">
                          <td class="px-4 py-3 font-mono text-sm text-mineral-200">
                            {ic.mineralGrainId || '-'}
                          </td>
                          <td class="px-4 py-3">
                            <span class="px-2 py-0.5 bg-polar-purple/30 text-purple-300 rounded text-sm">
                              {ic.order}级
                            </span>
                          </td>
                          <td class="px-4 py-3 text-mineral-200">{ic.colorName}</td>
                          <td class="px-4 py-3">
                            <div 
                              class="w-8 h-8 rounded border border-mineral-600"
                              style={{ backgroundColor: ic.colorHex }}
                              title={ic.colorHex}
                            ></div>
                          </td>
                          <td class="px-4 py-3 font-mono text-sm text-orange-400">
                            {ic.estimatedBirefringence}
                          </td>
                          <td class="px-4 py-3 font-mono text-sm text-mineral-200">
                            {ic.thicknessMicrometers}μm
                          </td>
                          <td class="px-4 py-3 text-sm text-mineral-300">
                            {orientationLabel[ic.grainOrientation] || ic.grainOrientation}
                          </td>
                          <td class="px-4 py-3">
                            {ic.isAnomalous ? (
                              <span class="px-2 py-0.5 bg-red-900/50 text-red-300 rounded text-xs">
                                异常
                                {ic.anomalousDescription && `: ${ic.anomalousDescription}`}
                              </span>
                            ) : (
                              <span class="text-mineral-500 text-sm">-</span>
                            )}
                          </td>
                          <td class="px-4 py-3 text-sm text-mineral-400">
                            {ic.notes || (ic.accessoryPlateUsed ? `补色器: ${ic.accessoryPlateUsed}` : '-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div class="text-center py-12 text-mineral-500">
                  <span class="text-4xl block mb-2">🌈</span>
                  <p>暂无干涉色记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab.value === 'cleavage' && (
            <div>
              {section.cleavages.length > 0 ? (
                <div class="grid grid-cols-2 gap-4">
                  {section.cleavages.map(c => (
                    <div key={c.id} class="p-4 bg-mineral-800/30 rounded-lg border border-mineral-700">
                      <div class="flex items-center justify-between mb-3">
                        <span class="font-medium text-mineral-100">
                          {c.mineralGrainId ? `颗粒 ${c.mineralGrainId}` : '解理记录'}
                        </span>
                        <span class="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-sm">
                          {cleavageQualityLabel[c.quality] || c.quality}
                        </span>
                      </div>
                      <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p class="text-mineral-500">解理方向</p>
                          <p class="text-mineral-200">{c.numberOfDirections} 组</p>
                        </div>
                        {c.angleBetweenDirections !== undefined && (
                          <div>
                            <p class="text-mineral-500">夹角</p>
                            <p class="text-mineral-200">{c.angleBetweenDirections}°</p>
                          </div>
                        )}
                        {c.cleavageTrace && (
                          <div class="col-span-2">
                            <p class="text-mineral-500">解理纹</p>
                            <p class="text-mineral-200">{c.cleavageTrace}</p>
                          </div>
                        )}
                        {c.partingDescription && (
                          <div class="col-span-2">
                            <p class="text-mineral-500">裂理</p>
                            <p class="text-mineral-200">{c.partingDescription}</p>
                          </div>
                        )}
                        {c.fractureType && (
                          <div>
                            <p class="text-mineral-500">断口</p>
                            <p class="text-mineral-200">{c.fractureType}</p>
                          </div>
                        )}
                        {c.notes && (
                          <div class="col-span-2">
                            <p class="text-mineral-500">备注</p>
                            <p class="text-mineral-300">{c.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="text-center py-12 text-mineral-500">
                  <span class="text-4xl block mb-2">📐</span>
                  <p>暂无解理特征记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab.value === 'association' && (
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <h3 class="text-md font-semibold text-mineral-200">伴生矿物及含量</h3>
                <div class="flex items-center gap-2">
                  {isEditing.value && (
                    <button
                      type="button"
                      onClick$={addAssociation}
                      class="btn-secondary text-sm"
                    >
                      ➕ 添加伴生矿物
                    </button>
                  )}
                  <span class="text-mineral-500 text-sm">总含量:</span>
                  <span class={`font-bold text-lg ${totalAbundance.value > 100 ? 'text-red-400' : 'text-green-400'}`}>
                    {totalAbundance.value}%
                  </span>
                  {totalAbundance.value > 100 && (
                    <span class="text-red-400 text-xs">⚠️ 含量总和超过100%</span>
                  )}
                </div>
              </div>
              
              <div class="h-4 bg-mineral-800 rounded-full overflow-hidden flex">
                {(isEditing.value ? editStore.associations : section.associations).map((a, i) => {
                  const colors = [
                    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 
                    'bg-yellow-500', 'bg-orange-500', 'bg-pink-500'
                  ];
                  return (
                    <div
                      key={i}
                      class={`${colors[i % colors.length]} transition-all`}
                      style={{ width: `${(a.abundancePercent / 100) * 100}%` }}
                      title={`${a.associatedMineral}: ${a.abundancePercent}%`}
                    ></div>
                  );
                })}
                {totalAbundance.value < 100 && (
                  <div 
                    class="bg-mineral-700"
                    style={{ width: `${100 - totalAbundance.value}%` }}
                    title={`其他: ${100 - totalAbundance.value}%`}
                  ></div>
                )}
              </div>

              {isEditing.value ? (
                <div class="space-y-4">
                  {editStore.associations.map((assoc, index) => (
                    <div key={index} class="p-4 bg-mineral-800/30 rounded-lg border border-mineral-700">
                      <div class="flex items-center justify-between mb-4">
                        <span class="font-medium text-mineral-200">伴生矿物 #{index + 1}</span>
                        {editStore.associations.length > 1 && (
                          <button
                            type="button"
                            onClick$={() => removeAssociation(index)}
                            class="text-red-400 hover:text-red-300 text-sm"
                          >
                            移除
                          </button>
                        )}
                      </div>

                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="label">矿物名称</label>
                          <input
                            type="text"
                            class="input-field"
                            placeholder="例如: 石英"
                            value={assoc.associatedMineral}
                            onInput$={(e) => assoc.associatedMineral = (e.target as HTMLInputElement).value}
                          />
                        </div>
                        <div>
                          <label class="label">含量 (%)</label>
                          <input
                            type="number"
                            class="input-field"
                            min="0"
                            max="100"
                            value={assoc.abundancePercent}
                            onInput$={(e) => { const v = (e.target as HTMLInputElement).value; assoc.abundancePercent = v === '' ? 0 : parseFloat(v); }}
                          />
                        </div>
                        <div>
                          <label class="label">关系类型</label>
                          <select
                            class="select-field"
                            value={assoc.relationshipType as any}
                            onChange$={(e) => assoc.relationshipType = (e.target as HTMLSelectElement).value as any}
                          >
                            <option value="共生">共生</option>
                            <option value="交生">交生</option>
                            <option value="包裹">包裹</option>
                            <option value="交代">交代</option>
                            <option value="充填">充填</option>
                          </select>
                        </div>
                        <div>
                          <label class="label">结构关系</label>
                          <input
                            type="text"
                            class="input-field"
                            placeholder="例如: 他形粒状"
                            value={assoc.texturalRelation}
                            onInput$={(e) => assoc.texturalRelation = (e.target as HTMLInputElement).value}
                          />
                        </div>
                        <div>
                          <label class="label">粒度 (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            class="input-field"
                            value={assoc.grainSizeMm}
                            onInput$={(e) => { const v = (e.target as HTMLInputElement).value; assoc.grainSizeMm = v === '' ? undefined as any : parseFloat(v); }}
                          />
                        </div>
                        <div>
                          <label class="label">世代</label>
                          <input
                            type="text"
                            class="input-field"
                            placeholder="例如: 第II世代"
                            value={assoc.parageneticStage}
                            onInput$={(e) => assoc.parageneticStage = (e.target as HTMLInputElement).value}
                          />
                        </div>
                      </div>

                      <div class="mt-4">
                        <label class="label">备注</label>
                        <input
                          type="text"
                          class="input-field"
                          placeholder="其他描述信息"
                          value={assoc.notes}
                          onInput$={(e) => assoc.notes = (e.target as HTMLInputElement).value}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                section.associations.length > 0 ? (
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b border-mineral-700">
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">伴生矿物</th>
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">含量</th>
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">关系类型</th>
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">结构关系</th>
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">粒度</th>
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">世代</th>
                          <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400">备注</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-mineral-700/50">
                        {section.associations.map(a => (
                          <tr key={a.id} class="hover:bg-mineral-800/30">
                            <td class="px-4 py-3 font-medium text-mineral-100">
                              {a.associatedMineral}
                            </td>
                            <td class="px-4 py-3">
                              <div class="flex items-center gap-2">
                                <div class="w-20 h-2 bg-mineral-700 rounded-full overflow-hidden">
                                  <div 
                                    class="h-full bg-green-500"
                                    style={{ width: `${a.abundancePercent}%` }}
                                  ></div>
                                </div>
                                <span class="font-mono text-sm text-mineral-200">{a.abundancePercent}%</span>
                              </div>
                            </td>
                            <td class="px-4 py-3 text-sm text-mineral-300">{a.relationshipType}</td>
                            <td class="px-4 py-3 text-sm text-mineral-300">{a.texturalRelation}</td>
                            <td class="px-4 py-3 text-sm text-mineral-200 font-mono">
                              {a.grainSizeMm ? `${a.grainSizeMm} mm` : '-'}
                            </td>
                            <td class="px-4 py-3 text-sm text-mineral-300">
                              {a.parageneticStage || '-'}
                            </td>
                            <td class="px-4 py-3 text-sm text-mineral-400">{a.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div class="text-center py-12 text-mineral-500">
                    <span class="text-4xl block mb-2">🔗</span>
                    <p>暂无伴生关系记录</p>
                  </div>
                )
              )}
            </div>
          )}

          {activeTab.value === 'history' && (
            <div class="space-y-4">
              {section.versionHistory.length > 0 ? (
                <div class="relative">
                  <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-mineral-700"></div>
                  {section.versionHistory.map((v, i) => (
                    <div key={v.id} class="relative pl-12 pb-6">
                      <div class={`absolute left-2 w-5 h-5 rounded-full border-4 ${
                        v.changeType === 'create' ? 'bg-green-500 border-green-300' :
                        v.changeType === 'update' ? 'bg-blue-500 border-blue-300' :
                        'bg-yellow-500 border-yellow-300'
                      }`}></div>
                      <div class="bg-mineral-800/50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex items-center gap-3">
                            <VersionBadge version={v.version} isLatest={i === 0} />
                            <span class={`px-2 py-0.5 rounded text-xs font-medium ${
                              v.changeType === 'create' ? 'bg-green-900/50 text-green-300' :
                              v.changeType === 'update' ? 'bg-blue-900/50 text-blue-300' :
                              'bg-yellow-900/50 text-yellow-300'
                            }`}>
                              {v.changeType === 'create' ? '创建' : v.changeType === 'update' ? '更新' : '回退'}
                            </span>
                            {v.batchId && (
                              <span class="text-xs text-mineral-500 font-mono">
                                批次: {v.batchId}
                              </span>
                            )}
                          </div>
                          <span class="text-xs text-mineral-500 font-mono">
                            {new Date(v.changedAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <p class="text-mineral-200">{v.changeDescription}</p>
                        {v.fieldName && (
                          <div class="mt-2 flex items-center gap-3 text-sm">
                            <span class="text-mineral-500">字段: <code class="bg-mineral-900 px-1.5 py-0.5 rounded">{v.fieldName}</code></span>
                            {v.oldValue !== undefined && v.oldValue !== null && (
                              <span class="text-red-400 line-through">{v.oldValue}</span>
                            )}
                            {v.oldValue !== undefined && v.oldValue !== null && v.newValue !== undefined && v.newValue !== null && (
                              <span class="text-mineral-500">→</span>
                            )}
                            {v.newValue !== undefined && v.newValue !== null && (
                              <span class="text-green-400">{v.newValue}</span>
                            )}
                          </div>
                        )}
                        {v.changedBy && (
                          <p class="mt-2 text-xs text-mineral-500">操作人: {v.changedBy}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="text-center py-12 text-mineral-500">
                  <span class="text-4xl block mb-2">📜</span>
                  <p>暂无版本历史记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab.value === 'anomalies' && (
            <div class="space-y-4">
              {section.anomalies.length > 0 ? (
                section.anomalies.map(a => (
                  <div key={a.id} class={`p-4 rounded-lg border ${
                    a.resolvedAt 
                      ? 'bg-green-900/20 border-green-800' 
                      : 'bg-red-900/20 border-red-800'
                  }`}>
                    <div class="flex items-start justify-between">
                      <div class="flex items-start gap-3">
                        <SeverityBadge severity={a.severity} />
                        <div>
                          <p class="font-medium text-mineral-100">{a.description}</p>
                          <div class="mt-2 flex flex-wrap gap-3 text-sm">
                            <span class="text-mineral-500">
                              异常类型: <code class="bg-mineral-900 px-1.5 py-0.5 rounded text-mineral-300">{a.anomalyType}</code>
                            </span>
                            {a.fieldName && (
                              <span class="text-mineral-500">
                                字段: <code class="bg-mineral-900 px-1.5 py-0.5 rounded text-mineral-300">{a.fieldName}</code>
                              </span>
                            )}
                            {a.currentValue !== undefined && a.currentValue !== null && (
                              <span class="text-orange-400">
                                当前值: {a.currentValue}
                              </span>
                            )}
                            {a.expectedRange && (
                              <span class="text-mineral-400">
                                预期范围: {a.expectedRange}
                              </span>
                            )}
                          </div>
                          <p class="mt-2 text-xs text-mineral-500">
                            检测时间: {new Date(a.detectedAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      {a.resolvedAt ? (
                        <div class="text-right">
                          <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-900/50 text-green-300 rounded text-xs">
                            ✓ 已解决
                          </span>
                          <p class="mt-1 text-xs text-mineral-500">
                            {new Date(a.resolvedAt).toLocaleString('zh-CN')}
                          </p>
                          {a.resolverNote && (
                            <p class="mt-1 text-sm text-green-300">{a.resolverNote}</p>
                          )}
                        </div>
                      ) : (
                        <button class="px-3 py-1.5 bg-mineral-700 hover:bg-mineral-600 text-mineral-200 rounded text-sm transition-colors">
                          标记已解决
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div class="text-center py-12 text-mineral-500">
                  <span class="text-4xl block mb-2">✅</span>
                  <p>数据质量良好，未检测到异常</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
