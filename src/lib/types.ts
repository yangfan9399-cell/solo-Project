export interface PipeStop {
  id: string;
  name: string;
  type: "principal" | "flute" | "string" | "reed" | "mixture";
  pitch: string;
  octave: number;
  rank: number;
  description: string;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  availableStops: string[];
  targetCombinations: string[][];
  timeLimit?: number;
  passingScore: number;
  stars: { threeStar: number; twoStar: number };
  phraseNotes?: number[];
}

export interface Player {
  id: string;
  name: string;
  createdAt: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayDate: string | null;
  highestLevel: number;
  totalPlays: number;
}

export interface GameSession {
  id: string;
  playerId: string;
  levelId: number;
  startTime: number;
  endTime?: number;
  score: number;
  maxScore: number;
  correctCount: number;
  totalRounds: number;
  status: "playing" | "completed" | "failed" | "abandoned";
  currentRound: number;
  rounds: RoundResult[];
  stars?: number;
}

export interface RoundResult {
  roundNumber: number;
  targetStops: string[];
  playerStops: string[];
  isCorrect: boolean;
  score: number;
  maxScore: number;
  timeTaken: number;
  hintUsed: boolean;
}

export interface ActionHistory {
  id: string;
  sessionId: string;
  playerId: string;
  action: "toggle_stop" | "submit" | "hint" | "next_round" | "play_sound";
  stopId?: string;
  timestamp: number;
  roundNumber: number;
}

export interface WrongAnswer {
  id: string;
  playerId: string;
  levelId: number;
  targetStops: string[];
  playerStops: string[];
  timestamp: number;
  score: number;
  maxScore: number;
  reviewed: boolean;
}

export interface DailyStreak {
  playerId: string;
  date: string;
  score: number;
  played: boolean;
}

export interface GameState {
  stops: PipeStop[];
  levels: Level[];
  players: Player[];
  sessions: GameSession[];
  wrongAnswers: WrongAnswer[];
  dailyStreaks: DailyStreak[];
  actionHistory: ActionHistory[];
}
