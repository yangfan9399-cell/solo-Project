import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";
import { TopicStatus, ReviewResult } from "@prisma/client";
import { z } from "zod";

const reviewSchema = z.object({
  reviewerId: z.string(),
  result: z.nativeEnum(ReviewResult),
  comment: z.string().optional(),
});

export const Route = createAPIFileRoute("/api/topics/$topicId/review")({
  POST: async ({ request, params }) => {
    try {
      const { topicId } = params;
      const body = await request.json();
      const result = reviewSchema.safeParse(body);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: "参数无效", details: result.error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { reviewerId, result: reviewResult, comment } = result.data;

      const existing = await prisma.topic.findUnique({ where: { id: topicId } });
      if (!existing) {
        return new Response(JSON.stringify({ error: "选题不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let newStatus: TopicStatus;
      let handlerId: string;

      switch (reviewResult) {
        case ReviewResult.APPROVED:
          newStatus = TopicStatus.APPROVED;
          handlerId = "scheduler-id";
          break;
        case ReviewResult.COPYRIGHT_MISSING:
          newStatus = TopicStatus.COPYRIGHT_MISSING;
          handlerId = existing.submitterId;
          break;
        case ReviewResult.TITLE_REVISION:
          newStatus = TopicStatus.TITLE_REVISION;
          handlerId = existing.submitterId;
          break;
        case ReviewResult.REJECTED:
          newStatus = TopicStatus.REJECTED;
          handlerId = reviewerId;
          break;
        default:
          newStatus = existing.status;
          handlerId = existing.currentHandlerId || reviewerId;
      }

      const topic = await prisma.topic.update({
        where: { id: topicId },
        data: {
          status: newStatus,
          currentHandlerId: handlerId,
          rejectCount: reviewResult === ReviewResult.REJECTED
            ? (existing.rejectCount || 0) + 1
            : existing.rejectCount,
          rejectReason: reviewResult === ReviewResult.REJECTED ? comment : existing.rejectReason,
          reviews: {
            create: {
              reviewerId,
              result: reviewResult,
              comment,
            },
          },
          statusHistory: {
            create: {
              status: newStatus,
              operatorId: reviewerId,
              remark: comment || `审核结果：${reviewResult}`,
            },
          },
        },
        include: {
          reviews: {
            include: { reviewer: { select: { id: true, name: true, role: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      });

      return new Response(JSON.stringify(topic), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("审核失败:", error);
      return new Response(
        JSON.stringify({ error: "审核失败", details: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
