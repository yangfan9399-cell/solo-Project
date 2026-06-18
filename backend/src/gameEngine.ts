import { GameSession, MazeConfig, GameField, StepRecord, DifficultyKey, Settlement, GameEvent } from './types';
import { MAZES } from './mazes';

const sessions: Record<string, GameSession> = {};

export function createSession(mazeKey: DifficultyKey): GameSession {
  const maze = MAZES[mazeKey];
  if (!maze) throw new Error(`Maze ${mazeKey} not found`);

  const session: GameSession = {
    id: `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    mazeKey,
    currentPos: { ...maze.startPos },
    path: [{ ...maze.startPos }],
    field: JSON.parse(JSON.stringify(maze.initialField)),
    steps: [
      {
        step: 0,
        position: { ...maze.startPos },
        field: JSON.parse(JSON.stringify(maze.initialField)),
        eventsTriggered: [],
        timestamp: Date.now(),
      },
    ],
    status: 'playing',
    hiddenTriggered: false,
    visitedReverseMarks: [],
    startTime: Date.now(),
  };

  sessions[session.id] = session;
  return session;
}

export function getSession(sessionId: string): GameSession | undefined {
  return sessions[sessionId];
}

export function listMazes(): { key: DifficultyKey; name: string; description: string }[] {
  return Object.values(MAZES).map((m) => ({
    key: m.key,
    name: m.name,
    description: m.description,
  }));
}

export function getMaze(mazeKey: DifficultyKey): MazeConfig {
  const maze = MAZES[mazeKey];
  if (!maze) throw new Error(`Maze ${mazeKey} not found`);
  return maze;
}

function canMove(maze: MazeConfig, from: { x: number; y: number }, to: { x: number; y: number }): boolean {
  if (to.x < 0 || to.x >= maze.width || to.y < 0 || to.y >= maze.height) return false;
  const dx = Math.abs(to.x - from.x);
  const dy = Math.abs(to.y - from.y);
  if (dx + dy !== 1) return false;
  const cell = maze.grid[to.y][to.x];
  return cell.type !== 'wall';
}

function applyEffect(field: GameField, effect: GameEvent['effect']): GameField {
  const newField = { ...field, grooveTracing: [...field.grooveTracing] };
  if (effect.lightValue !== undefined) newField.lightValue += effect.lightValue;
  if (effect.riskA !== undefined) newField.riskA += effect.riskA;
  if (effect.rewardD !== undefined) newField.rewardD += effect.rewardD;
  if (effect.failureB !== undefined) newField.failureB += effect.failureB;
  if (newField.lightValue < 0) newField.lightValue = 0;
  return newField;
}

function checkHiddenTrigger(maze: MazeConfig, session: GameSession, field: GameField): string | null {
  if (!maze.hiddenTrigger || session.hiddenTriggered) return null;
  const t = maze.hiddenTrigger;
  let triggered = false;
  if (t.type === 'path_count' && session.path.length >= t.value) triggered = true;
  if (t.type === 'light_threshold' && field.lightValue >= t.value) triggered = true;
  if (t.type === 'reverse_mark' && field.reverseMark >= t.value) triggered = true;
  return triggered ? t.eventId : null;
}

export function move(sessionId: string, toPos: { x: number; y: number }): GameSession {
  const session = sessions[sessionId];
  if (!session) throw new Error('Session not found');
  if (session.status !== 'playing') throw new Error('Game already ended');

  const maze = MAZES[session.mazeKey];
  if (!canMove(maze, session.currentPos, toPos)) {
    throw new Error('Invalid move');
  }

  const cell = maze.grid[toPos.y][toPos.x];
  let newField = applyEffect(session.field, { lightValue: -1 });

  if (cell.groove) {
    if (!newField.grooveTracing.includes(cell.groove)) {
      newField.grooveTracing.push(cell.groove);
      newField.lightValue += 1;
    }
  }
  if (cell.reverseMark) {
    const markId = `rm_${cell.x}_${cell.y}`;
    if (!session.visitedReverseMarks.includes(markId)) {
      session.visitedReverseMarks.push(markId);
      newField.reverseMark += 1;
    }
  }

  const triggered: string[] = [];

  if (cell.eventId && cell.type !== 'hidden') {
    const evt = maze.events[cell.eventId];
    if (evt) {
      newField = applyEffect(newField, evt.effect);
      triggered.push(evt.id);
    }
  }

  const hiddenEvtId = checkHiddenTrigger(maze, { ...session, path: [...session.path, toPos] }, newField);
  if (hiddenEvtId) {
    session.hiddenTriggered = true;
    triggered.push(hiddenEvtId);
    newField.lightValue += 8;
    newField.rewardD += 3;
  }

  if (cell.type === 'hidden') {
    if (session.hiddenTriggered) {
      newField.lightValue += 4;
      newField.rewardD += 2;
      triggered.push(cell.eventId || 'hidden_revealed');
    }
  }

  session.currentPos = { ...toPos };
  session.path.push({ ...toPos });
  session.field = newField;

  const record: StepRecord = {
    step: session.steps.length,
    position: { ...toPos },
    field: JSON.parse(JSON.stringify(newField)),
    eventsTriggered: triggered,
    timestamp: Date.now(),
  };
  session.steps.push(record);

  let winThreshold = 8;
  if (maze.key === 'D') winThreshold = 5;
  if (maze.key === 'B' && session.hiddenTriggered) winThreshold = 4;

  if (toPos.x === maze.endPos.x && toPos.y === maze.endPos.y && newField.lightValue >= winThreshold) {
    session.status = 'won';
  }
  if (newField.failureB >= (maze.key === 'D' ? 3 : 5) || newField.lightValue <= 0) {
    session.status = 'lost';
  }

  return session;
}

export function calculateSettlement(sessionId: string): Settlement {
  const session = sessions[sessionId];
  if (!session) throw new Error('Session not found');
  const maze = MAZES[session.mazeKey];

  const lightScore = Math.max(0, session.field.lightValue) * 10;
  const stepPenalty = Math.max(0, session.path.length - 8) * 2;
  const stepScore = Math.max(0, 100 - stepPenalty);
  let bonusScore = session.field.rewardD * 15 - session.field.riskA * 8 - session.field.failureB * 10;
  if (session.hiddenTriggered) bonusScore += 50;

  const finalScore = lightScore + stepScore + Math.max(0, bonusScore);
  let grade = 'D';
  if (finalScore >= 250) grade = 'S';
  else if (finalScore >= 200) grade = 'A';
  else if (finalScore >= 150) grade = 'B';
  else if (finalScore >= 100) grade = 'C';

  if (session.status === 'lost') grade = 'F';

  const details: string[] = [];
  details.push(`蜡封迷宫点亮值: ${session.field.lightValue} (×10 = ${lightScore}分)`);
  details.push(`路径解谜步骤数: ${session.path.length} (${stepScore}分)`);
  details.push(`丁号奖励: +${session.field.rewardD} × 15`);
  details.push(`甲号风险: -${session.field.riskA} × 8`);
  details.push(`乙号失败因子: -${session.field.failureB} × 10`);
  details.push(`描线槽激活: ${session.field.grooveTracing.length} 段`);
  details.push(`倒排痕数: ${session.field.reverseMark}`);
  if (session.hiddenTriggered) details.push('★ 隐藏条件已触发 +50分');
  details.push(`状态: ${session.status === 'won' ? '推演成功' : session.status === 'lost' ? '推演失败' : '进行中'}`);
  details.push(`使用局: ${maze.name}`);

  return {
    finalScore,
    lightScore,
    stepScore,
    bonusScore: Math.max(0, bonusScore),
    grade,
    details,
  };
}
