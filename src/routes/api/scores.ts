import { APIEvent } from "@solidjs/start/server";
import { calculateScore } from "~/server/scoring";
import { recordGameResult, getPlayerProfile, getGameHistory } from "~/server/fileStore";
import type { ScoreCalculationRequest, ScoreCalculationResponse } from "~/types/game";

interface ScoreSubmitRequest extends ScoreCalculationRequest {
  won: boolean;
  relicsFoundCount: number;
}

interface ScoreSubmitResponse extends ScoreCalculationResponse {
  saved: boolean;
  playerTotalScore: number;
  isNewHighScore: boolean;
}

export async function POST({ request }: APIEvent) {
  try {
    const body: ScoreSubmitRequest = await request.json();

    const result = calculateScore({
      levelId: body.levelId,
      relicsFound: body.relicsFound,
      divesUsed: body.divesUsed,
      totalSonarScans: body.totalSonarScans,
      timeElapsed: body.timeElapsed
    });

    const response: ScoreSubmitResponse = {
      ...result,
      saved: false,
      playerTotalScore: 0,
      isNewHighScore: false
    };

    if (body.won !== undefined) {
      const { profile } = recordGameResult(
        body.levelId,
        result.totalScore,
        body.won,
        body.divesUsed,
        body.relicsFoundCount
      );

      response.saved = true;
      response.playerTotalScore = profile.totalScore;
      response.isNewHighScore =
        profile.highestScores[body.levelId] === result.totalScore;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Score calculation error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function GET() {
  try {
    const profile = getPlayerProfile();
    const history = getGameHistory();
    return new Response(
      JSON.stringify({
        profile,
        recentGames: history.slice(0, 10)
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get scores" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
