'use server'

import prisma from '@/lib/prisma'
import { EnergyAbnormalStatus, SatisfactionLevel } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getEnergyRecords(buildingId?: string) {
  try {
    const where = buildingId ? { buildingId } : {}
    const records = await prisma.energyRecord.findMany({
      where,
      include: {
        building: true,
        room: true,
      },
      orderBy: { recordDate: 'desc' },
    })
    return { success: true, data: records }
  } catch (error) {
    console.error('获取能耗记录失败:', error)
    return { success: false, error: '获取能耗记录失败' }
  }
}

export async function getEnergyAbnormals(filters?: {
  buildingId?: string
  status?: EnergyAbnormalStatus
  type?: string
}) {
  try {
    const where: any = {}
    if (filters?.buildingId) where.buildingId = filters.buildingId
    if (filters?.status) where.status = filters.status
    if (filters?.type) where.type = filters.type

    const abnormals = await prisma.energyAbnormal.findMany({
      where,
      include: {
        building: true,
        room: true,
        audits: { include: { auditor: true } },
      },
      orderBy: { detectedDate: 'desc' },
    })
    return { success: true, data: abnormals }
  } catch (error) {
    console.error('获取能耗异常失败:', error)
    return { success: false, error: '获取能耗异常失败' }
  }
}

export async function confirmEnergyAbnormal(
  abnormalId: string,
  auditorId: string,
  remark?: string
) {
  try {
    await prisma.energyAbnormal.update({
      where: { id: abnormalId },
      data: {
        status: EnergyAbnormalStatus.CONFIRMED,
        confirmedDate: new Date(),
        remark,
      },
    })

    await prisma.energyAudit.create({
      data: {
        abnormalId,
        auditorId,
        auditResult: '确认异常',
        remark: remark || '已确认异常',
      },
    })

    const abnormal = await prisma.energyAbnormal.findUnique({
      where: { id: abnormalId },
      include: {
        building: true,
        room: true,
        audits: { include: { auditor: true } },
      },
    })

    revalidatePath('/energy')
    return { success: true, data: abnormal }
  } catch (error) {
    console.error('确认能耗异常失败:', error)
    return { success: false, error: '确认能耗异常失败' }
  }
}

export async function resolveEnergyAbnormal(
  abnormalId: string,
  auditorId: string,
  deductionAmount: number,
  remark?: string
) {
  try {
    await prisma.energyAbnormal.update({
      where: { id: abnormalId },
      data: {
        status: EnergyAbnormalStatus.RESOLVED,
        resolvedDate: new Date(),
        deductionAmount,
        remark,
      },
    })

    await prisma.energyAudit.create({
      data: {
        abnormalId,
        auditorId,
        auditResult: '已处理并扣费',
        deductionApplied: true,
        deductionAmount,
        remark: remark || '已完成处理',
      },
    })

    const abnormal = await prisma.energyAbnormal.findUnique({
      where: { id: abnormalId },
      include: {
        building: true,
        room: true,
        audits: { include: { auditor: true } },
      },
    })

    revalidatePath('/energy')
    return { success: true, data: abnormal }
  } catch (error) {
    console.error('处理能耗异常失败:', error)
    return { success: false, error: '处理能耗异常失败' }
  }
}

export async function dismissEnergyAbnormal(
  abnormalId: string,
  auditorId: string,
  remark?: string
) {
  try {
    await prisma.energyAbnormal.update({
      where: { id: abnormalId },
      data: {
        status: EnergyAbnormalStatus.DISMISSED,
        remark,
      },
    })

    await prisma.energyAudit.create({
      data: {
        abnormalId,
        auditorId,
        auditResult: '误报，已排除',
        deductionApplied: false,
        remark: remark || '经核实为误报',
      },
    })

    const abnormal = await prisma.energyAbnormal.findUnique({
      where: { id: abnormalId },
      include: {
        building: true,
        room: true,
        audits: { include: { auditor: true } },
      },
    })

    revalidatePath('/energy')
    return { success: true, data: abnormal }
  } catch (error) {
    console.error('驳回能耗异常失败:', error)
    return { success: false, error: '驳回能耗异常失败' }
  }
}

export async function createSatisfactionSurvey(data: {
  repairOrderId: string
  submitterId: string
  satisfaction: SatisfactionLevel
  responseTime?: number
  serviceQuality?: number
  repairQuality?: number
  comment?: string
}) {
  try {
    const repairOrder = await prisma.repairOrder.findUnique({
      where: { id: data.repairOrderId },
    })

    if (!repairOrder) {
      return { success: false, error: '报修单不存在' }
    }

    if (repairOrder.creatorId !== data.submitterId) {
      return { success: false, error: '只能评价自己提交的报修单' }
    }

    if (repairOrder.status !== 'COMPLETED') {
      return { success: false, error: '只能评价已完成的报修单' }
    }

    const existingSurvey = await prisma.satisfactionSurvey.findUnique({
      where: { repairOrderId: data.repairOrderId },
    })

    if (existingSurvey) {
      return { success: false, error: '该报修单已评价' }
    }

    const survey = await prisma.satisfactionSurvey.create({
      data,
      include: {
        repairOrder: {
          include: {
            room: { include: { building: true } },
            creator: true,
            assignedWorker: true,
          },
        },
        submitter: true,
      },
    })
    revalidatePath('/surveys')
    return { success: true, data: survey }
  } catch (error) {
    console.error('提交满意度调查失败:', error)
    return { success: false, error: '提交满意度调查失败' }
  }
}

export async function getSatisfactionSurveys() {
  try {
    const surveys = await prisma.satisfactionSurvey.findMany({
      include: {
        repairOrder: {
          include: {
            room: { include: { building: true } },
            creator: true,
            assignedWorker: true,
          },
        },
        submitter: true,
      },
      orderBy: { submittedAt: 'desc' },
    })
    return { success: true, data: surveys }
  } catch (error) {
    console.error('获取满意度调查失败:', error)
    return { success: false, error: '获取满意度调查失败' }
  }
}

export async function getDashboardStats() {
  try {
    const [
      totalRepairs,
      pendingRepairs,
      completedRepairs,
      totalAbnormals,
      pendingAbnormals,
      totalFacilities,
      repairStats,
    ] = await Promise.all([
      prisma.repairOrder.count(),
      prisma.repairOrder.count({ where: { status: { in: ['PENDING', 'ASSIGNED'] } } }),
      prisma.repairOrder.count({ where: { status: 'COMPLETED' } }),
      prisma.energyAbnormal.count(),
      prisma.energyAbnormal.count({ where: { status: { in: ['DETECTED', 'CONFIRMED'] } } }),
      prisma.facility.count(),
      prisma.repairOrder.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    return {
      success: true,
      data: {
        totalRepairs,
        pendingRepairs,
        completedRepairs,
        totalAbnormals,
        pendingAbnormals,
        totalFacilities,
        repairStats,
      },
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return { success: false, error: '获取统计数据失败' }
  }
}
