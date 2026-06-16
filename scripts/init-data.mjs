import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "game-data.json");

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

function initializeDefaultData() {
  const data = readGameData();
  if (data.players.length === 0) {
    const demoPlayer = {
      id: "player_demo",
      name: "管风琴学徒",
      createdAt: Date.now() - 86400000 * 7,
      totalScore: 3420,
      currentStreak: 3,
      bestStreak: 7,
      lastPlayDate: new Date().toISOString().split("T")[0],
      highestLevel: 4,
      totalPlays: 23,
    };
    data.players.push(demoPlayer);

    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      if (i <= 3) {
        data.dailyStreaks.push({
          playerId: "player_demo",
          date: dateStr,
          score: 500 - i * 50,
          played: true,
        });
      }
    }

    const demoSessions = [
      {
        id: "session_demo_1",
        playerId: "player_demo",
        levelId: 1,
        startTime: now - 86400000 * 3,
        endTime: now - 86400000 * 3 + 120000,
        score: 420,
        maxScore: 460,
        correctCount: 4,
        totalRounds: 5,
        status: "completed",
        currentRound: 5,
        stars: 2,
        rounds: [
          { roundNumber: 1, targetStops: ["principal-8"], playerStops: ["principal-8"], isCorrect: true, score: 92, maxScore: 92, timeTaken: 12, hintUsed: false },
          { roundNumber: 2, targetStops: ["flute-8"], playerStops: ["flute-8"], isCorrect: true, score: 88, maxScore: 92, timeTaken: 15, hintUsed: false },
          { roundNumber: 3, targetStops: ["gedackt-8"], playerStops: ["gedackt-8", "flute-8"], isCorrect: false, score: 65, maxScore: 92, timeTaken: 18, hintUsed: false },
          { roundNumber: 4, targetStops: ["bourdon-16"], playerStops: ["bourdon-16"], isCorrect: true, score: 90, maxScore: 92, timeTaken: 10, hintUsed: false },
          { roundNumber: 5, targetStops: ["principal-8", "flute-8"], playerStops: ["principal-8", "flute-8"], isCorrect: true, score: 85, maxScore: 92, timeTaken: 22, hintUsed: false },
        ],
      },
      {
        id: "session_demo_2",
        playerId: "player_demo",
        levelId: 2,
        startTime: now - 86400000 * 2,
        endTime: now - 86400000 * 2 + 180000,
        score: 380,
        maxScore: 552,
        correctCount: 3,
        totalRounds: 6,
        status: "completed",
        currentRound: 6,
        stars: 1,
        rounds: [
          { roundNumber: 1, targetStops: ["principal-8", "principal-4"], playerStops: ["principal-8", "principal-4"], isCorrect: true, score: 105, maxScore: 106, timeTaken: 20, hintUsed: false },
          { roundNumber: 2, targetStops: ["flute-8", "flute-4"], playerStops: ["flute-8"], isCorrect: false, score: 45, maxScore: 106, timeTaken: 25, hintUsed: false },
          { roundNumber: 3, targetStops: ["principal-8", "flute-8"], playerStops: ["principal-8", "flute-8"], isCorrect: true, score: 98, maxScore: 106, timeTaken: 18, hintUsed: false },
          { roundNumber: 4, targetStops: ["gedackt-8", "flute-4"], playerStops: ["gedackt-8", "flute-4"], isCorrect: true, score: 92, maxScore: 106, timeTaken: 22, hintUsed: false },
          { roundNumber: 5, targetStops: ["principal-4", "flute-4"], playerStops: ["principal-8", "flute-4"], isCorrect: false, score: 40, maxScore: 106, timeTaken: 28, hintUsed: true },
          { roundNumber: 6, targetStops: ["principal-8", "gedackt-8"], playerStops: ["principal-8", "gedackt-8"], isCorrect: true, score: 100, maxScore: 106, timeTaken: 15, hintUsed: false },
        ],
      },
    ];
    data.sessions.push(...demoSessions);

    const demoWrongAnswers = [
      {
        id: "wrong_demo_1",
        playerId: "player_demo",
        levelId: 2,
        targetStops: ["flute-8", "flute-4"],
        playerStops: ["flute-8"],
        timestamp: now - 86400000 * 2 + 60000,
        score: 45,
        maxScore: 106,
        reviewed: false,
      },
      {
        id: "wrong_demo_2",
        playerId: "player_demo",
        levelId: 2,
        targetStops: ["principal-4", "flute-4"],
        playerStops: ["principal-8", "flute-4"],
        timestamp: now - 86400000 * 2 + 120000,
        score: 40,
        maxScore: 106,
        reviewed: false,
      },
    ];
    data.wrongAnswers.push(...demoWrongAnswers);

    writeGameData(data);
  }
}

console.log("正在初始化管风琴音栓记忆游戏数据...");

initializeDefaultData();

const data = readGameData();

console.log(`✅ 音栓数据: ${data.stops.length} 个`);
console.log(`✅ 关卡数据: ${data.levels.length} 个`);
console.log(`✅ 玩家数据: ${data.players.length} 个`);
console.log(`✅ 游戏记录: ${data.sessions.length} 个`);
console.log(`✅ 错题记录: ${data.wrongAnswers.length} 个`);
console.log(`✅ 连胜记录: ${data.dailyStreaks.length} 个`);

console.log("\n🎉 数据初始化完成！");
console.log("数据文件位置: data/game-data.json");
