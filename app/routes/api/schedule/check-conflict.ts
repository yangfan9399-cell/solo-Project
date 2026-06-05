import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";

export const Route = createAPIFileRoute("/api/schedule/check-conflict")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const topicId = url.searchParams.get("topicId");
    const scheduledAt = url.searchParams.get("scheduledAt");
    const categoryId = url.searchParams.get("categoryId");

    if (!scheduledAt) {
      return new Response(
        JSON.stringify({ error: "请提供排期时间" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const scheduledDate = new Date(scheduledAt);
    const dayStart = new Date(scheduledDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledDate);
    dayEnd.setHours(23, 59, 59, 999);

    const where: any = {
      status: { in: ["SCHEDULED", "PUBLISHED"] },
      scheduledAt: { gte: dayStart, lte: dayEnd },
    };

    if (topicId) {
      where.id = { not: topicId };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const conflicts = await prisma.topic.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        submitter: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const categoryConflicts = categoryId
      ? conflicts.filter((t) => t.categoryId === categoryId)
      : [];

    return new Response(
      JSON.stringify({
        hasConflict: conflicts.length > 0,
        totalConflicts: conflicts.length,
        sameCategoryCount: categoryConflicts.length,
        conflicts,
        suggestion: conflicts.length > 0
          ? [
              `当天已有 ${conflicts.length} 个选题排期`,
              categoryConflicts.length > 0
                ? `其中同栏目选题 ${categoryConflicts.length} 个，建议错峰发布`
                : "",
              "可考虑调整到其他日期",
              "或选择不同时段（早间/午间/晚间）",
            ].filter(Boolean)
          : ["当前时段无冲突，可正常排期"],
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});
