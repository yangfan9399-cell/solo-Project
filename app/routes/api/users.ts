import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";

export const Route = createAPIFileRoute("/api/users")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const role = url.searchParams.get("role");

    const where: any = {};
    if (role) {
      where.role = role.toUpperCase();
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: { name: "asc" },
    });

    return new Response(JSON.stringify(users), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
