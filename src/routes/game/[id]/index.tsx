import { component$, $, useSignal, useVisibleTask$, useStore } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { getSessionById, getLevelById, getOperationsBySession, getPlayerById } from '~/lib/repositories';
import type { Operation, ScoreBreakdown } from '~/types/game';

interface GameStateStore {
  currentFloor: number;
  targetFloor: number;
  energy: number;
  maxEnergy: number;
  balance: number;
  balanceThreshold: number;
  operations: Operation[];
  status: 'playing' | 'won' | 'lost';
  sessionId: number;
  levelId: number;
  playerId: number;
  levelName: string;
  playerName: string;
  result: null | {
    status: 'won' | 'lost' | 'abandoned';
    score: number;
    breakdown: ScoreBreakdown;
  };
  errorMsg: string;
  loadingOp: string | null;
  leftWeights: number[];
  rightWeights: number[];
}

export const useGameSessionData = routeLoader$(async (requestEvent) => {
  const sessionId = Number(requestEvent.params.id);
  const session = await getSessionById(sessionId);
  if (!session) {
    throw requestEvent.error(404, '局次不存在');
  }
  const level = await getLevelById(session.level_id);
  const operations = await getOperationsBySession(sessionId);
  const player = await getPlayerById(session.player_id);

  return {
    session,
    level,
    operations,
    player,
  };
});

const OPERATION_LABELS: Record<string, string> = {
  MOVE_UP: '⬆️ 上升',
  MOVE_DOWN: '⬇️ 下降',
  ADD_WEIGHT_LEFT: '⬅️ 增加左配重',
  ADD_WEIGHT_RIGHT: '➡️ 增加右配重',
  REMOVE_WEIGHT_LEFT: '↩️ 移除左配重',
  REMOVE_WEIGHT_RIGHT: '↪️ 移除右配重',
  SWAP_WEIGHTS: '🔄 交换配重',
  CHARGE_ENERGY: '⚡ 充能',
  EMERGENCY_BALANCE: '🛑 紧急平衡',
};

export default component$(() => {
  const initialData = useGameSessionData();
  const nav = useNavigate();

  const state = useStore<GameStateStore>({
    sessionId: initialData.value.session.id,
    levelId: initialData.value.session.level_id,
    playerId: initialData.value.session.player_id,
    currentFloor: initialData.value.session.current_floor,
    targetFloor: initialData.value.session.target_floor,
    energy: initialData.value.session.energy,
    maxEnergy: initialData.value.session.max_energy,
    balance: initialData.value.session.balance,
    balanceThreshold: initialData.value.session.balance_threshold,
    operations: initialData.value.operations as Operation[],
    status: (initialData.value.session.status === 'playing' ? 'playing' : initialData.value.session.status === 'won' ? 'won' : 'lost') as 'playing' | 'won' | 'lost',
    levelName: initialData.value.level?.name || '未知关卡',
    playerName: initialData.value.player?.name || '未知玩家',
    result: initialData.value.session.status !== 'playing' ? {
      status: initialData.value.session.status as 'won' | 'lost' | 'abandoned',
      score: initialData.value.session.score,
      breakdown: {
        baseScore: 0,
        floorBonus: 0,
        speedBonus: 0,
        energyBonus: 0,
        balanceBonus: 0,
        efficiencyBonus: 0,
        penalty: 0,
        total: initialData.value.session.score,
      },
    } : null,
    errorMsg: '',
    loadingOp: null,
    leftWeights: [5, 3],
    rightWeights: [4, 2],
  });

  const selectedWeight = useSignal<{ side: 'left' | 'right'; index: number } | null>(null);

  useVisibleTask$(({ cleanup }) => {
    if (state.status !== 'playing') return;

    const interval = setInterval(() => {
      if (Math.abs(state.balance) > state.balanceThreshold * 1.5 && state.status === 'playing') {
        finishSession('lost');
      }
    }, 1000);

    cleanup(() => clearInterval(interval));
  });

  const doOperation = $(async (type: string, payload: Record<string, unknown> = {}) => {
    if (state.status !== 'playing') return;
    if (state.loadingOp) return;

    state.errorMsg = '';
    state.loadingOp = type;

    try {
      const res = await fetch(`/api/sessions/${state.sessionId}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });

      const result = await res.json();
      if (!result.success) {
        state.errorMsg = result.error || '操作失败';
        return;
      }

      state.operations.push(result.data.operation);
      state.currentFloor = result.data.state.current_floor;
      state.balance = result.data.state.balance;
      state.energy = result.data.state.energy;

      if (result.data.gameStatus !== 'playing') {
        await finishSession(result.data.gameStatus);
      }
    } catch (e) {
      state.errorMsg = '网络错误';
    } finally {
      state.loadingOp = null;
    }
  });

  const finishSession = $(async (finalStatus: 'won' | 'lost') => {
    state.status = finalStatus;
    state.loadingOp = 'FINISHING';

    try {
      const res = await fetch(`/api/sessions/${state.sessionId}/recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();
      if (result.success) {
        state.result = {
          status: result.data.status,
          score: result.data.score,
          breakdown: result.data.breakdown,
        };
      }
    } catch (e) {
      state.result = {
        status: finalStatus,
        score: 0,
        breakdown: {
          baseScore: 0, floorBonus: 0, speedBonus: 0, energyBonus: 0,
          balanceBonus: 0, efficiencyBonus: 0, penalty: 0, total: 0,
        },
      };
    } finally {
      state.loadingOp = null;
    }
  });

  const abandonGame = $(async () => {
    if (!confirm('确定要放弃本局游戏吗？')) return;
    await finishSession('lost');
  });

  const tiltDeg = Math.max(-30, Math.min(30, state.balance * 1.2));
  const isAlarm = Math.abs(state.balance) > state.balanceThreshold;
  const isCritical = Math.abs(state.balance) > state.balanceThreshold * 1.8;
  const energyPct = (state.energy / state.maxEnergy) * 100;
  const progressPct = (state.currentFloor / state.targetFloor) * 100;

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', color: '#00e5ff' }}>{state.levelName}</h1>
          <p style={{ color: '#8899bb', fontSize: '0.9rem' }}>玩家: {state.playerName} · 局次 #{state.sessionId}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a href="/game" style={{ textDecoration: 'none' }}>
            <button class="btn">返回大厅</button>
          </a>
          {state.status === 'playing' && (
            <button class="btn btn-danger" onClick$={abandonGame} disabled={!!state.loadingOp}>放弃本局</button>
          )}
        </div>
      </div>

      {state.result && (
        <div class="panel" style={{
          padding: '35px',
          marginBottom: '25px',
          border: `2px solid ${state.result.status === 'won' ? '#00ff88' : '#ff3366'}`,
          animation: 'pulse 2s infinite',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
              {state.result.status === 'won' ? '🎉 任务完成!' : '💥 任务失败'}
            </div>
            <div style={{ fontSize: '3rem', color: state.result.status === 'won' ? '#00ff88' : '#ff3366', fontWeight: 'bold', textShadow: '0 0 20px currentColor' }}>
              {state.result.score.toLocaleString()} 分
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '25px' }}>
            <ScoreItem label="基础分" value={state.result.breakdown.baseScore} />
            <ScoreItem label="楼层奖励" value={state.result.breakdown.floorBonus} positive />
            <ScoreItem label="速度奖励" value={state.result.breakdown.speedBonus} positive />
            <ScoreItem label="能量奖励" value={state.result.breakdown.energyBonus} positive />
            <ScoreItem label="平衡奖励" value={state.result.breakdown.balanceBonus} positive />
            <ScoreItem label="效率奖励" value={state.result.breakdown.efficiencyBonus} positive />
            <ScoreItem label="惩罚扣分" value={-state.result.breakdown.penalty} negative />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/game" style={{ textDecoration: 'none' }}>
              <button class="btn btn-primary">🎮 再来一局</button>
            </a>
            <a href="/leaderboard" style={{ textDecoration: 'none' }}>
              <button class="btn">🏆 查看排行榜</button>
            </a>
          </div>
        </div>
      )}

      {state.errorMsg && state.status === 'playing' && (
        <div style={{
          background: 'rgba(255, 51, 102, 0.15)',
          border: '1px solid #ff3366',
          color: '#ff3366',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '18px',
          fontSize: '0.95rem',
        }}>
          ⚠️ {state.errorMsg}
        </div>
      )}

      {isAlarm && state.status === 'playing' && (
        <div style={{
          background: isCritical ? 'rgba(255, 51, 102, 0.25)' : 'rgba(255, 204, 0, 0.2)',
          border: `2px solid ${isCritical ? '#ff3366' : '#ffcc00'}`,
          color: isCritical ? '#ff3366' : '#ffcc00',
          padding: '14px 20px',
          borderRadius: '10px',
          marginBottom: '18px',
          fontWeight: 'bold',
          fontSize: '1rem',
          textAlign: 'center',
          animation: isCritical ? 'shake 0.5s infinite' : 'none',
          boxShadow: isCritical ? '0 0 30px rgba(255, 51, 102, 0.5)' : '0 0 15px rgba(255, 204, 0, 0.3)',
        }}>
          {isCritical ? '🚨 严重失衡警告！电梯即将失控！' : '⚠️ 平衡警告：请立即调整配重！'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
        {/* 左侧配重区 */}
        <div class="panel" style={{ padding: '20px' }}>
          <h3 style={{ color: '#00e5ff', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'center' }}>⬅️ 左侧配重</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', alignItems: 'center' }}>
            {state.leftWeights.map((w, i) => (
              <button
                key={`l-${i}`}
                onClick$={() => {
                  selectedWeight.value = { side: 'left', index: i };
                }}
                style={{
                  width: '80%',
                  padding: '15px',
                  background: selectedWeight.value?.side === 'left' && selectedWeight.value?.index === i
                    ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.4), rgba(0, 229, 255, 0.1))'
                    : 'linear-gradient(135deg, rgba(255, 107, 53, 0.3), rgba(255, 107, 53, 0.1))',
                  border: `2px solid ${selectedWeight.value?.side === 'left' && selectedWeight.value?.index === i ? '#00e5ff' : '#ff6b35'}`,
                  borderRadius: '10px',
                  color: '#e8f0ff',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                disabled={state.status !== 'playing'}
              >
                {w} 吨
              </button>
            ))}
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center', color: '#8899bb', fontSize: '0.85rem' }}>
            总计: <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>{state.leftWeights.reduce((a, b) => a + b, 0)}</span> 吨
          </div>
        </div>

        {/* 中间电梯可视化 */}
        <div class="panel" style={{ padding: '20px' }}>
          <div style={{ position: 'relative', height: '500px', background: 'linear-gradient(180deg, #0a0e1a 0%, #1a2744 50%, #2a3a5a 100%)', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(0, 229, 255, 0.2)' }}>
            {Array.from({ length: Math.min(state.targetFloor, 20) }, (_, i) => {
              const floorNum = state.targetFloor > 20 ? Math.round((i / 19) * state.targetFloor) : i;
              const isCurrent = floorNum === state.currentFloor;
              const isTarget = floorNum === state.targetFloor;
              return (
                <div key={i} style={{
                  position: 'absolute',
                  bottom: `${(i / Math.max(1, Math.min(state.targetFloor - 1, 19))) * 92 + 2}%`,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: isTarget ? '#ffcc00' : 'rgba(0, 229, 255, 0.15)',
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '10px',
                    top: '-10px',
                    fontSize: '0.75rem',
                    color: isTarget ? '#ffcc00' : isCurrent ? '#00ff88' : '#8899bb',
                    fontWeight: isTarget || isCurrent ? 'bold' : 'normal',
                  }}>
                    {floorNum}{isTarget ? ' 🎯' : ''}
                  </span>
                </div>
              );
            })}

            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: `${(state.currentFloor / Math.max(1, state.targetFloor)) * 92 + 2}%`,
              transform: `translateX(-50%) rotate(${tiltDeg}deg)`,
              transition: 'all 0.4s ease',
              width: '140px',
              zIndex: 10,
            }}>
              <div style={{
                width: '100%',
                height: '80px',
                background: isCritical
                  ? 'linear-gradient(135deg, #ff3366, #aa1133)'
                  : isAlarm
                    ? 'linear-gradient(135deg, #ffcc00, #cc9900)'
                    : 'linear-gradient(135deg, #00e5ff, #0088aa)',
                borderRadius: '12px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                boxShadow: isCritical
                  ? '0 0 40px rgba(255, 51, 102, 0.8)'
                  : isAlarm
                    ? '0 0 30px rgba(255, 204, 0, 0.6)'
                    : '0 0 20px rgba(0, 229, 255, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: '#050810',
                fontWeight: 'bold',
              }}>
                <span style={{ fontSize: '1.8rem' }}>🚀</span>
                <span style={{ fontSize: '0.85rem' }}>F{state.currentFloor}</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: '#8899bb' }}>进度</span>
              <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{state.currentFloor} / {state.targetFloor}</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(10, 14, 26, 0.8)', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <div style={{
                height: '100%',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #00e5ff, #00ff88)',
                transition: 'width 0.3s ease',
                boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
              }} />
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: '#8899bb' }}>⚡ 能量</span>
              <span style={{ color: energyPct > 20 ? '#ffcc00' : '#ff3366', fontWeight: 'bold' }}>{state.energy} / {state.maxEnergy}</span>
            </div>
            <div style={{ height: '12px', background: 'rgba(10, 14, 26, 0.8)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <div style={{
                height: '100%',
                width: `${energyPct}%`,
                background: energyPct > 50
                  ? 'linear-gradient(90deg, #ffcc00, #00ff88)'
                  : energyPct > 20
                    ? 'linear-gradient(90deg, #ff6b35, #ffcc00)'
                    : 'linear-gradient(90deg, #ff3366, #ff6b35)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
              <span style={{ color: '#8899bb' }}>⚖️ 平衡度</span>
              <span style={{ color: isCritical ? '#ff3366' : isAlarm ? '#ffcc00' : '#00ff88', fontWeight: 'bold' }}>
                {state.balance > 0 ? '+' : ''}{state.balance.toFixed(1)}
              </span>
            </div>
            <div style={{ position: 'relative', height: '14px', background: 'rgba(10, 14, 26, 0.8)', borderRadius: '7px', overflow: 'hidden', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
              <div style={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#00e5ff',
                zIndex: 2,
              }} />
              <div style={{
                position: 'absolute',
                left: `${50 + (state.balance / (state.balanceThreshold * 3)) * 50}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: isCritical ? '#ff3366' : isAlarm ? '#ffcc00' : '#00ff88',
                boxShadow: `0 0 12px ${isCritical ? '#ff3366' : isAlarm ? '#ffcc00' : '#00ff88'}`,
                transition: 'all 0.3s ease',
                zIndex: 3,
              }} />
            </div>
          </div>
        </div>

        {/* 右侧配重区 */}
        <div class="panel" style={{ padding: '20px' }}>
          <h3 style={{ color: '#00e5ff', marginBottom: '15px', fontSize: '1.1rem', textAlign: 'center' }}>右侧配重 ➡️</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '300px', alignItems: 'center' }}>
            {state.rightWeights.map((w, i) => (
              <button
                key={`r-${i}`}
                onClick$={() => {
                  selectedWeight.value = { side: 'right', index: i };
                }}
                style={{
                  width: '80%',
                  padding: '15px',
                  background: selectedWeight.value?.side === 'right' && selectedWeight.value?.index === i
                    ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.4), rgba(0, 229, 255, 0.1))'
                    : 'linear-gradient(135deg, rgba(0, 229, 255, 0.3), rgba(0, 229, 255, 0.1))',
                  border: `2px solid ${selectedWeight.value?.side === 'right' && selectedWeight.value?.index === i ? '#00ff88' : '#00e5ff'}`,
                  borderRadius: '10px',
                  color: '#e8f0ff',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                }}
                disabled={state.status !== 'playing'}
              >
                {w} 吨
              </button>
            ))}
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center', color: '#8899bb', fontSize: '0.85rem' }}>
            总计: <span style={{ color: '#00e5ff', fontWeight: 'bold' }}>{state.rightWeights.reduce((a, b) => a + b, 0)}</span> 吨
          </div>
        </div>
      </div>

      {/* 操作控制区 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        <div class="panel" style={{ padding: '20px' }}>
          <h3 style={{ color: '#00e5ff', marginBottom: '15px', fontSize: '1.1rem' }}>🎮 操作控制</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <ActionButton
              label="⬆️ 上升一层"
              subLabel="能量: -10"
              onClick$={() => doOperation('MOVE_UP')}
              disabled={state.status !== 'playing' || state.currentFloor >= state.targetFloor || !!state.loadingOp}
              loading={state.loadingOp === 'MOVE_UP'}
              color="cyan"
            />
            <ActionButton
              label="⬇️ 下降一层"
              subLabel="能量: -5"
              onClick$={() => doOperation('MOVE_DOWN')}
              disabled={state.status !== 'playing' || state.currentFloor <= 0 || !!state.loadingOp}
              loading={state.loadingOp === 'MOVE_DOWN'}
              color="cyan"
            />
            <ActionButton
              label="➕ 增加左配重"
              subLabel="能量: -3 · 质量5t"
              onClick$={() => doOperation('ADD_WEIGHT_LEFT', { mass: 5 })}
              disabled={state.status !== 'playing' || !!state.loadingOp}
              loading={state.loadingOp === 'ADD_WEIGHT_LEFT'}
              color="orange"
            />
            <ActionButton
              label="➕ 增加右配重"
              subLabel="能量: -3 · 质量5t"
              onClick$={() => doOperation('ADD_WEIGHT_RIGHT', { mass: 5 })}
              disabled={state.status !== 'playing' || !!state.loadingOp}
              loading={state.loadingOp === 'ADD_WEIGHT_RIGHT'}
              color="cyan"
            />
            <ActionButton
              label="➖ 移除左配重"
              subLabel="能量: -2 · 质量5t"
              onClick$={() => doOperation('REMOVE_WEIGHT_LEFT', { mass: 5 })}
              disabled={state.status !== 'playing' || state.leftWeights.length === 0 || !!state.loadingOp}
              loading={state.loadingOp === 'REMOVE_WEIGHT_LEFT'}
              color="orange"
            />
            <ActionButton
              label="➖ 移除右配重"
              subLabel="能量: -2 · 质量5t"
              onClick$={() => doOperation('REMOVE_WEIGHT_RIGHT', { mass: 5 })}
              disabled={state.status !== 'playing' || state.rightWeights.length === 0 || !!state.loadingOp}
              loading={state.loadingOp === 'REMOVE_WEIGHT_RIGHT'}
              color="cyan"
            />
            <ActionButton
              label="🔄 交换配重"
              subLabel="能量: -8"
              onClick$={() => doOperation('SWAP_WEIGHTS')}
              disabled={state.status !== 'playing' || !!state.loadingOp}
              loading={state.loadingOp === 'SWAP_WEIGHTS'}
              color="yellow"
            />
            <ActionButton
              label="⚡ 充电恢复"
              subLabel="能量: +25"
              onClick$={() => doOperation('CHARGE_ENERGY')}
              disabled={state.status !== 'playing' || state.energy >= state.maxEnergy || !!state.loadingOp}
              loading={state.loadingOp === 'CHARGE_ENERGY'}
              color="yellow"
            />
            <ActionButton
              label="🛑 紧急平衡"
              subLabel="能量: -30"
              onClick$={() => doOperation('EMERGENCY_BALANCE')}
              disabled={state.status !== 'playing' || !!state.loadingOp}
              loading={state.loadingOp === 'EMERGENCY_BALANCE'}
              color="red"
              style={{ gridColumn: 'span 4' }}
            />
          </div>
        </div>

        {/* 操作历史 */}
        <div class="panel" style={{ padding: '20px', maxHeight: '380px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#00e5ff', marginBottom: '15px', fontSize: '1.1rem' }}>📜 操作历史 ({state.operations.length})</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse', gap: '6px' }}>
            {state.operations.length === 0 ? (
              <p style={{ color: '#8899bb', fontSize: '0.9rem', textAlign: 'center', padding: '20px' }}>暂无操作记录</p>
            ) : (
              state.operations.map((op) => (
                <div key={op.id} style={{
                  padding: '8px 12px',
                  background: 'rgba(10, 14, 26, 0.5)',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `3px solid ${Math.abs(op.balance_after) > state.balanceThreshold ? '#ff3366' : '#00ff88'}`,
                }}>
                  <div>
                    <span style={{ color: '#e8f0ff', fontWeight: 500 }}>#{op.sequence}</span>
                    <span style={{ color: '#8899bb', margin: '0 8px' }}>|</span>
                    <span style={{ color: '#00e5ff' }}>{OPERATION_LABELS[op.type] || op.type}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#8899bb' }}>
                    F{op.floor_after} · ⚖️{op.balance_after > 0 ? '+' : ''}{op.balance_after.toFixed(0)} · ⚡{op.energy_after}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
});

function ScoreItem({ label, value, positive, negative }: { label: string; value: number; positive?: boolean; negative?: boolean }) {
  const color = negative ? '#ff3366' : positive ? '#00ff88' : '#e8f0ff';
  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(10, 14, 26, 0.5)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 229, 255, 0.1)',
    }}>
      <div style={{ color: '#8899bb', fontSize: '0.8rem', marginBottom: '4px' }}>{label}</div>
      <div style={{ color, fontSize: '1.3rem', fontWeight: 'bold' }}>
        {value > 0 && !negative ? '+' : ''}{value.toLocaleString()}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  subLabel,
  onClick$,
  disabled,
  loading,
  color = 'cyan',
  style,
}: {
  label: string;
  subLabel?: string;
  onClick$: () => void;
  disabled?: boolean;
  loading?: boolean;
  color?: 'cyan' | 'orange' | 'yellow' | 'red' | 'green';
  style?: Record<string, string>;
}) {
  const colorMap = {
    cyan: { main: '#00e5ff', bg: 'rgba(0, 229, 255, 0.15)', hover: 'rgba(0, 229, 255, 0.3)' },
    orange: { main: '#ff6b35', bg: 'rgba(255, 107, 53, 0.15)', hover: 'rgba(255, 107, 53, 0.3)' },
    yellow: { main: '#ffcc00', bg: 'rgba(255, 204, 0, 0.15)', hover: 'rgba(255, 204, 0, 0.3)' },
    red: { main: '#ff3366', bg: 'rgba(255, 51, 102, 0.15)', hover: 'rgba(255, 51, 102, 0.3)' },
    green: { main: '#00ff88', bg: 'rgba(0, 255, 136, 0.15)', hover: 'rgba(0, 255, 136, 0.3)' },
  };
  const c = colorMap[color];

  return (
    <button
      onClick$={onClick$}
      disabled={disabled || loading}
      style={{
        padding: '14px 12px',
        background: disabled ? 'rgba(60, 60, 60, 0.3)' : c.bg,
        border: `2px solid ${disabled ? 'rgba(100, 100, 100, 0.3)' : c.main}`,
        borderRadius: '10px',
        color: disabled ? '#666' : c.main,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignItems: 'center',
        fontWeight: 600,
        ...style,
      }}
      onMouseOver$={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = c.hover;
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 15px ${c.main}55`;
        }
      }}
      onMouseOut$={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = c.bg;
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
        }
      }}
    >
      <div style={{ fontSize: '0.95rem' }}>{loading ? '处理中...' : label}</div>
      {subLabel && <div style={{ fontSize: '0.75rem', opacity: 0.75, fontWeight: 400 }}>{subLabel}</div>}
    </button>
  );
}
