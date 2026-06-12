import { NextResponse } from "next/server";
import { updateKeyField } from "@/lib/data-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const result = await updateKeyField(
      id,
      body.fieldName,
      body.newValue,
      body.fieldLabel
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新失败" },
      { status: 400 }
    );
  }
}
