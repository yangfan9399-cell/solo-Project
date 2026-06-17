import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllProjects, getAllIngredients } from '@/lib/data-store';
import { RecipeEditor } from '@/components/RecipeEditor';

export default async function NewRecipePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; projectId?: string }>;
}) {
  const params = await searchParams;
  const [projects, ingredients] = await Promise.all([
    getAllProjects(),
    getAllIngredients(),
  ]);

  if (projects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">请先创建项目</h2>
        <p className="text-stone-500 mb-4">配方必须归属于某个项目。请先在项目台账中创建一个项目。</p>
        <Link
          href="/projects"
          className="inline-block px-5 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
        >
          前往项目台账
        </Link>
      </div>
    );
  }

  const matrixType = params.type === 'binary' || params.type === 'ternary' || params.type === 'single'
    ? (params.type as 'single' | 'binary' | 'ternary')
    : 'single';

  const titles: Record<string, string> = {
    single: '新建单一配方',
    binary: '新建二元矩阵配方',
    ternary: '新建三元矩阵配方',
  };

  const subtitle: Record<string, string> = {
    single: '填写基础信息并定义成分列表',
    binary: '二元梯度矩阵将在配方创建后进入矩阵实验室设置',
    ternary: '三元相图矩阵将在配方创建后进入矩阵实验室设置',
  };

  if (!ingredients || ingredients.length === 0) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/recipes" className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回配方库
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-stone-800">{titles[matrixType]}</h2>
        <p className="text-stone-500 text-sm mt-1">{subtitle[matrixType]}</p>
      </div>
      <RecipeEditor
        mode="create"
        projects={projects.map(p => ({ id: p.id, name: p.name, code: p.code }))}
        ingredients={ingredients.map(i => ({ id: i.id, name: i.name, category: i.category }))}
        initialMatrixType={matrixType}
        initialProjectId={params.projectId || undefined}
      />
    </div>
  );
}
