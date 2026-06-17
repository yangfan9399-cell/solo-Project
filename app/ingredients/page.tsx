import { getAllIngredients } from "@/lib/data-store";

const categoryLabels: Record<string, string> = {
  filler: '基质/填充料',
  flux: '助熔剂',
  stabilizer: '稳定剂',
  colorant: '着色剂',
  opacifier: '乳浊剂',
  other: '其他',
};

const categoryColors: Record<string, string> = {
  filler: 'bg-stone-100 text-stone-700',
  flux: 'bg-amber-100 text-amber-700',
  stabilizer: 'bg-blue-100 text-blue-700',
  colorant: 'bg-rose-100 text-rose-700',
  opacifier: 'bg-slate-100 text-slate-700',
  other: 'bg-gray-100 text-gray-700',
};

export default async function IngredientsPage() {
  const ingredients = await getAllIngredients();

  const groupedByCategory = ingredients.reduce((acc, ing) => {
    if (!acc[ing.category]) acc[ing.category] = [];
    acc[ing.category].push(ing);
    return acc;
  }, {} as Record<string, typeof ingredients>);

  const categoryOrder = ['filler', 'flux', 'stabilizer', 'opacifier', 'colorant', 'other'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">原料库</h2>
          <p className="text-stone-500 text-sm mt-1">
            共 {ingredients.length} 种原料，{Object.keys(groupedByCategory).length} 大类
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {categoryOrder.map(category => {
          const items = groupedByCategory[category] || [];
          if (items.length === 0) return null;

          return (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[category]}`}>
                  {categoryLabels[category]}
                </span>
                <span className="text-sm text-stone-400">{items.length} 种</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(ingredient => (
                  <div
                    key={ingredient.id}
                    className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-stone-800">{ingredient.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[ingredient.category]}`}>
                        {categoryLabels[ingredient.category]}
                      </span>
                    </div>
                    {ingredient.formula && (
                      <p className="text-sm text-stone-500 font-mono mb-3">
                        {ingredient.formula}
                      </p>
                    )}
                    {ingredient.notes && (
                      <p className="text-xs text-stone-500">
                        {ingredient.notes}
                      </p>
                    )}
                    {ingredient.molecularWeight && (
                      <div className="mt-3 pt-3 border-t border-stone-100">
                        <span className="text-xs text-stone-400">
                          摩尔质量: {ingredient.molecularWeight} g/mol
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
