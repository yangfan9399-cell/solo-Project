import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET() {
  const parts = dataService.getSpareParts();
  return NextResponse.json(parts);
}
