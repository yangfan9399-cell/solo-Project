import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import { TileType } from "@cbcp/shared";
import type { Position, MapTile, GameField } from "@cbcp/shared";

const tileLabelMap: Record<string, string> = {
  [TileType.START]: "起",
  [TileType.END]: "终",
  [TileType.PATH]: "",
  [TileType.OBSTACLE]: "障",
  [TileType.CORAL_BELL]: "钟",
  [TileType.SWITCH]: "换",
  [TileType.HAZARD]: "险",
  [TileType.REWARD]: "奖",
  [TileType.TRANSLATE]: "译",
  [TileType.OVERWRITE]: "覆",
};

const circledNumbers = [
  "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
  "⑪", "⑫", "⑬", "⑭", "⑮", "⑯", "⑰", "⑱", "⑲", "⑳",
];

const isAdjacent = (a: Position, b: Position) => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

interface FieldBadgeDef {
  key: keyof GameField;
  label: string;
}

const fieldBadgeDefs: FieldBadgeDef[] = [
  { key: "trackSwitchValue", label: "珊瑚钟室换轨值" },
  { key: "translationSlot", label: "珊瑚钟室转译槽" },
  { key: "overwriteMark", label: "珊瑚钟室复写痕" },
  { key: "siRisk", label: "巳号风险" },
  { key: "shenReward", label: "申号奖励" },
  { key: "wuFailFactor", label: "午号失败因子" },
];

function BoardPanel() {
  const {
    currentLevelId,
    levels,
    currentField,
    currentPosition,
    selectedTile,
    moveTile,
    setSelectedTile,
    currentStepIdx,
    steps,
  } = useGameStore();

  const level = levels.find((l) => l.id === currentLevelId);
  const isLatestStep = steps.length === 0 || currentStepIdx === steps.length - 1;

  const pathStepMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!level) return map;
    for (let i = 0; i <= currentStepIdx && i < steps.length; i++) {
      const step = steps[i];
      const key = `${step.positionTo.x},${step.positionTo.y}`;
      if (!map.has(key)) {
        map.set(key, i);
      }
    }
    return map;
  }, [steps, currentStepIdx, level]);

  const handleTileClick = (x: number, y: number) => {
    if (!level || !currentPosition) return;
    const pos: Position = { x, y };

    const tile = level.map.tiles[y]?.[x];
    if (!tile) return;
    if (tile.type === TileType.OBSTACLE) return;

    if (isAdjacent(currentPosition, pos) && isLatestStep) {
      moveTile(pos);
    } else {
      setSelectedTile(
        selectedTile && selectedTile.x === x && selectedTile.y === y ? null : pos
      );
    }
  };

  const getTileClasses = (
    tile: MapTile,
    x: number,
    y: number
  ): string => {
    const classes: string[] = [`tile-${tile.type}`];

    if (currentPosition && currentPosition.x === x && currentPosition.y === y) {
      classes.push("tile-current");
    }

    if (
      currentPosition &&
      isLatestStep &&
      isAdjacent(currentPosition, { x, y }) &&
      tile.type !== TileType.OBSTACLE
    ) {
      classes.push("tile-adjacent");
    }

    if (selectedTile && selectedTile.x === x && selectedTile.y === y) {
      classes.push("tile-selected");
    }

    return classes.join(" ");
  };

  const renderPathMarker = (x: number, y: number) => {
    const key = `${x},${y}`;
    const stepIdx = pathStepMap.get(key);
    if (stepIdx === undefined) return null;
    const displayNum = stepIdx + 1;
    const label =
      displayNum <= circledNumbers.length
        ? circledNumbers[displayNum - 1]
        : `${displayNum}`;
    return <div className="tile-path-marker">{label}</div>;
  };

  if (!level) {
    return (
      <div className="panel">
        <div className="panel-title">珊瑚钟室路径解谜游戏 局面盘</div>
        <div className="empty-state">
          <div>
            <div className="empty-state-icon">🗺️</div>
            <div className="empty-state-title">尚未加载关卡</div>
            <div>请在上方选择关卡开始游戏</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">珊瑚钟室路径解谜游戏 局面盘</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minHeight: 0 }}>
        <div className="map-header">
          <div className="map-name">{level.map.name}</div>
          <div className="map-desc">{level.map.description}</div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
            minHeight: 0,
          }}
        >
          <div
            className="tile-grid"
            style={{
              gridTemplateColumns: `repeat(${level.map.width}, 48px)`,
              gridTemplateRows: `repeat(${level.map.height}, 48px)`,
            }}
          >
            {level.map.tiles.map((row, y) =>
              row.map((tile, x) => {
                const stepIndexAtPos = pathStepMap.get(`${x},${y}`);
                const isWalkableAdjacent =
                  currentPosition &&
                  isLatestStep &&
                  isAdjacent(currentPosition, { x, y }) &&
                  tile.type !== TileType.OBSTACLE;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={getTileClasses(tile, x, y)}
                    onClick={() => handleTileClick(x, y)}
                    style={{
                      cursor:
                        tile.type === TileType.OBSTACLE
                          ? "not-allowed"
                          : isWalkableAdjacent
                            ? "pointer"
                            : "default",
                    }}
                    title={
                      tile.note ||
                      `${tile.type} (${x},${y})${
                        stepIndexAtPos !== undefined
                          ? ` · 第${stepIndexAtPos + 1}步`
                          : ""
                      }`
                    }
                  >
                    {tile.label || tileLabelMap[tile.type] || ""}
                    {renderPathMarker(x, y)}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {currentField && (
          <div className="field-badges">
            {fieldBadgeDefs.map((def) => (
              <div
                key={def.key}
                className={`field-badge field-badge-${def.key}`}
              >
                <span className="field-badge-label">{def.label}</span>
                <span className="field-badge-value">
                  {currentField[def.key]}
                </span>
              </div>
            ))}
          </div>
        )}

        {currentPosition && (
          <div
            style={{
              fontSize: 12,
              color: "var(--coral-text-muted)",
              textAlign: "center",
            }}
          >
            当前位置：({currentPosition.x}, {currentPosition.y})
            {!isLatestStep && " · 回放模式（移动请回到最新步）"}
          </div>
        )}

        {level.tutorial && (
          <details className="tutorial-details" open={false}>
            <summary className="tutorial-summary">
              📖 关卡教程 / 提示
            </summary>
            <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {level.tutorial}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

export default BoardPanel;
