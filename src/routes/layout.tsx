import { component$, Slot } from '@builder.io/qwik';
import { Link, routeLoader$ } from '@builder.io/qwik-city';
import { seedIfEmpty } from '~/lib/seed';
import { listMainRecords } from '~/lib/db';

export const useEnsureSeed = routeLoader$(async () => {
  seedIfEmpty();
  return { seeded: true };
});

export const useBatchStats = routeLoader$(async () => {
  seedIfEmpty();
  const all = listMainRecords({ includeArchived: true });
  const active = listMainRecords({ includeArchived: false });
  const failed = all.filter(b => b.status === 'failed').length;
  const archived = all.filter(b => b.isArchived).length;
  return {
    total: all.length,
    active: active.length,
    completed: active.filter(b => b.status === 'completed').length,
    processing: active.filter(b => b.status === 'processing' || b.status === 'draft').length,
    failed,
    archived,
  };
});

export default component$(() => {
  const stats = useBatchStats();
  return (
    <div>
      <header class="app-header">
        <div class="container">
          <h1>
            <span style={{ display: 'inline-block', width: 28, height: 28, background: 'white', borderRadius: 4, opacity: 0.95 }}></span>
            晒蓝图纸显影批次记录工具
          </h1>
          <div class="subtitle">
            Cyanotype Processing Batch Recorder · 药液配比 / 曝光明细 / 冲洗历史 / 结果评估
          </div>
          <nav class="nav-tabs">
            <Link href="/" class="nav-tab">🏠 批次总览</Link>
            <Link href="/create" class="nav-tab">＋ 新建批次</Link>
            <Link href="/compare" class="nav-tab">⇄ 参数对比</Link>
            <Link href="/archive" class="nav-tab">📦 归档库</Link>
          </nav>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, opacity: 0.9 }}>
            <span>📊 总批次 <b>{stats.value.total}</b></span>
            <span>📋 活跃 <b>{stats.value.active}</b></span>
            <span>✅ 完成 <b>{stats.value.completed}</b></span>
            <span>⚙ 进行中 <b>{stats.value.processing}</b></span>
            <span style={{ color: '#ffd4d4' }}>⚠ 失败 <b>{stats.value.failed}</b></span>
            <span>📦 归档 <b>{stats.value.archived}</b></span>
          </div>
        </div>
      </header>
      <main class="page-content container">
        <Slot />
      </main>
      <footer style={{ textAlign: 'center', padding: '20px 0 40px', color: 'var(--ink-muted)', fontSize: 12 }}>
        晒蓝工艺(Cyanotype) — 专业批次记录与参数优化系统
      </footer>
    </div>
  );
});
