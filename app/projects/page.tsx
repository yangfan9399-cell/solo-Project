import Link from "next/link";
import { getAllProjects } from "@/lib/data-store";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = '', status = '' } = await searchParams;
  const projects = await getAllProjects();
  const query = q;
  const statusFilter = status;

  let filteredProjects = projects;
  if (query) {
    const q = query.toLowerCase();
    filteredProjects = filteredProjects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (statusFilter) {
    filteredProjects = filteredProjects.filter(p => p.status === statusFilter);
  }

  const statusCounts = {
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    'on-hold': projects.filter(p => p.status === 'on-hold').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">项目台账</h2>
          <p className="text-stone-500 text-sm mt-1">管理所有釉料研发项目</p>
        </div>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          + 新建项目
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 mb-6 overflow-hidden">
        <div className="p-4 border-b border-stone-100">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <form method="GET" action="/projects">
                {statusFilter && (
                  <input type="hidden" name="status" value={statusFilter} />
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="q"
                    placeholder="搜索项目名称、编号、标签..."
                    defaultValue={query}
                    className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium"
                  >
                    搜索
                  </button>
                </div>
              </form>
            </div>
            <div className="flex gap-2">
              <Link
                href="/projects"
                className={`px-3 py-2 rounded-lg text-sm ${
                  !statusFilter ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                全部 ({projects.length})
              </Link>
              <Link
                href="/projects?status=active"
                className={`px-3 py-2 rounded-lg text-sm ${
                  statusFilter === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                进行中 ({statusCounts.active})
              </Link>
              <Link
                href="/projects?status=completed"
                className={`px-3 py-2 rounded-lg text-sm ${
                  statusFilter === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                已完成 ({statusCounts.completed})
              </Link>
              <Link
                href="/projects?status=on-hold"
                className={`px-3 py-2 rounded-lg text-sm ${
                  statusFilter === 'on-hold' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                暂停 ({statusCounts['on-hold']})
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map(project => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="bg-white rounded-xl shadow-sm border border-stone-200 hover:shadow-md hover:border-amber-200 transition-all overflow-hidden group"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-stone-400">{project.code}</span>
                  <h3 className="font-semibold text-stone-800 mt-0.5 group-hover:text-amber-700 transition-colors">
                    {project.name}
                  </h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  project.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  project.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {project.status === 'active' ? '进行中' :
                   project.status === 'completed' ? '已完成' : '已暂停'}
                </span>
              </div>

              {project.description && (
                <p className="text-sm text-stone-500 mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-stone-500 mb-4">
                <span className="flex items-center gap-1">
                  🧪 {project.recipeCount} 配方
                </span>
                <span className="flex items-center gap-1">
                  🔬 {project.specimenCount} 试片
                </span>
                {project.targetCone && (
                  <span className="flex items-center gap-1">
                    🌡 {project.targetCone} 锥
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {project.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs"
                  >
                    #{tag}
                  </span>
                ))}
                {project.tags.length > 3 && (
                  <span className="px-2 py-0.5 text-stone-400 text-xs">
                    +{project.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
            <div className="px-5 py-3 bg-stone-50 border-t border-stone-100 text-xs text-stone-400">
              更新于 {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
            </div>
          </Link>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-stone-500">没有找到匹配的项目</p>
        </div>
      )}
    </div>
  );
}
