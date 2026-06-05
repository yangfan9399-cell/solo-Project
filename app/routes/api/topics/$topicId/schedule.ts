import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";
import { TopicStatus, ScheduleConflictType } from "@prisma/client";
import { z } from "zod";

const scheduleSchema = z.object({
  schedulerId: z.string(),
  scheduledAt: z.string().datetime(),
  timeSlot: z.string().optional(),
  note: z.string().optional(),
  forceSchedule: z.boolean().optional(),
});

export const Route = createAPIFileRoute("/api/topics/$topicId/schedule")({
  POST: async ({ request, params }) => {
    try {
      const { topicId } = params;
      const body = await request.json();
      const result = scheduleSchema.safeParse(body);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: "参数无效", details: result.error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { schedulerId, scheduledAt, timeSlot, note, forceSchedule } = result.data;

      const existing = await prisma.topic.findUnique({
        where: { id: topicId },
        include: { category: true },
      });
      if (!existing) {
        return new Response(JSON.stringify({ error: "选题不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const scheduledDate = new Date(scheduledAt);
      const dayStart = new Date(scheduledDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(scheduledDate);
      dayEnd.setHours(23, 59, 59, 999);

      const sameTimeTopics = await prisma.topic.findMany({
        where: {
          id: { not: topicId },
          status: { in: [TopicStatus.SCHEDULED, TopicStatus.PUBLISHED] },
          scheduledAt: {
            gte: dayStart,
            lte: dayEnd,
          },
          categoryId: existing.categoryId,
        },
        select: { id: true, title: true, scheduledAt: true, status: true },
      });

      const conflicts = sameTimeTopics.map((t) => ({
        topicId,
        conflictingTopicId: t.id,
        conflictType: ScheduleConflictType.SAME_CATEGORY,
        description: `与同栏目选题「${t.title}」安排在同一天，可能存在竞争。`,
      }));

      if (sameTimeTopics.length > 0 && !forceSchedule) {
        return new Response(
          JSON.stringify({
            error: "存在排期冲突",
            conflictType: "SCHEDULE_CONFLICT",
            conflicts: sameTimeTopics,
            message: `检测到 ${sameTimeTopics.length} 个同栏目选题在同一天发布，建议调整排期。`,
            suggestion: [
              "调整到其他日期发布",
              "错开时段发布（如上午/下午/晚间）",
              "调整栏目分类",
              "确认强制发布（需主编审批）",
            ],
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }

      const oldScheduledAt = existing.scheduledAt;
      const isDelayed = oldScheduledAt && scheduledDate > new Date(oldScheduledAt);
      const delayIncrease = isDelayed ? 1 : 0;

      const topic = await prisma.topic.update({
        where: { id: topicId },
        data: {
          status: TopicStatus.SCHEDULED,
          scheduledAt: scheduledDate,
          currentHandlerId: schedulerId,
          delayCount: (existing.delayCount || 0) + delayIncrease,
          schedules: {
            create: {
              schedulerId,
              scheduledAt: scheduledDate,
              timeSlot,
              note,
              isPrimary: true,
            },
          },
          statusHistory: {
            create: {
              status: TopicStatus.SCHEDULED,
              operatorId: schedulerId,
              remark: `排期：${scheduledDate.toLocaleString("zh-CN")}${note ? ` - ${note}` : ""}`,
            },
          },
          conflictDetectedConflicts:
            sameTimeTopics.length > 0
              ? {
                  createMany: {
                    data: conflicts.map((c) => ({
                      conflictingTopicId: c.conflictingTopicId,
                      conflictType: c.conflictType,
                      description: c.description,
                    })),
                  },
                }
              : undefined,
        },
        include: {
          schedules: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      return new Response(JSON.stringify(topic), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("排期失败:", error);
      return new Response(
        JSON.stringify({ error: "排期失败", details: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
