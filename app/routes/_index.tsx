import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import type { GameSession } from '~/types/game';
import { SCENARIO_NAME } from '~/utils/format';

interface ScenarioCard {
  id: 'normal' | 'wear_abnormal' | 'rollback';
  icon: string;
  title: string;
  desc: string;
}

const SCENARIOS: ScenarioCard[] = [
  {
    id: 'normal',
    icon: '☀️',
    title: '场景一：正常校准',
    desc: '天气相对平稳，通过合理操作逐步将误差控制在目标范围内。体验完整的维修工作流程。',
  },
  {
    id: 'wear_abnormal',
    icon: '❄️',
    title: '场景二：磨损异常',
    desc: '连续雪天和大风导致金属收缩和零件磨损急剧加速，需要频繁修复并做出极端调整。',
  },
  {
    id: 'rollback',
    icon: '🔄',
    title: '场景三：回滚修正',
    desc: '中途出现错误操作，需要回到之前的某天重新规划，考验回滚和纠错能力。',
  },
];

export default function HomePage() {
  const nav = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [scenario, setScenario] = useState<'normal' | 'wear_abnormal' | 'rollback'>('normal');
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    refreshSessions();
  }, []);

  async function refreshSessions() {
    try {
      const r = await fetch('/api/sessions/list');
      const d = await r.json();
      if (d.ok) setSessions(d.sessions || []);
    } catch {}
  }

  async function handleStart() {
    setLoading(true);
    setMessage(null);
    try {
      const r = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName, scenario }),
      });
      const d = await r.json();
      if (d.ok) {
        nav(`/game/${d.sessionUuid}`);
      } else {
        setMessage('创建失败: ' + (d.error || '未知错误'));
      }
    } catch (e: any) {
      setMessage('请求异常: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setMessage('正在生成种子数据...');
    try {
      const r = await fetch('/api/seeds', { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        setMessage('✅ 种子数据已生成：' + Object.entries(d.uuids).map(([k, v]) => `${k}=${(v as string).slice(-6)}`).join('、'));
        setSessions(d.sessions || []);
      }
    } catch (e: any) {
      setMessage('种子生成失败: ' + e.message);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="home-screen">
      <div className="hero-bell">🔔</div>
      <h1 style={{ margin: 0, color: '#d4a84b', fontSize: 32, letterSpacing: 2 }}>
        古钟楼齿轮报时校准游戏
      </h1>
      <p style={{ color: '#c9b896', marginTop: 10, fontSize: 14, lineHeight: 1.8 }}>
        维修一座走时漂移的钟楼，通过调整<b style={{ color: '#d4a84b' }}>摆长</b>、
        <b style={{ color: '#d4a84b' }}>齿轮比</b>、
        <b style={{ color: '#d4a84b' }}>润滑程度</b>和
        <b style={{ color: '#d4a84b' }}>锤击顺序</b>让报时恢复准确。
        <br />
        天气会影响金属伸缩，零件磨损会积累——在7天内让每日误差≤2秒即可完美通关。
      </p>

      <div className="name-input">
        <input
          type="text"
          placeholder="输入您的钟匠名字（可选）"
          value={playerName}
          onChange={e => setPlayerName(e.target.value)}
          maxLength={20}
        />
      </div>

      <div className="scenario-cards">
        {SCENARIOS.map(s => (
          <div
            key={s.id}
            className={`scenario-card ${scenario === s.id ? 'selected' : ''}`}
            onClick={() => setScenario(s.id)}
          >
            <div className="scenario-icon">{s.icon}</div>
            <div className="scenario-title">{s.title}</div>
            <p className="scenario-desc">{s.desc}</p>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary"
        style={{ fontSize: 15, padding: '12px 36px', minWidth: 240 }}
        onClick={handleStart}
        disabled={loading}
      >
        {loading ? '创建中...' : `▶ 开始校准 · ${SCENARIO_NAME[scenario]}`}
      </button>

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-sm" onClick={handleSeed} disabled={seeding}>
          {seeding ? '生成种子中...' : '🌱 载入三个典型种子样本（验收用）'}
        </button>
      </div>

      {message && (
        <div className="error-banner info" style={{ marginTop: 18 }}>
          {message}
        </div>
      )}

      <div className="sessions-list">
        <h3>📋 历史局次（点击进入）</h3>
        {sessions.length === 0 ? (
          <div style={{ color: '#8a7a5c', fontSize: 12, padding: 12, textAlign: 'center' }}>
            暂无记录，点击上方「开始校准」或「载入种子样本」创建局次
          </div>
        ) : (
          sessions.map(s => (
            <div
              key={s.id}
              className="session-item"
              onClick={() => s.status === 'playing' ? nav(`/game/${s.session_uuid}`) : nav(`/report/${s.session_uuid}`)}
            >
              <div className="session-left">
                <span className={`session-status ${s.status}`}>
                  {s.status === 'playing' ? '进行中' : s.status === 'completed' ? '已完成' : s.status === 'failed' ? '已失败' : '已回滚'}
                </span>
                <span>
                  <strong>{s.player_name}</strong>
                  <span style={{ color: '#8a7a5c', marginLeft: 8, fontSize: 12 }}>
                    {SCENARIO_NAME[s.seed_scenario] ?? s.seed_scenario}
                  </span>
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: '#8a7a5c' }}>
                <div>Day {s.current_day}/{s.total_days}</div>
                <div>
                  {s.final_score != null ? <span style={{ color: '#d4a84b', fontFamily: 'monospace', fontWeight: 700 }}>{s.final_score}分</span> : '进行中'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
