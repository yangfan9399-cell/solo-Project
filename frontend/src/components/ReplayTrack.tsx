import { useGameStore } from "../store/gameStore";

function ReplayTrack() {
  const {
    steps,
    currentStepIdx,
    currentLevelId,
    levels,
    jumpToStep,
    undoStep,
    resetLevel,
  } = useGameStore();

  const level = levels.find((l) => l.id === currentLevelId);

  const handleJumpToLatest = () => {
    if (steps.length === 0) {
      jumpToStep(-1);
    } else {
      jumpToStep(steps.length - 1);
    }
  };

  const isAtLatest =
    steps.length === 0 || currentStepIdx === steps.length - 1;

  if (!level) {
    return (
      <div className="panel">
        <div className="panel-title">珊瑚钟室路径解谜游戏 回放轴</div>
        <div className="empty-state">
          <div>
            <div className="empty-state-icon">⏱️</div>
            <div className="empty-state-title">尚未开始</div>
            <div>选择关卡后开始</div>
            <div style={{ fontSize: 12, marginTop: 8, opacity: 0.75 }}>
              所有路径步骤将在此处记录，可随时回溯
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-title">珊瑚钟室路径解谜游戏 回放轴</div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div className="replay-info">
          <span>
            总步数：
            <span className="replay-info-count">{steps.length}</span>
          </span>
          <span>
            当前步骤：
            <span className="replay-info-count">
              {currentStepIdx < 0
                ? "初始状态"
                : `${currentStepIdx + 1} / ${steps.length}`}
            </span>
            {!isAtLatest && (
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.7 }}>
                (回放模式)
              </span>
            )}
          </span>
        </div>

        {steps.length === 0 ? (
          <div className="empty-state">
            <div>
              <div className="empty-state-icon">👣</div>
              <div className="empty-state-title">尚未走出第一步</div>
              <div>从局面盘点击相邻格子开始移动</div>
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div className="replay-track">
              <button
                onClick={() => jumpToStep(-1)}
                className={`replay-node replay-node-start ${
                  currentStepIdx === -1 ? "replay-node-active" : ""
                }`}
                title="回到初始状态"
              >
                起
              </button>
              <div className="replay-connector" />
              {steps.map((step, idx) => {
                const isActive = idx === currentStepIdx;
                const isPassed = idx < currentStepIdx;
                const nodeClass = [
                  "replay-node",
                  isActive ? "replay-node-active" : "",
                  isPassed ? "replay-node-passed" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={step.stepIndex} style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => jumpToStep(idx)}
                      className={nodeClass}
                      title={`第 ${idx + 1} 步：(${step.positionFrom.x},${step.positionFrom.y}) → (${step.positionTo.x},${step.positionTo.y})${
                        step.triggeredEventIds.length > 0
                          ? ` · 触发${step.triggeredEventIds.length}个事件`
                          : ""
                      }`}
                    >
                      {idx + 1}
                    </button>
                    {idx < steps.length - 1 && <div className="replay-connector" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="replay-actions">
          <button
            className="action-button"
            onClick={undoStep}
            disabled={steps.length === 0 || currentStepIdx < 0}
          >
            ↶ 撤销一步
          </button>
          <button
            className="action-button action-button-danger"
            onClick={resetLevel}
            disabled={!currentLevelId}
          >
            ⟲ 重置本局
          </button>
          <button
            className="action-button action-button-gold"
            onClick={handleJumpToLatest}
            disabled={isAtLatest}
          >
            ➡ 回到最新
          </button>
        </div>

        {steps.length > 0 && (
          <div className="replay-save-tip">
            <span>💾</span>
            <span>
              已自动保存到回放轴，刷新页面后可继续当前局进度（本地存储）
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReplayTrack;
