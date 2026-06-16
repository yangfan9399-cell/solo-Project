import type { PlayerProfile, GameHistory, ScoreCalculationResponse, GameState, HistoryAction, GameSession } from "~/types/game";

const API_BASE = "/api";

export async function fetchPlayerProfile(): Promise<PlayerProfile> {
  const response = await fetch(`${API_BASE}/profile`);
  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }
  return response.json();
}

export async function updatePlayerNameApi(name: string): Promise<PlayerProfile> {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!response.ok) {
    throw new Error("Failed to update name");
  }
  return response.json();
}

export async function resetPlayerDataApi(): Promise<PlayerProfile> {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error("Failed to reset data");
  }
  return response.json();
}

export async function fetchGameHistory(
  levelId?: string,
  limit: number = 50
): Promise<{ count: number; entries: GameHistory[] }> {
  const params = new URLSearchParams();
  if (levelId) params.set("levelId", levelId);
  params.set("limit", String(limit));

  const response = await fetch(`${API_BASE}/history?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch history");
  }
  return response.json();
}

export interface SubmitScoreRequest {
  levelId: string;
  relicsFound: string[];
  divesUsed: number;
  totalSonarScans: number;
  timeElapsed: number;
  won: boolean;
  relicsFoundCount: number;
}

export interface SubmitScoreResponse extends ScoreCalculationResponse {
  saved: boolean;
  playerTotalScore: number;
  isNewHighScore: boolean;
}

export async function submitScore(
  request: SubmitScoreRequest
): Promise<SubmitScoreResponse> {
  const response = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!response.ok) {
    throw new Error("Failed to submit score");
  }
  return response.json();
}

export async function fetchLeaderboard(
  levelId: string
): Promise<{ levelId: string; levelName: string; entries: any[] }> {
  const response = await fetch(`${API_BASE}/leaderboard?levelId=${levelId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch leaderboard");
  }
  return response.json();
}

export async function getActiveSession(
  levelId: string
): Promise<{ session: GameSession | null }> {
  const response = await fetch(`${API_BASE}/session?levelId=${levelId}`);
  if (!response.ok) {
    throw new Error("Failed to get session");
  }
  return response.json();
}

export async function createGameSession(
  levelId: string,
  gameState: GameState
): Promise<GameSession> {
  const response = await fetch(`${API_BASE}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ levelId, gameState })
  });
  if (!response.ok) {
    throw new Error("Failed to create session");
  }
  return response.json();
}

export async function updateGameSession(
  sessionId: string,
  gameState: GameState,
  history: HistoryAction[]
): Promise<GameSession> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameState, history })
  });
  if (!response.ok) {
    throw new Error("Failed to update session");
  }
  return response.json();
}

export async function completeGameSession(
  sessionId: string
): Promise<GameSession> {
  const response = await fetch(`${API_BASE}/session/${sessionId}?complete=true`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error("Failed to complete session");
  }
  return response.json();
}

export async function abandonGameSession(
  sessionId: string
): Promise<GameSession> {
  const response = await fetch(`${API_BASE}/session/${sessionId}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error("Failed to abandon session");
  }
  return response.json();
}
