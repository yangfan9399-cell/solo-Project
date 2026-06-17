'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileX,
  Eye,
  Download,
  Trash2,
  Calendar,
  Tag,
  X,
  Users,
  Layers,
  AlertCircle,
  Activity,
} from 'lucide-react';
import type { Project, ProjectFilter } from '@/lib/types';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import StatCard from '@/components/StatCard';
import { formatDateShort, formatDate, statusLabel, genId } from '@/lib/utils';

interface ListResponse {
  success: boolean;
  data: Project[];
  meta: {
    total: number;
    tags: string[];
    stats: { draft: number; review: number; approved: number; rejected: number; abnormal: number };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [stats, setStats] = useState<any>({ draft: 0, review: 0, approved: 0, rejected: 0, abnormal: 0 });
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectFilter['status']>('all');
  const [abnormalFilter, setAbnormalFilter] = useState<'all' | boolean>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', venue: '', performance: '', description: '', tags: '' });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (keyword) qs.set('keyword', keyword);
    if (statusFilter && statusFilter !== 'all') qs.set('status', statusFilter);
    if (abnormalFilter !== 'all') qs.set('hasAbnormal', String(abnormalFilter));
    if (tagFilter) qs.set('tag', tagFilter);
    if (dateFrom) qs.set('dateFrom', dateFrom);
    if (dateTo) qs.set('dateTo', dateTo);
    const res = await fetch(`/api/projects?${qs.toString()}`);
    const json: ListResponse = await res.json();
    if (json.success) {
      setProjects(json.data);
      setTags(json.meta.tags);
      setStats(json.meta.stats);
    }
    setLoading(false);
  }, [keyword, statusFilter, abnormalFilter, tagFilter, dateFrom, dateTo]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    if (!newProject.name.trim()) return;
    setCreating(true);
    const body = {
      ...newProject,
      tags: newProject.tags.split(/[,，\s]+/).filter(Boolean),
      liftPoints: [
        {
          id: genId(),
          name: 'LP-01 主吊点',
          type: 'fixed',
          x: 0, y: 0, z: 15,
          maxLoad: 800,
          equipment: '标准电动绞车',
          anchorMethod: '桁架固定',
          materialSpec: '7×19钢丝绳 Φ10mm',
        },
      ],
      performers: [
        {
          id: genId(),
          name: '待配置演员',
          role: '主要演员',
          weight: 60, costumeWeight: 5, propWeight: 3, totalWeight: 68,
          safetyHarness: '全身式安全带',
        },
      ],
      motionPaths: [],
      defaultSafetyFactor: 5,
      dynamicCoefficient: 1.2,
      impactCoefficient: 1.5,
      createdBy: '系统管理员',
    };
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      setShowCreate(false);
      setNewProject({ name: '', venue: '', performance: '', description: '', tags: '' });
      router.push(`/projects/${json.data.id}`);
    }
    setCreating(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确认删除该项目？此操作不可撤销。')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    loadData();
  };

  const abnormalCount = stats.abnormal || 0;
  const activeFilters = [keyword, statusFilter !== 'all', abnormalFilter !== 'all', tagFilter, dateFrom, dateTo].filter(Boolean).length;

  const resetFilters = () => {
    setKeyword(''); setStatusFilter('all'); setAbnormalFilter('all'); setTagFilter(''); setDateFrom(''); setDateTo('');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-6">
      {abnormalCount > 0 && (
        <div className="mb-5">
          <Alert
            type="warning"
            title={`${abnormalCount} 个项目存在异常载荷数据`}
            message="请检查危险吊点，必要时升级钢丝绳规格或调整吊点布置，确保舞台演出安全。"
          />
        </div>
      )}

      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FileText size={24} className="text-indigo-600" />
            项目台账
          </h2>
          <p className="text-sm text-slate-500 mt-1">所有威亚吊点载荷计算项目的统一管理工作台</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/30 transition"
        >
          <Plus size={18} /> 新建项目
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="项目总数"
          value={stats.draft + stats.review + stats.approved + stats.rejected}
          sublabel="当前筛选结果"
          icon={<Layers size={22} />}
          color="indigo"
        />
        <StatCard
          label="审批通过"
          value={stats.approved}
          sublabel="可执行项目"
          icon={<CheckCircle2 size={22} />}
          color="emerald"
        />
        <StatCard
          label="审批中"
          value={stats.review}
          sublabel="等待复核"
          icon={<Clock size={22} />}
          color="sky"
        />
        <StatCard
          label="草稿状态"
          value={stats.draft}
          sublabel="未提交审批"
          icon={<FileText size={22} />}
          color="amber"
        />
        <StatCard
          label="异常项目"
          value={abnormalCount}
          sublabel="存在危险载荷"
          icon={<AlertTriangle size={22} />}
          color="red"
          trend={abnormalCount > 0 ? 'up' : 'flat'}
          trendValue={abnormalCount > 0 ? '需关注' : '正常'}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索项目名称、编号、场馆、剧目..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          <select
            value={statusFilter as string}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="review">审批中</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>

          <select
            value={abnormalFilter === 'all' ? 'all' : String(abnormalFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setAbnormalFilter(v === 'all' ? 'all' : v === 'true');
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          >
            <option value="all">全部异常</option>
            <option value="true">有异常</option>
            <option value="false">无异常</option>
          </select>

          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="pl-8 pr-7 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition appearance-none"
            >
              <option value="">全部标签</option>
              {tags.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
            <span className="text-slate-400">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {activeFilters > 0 && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <X size={14} /> 重置({activeFilters})
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">项目列表</span>
            <span className="text-xs text-slate-500">共 {projects.length} 条</span>
          </div>
          <div className="text-xs text-slate-500">
            点击任意项目进入详情编辑
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Activity size={32} className="mx-auto mb-3 text-indigo-500 animate-spin" />
            <p className="text-sm">加载项目数据中...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center">
            <FileX size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-700">暂无符合条件的项目</p>
            <p className="text-xs text-slate-500 mt-1">请尝试调整筛选条件或新建项目</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">项目编号 / 名称</th>
                  <th className="px-5 py-3 text-left font-semibold">场馆 / 剧目</th>
                  <th className="px-5 py-3 text-center font-semibold">吊点 / 演员</th>
                  <th className="px-5 py-3 text-center font-semibold">版本 / 批次</th>
                  <th className="px-5 py-3 text-center font-semibold">审批</th>
                  <th className="px-5 py-3 text-center font-semibold">状态</th>
                  <th className="px-5 py-3 text-center font-semibold">创建时间</th>
                  <th className="px-5 py-3 text-right font-semibold">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className={
                      'group transition cursor-pointer ' +
                      (p.hasAbnormalData ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-indigo-50/40')
                    }
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className={
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' +
                          (p.hasAbnormalData ? 'bg-red-100' : 'bg-indigo-50')
                        }>
                          {p.hasAbnormalData ? (
                            <AlertTriangle size={16} className="text-red-600" />
                          ) : (
                            <FileText size={16} className="text-indigo-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-xs text-slate-500">{p.code}</p>
                          <p className="font-semibold text-slate-800 truncate max-w-sm">
                            {p.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.tags.slice(0, 3).map((t) => (
                              <span key={t} className="inline-block px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">{p.venue || <span className="text-slate-400">—</span>}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.performance || <span className="text-slate-400">—</span>}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs">
                          <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                          <span className="font-semibold text-slate-700">{p.liftPoints.length}</span>
                          <span className="text-slate-500">吊点</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <Users size={12} className="text-emerald-500" />
                          <span className="font-semibold text-slate-700">{p.performers.length}</span>
                          <span className="text-slate-500">演员</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <p className="font-mono text-sm font-semibold text-slate-800">{p.currentVersion}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{p.currentBatch}</p>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {['项目经理', '技术总监', '安全主管'].map((role) => {
                          const signed = p.approvalSignatures.find((s) => s.signerRole === role);
                          return (
                            <div
                              key={role}
                              title={signed ? `${role}: ${signed.signerName} 已签署` : `${role}: 待签署`}
                              className={
                                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ' +
                                (signed
                                  ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                  : 'bg-slate-50 text-slate-400 border-slate-200')
                              }
                            >
                              {role[0]}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <Badge label={statusLabel(p.status)} variant={p.status} />
                        {p.hasAbnormalData && (
                          <Badge label="异常数据" variant="danger" pulse />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-slate-500">
                      <p>{formatDateShort(p.createdAt)}</p>
                      <p className="text-[10px] text-slate-400">更新: {formatDateShort(p.updatedAt)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/projects/${p.id}`);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-100 hover:text-indigo-700 transition"
                          title="查看详情"
                        >
                          <Eye size={16} />
                        </button>
                        <a
                          href={`/api/projects/${p.id}/export?format=txt&download=true`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-100 hover:text-emerald-700 transition"
                          title="导出摘要"
                        >
                          <Download size={16} />
                        </a>
                        <button
                          onClick={(e) => handleDelete(p.id, e)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-100 hover:text-red-700 transition"
                          title="删除项目"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={20} className="text-indigo-600" /> 新建威亚项目
              </h3>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">项目名称 *</label>
                <input
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="例：《XXX》第一幕 - 群舞吊威亚"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">演出场馆</label>
                  <input
                    value={newProject.venue}
                    onChange={(e) => setNewProject({ ...newProject, venue: e.target.value })}
                    placeholder="例：国家大剧院"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">剧目/晚会</label>
                  <input
                    value={newProject.performance}
                    onChange={(e) => setNewProject({ ...newProject, performance: e.target.value })}
                    placeholder="例：飞天敦煌"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">项目描述</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={3}
                  placeholder="简要描述威亚场景、动作类型和特殊要求..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">标签（逗号分隔）</label>
                <input
                  value={newProject.tags}
                  onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })}
                  placeholder="例：大型舞剧, 群舞, 高空"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle size={12} />
                  系统将初始化 1 个标准吊点和 1 个演员模板，您可在详情页继续完善。
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProject.name.trim() || creating}
                className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
              >
                {creating ? '创建中...' : '创建并进入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
