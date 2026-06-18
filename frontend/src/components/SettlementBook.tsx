import { useGameStore } from "../store/gameStore";
import { WinFormula } from "@cbcp/shared";
import type { GameField } from "@cbcp/shared";

const riskLevelLabels: Record<number, string> = {
  0: "安全",
  1: "轻度",
  2: "中度",
  3: "重度",
  4: "极危",
};

const winFormulaLabels: Record<WinFormula, string> = {
  [WinFormula.NO_RISK_AND_REACH]: "到达终点且巳号风险不超过阈值",
  [WinFormula.REACH_END_WITH_REWARD]: "到达终点且申号奖励达到阈值",
  [WinFormula.HIDDEN_TRIGGERED_AND_END]: "触发所有隐藏事件并到达终点",
};

interface FinalFieldDef {
  key: keyof GameField;
  label: string;
}

const finalFieldDefs: FinalFieldDef[] = [
  { key: "trackSwitchValue", label: "珊瑚钟室换轨值" },
  { key: "translationSlot", label: "珊瑚钟室转译槽" },
  { key: "overwriteMark", label: "珊瑚钟室复写痕" },
  { key: "siRisk", label: "巳号风险" },
  { key: "shenReward", label: "申号奖励" },
  { key: "wuFailFactor", label: "午号失败因子" },
];

function SettlementBook() {
  const {
    settleGame,
    settlementResult,
    settleError,
    currentLevelId,
    steps,
    levels,
  } = useGameStore();

  const level = levels.find((l) => l.id === currentLevelId);
  const canSettle = !!currentLevelId && steps.length > 0;

  const riskLevelText =
    settlementResult !== null
      ? riskLevelLabels[settlementResult.riskLevel] ?? `等级${settlementResult.riskLevel}`
      : "";

  const winFormulaText = level
    ? winFormulaLabels[level.winFormula] ?? String(level.winFormula)
    : "";

  return (
    <div className="panel">
      <div className="panel-title">珊瑚钟室路径解谜游戏 结算簿</div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        <button
          className="action-button action-button-primary"
          onClick={settleGame}
          disabled={!canSettle}
          style={{ justifyContent: "center", padding: "12px 16px", fontSize: 14 }}
        >
          ⚖️ 后端结算
        </button>

        {!canSettle && currentLevelId && (
          <div
            style={{
              fontSize: 12,
              color: "var(--coral-text-muted)",
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            请先在局面盘移动至少一步，再提交结算
          </div>
        )}

        {settleError && !settlementResult && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(230, 57, 70, 0.12)",
              border: "1px solid rgba(230, 57, 70, 0.4)",
              fontSize: 13,
              color: "#ffb0b0",
              lineHeight: 1.5,
            }}
          >
            ⚠️ {settleError}
          </div>
        )}

        {!settlementResult ? (
          <div className="settle-suggestion">
            <div style={{ fontSize: 38, opacity: 0.55 }}>📖</div>
            <div style={{ fontWeight: 700, color: "var(--coral-text)", fontSize: 15 }}>
              等待结算
            </div>
            <div style={{ maxWidth: 320 }}>
              结算将由后端按 <b style={{ color: "var(--coral-gold)" }}>换轨值</b>{" "}
              和 <b style={{ color: "var(--coral-gold)" }}>路径解谜步骤</b>{" "}
              重新计算最终胜负与奖励
            </div>
            {level && (
              <div
                style={{
                  marginTop: 6,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "rgba(255, 209, 102, 0.08)",
                  border: "1px dashed rgba(255, 209, 102, 0.3)",
                  fontSize: 12,
                  color: "var(--coral-gold)",
                }}
              >
                关卡规则：{winFormulaText}
              </div>
            )}
          </div>
        ) : (
          <div className="settle-result">
            <div
              className={`result-banner ${
                settlementResult.success ? "success" : "fail"
              }`}
            >
              <div className="result-icon">
                {settlementResult.success ? "🏆" : "💥"}
              </div>
              <div className="result-title">
                {settlementResult.success ? "通关成功" : "挑战失败"}
              </div>
              <div className="result-reason">{settlementResult.reason}</div>
            </div>

            <div className="result-stats">
              <div className="result-stat-card">
                <div className="result-stat-label">总奖励</div>
                <div className="result-stat-value reward">
                  +{settlementResult.totalReward}
                </div>
              </div>
              <div className="result-stat-card">
                <div className="result-stat-label">风险等级</div>
                <div className="result-stat-value risk">
                  {settlementResult.riskLevel} · {riskLevelText}
                </div>
              </div>
            </div>

            <div
              className={`result-formula-hit ${
                settlementResult.formulaHit ? "hit" : "miss"
              }`}
            >
              <span>胜利公式命中</span>
              <span>{settlementResult.formulaHit ? "✓ 已满足" : "✗ 未满足"}</span>
            </div>

            {settlementResult.finalField && (
              <div className="result-final-field">
                <div className="result-final-field-title">最终数值场</div>
                <div className="result-final-field-grid">
                  {finalFieldDefs.map((def) => (
                    <div key={def.key} className="result-final-field-item">
                      <span>{def.label}</span>
                      <span className="result-final-field-item-value">
                        {settlementResult.finalField![def.key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settlementResult.debugTrace &&
              settlementResult.debugTrace.length > 0 && (
                <details className="debug-trace-details">
                  <summary className="debug-trace-summary">
                    🔍 调试追踪 ({settlementResult.debugTrace.length} 条)
                  </summary>
                  <div className="debug-trace-body">
                    {settlementResult.debugTrace.join("\n")}
                  </div>
                </details>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SettlementBook;
