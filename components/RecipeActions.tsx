'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LockToggleButton({
  recipeId,
  versionId,
  isLocked,
}: {
  recipeId: string;
  versionId: string;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/versions/${versionId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLocked ? 'unlock' : 'lock' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || '操作失败');
    } finally {
      setIsPending(false);
    }
  }

  if (isLocked) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <button
          onClick={handleClick}
          disabled={isPending}
          className="px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm disabled:opacity-60"
        >
          {isPending ? '处理中...' : '🔓 解锁版本'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-60"
      >
        {isPending ? '处理中...' : '🔒 锁定版本'}
      </button>
    </div>
  );
}

export function NewVersionButton({ recipeId, currentVersionId }: { recipeId: string; currentVersionId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsPending(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceVersionId: currentVersionId,
          changeNotes: '通过工作台快捷创建的新版本',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      router.refresh();
      if (data?.version?.id) {
        router.push(`/recipes/${recipeId}/versions/${data.version.id}`);
      }
    } catch (e: any) {
      setError(e?.message || '创建失败');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-60"
      >
        {isPending ? '创建中...' : '新版本'}
      </button>
    </div>
  );
}

export function AddSpecimenButton({ recipeId, versionId }: { recipeId: string; versionId: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setIsPending(true);
    try {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      const qualities = ['excellent', 'good', 'fair', 'poor'] as const;
      const glosses = ['high', 'medium', 'low', 'matte'] as const;
      const now = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/recipes/${recipeId}/versions/${versionId}/specimens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: `试片-${Math.floor(Math.random() * 900 + 100)}`,
          firedColor: randomColor,
          surfaceQuality: qualities[Math.floor(Math.random() * qualities.length)],
          glossLevel: glosses[Math.floor(Math.random() * glosses.length)],
          defects: Math.random() > 0.5 ? [] : ['针孔'],
          firingDate: now,
          notes: '通过工作台快捷添加的示例试片',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message || '添加失败');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="text-sm text-amber-600 hover:text-amber-700 disabled:opacity-60"
      >
        {isPending ? '添加中...' : '+ 添加试片'}
      </button>
    </div>
  );
}
