import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const diag: any = {};

  try {
    const { PrismaClient } = require("@prisma/client");
    diag.prismaClientLoaded = true;
    const p = new PrismaClient();
    diag.prismaInstanceCreated = true;
    try {
      await p.$connect();
      diag.connected = true;
      const count = await p.dispatchOrder.count();
      diag.orderCount = count;
      await p.$disconnect();
    } catch (e: any) {
      diag.connectError = e?.message || String(e);
      diag.connectStack = e?.stack?.slice(0, 500);
    }
  } catch (e: any) {
    diag.loadError = e?.message || String(e);
    diag.loadStack = e?.stack?.slice(0, 500);
  }

  return NextResponse.json(diag);
}
