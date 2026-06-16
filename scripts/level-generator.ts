import type { Level, PuzzlePiece, Crack } from '../src/lib/types';
import { v4 as uuidv4 } from 'uuid';

export interface PatternColor {
  bg: string;
  fg: string;
  accent: string;
}

export const PATTERN_PALETTES: Record<string, PatternColor[]> = {
  dragon: [
    { bg: '#8B4513', fg: '#FFD700', accent: '#FF6347' },
    { bg: '#A0522D', fg: '#FFA500', accent: '#DC143C' },
  ],
  floral: [
    { bg: '#F5DEB3', fg: '#FF69B4', accent: '#32CD32' },
    { bg: '#FFE4C4', fg: '#FFB6C1', accent: '#90EE90' },
  ],
  cloud: [
    { bg: '#4682B4', fg: '#FFFFFF', accent: '#87CEEB' },
    { bg: '#5F9EA0', fg: '#F0FFFF', accent: '#ADD8E6' },
  ],
  fu: [
    { bg: '#B22222', fg: '#FFD700', accent: '#8B0000' },
    { bg: '#800000', fg: '#FFE4B5', accent: '#DC143C' },
  ],
  longevity: [
    { bg: '#2F4F4F', fg: '#98FB98', accent: '#8FBC8F' },
  ],
  coin: [
    { bg: '#DAA520', fg: '#8B4513', accent: '#CD853F' },
  ],
};

export const SEED_LEVELS: Omit<Level, 'id'>[] = [
  {
    name: '入门·牡丹影壁',
    description: '明代民居遗存的小型影壁，中央为牡丹缠枝纹样。碎片较少，排列整齐，适合初识修复之道。',
    difficulty: 'easy',
    gridRows: 3,
    gridCols: 3,
    layers: 1,
    timeLimit: 600,
    baseScore: 1000,
    era: '明代',
    location: '皖南·宏村',
    patternType: '牡丹缠枝',
  },
  {
    name: '进阶·云龙戏珠',
    description: '清代官宅的大型影壁，中央团龙盘旋，四周祥云环绕。分组难度提升，时间考验耐心。',
    difficulty: 'medium',
    gridRows: 4,
    gridCols: 4,
    layers: 2,
    timeLimit: 900,
    baseScore: 2500,
    era: '清代',
    location: '京城·恭王府',
    patternType: '云龙戏珠',
  },
  {
    name: '挑战·万福同春',
    description: '皇家园林影壁，百福字嵌于万字锦地中。多层拼接，碎片错杂，裂缝密布。非老手不可为也。',
    difficulty: 'hard',
    gridRows: 5,
    gridCols: 5,
    layers: 2,
    timeLimit: 1200,
    baseScore: 5000,
    era: '清代',
    location: '紫禁城·宁寿宫',
    patternType: '万福同春',
  },
  {
    name: '宗师·山海长寿',
    description: '出土于明代王陵的巨型影壁残件，纹样含山海、寿字、八仙、暗八宝。三层叠加，碎片散乱，修复此壁者当称宗师。',
    difficulty: 'master',
    gridRows: 6,
    gridCols: 6,
    layers: 3,
    timeLimit: 1800,
    baseScore: 10000,
    era: '明代',
    location: '金陵·明孝陵',
    patternType: '山海长寿',
  },
];

function generatePatternSVG(patternType: string, row: number, col: number, layer: number, palette: PatternColor): string {
  const cellSize = 100;
  const offsetX = col * cellSize;
  const offsetY = row * cellSize;
  const seed = (row * 7 + col * 13 + layer * 17) % 100;

  let shapes = '';

  shapes += `<rect x="2" y="2" width="96" height="96" fill="${palette.bg}" rx="4"/>`;
  shapes += `<rect x="2" y="2" width="96" height="96" fill="url(#paperTex)" opacity="0.15" rx="4"/>`;

  if (patternType === '牡丹缠枝' || patternType === 'floral') {
    const cx = 50 + Math.sin(seed) * 15;
    const cy = 50 + Math.cos(seed) * 15;
    shapes += `<circle cx="${cx}" cy="${cy}" r="28" fill="${palette.fg}" opacity="0.9"/>`;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + seed * 0.1;
      shapes += `<circle cx="${cx + Math.cos(a) * 20}" cy="${cy + Math.sin(a) * 20}" r="12" fill="${palette.fg}" opacity="0.7"/>`;
    }
    shapes += `<circle cx="${cx}" cy="${cy}" r="10" fill="${palette.accent}"/>`;
    shapes += `<path d="M${cx - 30},${cy + 10} Q${cx - 10},${cy + 25} ${cx + 5},${cy + 15}" stroke="${palette.accent}" stroke-width="3" fill="none"/>`;
  } else if (patternType === '云龙戏珠' || patternType === 'dragon') {
    const cx = 50;
    const cy = 50;
    shapes += `<circle cx="${cx}" cy="${cy}" r="32" fill="${palette.fg}" opacity="0.3"/>`;
    shapes += `<path d="M${cx - 30},${cy} Q${cx - 15},${cy - 25} ${cx},${cy - 15} Q${cx + 15},${cy - 25} ${cx + 30},${cy} Q${cx + 15},${cy + 25} ${cx},${cy + 15} Q${cx - 15},${cy + 25} ${cx - 30},${cy} Z" fill="${palette.fg}" opacity="0.85"/>`;
    shapes += `<circle cx="${cx}" cy="${cy}" r="8" fill="${palette.accent}"/>`;
    shapes += `<circle cx="${cx - 35}" cy="${cy - 10}" r="14" fill="${palette.fg}" opacity="0.6"/>`;
    shapes += `<circle cx="${cx + 35}" cy="${cy + 10}" r="14" fill="${palette.fg}" opacity="0.6"/>`;
  } else if (patternType === '万福同春' || patternType === 'fu') {
    shapes += `<rect x="15" y="15" width="70" height="70" fill="${palette.fg}" opacity="0.1" rx="4"/>`;
    shapes += `<text x="50" y="68" text-anchor="middle" font-size="58" font-family="serif" font-weight="900" fill="${palette.fg}" opacity="0.95">福</text>`;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      shapes += `<circle cx="${50 + Math.cos(a) * 40}" cy="${50 + Math.sin(a) * 40}" r="4" fill="${palette.accent}"/>`;
    }
  } else if (patternType === '山海长寿' || patternType === 'longevity') {
    shapes += `<path d="M10,70 Q25,50 40,65 Q55,45 70,60 Q85,50 90,70 L90,90 L10,90 Z" fill="${palette.fg}" opacity="0.7"/>`;
    shapes += `<circle cx="50" cy="30" r="18" fill="${palette.accent}" opacity="0.6"/>`;
    shapes += `<text x="50" y="80" text-anchor="middle" font-size="28" font-family="serif" font-weight="700" fill="${palette.bg}">寿</text>`;
    shapes += `<polygon points="75,15 77,22 84,22 78,26 80,33 75,29 70,33 72,26 66,22 73,22" fill="${palette.fg}"/>`;
  } else if (patternType === 'cloud') {
    shapes += `<path d="M20,50 Q30,35 45,40 Q50,25 65,35 Q80,30 80,50 Q80,60 65,60 Q50,65 35,58 Q20,60 20,50 Z" fill="${palette.fg}" opacity="0.85"/>`;
    shapes += `<circle cx="30" cy="45" r="6" fill="${palette.accent}" opacity="0.5"/>`;
    shapes += `<circle cx="70" cy="48" r="5" fill="${palette.accent}" opacity="0.5"/>`;
  } else {
    shapes += `<rect x="10" y="10" width="80" height="80" fill="${palette.fg}" opacity="0.5" rx="8"/>`;
    shapes += `<circle cx="50" cy="50" r="25" fill="${palette.accent}" opacity="0.6"/>`;
    shapes += `<rect x="40" y="40" width="20" height="20" fill="${palette.bg}"/>`;
  }

  shapes += `<rect x="2" y="2" width="96" height="96" fill="none" stroke="${palette.accent}" stroke-width="2" opacity="0.4" rx="4"/>`;

  const defs = `<defs><pattern id="paperTex" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="0.5" fill="#000" opacity="0.2"/></pattern></defs>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${defs}${shapes}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function pickPalette(patternType: string, row: number, col: number): PatternColor {
  const typeMap: Record<string, string> = {
    '牡丹缠枝': 'floral',
    '云龙戏珠': 'dragon',
    '万福同春': 'fu',
    '山海长寿': 'longevity',
  };
  const key = typeMap[patternType] || 'floral';
  const palettes = PATTERN_PALETTES[key] || PATTERN_PALETTES.floral;
  const idx = (row + col) % palettes.length;
  return palettes[idx];
}

function generateGroupId(row: number, col: number, layer: number, rows: number, cols: number): string {
  const groupSize = 4;
  const gRow = Math.floor(row / (rows > 4 ? 2 : 1));
  const gCol = Math.floor(col / (cols > 4 ? 2 : 1));
  return `g-${layer}-${gRow}-${gCol}`;
}

function generateCrackPoints(rowA: number, colA: number, layerA: number, rowB: number, colB: number, layerB: number): string {
  const x1 = 50 + (rowA % 2 === 0 ? -20 : 20);
  const y1 = 50 + (colA % 2 === 0 ? -20 : 20);
  const x2 = 50 + (rowB % 2 === 0 ? -20 : 20);
  const y2 = 50 + (colB % 2 === 0 ? -20 : 20);
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * 20;
  const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
  return `${x1},${y1} ${mx},${my} ${x2},${y2}`;
}

export function generateLevelData(levelId: number, level: Omit<Level, 'id'>): { pieces: PuzzlePiece[]; cracks: Crack[] } {
  const pieces: PuzzlePiece[] = [];
  const cracks: Crack[] = [];
  const idMap = new Map<string, string>();

  for (let layer = 0; layer < level.layers; layer++) {
    for (let row = 0; row < level.gridRows; row++) {
      for (let col = 0; col < level.gridCols; col++) {
        const palette = pickPalette(level.patternType, row, col);
        const pieceId = uuidv4();
        idMap.set(`${layer}-${row}-${col}`, pieceId);

        pieces.push({
          id: pieceId,
          levelId,
          row,
          col,
          layer,
          groupId: generateGroupId(row, col, layer, level.gridRows, level.gridCols),
          patternData: generatePatternSVG(level.patternType, row, col, layer, palette),
          baseRotation: 0,
        });
      }
    }
  }

  const crackSeed = levelId * 31;
  let crackIdx = 0;

  for (let layer = 0; layer < level.layers; layer++) {
    for (let row = 0; row < level.gridRows; row++) {
      for (let col = 0; col < level.gridCols; col++) {
        const idA = idMap.get(`${layer}-${row}-${col}`)!;

        if (col + 1 < level.gridCols) {
          const shouldCrack = ((row * 7 + col * 3 + crackSeed + crackIdx) % 5) < 2;
          if (shouldCrack) {
            const idB = idMap.get(`${layer}-${row}-${col + 1}`)!;
            cracks.push({
              id: uuidv4(),
              levelId,
              pieceIdA: idA,
              pieceIdB: idB,
              points: generateCrackPoints(row, col, layer, row, col + 1, layer),
              severity: 1 + (crackIdx % 3),
              type: 'edge',
            });
            crackIdx++;
          }
        }

        if (row + 1 < level.gridRows) {
          const shouldCrack = ((row * 5 + col * 11 + crackSeed + crackIdx) % 5) < 2;
          if (shouldCrack) {
            const idB = idMap.get(`${layer}-${row + 1}-${col}`)!;
            cracks.push({
              id: uuidv4(),
              levelId,
              pieceIdA: idA,
              pieceIdB: idB,
              points: generateCrackPoints(row, col, layer, row + 1, col, layer),
              severity: 1 + (crackIdx % 3),
              type: 'edge',
            });
            crackIdx++;
          }
        }

        if (row + 1 < level.gridRows && col + 1 < level.gridCols) {
          const shouldCrack = ((row * 3 + col * 7 + crackSeed + crackIdx) % 9) < 1;
          if (shouldCrack && level.difficulty !== 'easy') {
            const idB = idMap.get(`${layer}-${row + 1}-${col + 1}`)!;
            cracks.push({
              id: uuidv4(),
              levelId,
              pieceIdA: idA,
              pieceIdB: idB,
              points: generateCrackPoints(row, col, layer, row + 1, col + 1, layer),
              severity: 2 + (crackIdx % 2),
              type: 'diagonal',
            });
            crackIdx++;
          }
        }
      }
    }
  }

  return { pieces, cracks };
}

export function shufflePieces<T extends PuzzlePiece>(pieces: T[]): T[] {
  const arr = [...pieces];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
