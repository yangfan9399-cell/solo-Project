import prisma from './prisma'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  accept: ['APPLICANT', 'ADMIN'],
  process: ['APPLICANT', 'ADMIN'],
  supplement: ['APPLICANT', 'ADMIN'],
  review: ['REVIEWER', 'ADMIN'],
  archive: ['REVIEWER', 'ADMIN'],
  reject: ['REVIEWER', 'ADMIN'],
  reopen: ['REVIEWER', 'ADMIN']
}

export async function requireRole(
  operatorId: string,
  action: string
): Promise<{ id: string; name: string; role: string }> {
  if (!operatorId) {
    throw createError({ statusCode: 401, message: '缺少操作人ID' })
  }

  const user = await prisma.user.findUnique({
    where: { id: operatorId }
  })

  if (!user) {
    throw createError({ statusCode: 401, message: '操作人不存在' })
  }

  const allowedRoles = ROLE_PERMISSIONS[action]
  if (!allowedRoles) {
    throw createError({ statusCode: 403, message: `未知操作类型: ${action}` })
  }

  if (!allowedRoles.includes(user.role)) {
    const roleLabel: Record<string, string> = {
      APPLICANT: '申请人',
      REVIEWER: '复核人',
      ADMIN: '管理员'
    }
    throw createError({
      statusCode: 403,
      message: `权限不足：${roleLabel[user.role] || user.role}不能执行"${action}"操作，需要${allowedRoles.map(r => roleLabel[r]).join('或')}权限`
    })
  }

  return { id: user.id, name: user.name, role: user.role }
}

export async function requireRecordStatus(recordId: string, allowedStatuses: string[]) {
  const record = await prisma.alarmRecord.findUnique({
    where: { id: recordId },
    select: { id: true, status: true, isArchived: true }
  })

  if (!record) {
    throw createError({ statusCode: 404, message: '记录不存在' })
  }

  if (!allowedStatuses.includes(record.status)) {
    throw createError({
      statusCode: 409,
      message: `当前记录状态为"${record.status}"，不允许此操作（需要: ${allowedStatuses.join('/')})`
    })
  }

  return record
}
