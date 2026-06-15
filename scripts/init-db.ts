import path from "path";
import fs from "fs";

const DATA_DIR = path.resolve(process.cwd(), "data");
const JSON_DB_PATH = path.join(DATA_DIR, "castle_butler.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const EMPTY_DB = {
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

fs.writeFileSync(JSON_DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf-8");

console.log("✅ JSON 数据库初始化完成:", JSON_DB_PATH);
console.log("  - 已创建集合: rooms, keys_data, key_ring_groups, people");
console.log("  - 已创建集合: puzzle_levels, game_sessions");
console.log("  - 已创建集合: assignment_details（明细记录）");
console.log("  - 已创建集合: history_records（历史记录）");
console.log("  - 已创建集合: result_records（结果记录）");
console.log("  - 已创建集合: access_logs（访问日志）");
console.log("  - 已创建集合: seed_samples（种子样本）");
