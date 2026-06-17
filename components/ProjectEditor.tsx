'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ProjectStatus } from '@/lib/types';

type Props = {
  mode: 'create' | 'edit';
  project?: {
    id: string;
    name: string;
    code: string;
    description: string;
    status: ProjectStatus;
    tags: string[];
    primaryKiln?: string;
    targetCone?: string;
  };
};

export function ProjectEditor({ mode, project }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(project?.name ?? '');
  const [code, setCode] = useState(project?.code ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'active');
  const [tagsInput, setTagsInput] = useState(project?.tags?.join(', ') ?? '');
  const [primaryKiln, setPrimaryKiln] = useState(project?.primaryKiln ?? '');
  const [targetCone, setTargetCone] = useState(project?.targetCone ?? '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name || !code) {
      setError('项目名称和编号为必填项');
      return;
    }
    setPending(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        name,
        code: code.toUpperCase(),
        description,
        status,
        tags,
        primaryKiln: primaryKiln || undefined,
        targetCone: targetCone || undefined,
      };

      if (mode === 'create') {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        router.refresh();
        router.push(`/projects/${data.project.id}`);
        return;
      }

      // edit
      const res = await fetch(`/api/projects/${project!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
      router.push(`/projects/${project!.id}`);
    } catch (err: any) {
      setError(err?.message ?? '保存失败');
    } finally {
      setPending(false);
    }
  }

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
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例：青瓷釉料系统研发"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              项目编号 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="例：CEL-2025"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              项目状态
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="active">进行中</option>
              <option value="on-hold">暂停</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              目标锥号
            </label>
            <input
              type="text"
              value={targetCone}
              onChange={e => setTargetCone(e.target.value)}
              placeholder="例：Δ6 / Δ10"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              主要窑炉
            </label>
            <input
              type="text"
              value={primaryKiln}
              onChange={e => setPrimaryKiln(e.target.value)}
              placeholder="例：1 号气窑 / 实验电窑"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              标签（逗号分隔）
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="例：青瓷, 还原焰, 研究"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              项目描述
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="描述项目目标、研究范围、里程碑等"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
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
          disabled={pending}
          className="px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending ? '保存中...' : mode === 'create' ? '创建项目' : '保存修改'}
        </button>
      </div>
    </form>
  );
}
