import { APIEvent } from "@solidjs/start/server";
import { getLevelById } from "~/data/levels";

interface LeaderboardEntry {
  playerName: string;
  score: number;
  rank: string;
  divesUsed: number;
  relicsFound: number;
  timestamp: number;
}

const mockLeaderboards: Record<string, LeaderboardEntry[]> = {
  "level-1": [
    { playerName: "深海探险家", score: 2180, rank: "S", divesUsed: 2, relicsFound: 3, timestamp: Date.now() - 86400000 },
    { playerName: "考古达人", score: 1850, rank: "A", divesUsed: 3, relicsFound: 3, timestamp: Date.now() - 172800000 },
    { playerName: "寻宝猎人", score: 1420, rank: "B", divesUsed: 4, relicsFound: 2, timestamp: Date.now() - 259200000 },
    { playerName: "水下新手", score: 980, rank: "C", divesUsed: 5, relicsFound: 2, timestamp: Date.now() - 345600000 }
  ],
  "level-2": [
    { playerName: "深海探险家", score: 2650, rank: "A", divesUsed: 3, relicsFound: 4, timestamp: Date.now() - 172800000 },
    { playerName: "考古达人", score: 2100, rank: "B", divesUsed: 5, relicsFound: 3, timestamp: Date.now() - 259200000 }
  ],
  "level-3": [
    { playerName: "传奇考古", score: 4200, rank: "S", divesUsed: 4, relicsFound: 6, timestamp: Date.now() - 86400000 }
  ]
};

export async function GET({ request }: APIEvent) {
  const url = new URL(request.url);
  const levelId = url.searchParams.get("levelId") || "level-1";
  
  const level = getLevelById(levelId);
  if (!level) {
    return new Response(JSON.stringify({ error: "Level not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  const entries = mockLeaderboards[levelId] || [];
  return new Response(
    JSON.stringify({
      levelId,
      levelName: level.name,
      entries: entries.sort((a, b) => b.score - a.score).slice(0, 10)
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}
