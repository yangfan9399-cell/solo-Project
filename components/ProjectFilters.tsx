'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import type { ProjectStatus, AnomalyLevel } from '@/lib/types';

type SPOpt<T> = Array<{ v: T | 'all'; l: string }>;

interface Props {
  statusOptions: SPOpt<ProjectStatus>;
  anomalyOptions: SPOpt<AnomalyLevel>;
  origins: string[];
  current: {
    status?: string;
    anomaly?: string;
    origin?: string;
    keyword?: string;
    sort?: string;
    order?: string;
  };
}

export default function ProjectFilters({ statusOptions, anomalyOptions, origins, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const apply = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    }
    next.delete('page');
    startTransition(() => {
      router.push(`${pathname}${next.toString() ? `?${next.toString()}` : ''}`);
    });
  };

  return (
    <div className={`paper-card p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 ${isPending ? 'opacity-70' : ''} transition`}>
      <div className="lg:col-span-2">
        <label className="text-xs text-stone-500 mb-1 block">检索</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const kw = fd.get('keyword') as string;
            apply({ keyword: kw.trim() || undefined });
          }}
          className="relative"
        >
          <input
            name="keyword"
            defaultValue={current.keyword || ''}
            placeholder="输入作品名 / 编号 / 画师 / 描述关键词…"
            className="input-field pr-16"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {current.keyword && (
              <button
                type="button"
                onClick={() => apply({ keyword: undefined })}
                className="px-2 py-1 text-xs text-stone-500 hover:text-ink rounded hover:bg-stone-100"
              >清空</button>
            )}
            <button type="submit" className="btn-primary !py-1 !px-3 text-xs">搜索</button>
          </div>
        </form>
      </div>
      <div>
        <label className="text-xs text-stone-500 mb-1 block">项目状态</label>
        <select
          value={current.status || 'all'}
          onChange={(e) => apply({ status: e.target.value })}
          className="input-field"
        >
          {statusOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-stone-500 mb-1 block">异常等级</label>
        <select
          value={current.anomaly || 'all'}
          onChange={(e) => apply({ anomaly: e.target.value })}
          className="input-field"
        >
          {anomalyOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-stone-500 mb-1 block">产地</label>
        <select
          value={current.origin || 'all'}
          onChange={(e) => apply({ origin: e.target.value })}
          className="input-field"
        >
          <option value="all">全部产地</option>
          {origins.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}
