import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { SPECIES, POOL_LOCATIONS } from "@/lib/gameData";

export async function GET() {
  const db = getDb();

  const dbSpecies = db.prepare("SELECT * FROM species").all() as any[];
  const dbPools = db.prepare("SELECT * FROM pool_locations").all() as any[];

  const species = (dbSpecies.length > 0 ? dbSpecies : SPECIES).map((s: any) => ({
    ...s,
    preferredTide: typeof s.preferred_tide === "string" ? JSON.parse(s.preferred_tide) : s.preferredTide,
  }));

  const pools = (dbPools.length > 0 ? dbPools : POOL_LOCATIONS).map((p: any) => ({
    ...p,
    speciesIds: typeof p.species_ids === "string" ? JSON.parse(p.species_ids) : p.speciesIds,
  }));

  return NextResponse.json({ species, pools });
}
