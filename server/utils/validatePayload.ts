import type { NodeActionPayload } from '~/types'

const APPLICANT_ALLOWED_FIELDS = [
  'operatorId',
  'operatorName',
  'remark',
  'businessRecord',
  'siteDescription',
  'attachments'
]

const REVIEWER_ALLOWED_FIELDS = [
  'operatorId',
  'operatorName',
  'remark',
  'evidenceConclusion',
  'blockReason',
  'remedyPath',
  'attachments',
  'updatedFields',
  'businessRecord',
  'siteDescription',
  'occurrenceTime',
  'keyObject',
  'amount'
]

const KEY_FIELDS = [
  'occurrenceTime',
  'keyObject',
  'amount',
  'evidenceConclusion'
]

const ACTION_ALLOWED_ROLES: Record<string, string[]> = {
  accept: ['APPLICANT', 'ADMIN'],
  process: ['APPLICANT', 'ADMIN'],
  supplement: ['APPLICANT', 'ADMIN'],
  review: ['REVIEWER', 'ADMIN'],
  archive: ['REVIEWER', 'ADMIN'],
  reject: ['REVIEWER', 'ADMIN'],
  reopen: ['REVIEWER', 'ADMIN']
}

export function validateAndFilterPayload(
  action: string,
  role: string,
  payload: NodeActionPayload
): NodeActionPayload {
  const result: any = {}
  const fieldLabels: Record<string, string> = {
    occurrenceTime: '发生时间',
    keyObject: '责任对象',
    amount: '金额数量',
    evidenceConclusion: '证据结论',
    updatedFields: '关键字段更新'
  }

  if (role === 'APPLICANT') {
    const allowed = APPLICANT_ALLOWED_FIELDS
    const forbidden: string[] = []

    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null || value === '') continue
      if (allowed.includes(key)) {
        (result as any)[key] = value
      } else if (KEY_FIELDS.includes(key) || key === 'updatedFields') {
        forbidden.push(fieldLabels[key] || key)
      }
    }

    if (forbidden.length > 0) {
      throw createError({
        statusCode: 403,
        message: `申请人无权修改：${forbidden.join('、')}。申请人仅允许补充业务记录、现场说明和证据附件`
      })
    }
  } else {
    const allowed = REVIEWER_ALLOWED_FIELDS
    for (const [key, value] of Object.entries(payload)) {
      if (value === undefined || value === null || value === '') continue
      if (allowed.includes(key)) {
        (result as any)[key] = value
      }
    }
  }

  return result as NodeActionPayload
}
