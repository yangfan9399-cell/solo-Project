import type {
  Room,
  Key,
  Person,
  TimeSlot,
  EventType,
  AssignmentDetail,
  ResultRecord,
  LockState,
} from "./types";

export interface AssignmentResult {
  ok: boolean;
  events: {
    type: EventType;
    room?: string;
    message: string;
    severity: "info" | "warning" | "danger";
  }[];
  lockStateChanges: { roomId: string; wasLocked: boolean; nowLocked: boolean; reason: string }[];
}

const SLOT_NAMES: Record<TimeSlot, string> = {
  morning: "上午(08:00-12:00)",
  afternoon: "下午(12:00-18:00)",
  evening: "傍晚(18:00-22:00)",
  night: "深夜(22:00-08:00)",
};

const ROLE_NAMES: Record<string, string> = {
  visitor: "访客",
  maintenance: "维修工",
  nightwatch: "夜巡人员",
};

export function getSlotName(s: TimeSlot): string {
  return SLOT_NAMES[s];
}
export function getRoleName(r: string): string {
  return ROLE_NAMES[r] || r;
}

export function computeInitialLockStates(rooms: Room[]): Record<string, LockState> {
  const states: Record<string, LockState> = {};
  for (const r of rooms) {
    states[r.id] = {
      room_id: r.id,
      is_locked: r.security_level >= 3,
      last_access: null,
      accessed_by: null,
    };
  }
  return states;
}

export function validateAssignment(
  person: Person,
  key: Key,
  slot: TimeSlot,
  rooms: Room[],
  lockStates: Record<string, LockState>
): AssignmentResult {
  const events: AssignmentResult["events"] = [];
  const changes: AssignmentResult["lockStateChanges"] = [];

  const slotAllowed = key.allowed_slots.includes(slot);
  const requestedCoverage = person.requested_room_ids.every((rid) =>
    key.room_ids.includes(rid)
  );
  const maxSecurity = key.room_ids.reduce((m, rid) => {
    const r = rooms.find((x) => x.id === rid);
    return Math.max(m, r?.security_level ?? 0);
  }, 0);
  const trustShortfall = maxSecurity * 2 - person.trust_level;
  const duplicationDanger = key.duplication_risk >= 8 && person.trust_level <= 4;

  if (!slotAllowed) {
    events.push({
      type: "LOCKED_IN",
      room: key.room_ids[0],
      message: `❌ 幽闭警报：${person.name} 在 ${getSlotName(slot)} 使用 ${key.label}，但该钥匙仅允许在 ${key.allowed_slots.map(getSlotName).join("、")} 使用。人员将被锁在区域内！`,
      severity: "danger",
    });
  }

  if (!requestedCoverage) {
    const missing = person.requested_room_ids.filter((rid) => !key.room_ids.includes(rid));
    const missingNames = missing.map((rid) => rooms.find((r) => r.id === rid)?.name || rid).join("、");
    events.push({
      type: "LOCKED_IN",
      room: missing[0],
      message: `⚠️ 覆盖不足：${key.label} 无法到达 ${missingNames}，${person.name} 会被困在走廊无法完成任务。`,
      severity: "warning",
    });
  }

  if (trustShortfall > 0) {
    if (person.trust_level <= 3 && maxSecurity >= 4) {
      events.push({
        type: "THEFT",
        room: key.room_ids.find((rid) => (rooms.find((r) => r.id === rid)?.security_level ?? 0) >= 4),
        message: `🚨 失窃事件：${person.name}（信任度${person.trust_level}/10）进入了高安保区域 ${maxSecurity} 级，贵重物品被盗！`,
        severity: "danger",
      });
    } else if (person.trust_level <= 5 && maxSecurity >= 5) {
      events.push({
        type: "THEFT",
        room: key.room_ids.find((rid) => (rooms.find((r) => r.id === rid)?.security_level ?? 0) >= 5),
        message: `🔴 失窃风险：${person.name}（信任度${person.trust_level}）获准进入 ${maxSecurity} 级禁区，异常迹象出现！`,
        severity: "danger",
      });
    }
  }

  if (duplicationDanger) {
    events.push({
      type: "DUPLICATION_RISK",
      message: `🔑 复制风险：${key.label} 的复制风险等级为 ${key.duplication_risk}/10，${person.name} 信任度仅 ${person.trust_level}，极可能私印钥匙！`,
      severity: "danger",
    });
  } else if (key.duplication_risk >= 7 && person.trust_level <= 6) {
    events.push({
      type: "DUPLICATION_RISK",
      message: `⚠️ 复制警告：${key.label}（风险${key.duplication_risk}）交给信任度 ${person.trust_level} 的人员，存在安全隐患。`,
      severity: "warning",
    });
  }

  if (slotAllowed && requestedCoverage && trustShortfall <= 0 && !duplicationDanger) {
    events.push({
      type: "ASSIGN_OK",
      message: `✅ 分配正常：${person.name} 获得 ${key.label}，时段 ${getSlotName(slot)}，覆盖 ${key.room_ids.length} 个房间。`,
      severity: "info",
    });
  }

  for (const rid of key.room_ids) {
    const old = lockStates[rid];
    if (old) {
      let newLocked = old.is_locked;
      let reason = "";
      if (slotAllowed) {
        newLocked = false;
        reason = `通过 ${key.label} 于 ${getSlotName(slot)} 解锁`;
      } else if (events.some((e) => e.type === "LOCKED_IN")) {
        newLocked = true;
        reason = `时段错误 ${getSlotName(slot)}，触发自动反锁`;
      }
      if (newLocked !== old.is_locked) {
        changes.push({
          roomId: rid,
          wasLocked: old.is_locked,
          nowLocked: newLocked,
          reason,
        });
      }
    }
  }

  const hasDanger = events.some((e) => e.severity === "danger");

  return {
    ok: !hasDanger,
    events,
    lockStateChanges: changes,
  };
}

export interface ScoreBreakdown {
  baseScore: number;
  correctAssignments: number;
  slotBonus: number;
  coverageBonus: number;
  trustBonus: number;
  keyRingMatchBonus: number;
  keyRingMismatchPenalty: number;
  rollbackPenalty: number;
  theftPenalty: number;
  lockedInPenalty: number;
  duplicationPenalty: number;
  traceBonus: number;
  recomputeFromDetailsNote: string;
  total: number;
}

export function calculateSessionScore(
  details: AssignmentDetail[],
  people: Person[],
  keys: Key[],
  rooms: Room[],
  resultRecords: ResultRecord[],
  rollbackCount: number = 0,
  traceCompleted: boolean = false,
  keyRingGroups?: { id: string; name: string; key_ids: string[]; description: string }[]
): ScoreBreakdown {
  const base = 100;
  let correct = 0;
  let slotBonus = 0;
  let coverageBonus = 0;
  let trustBonus = 0;
  let theftPenalty = 0;
  let lockedInPenalty = 0;
  let dupPenalty = 0;
  let keyRingMatchBonus = 0;
  let keyRingMismatchPenalty = 0;

  const ROLE_GROUP_RULE: Record<string, string[]> = {
    visitor: ["g01"],
    maintenance: ["g02"],
    nightwatch: ["g03"],
  };

  for (const d of details) {
    const person = people.find((p) => p.id === d.person_id);
    const key = keys.find((k) => k.id === d.key_id);
    if (!person || !key) continue;

    const slotOk = key.allowed_slots.includes(d.assigned_slot);
    const covOk = person.requested_room_ids.every((rid) => key.room_ids.includes(rid));
    const maxSec = key.room_ids.reduce(
      (m, rid) => Math.max(m, rooms.find((r) => r.id === rid)?.security_level ?? 0),
      0
    );
    const trustOk = person.trust_level >= maxSec * 2 - 2;
    const dupOk = !(key.duplication_risk >= 8 && person.trust_level <= 4);

    if (slotOk && covOk && trustOk && dupOk) {
      correct += 1;
      slotBonus += 5;
      coverageBonus += 5;
      trustBonus += 3;
    }

    if (!slotOk) lockedInPenalty += 15;
    if (!covOk) lockedInPenalty += 8;
    if (!trustOk && maxSec >= 4) theftPenalty += 25;
    else if (!trustOk) theftPenalty += 10;
    if (!dupOk) dupPenalty += 20;
    else if (key.duplication_risk >= 7 && person.trust_level <= 6) dupPenalty += 8;

    if (key.ring_group_id && keyRingGroups) {
      const allowedGroups = ROLE_GROUP_RULE[person.role] || [];
      const match = allowedGroups.includes(key.ring_group_id);
      const group = keyRingGroups.find((g) => g.id === key.ring_group_id);
      if (match) {
        keyRingMatchBonus += 8;
      } else {
        keyRingMismatchPenalty += 15;
      }
    } else if (keyRingGroups && !key.ring_group_id) {
      keyRingMatchBonus += 2;
    }
  }

  const correctScore = correct * 20;
  const rollbackPenalty = rollbackCount * 10;
  const traceBonus = traceCompleted ? 15 : 0;

  const total = Math.max(
    0,
    Math.round(
      base +
        correctScore +
        slotBonus +
        coverageBonus +
        trustBonus +
        keyRingMatchBonus +
        traceBonus -
        rollbackPenalty -
        keyRingMismatchPenalty -
        theftPenalty -
        lockedInPenalty -
        dupPenalty
    )
  );

  return {
    baseScore: base,
    correctAssignments: correctScore,
    slotBonus,
    coverageBonus,
    trustBonus,
    keyRingMatchBonus,
    keyRingMismatchPenalty,
    rollbackPenalty,
    theftPenalty,
    lockedInPenalty,
    duplicationPenalty: dupPenalty,
    traceBonus,
    recomputeFromDetailsNote: `基于 ${details.length} 条局次明细(assignment_details) 重算，编组校验组数：${keyRingGroups?.length ?? 0}`,
    total,
  };
}

export function performPostTrace(
  details: AssignmentDetail[],
  people: Person[],
  keys: Key[]
): { valid: boolean; findings: string[] } {
  const findings: string[] = [];
  let valid = true;

  const usedKeys = new Map<string, string[]>();
  for (const d of details) {
    if (!usedKeys.has(d.key_id)) usedKeys.set(d.key_id, []);
    usedKeys.get(d.key_id)!.push(d.person_id);
  }

  for (const [kid, pids] of usedKeys.entries()) {
    if (pids.length > 1) {
      valid = false;
      const names = pids.map((id) => people.find((p) => p.id === id)?.name || id).join("、");
      findings.push(`⚠️ 钥匙冲突：${keys.find((k) => k.id === kid)?.label || kid} 同时分配给了 ${names}，需要钥匙环编组拆分。`);
    }
  }

  for (const d of details) {
    const person = people.find((p) => p.id === d.person_id);
    const key = keys.find((k) => k.id === d.key_id);
    if (!person || !key) continue;
    if (key.ring_group_id) {
      findings.push(`🔍 追踪验证：${person.name} 使用 ${key.label}（属于编组 ${key.ring_group_id}），检查通过。`);
    }
  }

  if (findings.length === 0) {
    findings.push("✅ 事后追踪完成，没有发现钥匙分配冲突。");
  }

  return { valid, findings };
}
