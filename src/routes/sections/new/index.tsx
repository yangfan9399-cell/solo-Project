import { component$, useSignal, $, useStore } from '@builder.io/qwik';
import { routeLoader$, useNavigate, Link } from '@builder.io/qwik-city';
import { sampleBoxDao, sectionDao } from '~/server/dao';
import { useCreateSection } from '~/routes/api/sections/index';
import { ModeBadge } from '~/components/badges';

export const useNewSectionForm = routeLoader$(async () => {
  const boxes = await sampleBoxDao.list();
  const minerals = await sectionDao.getDistinctMinerals();
  const localities = await sectionDao.getDistinctLocalities();
  const crystalSystems = await sectionDao.getDistinctCrystalSystems();

  return {
    boxes,
    minerals,
    localities,
    crystalSystems,
    defaultThickness: 30,
  };
});

export default component$(() => {
  const data = useNewSectionForm();
  const nav = useNavigate();
  const action = useCreateSection();
  
  const currentStep = useSignal(1);
  const totalSteps = 4;

  const formData = useStore({
    sampleNumber: '',
    mineralName: '',
    mineralFormula: '',
    crystalSystem: '',
    locality: '',
    collectionDate: new Date().toISOString().split('T')[0],
    collector: '',
    thinSectionNumber: '',
    thicknessMicrometers: 30,
    coverSlip: true,
    mountingMedium: '环氧树脂',
    grainSizeMm: 0.5,
    rockType: '',
    alterationDegree: 0,
    sampleBoxId: '',
    boxPosition: '',
    notes: '',
  });

  const photos = useStore([
    { mode: 'ppl' as const, magnification: 40, hasPhoto: false },
    { mode: 'xpl' as const, magnification: 40, hasPhoto: false },
    { mode: 'xpl' as const, magnification: 100, hasPhoto: false },
    { mode: 'cnl' as const, magnification: 40, hasPhoto: false },
  ]);

  const optics = useStore({
    relief: 0,
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
    zoning: 0,
    inclusionsDescription: '',
  });

  const associations = useStore([{
    associatedMineral: '',
    relationshipType: '共生',
    texturalRelation: '',
    abundancePercent: 5,
    grainSizeMm: 0.3,
    parageneticStage: '',
    notes: '',
  }]);

  const nextStep = $(() => {
    if (currentStep.value < totalSteps) {
      currentStep.value++;
    }
  });

  const prevStep = $(() => {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  });

  const addAssociation = $(() => {
    associations.push({
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
    associations.splice(index, 1);
  });

  const handleSubmit = $(async () => {
    const submitData = {
      ...formData,
      sampleBoxId: formData.sampleBoxId ? parseInt(formData.sampleBoxId as string) : undefined,
      photos,
      optics,
      associations,
    };

    const result = await action.submit(submitData as any);
    
    if (result.value?.success) {
      nav(`/sections/${result.value.id}`);
    } else if (result.value?.error) {
      alert(`创建失败: ${result.value.error}`);
    }
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

  const stepTitles = [
    '基本信息',
    '显微照片',
    '光学性质',
    '伴生关系',
  ];

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-mineral-50">新建薄片记录</h1>
          <p class="text-mineral-400 mt-1">
            专业偏光显微镜观察记录录入向导
          </p>
        </div>
        <Link href="/sections" class="btn-secondary">
          ← 返回列表
        </Link>
      </div>

      <div class="card p-4">
        <div class="flex items-center justify-between mb-2">
          {stepTitles.map((title, i) => (
            <div key={i} class="flex items-center">
              <div class="flex flex-col items-center">
                <div class={[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  currentStep.value > i + 1 ? 'bg-green-600 text-white' :
                  currentStep.value === i + 1 ? 'bg-mineral-500 text-white' :
                  'bg-mineral-700 text-mineral-400'
                ]}>
                  {currentStep.value > i + 1 ? '✓' : i + 1}
                </div>
                <span class={`mt-2 text-xs ${
                  currentStep.value >= i + 1 ? 'text-mineral-200' : 'text-mineral-500'
                }`}>
                  {title}
                </span>
              </div>
              {i < stepTitles.length - 1 && (
                <div class={[
                  'w-24 h-1 mx-2 rounded',
                  currentStep.value > i + 1 ? 'bg-green-600' : 'bg-mineral-700'
                ]}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <form preventdefault:submit onSubmit$={handleSubmit}>
        {currentStep.value === 1 && (
          <div class="card p-6 space-y-6">
            <h2 class="text-lg font-semibold text-mineral-100 border-b border-mineral-700 pb-3">
              薄片基本信息
            </h2>
            
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="label">样品编号 <span class="text-red-400">*</span></label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: YN-2024-001"
                    value={formData.sampleNumber} onInput$={(e) => formData.sampleNumber = (e.target as HTMLInputElement).value}
                    required
                  />
                </div>
                <div>
                  <label class="label">薄片编号 <span class="text-red-400">*</span></label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: TS-0001"
                    value={formData.thinSectionNumber} onInput$={(e) => formData.thinSectionNumber = (e.target as HTMLInputElement).value}
                    required
                  />
                </div>
                <div>
                  <label class="label">矿物名称 <span class="text-red-400">*</span></label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: 锂辉石"
                    value={formData.mineralName} onInput$={(e) => formData.mineralName = (e.target as HTMLInputElement).value}
                    {...({ list: "minerals-list" } as any)}
                    required
                  />
                  <datalist id="minerals-list">
                    {data.value.minerals.map(m => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label class="label">矿物分子式</label>
                  <input
                    type="text"
                    class="input-field font-mono"
                    placeholder="例如: LiAlSi₂O₆"
                    value={formData.mineralFormula} onInput$={(e) => formData.mineralFormula = (e.target as HTMLInputElement).value}
                  />
                </div>
                <div>
                  <label class="label">晶系</label>
                  <select class="select-field" value={formData.crystalSystem as any} onChange$={(e) => formData.crystalSystem = (e.target as HTMLSelectElement).value as any}>
                    <option value="">请选择晶系</option>
                    {crystalSystemOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="label">产地</label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: 新疆可可托海"
                    value={formData.locality} onInput$={(e) => formData.locality = (e.target as HTMLInputElement).value}
                    {...({ list: "localities-list" } as any)}
                  />
                  <datalist id="localities-list">
                    {data.value.localities.map(l => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">采集日期</label>
                    <input
                      type="date"
                      class="input-field"
                      value={formData.collectionDate} onInput$={(e) => formData.collectionDate = (e.target as HTMLInputElement).value}
                    />
                  </div>
                  <div>
                    <label class="label">采集者</label>
                    <input
                      type="text"
                      class="input-field"
                      placeholder="采集人姓名"
                      value={formData.collector} onInput$={(e) => formData.collector = (e.target as HTMLInputElement).value}
                    />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">薄片厚度 (μm) <span class="text-red-400">*</span></label>
                    <input
                      type="number"
                      class="input-field"
                      min="10"
                      max="60"
                      value={formData.thicknessMicrometers} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; formData.thicknessMicrometers = v === '' ? undefined as any : parseFloat(v); }}
                      required
                    />
                  </div>
                  <div>
                    <label class="label">粒度 (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      class="input-field"
                      value={formData.grainSizeMm} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; formData.grainSizeMm = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                </div>
                <div>
                  <label class="label">岩石类型</label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: 花岗伟晶岩"
                    value={formData.rockType} onInput$={(e) => formData.rockType = (e.target as HTMLInputElement).value}
                  />
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">盖玻片</label>
                    <select class="select-field" value={formData.coverSlip as any} onChange$={(e) => formData.coverSlip = (e.target as HTMLSelectElement).value as any}>
                      <option value="true">有</option>
                      <option value="false">无</option>
                    </select>
                  </div>
                  <div>
                    <label class="label">封固剂</label>
                    <input
                      type="text"
                      class="input-field"
                      placeholder="例如: 环氧树脂"
                      value={formData.mountingMedium} onInput$={(e) => formData.mountingMedium = (e.target as HTMLInputElement).value}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6 pt-4 border-t border-mineral-700">
              <div>
                <label class="label">样本盒</label>
                <select class="select-field" value={formData.sampleBoxId as any} onChange$={(e) => formData.sampleBoxId = (e.target as HTMLSelectElement).value as any}>
                  <option value="">未分配</option>
                  {data.value.boxes.map(b => (
                    <option key={b.id} value={b.id}>{`${b.name} (${String(b.rows)}×${String(b.columns)})`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="label">盒内位置</label>
                <input
                  type="text"
                  class="input-field font-mono"
                  placeholder="例如: A1, B3"
                  value={formData.boxPosition} onInput$={(e) => formData.boxPosition = (e.target as HTMLInputElement).value}
                />
              </div>
            </div>

            <div class="pt-4 border-t border-mineral-700">
              <label class="label">备注</label>
              <textarea
                class="input-field min-h-[80px]"
                placeholder="记录样品的特殊处理、观察条件等信息..."
                value={formData.notes} onInput$={(e) => formData.notes = (e.target as HTMLTextAreaElement).value}
              />
            </div>
          </div>
        )}

        {currentStep.value === 2 && (
          <div class="card p-6 space-y-6">
            <h2 class="text-lg font-semibold text-mineral-100 border-b border-mineral-700 pb-3">
              显微照片记录
            </h2>
            
            <p class="text-mineral-400 text-sm">
              记录三种偏光模式下的显微照片。标准薄片应包含单偏光(PPL)、正交偏光(XPL)和锥光(CNL)照片。
            </p>

            <div class="grid grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  class={[
                    'p-4 rounded-lg border-2 transition-all',
                    photo.hasPhoto
                      ? 'border-mineral-500 bg-mineral-700/30'
                      : 'border-dashed border-mineral-700 bg-mineral-800/30'
                  ]}
                >
                  <div class="flex items-center justify-between mb-3">
                    <ModeBadge mode={photo.mode} />
                    <span class="text-mineral-300 text-sm">{photo.magnification}×</span>
                  </div>
                  
                  <div class="aspect-video rounded-lg bg-mineral-900 flex items-center justify-center mb-3">
                    {photo.hasPhoto ? (
                      <div class="text-center text-mineral-300">
                        <span class="text-3xl block mb-2">📷</span>
                        <span class="text-sm">已上传照片</span>
                      </div>
                    ) : (
                      <div class="text-center text-mineral-600">
                        <span class="text-3xl block mb-2">📤</span>
                        <span class="text-sm">点击上传照片</span>
                      </div>
                    )}
                  </div>

                  <div class="flex gap-2">
                    <button
                      type="button"
                      onClick$={() => photos[index].hasPhoto = !photos[index].hasPhoto}
                      class={[
                        'flex-1 py-2 rounded text-sm transition-colors',
                        photo.hasPhoto
                          ? 'bg-red-900/50 hover:bg-red-800/50 text-red-300'
                          : 'bg-mineral-700 hover:bg-mineral-600 text-mineral-200'
                      ]}
                    >
                      {photo.hasPhoto ? '移除' : '标记已拍摄'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div class="p-4 bg-mineral-800/30 rounded-lg">
              <h3 class="font-medium text-mineral-200 mb-2">💡 专业拍摄建议</h3>
              <ul class="text-sm text-mineral-400 space-y-1">
                <li>• 单偏光(PPL): 观察矿物形态、解理、颜色、多色性、突起</li>
                <li>• 正交偏光(XPL): 观察干涉色、消光类型、双晶、干涉图</li>
                <li>• 锥光(CNL): 观察干涉图，确定光性符号、轴性、光轴角</li>
                <li>• 建议每个视域拍摄同视野的PPL和XPL照片便于对比</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep.value === 3 && (
          <div class="card p-6 space-y-6">
            <h2 class="text-lg font-semibold text-mineral-100 border-b border-mineral-700 pb-3">
              光学性质
            </h2>

            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <h3 class="font-medium text-mineral-200">基本光学参数</h3>
                
                <div>
                  <label class="label">突起</label>
                  <input
                    type="number"
                    class="input-field"
                    step="0.5"
                    min="-2"
                    max="6"
                    placeholder="例如: +2"
                    value={optics.relief} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; optics.relief = v === '' ? undefined as any : parseFloat(v); }}
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
                      value={optics.refractiveIndexMin} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; optics.refractiveIndexMin = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                  <div>
                    <label class="label">最大折射率 Ng</label>
                    <input
                      type="number"
                      step="0.001"
                      class="input-field font-mono"
                      placeholder="例如: 1.670"
                      value={optics.refractiveIndexMax} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; optics.refractiveIndexMax = v === '' ? undefined as any : parseFloat(v); }}
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
                      value={optics.birefringence} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; optics.birefringence = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                  <div>
                    <label class="label">光轴角 2V</label>
                    <input
                      type="number"
                      class="input-field"
                      placeholder="例如: 75"
                      value={optics.opticAxisAngle} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; optics.opticAxisAngle = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                </div>

                <div>
                  <label class="label">光性符号</label>
                  <select class="select-field" value={optics.opticSign as any} onChange$={(e) => optics.opticSign = (e.target as HTMLSelectElement).value as any}>
                    {opticSignOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="font-medium text-mineral-200">消光与多色性</h3>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">消光类型</label>
                    <select class="select-field" value={optics.extinctionType as any} onChange$={(e) => optics.extinctionType = (e.target as HTMLSelectElement).value as any}>
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
                      value={optics.extinctionAngle} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; optics.extinctionAngle = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                </div>

                <div>
                  <label class="label">多色性</label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="例如: 弱-强"
                    value={optics.pleochroism} onInput$={(e) => optics.pleochroism = (e.target as HTMLInputElement).value}
                  />
                </div>

                <div>
                  <label class="label">多色性公式</label>
                  <input
                    type="text"
                    class="input-field font-mono"
                    placeholder="例如: Ng = 淡紫色, Nm = 淡紫色, Np = 近无色"
                    value={optics.pleochroismColors} onInput$={(e) => optics.pleochroismColors = (e.target as HTMLInputElement).value}
                  />
                </div>

                <div>
                  <label class="label">吸收公式</label>
                  <input
                    type="text"
                    class="input-field font-mono"
                    placeholder="例如: Ng > Nm > Np"
                    value={optics.absorptionFormula} onInput$={(e) => optics.absorptionFormula = (e.target as HTMLInputElement).value}
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="label">双晶类型</label>
                    <select class="select-field" value={optics.twinningType as any} onChange$={(e) => optics.twinningType = (e.target as HTMLSelectElement).value as any}>
                      {twinningTypeOptions.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label class="label">环带结构</label>
                    <select class="select-field" value={optics.zoning as any} onChange$={(e) => optics.zoning = (e.target as HTMLSelectElement).value as any}>
                      <option value={0}>无</option>
                      <option value={1}>有</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-mineral-700">
              <label class="label">双晶描述</label>
              <input
                type="text"
                class="input-field"
                placeholder="描述双晶的特征，如聚片双晶的结合面方向等"
                value={optics.twinningDescription} onInput$={(e) => optics.twinningDescription = (e.target as HTMLInputElement).value}
              />
            </div>

            <div>
              <label class="label">包体特征</label>
              <textarea
                class="input-field min-h-[80px]"
                placeholder="描述矿物中的包体类型、形态、分布特征等"
                value={optics.inclusionsDescription} onInput$={(e) => optics.inclusionsDescription = (e.target as HTMLTextAreaElement).value}
              />
            </div>
          </div>
        )}

        {currentStep.value === 4 && (
          <div class="card p-6 space-y-6">
            <div class="flex items-center justify-between border-b border-mineral-700 pb-3">
              <h2 class="text-lg font-semibold text-mineral-100">
                伴生矿物关系
              </h2>
              <button
                type="button"
                onClick$={addAssociation}
                class="btn-secondary text-sm"
              >
                ➕ 添加伴生矿物
              </button>
            </div>

            {associations.map((assoc, index) => (
              <div key={index} class="p-4 bg-mineral-800/30 rounded-lg border border-mineral-700">
                <div class="flex items-center justify-between mb-4">
                  <span class="font-medium text-mineral-200">伴生矿物 #{index + 1}</span>
                  {associations.length > 1 && (
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
                      value={assoc.associatedMineral} onInput$={(e) => assoc.associatedMineral = (e.target as HTMLInputElement).value}
                    />
                  </div>
                  <div>
                    <label class="label">含量 (%)</label>
                    <input
                      type="number"
                      class="input-field"
                      min="0"
                      max="100"
                      value={assoc.abundancePercent} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; assoc.abundancePercent = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                  <div>
                    <label class="label">关系类型</label>
                    <select class="select-field" value={assoc.relationshipType as any} onChange$={(e) => assoc.relationshipType = (e.target as HTMLSelectElement).value as any}>
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
                      value={assoc.texturalRelation} onInput$={(e) => assoc.texturalRelation = (e.target as HTMLInputElement).value}
                    />
                  </div>
                  <div>
                    <label class="label">粒度 (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      class="input-field"
                      value={assoc.grainSizeMm} onInput$={(e) => { const v = (e.target as HTMLInputElement).value; assoc.grainSizeMm = v === '' ? undefined as any : parseFloat(v); }}
                    />
                  </div>
                  <div>
                    <label class="label">世代</label>
                    <input
                      type="text"
                      class="input-field"
                      placeholder="例如: 第II世代"
                      value={assoc.parageneticStage} onInput$={(e) => assoc.parageneticStage = (e.target as HTMLInputElement).value}
                    />
                  </div>
                </div>

                <div class="mt-4">
                  <label class="label">备注</label>
                  <input
                    type="text"
                    class="input-field"
                    placeholder="其他描述信息"
                    value={assoc.notes} onInput$={(e) => assoc.notes = (e.target as HTMLInputElement).value}
                  />
                </div>
              </div>
            ))}

            <div class="p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <h3 class="font-medium text-blue-200 mb-2">📝 记录摘要预览</h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-mineral-500">矿物</p>
                  <p class="text-mineral-200">{formData.mineralName || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">产地</p>
                  <p class="text-mineral-200">{formData.locality || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">厚度</p>
                  <p class="text-mineral-200">{formData.thicknessMicrometers} μm</p>
                </div>
                <div>
                  <p class="text-mineral-500">双折射率</p>
                  <p class="text-mineral-200 font-mono">{optics.birefringence || '-'}</p>
                </div>
                <div>
                  <p class="text-mineral-500">光性符号</p>
                  <p class="text-mineral-200">
                    {optics.opticSign === 'positive' ? '正光性' : 
                     optics.opticSign === 'negative' ? '负光性' : '未知'}
                  </p>
                </div>
                <div>
                  <p class="text-mineral-500">伴生矿物</p>
                  <p class="text-mineral-200">
                    {associations.filter(a => a.associatedMineral).length} 种
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div class="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick$={prevStep}
            disabled={currentStep.value === 1}
            class={[
              'btn-secondary',
              currentStep.value === 1 && 'opacity-50 cursor-not-allowed'
            ]}
          >
            ← 上一步
          </button>

          {currentStep.value < totalSteps ? (
            <button
              type="button"
              onClick$={nextStep}
              class="btn-primary"
            >
              下一步 →
            </button>
          ) : (
            <button
              type="submit"
              class="btn-primary bg-green-700 hover:bg-green-600"
              disabled={action.isRunning}
            >
              {action.isRunning ? '创建中...' : '✓ 创建记录'}
            </button>
          )}
        </div>
      </form>

      {action.value?.error && (
        <div class="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-300">
          ⚠️ {action.value.error}
        </div>
      )}
    </div>
  );
});
