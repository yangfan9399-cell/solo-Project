import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";
import { TopicStatus } from "@prisma/client";
import { z } from "zod";

const archiveSchema = z.object({
  reviewerId: z.string(),
  action: z.enum(["PUBLISH", "ARCHIVE", "RETURN"]),
  comment: z.string().optional(),
  returnTo: z.string().optional(),
  returnReason: z.string().optional(),
});

export const Route = createAPIFileRoute("/api/topics/$topicId/archive")({
  POST: async ({ request, params }) => {
    try {
      const { topicId } = params;
      const body = await request.json();
      const result = archiveSchema.safeParse(body);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: "参数无效", details: result.error }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const { reviewerId, action, comment, returnTo, returnReason } = result.data;

      const existing = await prisma.topic.findUnique({ where: { id: topicId } });
      if (!existing) {
        return new Response(JSON.stringify({ error: "选题不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let newStatus: TopicStatus;
      let newHandlerId: string | null = existing.currentHandlerId;

      switch (action) {
        case "PUBLISH":
          newStatus = TopicStatus.PUBLISHED;
          newHandlerId = reviewerId;
          break;
        case "ARCHIVE":
          newStatus = TopicStatus.ARCHIVED;
          newHandlerId = reviewerId;
          break;
        case "RETURN":
          newStatus = returnTo as TopicStatus || TopicStatus.DRAFT;
          newHandlerId = existing.submitterId;
          break;
        default:
          newStatus = existing.status;
      }

      const topic = await prisma.topic.update({
        where: { id: topicId },
        data: {
          status: newStatus,
          currentHandlerId: newHandlerId,
          publishedAt: action === "PUBLISH" ? new Date() : existing.publishedAt,
          archivedAt: action === "ARCHIVE" ? new Date() : existing.archivedAt,
          archiveLogs: {
            create: {
              reviewerId,
              action,
              comment: comment || returnReason,
            },
          },
          statusHistory: {
            create: {
              status: newStatus,
              operatorId: reviewerId,
              remark: action === "PUBLISH"
                ? "已发布"
                : action === "ARCHIVE"
                ? "已归档"
                : `退回：${returnReason || comment || "需要修改"}`,
            },
          },
        },
        include: {
          archiveLogs: {
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
      console.error("归档操作失败:", error);
      return new Response(
        JSON.stringify({ error: "归档操作失败", details: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
