const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const STEPS_FILE = path.join(DATA_DIR, 'steps.json');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');

let games = {};
let steps = {};
let settlements = {};
let nextGameId = 1;
let nextStepId = 1;
let nextSettlementId = 1;

function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(GAMES_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'));
      games = data.games || {};
      nextGameId = data.nextGameId || 1;
    } catch (e) {
      games = {};
      nextGameId = 1;
    }
  }

  if (fs.existsSync(STEPS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(STEPS_FILE, 'utf8'));
      steps = data.steps || {};
      nextStepId = data.nextStepId || 1;
    } catch (e) {
      steps = {};
      nextStepId = 1;
    }
  }

  if (fs.existsSync(SETTLEMENTS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE, 'utf8'));
      settlements = data.settlements || {};
      nextSettlementId = data.nextSettlementId || 1;
    } catch (e) {
      settlements = {};
      nextSettlementId = 1;
    }
  }
}

function saveData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(GAMES_FILE, JSON.stringify({ games, nextGameId }, null, 2));
  fs.writeFileSync(STEPS_FILE, JSON.stringify({ steps, nextStepId }, null, 2));
  fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify({ settlements, nextSettlementId }, null, 2));
}

function createGame(gameData) {
  const id = nextGameId++;
  const game = {
    id,
    ...gameData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  games[id] = game;
  saveData();
  return game;
}

function getGame(id) {
  return games[id] || null;
}

function updateGame(id, updates) {
  if (!games[id]) return null;
  games[id] = {
    ...games[id],
    ...updates,
    updated_at: new Date().toISOString()
  };
  saveData();
  return games[id];
}

function createStep(stepData) {
  const id = nextStepId++;
  const step = {
    id,
    ...stepData,
    created_at: new Date().toISOString()
  };
  if (!steps[stepData.game_id]) {
    steps[stepData.game_id] = [];
  }
  steps[stepData.game_id].push(step);
  saveData();
  return step;
}

function getSteps(gameId) {
  return steps[gameId] || [];
}

function deleteStepsAfter(gameId, stepNumber) {
  if (!steps[gameId]) return;
  steps[gameId] = steps[gameId].filter(s => s.step_number <= stepNumber);
  saveData();
}

function createSettlement(settlementData) {
  const id = nextSettlementId++;
  const settlement = {
    id,
    ...settlementData,
    calculated_at: new Date().toISOString()
  };
  if (!settlements[settlementData.game_id]) {
    settlements[settlementData.game_id] = [];
  }
  settlements[settlementData.game_id].push(settlement);
  saveData();
  return settlement;
}

function getLatestSettlement(gameId) {
  const gameSettlements = settlements[gameId] || [];
  if (gameSettlements.length === 0) return null;
  return gameSettlements[gameSettlements.length - 1];
}

function deleteSettlements(gameId) {
  delete settlements[gameId];
  saveData();
}

function getActiveGames() {
  return Object.values(games).filter(g => g.status === 'active');
}

module.exports = {
  initDatabase,
  createGame,
  getGame,
  updateGame,
  createStep,
  getSteps,
  deleteStepsAfter,
  createSettlement,
  getLatestSettlement,
  deleteSettlements,
  getActiveGames
};
