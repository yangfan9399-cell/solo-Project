import path from "path";
import fs from "fs";
import type {
  Room,
  Key,
  KeyRingGroup,
  Person,
  PuzzleLevel,
  GameSession,
  AssignmentDetail,
  HistoryRecord,
  ResultRecord,
  AccessLog,
  EventType,
  TimeSlot,
} from "./types";

const DATA_DIR = path.resolve(process.cwd(), "data");
const JSON_DB_PATH = path.join(DATA_DIR, "castle_butler.json");

interface JsonDB {
  rooms: Room[];
  key_ring_groups: (KeyRingGroup & { key_ids: string[] })[];
  keys_data: (Key & { room_ids: string[]; allowed_slots: TimeSlot[] })[];
  people: (Person & { requested_room_ids: string[] })[];
  puzzle_levels: PuzzleLevel[];
  game_sessions: GameSession[];
  assignment_details: AssignmentDetail[];
  history_records: (HistoryRecord & { success: boolean })[];
  result_records: (ResultRecord & {
    rooms_covered: string[];
    allowed_slots_used: TimeSlot[];
    duplication_triggered: boolean;
  })[];
  access_logs: AccessLog[];
  seed_samples: { id: number; name: string; type: string; description: string; data: any }[];
}

const EMPTY_DB: JsonDB = {
  rooms: [],
  key_ring_groups: [],
  keys_data: [],
  people: [],
  puzzle_levels: [],
  game_sessions: [],
  assignment_details: [],
  history_records: [],
  result_records: [],
  access_logs: [],
  seed_samples: [],
};

let _cache: JsonDB | null = null;
let _cacheMtime = 0;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): JsonDB {
  ensureDataDir();
  if (!fs.existsSync(JSON_DB_PATH)) {
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
  try {
    const stat = fs.statSync(JSON_DB_PATH);
    if (_cache && stat.mtimeMs === _cacheMtime) {
      return _cache;
    }
    const raw = fs.readFileSync(JSON_DB_PATH, "utf-8");
    const db = JSON.parse(raw) as JsonDB;
    _cache = db;
    _cacheMtime = stat.mtimeMs;
    return db;
  } catch (e) {
    console.error("读取 JSON 数据库失败:", e);
    return JSON.parse(JSON.stringify(EMPTY_DB));
  }
}

export function saveDb(db: JsonDB): void {
  ensureDataDir();
  const tmp = JSON_DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), "utf-8");
  fs.renameSync(tmp, JSON_DB_PATH);
  _cache = db;
  try {
    _cacheMtime = fs.statSync(JSON_DB_PATH).mtimeMs;
  } catch {
    _cacheMtime = Date.now();
  }
}

export function getDb() {
  return { load: loadDb, save: saveDb, path: JSON_DB_PATH };
}

function parseJSON<T>(s: string | null | undefined | any): T {
  if (s == null) return {} as T;
  if (typeof s === "object") return s as T;
  try {
    return JSON.parse(s) as T;
  } catch {
    return {} as T;
  }
}

function assertDbExists() {
  if (!fs.existsSync(JSON_DB_PATH)) {
    throw new Error(
      `数据库不存在: ${JSON_DB_PATH}。请先运行 npm run init-db && npm run seed`
    );
  }
}

export function getAllRooms(): Room[] {
  assertDbExists();
  return loadDb().rooms.slice().sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor;
    return a.name.localeCompare(b.name);
  });
}

export function getAllKeys(): Key[] {
  assertDbExists();
  return loadDb().keys_data.map((r) => ({
    ...r,
    room_ids: Array.isArray(r.room_ids) ? r.room_ids : parseJSON<string[]>(r.room_ids),
    allowed_slots: Array.isArray(r.allowed_slots) ? r.allowed_slots : parseJSON<TimeSlot[]>(r.allowed_slots),
  })) as Key[];
}

export function getAllKeyRingGroups(): KeyRingGroup[] {
  assertDbExists();
  return loadDb().key_ring_groups.map((r) => ({
    ...r,
    key_ids: Array.isArray(r.key_ids) ? r.key_ids : parseJSON<string[]>(r.key_ids),
  })) as KeyRingGroup[];
}

export function getAllPeople(): Person[] {
  assertDbExists();
  return loadDb().people.map((r) => ({
    ...r,
    requested_room_ids: Array.isArray(r.requested_room_ids)
      ? r.requested_room_ids
      : parseJSON<string[]>(r.requested_room_ids),
  })) as Person[];
}

export function getAllPuzzleLevels(): PuzzleLevel[] {
  assertDbExists();
  return loadDb().puzzle_levels.map((r) => ({
    ...r,
    people_ids: Array.isArray(r.people_ids) ? r.people_ids : parseJSON<string[]>(r.people_ids),
    expected_assignments: Array.isArray(r.expected_assignments)
      ? r.expected_assignments
      : parseJSON<
          { person_id: string; key_id: string; slot: TimeSlot }[]
        >(r.expected_assignments),
  })) as PuzzleLevel[];
}

export function getPuzzleLevel(id: number): PuzzleLevel | null {
  assertDbExists();
  const row = loadDb().puzzle_levels.find((p) => p.id === id);
  if (!row) return null;
  return {
    ...row,
    people_ids: Array.isArray(row.people_ids) ? row.people_ids : parseJSON<string[]>(row.people_ids),
    expected_assignments: Array.isArray(row.expected_assignments)
      ? row.expected_assignments
      : parseJSON<
          { person_id: string; key_id: string; slot: TimeSlot }[]
        >(row.expected_assignments),
  } as PuzzleLevel;
}

export function createGameSession(
  puzzleLevel: number,
  totalSteps: number,
  notes?: string
): GameSession {
  assertDbExists();
  const db = loadDb();
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const session: GameSession = {
    id,
    puzzle_level: puzzleLevel,
    status: "active",
    current_step: 0,
    total_steps: totalSteps,
    created_at: now,
    completed_at: null as any,
    final_score: null as any,
    notes: notes || null,
  };
  db.game_sessions.push(session);
  saveDb(db);
  return getGameSession(id)!;
}

export function getGameSession(id: string): GameSession | null {
  assertDbExists();
  return loadDb().game_sessions.find((s) => s.id === id) || null;
}

export function getAllSessions(): GameSession[] {
  assertDbExists();
  return loadDb().game_sessions
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function updateSessionStep(sessionId: string, step: number): void {
  assertDbExists();
  const db = loadDb();
  const s = db.game_sessions.find((x) => x.id === sessionId);
  if (s) {
    s.current_step = step;
    saveDb(db);
  }
}

export function completeSession(
  sessionId: string,
  finalScore: number,
  status: "completed" | "failed" = "completed"
): void {
  assertDbExists();
  const db = loadDb();
  const s = db.game_sessions.find((x) => x.id === sessionId);
  if (s) {
    s.status = status;
    s.final_score = finalScore;
    s.completed_at = new Date().toISOString();
    saveDb(db);
  }
}

export function addAssignmentDetail(
  sessionId: string,
  stepIndex: number,
  personId: string,
  keyId: string,
  assignedSlot: TimeSlot
): AssignmentDetail {
  assertDbExists();
  const db = loadDb();
  const id = `ad_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const detail: AssignmentDetail = {
    id,
    session_id: sessionId,
    step_index: stepIndex,
    person_id: personId,
    key_id: keyId,
    assigned_slot: assignedSlot,
    created_at: now,
  };
  db.assignment_details.push(detail);
  saveDb(db);
  return detail;
}

export function getAssignmentDetails(sessionId: string): AssignmentDetail[] {
  assertDbExists();
  return loadDb().assignment_details
    .filter((d) => d.session_id === sessionId)
    .sort((a, b) => a.step_index - b.step_index);
}

export function addHistoryRecord(
  sessionId: string,
  stepIndex: number,
  personId: string,
  action: string,
  slot: TimeSlot,
  success: boolean
): HistoryRecord {
  assertDbExists();
  const db = loadDb();
  const id = `hr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const record: any = {
    id,
    session_id: sessionId,
    step_index: stepIndex,
    person_id: personId,
    action,
    slot,
    success: success ? 1 : 0,
    created_at: now,
  };
  db.history_records.push(record);
  saveDb(db);
  return {
    ...record,
    success,
  };
}

export function getHistoryRecords(sessionId: string): HistoryRecord[] {
  assertDbExists();
  return loadDb().history_records
    .filter((r) => r.session_id === sessionId)
    .sort((a, b) => {
      if (a.step_index !== b.step_index) return a.step_index - b.step_index;
      return a.created_at.localeCompare(b.created_at);
    })
    .map((r) => ({ ...r, success: !!r.success })) as HistoryRecord[];
}

export function addResultRecord(
  sessionId: string,
  keyId: string,
  roomsCovered: string[],
  allowedSlotsUsed: TimeSlot[],
  duplicationTriggered: boolean
): ResultRecord {
  assertDbExists();
  const db = loadDb();
  const id = `rr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const now = new Date().toISOString();
  const record: any = {
    id,
    session_id: sessionId,
    key_id: keyId,
    rooms_covered: roomsCovered,
    allowed_slots_used: allowedSlotsUsed,
    duplication_triggered: duplicationTriggered ? 1 : 0,
    created_at: now,
  };
  db.result_records.push(record);
  saveDb(db);
  return {
    ...record,
    rooms_covered: roomsCovered,
    allowed_slots_used: allowedSlotsUsed,
    duplication_triggered: duplicationTriggered,
  };
}

export function getResultRecords(sessionId: string): ResultRecord[] {
  assertDbExists();
  return loadDb().result_records
    .filter((r) => r.session_id === sessionId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => ({
      ...r,
      rooms_covered: Array.isArray(r.rooms_covered) ? r.rooms_covered : parseJSON<string[]>(r.rooms_covered),
      allowed_slots_used: Array.isArray(r.allowed_slots_used)
        ? r.allowed_slots_used
        : parseJSON<TimeSlot[]>(r.allowed_slots_used),
      duplication_triggered: !!r.duplication_triggered,
    })) as ResultRecord[];
}

export function addAccessLog(
  sessionId: string,
  roomId: string | null,
  personId: string | null,
  keyId: string | null,
  eventType: EventType,
  message: string,
  beforeState: Record<string, any>,
  afterState: Record<string, any>
): AccessLog {
  assertDbExists();
  const db = loadDb();
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const log: AccessLog = {
    id,
    session_id: sessionId,
    timestamp: now,
    room_id: roomId,
    person_id: personId,
    key_id: keyId,
    event_type: eventType,
    message,
    before_state: JSON.stringify(beforeState),
    after_state: JSON.stringify(afterState),
  };
  db.access_logs.push(log);
  saveDb(db);
  return log;
}

export function getAccessLogs(sessionId: string): AccessLog[] {
  assertDbExists();
  return loadDb().access_logs
    .filter((l) => l.session_id === sessionId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function getSeedSamples() {
  assertDbExists();
  return loadDb().seed_samples.map((r) => ({
    ...r,
    data: typeof r.data === "string" ? parseJSON(r.data) : r.data,
  }));
}

export function rollbackToStep(sessionId: string, rollbackStep: number): AssignmentDetail[] {
  assertDbExists();
  const db = loadDb();
  const toRemove = db.assignment_details.filter(
    (d) => d.session_id === sessionId && d.step_index >= rollbackStep
  );
  db.assignment_details = db.assignment_details.filter(
    (d) => !(d.session_id === sessionId && d.step_index >= rollbackStep)
  );
  db.history_records = db.history_records.filter(
    (r) => !(r.session_id === sessionId && r.step_index >= rollbackStep)
  );
  saveDb(db);
  return toRemove;
}
