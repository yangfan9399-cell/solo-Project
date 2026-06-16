import { APIEvent } from "@solidjs/start/server";
import { getPlayerProfile, updatePlayerName, resetPlayerData } from "~/server/fileStore";

export async function GET() {
  try {
    const profile = getPlayerProfile();
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to get profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function PUT({ request }: APIEvent) {
  try {
    const body = await request.json();
    if (body.name && typeof body.name === "string") {
      const profile = updatePlayerName(body.name.trim().slice(0, 20));
      return new Response(JSON.stringify(profile), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ error: "Invalid name" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to update profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function DELETE() {
  try {
    const profile = resetPlayerData();
    return new Response(JSON.stringify(profile), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to reset data" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
