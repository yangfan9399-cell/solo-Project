import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import type { StrikeOrderStep, PartName, WeatherType } from '~/types/game';
import type { RuntimeState } from '~/server/gameService';
import ControlPanel from '~/components/ControlPanel';
import ErrorCurveChart from '~/components/ErrorCurveChart';
import MaintenanceCalendar from '~/components/MaintenanceCalendar';
import PartStatusPanel from '~/components/PartStatusPanel';
import { WEATHER_ICON, WEATHER_NAME, classError, formatNumber, SCENARIO_NAME } from '~/utils/format';

export default function GamePage() {
  const { uuid } = useParams();
  const nav = useNavigate();
  const [state, setState] = useState<RuntimeState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [repairedToday, setRepairedToday] = useState<Set<PartName>>(new Set());
  const [showRollback, setShowRollback] = useState(false);
  const [rollbackDay, setRollbackDay] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    if (!uuid) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/sessions/${uuid}`);
      const d = await r.json();
      if (d.ok) {
        setState(d.state);
        setRepairedToday(new Set());
      } else {
        setError(d.error || '加载失败');
      }
    } catch (e: any) {
      setError('网络错误: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [uuid]);

  useEffect(() => { loadState(); }, [loadState]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const wrapAction = async <T,>(fn: () => Promise<Response>, successMsg: string) => {
    setError(null);
    try {
      const r = await fn();
      const d = await r.json();
      if (d.ok) {
        setState(d.state);
        if (successMsg) showToast(successMsg);
      } else {
        setError(d.error || '操作失败');
      }
    } catch (e: any) {
      setError('请求失败: ' + e.message);
    }
  };

  const adjustPendulum = (length: number) =>
    wrapAction(
      () => fetch(`/api/sessions/${uuid}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pendulum', payload: { length, note: '玩家调整' } }),
      }),
      `摆长调整为 ${formatNumber(length)} mm`
    );

  const adjustGears = (ga: number, gb: number, gc: number) =>
    wrapAction(
      () => fetch(`/api/sessions/${uuid}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'gear', payload: { gearA: ga, gearB: gb, gearC: gc, reason: '玩家调整齿轮' } }),
      }),
      `齿轮比改为 ${ga}:${gb}:${gc}`
    );

  const adjustLubrication = (level: number) =>
    wrapAction(
      () => fetch(`/api/sessions/${uuid}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'lubrication', payload: { level } }),
      }),
      `润滑度调整为 ${formatNumber(level, 1)}%`
    );

  const setStrikeOrder = (order: StrikeOrderStep[]) =>
    wrapAction(
      () => fetch(`/api/sessions/${uuid}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'strike_order', payload: { order } }),
      }),
      `锤击顺序已更新`
    );

  const repairPart = (part: PartName) => {
    wrapAction(
      () => fetch(`/api/sessions/${uuid}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'repair', payload: { part } }),
      }),
      `${part} 已修复`
    );
    setRepairedToday(prev => new Set(prev).add(part));
  };

  const advanceDay = async () => {
    if (!state) return;
    const nextDay = state.session.current_day + 1;
    if (nextDay > state.session.total_days) {
      if (confirm('即将结束游戏并生成最终校准报告，确定吗？')) {
        await wrapAction(
          () => fetch(`/api/sessions/${uuid}/advance`, { method: 'POST' }),
          ''
        );
        setTimeout(() => nav(`/report/${uuid}`), 500);
      }
      return;
    }
    await wrapAction(
      () => fetch(`/api/sessions/${uuid}/advance`, { method: 'POST' }),
      `进入 Day ${nextDay}`
    );
    setRepairedToday(new Set());
  };

  const doRollback = async () => {
    if (!rollbackDay) return;
    if (!confirm(`确定回滚到 Day ${rollbackDay} 吗？当前 Day ${state?.session.current_day} 及之后的所有操作将被删除。`)) return;
    wrapAction(
      () => fetch(`/api/sessions/${uuid}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: rollbackDay }),
      }),
      `已回滚到 Day ${rollbackDay}`
    );
    setShowRollback(false);
    setRollbackDay(null);
  };

  const calendarDays = useMemo(() => {
    if (!state) return [];
    const total = state.session.total_days;
    return Array.from({ length: total }, (_, i) => i + 1).map(d => {
      const idx = d - 1;
      return {
        day: d,
        weather: (state.weatherHistory[idx] ?? state.currentWeather) as WeatherType,
        error: idx < state.errorHistory.length ? state.errorHistory[idx] : (d === state.session.current_day ? state.currentError : null),
      };
    });
  }, [state]);

  if (loading) return <div className="loading">加载中... 正在连接钟楼控制模块</div>;
  if (error && !state) return <div className="home-screen"><div className="error-banner bad" style={{ maxWidth: 480, margin: '0 auto' }}>
    ❌ {error}<br /><br />
    <button className="btn btn-primary" onClick={() => nav('/')}>返回首页</button>
  </div></div>;
  if (!state) return null;

  const errCls = classError(state.currentError, 2, 3);
  const session = state.session;

  return (
    <div>
      <div className="page-header">
        <h1>🔔 {session.player_name} 的钟楼维修日志</h1>
        <p className="subtitle">
          场景: <b>{SCENARIO_NAME[session.seed_scenario] ?? session.seed_scenario}</b>　|　
          进度 Day <b style={{ color: '#d4a84b' }}>{session.current_day}</b> / {session.total_days}　|　
          局次ID: <code style={{ color: '#8a7a5c', fontSize: 11 }}>{session.session_uuid.slice(-10)}</code>
        </p>
      </div>

      {error && (
        <div className="error-banner bad" style={{ marginBottom: 16 }}>
          ❌ {error}
        </div>
      )}
      {toast && (
        <div className="error-banner good" style={{ marginBottom: 16, position: 'sticky', top: 10, zIndex: 50 }}>
          ✓ {toast}
        </div>
      )}
      {session.status !== 'playing' && (
        <div className="error-banner warn" style={{ marginBottom: 16 }}>
          ⚠ 本局已结束，请查看报告
          <button className="btn btn-sm btn-primary" style={{ marginLeft: 12 }} onClick={() => nav(`/report/${uuid}`)}>
            查看校准报告 →
          </button>
        </div>
      )}

      <div className="grid-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title"><span className="icon">📊</span> 今日误差概览</h3>
            <div className="error-display">
              <div className={`big-number ${errCls}`}>
                {formatNumber(state.currentError)}<span className="unit">秒/天</span>
              </div>
              <div className="caption">
                目标 ≤ <span style={{ color: '#5a9e5a' }}>2.0s</span>
                　容差 ≤ <span style={{ color: '#d47a2a' }}>3.0s</span>
              </div>
            </div>
            <div className="stat-row"><span className="stat-label">当前天气</span>
              <span className="stat-value">{WEATHER_ICON[state.currentWeather]} {WEATHER_NAME[state.currentWeather]}</span>
            </div>
            <div className="stat-row"><span className="stat-label">环境温度</span>
              <span className="stat-value gold">{formatNumber(state.currentTemperature, 1)} °C</span>
            </div>
            <div className="stat-row"><span className="stat-label">室温摆长</span>
              <span className="stat-value" style={{ fontFamily: 'monospace' }}>{formatNumber(state.pendulumLength)} mm</span>
            </div>
            <div className="stat-row"><span className="stat-label">热胀后摆长</span>
              <span className="stat-value gold" style={{ fontFamily: 'monospace' }}>{formatNumber(state.thermalLength)} mm</span>
            </div>
            <div className="stat-row"><span className="stat-label">齿轮比 A:B:C</span>
              <span className="stat-value" style={{ fontFamily: 'monospace' }}>{state.gears.gearA}:{state.gears.gearB}:{state.gears.gearC}</span>
            </div>
            <div className="stat-row"><span className="stat-label">润滑度</span>
              <span className={`stat-value ${state.lubrication >= 85 ? 'good' : state.lubrication >= 60 ? 'warn' : 'bad'}`} style={{ fontFamily: 'monospace' }}>
                {formatNumber(state.lubrication, 1)}%
              </span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title"><span className="icon">📅</span> 维修日历</h3>
            <MaintenanceCalendar
              totalDays={session.total_days}
              currentDay={session.current_day}
              days={calendarDays}
              targetDay={rollbackDay ?? undefined}
            />
            {session.status === 'playing' && session.current_day > 2 && (
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-sm btn-danger btn-full" onClick={() => setShowRollback(v => !v)}>
                  {showRollback ? '取消回滚' : '🔄 回滚到指定日期'}
                </button>
                {showRollback && (
                  <div className="rollback-picker">
                    {Array.from({ length: session.current_day - 1 }, (_, i) => i + 1).map(d => (
                      <span
                        key={d}
                        className={`day-chip ${rollbackDay === d ? 'active' : ''}`}
                        onClick={() => setRollbackDay(d)}
                        style={rollbackDay === d ? { background: 'rgba(200,75,75,0.3)', borderColor: '#c84b4b', color: '#c84b4b' } : undefined}
                      >
                        → Day {d}
                      </span>
                    ))}
                    {rollbackDay && (
                      <button className="btn btn-sm btn-danger" onClick={doRollback} style={{ marginLeft: 6 }}>
                        确认回滚
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title"><span className="icon">🔧</span> 零件磨损状态</h3>
            <PartStatusPanel
              partWears={state.partWears}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ControlPanel
            state={state}
            onAdjustPendulum={adjustPendulum}
            onAdjustGears={adjustGears}
            onAdjustLubrication={adjustLubrication}
            onSetStrikeOrder={setStrikeOrder}
            onRepairPart={repairPart}
            onAdvance={advanceDay}
            onOpenReport={() => nav(`/report/${uuid}`)}
            onBackHome={() => nav('/')}
            repairedToday={repairedToday}
          />

          <div className="card">
            <h3 className="card-title"><span className="icon">📈</span> 误差曲线 (误差秒数/天)</h3>
            <ErrorCurveChart
              errors={[...state.errorHistory, ...(state.errorHistory.length < session.current_day ? [state.currentError] : [])]}
              currentDay={session.current_day}
              target={2}
              tolerance={3}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
              <span style={{ color: '#c9b896' }}>
                已记录 <b style={{ color: '#d4a84b' }}>{state.errorHistory.length}</b> 天数据
              </span>
              <span style={{ color: '#c9b896' }}>
                达标天数: <b style={{ color: '#5a9e5a' }}>
                  {state.errorHistory.filter(e => e <= 2).length}
                </b> / {state.errorHistory.length}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title"><span className="icon">🛠</span> 零件维护（磨损≥30%可操作）</h3>
            <PartStatusPanel
              partWears={state.partWears}
              onRepair={repairPart}
              canRepair={session.status === 'playing'}
              alreadyRepaired={repairedToday}
            />
          </div>

          <div className="card">
            <h3 className="card-title"><span className="icon">💡</span> 维修策略提示</h3>
            <div style={{ fontSize: 12, color: '#c9b896', lineHeight: 1.8 }}>
              <p style={{ marginTop: 0 }}><b style={{ color: '#d4a84b' }}>摆长：</b>理想值约993.62mm。温度每高10°C，金属膨胀约万分之一，摆长变长，走时变慢。</p>
              <p><b style={{ color: '#d4a84b' }}>齿轮：</b>标准比 48:36:24 = 2.0。偏离越大，传动误差越大。</p>
              <p><b style={{ color: '#d4a84b' }}>润滑：</b>85%以上最佳，每低10%误差增加约1.5秒。</p>
              <p><b style={{ color: '#d4a84b' }}>锤序：</b>顺序错误每一位，误差增加4-5秒。</p>
              <p><b style={{ color: '#d4a84b' }}>磨损：</b>超过70%产生额外误差；雪天/大风磨损×1.5-1.8。</p>
              <p style={{ marginBottom: 0, padding: 8, background: '#2a2018', borderRadius: 4, borderLeft: '3px solid #d47a2a' }}>
                <b>策略：</b>每天先看天气→补摆长→润滑→检查磨损→最后验证误差，再进入下一天。
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title"><span className="icon">⚡</span> 快捷操作</h3>
            <div className="btn-row" style={{ flexDirection: 'column' }}>
              <button className="btn btn-sm btn-full" onClick={() => nav(`/report/${uuid}`)}>
                📄 查看完整校准报告
              </button>
              <button className="btn btn-sm btn-full" onClick={() => loadState()}>
                🔃 刷新局次状态
              </button>
              <button className="btn btn-sm btn-full" onClick={() => nav('/')}>
                🏠 返回主菜单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
