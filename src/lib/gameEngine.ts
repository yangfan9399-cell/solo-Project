import type { GameState, Capsule, Valve, Junction, Pipe, Station, Level, OperationRecord, ActiveAnomaly } from '../types';

export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function createGameState(level: Level, playerId: string): GameState {
  return {
    id: generateId(),
    levelId: level.id,
    playerId,
    startTime: Date.now(),
    currentTime: 0,
    isPaused: false,
    isGameOver: false,
    victory: false,
    score: 0,
    deliveriesCompleted: 0,
    deliveriesFailed: 0,
    valves: JSON.parse(JSON.stringify(level.valves)),
    junctions: JSON.parse(JSON.stringify(level.junctions)),
    pipes: JSON.parse(JSON.stringify(level.pipes)),
    capsules: [],
    stations: JSON.parse(JSON.stringify(level.stations)),
    activeAnomalies: [],
    operationHistory: []
  };
}

export function createOperationRecord(
  type: OperationRecord['type'],
  targetId: string,
  oldValue: unknown,
  newValue: unknown,
  state: GameState
): OperationRecord {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type,
    targetId,
    oldValue,
    newValue,
    gameStateSnapshot: JSON.parse(JSON.stringify(state))
  };
}

export function adjustValve(state: GameState, valveId: string, newPressure: number): GameState {
  const valve = state.valves.find(v => v.id === valveId);
  if (!valve) return state;

  const oldPressure = valve.pressure;
  const clampedPressure = Math.max(valve.minPressure, Math.min(valve.maxPressure, newPressure));
  valve.pressure = clampedPressure;

  const record = createOperationRecord('valve_adjust', valveId, oldPressure, clampedPressure, state);
  state.operationHistory.push(record);

  return state;
}

export function switchJunction(state: GameState, junctionId: string): GameState {
  const junction = state.junctions.find(j => j.id === junctionId);
  if (!junction) return state;

  const directions: Array<Junction['direction']> = ['up', 'right', 'down', 'left'];
  const currentIndex = directions.indexOf(junction.direction);
  const oldDirection = junction.direction;
  junction.direction = directions[(currentIndex + 1) % 4];

  const record = createOperationRecord('junction_switch', junctionId, oldDirection, junction.direction, state);
  state.operationHistory.push(record);

  return state;
}

export function resolveAnomaly(state: GameState, anomalyId: string): GameState {
  const anomaly = state.activeAnomalies.find(a => a.config.id === anomalyId);
  if (!anomaly || anomaly.resolved) return state;

  const oldResolved = anomaly.resolved;
  anomaly.resolved = true;
  state.score += 200 * anomaly.config.severity;

  const record = createOperationRecord('anomaly_resolve', anomalyId, oldResolved, true, state);
  state.operationHistory.push(record);

  return state;
}

function getNodePosition(state: GameState, nodeId: string): { x: number; y: number } {
  const valve = state.valves.find(v => v.id === nodeId);
  if (valve) return { x: valve.x, y: valve.y };

  const junction = state.junctions.find(j => j.id === nodeId);
  if (junction) return { x: junction.x, y: junction.y };

  const station = state.stations.find(s => s.id === nodeId);
  if (station) return { x: station.x, y: station.y };

  return { x: 0, y: 0 };
}

function calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
  return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
}

function findNextNode(state: GameState, capsule: Capsule, destinationId: string): string | null {
  const currentPos = getNodePosition(state, capsule.currentNodeId);
  const destPos = getNodePosition(state, destinationId);

  const connectedPipes = state.pipes.filter(p => p.from === capsule.currentNodeId || p.to === capsule.currentNodeId);
  
  let bestNext: string | null = null;
  let bestDistance = Infinity;

  for (const pipe of connectedPipes) {
    const nextNodeId = pipe.from === capsule.currentNodeId ? pipe.to : pipe.from;
    
    if (nextNodeId === capsule.currentNodeId) continue;
    
    const currentJunction = state.junctions.find(j => j.id === capsule.currentNodeId);
    if (currentJunction && currentJunction.type === 'split') {
      const nextPos = getNodePosition(state, nextNodeId);
      const dx = nextPos.x - currentPos.x;
      const dy = nextPos.y - currentPos.y;
      
      let matchesDirection = false;
      switch (currentJunction.direction) {
        case 'up': matchesDirection = dy < -10; break;
        case 'down': matchesDirection = dy > 10; break;
        case 'left': matchesDirection = dx < -10; break;
        case 'right': matchesDirection = dx > 10; break;
      }
      if (!matchesDirection) continue;
    }

    const nextPos = getNodePosition(state, nextNodeId);
    const distToDest = calculateDistance(nextPos, destPos);
    
    if (distToDest < bestDistance) {
      bestDistance = distToDest;
      bestNext = nextNodeId;
    }
  }

  return bestNext;
}

function updateCapsules(state: GameState, level: Level, deltaTime: number): void {
  for (const capsule of state.capsules) {
    if (capsule.status === 'delivered' || capsule.status === 'lost') continue;

    capsule.deliveryTime += deltaTime;

    if (capsule.deliveryTime > capsule.maxDeliveryTime && capsule.status !== 'delayed') {
      capsule.status = 'delayed';
      state.score = Math.max(0, state.score - 100);
    }

    if (capsule.status === 'waiting') {
      const originStation = state.stations.find(s => s.id === capsule.currentNodeId);
      if (originStation && originStation.queue[0]?.id === capsule.id) {
        const nextNode = findNextNode(state, capsule, capsule.targetNodeId);
        if (nextNode) {
          capsule.currentNodeId = originStation.id;
          capsule.targetNodeId = nextNode;
          capsule.progress = 0;
          capsule.status = 'moving';
          originStation.queue.shift();
        }
      }
    } else if (capsule.status === 'moving' || capsule.status === 'delayed') {
      const fromPos = getNodePosition(state, capsule.currentNodeId);
      const toPos = getNodePosition(state, capsule.targetNodeId);
      const segmentDistance = calculateDistance(fromPos, toPos);

      const pipe = state.pipes.find(
        p => (p.from === capsule.currentNodeId && p.to === capsule.targetNodeId) ||
             (p.to === capsule.currentNodeId && p.from === capsule.targetNodeId)
      );

      const fromValve = state.valves.find(v => v.id === capsule.currentNodeId);
      const toValve = state.valves.find(v => v.id === capsule.targetNodeId);
      const avgPressure = ((fromValve?.pressure || 50) + (toValve?.pressure || 50)) / 2;
      
      const anomalyEffect = state.activeAnomalies.some(a => 
        !a.resolved && (a.config.targetId === pipe?.id || a.config.targetId === fromValve?.id || a.config.targetId === toValve?.id)
      ) ? 0.5 : 1;

      const baseSpeed = 30 + avgPressure * 0.8;
      capsule.speed = baseSpeed * anomalyEffect;

      const progressDelta = (capsule.speed * deltaTime) / segmentDistance;
      capsule.progress += progressDelta;

      if (pipe) {
        pipe.currentFlow = Math.min(pipe.capacity, pipe.currentFlow + progressDelta * 0.1);
      }

      if (capsule.progress >= 1) {
        capsule.currentNodeId = capsule.targetNodeId;
        capsule.progress = 0;

        const destStation = state.stations.find(s => s.id === capsule.currentNodeId);
        if (destStation && destStation.type === 'destination') {
          capsule.status = 'delivered';
          state.deliveriesCompleted++;
          destStation.delivered.push(capsule);

          const onTimeBonus = capsule.deliveryTime <= capsule.maxDeliveryTime ? 1.5 : 1;
          const priorityMultiplier = capsule.priority === 'critical' ? 3 : capsule.priority === 'express' ? 2 : 1;
          const deliveryScore = Math.round(100 * priorityMultiplier * onTimeBonus);
          state.score += deliveryScore;

          if (state.deliveriesCompleted >= level.targetDeliveries) {
            state.victory = true;
            state.isGameOver = true;
          }
        } else {
          const nextNode = findNextNode(state, capsule, capsule.targetNodeId);
          if (nextNode) {
            capsule.targetNodeId = nextNode;
          } else {
            capsule.status = 'lost';
            state.deliveriesFailed++;
            state.score = Math.max(0, state.score - 200);
          }
        }
      }
    }
  }
}

function spawnCapsules(state: GameState, level: Level): void {
  const dueSpawns = level.spawnSchedule.filter(s => s.time <= state.currentTime);
  for (const spawn of dueSpawns) {
    const alreadySpawned = state.capsules.some(c => 
      c.packageId === `pkg_${level.id}_${spawn.time}_${spawn.originId}`
    );
    if (alreadySpawned) continue;

    const originStation = state.stations.find(s => s.id === spawn.originId);
    if (!originStation) continue;

    const capsule: Capsule = {
      id: generateId(),
      packageId: `pkg_${level.id}_${spawn.time}_${spawn.originId}`,
      currentNodeId: spawn.originId,
      targetNodeId: spawn.destinationId,
      progress: 0,
      speed: 0,
      priority: spawn.priority,
      deliveryTime: 0,
      maxDeliveryTime: spawn.maxDeliveryTime,
      status: 'waiting',
      cargo: spawn.cargo
    };

    originStation.queue.push(capsule);
    state.capsules.push(capsule);
  }
}

function updateAnomalies(state: GameState, level: Level, deltaTime: number): void {
  for (const anomaly of state.activeAnomalies) {
    if (!anomaly.resolved) {
      anomaly.remainingTime -= deltaTime;
      if (anomaly.remainingTime <= 0) {
        anomaly.resolved = true;
      }
    }
  }

  for (const anomalyConfig of level.anomalies) {
    const alreadyTriggered = state.activeAnomalies.some(a => a.config.id === anomalyConfig.id);
    if (!alreadyTriggered && anomalyConfig.triggerTime <= state.currentTime) {
      state.activeAnomalies.push({
        config: anomalyConfig,
        startTime: state.currentTime,
        remainingTime: anomalyConfig.duration,
        resolved: false
      });
    }
  }
}

export function tickGame(state: GameState, level: Level, deltaTime: number): GameState {
  if (state.isPaused || state.isGameOver) return state;

  state.currentTime += deltaTime;

  updateAnomalies(state, level, deltaTime);
  spawnCapsules(state, level);
  updateCapsules(state, level, deltaTime);

  if (state.currentTime >= level.timeLimit && !state.isGameOver) {
    state.isGameOver = true;
    state.victory = state.deliveriesCompleted >= level.targetDeliveries;
  }

  const failedThreshold = Math.ceil(level.spawnSchedule.length * 0.4);
  if (state.deliveriesFailed >= failedThreshold && !state.isGameOver) {
    state.isGameOver = true;
    state.victory = false;
  }

  return state;
}

export function undoOperation(state: GameState): GameState | null {
  if (state.operationHistory.length === 0) return null;

  const lastRecord = state.operationHistory.pop()!;
  return JSON.parse(JSON.stringify(lastRecord.gameStateSnapshot));
}

export function replayOperations(operations: OperationRecord[]): GameState {
  if (operations.length === 0) {
    throw new Error('No operations to replay');
  }

  return JSON.parse(JSON.stringify(operations[operations.length - 1].gameStateSnapshot));
}
