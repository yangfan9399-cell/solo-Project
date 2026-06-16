import type { PlayerProfile, GameHistory, ScoreCalculationResponse } from "~/types/game";

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
