'use client';

import { useState, useMemo } from 'react';
import type { RecipeComponent, GlazeIngredient } from '@/lib/types';

interface MatrixGridProps {
  type: 'binary' | 'ternary';
  ingredients: GlazeIngredient[];
  fixedComponents: RecipeComponent[];
  steps: number;
  varIngredientA?: string;
  varIngredientB?: string;
  varIngredientC?: string;
}

export default function MatrixGrid({
  type,
  ingredients,
  fixedComponents,
  steps,
  varIngredientA,
  varIngredientB,
  varIngredientC,
}: MatrixGridProps) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const matrixData = useMemo(() => {
    if (type === 'binary') {
      return generateBinaryMatrix(steps, fixedComponents, varIngredientA || 'A', varIngredientB || 'B');
    } else {
      return generateTernaryMatrix(steps, fixedComponents, varIngredientA || 'A', varIngredientB || 'B', varIngredientC || 'C');
    }
  }, [type, steps, fixedComponents, varIngredientA, varIngredientB, varIngredientC]);

  const getIngredientName = (id: string) => {
    const ing = ingredients.find(i => i.id === id || i.name === id);
    return ing?.name || id;
  };

  if (type === 'binary') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">二元梯度矩阵 · {steps + 1} 个梯度点</span>
          <span className="text-stone-500">
            {varIngredientA ? getIngredientName(varIngredientA) : '原料 A'} ↔ {varIngredientB ? getIngredientName(varIngredientB) : '原料 B'}
          </span>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${steps + 1}, minmax(0, 1fr))` }}>
          {(matrixData as BinaryCell[]).map((cell, idx) => {
            const aComp = cell.components.find(c => c.ingredientId === varIngredientA || c.ingredientName === varIngredientA);
            const bComp = cell.components.find(c => c.ingredientId === varIngredientB || c.ingredientName === varIngredientB);
            const total = cell.components.reduce((sum, c) => sum + c.percentage, 0);
            const isTotalOff = Math.abs(total - 100) > 0.1;
            const isHovered = hoveredCell === `bin-${idx}`;

            return (
              <div
                key={idx}
                className={`relative bg-white rounded-lg border-2 p-3 cursor-pointer transition-all ${
                  isHovered ? 'border-amber-400 shadow-lg scale-105 z-10' : 'border-stone-200 hover:border-stone-300'
                }`}
                onMouseEnter={() => setHoveredCell(`bin-${idx}`)}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <div className="text-center mb-2">
                  <span className="text-xs font-mono text-stone-400">#{idx + 1}</span>
                </div>

                <div className="w-full h-16 rounded-md overflow-hidden flex">
                  {cell.components.map((comp, ci) => (
                    <div
                      key={ci}
                      className="h-full transition-all"
                      style={{
                        width: `${(comp.percentage / total) * 100}%`,
                        backgroundColor: getComponentColor(ci),
                      }}
                      title={`${comp.ingredientName}: ${comp.percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>

                <div className="mt-2 space-y-1">
                  {aComp && (
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">A</span>
                      <span className="font-mono text-stone-700">{aComp.percentage.toFixed(1)}%</span>
                    </div>
                  )}
                  {bComp && (
                    <div className="flex justify-between text-xs">
                      <span className="text-stone-500">B</span>
                      <span className="font-mono text-stone-700">{bComp.percentage.toFixed(1)}%</span>
                    </div>
                  )}
                </div>

                {isTotalOff && (
                  <div className="mt-2 text-center">
                    <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                      {total.toFixed(1)}%
                    </span>
                  </div>
                )}

                {isHovered && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-stone-800 text-white text-xs rounded-lg p-3 z-20 min-w-48 shadow-xl">
                    <div className="font-medium mb-2">配方 #{idx + 1}</div>
                    <div className="space-y-1">
                      {cell.components.map((comp, ci) => (
                        <div key={ci} className="flex justify-between gap-4">
                          <span className="text-stone-300">{comp.ingredientName}</span>
                          <span className="font-mono">{comp.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                      <div className="pt-1 mt-1 border-t border-stone-600 flex justify-between font-medium">
                        <span>总计</span>
                        <span className={isTotalOff ? 'text-amber-400' : ''}>{total.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {fixedComponents.length > 0 && (
          <div className="bg-stone-50 rounded-lg p-4">
            <div className="text-xs font-medium text-stone-600 mb-2">🔒 固定成分</div>
            <div className="flex flex-wrap gap-2">
              {fixedComponents.map((comp, idx) => (
                <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-stone-200">
                  {comp.ingredientName}: {comp.percentage}%
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600">三元梯度矩阵 · {matrixData.length} 个配方点</span>
        <span className="text-stone-500">
          {varIngredientA ? getIngredientName(varIngredientA) : 'A'} · {varIngredientB ? getIngredientName(varIngredientB) : 'B'} · {varIngredientC ? getIngredientName(varIngredientC) : 'C'}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 p-6 overflow-x-auto">
        <div className="min-w-fit">
          {Array.from({ length: steps + 1 }).map((_, rowIdx) => {
            const rowCells = (matrixData as TernaryCell[]).filter(c => c.row === rowIdx);
            const indent = (steps - rowIdx) * 0.5;

            return (
              <div
                key={rowIdx}
                className="flex gap-2 mb-2"
                style={{ paddingLeft: `${indent}rem` }}
              >
                {rowCells.map((cell, colIdx) => {
                  const total = cell.components.reduce((sum, c) => sum + c.percentage, 0);
                  const isHovered = hoveredCell === `ter-${rowIdx}-${colIdx}`;

                  return (
                    <div
                      key={colIdx}
                      className={`w-20 h-20 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                        isHovered ? 'scale-110 shadow-lg z-10' : 'hover:scale-105'
                      }`}
                      style={{
                        background: `conic-gradient(
                          ${getComponentColor(0)} ${cell.components[cell.components.length - 3]?.percentage || 33}%,
                          ${getComponentColor(1)} ${cell.components[cell.components.length - 2]?.percentage || 33}%,
                          ${getComponentColor(2)} ${cell.components[cell.components.length - 1]?.percentage || 33}%
                        )`,
                      }}
                      onMouseEnter={() => setHoveredCell(`ter-${rowIdx}-${colIdx}`)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={cell.label}
                    >
                      <span className="text-xs font-mono text-white drop-shadow-md bg-black/30 px-2 py-0.5 rounded">
                        {cell.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6 justify-center text-sm">
        {[varIngredientA || 'A', varIngredientB || 'B', varIngredientC || 'C'].map((ing, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: getComponentColor(idx) }}
            />
            <span className="text-stone-600">{getIngredientName(ing)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BinaryCell {
  components: RecipeComponent[];
  label: string;
}

interface TernaryCell {
  components: RecipeComponent[];
  label: string;
  row: number;
  col: number;
}

function generateBinaryMatrix(
  steps: number,
  fixed: RecipeComponent[],
  ingA: string,
  ingB: string
): BinaryCell[] {
  const results: BinaryCell[] = [];
  const totalFixed = fixed.reduce((sum, c) => sum + c.percentage, 0);
  const variableTotal = 100 - totalFixed;

  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const amountA = variableTotal * ratio;
    const amountB = variableTotal * (1 - ratio);

    results.push({
      components: [
        ...fixed.map(f => ({ ...f })),
        { ingredientId: ingA, ingredientName: ingA, percentage: amountA, locked: false },
        { ingredientId: ingB, ingredientName: ingB, percentage: amountB, locked: false },
      ],
      label: `${i + 1}`,
    });
  }

  return results;
}

function generateTernaryMatrix(
  steps: number,
  fixed: RecipeComponent[],
  ingA: string,
  ingB: string,
  ingC: string
): TernaryCell[] {
  const results: TernaryCell[] = [];
  const totalFixed = fixed.reduce((sum, c) => sum + c.percentage, 0);
  const variableTotal = 100 - totalFixed;

  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps - i; j++) {
      const k = steps - i - j;
      results.push({
        components: [
          ...fixed.map(f => ({ ...f })),
          { ingredientId: ingA, ingredientName: ingA, percentage: (i / steps) * variableTotal, locked: false },
          { ingredientId: ingB, ingredientName: ingB, percentage: (j / steps) * variableTotal, locked: false },
          { ingredientId: ingC, ingredientName: ingC, percentage: (k / steps) * variableTotal, locked: false },
        ],
        label: `${i}-${j}-${k}`,
        row: i,
        col: j,
      });
    }
  }

  return results;
}

function getComponentColor(index: number): string {
  const colors = [
    '#f59e0b',
    '#3b82f6',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#f97316',
    '#06b6d4',
  ];
  return colors[index % colors.length];
}
