import { useState } from 'react';
import type { StrikeOrderStep, PartName } from '~/types/game';
import { VALID_STRIKE_ORDERS, WEATHER_CONFIG } from '~/server/gameLogic';
import { WEATHER_ICON, WEATHER_NAME, STRIKE_NAME_CN, formatNumber } from '~/utils/format';
import type { RuntimeState } from '~/server/gameService';

interface Props {
  state: RuntimeState;
  onAdjustPendulum: (length: number) => void;
  onAdjustGears: (ga: number, gb: number, gc: number) => void;
  onAdjustLubrication: (level: number) => void;
  onSetStrikeOrder: (order: StrikeOrderStep[]) => void;
  onRepairPart: (part: PartName) => void;
  onAdvance: () => void;
  onOpenReport: () => void;
  onBackHome: () => void;
  repairedToday: Set<PartName>;
}

export default function ControlPanel({
  state,
  onAdjustPendulum,
  onAdjustGears,
  onAdjustLubrication,
  onSetStrikeOrder,
  onRepairPart,
  onAdvance,
  onOpenReport,
  onBackHome,
  repairedToday,
}: Props) {
  const [tab, setTab] = useState<'pendulum' | 'gear' | 'lube' | 'strike'>('pendulum');
  const [pendulum, setPendulum] = useState<number>(state.pendulumLength);
  const [gearA, setGearA] = useState<number>(state.gears.gearA);
  const [gearB, setGearB] = useState<number>(state.gears.gearB);
  const [gearC, setGearC] = useState<number>(state.gears.gearC);
  const [lub, setLub] = useState<number>(state.lubrication);
  const [order, setOrder] = useState<StrikeOrderStep[]>(state.strikeOrder);

  const weather = state.currentWeather;
  const temp = state.currentTemperature;
  const weatherCfg = WEATHER_CONFIG[weather];
  const session = state.session;
  const isPlaying = session.status === 'playing';

  const resetOrder = () => setOrder(VALID_STRIKE_ORDERS[0]);

  const canRepairAny = Object.entries(state.partWears).some(
    ([p, w]) => w >= 30 && !repairedToday.has(p as PartName)
  );

  return (
    <div>
      <div className="top-bar">
        <div className="top-bar-title">
          <h2>🔧 维修控制台</h2>
          <span className="scenario-tag">Day {session.current_day} / {session.total_days}</span>
          <span className="scenario-tag">
            {WEATHER_ICON[weather]} {WEATHER_NAME[weather]} {formatNumber(temp, 1)}°C
          </span>
        </div>
        <div className="top-bar-actions">
          <button className="btn btn-sm" onClick={onBackHome}>← 首页</button>
          <button className="btn btn-sm" onClick={onOpenReport} disabled={session.current_day < 2}>
            📄 报告
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={onAdvance}
            disabled={!isPlaying}
          >
            ⏭ 结束今日 → Day{session.current_day + 1}
          </button>
        </div>
      </div>

      <div className="error-banner info" style={{ marginBottom: 12 }}>
        <span>ℹ️</span>
        <span style={{ flex: 1 }}>{weatherCfg.description} | 金属膨胀系数: {(weatherCfg.expansion * 1e6).toFixed(2)}×10⁻⁶ /°C | 磨损倍率: ×{weatherCfg.wearMultiplier}</span>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'pendulum' ? 'active' : ''}`} onClick={() => setTab('pendulum')}>
          ⏱ 钟摆
        </button>
        <button className={`tab-btn ${tab === 'gear' ? 'active' : ''}`} onClick={() => setTab('gear')}>
          ⚙ 齿轮
        </button>
        <button className={`tab-btn ${tab === 'lube' ? 'active' : ''}`} onClick={() => setTab('lube')}>
          💧 润滑
        </button>
        <button className={`tab-btn ${tab === 'strike' ? 'active' : ''}`} onClick={() => setTab('strike')}>
          🔔 锤序
        </button>
      </div>

      {tab === 'pendulum' && (
        <div className="card">
          <h3 className="card-title"><span className="icon">⏱</span> 钟摆长度调整</h3>
          <div className="stat-row" style={{ marginBottom: 12 }}>
            <span className="stat-label">当前摆长（室温）</span>
            <span className="stat-value gold" style={{ fontFamily: 'monospace' }}>{formatNumber(state.pendulumLength)} mm</span>
          </div>
          <div className="stat-row" style={{ marginBottom: 12 }}>
            <span className="stat-label">热胀冷缩后实际</span>
            <span className="stat-value" style={{ fontFamily: 'monospace' }}>{formatNumber(state.thermalLength)} mm</span>
          </div>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <span className="stat-label">参考理想值</span>
            <span className="stat-value" style={{ fontFamily: 'monospace', color: '#5a9e5a' }}>993.62 mm</span>
          </div>
          <div className="form-group">
            <label>目标摆长 (900 - 1100 mm)</label>
            <div className="input-slider-row">
              <input
                type="range"
                min={900}
                max={1100}
                step={0.1}
                value={pendulum}
                onChange={e => setPendulum(Number(e.target.value))}
              />
              <span className="value-display">{formatNumber(pendulum)}</span>
            </div>
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={() => onAdjustPendulum(pendulum)}
              disabled={!isPlaying || Math.abs(pendulum - state.pendulumLength) < 0.1}
            >
              ✓ 确认调整
            </button>
            <button className="btn" onClick={() => setPendulum(993.62)} disabled={!isPlaying}>
              设为理想值
            </button>
          </div>
        </div>
      )}

      {tab === 'gear' && (
        <div className="card">
          <h3 className="card-title"><span className="icon">⚙</span> 齿轮齿数比调整</h3>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <span className="stat-label">当前 A:B:C</span>
            <span className="stat-value gold" style={{ fontFamily: 'monospace' }}>
              {state.gears.gearA} : {state.gears.gearB} : {state.gears.gearC}
            </span>
          </div>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <span className="stat-label">标准 A:B:C</span>
            <span className="stat-value" style={{ fontFamily: 'monospace', color: '#5a9e5a' }}>48 : 36 : 24</span>
          </div>
          <div className="gear-inputs">
            <div className="gear-input">
              <label>齿轮A (10-80)</label>
              <input className="number-input" type="number" min={10} max={80}
                value={gearA} onChange={e => setGearA(Number(e.target.value))} />
              <small>驱动轮</small>
            </div>
            <div className="gear-input">
              <label>齿轮B (10-80)</label>
              <input className="number-input" type="number" min={10} max={80}
                value={gearB} onChange={e => setGearB(Number(e.target.value))} />
              <small>传动轮</small>
            </div>
            <div className="gear-input">
              <label>齿轮C (10-80)</label>
              <input className="number-input" type="number" min={10} max={80}
                value={gearC} onChange={e => setGearC(Number(e.target.value))} />
              <small>擒纵轮</small>
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => onAdjustGears(gearA, gearB, gearC)}
              disabled={!isPlaying}
            >
              ✓ 更换齿轮组
            </button>
            <button className="btn" onClick={() => { setGearA(48); setGearB(36); setGearC(24); }} disabled={!isPlaying}>
              还原标准
            </button>
          </div>
        </div>
      )}

      {tab === 'lube' && (
        <div className="card">
          <h3 className="card-title"><span className="icon">💧</span> 齿轮组润滑度</h3>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <span className="stat-label">当前润滑度</span>
            <span className={`stat-value ${lub >= 85 ? 'good' : lub >= 60 ? 'warn' : 'bad'}`} style={{ fontFamily: 'monospace' }}>
              {formatNumber(state.lubrication, 1)}%
            </span>
          </div>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <span className="stat-label">建议阈值</span>
            <span className="stat-value" style={{ color: '#5a9e5a' }}>≥ 85% 最佳</span>
          </div>
          <div className="form-group">
            <label>目标润滑度 (0 - 100%)</label>
            <div className="input-slider-row">
              <input
                type="range"
                min={0}
                max={100}
                step={0.5}
                value={lub}
                onChange={e => setLub(Number(e.target.value))}
              />
              <span className="value-display">{formatNumber(lub, 1)}%</span>
            </div>
          </div>
          <div className="btn-row">
            <button
              className="btn btn-primary"
              onClick={() => onAdjustLubrication(lub)}
              disabled={!isPlaying || Math.abs(lub - state.lubrication) < 0.5}
            >
              ✓ 执行润滑
            </button>
            <button className="btn" onClick={() => setLub(95)} disabled={!isPlaying}>
              充足润滑
            </button>
          </div>
          {canRepairAny && (
            <div style={{ marginTop: 18, padding: '12px 14px', background: '#2a2018', borderRadius: 6, border: '1px solid #5a4830' }}>
              <div style={{ fontSize: 12, color: '#d4a84b', marginBottom: 8, fontWeight: 600 }}>
                🔧 零件修复（今日每零件限1次）
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(Object.entries(state.partWears) as Array<[PartName, number]>).map(([p, w]) => {
                  if (w < 30 || repairedToday.has(p)) return null;
                  return (
                    <button
                      key={p}
                      className="btn btn-sm btn-danger"
                      onClick={() => onRepairPart(p)}
                      disabled={!isPlaying}
                    >
                      修复 {STRIKE_NAME_CN[p as StrikeOrderStep] ?? p} ({w.toFixed(0)}%)
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'strike' && (
        <div className="card">
          <h3 className="card-title"><span className="icon">🔔</span> 报时锤击顺序</h3>
          <div className="stat-row" style={{ marginBottom: 12 }}>
            <span className="stat-label">当前顺序</span>
            <span className="stat-value gold" style={{ fontFamily: 'monospace', fontSize: 11 }}>
              {order.map(o => STRIKE_NAME_CN[o]).join(' → ')}
            </span>
          </div>
          <div className="stat-row" style={{ marginBottom: 16 }}>
            <span className="stat-label">标准顺序</span>
            <span className="stat-value" style={{ fontFamily: 'monospace', fontSize: 11, color: '#5a9e5a' }}>
              齿轮A → 齿轮B → 齿轮C → 报时锤
            </span>
          </div>
          <div className="strike-order-builder">
            <div className="strike-slots">
              {[0, 1, 2, 3].map(idx => (
                <div key={idx} className={`strike-slot ${order[idx] ? 'filled' : ''}`}>
                  <div style={{ fontSize: 10, color: '#8a7a5c', marginBottom: 3 }}>第{idx + 1}位</div>
                  {order[idx] ? <div>{STRIKE_NAME_CN[order[idx]]}</div> : <div>—</div>}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#8a7a5c', textAlign: 'center', marginTop: 4 }}>
              选择预设顺序组合:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {VALID_STRIKE_ORDERS.map((o, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${o.every((s, j) => s === order[j]) ? 'btn-primary' : ''}`}
                  onClick={() => setOrder([...o])}
                  style={{ justifyContent: 'flex-start', fontSize: 11 }}
                >
                  #{i + 1}: {o.map(s => STRIKE_NAME_CN[s]).join(' → ')}
                </button>
              ))}
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => onSetStrikeOrder([...order])}
              disabled={!isPlaying || order.every((s, i) => s === state.strikeOrder[i])}
            >
              ✓ 设定顺序
            </button>
            <button className="btn" onClick={resetOrder} disabled={!isPlaying}>
              还原标准
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
