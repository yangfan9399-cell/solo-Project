import Link from 'next/link';
import { ProjectEditor } from '@/components/ProjectEditor';

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/projects" className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回项目台账
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-stone-800">新建项目</h2>
        <p className="text-stone-500 text-sm mt-1">创建一个新的釉料研发项目</p>
      </div>
      <ProjectEditor mode="create" />
    </div>
  );
}
