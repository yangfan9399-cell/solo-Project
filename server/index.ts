import express from "express";
import cors from "cors";
import { TopicStatus, ReviewResult, ScheduleConflictType, UserRole } from "@prisma/client";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import memoryDb from "./memoryDb.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const useMemoryDb = true;
const prisma: any = memoryDb;

console.log("� Using in-memory database (demo mode)");
console.log("💡 配置 PostgreSQL 后可切换到 Prisma 持久化存储");

const app = express();
const PORT = process.env.PORT || 3001;
const isDev = process.env.NODE_ENV !== "production";

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  (req as any).useMemoryDb = useMemoryDb;
  next();
});

// Helper to handle async errors
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== Topics ====================

app.get(
  "/api/topics",
  asyncHandler(async (req: any, res: any) => {
    const { status, categoryId, submitterId, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (submitterId) where.submitterId = submitterId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { summary: { contains: search, mode: "insensitive" } },
      ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        include: {
          category: true,
          submitter: { select: { id: true, name: true, role: true } },
          schedules: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.topic.count({ where }),
    ]);

    res.json({
      data: topics,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  })
);

app.get(
  "/api/topics/:id",
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id },
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
      return res.status(404).json({ error: "选题不存在" });
    }

    res.json(topic);
  })
);

app.post(
  "/api/topics",
  asyncHandler(async (req: any, res: any) => {
    const body = req.body;

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

    res.status(201).json(topic);
  })
);

app.put(
  "/api/topics/:id",
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "选题不存在" });
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
      where: { id },
      data: updateData,
      include: {
        category: true,
        submitter: { select: { id: true, name: true, role: true } },
      },
    });

    res.json(topic);
  })
);

// ==================== Review ====================

app.post(
  "/api/topics/:id/review",
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { reviewerId, result, comment } = req.body;

    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "选题不存在" });
    }

    let newStatus: TopicStatus;
    let handlerId: string | null;

    switch (result) {
      case ReviewResult.APPROVED:
        newStatus = TopicStatus.APPROVED;
        handlerId = null;
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
        handlerId = existing.currentHandlerId;
    }

    const schedulers = await prisma.user.findFirst({
      where: { role: UserRole.SCHEDULER },
      select: { id: true },
    });

    if (result === ReviewResult.APPROVED && schedulers) {
      handlerId = schedulers.id;
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        status: newStatus,
        currentHandlerId: handlerId,
        rejectCount: result === ReviewResult.REJECTED
          ? (existing.rejectCount || 0) + 1
          : existing.rejectCount,
        rejectReason: result === ReviewResult.REJECTED ? comment : existing.rejectReason,
        reviews: {
          create: {
            reviewerId,
            result,
            comment,
          },
        },
        statusHistory: {
          create: {
            status: newStatus,
            operatorId: reviewerId,
            remark: comment || `审核结果：${result}`,
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

    res.json(topic);
  })
);

// ==================== Schedule ====================

app.get(
  "/api/schedule/check-conflict",
  asyncHandler(async (req: any, res: any) => {
    const { topicId, scheduledAt, categoryId } = req.query;

    if (!scheduledAt) {
      return res.status(400).json({ error: "请提供排期时间" });
    }

    const scheduledDate = new Date(scheduledAt as string);
    const dayStart = new Date(scheduledDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledDate);
    dayEnd.setHours(23, 59, 59, 999);

    const where: any = {
      status: { in: [TopicStatus.SCHEDULED, TopicStatus.PUBLISHED] },
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

    res.json({
      hasConflict: conflicts.length > 0,
      totalConflicts: conflicts.length,
      sameCategoryCount: categoryConflicts.length,
      conflicts,
      suggestion: conflicts.length > 0
        ? [
            `当天已有 ${conflicts.length} 个选题排期`,
            categoryConflicts.length > 0
              ? `其中同栏目选题 ${categoryConflicts.length} 个，建议错峰发布`
              : null,
            "可考虑调整到其他日期",
            "或选择不同时段（早间/午间/晚间）",
          ].filter(Boolean)
        : ["当前时段无冲突，可正常排期"],
    });
  })
);

app.post(
  "/api/topics/:id/schedule",
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { schedulerId, scheduledAt, timeSlot, note, forceSchedule } = req.body;

    const existing = await prisma.topic.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "选题不存在" });
    }

    const scheduledDate = new Date(scheduledAt);
    const dayStart = new Date(scheduledDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduledDate);
    dayEnd.setHours(23, 59, 59, 999);

    const sameTimeTopics = await prisma.topic.findMany({
      where: {
        id: { not: id },
        status: { in: [TopicStatus.SCHEDULED, TopicStatus.PUBLISHED] },
        scheduledAt: { gte: dayStart, lte: dayEnd },
        categoryId: existing.categoryId,
      },
      select: { id: true, title: true, scheduledAt: true, status: true },
    });

    if (sameTimeTopics.length > 0 && !forceSchedule) {
      return res.status(409).json({
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
      });
    }

    const oldScheduledAt = existing.scheduledAt;
    const isDelayed = oldScheduledAt && scheduledDate > new Date(oldScheduledAt);
    const delayIncrease = isDelayed ? 1 : 0;

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        status: sameTimeTopics.length > 0 ? TopicStatus.SCHEDULE_CONFLICT : TopicStatus.SCHEDULED,
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
            status: sameTimeTopics.length > 0 ? TopicStatus.SCHEDULE_CONFLICT : TopicStatus.SCHEDULED,
            operatorId: schedulerId,
            remark: `排期：${scheduledDate.toLocaleString("zh-CN")}${note ? ` - ${note}` : ""}`,
          },
        },
        conflictDetectedConflicts:
          sameTimeTopics.length > 0
            ? {
                createMany: {
                  data: sameTimeTopics.map((t) => ({
                    conflictingTopicId: t.id,
                    conflictType: ScheduleConflictType.SAME_CATEGORY,
                    description: `与同栏目选题「${t.title}」安排在同一天。`,
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

    res.json(topic);
  })
);

// ==================== Archive ====================

app.post(
  "/api/topics/:id/archive",
  asyncHandler(async (req: any, res: any) => {
    const { id } = req.params;
    const { reviewerId, action, comment, returnReason } = req.body;

    const existing = await prisma.topic.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "选题不存在" });
    }

    let newStatus: TopicStatus;
    let newHandlerId: string | null = existing.currentHandlerId;

    switch (action) {
      case "PUBLISH":
        if (existing.status === TopicStatus.SCHEDULE_CONFLICT) {
          return res.status(409).json({
            error: "存在排期冲突，无法发布",
            message: "该选题存在排期冲突，请先解决冲突后再发布。",
          });
        }
        newStatus = TopicStatus.PUBLISHED;
        newHandlerId = reviewerId;
        break;
      case "ARCHIVE":
        newStatus = TopicStatus.ARCHIVED;
        newHandlerId = reviewerId;
        break;
      case "RETURN":
        newStatus = TopicStatus.DRAFT;
        newHandlerId = existing.submitterId;
        break;
      default:
        newStatus = existing.status;
    }

    const topic = await prisma.topic.update({
      where: { id },
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

    res.json(topic);
  })
);

// ==================== Categories ====================

app.get(
  "/api/categories",
  asyncHandler(async (_req: any, res: any) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    res.json(categories);
  })
);

// ==================== Users ====================

app.get(
  "/api/users",
  asyncHandler(async (req: any, res: any) => {
    const { role } = req.query;

    const where: any = {};
    if (role) {
      where.role = (role as string).toUpperCase();
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

    res.json(users);
  })
);

// ==================== Stats ====================

app.get(
  "/api/stats/review",
  asyncHandler(async (_req: any, res: any) => {
    const [allTopics, categories, editors] = await Promise.all([
      prisma.topic.findMany({
        include: {
          category: true,
          submitter: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.category.findMany(),
      prisma.user.findMany({
        where: { role: UserRole.EDITOR },
        select: { id: true, name: true, role: true },
      }),
    ]);

    const totalCount = allTopics.length;
    const publishedCount = allTopics.filter(
      (t) => t.status === TopicStatus.PUBLISHED || t.status === TopicStatus.ARCHIVED
    ).length;
    const rejectedCount = allTopics.filter((t) => t.status === TopicStatus.REJECTED).length;
    const pendingCount = allTopics.filter((t) =>
      [TopicStatus.PENDING_REVIEW, TopicStatus.APPROVED, TopicStatus.SCHEDULED].includes(t.status)
    ).length;
    const delayedCount = allTopics.filter((t) => (t.delayCount || 0) > 0).length;
    const avgDelay = delayedCount > 0
      ? allTopics.reduce((sum, t) => sum + (t.delayCount || 0), 0) / delayedCount
      : 0;

    const byCategory = categories.map((cat) => {
      const catTopics = allTopics.filter((t) => t.categoryId === cat.id);
      const published = catTopics.filter((t) =>
        t.status === TopicStatus.PUBLISHED || t.status === TopicStatus.ARCHIVED
      ).length;
      const rejected = catTopics.filter((t) => t.status === TopicStatus.REJECTED).length;
      return {
        id: cat.id,
        name: cat.name,
        total: catTopics.length,
        published,
        rejected,
        pending: catTopics.length - published - rejected,
        publishRate: catTopics.length > 0 ? (published / catTopics.length) * 100 : 0,
      };
    }).sort((a, b) => b.total - a.total);

    const byEditor = editors.map((user) => {
      const userTopics = allTopics.filter((t) => t.submitterId === user.id);
      const published = userTopics.filter((t) =>
        t.status === TopicStatus.PUBLISHED || t.status === TopicStatus.ARCHIVED
      ).length;
      const rejected = userTopics.filter((t) => t.status === TopicStatus.REJECTED).length;
      const totalDelays = userTopics.reduce((sum, t) => sum + (t.delayCount || 0), 0);
      const delayedTopics = userTopics.filter((t) => (t.delayCount || 0) > 0).length;
      return {
        id: user.id,
        name: user.name,
        role: user.role,
        total: userTopics.length,
        published,
        rejected,
        publishRate: userTopics.length > 0 ? (published / userTopics.length) * 100 : 0,
        rejectRate: userTopics.length > 0 ? (rejected / userTopics.length) * 100 : 0,
        totalDelays,
        delayedTopics,
      };
    }).sort((a, b) => b.total - a.total);

    const rejectReasons = [
      {
        reason: "版权材料缺失",
        count: allTopics.filter((t) => t.status === TopicStatus.COPYRIGHT_MISSING).length,
      },
      {
        reason: "标题需修改",
        count: allTopics.filter((t) => t.status === TopicStatus.TITLE_REVISION).length,
      },
      {
        reason: "内容不符合定位",
        count: allTopics.filter((t) => t.status === TopicStatus.REJECTED).length,
      },
      {
        reason: "质量不达标",
        count: 0,
      },
    ];

    const delayDistribution = [
      { range: "0次", count: allTopics.filter((t) => (t.delayCount || 0) === 0).length },
      { range: "1次", count: allTopics.filter((t) => (t.delayCount || 0) === 1).length },
      { range: "2次", count: allTopics.filter((t) => (t.delayCount || 0) === 2).length },
      { range: "3次及以上", count: allTopics.filter((t) => (t.delayCount || 0) >= 3).length },
    ];

    res.json({
      overview: {
        total: totalCount,
        published: publishedCount,
        pending: pendingCount,
        rejected: rejectedCount,
        delayed: delayedCount,
        avgDelay: parseFloat(avgDelay.toFixed(2)),
        publishRate: totalCount > 0 ? ((publishedCount / totalCount) * 100).toFixed(1) + "%" : "0%",
      },
      byCategory,
      byEditor,
      rejectReasons,
      delayDistribution,
    });
  })
);

// ==================== Health check ====================

app.get("/api/health", (_req: any, res: any) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ==================== Static Files (Frontend) ====================

const clientDistPath = path.resolve(__dirname, "../dist/client");
const rootHtmlPath = path.resolve(__dirname, "../index.html");

if (fs.existsSync(clientDistPath) && fs.existsSync(path.join(clientDistPath, "index.js"))) {
  app.use(express.static(clientDistPath));

  app.get("*", (req: any, res: any, next: any) => {
    if (req.path.startsWith("/api/")) {
      return next();
    }
    if (req.path.includes(".")) {
      return next();
    }
    const indexPath = path.join(clientDistPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else if (fs.existsSync(rootHtmlPath)) {
      res.sendFile(rootHtmlPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
} else {
  app.get("/", (_req: any, res: any) => {
    if (fs.existsSync(rootHtmlPath)) {
      res.sendFile(rootHtmlPath);
    } else {
      res.send("<h1>Server running - build frontend first</h1>");
    }
  });
}

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("API Error:", err);
  res.status(500).json({ error: "服务器内部错误", details: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});
