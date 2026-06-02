'use server'

import prisma from '@/lib/prisma'
import { FacilityStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getBuildings() {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        _count: {
          select: { rooms: true, energyAbnormals: true },
        },
        energyAbnormals: {
          where: { status: { not: 'RESOLVED' } },
        },
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, data: buildings }
  } catch (error) {
    console.error('获取楼栋列表失败:', error)
    return { success: false, error: '获取楼栋列表失败' }
  }
}

export async function getRooms(buildingId?: string) {
  try {
    const where = buildingId ? { buildingId } : {}
    const rooms = await prisma.room.findMany({
      where,
      include: {
        building: true,
        _count: {
          select: { facilities: true, repairOrders: true },
        },
      },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    })
    return { success: true, data: rooms }
  } catch (error) {
    console.error('获取房间列表失败:', error)
    return { success: false, error: '获取房间列表失败' }
  }
}

export async function getFacilityCategories() {
  try {
    const categories = await prisma.facilityCategory.findMany({
      include: {
        _count: {
          select: { facilities: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, data: categories }
  } catch (error) {
    console.error('获取设施分类失败:', error)
    return { success: false, error: '获取设施分类失败' }
  }
}

export async function getFacilities(filters?: {
  roomId?: string
  categoryId?: string
  status?: FacilityStatus
}) {
  try {
    const where: any = {}
    if (filters?.roomId) where.roomId = filters.roomId
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.status) where.status = filters.status

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        room: { include: { building: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return { success: true, data: facilities }
  } catch (error) {
    console.error('获取设施列表失败:', error)
    return { success: false, error: '获取设施列表失败' }
  }
}

export async function createFacility(data: {
  name: string
  categoryId: string
  roomId?: string
  brand?: string
  model?: string
  description?: string
}) {
  try {
    const facility = await prisma.facility.create({
      data: {
        ...data,
        status: FacilityStatus.NORMAL,
      },
      include: {
        room: { include: { building: true } },
        category: true,
      },
    })
    revalidatePath('/facilities')
    return { success: true, data: facility }
  } catch (error) {
    console.error('创建设施失败:', error)
    return { success: false, error: '创建设施失败' }
  }
}

export async function updateFacilityStatus(
  facilityId: string,
  status: FacilityStatus,
  remark?: string
) {
  try {
    const facility = await prisma.facility.update({
      where: { id: facilityId },
      data: {
        status,
        lastCheck: new Date(),
      },
    })
    revalidatePath('/facilities')
    return { success: true, data: facility }
  } catch (error) {
    console.error('更新设施状态失败:', error)
    return { success: false, error: '更新设施状态失败' }
  }
}

export async function getMaintenanceWorkers() {
  try {
    const workers = await prisma.user.findMany({
      where: { role: 'MAINTENANCE_WORKER' },
      include: {
        _count: {
          select: { repairOrdersAssigned: true },
        },
      },
      orderBy: { name: 'asc' },
    })
    return { success: true, data: workers }
  } catch (error) {
    console.error('获取维修师傅列表失败:', error)
    return { success: false, error: '获取维修师傅列表失败' }
  }
}
