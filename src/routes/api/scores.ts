import { APIEvent } from "@solidjs/start/server";
import { calculateScore } from "~/server/scoring";
import type { ScoreCalculationRequest } from "~/types/game";

export async function POST({ request }: APIEvent) {
  try {
    const body: ScoreCalculationRequest = await request.json();
    const result = calculateScore(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}
