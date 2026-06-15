'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ToolInventory = {
  id: number; tool_code: string; tool_name: string;
  tool_type: string; spec: string | null; status: string;
  usage_count: number; last_maintenance: string | null;
  maintenance_cycle: number; manufacturer: string | null;
  version: string; notes: string | null;
};

function statusTag(s: string) {
  if (s === '在用') return <span className="tag tag-green">在用</span>;
  if (s === '待修') return <span className="tag tag-amber">待修</span>;
  if (s === '报废') return <span className="tag tag-red">报废</span>;
  if (s === '借出') return <span className="tag tag-blue">借出</span>;
  return <span className="tag tag-gray">{s}</span>;
}

function healthClass(usage: number, cycle: number) {
  const pct = (usage / cycle) * 100;
  if (pct >= 100) return 'err';
  if (pct >= 80) return 'warn';
  return '';
}

export default function ToolsPage() {
  const [list, setList] = useState<ToolInventory[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('全部');
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      const el2 = el as HTMLElement;
      el2.classList.toggle('active', el2.dataset.nav === 'tools');
    });
    fetch('/api/tools').then((r) => r.json()).then((d) => {
      setList(d.list || []);
      setSummary(d.summary);
      setLoading(false);
    });
  }, []);

  const filtered = list.filter((t) => {
    if (filter !== '全部' && t.status !== filter) return false;
    if (query && !(
      t.tool_code.toLowerCase().includes(query.toLowerCase()) ||
      t.tool_name.includes(query) ||
      t.tool_type.includes(query)
    )) return false;
    return true;
  });

  const toolTypes = Array.from(new Set(list.map((t) => t.tool_type)));

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="empty"><div className="ic">⚙</div>加载中…</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">工具总数</div>
          <div className="value">{summary?.total || 0}</div>
          <div className="delta text-muted">{toolTypes.length} 种类型</div>
        </div>
        <div className="kpi good">
          <div className="label">正常使用</div>
          <div className="value">{summary?.in_use || 0}</div>
          <div className="delta" style={{ color: '#047857' }}>占比 {summary?.total ? Math.round((summary.in_use / summary.total) * 100) : 0}%</div>
        </div>
        <div className="kpi warn">
          <div className="label">待维护</div>
          <div className="value">{summary?.maintenance_due || 0}</div>
          <div className="delta" style={{ color: '#92400e' }}>使用次数已达维护周期</div>
        </div>
        <div className="kpi danger">
          <div className="label">待修</div>
          <div className="value">{summary?.to_repair || 0}</div>
          <div className="delta" style={{ color: '#991b1b' }}>需要返修工具</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card mt-24">
        <div className="flex-b" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>錾子工具库</div>
            <div className="text-xs text-muted">工具版本管理 · 使用统计 · 维护周期 · 回滚追踪</div>
          </div>
          <div className="flex-c gap-8">
            <input
              type="text" placeholder="搜索工具编码 / 名称 / 类型"
              style={{ width: 280 }} value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="btn-group">
              {['全部', '在用', '待修', '报废', '借出'].map((f) => (
                <button
                  key={f}
                  className={'btn btn-sm ' + (filter === f ? 'btn-primary' : 'btn-outline')}
                  onClick={() => setFilter(f)}
                >{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="muted-block" style={{ marginBottom: 14 }}>
          <strong>工具库说明：</strong>
          每件錾子工具都有独立的版本号管理。当工具出现质量问题（如錾头角度偏差）时，可以回滚到之前的稳定版本，
          同时关联工序的统计数据也会对应回滚或重算。
          这种机制确保了工艺参数的可追溯性，避免因工具问题导致的批量质量事故。
        </div>

        {filtered.length === 0 ? (
          <div className="empty"><div className="ic">🔧</div>暂无工具记录</div>
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>工具编码</th>
                  <th>工具名称</th>
                  <th>类型</th>
                  <th>规格</th>
                  <th>版本</th>
                  <th>状态</th>
                  <th>使用次数</th>
                  <th>维护健康度</th>
                  <th>上次维护</th>
                  <th>制造商</th>
                  <th style={{ width: 200 }}>备注</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const healthPct = Math.min(100, (t.usage_count / t.maintenance_cycle) * 100);
                  const needsMaintenance = t.usage_count >= t.maintenance_cycle;
                  return (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'SF Mono, Menlo, monospace' }}>{t.tool_code}</td>
                      <td style={{ fontWeight: 500 }}>{t.tool_name}</td>
                      <td>{t.tool_type}</td>
                      <td>{t.spec || '-'}</td>
                      <td>
                        <span className={'tag ' + (t.notes?.includes('回滚') ? 'tag-amber' : 'tag-purple')}>
                          {t.version}
                        </span>
                      </td>
                      <td>{statusTag(t.status)}</td>
                      <td className="num">{t.usage_count}</td>
                      <td style={{ minWidth: 150 }}>
                        <div className="flex-b" style={{ marginBottom: 4 }}>
                          <span className="text-xs">健康度</span>
                          <span className="text-xs" style={{ fontWeight: 500 }}>{Math.round(healthPct)}%</span>
                        </div>
                        <div className={'pbar ' + healthClass(t.usage_count, t.maintenance_cycle)}>
                          <div style={{ width: `${healthPct}%` }} />
                        </div>
                        {needsMaintenance && (
                          <div className="text-xs" style={{ color: '#92400e', marginTop: 2 }}>
                            ⚠ 需维护
                          </div>
                        )}
                      </td>
                      <td>{t.last_maintenance || '-'}</td>
                      <td>{t.manufacturer || '-'}</td>
                      <td className="text-xs text-muted">
                        {t.notes || '-'}
                        {t.notes?.includes('回滚') && (
                          <div className="mt-4">
                            <span className="tag tag-amber">已回滚</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 按类型统计 */}
      <div className="card mt-24">
        <h3 className="card-title">
          <span>📊 按类型统计</span>
        </h3>
        <div className="grid-4">
          {toolTypes.map((type) => {
            const typeTools = list.filter((t) => t.tool_type === type);
            const totalUsage = typeTools.reduce((s, t) => s + t.usage_count, 0);
            return (
              <div key={type} className="muted-block">
                <strong style={{ color: '#2a2a35' }}>{type}</strong><br />
                <div className="text-sm">数量：{typeTools.length} 件</div>
                <div className="text-sm">累计使用：{totalUsage} 次</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 版本管理说明 */}
      <div className="card mt-24 muted-block">
        <strong>🔄 工具版本回滚机制说明</strong><br /><br />
        <div className="grid-2">
          <div>
            <strong style={{ color: '#2a2a35' }}>什么是版本回滚？</strong><br />
            <span className="text-sm">
              当发现某版本的錾头出现质量问题（如角度偏差、磨损过度），
              该版本工具所生产的产品质量会出现统一缺陷。
              此时需要：<br />
              1. 将工具状态改为「待修」<br />
              2. 版本号回退至之前的稳定版本<br />
              3. 重新计算工艺参数（錾击力度、深度等）<br />
              4. 已使用该问题版本的工序工时不计入有效工时统计
            </span>
          </div>
          <div>
            <strong style={{ color: '#2a2a35' }}>数据联动影响</strong><br />
            <span className="text-sm">
              工具版本回滚会触发以下数据变化：<br />
              • 关联工序的工时统计回滚<br />
              • 工具使用次数统计回滚<br />
              • 工艺参数表重新计算<br />
              • 交付单版本更新（反映工具变更）<br />
              • 变更日志记录完整回溯链路
            </span>
          </div>
        </div>
      </div>

      <div className="mt-24">
        <Link href="/" className="btn btn-outline">← 返回台账列表</Link>
      </div>
    </div>
  );
}
