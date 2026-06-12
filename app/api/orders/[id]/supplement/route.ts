import { NextResponse } from "next/server";
import { supplementMaterials } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await supplementMaterials(id, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "补充材料失败" },
      { status: 400 }
    );
  }
}
