'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  SaveAll,
  History,
  FileCheck2,
  Download,
  Settings,
  Plus,
  Trash2,
  GripVertical,
  MapPin,
  User,
  Route,
  Calculator,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PenLine,
  Package,
  Layers3,
  Eye,
  ShieldAlert,
  FileDown,
  FileText,
  Clock,
} from 'lucide-react';
import type { Project, LiftPoint, Performer, MotionPath, Waypoint, LoadCalculationResult } from '@/lib/types';
import { getPeakLoads } from '@/lib/calculations';
import Badge from '@/components/Badge';
import Alert from '@/components/Alert';
import StatCard from '@/components/StatCard';
import LoadResultsTable from '@/components/LoadResultsTable';
import StageLayoutCanvas from '@/components/StageLayoutCanvas';
import SignaturePadModal from '@/components/SignaturePadModal';
import {
  formatDate,
  formatDateShort,
  statusLabel,
  liftPointTypeLabel,
  motionTypeLabel,
  alertLabel,
  genId,
  cn,
} from '@/lib/utils';

type TabKey = 'overview' | 'points' | 'performers' | 'paths' | 'results' | 'versions' | 'approvals';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<{ type: string; msg: string } | null>(null);

  const [sigPadOpen, setSigPadOpen] = useState(false);
  const [sigInfo, setSigInfo] = useState({ signerName: '', signerRole: '项目经理', comments: '' });

  const loadProject = async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${id}`);
    const json = await res.json();
    if (json.success) setProject(json.data);
    setLoading(false);
  };

  useEffect(() => { loadProject(); }, [id]);

  const showToast = (type: string, msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const saveChanges = async () => {
    if (!project) return;
    setSaving(true);
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      setProject(json.data);
      setDirty(false);
      showToast('success', '保存成功，载荷计算已重新执行');
    } else {
      showToast('error', '保存失败: ' + json.error);
    }
  };

  const update = (patch: Partial<Project>) => {
    setProject((prev) => (prev ? { ...prev, ...patch } : prev));
    setDirty(true);
  };

  const peakLoads: LoadCalculationResult[] = useMemo(() => {
    return project ? getPeakLoads(project.calculationResults) : [];
  }, [project]);

  const dangerCount = peakLoads.filter((r) => r.alertLevel === 'danger').length;
  const warningCount = peakLoads.filter((r) => r.alertLevel === 'warning').length;
  const normalCount = peakLoads.filter((r) => r.alertLevel === 'normal').length;
  const maxUtil = peakLoads.length > 0 ? Math.max(...peakLoads.map((r) => r.utilization)) : 0;
  const minSF = peakLoads.length > 0 ? Math.min(...peakLoads.map((r) => r.safetyFactor)) : 0;

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-16 text-center">
        <RefreshCw size={28} className="mx-auto mb-3 text-indigo-500 animate-spin" />
        <p className="text-slate-500 text-sm">加载项目详情...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-16 text-center">
        <XCircle size={32} className="mx-auto mb-3 text-rose-500" />
        <p className="font-semibold text-slate-800">项目不存在或已被删除</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
        >
          返回台账
        </button>
      </div>
    );
  }

  const tabs: Array<{ key: TabKey; label: string; icon: any; badge?: number | string }> = [
    { key: 'overview', label: '概览工作台', icon: Eye },
    { key: 'points', label: `吊点布置 (${project.liftPoints.length})`, icon: MapPin, badge: dangerCount > 0 ? `${dangerCount}危险` : undefined },
    { key: 'performers', label: `演员配置 (${project.performers.length})`, icon: User },
    { key: 'paths', label: `运动路径 (${project.motionPaths.length})`, icon: Route },
    { key: 'results', label: '载荷计算结果', icon: Calculator, badge: peakLoads.length },
    { key: 'versions', label: `版本历史 (${project.versionHistory.length})`, icon: History },
    { key: 'approvals', label: `审批签名 (${project.approvalSignatures.length}/3)`, icon: FileCheck2 },
  ];

  // ====== 吊点操作 ======
  const addLiftPoint = () => {
    const idx = project.liftPoints.length + 1;
    const newPt: LiftPoint = {
      id: genId(),
      name: `LP-${String(idx).padStart(2, '0')} 吊点-${idx}`,
      type: 'fixed',
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 6,
      z: 15,
      maxLoad: 500,
      equipment: '标准电动绞车 500kg',
      anchorMethod: '桁架横梁U型螺栓',
      materialSpec: '7×19钢丝绳 Φ8mm',
    };
    update({ liftPoints: [...project.liftPoints, newPt] });
  };
  const updateLiftPoint = (pid: string, patch: Partial<LiftPoint>) => {
    update({
      liftPoints: project.liftPoints.map((p) => (p.id === pid ? { ...p, ...patch } : p)),
    });
  };
  const removeLiftPoint = (pid: string) => {
    if (!confirm('确认删除该吊点？')) return;
    update({ liftPoints: project.liftPoints.filter((p) => p.id !== pid) });
  };

  // ====== 演员操作 ======
  const addPerformer = () => {
    const np: Performer = {
      id: genId(),
      name: '新演员',
      role: '演员',
      weight: 60, costumeWeight: 5, propWeight: 2,
      totalWeight: 67,
      safetyHarness: '全身式安全带',
    };
    update({ performers: [...project.performers, np] });
  };
  const updatePerformer = (pid: string, patch: Partial<Performer>) => {
    update({
      performers: project.performers.map((p) => {
        if (p.id !== pid) return p;
        const merged = { ...p, ...patch };
        merged.totalWeight = merged.weight + merged.costumeWeight + merged.propWeight;
        return merged;
      }),
    });
  };
  const removePerformer = (pid: string) => {
    if (!confirm('确认删除该演员？')) return;
    update({ performers: project.performers.filter((p) => p.id !== pid) });
  };

  // ====== 路径操作 ======
  const addMotionPath = () => {
    const baseWp: Waypoint[] = [
      { id: genId(), sequence: 1, x: 0, y: 0, z: 15, timestamp: 0, velocity: 0, acceleration: 0 },
      { id: genId(), sequence: 2, x: 3, y: 2, z: 10, timestamp: 5, velocity: 1.5, acceleration: 1 },
      { id: genId(), sequence: 3, x: 0, y: 4, z: 5, timestamp: 10, velocity: 0, acceleration: 0 },
    ];
    const mp: MotionPath = {
      id: genId(),
      name: `运动路径-${project.motionPaths.length + 1}`,
      type: 'linear',
      waypoints: baseWp,
      duration: 10,
      maxSpeed: 1.5,
      maxAcceleration: 1,
    };
    update({ motionPaths: [...project.motionPaths, mp] });
  };
  const updateMotionPath = (mid: string, patch: Partial<MotionPath>) => {
    update({
      motionPaths: project.motionPaths.map((m) => (m.id === mid ? { ...m, ...patch } : m)),
    });
  };
  const removeMotionPath = (mid: string) => {
    if (!confirm('确认删除该运动路径？')) return;
    update({ motionPaths: project.motionPaths.filter((m) => m.id !== mid) });
  };
  const addWaypoint = (mid: string) => {
    update({
      motionPaths: project.motionPaths.map((m) => {
        if (m.id !== mid) return m;
        const seq = m.waypoints.length + 1;
        const last = m.waypoints[m.waypoints.length - 1];
        const wp: Waypoint = {
          id: genId(),
          sequence: seq,
          x: last ? last.x + 1 : 0,
          y: last ? last.y + 1 : 0,
          z: last ? Math.max(1, last.z - 2) : 8,
          timestamp: (last?.timestamp || 0) + 3,
          velocity: 1,
          acceleration: 0.5,
        };
        return { ...m, waypoints: [...m.waypoints, wp] };
      }),
    });
  };
  const updateWaypoint = (mid: string, wid: string, patch: Partial<Waypoint>) => {
    update({
      motionPaths: project.motionPaths.map((m) => {
        if (m.id !== mid) return m;
        return {
          ...m,
          waypoints: m.waypoints.map((w) => (w.id === wid ? { ...w, ...patch } : w)),
        };
      }),
    });
  };
  const removeWaypoint = (mid: string, wid: string) => {
    update({
      motionPaths: project.motionPaths.map((m) => {
        if (m.id !== mid) return m;
        return {
          ...m,
          waypoints: m.waypoints
            .filter((w) => w.id !== wid)
            .sort((a, b) => a.sequence - b.sequence)
            .map((w, i) => ({ ...w, sequence: i + 1 })),
        };
      }),
    });
  };

  // ====== 版本/审批 ======
  const saveVersion = async () => {
    const log = prompt('请输入本次版本变更说明：', '保存当前设计状态');
    if (log === null) return;
    const res = await fetch(`/api/projects/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changeLog: log, createdBy: '当前用户' }),
    });
    const json = await res.json();
    if (json.success) {
      showToast('success', `版本 ${json.data.version} 已保存`);
      loadProject();
    }
  };
  const revertTo = async (version: string) => {
    if (!confirm(`确认回滚到版本 ${version}？当前未保存的更改将丢失。`)) return;
    const res = await fetch(`/api/projects/${id}/versions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ version }),
    });
    const json = await res.json();
    if (json.success) {
      showToast('success', `已回滚到 ${version}`);
      loadProject();
      setDirty(false);
    }
  };
  const submitApproval = () => update({ status: 'review' });
  const submitSign = async (sigData: string) => {
    const res = await fetch(`/api/projects/${id}/approvals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sigInfo, signatureData: sigData }),
    });
    const json = await res.json();
    if (json.success) {
      showToast('success', `${sigInfo.signerRole} ${sigInfo.signerName} 签署成功`);
      setSigInfo({ signerName: '', signerRole: '项目经理', comments: '' });
      loadProject();
    }
  };

  // ====== 导出 ======
  const exportSummary = (format: 'json' | 'txt') => {
    window.open(`/api/projects/${id}/export?format=${format}&download=true`, '_blank');
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-5">
      {toast && (
        <div className="fixed top-20 right-8 z-50 animate-bounce">
          <Alert type={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'danger' : 'info'} title={toast.msg} />
        </div>
      )}
      <SignaturePadModal
        open={sigPadOpen}
        onClose={() => setSigPadOpen(false)}
        onConfirm={submitSign}
      />

      {/* ===== 顶部工具栏 ===== */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
            title="返回台账"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{project.name}</h2>
              <Badge label={statusLabel(project.status)} variant={project.status} />
              {project.hasAbnormalData && <Badge label="异常数据" variant="danger" pulse />}
              {dirty && <Badge label="未保存" variant="info" />}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="font-mono">{project.code}</span>
              {project.venue && <span>🏛 {project.venue}</span>}
              {project.performance && <span>🎭 {project.performance}</span>}
              <span>📦 {project.currentVersion} / {project.currentBatch}</span>
              <span>🕒 创建 {formatDateShort(project.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {project.status === 'draft' && (
            <button
              onClick={submitApproval}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 text-sm font-medium hover:bg-sky-100 transition"
            >
              <FileCheck2 size={16} /> 提交审批
            </button>
          )}
          <button
            onClick={saveVersion}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition"
          >
            <SaveAll size={16} /> 保存版本
          </button>
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition">
              <FileDown size={16} /> 导出摘要
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40 overflow-hidden">
              <button onClick={() => exportSummary('txt')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                <FileText size={14} className="text-slate-500" /> 导出文本 (.txt)
              </button>
              <button onClick={() => exportSummary('json')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100">
                <Package size={14} className="text-slate-500" /> 导出JSON (.json)
              </button>
            </div>
          </div>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? '保存计算中...' : dirty ? '保存并重新计算' : '已同步 · 保存'}
          </button>
        </div>
      </div>

      {/* ===== 异常数据提示 ===== */}
      {project.hasAbnormalData && project.abnormalNotes && (
        <div className="mb-5">
          <Alert type="danger" title="⚠ 危险载荷警告" message={project.abnormalNotes} />
        </div>
      )}
      {warningCount > 0 && !project.hasAbnormalData && (
        <div className="mb-5">
          <Alert type="warning" title={`${warningCount} 个吊点接近载荷上限`} message="建议复核吊点配置，必要时升级设备。" />
        </div>
      )}

      {/* ===== Tab 栏 ===== */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex min-w-full">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition',
                    active
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  )}
                >
                  <Icon size={16} />
                  {t.label}
                  {t.badge && (
                    <span className={cn(
                      'ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold',
                      typeof t.badge === 'string' && t.badge.includes('危险')
                        ? 'bg-red-100 text-red-700 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    )}>
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-5 space-y-6 panel">
          {/* ===== Tab: 概览工作台 ===== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 基本信息与计算参数 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Settings size={16} className="text-indigo-600" /> 项目基本信息
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">项目名称</label>
                      <input
                        value={project.name}
                        onChange={(e) => update({ name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">项目编号</label>
                      <input
                        value={project.code}
                        onChange={(e) => update({ code: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">演出场馆</label>
                      <input
                        value={project.venue}
                        onChange={(e) => update({ venue: e.target.value })}
                        placeholder="如：国家大剧院"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">剧目/晚会</label>
                      <input
                        value={project.performance}
                        onChange={(e) => update({ performance: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">项目描述</label>
                      <textarea
                        value={project.description}
                        onChange={(e) => update({ description: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition resize-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">项目标签（逗号分隔）</label>
                      <input
                        value={project.tags.join(', ')}
                        onChange={(e) => update({ tags: e.target.value.split(/[,，\s]+/).filter(Boolean) })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
                      />
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/40 p-5">
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Calculator size={16} className="text-emerald-600" /> 计算参数设置
                  </h4>
                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>设计安全系数</span>
                        <span className="font-mono font-bold text-indigo-700">{project.defaultSafetyFactor}×</span>
                      </label>
                      <input
                        type="range" min="3" max="10" step="0.5"
                        value={project.defaultSafetyFactor}
                        onChange={(e) => update({ defaultSafetyFactor: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>3× 最低</span><span>5× 标准</span><span>10× 极高</span>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>动载系数</span>
                        <span className="font-mono font-bold text-amber-700">{project.dynamicCoefficient}×</span>
                      </label>
                      <input
                        type="range" min="1" max="2.5" step="0.05"
                        value={project.dynamicCoefficient}
                        onChange={(e) => update({ dynamicCoefficient: parseFloat(e.target.value) })}
                        className="w-full accent-amber-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">考虑加减速时惯性力的放大系数</p>
                    </div>
                    <div>
                      <label className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1">
                        <span>冲击系数</span>
                        <span className="font-mono font-bold text-rose-700">{project.impactCoefficient}×</span>
                      </label>
                      <input
                        type="range" min="1" max="3" step="0.1"
                        value={project.impactCoefficient}
                        onChange={(e) => update({ impactCoefficient: parseFloat(e.target.value) })}
                        className="w-full accent-rose-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-0.5">骤加载荷、急停冲击的放大系数</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 统计卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <StatCard label="吊点总数" value={project.liftPoints.length} icon={<MapPin size={20} />} color="indigo" />
                <StatCard label="演员人数" value={project.performers.length} icon={<User size={20} />} color="sky" />
                <StatCard label="运动路径" value={project.motionPaths.length} icon={<Route size={20} />} color="amber" />
                <StatCard label="正常吊点" value={normalCount} icon={<CheckCircle2 size={20} />} color="emerald" />
                <StatCard label="警告吊点" value={warningCount} icon={<AlertTriangle size={20} />} color="amber" />
                <StatCard label="危险吊点" value={dangerCount} icon={<ShieldAlert size={20} />} color="red" />
              </div>

              {/* 布局 + 关键指标 */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <div className="xl:col-span-2">
                  <StageLayoutCanvas
                    liftPoints={project.liftPoints}
                    performers={project.performers}
                    motionPaths={project.motionPaths}
                    peakLoads={peakLoads}
                  />
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Layers3 size={16} className="text-indigo-600" /> 关键指标
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">最大载荷利用率</span>
                        <span className={
                          'font-mono font-bold ' +
                          (maxUtil >= 95 ? 'text-red-600' : maxUtil >= 80 ? 'text-amber-600' : 'text-emerald-600')
                        }>{maxUtil.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">最小安全系数</span>
                        <span className={
                          'font-mono font-bold ' +
                          (minSF < project.defaultSafetyFactor * 0.7 ? 'text-red-600' : minSF < project.defaultSafetyFactor ? 'text-amber-600' : 'text-emerald-600')
                        }>{minSF.toFixed(2)} / {project.defaultSafetyFactor}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">演员总重量</span>
                        <span className="font-mono font-bold text-slate-800">
                          {project.performers.reduce((s, p) => s + p.totalWeight, 0)} kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-100">
                        <span className="text-slate-600">吊点额定总量</span>
                        <span className="font-mono font-bold text-slate-800">
                          {project.liftPoints.reduce((s, p) => s + p.maxLoad, 0)} kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-slate-600">审批进度</span>
                        <span className="font-mono font-bold text-indigo-600">
                          {project.approvalSignatures.length} / 3
                        </span>
                      </div>
                    </div>
                  </div>
                  {dangerCount > 0 && (
                    <Alert type="danger" title="存在危险载荷" message={`${dangerCount} 个吊点安全系数低于设计值的70%。`} />
                  )}
                </div>
              </div>

              {peakLoads.length > 0 && (
                <LoadResultsTable results={peakLoads} title="峰值载荷简表" />
              )}
            </div>
          )}

          {/* ===== Tab: 吊点布置 ===== */}
          {activeTab === 'points' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">吊点配置列表</h4>
                  <p className="text-xs text-slate-500 mt-0.5">配置舞台所有吊点的位置、类型、额定载荷和锚固方式</p>
                </div>
                <button
                  onClick={addLiftPoint}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow"
                >
                  <Plus size={16} /> 新增吊点
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {project.liftPoints.map((lp) => {
                  const peak = peakLoads.find((r) => r.pointId === lp.id);
                  const danger = peak?.alertLevel === 'danger';
                  const warn = peak?.alertLevel === 'warning';
                  return (
                    <div key={lp.id} className={cn(
                      'rounded-xl border p-4',
                      danger ? 'border-red-300 bg-red-50/40' :
                      warn ? 'border-amber-300 bg-amber-50/40' :
                      'border-slate-200 bg-white hover:border-indigo-200'
                    )}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn(
                            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                            danger ? 'bg-red-100' : warn ? 'bg-amber-100' : 'bg-indigo-100'
                          )}>
                            <MapPin size={18} className={danger ? 'text-red-600' : warn ? 'text-amber-600' : 'text-indigo-600'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <input value={lp.name} onChange={(e) => updateLiftPoint(lp.id, { name: e.target.value })}
                              className={cn('w-full font-semibold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-400 outline-none pb-0.5',
                                danger ? 'text-red-800' : warn ? 'text-amber-800' : 'text-slate-800')} />
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <Badge label={liftPointTypeLabel(lp.type)} />
                              <select value={lp.type} onChange={(e) => updateLiftPoint(lp.id, { type: e.target.value as any })}
                                className="text-xs px-2 py-0.5 rounded border border-slate-200 bg-white">
                                <option value="fixed">固定吊点</option><option value="mobile">移动吊点</option><option value="rotation">旋转吊点</option>
                              </select>
                              {peak && <Badge label={alertLabel(peak.alertLevel)} variant={peak.alertLevel} pulse={danger} />}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeLiftPoint(lp.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2.5 mb-3">
                        {[{k:'x',l:'X (m)',v:lp.x},{k:'y',l:'Y (m)',v:lp.y},{k:'z',l:'Z高(m)',v:lp.z},{k:'maxLoad',l:'额定kg',v:lp.maxLoad}].map(f=>(
                          <div key={f.k}>
                            <label className="block text-[10px] text-slate-500 mb-0.5">{f.l}</label>
                            <input type="number" step={f.k==='maxLoad'?50:0.1} value={f.v}
                              onChange={(e)=>updateLiftPoint(lp.id,{[f.k]:parseFloat(e.target.value)||0} as any)}
                              className="w-full px-2 py-1.5 rounded-md border text-xs font-mono border-slate-200 focus:border-indigo-400" />
                          </div>
                        ))}
                      </div>
                      {peak && (
                        <div className="mb-3 p-2.5 rounded-lg bg-white border border-slate-200">
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div><p className="text-slate-500">峰值</p><p className="font-mono font-bold">{peak.maxLoad}kg</p></div>
                            <div>
                              <p className="text-slate-500">利用率</p>
                              <div className="flex items-center gap-1">
                                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className={cn('h-full rounded-full',peak.utilization>=95?'bg-red-500':peak.utilization>=80?'bg-amber-500':'bg-emerald-500')} style={{width:`${Math.min(peak.utilization,100)}%`}}/>
                                </div>
                                <span className="font-mono font-bold text-slate-700 w-10 text-right">{peak.utilization}%</span>
                              </div>
                            </div>
                            <div><p className="text-slate-500">安全系数</p><p className="font-mono font-bold text-emerald-700">{peak.safetyFactor}×</p></div>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <input value={lp.equipment} onChange={(e)=>updateLiftPoint(lp.id,{equipment:e.target.value})} placeholder="设备" className="px-2 py-1 rounded-md border border-slate-200"/>
                        <input value={lp.anchorMethod} onChange={(e)=>updateLiftPoint(lp.id,{anchorMethod:e.target.value})} placeholder="锚固" className="px-2 py-1 rounded-md border border-slate-200"/>
                        <input value={lp.materialSpec} onChange={(e)=>updateLiftPoint(lp.id,{materialSpec:e.target.value})} placeholder="钢丝绳" className="px-2 py-1 rounded-md border border-slate-200"/>
                      </div>
                    </div>
                  );
                })}
              </div>
              {project.liftPoints.length===0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <MapPin size={32} className="mx-auto mb-2 text-slate-400"/>
                  <p className="font-medium text-slate-600">暂无吊点配置</p>
                  <button onClick={addLiftPoint} className="mt-3 px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm">添加第一个吊点</button>
                </div>
              )}
            </div>
          )}

          {/* ===== Tab: 演员配置 ===== */}
          {activeTab === 'performers' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">演员载荷配置</h4>
                  <p className="text-xs text-slate-500 mt-0.5">演员体重+服装+道具为总计算重量，影响所有吊点载荷</p>
                </div>
                <button onClick={addPerformer} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 shadow">
                  <Plus size={16}/> 新增演员
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {project.performers.map(pf => (
                  <div key={pf.id} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-emerald-200 transition">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow">
                          {pf.name.slice(0,1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input value={pf.name} onChange={(e)=>updatePerformer(pf.id,{name:e.target.value})}
                            className="w-full font-semibold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-400 outline-none pb-0.5 text-slate-800"/>
                          <input value={pf.role} onChange={(e)=>updatePerformer(pf.id,{role:e.target.value})}
                            className="w-full text-xs text-slate-500 bg-transparent outline-none mt-0.5"/>
                        </div>
                      </div>
                      <button onClick={()=>removePerformer(pf.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5 mb-3">
                      {[
                        {k:'weight',l:'体重kg',c:'text-sky-700'},{k:'costumeWeight',l:'服装kg',c:'text-violet-700'},{k:'propWeight',l:'道具kg',c:'text-amber-700'}
                      ].map(f=>(
                        <div key={f.k}>
                          <label className="block text-[10px] text-slate-500 mb-0.5">{f.l}</label>
                          <input type="number" step={0.5} value={(pf as any)[f.k]}
                            onChange={(e)=>updatePerformer(pf.id,{[f.k]:parseFloat(e.target.value)||0} as any)}
                            className={`w-full px-2 py-1.5 rounded-md border text-xs font-mono font-bold ${f.c} border-slate-200 focus:border-emerald-400`}/>
                        </div>
                      ))}
                    </div>
                    <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-700">总载荷重量</span>
                        <span className="font-mono text-xl font-bold text-emerald-700">{pf.totalWeight} kg</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">安全带型号</label>
                      <input value={pf.safetyHarness} onChange={(e)=>updatePerformer(pf.id,{safetyHarness:e.target.value})}
                        className="w-full px-2 py-1.5 rounded-md border text-xs border-slate-200"/>
                    </div>
                    {pf.remarks !== undefined && (
                      <div className="mt-2">
                        <label className="block text-[10px] text-slate-500 mb-0.5">备注</label>
                        <input value={pf.remarks||''} onChange={(e)=>updatePerformer(pf.id,{remarks:e.target.value})}
                          className="w-full px-2 py-1 rounded-md border text-xs border-slate-200"/>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {project.performers.length===0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <User size={32} className="mx-auto mb-2 text-slate-400"/>
                  <p className="font-medium text-slate-600">暂无演员配置</p>
                  <button onClick={addPerformer} className="mt-3 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm">添加第一位演员</button>
                </div>
              )}
            </div>
          )}

          {/* ===== Tab: 运动路径 ===== */}
          {activeTab === 'paths' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">运动路径与航点</h4>
                  <p className="text-xs text-slate-500 mt-0.5">配置演员运动轨迹，路径航点用于全时域动载计算</p>
                </div>
                <button onClick={addMotionPath} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 shadow">
                  <Plus size={16}/> 新增路径
                </button>
              </div>
              {project.motionPaths.length===0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                  <Route size={32} className="mx-auto mb-2 text-slate-400"/>
                  <p className="font-medium text-slate-600">暂无运动路径（将按静态计算）</p>
                  <button onClick={addMotionPath} className="mt-3 px-4 py-1.5 rounded-lg bg-amber-500 text-white text-sm">添加运动路径</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {project.motionPaths.map(mp => (
                    <div key={mp.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Route size={16} className="text-amber-600"/>
                          </div>
                          <div>
                            <input value={mp.name} onChange={(e)=>updateMotionPath(mp.id,{name:e.target.value})}
                              className="font-semibold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-400 outline-none pb-0.5 text-slate-800"/>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge label={motionTypeLabel(mp.type)}/>
                              <select value={mp.type} onChange={(e)=>updateMotionPath(mp.id,{type:e.target.value as any})}
                                className="text-xs px-2 py-0.5 rounded border border-slate-200 bg-white">
                                <option value="linear">直线</option><option value="arc">弧线</option><option value="swing">摆动</option><option value="complex">复合</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                              <p className="text-slate-500 text-[10px]">时长</p>
                              <input type="number" value={mp.duration} onChange={(e)=>updateMotionPath(mp.id,{duration:parseFloat(e.target.value)||0})}
                                className="w-14 font-mono font-bold text-slate-800 bg-transparent outline-none"/>s
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                              <p className="text-slate-500 text-[10px]">最大速</p>
                              <input type="number" step={0.1} value={mp.maxSpeed} onChange={(e)=>updateMotionPath(mp.id,{maxSpeed:parseFloat(e.target.value)||0})}
                                className="w-12 font-mono font-bold text-slate-800 bg-transparent outline-none"/>m/s
                            </div>
                            <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200">
                              <p className="text-slate-500 text-[10px]">加速度</p>
                              <input type="number" step={0.1} value={mp.maxAcceleration} onChange={(e)=>updateMotionPath(mp.id,{maxAcceleration:parseFloat(e.target.value)||0})}
                                className="w-12 font-mono font-bold text-slate-800 bg-transparent outline-none"/>m/s²
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={()=>addWaypoint(mp.id)} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50" title="添加航点">
                              <Plus size={16}/>
                            </button>
                            <button onClick={()=>removeMotionPath(mp.id)} className="p-2 rounded-lg text-slate-400 hover:bg-red-100 hover:text-red-600" title="删除路径">
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-3 py-2 text-left">序</th>
                              <th className="px-3 py-2 text-right">X(m)</th>
                              <th className="px-3 py-2 text-right">Y(m)</th>
                              <th className="px-3 py-2 text-right">Z高(m)</th>
                              <th className="px-3 py-2 text-right">时间(s)</th>
                              <th className="px-3 py-2 text-right">速度(m/s)</th>
                              <th className="px-3 py-2 text-right">加速度(m/s²)</th>
                              <th className="px-3 py-2 w-10"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {mp.waypoints
                              .sort((a,b)=>a.sequence-b.sequence)
                              .map(wp => (
                              <tr key={wp.id} className="hover:bg-slate-50">
                                <td className="px-3 py-2">
                                  <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">{wp.sequence}</span>
                                </td>
                                {['x','y','z'].map(ax=>(
                                  <td key={ax} className="px-3 py-2">
                                    <input type="number" step={0.1} value={(wp as any)[ax]}
                                      onChange={(e)=>updateWaypoint(mp.id,wp.id,{[ax]:parseFloat(e.target.value)||0} as any)}
                                      className="w-full px-2 py-1 rounded text-right font-mono border border-slate-100 focus:border-amber-300"/>
                                  </td>
                                ))}
                                {['timestamp','velocity','acceleration'].map(k=>(
                                  <td key={k} className="px-3 py-2">
                                    <input type="number" step={k==='timestamp'?0.5:0.1} value={(wp as any)[k]}
                                      onChange={(e)=>updateWaypoint(mp.id,wp.id,{[k]:parseFloat(e.target.value)||0} as any)}
                                      className="w-full px-2 py-1 rounded text-right font-mono border border-slate-100 focus:border-amber-300"/>
                                  </td>
                                ))}
                                <td className="px-3 py-2 text-right">
                                  <button onClick={()=>removeWaypoint(mp.id,wp.id)} className="text-slate-400 hover:text-red-600">
                                    <Trash2 size={14}/>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== Tab: 计算结果 ===== */}
          {activeTab === 'results' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="计算数据点" value={project.calculationResults.length} icon={<Calculator size={20}/>} color="indigo"/>
                <StatCard label="正常吊点" value={normalCount} sublabel={`${peakLoads.length?Math.round(normalCount/Math.max(peakLoads.length,1)*100):0}%`} icon={<CheckCircle2 size={20}/>} color="emerald"/>
                <StatCard label="警告吊点" value={warningCount} icon={<AlertTriangle size={20}/>} color="amber"/>
                <StatCard label="危险吊点" value={dangerCount} icon={<ShieldAlert size={20}/>} color="red"/>
              </div>
              <LoadResultsTable results={peakLoads} title="峰值载荷表（每吊点全轨迹最大值）"/>
              <div>
                <div className="px-4 py-3 rounded-t-xl border border-slate-200 bg-slate-50 flex items-center justify-between mb-0 border-b-0">
                  <h4 className="font-semibold text-slate-800 text-sm">全时域载荷数据（{project.calculationResults.length} 数据点）</h4>
                  <span className="text-xs text-slate-500">按吊点×时刻展开</span>
                </div>
                <LoadResultsTable results={project.calculationResults} compact title=""/>
              </div>
            </div>
          )}

          {/* ===== Tab: 版本历史 ===== */}
          {activeTab === 'versions' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800">版本 / 批次历史</h4>
                  <p className="text-xs text-slate-500 mt-0.5">每个版本快照完整项目配置，可随时回滚</p>
                </div>
                <button onClick={saveVersion} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 shadow">
                  <SaveAll size={16}/> 保存新版本
                </button>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200"/>
                <div className="mb-4 relative">
                  <div className="absolute -left-[22px] top-2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white ring-2 ring-indigo-200"/>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge label="当前版本" variant="info"/>
                        <span className="font-mono font-bold text-indigo-800">{project.currentVersion}</span>
                        <span className="text-xs text-slate-500">批次 {project.currentBatch}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(project.updatedAt)}</span>
                    </div>
                    <p className="text-sm text-slate-700">当前工作状态（未保存为版本）</p>
                  </div>
                </div>
                {project.versionHistory.length === 0 ? (
                  <div className="relative rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <div className="absolute -left-[22px] top-4 w-4 h-4 rounded-full bg-slate-300 border-4 border-white"/>
                    <History size={24} className="mx-auto mb-2 text-slate-400"/>
                    <p className="text-sm font-medium text-slate-600">暂无已保存版本</p>
                    <p className="text-xs text-slate-500 mt-1">点击右上角"保存新版本"创建快照</p>
                  </div>
                ) : (
                  project.versionHistory.map((v, i) => (
                    <div key={v.version+i} className="mb-3 relative">
                      <div className="absolute -left-[22px] top-3 w-4 h-4 rounded-full bg-slate-400 border-4 border-white"/>
                      <div className="rounded-xl border border-slate-200 bg-white p-4 hover:border-violet-200 transition">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{v.version}</span>
                            <span className="text-xs text-slate-500">批次 {v.batch}</span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-600">{v.createdBy}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{formatDate(v.createdAt)}</span>
                            <button onClick={()=>revertTo(v.version)} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100">
                              <RotateCcw size={12}/> 回滚到此版本
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">{v.changeLog}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                          <span>吊点 {v.snapshot.liftPoints.length}</span>
                          <span>演员 {v.snapshot.performers.length}</span>
                          <span>路径 {v.snapshot.motionPaths.length}</span>
                          <span>安全系数 {v.snapshot.defaultSafetyFactor}×</span>
                          <span>计算 {v.calculationResults.length} 点</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ===== Tab: 审批签名 ===== */}
          {activeTab === 'approvals' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {['项目经理','技术总监','安全主管'].map(role => {
                  const s = project.approvalSignatures.find(x=>x.signerRole===role);
                  return (
                    <div key={role} className={cn(
                      'rounded-xl border p-5',
                      s ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
                    )}>
                      <div className="flex items-center justify-between mb-3">
                        <Badge label={role} variant={s?'approved':'default'}/>
                        {s ? <CheckCircle2 size={20} className="text-emerald-600"/> : <Clock size={18} className="text-slate-400"/>}
                      </div>
                      {s ? (
                        <div>
                          <div className="mb-2 h-16 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                            {s.signatureData ? (
                              <img src={s.signatureData} alt="签名" className="h-full object-contain"/>
                            ) : (
                              <span className="font-bold text-slate-700 italic">{s.signerName}</span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{s.signerName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(s.signedAt)}</p>
                          {s.comments && <p className="mt-2 text-xs text-slate-600 bg-white rounded-md p-2 border border-slate-100">💬 {s.comments}</p>}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <PenLine size={28} className="mx-auto mb-2 text-slate-300"/>
                          <p className="text-xs text-slate-500">等待签署</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <PenLine size={16} className="text-indigo-600"/> 新增审批签名
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">签署角色</label>
                    <select value={sigInfo.signerRole} onChange={(e)=>setSigInfo({...sigInfo,signerRole:e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                      <option>项目经理</option><option>技术总监</option><option>安全主管</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">签署人姓名</label>
                    <input value={sigInfo.signerName} onChange={(e)=>setSigInfo({...sigInfo,signerName:e.target.value})}
                      placeholder="请输入姓名"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400"/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">审批意见</label>
                    <input value={sigInfo.comments} onChange={(e)=>setSigInfo({...sigInfo,comments:e.target.value})}
                      placeholder="同意/附意见..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400"/>
                  </div>
                </div>
                <button
                  onClick={()=>{
                    if(!sigInfo.signerName.trim()){alert('请输入签署人姓名');return;}
                    setSigPadOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow"
                >
                  <PenLine size={16}/> 开始签名
                </button>
              </div>

              {project.approvalSignatures.length>0 && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 text-sm">全部签名记录</h4>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 tracking-wider">
                        <tr>
                          <th className="px-4 py-2 text-left">角色</th>
                          <th className="px-4 py-2 text-left">签署人</th>
                          <th className="px-4 py-2 text-left">签名</th>
                          <th className="px-4 py-2 text-left">意见</th>
                          <th className="px-4 py-2 text-left">时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {project.approvalSignatures.map(s=>(
                          <tr key={s.id}>
                            <td className="px-4 py-2">{s.signerRole}</td>
                            <td className="px-4 py-2 font-semibold text-slate-800">{s.signerName}</td>
                            <td className="px-4 py-2">
                              <div className="h-10 w-40 rounded bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                {s.signatureData?<img src={s.signatureData} alt="签名" className="h-full object-contain"/>:<span className="italic text-slate-500">{s.signerName}</span>}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs max-w-xs truncate">{s.comments||'—'}</td>
                            <td className="px-4 py-2 text-xs text-slate-500">{formatDate(s.signedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

