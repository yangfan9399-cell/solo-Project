import { useState } from 'react';
import type { CalibrationReport, WeatherType } from '~/types/game';
import { WEATHER_ICON, WEATHER_NAME, PART_NAME_CN, SCENARIO_NAME, classError, formatNumber } from '~/utils/format';

interface Props {
  report: CalibrationReport;
  session?: {
    player_name: string;
    seed_scenario: string;
    total_days: number;
  };
}

export default function CalibrationReportView({ report, session }: Props) {
  const [tab, setTab] = useState<'summary' | 'daily' | 'causes'>('summary');
  const { start_summary, final_summary, daily_logs, change_causes } = report;
  const verdictText = {
    perfect: '★ 完美校准',
    pass: '✓ 达标通过',
    fail: '✗ 校准失败',
  }[final_summary.verdict];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className={`verdict-badge ${final_summary.verdict}`}>{verdictText}</div>
        {session && (
          <div style={{ fontSize: 12, color: '#8a7a5c', marginBottom: 8 }}>
            钟匠: <strong style={{ color: '#c9b896' }}>{session.player_name}</strong>
            　|　场景: <strong style={{ color: '#c9b896' }}>{SCENARIO_NAME[session.seed_scenario] ?? session.seed_scenario}</strong>
            　|　周期: <strong style={{ color: '#c9b896' }}>{session.total_days}天</strong>
          </div>
        )}
      </div>

      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>
          概览对比
        </button>
        <button className={`tab-btn ${tab === 'daily' ? 'active' : ''}`} onClick={() => setTab('daily')}>
          维修日志
        </button>
        <button className={`tab-btn ${tab === 'causes' ? 'active' : ''}`} onClick={() => setTab('causes')}>
          变化归因
        </button>
      </div>

      {tab === 'summary' && (
        <div>
          <div className="report-section">
            <h4>📋 初始状态 vs 最终状态</h4>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="label">初始误差</div>
                <div className={`value ${classError(start_summary.initial_error)}`}>
                  {formatNumber(start_summary.initial_error)}s
                </div>
              </div>
              <div className="summary-item">
                <div className="label">最终误差</div>
                <div className={`value ${classError(final_summary.final_error)}`}>
                  {formatNumber(final_summary.final_error)}s
                </div>
              </div>
              <div className="summary-item">
                <div className="label">初始天气</div>
                <div className="value" style={{ fontSize: 13 }}>
                  {WEATHER_ICON[start_summary.initial_weather]} {WEATHER_NAME[start_summary.initial_weather]}
                </div>
              </div>
              <div className="summary-item">
                <div className="label">校准精准度</div>
                <div className="value gold">{final_summary.accuracy}%</div>
              </div>
              <div className="summary-item">
                <div className="label">调整操作次数</div>
                <div className="value">{final_summary.total_adjustments}</div>
              </div>
              <div className="summary-item">
                <div className="label">零件修复次数</div>
                <div className="value">{final_summary.parts_repaired}</div>
              </div>
              <div className="summary-item" style={{ gridColumn: '1 / -1', borderLeftColor: '#d4a84b' }}>
                <div className="label">最终结算分数（后端按明细重算）</div>
                <div className="value" style={{ fontSize: 22, color: '#d4a84b' }}>
                  {final_summary.score}
                </div>
              </div>
            </div>
          </div>

          <div className="report-section">
            <h4>🔧 零件状态前后对比</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Object.keys(start_summary.initial_parts_condition) as Array<keyof typeof start_summary.initial_parts_condition>).map(part => {
                const before = start_summary.initial_parts_condition[part];
                const lastDay = daily_logs[daily_logs.length - 1];
                const after = lastDay?.parts_condition?.[part] ?? before;
                const diff = after - before;
                return (
                  <div key={part} style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr 90px',
                    gap: 10,
                    alignItems: 'center',
                    fontSize: 12,
                  }}>
                    <span style={{ color: '#c9b896' }}>{PART_NAME_CN[part] ?? part}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: '#1a1410',
                        fontFamily: 'monospace',
                        color: before < 40 ? '#5a9e5a' : before < 70 ? '#d47a2a' : '#c84b4b',
                      }}>{before.toFixed(0)}%</span>
                      <span style={{ color: '#8a7a5c' }}>→</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 3,
                        background: '#1a1410',
                        fontFamily: 'monospace',
                        color: after < 40 ? '#5a9e5a' : after < 70 ? '#d47a2a' : '#c84b4b',
                      }}>{after.toFixed(0)}%</span>
                    </div>
                    <span style={{
                      textAlign: 'right',
                      fontFamily: 'monospace',
                      color: diff > 15 ? '#c84b4b' : diff < 0 ? '#5a9e5a' : '#8a7a5c',
                      fontSize: 11,
                    }}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === 'daily' && (
        <div className="report-section" style={{ borderBottom: 'none', maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
          {daily_logs.map(log => {
            const errCls = classError(log.evening_error);
            return (
              <div key={log.day} className="daily-log-item">
                <div className="daily-log-header">
                  <span>
                    Day {log.day}　
                    {WEATHER_ICON[log.weather as WeatherType]}
                    <span style={{ color: '#c9b896', fontWeight: 400, marginLeft: 4 }}>
                      {WEATHER_NAME[log.weather as WeatherType]} {log.temperature.toFixed(1)}°C
                    </span>
                  </span>
                  <span className={`stat-value ${errCls}`} style={{ fontFamily: 'monospace' }}>
                    {formatNumber(log.evening_error)}s
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#8a7a5c', marginBottom: 4 }}>
                  早晨误差: {formatNumber(log.morning_error)}s → 校准后: <span style={{ color: '#d4a84b' }}>{formatNumber(log.evening_error)}s</span>
                </div>
                {log.adjustments.length > 0 && (
                  <ul className="daily-log-adjustments">
                    {log.adjustments.slice(0, 5).map((a, i) => <li key={i}>{a}</li>)}
                    {log.adjustments.length > 5 && <li>... 共 {log.adjustments.length} 项操作</li>}
                  </ul>
                )}
                <div className="parts-mini">
                  {Object.entries(log.parts_condition || {}).map(([p, w]) => (
                    <span key={p}>{PART_NAME_CN[p] ?? p} {(w as number).toFixed(0)}%</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'causes' && (
        <div className="report-section" style={{ borderBottom: 'none' }}>
          <h4>🔍 每日误差变化原因分析</h4>
          {change_causes.length === 0 && (
            <div style={{ color: '#8a7a5c', fontSize: 13, padding: 12, textAlign: 'center' }}>
              暂无足够数据进行归因分析（至少需要2天记录）
            </div>
          )}
          {change_causes.map(c => {
            const deltaCls = c.error_change > 0.5 ? 'up' : c.error_change < -0.5 ? 'down' : 'flat';
            return (
              <div key={c.day} className="cause-item">
                <span className="cause-day">Day{c.day}</span>
                <span className="cause-text">
                  <strong style={{ color: '#f5e8d0' }}>{c.impact}</strong>
                  <br />
                  <span style={{ color: '#8a7a5c' }}>{c.cause}</span>
                </span>
                <span className={`cause-delta ${deltaCls}`}>
                  {c.error_change > 0 ? '+' : ''}{c.error_change.toFixed(2)}s
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
