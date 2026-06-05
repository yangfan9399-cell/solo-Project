import { createAPIFileRoute } from "@tanstack/start/api";
import { prisma } from "~/utils/prisma";
import { TopicStatus } from "@prisma/client";

export const Route = createAPIFileRoute("/api/stats/review")({
  GET: async () => {
    const [allTopics, categories, users] = await Promise.all([
      prisma.topic.findMany({
        include: {
          category: true,
          submitter: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.category.findMany(),
      prisma.user.findMany({
        where: { role: "EDITOR" },
        select: { id: true, name: true, role: true },
      }),
    ]);

    const totalCount = allTopics.length;
    const publishedCount = allTopics.filter((t) => t.status === TopicStatus.PUBLISHED || t.status === TopicStatus.ARCHIVED).length;
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

    const byEditor = users.map((user) => {
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

    return new Response(
      JSON.stringify({
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
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  },
});
