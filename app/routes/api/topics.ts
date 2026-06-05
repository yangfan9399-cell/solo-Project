import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";
import { TopicStatus, Prisma } from "@prisma/client";
import { z } from "zod";

const querySchema = z.object({
  status: z.string().optional(),
  categoryId: z.string().optional(),
  submitterId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export const Route = createAPIFileRoute("/api/topics")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const result = querySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Invalid query parameters", details: result.error }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { status, categoryId, submitterId, search, page, limit } = result.data;

    const where: Prisma.TopicWhereInput = {};

    if (status) {
      where.status = status as TopicStatus;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (submitterId) {
      where.submitterId = submitterId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        include: {
          category: true,
          submitter: { select: { id: true, name: true, role: true } },
          schedules: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.topic.count({ where }),
    ]);

    return new Response(
      JSON.stringify({
        data: topics,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },

  POST: async ({ request }) => {
    try {
      const body = await request.json();

      const topic = await prisma.topic.create({
        data: {
          title: body.title,
          originalTitle: body.originalTitle || null,
          summary: body.summary,
          source: body.source,
          sourceUrl: body.sourceUrl || null,
          categoryId: body.categoryId || null,
          copyrightEvidence: body.copyrightEvidence || null,
          contentOutline: body.contentOutline || null,
          priority: body.priority || 2,
          status: body.status || TopicStatus.DRAFT,
          submitterId: body.submitterId,
          currentHandlerId: body.currentHandlerId || body.submitterId,
          statusHistory: {
            create: {
              status: body.status || TopicStatus.DRAFT,
              operatorId: body.submitterId,
              remark: body.status === TopicStatus.PENDING_REVIEW ? "提交审核" : "创建草稿",
            },
          },
        },
        include: {
          category: true,
          submitter: { select: { id: true, name: true, role: true } },
        },
      });

      return new Response(JSON.stringify(topic), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("创建选题失败:", error);
      return new Response(
        JSON.stringify({ error: "创建选题失败", details: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
