'use server'

import prisma from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function getUsersByRole(role: UserRole) {
  try {
    const users = await prisma.user.findMany({
      where: { role },
      orderBy: { name: 'asc' },
    })
    return { success: true, data: users }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return { success: false, error: '获取用户列表失败' }
  }
}

export async function getUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return { success: true, data: user }
  } catch (error) {
    console.error('获取用户失败:', error)
    return { success: false, error: '获取用户失败' }
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    return { success: true, data: user }
  } catch (error) {
    console.error('获取用户失败:', error)
    return { success: false, error: '获取用户失败' }
  }
}

export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' },
    })
    return { success: true, data: users }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return { success: false, error: '获取用户列表失败' }
  }
}
