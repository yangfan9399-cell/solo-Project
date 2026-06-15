import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@remix-run/react';
import CalibrationReportView from '~/components/CalibrationReportView';
import ErrorCurveChart from '~/components/ErrorCurveChart';
import MaintenanceCalendar from '~/components/MaintenanceCalendar';
import type { CalibrationReport, GameSession, WeatherType } from '~/types/game';
import type { RuntimeState } from '~/server/gameService';
import { SCENARIO_NAME, formatNumber } from '~/utils/format';

export default function ReportPage() {
  const { uuid } = useParams();
  const nav = useNavigate();
  const [report, setReport] = useState<CalibrationReport | null>(null);
  const [state, setState] = useState<RuntimeState | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!uuid) return;
      setLoading(true);
      try {
        const [r1, r2] = await Promise.all([
          fetch(`/api/sessions/${uuid}/report`),
          fetch(`/api/sessions/${uuid}`),
        ]);
        const d1 = await r1.json();
        const d2 = await r2.json();
        if (d1.ok) setReport(d1.report); setScore(d1.score ?? null);
        if (d2.ok) setState(d2.state);
        if (!d1.ok) setError(d1.error || '报告加载失败');
      } catch (e: any) {
        setError('网络错误: ' + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [uuid]);

  if (loading) return <div className="loading">正在生成校准报告...</div>;

  if (error) return (
    <div className="home-screen">
      <div className="error-banner bad" style={{ maxWidth: 480, margin: '0 auto' }}>
        ❌ {error}
        <div style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={() => nav('/')}>返回首页</button>
        </div>
      </div>
    </div>
  );

  const session = state?.session;
  const weatherHistory = state?.weatherHistory ?? [];
  const errorHistory = state?.errorHistory ?? [];
  const totalDays = session?.total_days ?? 7;
  const currentDay = session?.current_day ?? 1;

  const calendarDays = Array.from({ length: totalDays }, (_, i) => i + 1).map(d => ({
    day: d,
    weather: (weatherHistory[d - 1] ?? (state?.currentWeather || 'sunny')) as WeatherType,
    error: d - 1 < errorHistory.length ? errorHistory[d - 1] : (d === currentDay ? state?.currentError ?? null : null),
  }));

  const finalScore = score ?? report?.final_summary?.score ?? null;

  return (
    <div>
      <div className="page-header">
        <h1>📜 古钟楼校准报告</h1>
        <p className="subtitle">
          {session ? (
            <>
              钟匠：<b>{session.player_name}</b>　|　
              场景：<b style={{ color: '#d4a84b' }}>{SCENARIO_NAME[session.seed_scenario] ?? session.seed_scenario}</b>　|　
              状态：<b style={{
                color: session.status === 'completed' ? '#5a9e5a' : session.status === 'failed' ? '#c84b4b' : session.status === 'rolled_back' ? '#d47a2a' : '#4ba89e'
              }}>{session.status === 'completed' ? '校准完成' : session.status === 'failed' ? '校准失败' : session.status === 'rolled_back' ? '已回滚' : '进行中'}</b>
            </>
          ) : ''}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 20 }}>
        <button className="btn btn-sm" onClick={() => nav('/')}>🏠 首页</button>
        {session?.status === 'playing' && uuid && (
          <button className="btn btn-sm btn-primary" onClick={() => nav(`/game/${uuid}`)}>
            ← 继续维修
          </button>
        )}
        {finalScore != null && (
          <div style={{
            padding: '10px 28px',
            background: 'linear-gradient(135deg, #a88432, #b87333)',
            borderRadius: 8,
            color: '#1a1410',
            fontWeight: 700,
            fontSize: 18,
            border: '1px solid #d4a84b',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            最终分数: {finalScore}
          </div>
        )}
      </div>

      <div className="grid-layout" style={{ gridTemplateColumns: '1fr 420px' }}>
        <div className="card">
          <h3 className="card-title"><span className="icon">📄</span> 详细校准报告</h3>
          {report && (
            <CalibrationReportView report={report} session={session ? {
              player_name: session.player_name,
              seed_scenario: session.seed_scenario,
              total_days: session.total_days,
            } : undefined} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title"><span className="icon">📈</span> 全程误差曲线</h3>
            <ErrorCurveChart
              errors={errorHistory}
              currentDay={Math.min(currentDay, totalDays)}
              target={2}
              tolerance={3}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
              <span style={{ color: '#c9b896' }}>
                共 <b style={{ color: '#d4a84b' }}>{errorHistory.length}</b> 天
              </span>
              <span style={{ color: '#c9b896' }}>
                达标 <b style={{ color: '#5a9e5a' }}>{errorHistory.filter(e => e <= 2).length}</b>　
                容差 <b style={{ color: '#d47a2a' }}>{errorHistory.filter(e => e > 2 && e <= 3).length}</b>　
                超限 <b style={{ color: '#c84b4b' }}>{errorHistory.filter(e => e > 3).length}</b>
              </span>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title"><span className="icon">📅</span> 维修日历（点击查看每日详情）</h3>
            <MaintenanceCalendar
              totalDays={totalDays}
              currentDay={currentDay}
              days={calendarDays}
            />
          </div>

          {report && (
            <div className="card">
              <h3 className="card-title"><span className="icon">🎯</span> 最终结论</h3>
              <div className="stat-row">
                <span className="stat-label">最终误差</span>
                <span className={`stat-value ${report.final_summary.final_error <= 2 ? 'good' : report.final_summary.final_error <= 3 ? 'warn' : 'bad'}`} style={{ fontFamily: 'monospace', fontSize: 15 }}>
                  {formatNumber(report.final_summary.final_error)}s
                </span>
              </div>
              <div className="stat-row">
                <span className="stat-label">校准精准度</span>
                <span className="stat-value gold">{report.final_summary.accuracy}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">总调整操作</span>
                <span className="stat-value">{report.final_summary.total_adjustments} 次</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">零件修复</span>
                <span className="stat-value">{report.final_summary.parts_repaired} 次</span>
              </div>
              <div style={{ marginTop: 12, padding: 12, background: '#2a2018', borderRadius: 6, fontSize: 12, lineHeight: 1.7 }}>
                <b style={{ color: '#d4a84b' }}>🏆 评定：</b>
                {report.final_summary.verdict === 'perfect' && <span style={{ color: '#5a9e5a' }}>完美校准！每日误差均达到目标值以下，钟楼恢复古代精度，百年报时传承不绝。</span>}
                {report.final_summary.verdict === 'pass' && <span style={{ color: '#4ba89e' }}>校准达标。误差虽有波动但均在容差内，日常报时可信赖。建议每月微调一次。</span>}
                {report.final_summary.verdict === 'fail' && <span style={{ color: '#c84b4b' }}>校准未通过。建议检查：摆长是否因天气再次偏移、齿轮比是否精确、零件高磨损是否及时处理、润滑度是否长期不足。</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
