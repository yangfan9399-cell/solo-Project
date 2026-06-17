import type { RecipeComponent, MatrixConfig } from './types';

export function calculateBinaryMatrix(
  ingredientA: string,
  ingredientB: string,
  minA: number,
  maxA: number,
  steps: number,
  fixedComponents: RecipeComponent[]
): Array<{ components: RecipeComponent[]; label: string }> {
  const results: Array<{ components: RecipeComponent[]; label: string }> = [];
  const totalFixed = fixedComponents.reduce((sum, c) => sum + c.percentage, 0);
  const variableTotal = 100 - totalFixed;

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const amountA = minA + (maxA - minA) * ratio;
    const amountB = variableTotal - amountA;

    const components: RecipeComponent[] = [
      ...fixedComponents.map(c => ({ ...c })),
      { ingredientId: ingredientA, ingredientName: ingredientA, percentage: amountA, locked: false },
      { ingredientId: ingredientB, ingredientName: ingredientB, percentage: amountB, locked: false },
    ];

    results.push({
      components,
      label: `${i + 1}`,
    });
  }

  return results;
}

export function calculateTernaryMatrix(
  ingredientA: string,
  ingredientB: string,
  ingredientC: string,
  steps: number,
  fixedComponents: RecipeComponent[]
): Array<{ components: RecipeComponent[]; label: string; row: number; col: number }> {
  const results: Array<{ components: RecipeComponent[]; label: string; row: number; col: number }> = [];
  const totalFixed = fixedComponents.reduce((sum, c) => sum + c.percentage, 0);
  const variableTotal = 100 - totalFixed;

  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps - i; j++) {
      const k = steps - i - j;
      const amountA = (i / steps) * variableTotal;
      const amountB = (j / steps) * variableTotal;
      const amountC = (k / steps) * variableTotal;

      const components: RecipeComponent[] = [
        ...fixedComponents.map(c => ({ ...c })),
        { ingredientId: ingredientA, ingredientName: ingredientA, percentage: amountA, locked: false },
        { ingredientId: ingredientB, ingredientName: ingredientB, percentage: amountB, locked: false },
        { ingredientId: ingredientC, ingredientName: ingredientC, percentage: amountC, locked: false },
      ];

      results.push({
        components,
        label: `${i + 1}-${j + 1}-${k + 1}`,
        row: i,
        col: j,
      });
    }
  }

  return results;
}

export function validateMatrixConfig(config: MatrixConfig): string[] {
  const errors: string[] = [];

  if (config.steps < 2) {
    errors.push('梯度步数至少为 2');
  }
  if (config.steps > 10) {
    errors.push('梯度步数建议不超过 10，避免试片数量过多');
  }

  const fixedTotal = config.fixedComponents.reduce((sum, c) => sum + c.percentage, 0);
  if (fixedTotal >= 100) {
    errors.push('固定成分总比例不能超过 100%');
  }

  if (config.type === 'binary') {
    if (config.baseIngredients.length !== 2) {
      errors.push('二元矩阵需要恰好 2 种基础原料');
    }
    if (config.minPercentages[0] >= config.maxPercentages[0]) {
      errors.push('原料 A 的最小值必须小于最大值');
    }
  }

  if (config.type === 'ternary') {
    if (config.baseIngredients.length !== 3) {
      errors.push('三元矩阵需要恰好 3 种基础原料');
    }
  }

  return errors;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getQualityColor(quality: string): string {
  switch (quality) {
    case 'excellent': return 'bg-emerald-500';
    case 'good': return 'bg-blue-500';
    case 'fair': return 'bg-amber-500';
    case 'poor': return 'bg-red-500';
    default: return 'bg-stone-400';
  }
}

export function getGlossLabel(gloss: string): string {
  switch (gloss) {
    case 'high': return '高光';
    case 'medium': return '半光';
    case 'low': return '低光';
    case 'matte': return '哑光';
    default: return gloss;
  }
}

export function getFiringTypeLabel(type: string): string {
  switch (type) {
    case 'oxidation': return '氧化焰';
    case 'reduction': return '还原焰';
    case 'soda': return '苏打焰';
    case 'wood': return '柴烧';
    case 'salt': return '盐烧';
    default: return type;
  }
}
