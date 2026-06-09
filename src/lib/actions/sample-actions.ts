"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSampleNo, generateSealNo } from "@/lib/utils";
import {
  SampleStatus,
  SealStatus,
  TestResultStatus,
  AbnormalType,
  DisposalType,
  type UserRole,
} from "@prisma/client";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const samplingSchema = z.object({
  customsDeclarationNo: z.string().min(1, "报关单号不能为空"),
  goodsName: z.string().min(1, "货物名称不能为空"),
  goodsCategory: z.string().min(1, "商品类别不能为空"),
  hsCode: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  originCountry: z.string().optional(),
  port: z.string().min(1, "口岸不能为空"),
  consignee: z.string().optional(),
  consignor: z.string().optional(),
  samplingLocation: z.string().optional(),
  samplingNotes: z.string().optional(),
  testItems: z.array(z.string()).min(1, "至少选择一个检测项目"),
});

export async function createSample(data: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSPECTION_OFFICER") {
    throw new Error("无权限执行此操作");
  }

  const rawTestItems = data.getAll("testItems") as string[];
  const formData = {
    customsDeclarationNo: data.get("customsDeclarationNo") as string,
    goodsName: data.get("goodsName") as string,
    goodsCategory: data.get("goodsCategory") as string,
    hsCode: data.get("hsCode") as string,
    quantity: data.get("quantity") as string,
    unit: data.get("unit") as string,
    originCountry: data.get("originCountry") as string,
    port: data.get("port") as string,
    consignee: data.get("consignee") as string,
    consignor: data.get("consignor") as string,
    samplingLocation: data.get("samplingLocation") as string,
    samplingNotes: data.get("samplingNotes") as string,
    testItems: rawTestItems,
  };

  const validated = samplingSchema.parse(formData);

  const sampleNo = generateSampleNo();
  const sealNo = generateSealNo();

  const sample = await prisma.sample.create({
    data: {
      sampleNo,
      customsDeclarationNo: validated.customsDeclarationNo,
      goodsName: validated.goodsName,
      goodsCategory: validated.goodsCategory,
      hsCode: validated.hsCode || null,
      quantity: validated.quantity ? parseFloat(validated.quantity) : null,
      unit: validated.unit || null,
      originCountry: validated.originCountry || null,
      port: validated.port,
      consignee: validated.consignee || null,
      consignor: validated.consignor || null,
      status: SampleStatus.SAMPLED,
      samplerId: session.user.id,
      samplingTime: new Date(),
      samplingLocation: validated.samplingLocation || null,
      samplingNotes: validated.samplingNotes || null,
      currentHandlerId: session.user.id,
      testItems: {
        create: validated.testItems.map((name, idx) => ({
          name,
          isRequired: true,
          sortOrder: idx,
        })),
      },
      seals: {
        create: {
          sealNo,
          status: SealStatus.INTACT,
          sealedAt: new Date(),
        },
      },
      auditLogs: {
        create: {
          action: "取样登记",
          description: `查验关员 ${session.user.name} 完成样品取样登记，封签号: ${sealNo}`,
          operatorId: session.user.id,
          newStatus: SampleStatus.SAMPLED,
        },
      },
    },
    include: {
      testItems: true,
      seals: true,
    },
  });

  revalidatePath("/samples");
  redirect(`/samples/${sample.id}`);
}

export async function sendSampleToLab(sampleId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSPECTION_OFFICER") {
    throw new Error("无权限执行此操作");
  }

  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: { seals: true },
  });

  if (!sample) {
    throw new Error("样品不存在");
  }

  if (sample.sealStatus === SealStatus.DAMAGED) {
    throw new Error("封签破损，无法送检，请重新取样");
  }

  const updated = await prisma.sample.update({
    where: { id: sampleId },
    data: {
      status: SampleStatus.SENT_TO_LAB,
      sentToLabTime: new Date(),
      auditLogs: {
        create: {
          action: "送检",
          description: `样品已送检至实验室`,
          operatorId: session.user.id,
          oldStatus: sample.status,
          newStatus: SampleStatus.SENT_TO_LAB,
        },
      },
    },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
  return updated;
}

export async function reportSealDamaged(sampleId: string, description: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "LAB_TECHNICIAN") {
    throw new Error("无权限执行此操作");
  }

  const sample = await prisma.sample.findUnique({ where: { id: sampleId } });
  if (!sample) {
    throw new Error("样品不存在");
  }

  await prisma.sample.update({
    where: { id: sampleId },
    data: {
      sealStatus: SealStatus.DAMAGED,
      abnormalType: AbnormalType.SEAL_DAMAGED,
      abnormalDescription: description,
      status: SampleStatus.RE_SAMPLING,
      auditLogs: {
        create: {
          action: "封签破损报告",
          description: `实验室报告封签破损: ${description}`,
          operatorId: session.user.id,
          oldStatus: sample.status,
          newStatus: SampleStatus.RE_SAMPLING,
        },
      },
    },
  });

  await prisma.seal.updateMany({
    where: { sampleId, status: SealStatus.INTACT },
    data: { status: SealStatus.DAMAGED },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
}

export async function reSample(sampleId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSPECTION_OFFICER") {
    throw new Error("无权限执行此操作");
  }

  const parentSample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: { testItems: true },
  });

  if (!parentSample) {
    throw new Error("原样品不存在");
  }

  const newSampleNo = generateSampleNo();
  const newSealNo = generateSealNo();

  const newSample = await prisma.sample.create({
    data: {
      sampleNo: newSampleNo,
      customsDeclarationNo: parentSample.customsDeclarationNo,
      goodsName: parentSample.goodsName,
      goodsCategory: parentSample.goodsCategory,
      hsCode: parentSample.hsCode,
      quantity: parentSample.quantity,
      unit: parentSample.unit,
      originCountry: parentSample.originCountry,
      port: parentSample.port,
      consignee: parentSample.consignee,
      consignor: parentSample.consignor,
      status: SampleStatus.SAMPLED,
      samplerId: session.user.id,
      samplingTime: new Date(),
      currentHandlerId: session.user.id,
      reSampleParentId: sampleId,
      testItems: {
        create: parentSample.testItems.map((item, idx) => ({
          name: item.name,
          isRequired: item.isRequired,
          sortOrder: idx,
        })),
      },
      seals: {
        create: {
          sealNo: newSealNo,
          status: SealStatus.INTACT,
          sealedAt: new Date(),
        },
      },
      auditLogs: {
        create: {
          action: "重新取样",
          description: `因原样品封签破损，重新取样。原样品编号: ${parentSample.sampleNo}`,
          operatorId: session.user.id,
          newStatus: SampleStatus.SAMPLED,
        },
      },
    },
  });

  revalidatePath(`/samples/${sampleId}`);
  revalidatePath("/samples");
  redirect(`/samples/${newSample.id}`);
}

export async function getSampleDetail(sampleId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("请先登录");
  }

  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
    include: {
      sampler: { select: { id: true, name: true, role: true } },
      currentHandler: { select: { id: true, name: true, role: true } },
      testItems: { orderBy: { sortOrder: "asc" } },
      testResults: {
        include: {
          testItem: true,
          tester: { select: { id: true, name: true } },
        },
      },
      seals: true,
      disposals: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { id: true, name: true } } },
      },
      auditLogs: {
        orderBy: { timestamp: "asc" },
        include: { operator: { select: { id: true, name: true, role: true } } },
      },
      reSampleParent: { select: { id: true, sampleNo: true, status: true } },
      reSampleChildren: { select: { id: true, sampleNo: true, status: true } },
    },
  });

  return sample;
}

export async function getSampleList(params?: {
  status?: SampleStatus;
  port?: string;
  goodsCategory?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("请先登录");
  }

  const where: any = {};

  if (params?.status) {
    where.status = params.status;
  }
  if (params?.port) {
    where.port = params.port;
  }
  if (params?.goodsCategory) {
    where.goodsCategory = params.goodsCategory;
  }
  if (params?.search) {
    where.OR = [
      { sampleNo: { contains: params.search } },
      { customsDeclarationNo: { contains: params.search } },
      { goodsName: { contains: params.search } },
    ];
  }

  const samples = await prisma.sample.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      sampler: { select: { name: true } },
      currentHandler: { select: { name: true, role: true } },
      seals: { select: { sealNo: true, status: true } },
    },
  });

  return samples;
}
