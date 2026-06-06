import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stationId = searchParams.get("stationId")
    ? parseInt(searchParams.get("stationId")!)
    : undefined;

  let devices;
  if (stationId) {
    devices = dataService.getDevicesByStation(stationId);
  } else {
    devices = dataService.getDevices();
  }

  return NextResponse.json(devices);
}
