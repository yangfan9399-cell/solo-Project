export enum UserRole {
  MERCHANT = 'MERCHANT',
  INVESTMENT_MANAGER = 'INVESTMENT_MANAGER',
  ENGINEER = 'ENGINEER',
  FIRE_INSPECTOR = 'FIRE_INSPECTOR'
}

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  INVESTMENT_REVIEWED = 'INVESTMENT_REVIEWED',
  ENGINEER_INSPECTED = 'ENGINEER_INSPECTED',
  FIRE_PASSED = 'FIRE_PASSED',
  FIRE_REJECTED = 'FIRE_REJECTED',
  ARCHIVED = 'ARCHIVED'
}

export enum InspectionResult {
  PASSED = 'PASSED',
  REJECTED = 'REJECTED',
  NEEDS_RECTIFICATION = 'NEEDS_RECTIFICATION',
  DRAWINGS_MISSING = 'DRAWINGS_MISSING',
  TIME_CONFLICT = 'TIME_CONFLICT'
}

export enum FileType {
  FLOOR_PLAN = 'FLOOR_PLAN',
  FIRE_PLAN = 'FIRE_PLAN',
  ELECTRICAL_PLAN = 'ELECTRICAL_PLAN',
  CONSTRUCTION_DRAWING = 'CONSTRUCTION_DRAWING',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER'
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Merchant {
  id: string
  name: string
  contactName: string
  phone: string
  email: string
  businessType: string
  createdAt: string
  updatedAt: string
}

export interface ShopUnit {
  id: string
  unitNumber: string
  floor: string
  area: number
  status: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Drawing {
  id: string
  applicationId: string
  name: string
  type: FileType
  fileUrl: string
  uploadedById: string
  uploadedAt: string
  description?: string
  uploadedBy: User
}

export interface Rectification {
  id: string
  inspectionNodeId: string
  description: string
  status: string
  completedAt?: string
  createdAt: string
}

export interface InspectionNode {
  id: string
  applicationId: string
  nodeType: string
  result?: InspectionResult
  remarks?: string
  handlerId?: string
  handledAt?: string
  nodeOrder: number
  rectificationDeadline?: string
  rectificationRequirements?: string
  createdAt: string
  handler?: User
  rectifications: Rectification[]
}

export interface ResponsiblePerson {
  id: string
  applicationId: string
  name: string
  role: string
  phone: string
  email?: string
  createdAt: string
}

export interface Application {
  id: string
  merchantId: string
  shopUnitId: string
  projectName: string
  status: ApplicationStatus
  constructionStart: string
  constructionEnd: string
  estimatedCost?: number
  projectScope: string
  investmentManagerId?: string
  createdAt: string
  updatedAt: string
  merchant: Merchant
  shopUnit: ShopUnit
  investmentManager?: User
  drawings: Drawing[]
  inspectionNodes: InspectionNode[]
  responsiblePersons: ResponsiblePerson[]
}

export const statusLabels: Record<ApplicationStatus, string> = {
  [ApplicationStatus.DRAFT]: '草稿',
  [ApplicationStatus.SUBMITTED]: '已提交待审核',
  [ApplicationStatus.INVESTMENT_REVIEWED]: '投资主管已审核',
  [ApplicationStatus.ENGINEER_INSPECTED]: '工程人员已检查',
  [ApplicationStatus.FIRE_PASSED]: '消防验收通过',
  [ApplicationStatus.FIRE_REJECTED]: '消防验收驳回',
  [ApplicationStatus.ARCHIVED]: '已归档'
}

export const resultLabels: Record<InspectionResult, string> = {
  [InspectionResult.PASSED]: '通过',
  [InspectionResult.REJECTED]: '驳回',
  [InspectionResult.NEEDS_RECTIFICATION]: '需整改',
  [InspectionResult.DRAWINGS_MISSING]: '图纸缺失',
  [InspectionResult.TIME_CONFLICT]: '时间冲突'
}

export const fileTypeLabels: Record<FileType, string> = {
  [FileType.FLOOR_PLAN]: '平面图',
  [FileType.FIRE_PLAN]: '消防图',
  [FileType.ELECTRICAL_PLAN]: '电气图',
  [FileType.CONSTRUCTION_DRAWING]: '施工图',
  [FileType.CERTIFICATE]: '证书',
  [FileType.OTHER]: '其他'
}

export const userRoleLabels: Record<UserRole, string> = {
  [UserRole.MERCHANT]: '商户',
  [UserRole.INVESTMENT_MANAGER]: '招商主管',
  [UserRole.ENGINEER]: '工程人员',
  [UserRole.FIRE_INSPECTOR]: '消防复核人'
}
