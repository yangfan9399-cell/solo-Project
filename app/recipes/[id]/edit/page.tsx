import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllProjects, getAllIngredients, getRecipeById } from '@/lib/data-store';
import { RecipeEditor } from '@/components/RecipeEditor';

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [projects, ingredients, recipe] = await Promise.all([
    getAllProjects(),
    getAllIngredients(),
    getRecipeById(id),
  ]);

  if (!recipe) notFound();

  const currentVersion = recipe.versions.find(v => v.id === recipe.currentVersionId) || recipe.versions[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href={`/recipes/${recipe.id}`} className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回配方详情
        </Link>
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">编辑配方</h2>
          <p className="text-stone-500 text-sm mt-1">
            <span className="font-mono text-xs bg-stone-100 px-2 py-0.5 rounded mr-2">{recipe.code}</span>
            当前版本 v{currentVersion?.versionNumber} · 修改保存后将自动生成新版本
          </p>
        </div>
      </div>
      <RecipeEditor
        mode="edit"
        projects={projects.map(p => ({ id: p.id, name: p.name, code: p.code }))}
        ingredients={ingredients.map(i => ({ id: i.id, name: i.name, category: i.category }))}
        recipe={{
          id: recipe.id,
          name: recipe.name,
          code: recipe.code,
          projectId: recipe.projectId,
          description: recipe.description ?? '',
          coneTarget: recipe.coneTarget,
          tags: recipe.tags,
          status: recipe.status,
          matrixType: recipe.matrixType,
          version: currentVersion ? {
            components: currentVersion.components,
            firingTemperature: currentVersion.firingTemperature,
            firingType: currentVersion.firingType,
            holdTime: currentVersion.holdTime,
          } : undefined,
        }}
      />
    </div>
  );
}
