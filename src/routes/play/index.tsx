import { component$, useVisibleTask$, useSignal, $, useTask$ } from '@builder.io/qwik';
import { useNavigate, routeLoader$ } from '@builder.io/qwik-city';
import { GameHeader } from '~/components/GameHeader';
import { WaterClockVisual } from '~/components/WaterClockVisual';
import { ClockControls } from '~/components/ClockControls';
import { OrderList } from '~/components/OrderList';
import { CalibrationPanel } from '~/components/CalibrationPanel';
import { SettleModal } from '~/components/SettleModal';
import { HistoryPanel } from '~/components/HistoryPanel';
import { loadPlayer, savePlayer, loadCurrentSession, loadAllSessions, upsertSession, saveCurrentSession, getInitialLevels } from '~/game/storage';
import {
  createNewSession,
  adjustHole,
  adjustScale,
  acceptOrder,
  completeOrder,
  skipToNextDay,
  undoAction,
  redoAction,
  canUndo,
  canRedo,
} from '~/game/session';
import { simulateCalibration } from '~/game/engine';
import type { GameSession, GameLevel, PlayerProfile, CalibrationResult, SettleResult, OrderWithStatus } from '~/game/types';

export const useGameParams = routeLoader$(({ query }) => {
  const levelId = parseInt(query.get('level') || '1', 10);
  const sessionId = query.get('session') || null;
  return { levelId, sessionId };
});

export default component$(() => {
  const nav = useNavigate();
  const params = useGameParams();

  const player = useSignal<PlayerProfile | null>(null);
  const levels = useSignal<GameLevel[]>([]);
  const currentLevel = useSignal<GameLevel | null>(null);
  const session = useSignal<GameSession | null>(null);
  const selectedOrderId = useSignal<string | null>(null);
  const calibrationResult = useSignal<CalibrationResult | null>(null);
  const isCalibrating = useSignal(false);
  const animatingProgress = useSignal(0);
  const settleResult = useSignal<SettleResult | null>(null);
  const isSettling = useSignal(false);

  useVisibleTask$(() => {
    player.value = loadPlayer();
    levels.value = getInitialLevels();

    if (params.value.sessionId) {
      const sessions = loadAllSessions();
      const found = sessions.find((s) => s.id === params.value.sessionId);
      if (found) {
        session.value = found;
        currentLevel.value = levels.value.find((l) => l.id === found.levelId) || null;
        return;
      }
    }

    const level = levels.value.find((l) => l.id === params.value.levelId) || levels.value[0];
    if (level && player.value) {
      currentLevel.value = level;
      session.value = createNewSession(player.value, level);
      upsertSession(session.value);
    }
  });

  useTask$(({ track }) => {
    track(() => session.value);
    if (session.value) {
      upsertSession(session.value);
    }
  });

  const selectedOrder = useSignal<OrderWithStatus | null>(null);

  useTask$(({ track }) => {
    track(() => selectedOrderId.value);
    track(() => session.value);
    if (session.value && selectedOrderId.value) {
      selectedOrder.value = session.value.orders.find((o) => o.id === selectedOrderId.value) || null;
    } else {
      selectedOrder.value = null;
    }
  });

  const handleHoleChange = $((value: number) => {
    if (!session.value) return;
    session.value = adjustHole(session.value, value);
    calibrationResult.value = null;
  });

  const handleScaleChange = $((value: number) => {
    if (!session.value) return;
    session.value = adjustScale(session.value, value);
    calibrationResult.value = null;
  });

  const handleAcceptOrder = $((orderId: string) => {
    if (!session.value) return;
    session.value = acceptOrder(session.value, orderId);
  });

  const handleSelectOrder = $((orderId: string) => {
    const order = session.value?.orders.find((o) => o.id === orderId);
    if (order && (order.status === 'accepted' || order.status === 'pending')) {
      selectedOrderId.value = orderId;
      calibrationResult.value = null;
      if (order.status === 'pending' && session.value) {
        session.value = acceptOrder(session.value, orderId);
      }
      if (session.value) {
        session.value.waterClock.targetDuration = order.targetDuration;
      }
    }
  });

  const handleCalibrate = $(async () => {
    if (!session.value || !selectedOrder.value) return;

    isCalibrating.value = true;
    calibrationResult.value = null;
    animatingProgress.value = 0;

    const order = selectedOrder.value;
    const config = { ...session.value.waterClock, targetDuration: order.targetDuration };

    const animateDuration = 1500;
    const startTime = Date.now();
    const animateInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      animatingProgress.value = Math.min(1, elapsed / animateDuration);
      if (elapsed >= animateDuration) {
        clearInterval(animateInterval);
      }
    }, 30);

    try {
      const response = await fetch('/api/calibrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waterClock: config,
          environment: session.value.environment,
          targetDuration: order.targetDuration,
          tolerance: order.targetTolerance,
        }),
      });

      await new Promise((r) => setTimeout(r, 1500));

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          calibrationResult.value = data.result;
        } else {
          calibrationResult.value = simulateCalibration(config, session.value.environment);
        }
      } else {
        calibrationResult.value = simulateCalibration(config, session.value.environment);
      }
    } catch (e) {
      calibrationResult.value = simulateCalibration(config, session.value.environment);
    } finally {
      isCalibrating.value = false;
      clearInterval(animateInterval);
      animatingProgress.value = 1;
    }
  });

  const handleConfirmResult = $((passed: boolean) => {
    if (!session.value || !selectedOrder.value || !calibrationResult.value) return;

    const orderId = selectedOrder.value.id;
    session.value = completeOrder(session.value, orderId, calibrationResult.value, passed);
    selectedOrderId.value = null;
    calibrationResult.value = null;
    animatingProgress.value = 0;
  });

  const handleSkipDay = $(() => {
    if (!session.value || !currentLevel.value) return;
    if (session.value.currentDay >= session.value.totalDays) {
      handleSettle();
      return;
    }
    session.value = skipToNextDay(session.value, currentLevel.value);
    calibrationResult.value = null;
    selectedOrderId.value = null;
  });

  const handleUndo = $(() => {
    if (!session.value) return;
    session.value = undoAction(session.value);
    calibrationResult.value = null;
  });

  const handleRedo = $(() => {
    if (!session.value) return;
    session.value = redoAction(session.value);
    calibrationResult.value = null;
  });

  const handleSettle = $(async () => {
    if (!session.value || !player.value) return;

    isSettling.value = true;

    try {
      const response = await fetch('/api/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: session.value }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          settleResult.value = data.result;
          session.value.finalScore = data.result.serverCalculatedScore;
          session.value.finalResult = data.result;
          session.value.status = data.result.won ? 'won' : 'lost';

          player.value.copper = data.result.copperFinal;
          player.value.reputation = data.result.reputationFinal;
          player.value.totalOrdersCompleted += data.result.ordersCompleted;
          player.value.totalOrdersFailed += data.result.ordersFailed + data.result.ordersExpired;
          if (data.result.averageAccuracy > player.value.bestAccuracy) {
            player.value.bestAccuracy = data.result.averageAccuracy;
          }
          if (data.result.won && currentLevel.value) {
            if (!player.value.completedLevels.includes(currentLevel.value.id)) {
              player.value.completedLevels.push(currentLevel.value.id);
            }
            const nextLevel = levels.value.find((l) => l.id === currentLevel.value!.id + 1);
            if (nextLevel && nextLevel.id > player.value.currentLevel) {
              player.value.currentLevel = nextLevel.id;
            }
          }

          savePlayer(player.value);
          upsertSession(session.value);
        }
      }
    } catch (e) {
      console.error('结算失败', e);
    } finally {
      isSettling.value = false;
    }
  });

  const handleCloseSettle = $(() => {
    settleResult.value = null;
    nav('/');
  });

  const handleRestart = $(() => {
    if (!currentLevel.value || !player.value) return;
    settleResult.value = null;
    session.value = createNewSession(player.value, currentLevel.value);
    upsertSession(session.value);
    selectedOrderId.value = null;
    calibrationResult.value = null;
  });

  const handleNextLevel = $(() => {
    if (!currentLevel.value) return;
    const nextLevel = levels.value.find((l) => l.id === currentLevel.value!.id + 1);
    if (nextLevel) {
      settleResult.value = null;
      nav(`/play?level=${nextLevel.id}`);
    } else {
      nav('/');
    }
  });

  const handleBack = $(() => {
    nav('/');
  });

  if (!session.value || !currentLevel.value) {
    return (
      <div class="container">
        <div class="panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p class="text-dim">加载游戏中...</p>
        </div>
      </div>
    );
  }

  const tolerance = selectedOrder.value?.targetTolerance || 30;

  return (
    <div class="container">
      <GameHeader
        session={session.value}
        level={currentLevel.value}
        onUndo$={handleUndo}
        onRedo$={handleRedo}
        canUndo={canUndo(session.value)}
        canRedo={canRedo(session.value)}
        onSettle$={handleSettle}
        onBack$={handleBack}
      />

      <div class="row">
        <div class="col" style={{ flex: '0 0 320px' }}>
          <OrderList
            orders={session.value.orders}
            currentDay={session.value.currentDay}
            onAccept$={handleAcceptOrder}
            onSelect$={handleSelectOrder}
            selectedOrderId={selectedOrderId.value}
          />

          <div style={{ height: '1rem' }} />

          <HistoryPanel
            history={session.value.history}
            currentIndex={session.value.historyIndex}
          />
        </div>

        <div class="col" style={{ flex: '1 1 400px' }}>
          <div class="panel" style={{ textAlign: 'center' }}>
            <WaterClockVisual
              config={session.value.waterClock}
              environment={session.value.environment}
              animating={isCalibrating.value}
              progress={animatingProgress.value}
            />
          </div>

          <div style={{ height: '1rem' }} />

          <ClockControls
            config={session.value.waterClock}
            onHoleChange$={handleHoleChange}
            onScaleChange$={handleScaleChange}
            disabled={isCalibrating.value}
          />

          <div style={{ height: '1rem' }} />

          <div class="next-day-bar">
            {session.value.currentDay < session.value.totalDays ? (
              <>
                <p>完成今日订单后可进入下一天，或直接跳过</p>
                <button class="btn" onClick$={handleSkipDay} disabled={isCalibrating.value}>
                  进入第 {session.value.currentDay + 1} 天
                </button>
              </>
            ) : (
              <>
                <p>已到最后一天，请结算本局成绩</p>
                <button class="btn" onClick$={handleSettle} disabled={isSettling.value}>
                  {isSettling.value ? '结算中...' : '立即结算'}
                </button>
              </>
            )}
          </div>
        </div>

        <div class="col" style={{ flex: '0 0 320px' }}>
          <CalibrationPanel
            selectedOrder={selectedOrder.value}
            result={calibrationResult.value}
            isCalibrating={isCalibrating.value}
            onCalibrate$={handleCalibrate}
            onConfirmResult$={handleConfirmResult}
            tolerance={tolerance}
          />

          <div style={{ height: '1rem' }} />

          <OrderList
            orders={session.value.completedOrders}
            currentDay={session.value.currentDay}
            showCompleted
          />
        </div>
      </div>

      <SettleModal
        result={settleResult.value}
        level={currentLevel.value}
        onClose$={handleCloseSettle}
        onRestart$={handleRestart}
        onNextLevel$={handleNextLevel}
      />
    </div>
  );
});
