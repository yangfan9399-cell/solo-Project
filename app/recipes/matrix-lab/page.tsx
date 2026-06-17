import Link from "next/link";
import { getAllIngredients } from "@/lib/data-store";
import MatrixGrid from "@/components/MatrixGrid";

export default async function MatrixLabPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; steps?: string; ingredientA?: string; ingredientB?: string; ingredientC?: string }>;
}) {
  const ingredients = await getAllIngredients();
  const params = await searchParams;

  const type = (params.type as 'binary' | 'ternary') || 'binary';
  const steps = parseInt(params.steps || '5');
  const ingA = params.ingredientA || 'ing_feldspar';
  const ingB = params.ingredientB || 'ing_kaolin';
  const ingC = params.ingredientC || 'ing_silica';

  const fixedComponents = [
    { ingredientId: 'ing_silica', ingredientName: 'Silica (石英)', percentage: 25, locked: true },
    { ingredientId: 'ing_whiting', ingredientName: 'Whiting (石灰石)', percentage: 12, locked: true },
    { ingredientId: 'ing_iron_oxide', ingredientName: 'Iron Oxide (氧化铁)', percentage: 2.5, locked: true },
  ];

  const fluxIngredients = ingredients.filter(i => i.category === 'flux');
  const fillerIngredients = ingredients.filter(i => i.category === 'filler');
  const colorantIngredients = ingredients.filter(i => i.category === 'colorant');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link href="/recipes" className="text-sm text-stone-500 hover:text-stone-700">
          ← 返回配方库
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">配方矩阵实验室</h2>
          <p className="text-stone-500 text-sm mt-1">可视化探索二元、三元配方梯度</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/recipes/matrix-lab?type=binary&steps=${steps}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'binary'
                ? 'bg-blue-600 text-white'
                : 'border border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            二元矩阵
          </Link>
          <Link
            href={`/recipes/matrix-lab?type=ternary&steps=${steps}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'ternary'
                ? 'bg-purple-600 text-white'
                : 'border border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            三元矩阵
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 sticky top-6">
            <h3 className="font-semibold text-stone-800 mb-4">矩阵参数</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  梯度步数
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="2"
                    max="9"
                    defaultValue={steps}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-stone-600 w-8 text-center">
                    {steps}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-1">
                  共 {steps + 1} 个梯度点，{type === 'binary' ? steps + 1 : Math.round((steps + 1) * (steps + 2) / 2)} 个配方
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  变量原料 A
                </label>
                <select
                  defaultValue={ingA}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <optgroup label="助熔剂">
                    {fluxIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="基质料">
                    {fillerIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="着色剂">
                    {colorantIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  变量原料 B
                </label>
                <select
                  defaultValue={ingB}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <optgroup label="助熔剂">
                    {fluxIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="基质料">
                    {fillerIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="着色剂">
                    {colorantIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {type === 'ternary' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    变量原料 C
                  </label>
                  <select
                    defaultValue={ingC}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <optgroup label="助熔剂">
                      {fluxIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="基质料">
                      {fillerIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="着色剂">
                      {colorantIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-stone-100">
                <h4 className="text-sm font-medium text-stone-700 mb-3">固定成分</h4>
                <div className="space-y-2">
                  {fixedComponents.map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-stone-50 px-3 py-2 rounded">
                      <span className="text-stone-600 truncate flex-1">{comp.ingredientName}</span>
                      <span className="font-mono text-stone-800 ml-2">{comp.percentage}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  固定成分总计: {fixedComponents.reduce((s, c) => s + c.percentage, 0)}%
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 space-y-2">
              <button className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium">
                应用配置
              </button>
              <button className="w-full px-4 py-2 border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm">
                保存为配方
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-stone-800">
                {type === 'binary' ? '二元梯度矩阵' : '三元相图矩阵'}
              </h3>
              <span className="text-sm text-stone-500">
                悬停查看详细配方
              </span>
            </div>

            <MatrixGrid
              type={type}
              ingredients={ingredients}
              fixedComponents={fixedComponents}
              steps={steps}
              varIngredientA={ingA}
              varIngredientB={ingB}
              varIngredientC={ingC}
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
              <h4 className="font-semibold text-blue-900 mb-2">💡 实验提示</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 从 5 步梯度开始，确定大致范围后再细化</li>
                <li>• 每次实验建议固定 2-3 种基础成分</li>
                <li>• 变量成分比例差建议不低于 5%</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
              <h4 className="font-semibold text-amber-900 mb-2">⚠️ 注意事项</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• 配方总量需为 100%（误差 ±0.1%）</li>
                <li>• 着色剂添加量通常不超过 10%</li>
                <li>• 悬浮剂等添加剂含量较低，单独列出</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
