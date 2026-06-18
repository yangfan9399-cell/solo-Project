import { component$, useVisibleTask$, useSignal, useStore, $ } from '@builder.io/qwik';
import { Link, useLocation } from '@builder.io/qwik-city';
import type { Project, Sample, Anomaly } from '~/types';
import { getAllProjects, getAllSamples, getAllAnomalies, saveProject, resolveAnomaly } from '~/utils/storage';
import { PageHeader } from '~/components/header/header';

type StatusFilter = 'all' | 'active' | 'completed' | 'archived';

const STATUS_CHIPS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '进行中', value: 'active' },
  { label: '已完成', value: 'completed' },
  { label: '已归档', value: 'archived' },
];

const PROJECT_STATUS_LABEL: Record<Project['status'], string> = {
  active: '进行中',
  completed: '已完成',
  archived: '已归档',
};

const SEVERITY_ICON: Record<Anomaly['severity'], string> = {
  high: '⚠️',
  medium: '🔶',
  low: 'ℹ️',
};

const SEVERITY_ALERT: Record<Anomaly['severity'], string> = {
  high: 'alert-danger',
  medium: 'alert-warning',
  low: 'alert-info',
};

export default component$(() => {
  const location = useLocation();

  const state = useStore<{
    projects: Project[];
    samples: Sample[];
    anomalies: Anomaly[];
  }>({
    projects: [],
    samples: [],
    anomalies: [],
  });

  const search = useSignal('');
  const statusFilter = useSignal<StatusFilter>('all');
  const showNewProject = useSignal(false);

  const newProjectForm = useStore({
    name: '',
    dialect: '',
    region: '',
    investigator: '',
    description: '',
  });

  const loadData = $(() => {
    state.projects = getAllProjects();
    state.samples = getAllSamples();
    state.anomalies = getAllAnomalies();
  });

  useVisibleTask$(({ track }) => {
    track(() => location.url.pathname);
    state.projects = getAllProjects();
    state.samples = getAllSamples();
    state.anomalies = getAllAnomalies();
  });

  useVisibleTask$(({ track }) => {
    track(() => location.url.search);
    const params = new URLSearchParams(location.url.search);
    if (params.get('filter') === 'anomaly') {
      statusFilter.value = 'all';
    }
  });

  const unresolvedAnomalies = useSignal<Anomaly[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.anomalies.length);
    unresolvedAnomalies.value = state.anomalies.filter((a) => !a.resolved);
  });

  const filteredProjects = useSignal<Project[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.projects.length);
    track(() => search.value);
    track(() => statusFilter.value);

    let result = state.projects;

    if (statusFilter.value !== 'all') {
      result = result.filter((p) => p.status === statusFilter.value);
    }

    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.dialect.toLowerCase().includes(q) ||
          p.region.toLowerCase().includes(q) ||
          p.investigator.toLowerCase().includes(q)
      );
    }

    filteredProjects.value = result;
  });

  const totalProjects = useSignal(0);
  const totalSamples = useSignal(0);
  const anomalyTotal = useSignal(0);
  const verifiedTotal = useSignal(0);

  useVisibleTask$(({ track }) => {
    track(() => state.projects.length);
    track(() => state.samples.length);
    track(() => state.anomalies.length);

    totalProjects.value = state.projects.length;
    totalSamples.value = state.samples.length;
    anomalyTotal.value = state.anomalies.filter((a) => !a.resolved).length;
    verifiedTotal.value = state.samples.filter((s) => s.status === 'verified').length;
  });

  const getProjectSampleCount = $((projectId: string): number => {
    return state.samples.filter((s) => s.projectId === projectId).length;
  });

  const getProjectAnomalyCount = $((projectId: string): number => {
    return state.anomalies.filter((a) => a.projectId === projectId && !a.resolved).length;
  });

  const handleResolve = $(async (anomalyId: string) => {
    resolveAnomaly(anomalyId);
    await loadData();
  });

  const handleCreateProject = $(() => {
    if (!newProjectForm.name.trim()) return;
    const now = new Date().toISOString();
    const project: Project = {
      id: Date.now().toString(),
      name: newProjectForm.name.trim(),
      dialect: newProjectForm.dialect.trim(),
      region: newProjectForm.region.trim(),
      investigator: newProjectForm.investigator.trim(),
      description: newProjectForm.description.trim(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    saveProject(project);
    newProjectForm.name = '';
    newProjectForm.dialect = '';
    newProjectForm.region = '';
    newProjectForm.investigator = '';
    newProjectForm.description = '';
    showNewProject.value = false;
    loadData();
  });

  return (
    <>
      <PageHeader
        title="项目台账"
        subtitle="Project Ledger"
        actions={
          <button class="btn-primary" onClick$={() => { showNewProject.value = !showNewProject.value; }}>
            + 新建项目
          </button> as any
        }
      />

      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-label">项目总数</div>
          <div class="stat-value">{totalProjects.value}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">样本总数</div>
          <div class="stat-value">{totalSamples.value}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">异常数量</div>
          <div class="stat-value" style={anomalyTotal.value > 0 ? { color: 'var(--danger)' } : undefined}>
            {anomalyTotal.value}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-label">已验证</div>
          <div class="stat-value" style={{ color: 'var(--success)' }}>{verifiedTotal.value}</div>
        </div>
      </div>

      {unresolvedAnomalies.value.length > 0 && (
        <div class="mt-24">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>异常告警</h3>
          {unresolvedAnomalies.value.slice(0, 5).map((anomaly) => (
            <div key={anomaly.id} class={`alert-bar ${SEVERITY_ALERT[anomaly.severity]}`}>
              <span>{SEVERITY_ICON[anomaly.severity]}</span>
              <span style={{ flex: 1 }}>{anomaly.description}</span>
              <Link
                href={`/project/${anomaly.projectId}`}
                style={{ textDecoration: 'none', fontSize: '12px' }}
              >
                查看项目
              </Link>
              <button class="btn-secondary btn-sm" onClick$={() => handleResolve(anomaly.id)}>
                标记已解决
              </button>
            </div>
          ))}
        </div>
      )}

      {showNewProject.value && (
        <div class="card mt-24">
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>新建项目</h3>
          <div class="grid grid-2">
            <div class="form-group">
              <label>项目名称 *</label>
              <input type="text" value={newProjectForm.name} onInput$={(e) => { newProjectForm.name = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>方言</label>
              <input type="text" value={newProjectForm.dialect} onInput$={(e) => { newProjectForm.dialect = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>地区</label>
              <input type="text" value={newProjectForm.region} onInput$={(e) => { newProjectForm.region = (e.target as HTMLInputElement).value; }} />
            </div>
            <div class="form-group">
              <label>调查人</label>
              <input type="text" value={newProjectForm.investigator} onInput$={(e) => { newProjectForm.investigator = (e.target as HTMLInputElement).value; }} />
            </div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea value={newProjectForm.description} onInput$={(e) => { newProjectForm.description = (e.target as HTMLTextAreaElement).value; }} />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button class="btn-secondary" onClick$={() => { showNewProject.value = false; }}>取消</button>
            <button class="btn-primary" onClick$={handleCreateProject}>创建</button>
          </div>
        </div>
      )}

      <div class="card mt-24" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="搜索项目名称、方言、地区..."
          style={{ width: '280px', flexShrink: 0 }}
          value={search.value}
          onInput$={(e) => { search.value = (e.target as HTMLInputElement).value; }}
        />
        <div class="chip-group">
          {STATUS_CHIPS.map((chip) => (
            <span
              key={chip.value}
              class={`chip ${statusFilter.value === chip.value ? 'selected' : ''}`}
              onClick$={() => { statusFilter.value = chip.value; }}
            >
              {chip.label}
            </span>
          ))}
        </div>
      </div>

      <div class="card mt-16" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredProjects.value.length === 0 ? (
          <div class="empty-state">
            <p>📭 没有匹配的项目</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>项目名称</th>
                <th>方言</th>
                <th>地区</th>
                <th>调查人</th>
                <th>样本数</th>
                <th>异常数</th>
                <th>状态</th>
                <th>更新日期</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.value.map((project) => {
                const sampleCount = state.samples.filter((s) => s.projectId === project.id).length;
                const anomalyCount = state.anomalies.filter((a) => a.projectId === project.id && !a.resolved).length;
                return (
                  <tr key={project.id}>
                    <td>
                      <Link href={`/project/${project.id}`}>{project.name}</Link>
                    </td>
                    <td>{project.dialect}</td>
                    <td>{project.region}</td>
                    <td>{project.investigator}</td>
                    <td>{sampleCount}</td>
                    <td style={anomalyCount > 0 ? { color: 'var(--danger)', fontWeight: 600 } : undefined}>
                      {anomalyCount > 0 ? anomalyCount : '-'}
                    </td>
                    <td>
                      <span class={`badge badge-${project.status}`}>
                        {PROJECT_STATUS_LABEL[project.status]}
                      </span>
                    </td>
                    <td class="text-sm text-secondary">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
});
