import type { TimeSlot } from "~/models/types";
import { getRoleName, getSlotName } from "~/models/gameLogic.server";

export function TrustBar({ level, size = 10 }: { level: number; size?: number }) {
  const cls =
    level <= 3 ? "filled-low" : level <= 6 ? "filled-mid" : "filled";
  return (
    <span className="trust-bar" title={`信任度: ${level}/10`}>
      {Array.from({ length: size }).map((_, i) => (
        <span key={i} className={i < level ? cls : ""} />
      ))}
    </span>
  );
}

export function RoleTag({ role }: { role: string }) {
  const cls =
    role === "visitor"
      ? "tag-blue"
      : role === "maintenance"
      ? "tag-green"
      : "tag-purple";
  return <span className={`tag ${cls}`}>{getRoleName(role)}</span>;
}

export function SlotTag({ slot }: { slot: TimeSlot }) {
  return <span className="tag tag-gold">{getSlotName(slot)}</span>;
}

export function EventTypeTag({ type }: { type: string }) {
  const map: Record<string, string> = {
    ASSIGN_OK: "tag-green",
    THEFT: "tag-red",
    LOCKED_IN: "tag-red",
    DUPLICATION_RISK: "tag-red",
    ROLLBACK: "tag-purple",
    KEY_GROUP_OK: "tag-blue",
    PUZZLE_SOLVED: "tag-green",
    TRACE_COMPLETE: "tag-blue",
  };
  const label: Record<string, string> = {
    ASSIGN_OK: "正常分配",
    THEFT: "失窃",
    LOCKED_IN: "幽闭",
    DUPLICATION_RISK: "复制风险",
    ROLLBACK: "回滚",
    KEY_GROUP_OK: "编组通过",
    PUZZLE_SOLVED: "谜题解决",
    TRACE_COMPLETE: "追踪完成",
  };
  return <span className={`tag ${map[type] || ""}`}>{label[type] || type}</span>;
}

export function SecurityBadge({ level }: { level: number }) {
  const color =
    level <= 2
      ? "tag-blue"
      : level <= 3
      ? "tag-gold"
      : level <= 4
      ? "tag-purple"
      : "tag-red";
  return (
    <span className={`tag ${color}`} title={`安保等级 ${level}/5`}>
      {"🔒".repeat(Math.max(1, level))} Lv.{level}
    </span>
  );
}

export function RiskBar({ risk }: { risk: number }) {
  const pct = (risk / 10) * 100;
  const color =
    risk <= 3
      ? "linear-gradient(90deg,#27ae60,#2ecc71)"
      : risk <= 6
      ? "linear-gradient(90deg,#f39c12,#e67e22)"
      : "linear-gradient(90deg,#e74c3c,#c0392b)";
  return (
    <div className="key-risk-bar" title={`复制风险: ${risk}/10`}>
      <div className="key-risk-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
