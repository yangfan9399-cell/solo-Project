'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type LedgerItem = {
  id: number; work_no: string; work_name: string; silversmith: string;
  material: string; material_weight: number; start_date: string;
  version: number; status: string; notes: string | null;
  annealing_count: number; total_duration: number; progress_avg: number;
  acceptance: string | null;
};

function statusTag(s: string) {
  if (s === '已完成') return <span className="tag tag-green">✓ {s}</span>;
  if (s === '进行中') return <span className="tag tag-blue">◷ {s}</span>;
  if (s === '异常处理中') return <span className="tag tag-red">⚠ {s}</span>;
  if (s === '暂停') return <span className="tag tag-gray">⏸ {s}</span>;
  return <span className="tag tag-gray">{s}</span>;
}

function acceptanceTag(a: string | null) {
  if (!a) return <span className="text-muted">未验收</span>;
  if (a === '合格') return <span className="tag tag-green">{a}</span>;
  if (a === '待复检') return <span className="tag tag-amber">{a}</span>;
  if (a === '不合格') return <span className="tag tag-red">{a}</span>;
  return <span className="tag tag-blue">{a}</span>;
}

function pctClass(p: number) {
  if (p >= 90) return '';
  if (p >= 60) return 'warn';
  return 'err';
}

function fmtHours(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

export default function HomePage() {
  const [list, setList] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('全部');

  useEffect(() => {
    fetch('/api/ledger').then((r) => r.json()).then((d) => {
      setList(d.list || []);
      setLoading(false);
    });
    // 高亮当前导航
    document.querySelectorAll('[data-nav]').forEach((el) => {
      const el2 = el as HTMLElement;
      el2.classList.toggle('active', el2.dataset.nav === 'home');
    });
  }, []);

  const filtered = list.filter((x) => {
    if (filter !== '全部' && x.status !== filter) return false;
    if (query && !(
      x.work_no.toLowerCase().includes(query.toLowerCase()) ||
      x.work_name.includes(query) ||
      x.silversmith.includes(query)
    )) return false;
    return true;
  });

  const stats = {
    total: list.length,
    done: list.filter((x) => x.status === '已完成').length,
    pending: list.filter((x) => x.status === '进行中').length,
    error: list.filter((x) => x.status === '异常处理中').length,
  };

  return (
    <div className="page-wrap">
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">作品批次总数</div>
          <div className="value">{stats.total}</div>
          <div className="delta text-muted">涵盖 {new Set(list.map((x) => x.silversmith)).size} 位银匠</div>
        </div>
        <div className="kpi good">
          <div className="label">已完成</div>
          <div className="value">{stats.done}</div>
          <div className="delta" style={{ color: '#047857' }}>合格率 {stats.total ? Math.round(stats.done / stats.total * 100) : 0}%</div>
        </div>
        <div className="kpi">
          <div className="label">进行中</div>
          <div className="value">{stats.pending}</div>
          <div className="delta text-muted">当前开工批次</div>
        </div>
        <div className="kpi danger">
          <div className="label">异常处理中</div>
          <div className="value">{stats.error}</div>
          <div className="delta" style={{ color: '#991b1b' }}>需关注照片批注和回滚</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card mt-24">
        <div className="flex-b" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>工序台账档案列表</div>
            <div className="text-xs text-muted">专属四表关联结构：主记录 · 退火明细 · 纹样进度 · 结果交付</div>
          </div>
          <div className="flex-c gap-8">
            <input
              type="text" placeholder="搜索作品编号 / 名称 / 银匠"
              style={{ width: 280 }} value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="btn-group">
              {['全部', '已完成', '进行中', '异常处理中'].map((f) => (
                <button
                  key={f}
                  className={'btn btn-sm ' + (filter === f ? 'btn-primary' : 'btn-outline')}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
            <Link href="/new" className="btn btn-primary btn-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              新建台账
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="empty"><div className="ic">⚙</div>加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="ic">📋</div>暂无符合条件的台账记录</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>作品编号 / 批次</th>
                  <th>作品名称 · 行业对象</th>
                  <th>银匠</th>
                  <th>材料与重量</th>
                  <th>版本 / 状态</th>
                  <th>工序进度</th>
                  <th>退火次数 / 耗时</th>
                  <th>验收</th>
                  <th style={{ width: 170 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <div style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: 12, fontWeight: 500, color: '#2a2a35' }}>
                        {x.work_no}
                      </div>
                      <div className="text-xs text-muted" style={{ marginTop: 2 }}>开工 {x.start_date}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#2a2a35' }}>{x.work_name}</div>
                      {x.notes && <div className="text-xs text-muted" style={{ marginTop: 2, maxWidth: 320, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📝 {x.notes}</div>}
                    </td>
                    <td>
                      <span className="pill">🔨 {x.silversmith}</span>
                    </td>
                    <td>
                      <div>{x.material}</div>
                      <div className="text-xs text-muted" style={{ marginTop: 2 }}>{x.material_weight}g 下料</div>
                    </td>
                    <td>
                      <div className="flex-c gap-4" style={{ marginBottom: 4 }}>
                        <span className="tag tag-purple">v{x.version}</span>
                        {statusTag(x.status)}
                      </div>
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <div className="flex-b" style={{ marginBottom: 4 }}>
                        <span className="text-xs">进度</span>
                        <span className="text-xs" style={{ fontWeight: 500 }}>{x.progress_avg}%</span>
                      </div>
                      <div className={'pbar ' + pctClass(x.progress_avg)}>
                        <div style={{ width: `${x.progress_avg}%` }} />
                      </div>
                    </td>
                    <td>
                      <div className="flex-c gap-8">
                        <span className="pill">🔥 {x.annealing_count}次</span>
                        <span className="text-xs text-muted">⏱ {fmtHours(x.total_duration)}</span>
                      </div>
                    </td>
                    <td>{acceptanceTag(x.acceptance)}</td>
                    <td>
                      <div className="btn-group">
                        <Link href={`/ledger/${x.id}`} className="btn btn-sm btn-outline">详情</Link>
                        <Link href={`/ledger/${x.id}?tab=delivery-diff`} className="btn btn-sm btn-outline">差异</Link>
                        <Link href={`/ledger/${x.id}?tab=export`} className="btn btn-sm btn-outline">导出</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-24 muted-block">
        <strong>专属数据结构说明</strong>：每条台账记录围绕手工银饰錾刻行业对象展开。<strong>主记录</strong>保存银匠/錾子信息；<strong>明细记录</strong>（退火次数）记录每次退火温度、时长、冷却方式与硬度变化；<strong>历史记录</strong>（纹样进度）以起稿→贴样→初錾→精錾→修光的工序顺序保存每道进度；<strong>结果记录</strong>集中保存表面缺陷与最终交付要求。验收时可通过「差异」查看交付单前后版本变化、变更日志及照片批注对最终页面的影响。
      </div>
    </div>
  );
}
