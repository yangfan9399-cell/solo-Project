import type {
  ExhibitDef,
  HeatmapCell,
  LevelConfig,
  LightSource,
  PlacedExhibit,
  ScoreBreakdown,
} from "./types";

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function computeHeatmap(
  lights: LightSource[],
  gridW: number,
  gridH: number
): HeatmapCell[][] {
  const heatmap: HeatmapCell[][] = [];
  for (let y = 0; y < gridH; y++) {
    const row: HeatmapCell[] = [];
    for (let x = 0; x < gridW; x++) {
      let total = 0;
      for (const light of lights) {
        const d = distance(x, y, light.x, light.y);
        if (d <= light.radius) {
          const attenuation = 1 - d / light.radius;
          total += light.intensity * attenuation * attenuation;
        }
      }
      row.push({ x, y, intensity: Math.min(100, total) });
    }
    heatmap.push(row);
  }
  return heatmap;
}

export function getExhibitLightLevel(
  exhibit: PlacedExhibit,
  heatmap: HeatmapCell[][],
  def: ExhibitDef
): number {
  let sum = 0;
  let count = 0;
  for (let dy = 0; dy < def.size.h; dy++) {
    for (let dx = 0; dx < def.size.w; dx++) {
      const cx = exhibit.x + dx;
      const cy = exhibit.y + dy;
      if (cy >= 0 && cy < heatmap.length && cx >= 0 && cx < heatmap[0].length) {
        sum += heatmap[cy][cx].intensity;
        count++;
      }
    }
  }
  return count > 0 ? sum / count : 0;
}

export function isExhibitSafe(
  lightLevel: number,
  def: ExhibitDef
): { safe: boolean; score: number } {
  if (lightLevel >= def.lightMin && lightLevel <= def.lightMax) {
    return { safe: true, score: 100 };
  }
  const mid = (def.lightMin + def.lightMax) / 2;
  const range = (def.lightMax - def.lightMin) / 2;
  const deviation = Math.abs(lightLevel - mid) - range;
  const penalty = Math.min(100, (deviation / range) * 100 * def.sensitivity);
  return { safe: penalty < 50, score: Math.max(0, 100 - penalty) };
}

export function isPositionValid(
  x: number,
  y: number,
  size: { w: number; h: number },
  gridW: number,
  gridH: number,
  pathCells: { x: number; y: number }[],
  placed: PlacedExhibit[],
  selfId?: string
): boolean {
  if (x < 0 || y < 0 || x + size.w > gridW || y + size.h > gridH) return false;
  const occupied = new Set<string>();
  for (const p of placed) {
    if (selfId && p.id === selfId) continue;
    for (let dy = 0; dy < size.h; dy++) {
      for (let dx = 0; dx < size.w; dx++) {
        occupied.add(`${p.x + dx},${p.y + dy}`);
      }
    }
  }
  for (let dy = 0; dy < size.h; dy++) {
    for (let dx = 0; dx < size.w; dx++) {
      const key = `${x + dx},${y + dy}`;
      if (occupied.has(key)) return false;
    }
  }
  const pathSet = new Set(pathCells.map((p) => `${p.x},${p.y}`));
  for (let dy = 0; dy < size.h; dy++) {
    for (let dx = 0; dx < size.w; dx++) {
      const key = `${x + dx},${y + dy}`;
      if (pathSet.has(key)) return false;
    }
  }
  return true;
}

export function computeScore(
  exhibits: PlacedExhibit[],
  lights: LightSource[],
  level: LevelConfig,
  exhibitDefs: Record<string, ExhibitDef>
): ScoreBreakdown {
  const heatmap = computeHeatmap(lights, level.gridW, level.gridH);
  
  let exhibitSafetyScore = 0;
  let safeCount = 0;
  for (const ex of exhibits) {
    const def = exhibitDefs[ex.defId];
    if (!def) continue;
    const lightLevel = getExhibitLightLevel(ex, heatmap, def);
    const { score } = isExhibitSafe(lightLevel, def);
    exhibitSafetyScore += score;
    if (score >= 80) safeCount++;
  }
  exhibitSafetyScore = exhibits.length > 0 ? exhibitSafetyScore / exhibits.length : 0;

  const totalLight = lights.reduce((s, l) => s + l.intensity * l.radius, 0);
  const lightEfficiency = Math.max(
    0,
    100 - Math.max(0, (totalLight - level.maxLightTotal) / level.maxLightTotal) * 100
  );

  const pathSet = new Set(level.pathCells.map((p) => `${p.x},${p.y}`));
  let pathLit = 0;
  for (const cell of level.pathCells) {
    const intensity = heatmap[cell.y]?.[cell.x]?.intensity ?? 0;
    if (intensity >= 15) pathLit++;
  }
  const pathVisibility = level.pathCells.length > 0 ? (pathLit / level.pathCells.length) * 100 : 0;

  const coverageBonus = exhibits.length > 0 ? (safeCount / exhibits.length) * 50 : 0;
  const placementQuality = 50 + coverageBonus;

  const penalty = (() => {
    let p = 0;
    for (const ex of exhibits) {
      const def = exhibitDefs[ex.defId];
      if (!def) continue;
      const lightLevel = getExhibitLightLevel(ex, heatmap, def);
      const { safe } = isExhibitSafe(lightLevel, def);
      if (!safe) p += 15;
    }
    if (totalLight > level.maxLightTotal * 1.5) p += 20;
    return Math.min(50, p);
  })();

  const total = Math.max(
    0,
    Math.round(
      exhibitSafetyScore * 0.4 +
        lightEfficiency * 0.2 +
        pathVisibility * 0.25 +
        placementQuality * 0.15 -
        penalty
    )
  );

  return {
    exhibitSafety: Math.round(exhibitSafetyScore),
    lightEfficiency: Math.round(lightEfficiency),
    pathVisibility: Math.round(pathVisibility),
    placementQuality: Math.round(placementQuality),
    penalty,
    total,
  };
}

export function replayOperations<T>(
  ops: { type: string; data: Record<string, unknown> }[],
  initial: T,
  handlers: Record<string, (state: T, data: Record<string, unknown>) => T>
): T {
  let state = initial;
  for (const op of ops) {
    const handler = handlers[op.type];
    if (handler) {
      state = handler(state, op.data);
    }
  }
  return state;
}
