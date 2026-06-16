import type { PlayerProfile, GameHistory } from "~/types/game";

export const defaultPlayerProfile: PlayerProfile = {
  id: "player-1",
  name: "考古探险家",
  avatar: "diver",
  totalScore: 0,
  completedLevels: [],
  highestScores: {},
  gamesPlayed: 0,
  createdAt: Date.now()
};

export const sampleGameHistory: GameHistory[] = [
  {
    id: "history-1",
    playerId: "player-1",
    levelId: "level-1",
    score: 1250,
    won: true,
    divesUsed: 3,
    relicsFound: 2,
    timestamp: Date.now() - 86400000
  },
  {
    id: "history-2",
    playerId: "player-1",
    levelId: "level-1",
    score: 980,
    won: true,
    divesUsed: 4,
    relicsFound: 2,
    timestamp: Date.now() - 172800000
  }
];
