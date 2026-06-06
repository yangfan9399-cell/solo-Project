import { NextResponse } from "next/server";
import { dataService } from "@/lib/data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") || undefined;

  let users;
  if (role) {
    users = dataService.getUsersByRole(role);
  } else {
    users = dataService.getUsers();
  }

  return NextResponse.json(users);
}
