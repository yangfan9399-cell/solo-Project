import {
  GameField,
  GameLevel,
  GameEvent,
  GameEventTrigger,
  Position,
  SettlementResult,
  WinFormula,
  WinFormulaParams,
  TileType
} from "@cbcp/shared";

const cloneField = (field: GameField): GameField => ({ ...field });

const positionsEqual = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

const isAdjacent = (a: Position, b: Position): boolean => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx + dy === 1;
};

const getTile = (level: GameLevel, p: Position): TileType | null => {
  if (p.y < 0 || p.y >= level.map.height) return null;
  if (p.x < 0 || p.x >= level.map.width) return null;
  return level.map.tiles[p.y][p.x].type;
};

const isWalkable = (t: TileType | null): boolean => {
  if (t === null) return false;
  return t !== TileType.OBSTACLE;
};

const evaluateTrigger = (
  trigger: GameEventTrigger,
  currentPos: Position,
  stepIndex: number,
  field: GameField
): boolean => {
  switch (trigger.type) {
    case "position":
      return !!trigger.position && positionsEqual(currentPos, trigger.position);
    case "step":
      return trigger.step !== undefined && stepIndex === trigger.step;
    case "value": {
      if (!trigger.value) return false;
      const { field: f, operator, threshold } = trigger.value;
      const current = field[f];
      switch (operator) {
        case ">":
          return current > threshold;
        case "<":
          return current < threshold;
        case ">=":
          return current >= threshold;
        case "<=":
          return current <= threshold;
        case "==":
          return current === threshold;
        case "!=":
          return current !== threshold;
        default:
          return false;
      }
    }
    default:
      return false;
  }
};

const applyEffect = (field: GameField, effect: GameEvent["effect"]): GameField => {
  const next = cloneField(field);
  if (effect.field) {
    if (effect.delta !== undefined) {
      next[effect.field] = next[effect.field] + effect.delta;
    }
    if (effect.setValue !== undefined) {
      next[effect.field] = effect.setValue;
    }
  }
  return next;
};

const evaluateWinFormula = (
  formula: WinFormula,
  params: WinFormulaParams,
  finalField: GameField,
  reachedEnd: boolean,
  triggeredHiddenIds: Set<string>
): { hit: boolean; reason: string } => {
  switch (formula) {
    case WinFormula.REACH_END_WITH_REWARD: {
      const threshold = params.minReward ?? 0;
      const hit = reachedEnd && finalField.shenReward >= threshold;
      return {
        hit,
        reason: hit
          ? `到达终点且 shenReward(${finalField.shenReward}) >= 阈值(${threshold})`
          : reachedEnd
            ? `shenReward(${finalField.shenReward}) 不足阈值(${threshold})`
            : "未到达终点"
      };
    }
    case WinFormula.NO_RISK_AND_REACH: {
      const threshold = params.maxRisk ?? 0;
      const hit = reachedEnd && finalField.siRisk <= threshold;
      return {
        hit,
        reason: hit
          ? `到达终点且 siRisk(${finalField.siRisk}) <= 阈值(${threshold})`
          : reachedEnd
            ? `siRisk(${finalField.siRisk}) 超出阈值(${threshold})`
            : "未到达终点"
      };
    }
    case WinFormula.HIDDEN_TRIGGERED_AND_END: {
      const required = params.requiredHiddenEventIds ?? [];
      const allTriggered = required.every((id) => triggeredHiddenIds.has(id));
      const hit = reachedEnd && allTriggered;
      return {
        hit,
        reason: hit
          ? `隐藏事件已触发且到达终点`
          : reachedEnd
            ? `缺少隐藏事件触发: ${required.filter((id) => !triggeredHiddenIds.has(id)).join(", ")}`
            : "未到达终点"
      };
    }
    default:
      return { hit: false, reason: "未知胜利公式" };
  }
};

const calculateRiskLevel = (siRisk: number): number => {
  if (siRisk <= 0) return 0;
  if (siRisk <= 1) return 1;
  if (siRisk <= 2) return 2;
  if (siRisk <= 4) return 3;
  return 4;
};

export interface SettleInputStep {
  positionFrom: Position;
  positionTo: Position;
}

export const settleGame = (
  level: GameLevel,
  steps: SettleInputStep[],
  initialField: GameField
): SettlementResult => {
  const debugTrace: string[] = [];
  const triggeredHiddenIds = new Set<string>();
  const previouslyTriggered = new Set<string>();

  let currentField = cloneField(initialField);
  let currentPos = { ...level.map.start };
  let reachedEnd = false;

  debugTrace.push(
    `[初始化] 起点=(${currentPos.x},${currentPos.y}) | trackSwitchValue=${currentField.trackSwitchValue} | siRisk=${currentField.siRisk} | shenReward=${currentField.shenReward}`
  );

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepIndex = i + 1;

    if (
      !positionsEqual(currentPos, step.positionFrom)
    ) {
      debugTrace.push(
        `[步骤${stepIndex}] 错误: 起点不匹配。期望(${currentPos.x},${currentPos.y})，实际(${step.positionFrom.x},${step.positionFrom.y})`
      );
      return {
        success: false,
        finalField: currentField,
        totalReward: 0,
        riskLevel: calculateRiskLevel(currentField.siRisk),
        formulaHit: false,
        reason: `步骤${stepIndex}起点不匹配，路径无效`,
        debugTrace
      };
    }

    if (!isAdjacent(step.positionFrom, step.positionTo)) {
      debugTrace.push(
        `[步骤${stepIndex}] 错误: 不相邻移动。(${step.positionFrom.x},${step.positionFrom.y})→(${step.positionTo.x},${step.positionTo.y}) 非上下左右相邻`
      );
      return {
        success: false,
        finalField: currentField,
        totalReward: 0,
        riskLevel: calculateRiskLevel(currentField.siRisk),
        formulaHit: false,
        reason: `步骤${stepIndex}非相邻格子移动，路径无效`,
        debugTrace
      };
    }

    const targetTile = getTile(level, step.positionTo);
    if (!isWalkable(targetTile)) {
      debugTrace.push(
        `[步骤${stepIndex}] 错误: 目标格不可行走。(${step.positionTo.x},${step.positionTo.y}) 类型=${targetTile ?? "越界"}`
      );
      return {
        success: false,
        finalField: currentField,
        totalReward: 0,
        riskLevel: calculateRiskLevel(currentField.siRisk),
        formulaHit: false,
        reason: `步骤${stepIndex}目标格为障碍或越界，路径无效`,
        debugTrace
      };
    }

    currentPos = { ...step.positionTo };
    const fieldBefore = cloneField(currentField);

    currentField.trackSwitchValue = currentField.trackSwitchValue + 1;

    const triggeredThisStep: string[] = [];
    for (const event of level.events) {
      let dedupeKey: string;
      if (event.trigger.type === "position") {
        dedupeKey = `${event.id}-step${stepIndex}-pos(${currentPos.x},${currentPos.y})`;
      } else {
        dedupeKey = `${event.id}-once`;
      }
      if (previouslyTriggered.has(dedupeKey)) continue;

      if (evaluateTrigger(event.trigger, currentPos, stepIndex, currentField)) {
        previouslyTriggered.add(dedupeKey);
        currentField = applyEffect(currentField, event.effect);
        triggeredThisStep.push(event.id);

        if (event.type === "hidden") {
          triggeredHiddenIds.add(event.id);
        }

        debugTrace.push(
          `[步骤${stepIndex}] 触发事件 ${event.id}[${event.type}]: ${event.message}`
        );
      }
    }

    if (positionsEqual(currentPos, level.map.end)) {
      reachedEnd = true;
    }

    debugTrace.push(
      `[步骤${stepIndex}] (${step.positionFrom.x},${step.positionFrom.y})→(${step.positionTo.x},${step.positionTo.y}) | 换轨值: ${fieldBefore.trackSwitchValue}→${currentField.trackSwitchValue} | siRisk: ${fieldBefore.siRisk}→${currentField.siRisk} | shenReward: ${fieldBefore.shenReward}→${currentField.shenReward}${triggeredThisStep.length ? ` | 事件: ${triggeredThisStep.join(",")}` : ""}`
    );
  }

  const stepCount = steps.length;
  const stepPenalty = Math.max(0, stepCount - (level.map.width + level.map.height - 2)) * 0.5;
  const totalReward =
    currentField.shenReward -
    currentField.siRisk * currentField.wuFailFactor -
    stepPenalty;

  const { hit: formulaHit, reason: formulaReason } = evaluateWinFormula(
    level.winFormula,
    level.winFormulaParams,
    currentField,
    reachedEnd,
    triggeredHiddenIds
  );

  const riskLevel = calculateRiskLevel(currentField.siRisk);
  const success = formulaHit;

  debugTrace.push(
    `[结算] 步数=${stepCount} | 步数惩罚=${stepPenalty} | totalReward=${totalReward.toFixed(2)} | riskLevel=${riskLevel}`
  );
  debugTrace.push(`[结果] ${success ? "通关成功" : "通关失败"} - ${formulaReason}`);

  return {
    success,
    finalField: currentField,
    totalReward,
    riskLevel,
    formulaHit,
    reason: formulaReason,
    debugTrace
  };
};
