import prisma from './prisma'

export const ROLES = {
  OPERATOR: 'OPERATOR',
  REVIEWER: 'REVIEWER'
} as const

export type RoleType = typeof ROLES[keyof typeof ROLES]

export const checkRole = async (userId: number, requiredRole: RoleType | RoleType[]): Promise<{
  allowed: boolean
  userRole?: string
  message?: string
}> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true }
  })

  if (!user) {
    return { allowed: false, message: '用户不存在' }
  }

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  if (!roles.includes(user.role as RoleType)) {
    const roleNames: Record<string, string> = {
      [ROLES.OPERATOR]: '经办人',
      [ROLES.REVIEWER]: '复核人'
    }
    return {
      allowed: false,
      userRole: user.role,
      message: `当前用户为${roleNames[user.role] || user.role}，无权限执行此操作，需要${roles.map(r => roleNames[r] || r).join('或')}权限`
    }
  }

  return { allowed: true, userRole: user.role }
}

export const assertRole = async (userId: number, requiredRole: RoleType | RoleType[]) => {
  const result = await checkRole(userId, requiredRole)
  if (!result.allowed) {
    throw createError({
      statusCode: 403,
      message: result.message || '无权限执行此操作'
    })
  }
  return result
}
