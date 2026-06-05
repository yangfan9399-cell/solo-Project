import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";

export const Route = createAPIFileRoute("/api/categories")({
  GET: async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    return new Response(JSON.stringify(categories), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
