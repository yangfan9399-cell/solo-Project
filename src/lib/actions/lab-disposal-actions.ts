"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  SampleStatus,
  TestResultStatus,
  AbnormalType,
  DisposalType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { redirect } from "next/navigation";

const testResultSchema = z.object({
  testItemId: z.string(),
  resultValue: z.string().optional(),
  resultStatus: z.nativeEnum(TestResultStatus),
  notes: z.string().optional(),
  instrument: z.string().optional(),
});

export async function receiveSample(sampleId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAB_TECHNICIAN") {
    throw new Error("无权限执行此操作");
  }

  const sample = await prisma.sample.findUnique({ where: { id: sampleId } });
  if (!sample) {
    throw new Error("样品不存在");
  }

  const updated = await prisma.sample.update({
    where: { id: sampleId },
    data: {
      status: SampleStatus.TESTING,
      labReceivedTime: new Date(),
      currentHandlerId: session.user.id,
      auditLogs: {
        create: {
          action: "实验室收样",
          description: "实验室已接收样品，开始检测",
          operatorId: session.user.id,
          oldStatus: sample.status,
          newStatus: SampleStatus.TESTING,
        },
      },
    },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
  revalidatePath("/lab-tasks");
  return updated;
}

export async function saveTestResult(
  sampleId: string,
  results: Array<{
    testItemId: string;
    resultValue?: string;
    resultStatus: TestResultStatus;
    notes?: string;
    instrument?: string;
  }>
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAB_TECHNICIAN") {
    throw new Error("无权限执行此操作");
  }

  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: { testItems: true },
  });

  if (!sample) {
    throw new Error("样品不存在");
  }

  if (sample.sealStatus === "DAMAGED") {
    throw new Error("封签破损，禁止录入检测结果");
  }

  for (const result of results) {
    testResultSchema.parse(result);

    await prisma.testResult.upsert({
      where: {
        sampleId_testItemId: {
          sampleId,
          testItemId: result.testItemId,
        },
      },
      update: {
        resultValue: result.resultValue || null,
        resultStatus: result.resultStatus,
        notes: result.notes || null,
        instrument: result.instrument || null,
        testedBy: session.user.id,
        testedAt: new Date(),
      },
      create: {
        sampleId,
        testItemId: result.testItemId,
        resultValue: result.resultValue || null,
        resultStatus: result.resultStatus,
        notes: result.notes || null,
        instrument: result.instrument || null,
        testedBy: session.user.id,
        testedAt: new Date(),
      },
    });
  }

  revalidatePath(`/samples/${sampleId}`);
  return { success: true };
}

export async function completeTesting(sampleId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAB_TECHNICIAN") {
    throw new Error("无权限执行此操作");
  }

  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: {
      testItems: true,
      testResults: true,
    },
  });

  if (!sample) {
    throw new Error("样品不存在");
  }

  if (sample.sealStatus === "DAMAGED") {
    throw new Error("封签破损，无法完成检测");
  }

  const requiredItems = sample.testItems.filter((item) => item.isRequired);
  const completedResults = sample.testResults.filter(
    (r) => r.resultStatus !== TestResultStatus.PENDING && r.resultStatus !== TestResultStatus.NOT_TESTED
  );

  const missingItems = requiredItems.filter(
    (item) => !sample.testResults.some(
      (r) => r.testItemId === item.id && r.resultStatus !== TestResultStatus.PENDING
    )
  );

  let abnormalType: AbnormalType = AbnormalType.NONE;
  let abnormalDescription = "";

  if (missingItems.length > 0) {
    abnormalType = AbnormalType.MISSING_TEST_ITEMS;
    abnormalDescription = `漏检项目: ${missingItems.map((i) => i.name).join("、")}`;
  }

  const hasFailed = sample.testResults.some(
    (r) => r.resultStatus === TestResultStatus.FAILED
  );
  if (hasFailed && abnormalType === AbnormalType.NONE) {
    abnormalType = AbnormalType.TEST_FAILED;
    abnormalDescription = "存在检测不合格项目";
  }

  const updated = await prisma.sample.update({
    where: { id: sampleId },
    data: {
      status: SampleStatus.PENDING_DISPOSAL,
      testCompletedTime: new Date(),
      abnormalType,
      abnormalDescription: abnormalDescription || null,
      auditLogs: {
        create: {
          action: "检测完成",
          description: `实验室检测完成，${
            missingItems.length > 0 ? `存在 ${missingItems.length} 个漏检项目` : "所有项目已检测"
          }`,
          operatorId: session.user.id,
          oldStatus: sample.status,
          newStatus: SampleStatus.PENDING_DISPOSAL,
        },
      },
    },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
  revalidatePath("/lab-tasks");
  revalidatePath("/disposals");
  return updated;
}

const disposalSchema = z.object({
  disposalType: z.nativeEnum(DisposalType),
  disposalBasis: z.string().min(1, "处置依据不能为空"),
  remarks: z.string().optional(),
});

export async function createDisposal(sampleId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "DISPOSAL_REVIEWER") {
    throw new Error("无权限执行此操作");
  }

  const rawData = {
    disposalType: formData.get("disposalType") as string,
    disposalBasis: formData.get("disposalBasis") as string,
    remarks: formData.get("remarks") as string,
  };

  const validated = disposalSchema.parse({
    ...rawData,
    disposalType: rawData.disposalType as DisposalType,
  });

  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: {
      testItems: true,
      testResults: true,
    },
  });
  if (!sample) {
    throw new Error("样品不存在");
  }

  if (sample.sealStatus === "DAMAGED") {
    throw new Error("封签破损，无法做出处置结论");
  }

  const requiredItems = sample.testItems.filter((item) => item.isRequired);
  const missingRequiredItems = requiredItems.filter(
    (item) =>
      !sample.testResults.some(
        (r) =>
          r.testItemId === item.id &&
          r.resultStatus !== TestResultStatus.PENDING &&
          r.resultStatus !== TestResultStatus.NOT_TESTED
      )
  );
  const hasFailedTests = sample.testResults.some(
    (r) => r.resultStatus === TestResultStatus.FAILED
  );

  if (
    validated.disposalType === DisposalType.RELEASE &&
    (missingRequiredItems.length > 0 || hasFailedTests)
  ) {
    const reasons = [];
    if (missingRequiredItems.length > 0) {
      reasons.push(
        `存在 ${missingRequiredItems.length} 项必检项目未检测: ${missingRequiredItems.map((i) => i.name).join("、")}`
      );
    }
    if (hasFailedTests) {
      reasons.push("存在检测不合格项目");
    }
    throw new Error(`禁止合格放行：${reasons.join("；")}`);
  }

  const isReTest = validated.disposalType === DisposalType.RE_TEST;
  const isDetain = validated.disposalType === DisposalType.DETAIN;
  const isRelease = validated.disposalType === DisposalType.RELEASE;

  let newStatus: SampleStatus;
  let newCurrentHandlerId: string | null = sample.currentHandlerId;

  if (isRelease) {
    newStatus = SampleStatus.ARCHIVED;
    newCurrentHandlerId = null;
  } else if (isDetain) {
    newStatus = SampleStatus.DISPOSED;
  } else if (isReTest) {
    newStatus = SampleStatus.TESTING;
    const labTech = await prisma.user.findFirst({
      where: { role: "LAB_TECHNICIAN" },
      orderBy: { createdAt: "asc" },
    });
    newCurrentHandlerId = labTech?.id || null;
  } else {
    newStatus = SampleStatus.PENDING_DISPOSAL;
  }

  const disposal = await prisma.disposal.create({
    data: {
      sampleId,
      disposalType: validated.disposalType,
      disposalBasis: validated.disposalBasis,
      remarks: validated.remarks || null,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
      isFinal: !isReTest,
    },
  });

  let abnormalDescription = sample.abnormalDescription || "";
  if (isReTest && missingRequiredItems.length > 0) {
    abnormalDescription = `需补检项目: ${missingRequiredItems.map((i) => i.name).join("、")}`;
  } else if (isReTest) {
    abnormalDescription = "补检";
  }

  await prisma.sample.update({
    where: { id: sampleId },
    data: {
      status: newStatus,
      currentHandlerId: newCurrentHandlerId,
      disposalTime: isRelease || isDetain ? new Date() : sample.disposalTime,
      abnormalType: isReTest
        ? AbnormalType.MISSING_TEST_ITEMS
        : sample.abnormalType,
      abnormalDescription: isReTest ? abnormalDescription : sample.abnormalDescription,
      auditLogs: {
        create: {
          action: "处置复核",
          description: `处置结论: ${
            isRelease
              ? "合格放行"
              : isDetain
              ? "扣留"
              : isReTest
              ? `补检（${missingRequiredItems.length > 0 ? missingRequiredItems.length + "项必检项目待补检" : "重新检测"}）`
              : "结论复议"
          }`,
          operatorId: session.user.id,
          oldStatus: sample.status,
          newStatus,
        },
      },
    },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
  revalidatePath("/disposals");
  revalidatePath("/lab-tasks");
  return disposal;
}

export async function appealDisposal(sampleId: string, reason: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("请先登录");
  }

  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: { disposals: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!sample || sample.disposals.length === 0) {
    throw new Error("样品或处置记录不存在");
  }

  const latestDisposal = sample.disposals[0];

  await prisma.disposal.update({
    where: { id: latestDisposal.id },
    data: {
      isFinal: false,
      appealCount: { increment: 1 },
    },
  });

  await prisma.sample.update({
    where: { id: sampleId },
    data: {
      status: SampleStatus.PENDING_DISPOSAL,
      abnormalType: AbnormalType.CONCLUSION_APPEAL,
      abnormalDescription: `结论复议: ${reason}`,
      auditLogs: {
        create: {
          action: "结论复议",
          description: `申请结论复议，原因: ${reason}`,
          operatorId: session.user.id,
          oldStatus: sample.status,
          newStatus: SampleStatus.PENDING_DISPOSAL,
        },
      },
    },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
  revalidatePath("/disposals");
  return { success: true };
}

export async function getLabTasks() {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAB_TECHNICIAN") {
    throw new Error("无权限访问");
  }

  const tasks = await prisma.sample.findMany({
    where: {
      status: {
        in: [
          SampleStatus.SENT_TO_LAB,
          SampleStatus.TESTING,
          SampleStatus.PENDING_DISPOSAL,
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      testItems: true,
      testResults: true,
      seals: true,
      sampler: { select: { name: true } },
    },
  });

  return tasks;
}

export async function getDisposalTasks() {
  const session = await auth();
  if (!session?.user || session.user.role !== "DISPOSAL_REVIEWER") {
    throw new Error("无权限访问");
  }

  const tasks = await prisma.sample.findMany({
    where: {
      status: SampleStatus.PENDING_DISPOSAL,
    },
    orderBy: { testCompletedTime: "asc" },
    include: {
      testItems: true,
      testResults: { include: { testItem: true } },
      seals: true,
      currentHandler: { select: { name: true } },
    },
  });

  return tasks;
}
