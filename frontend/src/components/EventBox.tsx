import { useMemo } from "react";
import { useGameStore } from "../store/gameStore";
import type { GameEventType } from "@cbcp/shared";

const eventTypeColorMap: Record<GameEventType, string> = {
  risk: "risk",
  reward: "reward",
  translate: "translate",
  overwrite: "overwrite",
  hidden: "hidden",
};

const getEventTypeFromId = (
  eventId: string,
  levelEvents: { id: string; type: GameEventType }[]
): GameEventType | null => {
  const ev = levelEvents.find((e) => e.id === eventId);
  return ev ? ev.type : null;
};

interface EnrichedLogEntry {
  stepIndex: number;
  eventId: string;
  message: string;
  timestamp: number;
  type: GameEventType;
}

function EventBox() {
  const { eventLog, currentLevelId, levels } = useGameStore();
  const level = levels.find((l) => l.id === currentLevelId);

  const enrichedLog = useMemo<EnrichedLogEntry[]>(() => {
    if (!level) return [];
    return eventLog
      .map((entry) => {
        const type = getEventTypeFromId(entry.eventId, level.events);
        if (!type) return null;
        return { ...entry, type };
      })
      .filter((e): e is EnrichedLogEntry => e !== null);
  }, [eventLog, level]);

  const sortedLog = useMemo(() => {
    return [...enrichedLog].sort((a, b) => b.timestamp - a.timestamp);
  }, [enrichedLog]);

  const stats = useMemo(() => {
    let riskCount = 0;
    let rewardCount = 0;
    let otherCount = 0;
    for (const entry of enrichedLog) {
      if (entry.type === "risk") riskCount++;
      else if (entry.type === "reward") rewardCount++;
      else otherCount++;
    }
    return { riskCount, rewardCount, otherCount };
  }, [enrichedLog]);

  if (!level) {
    return (
      <div className="panel">
        <div className="panel-title">珊瑚钟室路径解谜游戏 事件匣</div>
        <div className="empty-state">
          <div>
            <div className="empty-state-icon">📜</div>
            <div className="empty-state-title">尚未加载关卡</div>
            <div>选择关卡后事件将在此实时显示</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">珊瑚钟室路径解谜游戏 事件匣</div>

      <div className="event-stats">
        <span className="event-stat-chip risk">
          巳号风险 <b>{stats.riskCount}</b>
        </span>
        <span className="event-stat-chip reward">
          申号奖励 <b>{stats.rewardCount}</b>
        </span>
        <span className="event-stat-chip other">
          其他 <b>{stats.otherCount}</b>
        </span>
      </div>

      {sortedLog.length === 0 ? (
        <div className="empty-state">
          <div>
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-title">暂无触发事件</div>
            <div>移动路径时会触发各类事件</div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>
              红色=巳号风险 · 绿色=申号奖励 · 蓝色=转译 · 紫色=复写 · 金色=隐藏
            </div>
          </div>
        </div>
      ) : (
        <div className="event-list">
          {sortedLog.map((entry, idx) => {
            const colorClass = eventTypeColorMap[entry.type];
            return (
              <div key={idx} className={`event-item ${colorClass}`}>
                <div>
                  <span className="event-step">
                    第 {entry.stepIndex + 1} 步
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
                    #{entry.eventId}
                  </span>
                </div>
                <div className="event-msg" style={{ marginTop: 4 }}>
                  {entry.message}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default EventBox;
