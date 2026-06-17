import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/data-store';
import { ProjectEditor } from '@/components/ProjectEditor';

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProjectById(id);
  if (!project) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href={`/projects/${project.id}`} className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回项目详情
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-stone-800">编辑项目</h2>
        <p className="text-stone-500 text-sm mt-1">
          <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded mr-2">{project.code}</span>
          {project.name}
        </p>
      </div>
      <ProjectEditor
        mode="edit"
        project={{
          id: project.id,
          name: project.name,
          code: project.code,
          description: project.description ?? '',
          status: project.status,
          tags: project.tags,
          primaryKiln: project.primaryKiln,
          targetCone: project.targetCone,
        }}
      />
    </div>
  );
}
