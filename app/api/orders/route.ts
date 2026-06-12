import { NextResponse } from "next/server";
import { getOrderList, getDashboardStats, getOrderWithAllData } from "@/lib/data-service";
import { OrderStatus, SampleCategory } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as OrderStatus | undefined;
  const category = searchParams.get("category") as SampleCategory | undefined;
  const isArchived = searchParams.get("isArchived");
  const search = searchParams.get("search") || undefined;
  const includeStats = searchParams.get("includeStats") === "true";

  const filters: any = {};
  if (status) filters.status = status;
  if (category) filters.category = category;
  if (isArchived !== null) filters.isArchived = isArchived === "true";
  if (search) filters.search = search;

  try {
    if (includeStats) {
      const data = await getOrderWithAllData();
      return NextResponse.json(data);
    }
    const list = await getOrderList(filters);
    return NextResponse.json(list);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取列表失败" },
      { status: 500 }
    );
  }
}
