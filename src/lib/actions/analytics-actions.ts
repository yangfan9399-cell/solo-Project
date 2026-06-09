"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SampleStatus, AbnormalType, DisposalType } from "@prisma/client";

export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("请先登录");
  }

  const [totalSamples, todaySamples, pendingTests, pendingDisposals, abnormalSamples] =
    await Promise.all([
      prisma.sample.count(),
      prisma.sample.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.sample.count({
        where: {
          status: { in: [SampleStatus.SENT_TO_LAB, SampleStatus.TESTING] },
        },
      }),
      prisma.sample.count({
        where: { status: SampleStatus.PENDING_DISPOSAL },
      }),
      prisma.sample.count({
        where: { abnormalType: { not: AbnormalType.NONE } },
      }),
    ]);

  return {
    totalSamples,
    todaySamples,
    pendingTests,
    pendingDisposals,
    abnormalSamples,
  };
}

export async function getAnalyticsData() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("请先登录");
  }

  const [byPort, byCategory, byAbnormalType, timeStats, disposalStats] =
    await Promise.all([
      getStatsByPort(),
      getStatsByCategory(),
      getStatsByAbnormalType(),
      getTimeConsumptionStats(),
      getDisposalStats(),
    ]);

  return {
    byPort,
    byCategory,
    byAbnormalType,
    timeStats,
    disposalStats,
  };
}

async function getStatsByPort() {
  const samples = await prisma.sample.groupBy({
    by: ["port"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  return samples.map((s) => ({
    port: s.port,
    count: s._count.id,
  }));
}

async function getStatsByCategory() {
  const samples = await prisma.sample.groupBy({
    by: ["goodsCategory"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  return samples.map((s) => ({
    category: s.goodsCategory,
    count: s._count.id,
  }));
}

async function getStatsByAbnormalType() {
  const types = Object.values(AbnormalType);
  const counts = await Promise.all(
    types.map(async (type) => {
      const count = await prisma.sample.count({
        where: { abnormalType: type },
      });
      return { type, count };
    })
  );

  return counts.map((c) => ({
    type: c.type,
    label: getAbnormalTypeLabel(c.type),
    count: c.count,
  }));
}

function getAbnormalTypeLabel(type: AbnormalType): string {
  const labels: Record<AbnormalType, string> = {
    NONE: "正常",
    SEAL_DAMAGED: "封签破损",
    MISSING_TEST_ITEMS: "检测项目漏选",
    TEST_FAILED: "检测不合格",
    CONCLUSION_APPEAL: "结论复议",
    OTHER: "其他异常",
  };
  return labels[type];
}

async function getTimeConsumptionStats() {
  const completedSamples = await prisma.sample.findMany({
    where: {
      status: { in: [SampleStatus.DISPOSED, SampleStatus.ARCHIVED] },
      testCompletedTime: { not: null },
      sentToLabTime: { not: null },
    },
    select: {
      sampleNo: true,
      goodsName: true,
      sentToLabTime: true,
      testCompletedTime: true,
      disposalTime: true,
    },
    take: 50,
    orderBy: { testCompletedTime: "desc" },
  });

  const durations = completedSamples
    .filter((s) => s.sentToLabTime && s.testCompletedTime)
    .map((s) => {
      const start = new Date(s.sentToLabTime!).getTime();
      const end = new Date(s.testCompletedTime!).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      return {
        sampleNo: s.sampleNo,
        goodsName: s.goodsName,
        hours: Math.round(hours * 10) / 10,
      };
    });

  const avgDuration =
    durations.length > 0
      ? Math.round(
          (durations.reduce((sum, d) => sum + d.hours, 0) / durations.length) *
            10
        ) / 10
      : 0;

  return {
    avgDuration,
    samples: durations.slice(0, 20),
  };
}

async function getDisposalStats() {
  const disposals = await prisma.disposal.groupBy({
    by: ["disposalType"],
    _count: { id: true },
  });

  return disposals.map((d) => ({
    type: d.disposalType,
    label: getDisposalTypeLabel(d.disposalType),
    count: d._count.id,
  }));
}

function getDisposalTypeLabel(type: DisposalType): string {
  const labels: Record<DisposalType, string> = {
    RELEASE: "合格放行",
    DETAIN: "扣留",
    RE_TEST: "补检",
    APPEAL: "复议",
  };
  return labels[type];
}

export async function getRecentSamples(limit: number = 10) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("请先登录");
  }

  const samples = await prisma.sample.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      sampler: { select: { name: true } },
      seals: { select: { sealNo: true, status: true } },
    },
  });

  return samples;
}
