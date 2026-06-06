import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET() {
  const stats = dataService.getStatistics();
  return NextResponse.json(stats);
}
