import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";

export const Route = createAPIFileRoute("/api/topics/$topicId")({
  GET: async ({ params }) => {
    const { topicId } = params;

    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        category: true,
        submitter: { select: { id: true, name: true, role: true, email: true } },
        currentHandler: { select: { id: true, name: true, role: true } },
        reviews: {
          include: { reviewer: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
        schedules: {
          include: { scheduler: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
        revisionRecords: {
          include: { editor: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
        archiveLogs: {
          include: { reviewer: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "desc" },
        },
        statusHistory: {
          include: { operator: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
        conflictDetectedConflicts: {
          include: {
            conflictingTopic: { select: { id: true, title: true, status: true } },
          },
          where: { resolved: false },
        },
        conflictCausedConflicts: {
          include: {
            topic: { select: { id: true, title: true, status: true } },
          },
          where: { resolved: false },
        },
      },
    });

    if (!topic) {
      return new Response(JSON.stringify({ error: "选题不存在" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(topic), {
      headers: { "Content-Type": "application/json" },
    });
  },

  PUT: async ({ request, params }) => {
    try {
      const { topicId } = params;
      const body = await request.json();

      const existing = await prisma.topic.findUnique({ where: { id: topicId } });
      if (!existing) {
        return new Response(JSON.stringify({ error: "选题不存在" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const updateData: any = {
        title: body.title,
        summary: body.summary,
        source: body.source,
        sourceUrl: body.sourceUrl || null,
        categoryId: body.categoryId || null,
        copyrightEvidence: body.copyrightEvidence || null,
        contentOutline: body.contentOutline || null,
        priority: body.priority,
      };

      if (body.title !== existing.title) {
        updateData.originalTitle = existing.originalTitle || existing.title;
        updateData.revisionRecords = {
          create: {
            fieldName: "title",
            oldValue: existing.title,
            newValue: body.title,
            reason: body.revisionReason || "标题修改",
            editorId: body.editorId || body.submitterId || existing.submitterId,
          },
        };
      }

      const topic = await prisma.topic.update({
        where: { id: topicId },
        data: updateData,
        include: {
          category: true,
          submitter: { select: { id: true, name: true, role: true } },
        },
      });

      return new Response(JSON.stringify(topic), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("更新选题失败:", error);
      return new Response(
        JSON.stringify({ error: "更新选题失败", details: String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
