import { GameState, Position, GameEvent, GameResult, Cell } from './types';

export function getCellAt(state: GameState, pos: Position): Cell | undefined {
  return state.board.cells.find(c => c.position.x === pos.x && c.position.y === pos.y);
}

export function isValidPosition(state: GameState, pos: Position): boolean {
  if (pos.x < 0 || pos.y < 0 || pos.x >= state.board.width || pos.y >= state.board.height) return false;
  const cell = getCellAt(state, pos);
  if (!cell) return false;
  if (cell.type === 'wall') return false;
  if (cell.type === 'door' && !cell.activated) return false;
  return true;
}

export function movePlayer(state: GameState, playerNum: 1 | 2, direction: Position): { state: GameState; moved: boolean; description: string } {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = playerNum === 1 ? newState.player1 : newState.player2;
  const newPos = { x: player.position.x + direction.x, y: player.position.y + direction.y };

  if (!isValidPosition(newState, newPos)) {
    return { state: newState, moved: false, description: `玩家${playerNum}被阻挡` };
  }

  player.position = newPos;

  const cell = getCellAt(newState, newPos);
  let description = `玩家${playerNum}移动到(${newPos.x},${newPos.y})`;

  if (cell?.type === 'crystal') {
    player.crystals += 1;
    cell.type = 'empty';
    cell.label = undefined;
    description += `，收集到琉璃晶`;
    triggerEventByType(newState, 'crystal');
  }

  if (cell?.type === 'switch' && !cell.activated && cell.linkedMechanismId) {
    cell.activated = true;
    player.switchesActivated.push(cell.id);
    const mechanism = newState.board.cells.find(c => c.id === cell.linkedMechanismId);
    if (mechanism) {
      mechanism.activated = true;
      if (mechanism.id === 'hidden_path') {
        newState.hiddenTriggered = true;
      }
    }
    description += `，激活了${cell.label}`;
    triggerEventByType(newState, 'switch');
  }

  newState.turn += 1;
  triggerEventByType(newState, 'step');

  checkWinLose(newState);

  return { state: newState, moved: true, description };
}

export function triggerEventByType(state: GameState, trigger: GameEvent['trigger']) {
  for (const event of state.events) {
    if (event.trigger === trigger && !event.choices) {
      applyEventEffect(state, event.effect);
      if (!state.eventHistory.includes(event.id)) {
        state.eventHistory.push(event.id);
      }
    }
  }
}

export function applyEventEffect(state: GameState, effect: GameEvent['effect']) {
  if (effect.lineValue !== undefined) state.lineValue = Math.max(0, state.lineValue + effect.lineValue);
  if (effect.measureSlot !== undefined) state.measureSlot = Math.max(0, state.measureSlot + effect.measureSlot);
  if (effect.balanceMark !== undefined) state.balanceMark = Math.max(0, state.balanceMark + effect.balanceMark);
  if (effect.wuRisk !== undefined) state.wuRisk = Math.max(0, state.wuRisk + effect.wuRisk);
  if (effect.dingReward !== undefined) state.dingReward = Math.max(0, state.dingReward + effect.dingReward);
  if (effect.weiFailFactor !== undefined) state.weiFailFactor = Math.max(0, state.weiFailFactor + effect.weiFailFactor);
  if (effect.crystals !== undefined) {
    state.player1.crystals = Math.max(0, state.player1.crystals + effect.crystals);
    state.player2.crystals = Math.max(0, state.player2.crystals + effect.crystals);
  }
}

export function useManualEvent(state: GameState, eventId: string, choiceIndex?: number): { state: GameState; success: boolean; description: string } {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const event = newState.events.find(e => e.id === eventId);

  if (!event || event.trigger !== 'manual') {
    return { state: newState, success: false, description: '事件不存在或不可手动触发' };
  }

  if (newState.measureSlot <= 0) {
    return { state: newState, success: false, description: '量测槽不足，无法触发事件' };
  }

  newState.measureSlot -= 1;

  let effect = event.effect;
  let desc = event.title;

  if (event.choices && choiceIndex !== undefined && event.choices[choiceIndex]) {
    effect = event.choices[choiceIndex].effect;
    desc += ` - ${event.choices[choiceIndex].label}`;
  }

  applyEventEffect(newState, effect);
  newState.eventHistory.push(event.id);
  newState.turn += 1;

  checkWinLose(newState);

  return { state: newState, success: true, description: desc };
}

export function checkWinLose(state: GameState): void {
  const p1AtGoal = isAtGoal(state, state.player1.position);
  const p2AtGoal = isAtGoal(state, state.player2.position);

  if (state.lineValue <= 0) {
    state.status = 'lose';
    return;
  }

  if (state.weiFailFactor >= 10) {
    state.status = 'lose';
    return;
  }

  if (p1AtGoal && p2AtGoal) {
    state.status = 'win';
    return;
  }
}

function isAtGoal(state: GameState, pos: Position): boolean {
  const cell = getCellAt(state, pos);
  return cell?.type === 'goal';
}

export function calculateResult(state: GameState, totalSteps: number): GameResult {
  const won = state.status === 'win';
  const cooperationScore = Math.floor(
    state.lineValue * 2 +
    state.balanceMark * 3 +
    state.dingReward * 5 -
    state.wuRisk * 2 -
    state.weiFailFactor * 4 +
    (state.hiddenTriggered ? 50 : 0)
  );

  let details = '';
  if (won) {
    details = `协作闯关成功！`;
    if (state.hiddenTriggered) {
      details += ' 触发了隐藏条件，获得额外奖励！';
    }
    details += ` 共使用 ${totalSteps} 步完成。`;
  } else {
    if (state.lineValue <= 0) {
      details = '描线值耗尽，协作失败。';
    } else if (state.weiFailFactor >= 10) {
      details = '未号失败因子满溢，机关失控。';
    } else {
      details = '闯关未能完成。';
    }
  }

  return {
    levelId: state.levelId,
    won,
    finalLineValue: state.lineValue,
    finalBalanceMark: state.balanceMark,
    dingReward: state.dingReward,
    wuRisk: state.wuRisk,
    weiFailFactor: state.weiFailFactor,
    totalSteps,
    cooperationScore: Math.max(0, cooperationScore),
    hiddenTriggered: state.hiddenTriggered,
    details
  };
}
