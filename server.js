import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "game-data.json");
const PUBLIC_DIR = path.join(__dirname, "public");
const DIST_DIR = path.join(__dirname, "dist");

const PIPE_STOPS = [
  { id: "principal-8", name: "Principal 8'", type: "principal", pitch: "8'", octave: 4, rank: 1, description: "主音栓，8英尺音高，管风琴基础音色" },
  { id: "principal-4", name: "Principal 4'", type: "principal", pitch: "4'", octave: 5, rank: 1, description: "主音栓，4英尺音高，高八度" },
  { id: "principal-2", name: "Principal 2'", type: "principal", pitch: "2'", octave: 6, rank: 1, description: "主音栓，2英尺音高，再高八度" },
  { id: "bourdon-16", name: "Bourdon 16'", type: "flute", pitch: "16'", octave: 3, rank: 1, description: "低音笛音栓，16英尺，深厚低音" },
  { id: "flute-8", name: "Flute 8'", type: "flute", pitch: "8'", octave: 4, rank: 1, description: "笛音栓，8英尺，柔和甜美" },
  { id: "flute-4", name: "Flute 4'", type: "flute", pitch: "4'", octave: 5, rank: 1, description: "笛音栓，4英尺，清亮高音" },
  { id: "gedackt-8", name: "Gedackt 8'", type: "flute", pitch: "8'", octave: 4, rank: 1, description: "盖塞笛，8英尺，温润柔和" },
  { id: "salicional-8", name: "Salicional 8'", type: "string", pitch: "8'", octave: 4, rank: 1, description: "弦乐音栓，8英尺，细腻抒情" },
  { id: "violin-4", name: "Violin 4'", type: "string", pitch: "4'", octave: 5, rank: 1, description: "小提琴音栓，4英尺，明亮纤细" },
  { id: "cello-8", name: "Cello 8'", type: "string", pitch: "8'", octave: 4, rank: 1, description: "大提琴音栓，8英尺，温暖浑厚" },
  { id: "oboe-8", name: "Oboe 8'", type: "reed", pitch: "8'", octave: 4, rank: 1, description: "双簧管簧音栓，8英尺，表现力强" },
  { id: "trumpet-8", name: "Trumpet 8'", type: "reed", pitch: "8'", octave: 4, rank: 1, description: "小号簧音栓，8英尺，辉煌明亮" },
  { id: "clarinet-8", name: "Clarinet 8'", type: "reed", pitch: "8'", octave: 4, rank: 1, description: "单簧管簧音栓，8英尺，圆润温暖" },
  { id: "mixture-iii", name: "Mixture III", type: "mixture", pitch: "2 2/3'", octave: 6, rank: 3, description: "混合音栓，三排，增加亮度和共鸣" },
  { id: "mixture-v", name: "Mixture V", type: "mixture", pitch: "2'", octave: 6, rank: 5, description: "混合音栓，五排，宏大辉煌" },
  { id: "tibia-8", name: "Tibia 8'", type: "flute", pitch: "8'", octave: 4, rank: 1, description: "胫管笛，8英尺，剧院管风琴特色" },
];

const LEVELS = [
  {
    id: 1,
    name: "初识音栓",
    description: "认识最基础的主音栓和笛音栓，从简单的单音栓开始",
    difficulty: 1,
    availableStops: ["principal-8", "flute-8", "gedackt-8", "bourdon-16"],
    targetCombinations: [
      ["principal-8"],
      ["flute-8"],
      ["gedackt-8"],
      ["bourdon-16"],
      ["principal-8", "flute-8"],
    ],
    passingScore: 60,
    stars: { threeStar: 90, twoStar: 75 },
    phraseNotes: [60, 64, 67, 72],
  },
  {
    id: 2,
    name: "双栓组合",
    description: "学习两种不同音色的组合，感受音色融合",
    difficulty: 2,
    availableStops: ["principal-8", "principal-4", "flute-8", "flute-4", "gedackt-8"],
    targetCombinations: [
      ["principal-8", "principal-4"],
      ["flute-8", "flute-4"],
      ["principal-8", "flute-8"],
      ["gedackt-8", "flute-4"],
      ["principal-4", "flute-4"],
      ["principal-8", "gedackt-8"],
    ],
    passingScore: 65,
    stars: { threeStar: 92, twoStar: 78 },
    phraseNotes: [60, 62, 64, 65, 67, 69, 71, 72],
  },
  {
    id: 3,
    name: "弦乐登场",
    description: "引入弦乐音栓，体会弦乐与主音、笛音的配合",
    difficulty: 2,
    availableStops: ["principal-8", "flute-8", "salicional-8", "cello-8", "violin-4"],
    targetCombinations: [
      ["salicional-8"],
      ["cello-8"],
      ["salicional-8", "cello-8"],
      ["principal-8", "salicional-8"],
      ["flute-8", "violin-4"],
      ["salicional-8", "violin-4"],
      ["principal-8", "cello-8"],
    ],
    timeLimit: 45,
    passingScore: 70,
    stars: { threeStar: 93, twoStar: 80 },
    phraseNotes: [57, 60, 64, 67, 69, 72],
  },
  {
    id: 4,
    name: "簧音挑战",
    description: "簧音栓具有独特的音色，考验你的听觉分辨力",
    difficulty: 3,
    availableStops: ["principal-8", "flute-8", "oboe-8", "trumpet-8", "clarinet-8"],
    targetCombinations: [
      ["oboe-8"],
      ["trumpet-8"],
      ["clarinet-8"],
      ["principal-8", "trumpet-8"],
      ["flute-8", "clarinet-8"],
      ["oboe-8", "clarinet-8"],
      ["principal-8", "oboe-8"],
    ],
    timeLimit: 40,
    passingScore: 70,
    stars: { threeStar: 92, twoStar: 80 },
    phraseNotes: [60, 64, 67, 71, 72, 76],
  },
  {
    id: 5,
    name: "三栓组合",
    description: "三种音栓的组合，音色更加丰富",
    difficulty: 3,
    availableStops: ["principal-8", "principal-4", "flute-8", "flute-4", "salicional-8", "cello-8"],
    targetCombinations: [
      ["principal-8", "principal-4", "flute-8"],
      ["flute-8", "flute-4", "salicional-8"],
      ["principal-8", "salicional-8", "cello-8"],
      ["principal-4", "flute-4", "salicional-8"],
      ["principal-8", "flute-8", "cello-8"],
      ["flute-8", "salicional-8", "cello-8"],
    ],
    timeLimit: 50,
    passingScore: 72,
    stars: { threeStar: 90, twoStar: 80 },
    phraseNotes: [60, 62, 64, 65, 67, 69, 71, 72],
  },
  {
    id: 6,
    name: "混合音栓",
    description: "混合音栓增加和声效果，让音色更宏大",
    difficulty: 4,
    availableStops: ["principal-8", "principal-4", "flute-8", "mixture-iii", "mixture-v", "salicional-8"],
    targetCombinations: [
      ["principal-8", "mixture-iii"],
      ["principal-4", "mixture-iii"],
      ["principal-8", "flute-8", "mixture-iii"],
      ["principal-8", "principal-4", "mixture-v"],
      ["salicional-8", "mixture-iii"],
      ["principal-8", "flute-8", "mixture-v"],
    ],
    timeLimit: 45,
    passingScore: 75,
    stars: { threeStar: 92, twoStar: 82 },
    phraseNotes: [48, 55, 60, 64, 67, 72],
  },
  {
    id: 7,
    name: "高级组合",
    description: "综合所有类型的音栓，挑战你的记忆极限",
    difficulty: 4,
    availableStops: ["principal-8", "principal-4", "flute-8", "salicional-8", "oboe-8", "trumpet-8", "clarinet-8", "mixture-iii"],
    targetCombinations: [
      ["principal-8", "oboe-8"],
      ["salicional-8", "oboe-8"],
      ["principal-8", "principal-4", "trumpet-8"],
      ["flute-8", "clarinet-8", "mixture-iii"],
      ["principal-8", "salicional-8", "trumpet-8"],
      ["principal-8", "oboe-8", "mixture-iii"],
    ],
    timeLimit: 50,
    passingScore: 75,
    stars: { threeStar: 90, twoStar: 82 },
    phraseNotes: [60, 64, 67, 71, 74, 76, 79],
  },
  {
    id: 8,
    name: "大师挑战",
    description: "四栓及以上组合，只有真正的管风琴大师才能通关",
    difficulty: 5,
    availableStops: ["principal-8", "principal-4", "principal-2", "flute-8", "flute-4", "salicional-8", "oboe-8", "trumpet-8", "mixture-iii", "mixture-v"],
    targetCombinations: [
      ["principal-8", "principal-4", "principal-2", "mixture-v"],
      ["principal-8", "flute-8", "oboe-8", "trumpet-8"],
      ["flute-8", "flute-4", "salicional-8", "mixture-iii"],
      ["principal-8", "principal-4", "oboe-8", "mixture-iii"],
      ["principal-8", "flute-8", "salicional-8", "trumpet-8", "mixture-v"],
      ["principal-8", "principal-4", "flute-8", "oboe-8", "trumpet-8"],
    ],
    timeLimit: 60,
    passingScore: 80,
    stars: { threeStar: 95, twoStar: 87 },
    phraseNotes: [48, 55, 60, 64, 67, 71, 72, 76],
  },
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialState() {
  return {
    stops: PIPE_STOPS,
    levels: LEVELS,
    players: [],
    sessions: [],
    wrongAnswers: [],
    dailyStreaks: [],
    actionHistory: [],
  };
}

function readGameData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    const initial = getInitialState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

function writeGameData(state) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function calculateStopCombinationScore(
  targetStops,
  playerStops,
  timeTaken,
  timeLimit = 60,
  difficulty = 1,
  hintUsed = false
) {
  const targetSet = new Set(targetStops);
  const playerSet = new Set(playerStops);

  let correctCount = 0;
  let missedCount = 0;
  let extraCount = 0;

  for (const stop of targetSet) {
    if (playerSet.has(stop)) {
      correctCount++;
    } else {
      missedCount++;
    }
  }

  for (const stop of playerSet) {
    if (!targetSet.has(stop)) {
      extraCount++;
    }
  }

  const baseScorePerStop = 20;
  const baseScore = correctCount * baseScorePerStop;
  const penaltyPerMiss = 8;
  const penaltyPerExtra = 10;

  let accuracyScore = baseScore - missedCount * penaltyPerMiss - extraCount * penaltyPerExtra;
  accuracyScore = Math.max(0, accuracyScore);

  const maxCorrectScore = targetStops.length * baseScorePerStop;

  const timeRatio = Math.max(0, 1 - timeTaken / timeLimit);
  const timeBonus = Math.round(accuracyScore * timeRatio * 0.3);

  const difficultyMultiplier = 1 + (difficulty - 1) * 0.15;

  let totalScore = Math.round((accuracyScore + timeBonus) * difficultyMultiplier);

  if (hintUsed) {
    totalScore = Math.round(totalScore * 0.6);
  }

  const isCorrect = missedCount === 0 && extraCount === 0;

  const union = new Set([...targetSet, ...playerSet]).size;
  const intersection = correctCount;
  const similarity = union > 0 ? intersection / union : 0;

  return {
    score: totalScore,
    maxScore: maxCorrectScore,
    isCorrect,
    correctCount,
    extraCount,
    missedCount,
    similarity,
    timeBonus,
    difficultyMultiplier,
  };
}

function calculateSessionFinalScore(rounds, level) {
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const maxScore = rounds.reduce((sum, r) => sum + r.maxScore, 0);
  const correctCount = rounds.filter((r) => r.isCorrect).length;
  const totalRounds = rounds.length;

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let stars = 0;
  if (percentage >= level.stars.threeStar) stars = 3;
  else if (percentage >= level.stars.twoStar) stars = 2;
  else if (percentage >= level.passingScore) stars = 1;

  const passed = percentage >= level.passingScore;

  return {
    totalScore,
    maxScore,
    percentage,
    stars,
    passed,
    correctCount,
    totalRounds,
  };
}

function calculateDailyStreakBonus(streakDays) {
  if (streakDays <= 0) return 0;
  if (streakDays === 1) return 5;
  if (streakDays === 2) return 10;
  if (streakDays === 3) return 15;
  if (streakDays >= 4 && streakDays <= 6) return 20;
  if (streakDays >= 7 && streakDays <= 13) return 30;
  return 50;
}

function getStreakDays(playerId, data) {
  const streaks = data.dailyStreaks
    .filter((d) => d.playerId === playerId && d.played)
    .map((d) => d.date)
    .sort();

  if (streaks.length === 0) return { current: 0, best: 0, dates: [] };

  let best = 1;
  let current = 1;

  for (let i = 1; i < streaks.length; i++) {
    const prev = new Date(streaks[i - 1]);
    const curr = new Date(streaks[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      best = Math.max(best, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const lastPlayed = streaks[streaks.length - 1];
  const diffFromToday = Math.round((new Date(today).getTime() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24));

  if (diffFromToday > 1) {
    current = 0;
  }

  return { current, best, dates: streaks };
}

function pickLevelCombinations(level, count) {
  const targets = [...level.targetCombinations];
  const shuffled = targets.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJSON(res, 404, { error: "Not found" });
      return;
    }

    const ext = path.extname(filePath);
    const contentType = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".ico": "image/x-icon",
    }[ext] || "application/octet-stream";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (pathname === "/api/levels" && req.method === "GET") {
    const data = readGameData();
    sendJSON(res, 200, {
      success: true,
      levels: data.levels,
      stops: data.stops,
    });
    return;
  }

  if (pathname === "/api/player" && req.method === "GET") {
    const id = url.searchParams.get("id") || "";
    const data = readGameData();
    const player = data.players.find((p) => p.id === id);
    if (!player) {
      sendJSON(res, 404, { success: false, error: "Player not found" });
      return;
    }
    sendJSON(res, 200, { success: true, player });
    return;
  }

  if (pathname === "/api/player" && req.method === "POST") {
    const body = await parseBody(req);
    const name = typeof body.name === "string" ? body.name : "匿名玩家";
    const data = readGameData();

    const player = {
      id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      createdAt: Date.now(),
      totalScore: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayDate: null,
      highestLevel: 1,
      totalPlays: 0,
    };

    data.players.push(player);
    writeGameData(data);
    sendJSON(res, 200, { success: true, player });
    return;
  }

  if (pathname === "/api/session" && req.method === "GET") {
    const sessionId = url.searchParams.get("id") || "";
    const data = readGameData();
    const session = data.sessions.find((s) => s.id === sessionId);
    if (!session) {
      sendJSON(res, 404, { success: false, error: "Session not found" });
      return;
    }
    const level = data.levels.find((l) => l.id === session.levelId);
    sendJSON(res, 200, { success: true, session, level });
    return;
  }

  if (pathname === "/api/session" && req.method === "POST") {
    const body = await parseBody(req);
    const playerId = typeof body.playerId === "string" ? body.playerId : "";
    const levelId = typeof body.levelId === "string" ? parseInt(body.levelId) : typeof body.levelId === "number" ? body.levelId : 1;

    const data = readGameData();
    const level = data.levels.find((l) => l.id === levelId);
    if (!level) {
      sendJSON(res, 404, { success: false, error: "Level not found" });
      return;
    }

    const roundsPerGame = 5;
    const combinations = pickLevelCombinations(level, roundsPerGame);

    const session = {
      id: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      playerId,
      levelId,
      startTime: Date.now(),
      score: 0,
      maxScore: 0,
      correctCount: 0,
      totalRounds: combinations.length,
      status: "playing",
      currentRound: 0,
      rounds: [],
    };

    data.sessions.push(session);
    writeGameData(data);

    sendJSON(res, 200, {
      success: true,
      session,
      level,
      targetCombinations: combinations,
      availableStops: level.availableStops,
    });
    return;
  }

  if (pathname === "/api/session" && req.method === "PATCH") {
    const body = await parseBody(req);
    const action = body.action;

    if (action === "submitRound") {
      const sessionId = typeof body.sessionId === "string" ? body.sessionId : "";
      const roundNumber = typeof body.roundNumber === "string" ? parseInt(body.roundNumber) : typeof body.roundNumber === "number" ? body.roundNumber : 0;
      const targetStops = Array.isArray(body.targetStops) ? body.targetStops : [];
      const playerStops = Array.isArray(body.playerStops) ? body.playerStops : [];
      const timeTaken = typeof body.timeTaken === "string" ? parseFloat(body.timeTaken) : typeof body.timeTaken === "number" ? body.timeTaken : 30;
      const hintUsed = body.hintUsed === "true" || body.hintUsed === true;

      const data = readGameData();
      const sessionIdx = data.sessions.findIndex((s) => s.id === sessionId);
      if (sessionIdx === -1) {
        sendJSON(res, 404, { success: false, error: "Session not found" });
        return;
      }

      const session = data.sessions[sessionIdx];
      const level = data.levels.find((l) => l.id === session.levelId);
      if (!level) {
        sendJSON(res, 404, { success: false, error: "Level not found" });
        return;
      }

      const timeLimit = level.timeLimit || 60;

      const scoreResult = calculateStopCombinationScore(
        targetStops,
        playerStops,
        timeTaken,
        timeLimit,
        level.difficulty,
        hintUsed
      );

      const roundResult = {
        roundNumber,
        targetStops,
        playerStops,
        isCorrect: scoreResult.isCorrect,
        score: scoreResult.score,
        maxScore: scoreResult.maxScore,
        timeTaken,
        hintUsed,
      };

      session.rounds.push(roundResult);
      session.score = session.rounds.reduce((sum, r) => sum + r.score, 0);
      session.maxScore = session.rounds.reduce((sum, r) => sum + r.maxScore, 0);
      session.correctCount = session.rounds.filter((r) => r.isCorrect).length;
      session.currentRound = roundNumber;

      const isLastRound = roundNumber >= session.totalRounds - 1;
      let finalResult = null;

      if (isLastRound) {
        const finalCalc = calculateSessionFinalScore(session.rounds, level);
        session.status = finalCalc.passed ? "completed" : "failed";
        session.endTime = Date.now();
        session.stars = finalCalc.stars;

        const streakInfo = getStreakDays(session.playerId, data);
        const streakBonus = calculateDailyStreakBonus(streakInfo.current);

        const today = new Date().toISOString().split("T")[0];

        const existingStreak = data.dailyStreaks.find((d) => d.playerId === session.playerId && d.date === today);
        if (existingStreak) {
          existingStreak.score = Math.max(existingStreak.score, finalCalc.totalScore + streakBonus);
          existingStreak.played = true;
        } else {
          data.dailyStreaks.push({
            playerId: session.playerId,
            date: today,
            score: finalCalc.totalScore + streakBonus,
            played: true,
          });
        }

        const playerIdx = data.players.findIndex((p) => p.id === session.playerId);
        if (playerIdx !== -1) {
          const player = data.players[playerIdx];
          player.totalScore += finalCalc.totalScore + streakBonus;
          player.highestLevel = finalCalc.passed ? Math.min(Math.max(player.highestLevel, level.id + 1), data.levels.length) : player.highestLevel;
          player.totalPlays += 1;

          const lastDate = player.lastPlayDate;
          const todayStr = today;

          if (!lastDate) {
            player.currentStreak = 1;
          } else {
            const diffDays = Math.round(
              (new Date(todayStr).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) {
              player.currentStreak += 1;
            } else if (diffDays > 1) {
              player.currentStreak = 1;
            }
          }

          player.bestStreak = Math.max(player.bestStreak, player.currentStreak);
          player.lastPlayDate = todayStr;
        }

        finalResult = { ...finalCalc, streakBonus };
      }

      if (!scoreResult.isCorrect) {
        data.wrongAnswers.push({
          id: `wrong_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          playerId: session.playerId,
          levelId: level.id,
          targetStops,
          playerStops,
          timestamp: Date.now(),
          score: scoreResult.score,
          maxScore: scoreResult.maxScore,
          reviewed: false,
        });
      }

      data.actionHistory.push({
        id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        sessionId,
        playerId: session.playerId,
        action: "submit",
        timestamp: Date.now(),
        roundNumber,
      });

      writeGameData(data);

      sendJSON(res, 200, {
        success: true,
        roundResult: scoreResult,
        session,
        finalResult,
        isLastRound,
      });
      return;
    }

    sendJSON(res, 400, { success: false, error: "Invalid action" });
    return;
  }

  if (pathname === "/api/score" && req.method === "POST") {
    const body = await parseBody(req);
    const targetStops = Array.isArray(body.targetStops) ? body.targetStops : [];
    const playerStops = Array.isArray(body.playerStops) ? body.playerStops : [];
    const timeTaken = typeof body.timeTaken === "string" ? parseFloat(body.timeTaken) : typeof body.timeTaken === "number" ? body.timeTaken : 30;
    const levelId = typeof body.levelId === "string" ? parseInt(body.levelId) : typeof body.levelId === "number" ? body.levelId : 1;
    const hintUsed = body.hintUsed === "true" || body.hintUsed === true;

    const data = readGameData();
    const level = data.levels.find((l) => l.id === levelId);
    const timeLimit = level?.timeLimit || 60;
    const difficulty = level?.difficulty || 1;

    const result = calculateStopCombinationScore(
      targetStops,
      playerStops,
      timeTaken,
      timeLimit,
      difficulty,
      hintUsed
    );

    sendJSON(res, 200, { success: true, result });
    return;
  }

  if (pathname === "/api/streak" && req.method === "GET") {
    const playerId = url.searchParams.get("playerId") || "";
    const type = url.searchParams.get("type") || "streak";
    const data = readGameData();

    if (type === "history") {
      const sessions = data.sessions.filter((s) => s.playerId === playerId).sort((a, b) => b.startTime - a.startTime);
      const streak = getStreakDays(playerId, data);
      sendJSON(res, 200, { success: true, sessions, streak });
      return;
    }

    const streak = getStreakDays(playerId, data);
    sendJSON(res, 200, { success: true, streak });
    return;
  }

  if (pathname === "/api/wrong-answers" && req.method === "GET") {
    const playerId = url.searchParams.get("playerId") || "";
    const limitStr = url.searchParams.get("limit") || "50";
    const limit = parseInt(limitStr);
    const data = readGameData();

    const wrongAnswers = data.wrongAnswers
      .filter((w) => w.playerId === playerId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    sendJSON(res, 200, { success: true, wrongAnswers });
    return;
  }

  if (pathname === "/api/wrong-answers" && req.method === "PATCH") {
    const body = await parseBody(req);
    const wrongId = typeof body.wrongId === "string" ? body.wrongId : "";
    const data = readGameData();

    const idx = data.wrongAnswers.findIndex((w) => w.id === wrongId);
    if (idx === -1) {
      sendJSON(res, 404, { success: false, error: "Wrong answer not found" });
      return;
    }

    data.wrongAnswers[idx].reviewed = true;
    writeGameData(data);

    sendJSON(res, 200, { success: true, wrongAnswer: data.wrongAnswers[idx] });
    return;
  }

function renderHTML(title, content, activeNav = '') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - 管风琴音栓记忆游戏</title>
  <link rel="stylesheet" href="/styles.css">
  <link rel="icon" type="image/svg+xml" href="/icon.svg">
</head>
<body>
  <nav class="navbar">
    <div class="container navbar-content">
      <a href="/" class="navbar-brand">
        <span class="navbar-brand-icon">🎵</span>
        <span>管风琴音栓记忆</span>
      </a>
      <ul class="navbar-nav">
        <li><a href="/" class="${activeNav === 'home' ? 'active' : ''}">首页</a></li>
        <li><a href="/levels" class="${activeNav === 'levels' ? 'active' : ''}">关卡</a></li>
        <li><a href="/history" class="${activeNav === 'history' ? 'active' : ''}">战绩</a></li>
        <li><a href="/wrong-answers" class="${activeNav === 'wrong' ? 'active' : ''}">错题本</a></li>
      </ul>
    </div>
  </nav>
  
  <main id="app">
    ${content}
  </main>
  
  <footer style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
    <p>🎹 管风琴音栓组合记忆游戏 · 训练你的音乐耳朵</p>
  </footer>
  
  <script src="/app.js"></script>
</body>
</html>`;
}

function getPageInfo(pathname) {
  if (pathname === '/' || pathname === '/index.html') {
    return { title: '首页', active: 'home' };
  }
  if (pathname === '/levels') {
    return { title: '关卡选择', active: 'levels' };
  }
  if (pathname.startsWith('/play/')) {
    return { title: '游戏中', active: 'levels' };
  }
  if (pathname.startsWith('/result/')) {
    return { title: '结算', active: 'levels' };
  }
  if (pathname === '/history') {
    return { title: '战绩中心', active: 'history' };
  }
  if (pathname === '/wrong-answers') {
    return { title: '错题本', active: 'wrong' };
  }
  return { title: '', active: '' };
}

if (req.method === "GET") {
  const pathname = url.pathname;
  
  if (pathname.startsWith('/api/')) {
  } else {
    const ext = path.extname(pathname);
    
    if (ext && ext !== '.html') {
      const publicPath = path.join(PUBLIC_DIR, pathname);
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        serveStaticFile(res, publicPath);
        return;
      }
      
      const distPath = path.join(DIST_DIR, pathname);
      if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
        serveStaticFile(res, distPath);
        return;
      }
    }
    
    if (!ext || ext === '.html' || pathname === '/') {
      const pageInfo = getPageInfo(pathname);
      const html = renderHTML(pageInfo.title, '<div class="container"><div class="card"><p>加载中...</p></div></div>', pageInfo.active);
      
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(html);
      return;
    }
  }
}

sendJSON(res, 404, { error: "Not found" });
});

const PORT = process.env.PORT || 5174;

server.listen(PORT, () => {
  console.log(`🎹 管风琴音栓记忆游戏服务器启动在 http://localhost:${PORT}`);
  console.log(`📁 数据目录: ${DATA_DIR}`);
  console.log(`📊 API端点可用: /api/levels, /api/player, /api/session, /api/score, /api/streak, /api/wrong-answers`);
});
