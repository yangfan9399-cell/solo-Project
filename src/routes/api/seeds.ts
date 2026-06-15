import { APIEvent } from "solid-start/api";
import { SEED_DATA, ALTITUDE_MATURITY, QUALITY_PRICES, WIND_SPEED_REDUCTION } from "../../server/gameData";
import type { SeedData } from "../../types/game";

export function GET() {
  try {
    const seeds = Object.values(SEED_DATA).map((seed: SeedData) => ({
      type: seed.type,
      name: seed.name,
      description: seed.description,
      plantCount: seed.plants.length,
      cablewayCount: seed.cableways.length,
      stationCount: seed.stations.length,
      expectedOutcome: seed.expectedOutcome,
    }));

    const response = {
      success: true,
      data: {
        seeds,
        constants: {
          altitudeMaturity: ALTITUDE_MATURITY,
          qualityPrices: QUALITY_PRICES,
          windSpeedReduction: WIND_SPEED_REDUCTION,
        },
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const err = { success: false, error: error.message };
    return new Response(JSON.stringify(err), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
