import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
function findProjectRoot() {
  let dir = __dirname$1;
  while (dir !== path.parse(dir).root) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}
const PROJECT_ROOT = findProjectRoot();
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");
const LEVELS_FILE = path.join(DATA_DIR, "levels.json");
const GAMES_FILE = path.join(DATA_DIR, "games.json");
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}
function readStore(filePath, defaultItems = []) {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    const store = { items: defaultItems };
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
    return store;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    const store = { items: defaultItems };
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
    return store;
  }
}
function writeStore(filePath, store) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}
const playersDb = {
  getAll() {
    return readStore(PLAYERS_FILE).items;
  },
  getById(id) {
    return readStore(PLAYERS_FILE).items.find((p) => p.id === id);
  },
  create(player) {
    const store = readStore(PLAYERS_FILE);
    store.items.push(player);
    writeStore(PLAYERS_FILE, store);
    return player;
  },
  update(id, updates) {
    const store = readStore(PLAYERS_FILE);
    const index = store.items.findIndex((p) => p.id === id);
    if (index === -1) return void 0;
    store.items[index] = { ...store.items[index], ...updates };
    writeStore(PLAYERS_FILE, store);
    return store.items[index];
  }
};
const levelsDb = {
  getAll() {
    return readStore(LEVELS_FILE).items;
  },
  getById(id) {
    return readStore(LEVELS_FILE).items.find((l) => l.id === id);
  },
  bulkUpsert(levels) {
    const store = readStore(LEVELS_FILE);
    for (const level of levels) {
      const index = store.items.findIndex((l) => l.id === level.id);
      if (index === -1) {
        store.items.push(level);
      } else {
        store.items[index] = level;
      }
    }
    writeStore(LEVELS_FILE, store);
  }
};
const gamesDb = {
  getAll() {
    return readStore(GAMES_FILE).items;
  },
  getById(id) {
    return readStore(GAMES_FILE).items.find((g) => g.id === id);
  },
  getByPlayerId(playerId) {
    return readStore(GAMES_FILE).items.filter((g) => g.playerId === playerId);
  },
  create(game) {
    const store = readStore(GAMES_FILE);
    store.items.push(game);
    writeStore(GAMES_FILE, store);
    return game;
  },
  update(id, updates) {
    const store = readStore(GAMES_FILE);
    const index = store.items.findIndex((g) => g.id === id);
    if (index === -1) return void 0;
    store.items[index] = { ...store.items[index], ...updates };
    writeStore(GAMES_FILE, store);
    return store.items[index];
  }
};
export {
  gamesDb as g,
  levelsDb as l,
  playersDb as p
};
