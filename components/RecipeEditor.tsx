'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RecipeComponent, FiringType, RecipeStatus } from '@/lib/types';

type Ingredient = { id: string; name: string; category: string };

type Props = {
  mode: 'create' | 'edit';
  projects: Array<{ id: string; name: string; code: string }>;
  ingredients: Ingredient[];
  recipe?: {
    id: string;
    name: string;
    code: string;
    projectId: string;
    description: string;
    coneTarget: string;
    tags: string[];
    status: RecipeStatus;
    matrixType: 'single' | 'binary' | 'ternary';
    version?: {
      components: RecipeComponent[];
      firingTemperature: number;
      firingType: FiringType;
      holdTime: number;
    };
  };
  initialMatrixType?: 'single' | 'binary' | 'ternary';
  initialProjectId?: string;
};

export function RecipeEditor({
  mode,
  projects,
  ingredients,
  recipe,
  initialMatrixType = 'single',
  initialProjectId = '',
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(recipe?.name ?? '');
  const [code, setCode] = useState(recipe?.code ?? '');
  const [projectId, setProjectId] = useState(recipe?.projectId ?? initialProjectId ?? projects[0]?.id ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [coneTarget, setConeTarget] = useState(recipe?.coneTarget ?? 'Δ6');
  const [status, setStatus] = useState<RecipeStatus>(recipe?.status ?? 'active');
  const [matrixType, setMatrixType] = useState<'single' | 'binary' | 'ternary'>(recipe?.matrixType ?? initialMatrixType);
  const [tagsInput, setTagsInput] = useState(recipe?.tags?.join(', ') ?? '');

  const [components, setComponents] = useState<RecipeComponent[]>(
    recipe?.version?.components ?? [
      { ingredientId: 'ing_feldspar', ingredientName: 'Potash Feldspar (钾长石)', percentage: 40, locked: false },
      { ingredientId: 'ing_kaolin', ingredientName: 'Kaolin (高岭土)', percentage: 25, locked: false },
      { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 20, locked: false },
      { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 15, locked: false },
    ],
  );
  const [firingTemperature, setFiringTemperature] = useState(recipe?.version?.firingTemperature ?? 1230);
  const [firingType, setFiringType] = useState<FiringType>(recipe?.version?.firingType ?? 'oxidation');
  const [holdTime, setHoldTime] = useState(recipe?.version?.holdTime ?? 30);

  const totalPct = components.reduce((s, c) => s + c.percentage, 0);
  const pctDelta = totalPct - 100;

  function updateComponentPct(idx: number, value: string) {
    const n = parseFloat(value) || 0;
    setComponents(list => list.map((c, i) => i === idx ? { ...c, percentage: n } : c));
  }

  function toggleComponentLock(idx: number) {
    setComponents(list => list.map((c, i) => i === idx ? { ...c, locked: !c.locked } : c));
  }

  function removeComponent(idx: number) {
    setComponents(list => list.filter((_, i) => i !== idx));
  }

  function addComponent() {
    setComponents(list => [
      ...list,
      { ingredientId: ingredients[0]?.id ?? '', ingredientName: ingredients[0]?.name ?? '', percentage: 5, locked: false },
    ]);
  }

  function changeComponentIngredient(idx: number, ingId: string) {
    const ing = ingredients.find(i => i.id === ingId);
    setComponents(list => list.map((c, i) => i === idx
      ? { ...c, ingredientId: ingId, ingredientName: ing?.name ?? c.ingredientName }
      : c,
    ));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !code || !projectId) {
      setError('配方名称、编号、所属项目均为必填项');
      return;
    }
    setPending(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (mode === 'create') {
        const res = await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            code,
            projectId,
            description,
            coneTarget,
            tags,
            status,
            matrixType,
            initialComponents: components,
            initialFiringTemperature: firingTemperature,
            initialFiringType: firingType,
            initialHoldTime: holdTime,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        router.refresh();
        router.push(`/recipes/${data.recipe.id}`);
        return;
      }

      // 编辑模式：先更新配方元数据，然后创建新版本保存成分/烧成变化
      const res = await fetch(`/api/recipes/${recipe!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          projectId,
          description,
          coneTarget,
          tags,
          status,
          matrixType,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const vRes = await fetch(`/api/recipes/${recipe!.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeNotes: '编辑配方生成新版本',
          components,
          totalPercentage: totalPct,
          firingTemperature,
          firingType,
          holdTime,
        }),
      });
      if (!vRes.ok) throw new Error(`创建新版本失败: HTTP ${vRes.status}`);

      router.refresh();
      router.push(`/recipes/${recipe!.id}`);
    } catch (err: any) {
      setError(err?.message ?? '保存失败');
    } finally {
      setPending(false);
    }
  }

  const isDeltaOk = Math.abs(pctDelta) < 0.1;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-800 mb-4">基础信息</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              配方名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：青瓷基础釉 v3"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              配方编号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="例：CEL-003"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              所属项目 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              锥号目标
            </label>
            <input
              type="text"
              value={coneTarget}
              onChange={e => setConeTarget(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              配方类型
            </label>
            <select
              value={matrixType}
              onChange={e => setMatrixType(e.target.value as any)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="single">单一配方</option>
              <option value="binary">二元矩阵</option>
              <option value="ternary">三元矩阵</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              状态
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="active">在研</option>
              <option value="experimental">实验性</option>
              <option value="archived">已归档</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              标签（逗号分隔）
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="例：青瓷, 哑光, 高钾"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              描述
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="描述配方特点、用途、参考来源等"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">成分列表</h3>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDeltaOk ? 'text-emerald-600' : 'text-red-600'}`}>
              合计 {totalPct.toFixed(2)}%
              {!isDeltaOk && ` (偏差 ${pctDelta >= 0 ? '+' : ''}${pctDelta.toFixed(2)}%)`}
            </span>
            <button
              type="button"
              onClick={addComponent}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              + 添加原料
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-stone-500 text-xs uppercase">
                <th className="text-left font-medium px-3 py-2 w-[40%]">原料</th>
                <th className="text-right font-medium px-3 py-2 w-[20%]">占比(%)</th>
                <th className="text-center font-medium px-3 py-2 w-[15%]">锁定</th>
                <th className="text-right font-medium px-3 py-2 w-[10%]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {components.map((c, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2">
                    <select
                      value={c.ingredientId}
                      onChange={e => changeComponentIngredient(idx, e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                    >
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={c.percentage}
                      onChange={e => updateComponentPct(idx, e.target.value)}
                      className="w-24 px-2 py-1.5 text-right border border-stone-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => toggleComponentLock(idx)}
                      className={`text-lg ${c.locked ? 'opacity-100' : 'opacity-30'}`}
                      title={c.locked ? '已锁定（矩阵计算时保持不变）' : '点击锁定'}
                    >
                      {c.locked ? '🔒' : '🔓'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeComponent(idx)}
                      disabled={components.length <= 1}
                      className="text-stone-400 hover:text-red-500 disabled:opacity-30"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
        <h3 className="font-semibold text-stone-800 mb-4">烧成参数</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              最高温度 (°C)
            </label>
            <input
              type="number"
              min="800"
              max="1400"
              value={firingTemperature}
              onChange={e => setFiringTemperature(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              烧成气氛
            </label>
            <select
              value={firingType}
              onChange={e => setFiringType(e.target.value as any)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="oxidation">氧化焰</option>
              <option value="reduction">还原焰</option>
              <option value="soda">苏打烧</option>
              <option value="wood">柴烧</option>
              <option value="salt">盐烧</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              保温时间 (分钟)
            </label>
            <input
              type="number"
              min="0"
              max="180"
              value={holdTime}
              onChange={e => setHoldTime(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 text-sm"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={pending || !isDeltaOk}
          className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? '保存中...' : mode === 'create' ? '创建配方' : '保存修改（生成新版本）'}
        </button>
      </div>
    </form>
  );
}
