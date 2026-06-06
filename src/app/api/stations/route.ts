import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET() {
  const stations = dataService.getStations();
  return NextResponse.json(stations);
}
