import type { CellState, GameState, Level, Position, Relic, DiveState, HistoryAction } from "~/types/game";

export function createEmptyGrid(size: number): CellState[][] {
  const grid: CellState[][] = [];
  for (let row = 0; row < size; row++) {
    const rowCells: CellState[] = [];
    for (let col = 0; col < size; col++) {
      rowCells.push({
        sonarScanned: false,
        sonarStrength: 0,
        excavated: false,
        hasRelic: false,
        revealed: false
      });
    }
    grid.push(rowCells);
  }
  return grid;
}

export function placeRelicsOnGrid(grid: CellState[][], relics: Relic[]): CellState[][] {
  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));

  for (const relic of relics) {
    for (let i = 0; i < relic.size; i++) {
      const row = relic.orientation === "horizontal" ? relic.position.row : relic.position.row + i;
      const col = relic.orientation === "horizontal" ? relic.position.col + i : relic.position.col;

      if (row >= 0 && row < newGrid.length && col >= 0 && col < newGrid[0].length) {
        newGrid[row][col].hasRelic = true;
        newGrid[row][col].relicId = relic.id;
      }
    }
  }

  return newGrid;
}

export function initGameState(level: Level): GameState {
  let cells = createEmptyGrid(level.gridSize);
  cells = placeRelicsOnGrid(cells, level.relics);

  return {
    levelId: level.id,
    gridSize: level.gridSize,
    cells,
    relics: level.relics.map((r) => ({ ...r, discovered: false })),
    currentDive: {
      diveNumber: 1,
      sonarUsed: 0,
      cellsExcavated: 0
    },
    maxDives: level.maxDives,
    sonarPerDive: level.sonarPerDive,
    turbidity: level.turbidity,
    discoveredRelics: [],
    score: 0,
    gameStatus: "playing",
    startTime: Date.now()
  };
}

export function calculateSonarStrength(
  grid: CellState[][],
  pos: Position,
  turbidity: number
): number {
  const { row, col } = pos;
  const size = grid.length;
  let maxStrength = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].hasRelic) {
        const distance = Math.sqrt(Math.pow(r - row, 2) + Math.pow(c - col, 2));
        const baseStrength = Math.max(0, 100 - distance * 15);
        maxStrength = Math.max(maxStrength, baseStrength);
      }
    }
  }

  const noise = (Math.random() - 0.5) * turbidity * 0.5;
  const finalStrength = Math.max(0, Math.min(100, maxStrength + noise));

  return Math.round(finalStrength);
}

export function performSonarScan(
  state: GameState,
  pos: Position
): { state: GameState; action: HistoryAction } | null {
  if (state.gameStatus !== "playing") return null;
  if (state.currentDive.sonarUsed >= state.sonarPerDive) return null;
  if (state.cells[pos.row][pos.col].sonarScanned) return null;

  const previousState = {
    cells: state.cells.map((row) => row.map((cell) => ({ ...cell }))),
    discoveredRelics: [...state.discoveredRelics],
    score: state.score,
    currentDive: { ...state.currentDive }
  };

  const newCells = state.cells.map((row) => row.map((cell) => ({ ...cell })));
  const strength = calculateSonarStrength(newCells, pos, state.turbidity);
  newCells[pos.row][pos.col].sonarScanned = true;
  newCells[pos.row][pos.col].sonarStrength = strength;

  const newState: GameState = {
    ...state,
    cells: newCells,
    currentDive: {
      ...state.currentDive,
      sonarUsed: state.currentDive.sonarUsed + 1
    }
  };

  const action: HistoryAction = {
    type: "sonar",
    position: pos,
    timestamp: Date.now(),
    previousState
  };

  return { state: newState, action };
}

export function excavateCell(
  state: GameState,
  pos: Position
): { state: GameState; action: HistoryAction; discoveredRelic?: Relic } | null {
  if (state.gameStatus !== "playing") return null;
  if (state.cells[pos.row][pos.col].excavated) return null;

  const previousState = {
    cells: state.cells.map((row) => row.map((cell) => ({ ...cell }))),
    discoveredRelics: [...state.discoveredRelics],
    score: state.score,
    currentDive: { ...state.currentDive }
  };

  const newCells = state.cells.map((row) => row.map((cell) => ({ ...cell })));
  newCells[pos.row][pos.col].excavated = true;
  newCells[pos.row][pos.col].revealed = true;

  let discoveredRelic: Relic | undefined;
  let newDiscoveredRelics = [...state.discoveredRelics];
  let newScore = state.score;
  const newRelics = state.relics.map((r) => ({ ...r }));

  const cell = newCells[pos.row][pos.col];
  if (cell.hasRelic && cell.relicId) {
    const relic = newRelics.find((r) => r.id === cell.relicId);
    if (relic && !relic.discovered) {
      const allCellsDiscovered = checkRelicFullyDiscovered(newCells, relic);
      if (allCellsDiscovered) {
        relic.discovered = true;
        newDiscoveredRelics.push(relic.id);
        newScore += relic.points;
        discoveredRelic = relic;
      }
    }
  }

  const newState: GameState = {
    ...state,
    cells: newCells,
    relics: newRelics,
    discoveredRelics: newDiscoveredRelics,
    score: newScore,
    currentDive: {
      ...state.currentDive,
      cellsExcavated: state.currentDive.cellsExcavated + 1
    }
  };

  const action: HistoryAction = {
    type: "excavate",
    position: pos,
    timestamp: Date.now(),
    previousState
  };

  return { state: newState, action, discoveredRelic };
}

function checkRelicFullyDiscovered(grid: CellState[][], relic: Relic): boolean {
  for (let i = 0; i < relic.size; i++) {
    const row = relic.orientation === "horizontal" ? relic.position.row : relic.position.row + i;
    const col = relic.orientation === "horizontal" ? relic.position.col + i : relic.position.col;

    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      if (!grid[row][col].excavated) {
        return false;
      }
    }
  }
  return true;
}

export function nextDive(state: GameState): { state: GameState; action: HistoryAction } | null {
  if (state.gameStatus !== "playing") return null;
  if (state.currentDive.diveNumber >= state.maxDives) return null;

  const previousState = {
    cells: state.cells.map((row) => row.map((cell) => ({ ...cell }))),
    discoveredRelics: [...state.discoveredRelics],
    score: state.score,
    currentDive: { ...state.currentDive }
  };

  const newState: GameState = {
    ...state,
    currentDive: {
      diveNumber: state.currentDive.diveNumber + 1,
      sonarUsed: 0,
      cellsExcavated: 0
    }
  };

  const action: HistoryAction = {
    type: "new_dive",
    timestamp: Date.now(),
    previousState
  };

  return { state: newState, action };
}

export function checkGameEnd(
  state: GameState,
  requiredRelics: number
): { ended: boolean; won: boolean } {
  if (state.discoveredRelics.length >= requiredRelics) {
    return { ended: true, won: true };
  }

  const allDivesUsed = state.currentDive.diveNumber >= state.maxDives;
  const sonarAndExcavationExhausted =
    state.currentDive.sonarUsed >= state.sonarPerDive;

  if (allDivesUsed && sonarAndExcavationExhausted) {
    return { ended: true, won: false };
  }

  return { ended: false, won: false };
}

export function getPositionLabel(row: number, col: number): string {
  const colLabel = String.fromCharCode(65 + col);
  const rowLabel = row + 1;
  return `${colLabel}${rowLabel}`;
}

export function parsePositionLabel(label: string): Position | null {
  if (label.length < 2) return null;
  const col = label.charCodeAt(0) - 65;
  const row = parseInt(label.slice(1), 10) - 1;
  if (col < 0 || col > 25 || isNaN(row) || row < 0) return null;
  return { row, col };
}

export function getSonarStrengthColor(strength: number): string {
  if (strength >= 80) return "#ff6b6b";
  if (strength >= 60) return "#ffa94d";
  if (strength >= 40) return "#ffd43b";
  if (strength >= 20) return "#69db7c";
  return "#74c0fc";
}

export function countTotalSonarScans(state: GameState): number {
  let count = 0;
  for (const row of state.cells) {
    for (const cell of row) {
      if (cell.sonarScanned) count++;
    }
  }
  return count;
}
