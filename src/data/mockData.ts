export interface Asset {
  id: number
  assetNo: string
  name: string
  categoryName: string | null
  departmentName: string | null
  location: string | null
  userName: string | null
  purchaseDate: string
  bookValue: string
  tagNumber: string | null
  status: string
}

export interface InventoryRecord {
  id: number
  assetId: number
  inventoryDate: string
  discrepancyTypeId: number | null
  actualStatus: string | null
  actualLocation: string | null
  actualUser: string | null
  photoUrl: string | null
  remarks: string | null
  recorderName: string
  createdAt: string
  assetNo: string
  assetName: string
  discrepancyTypeName: string | null
  discrepancyTypeCode: string | null
  assetUser: string | null
  assetLocation: string | null
  assetBookValue: string | null
  departmentName?: string
  categoryName?: string
}

export interface DisposalProcess {
  id: number
  inventoryRecordId: number
  processType: string
  departmentRemark: string | null
  departmentApprovedAt: string | null
  departmentApproverName: string | null
  financeRemark: string | null
  financeApprovedAt: string | null
  financeApproverName: string | null
  supervisorRemark: string | null
  supervisorApprovedAt: string | null
  supervisorApproverName: string | null
  status: string
  createdAt: string
}

export interface AccountabilityRecord {
  id: number
  inventoryRecordId: number
  responsibleUserId: string
  responsibleUserName: string
  investigationResult: string | null
  compensationAmount: string | null
  status: string
  createdAt: string
  assetName: string | null
  assetNo: string | null
  assetBookValue: string | null
}

export interface Department {
  id: number
  name: string
  code: string
}

export interface AssetCategory {
  id: number
  name: string
  code: string
}

export interface DiscrepancyType {
  id: number
  name: string
  code: string
}

export const mockDepartments: Department[] = [
  { id: 1, name: '研发部', code: 'RD' },
  { id: 2, name: '财务部', code: 'FIN' },
  { id: 3, name: '行政部', code: 'ADM' },
  { id: 4, name: '销售部', code: 'SAL' },
  { id: 5, name: '生产部', code: 'PRO' },
]

export const mockCategories: AssetCategory[] = [
  { id: 1, name: '电脑设备', code: 'PC' },
  { id: 2, name: '办公家具', code: 'FURN' },
  { id: 3, name: '车辆', code: 'VEH' },
  { id: 4, name: '仪器设备', code: 'INST' },
  { id: 5, name: '其他', code: 'OTHER' },
]

export const mockDiscrepancyTypes: DiscrepancyType[] = [
  { id: 1, name: '账实一致', code: 'MATCH' },
  { id: 2, name: '资产丢失', code: 'LOST' },
  { id: 3, name: '跨部门调拨', code: 'TRANSFER' },
  { id: 4, name: '标签损坏', code: 'TAG_DAMAGED' },
  { id: 5, name: '位置不符', code: 'LOCATION_MISMATCH' },
  { id: 6, name: '使用人不符', code: 'USER_MISMATCH' },
]

export const mockAssets: Asset[] = [
  {
    id: 1,
    assetNo: 'AST-2024-001',
    name: '戴尔OptiPlex 7090台式机',
    categoryName: '电脑设备',
    departmentName: '研发部',
    location: '研发楼3层301室',
    userName: '张三',
    purchaseDate: '2024-01-15',
    bookValue: '7650',
    tagNumber: 'TAG-001',
    status: 'in_use',
  },
  {
    id: 2,
    assetNo: 'AST-2024-002',
    name: '惠普笔记本ProBook 450',
    categoryName: '电脑设备',
    departmentName: '财务部',
    location: '财务楼1层102室',
    userName: '李四',
    purchaseDate: '2024-02-20',
    bookValue: '6120',
    tagNumber: 'TAG-002',
    status: 'in_use',
  },
  {
    id: 3,
    assetNo: 'AST-2023-003',
    name: '办公桌（木质）',
    categoryName: '办公家具',
    departmentName: '行政部',
    location: '行政楼2层201室',
    userName: '王五',
    purchaseDate: '2023-06-10',
    bookValue: '960',
    tagNumber: 'TAG-003',
    status: 'in_use',
  },
  {
    id: 4,
    assetNo: 'AST-2023-004',
    name: '丰田凯美瑞轿车',
    categoryName: '车辆',
    departmentName: '行政部',
    location: '停车场A区',
    userName: '赵六',
    purchaseDate: '2023-03-15',
    bookValue: '198000',
    tagNumber: 'TAG-004',
    status: 'in_use',
  },
  {
    id: 5,
    assetNo: 'AST-2022-005',
    name: '电子显微镜',
    categoryName: '仪器设备',
    departmentName: '生产部',
    location: '生产车间B区',
    userName: '钱七',
    purchaseDate: '2022-08-20',
    bookValue: '105000',
    tagNumber: 'TAG-005',
    status: 'in_use',
  },
  {
    id: 6,
    assetNo: 'AST-2024-006',
    name: '联想ThinkPad X1',
    categoryName: '电脑设备',
    departmentName: '研发部',
    location: '研发楼3层302室',
    userName: '孙八',
    purchaseDate: '2024-03-10',
    bookValue: '10800',
    tagNumber: 'TAG-006',
    status: 'lost',
  },
  {
    id: 7,
    assetNo: 'AST-2023-007',
    name: '会议桌',
    categoryName: '办公家具',
    departmentName: '研发部',
    location: '研发楼3层会议室',
    userName: '周九',
    purchaseDate: '2023-09-01',
    bookValue: '4250',
    tagNumber: 'TAG-007',
    status: 'in_use',
  },
  {
    id: 8,
    assetNo: 'AST-2024-008',
    name: '打印机HP LaserJet',
    categoryName: '其他',
    departmentName: '财务部',
    location: '财务楼1层打印室',
    userName: '吴十',
    purchaseDate: '2024-04-05',
    bookValue: '2250',
    tagNumber: null,
    status: 'in_use',
  },
]

export const mockInventoryRecords: InventoryRecord[] = [
  {
    id: 1,
    assetId: 1,
    inventoryDate: '2024-12-01',
    discrepancyTypeId: 1,
    actualStatus: 'in_use',
    actualLocation: '研发楼3层301室',
    actualUser: '张三',
    photoUrl: null,
    remarks: '账实一致，资产状态良好',
    recorderName: '盘点员甲',
    createdAt: '2024-12-01 09:30:00',
    assetNo: 'AST-2024-001',
    assetName: '戴尔OptiPlex 7090台式机',
    discrepancyTypeName: '账实一致',
    discrepancyTypeCode: 'MATCH',
    assetUser: '张三',
    assetLocation: '研发楼3层301室',
    assetBookValue: '7650',
    departmentName: '研发部',
    categoryName: '电脑设备',
  },
  {
    id: 2,
    assetId: 6,
    inventoryDate: '2024-12-01',
    discrepancyTypeId: 2,
    actualStatus: 'lost',
    actualLocation: null,
    actualUser: null,
    photoUrl: null,
    remarks: '资产丢失，已报警处理',
    recorderName: '盘点员甲',
    createdAt: '2024-12-01 10:15:00',
    assetNo: 'AST-2024-006',
    assetName: '联想ThinkPad X1',
    discrepancyTypeName: '资产丢失',
    discrepancyTypeCode: 'LOST',
    assetUser: '孙八',
    assetLocation: '研发楼3层302室',
    assetBookValue: '10800',
    departmentName: '研发部',
    categoryName: '电脑设备',
  },
  {
    id: 3,
    assetId: 3,
    inventoryDate: '2024-12-02',
    discrepancyTypeId: 3,
    actualStatus: 'in_use',
    actualLocation: '研发楼3层303室',
    actualUser: '孙八',
    photoUrl: null,
    remarks: '已转移至研发部使用',
    recorderName: '盘点员乙',
    createdAt: '2024-12-02 14:00:00',
    assetNo: 'AST-2023-003',
    assetName: '办公桌（木质）',
    discrepancyTypeName: '跨部门调拨',
    discrepancyTypeCode: 'TRANSFER',
    assetUser: '王五',
    assetLocation: '行政楼2层201室',
    assetBookValue: '960',
    departmentName: '行政部',
    categoryName: '办公家具',
  },
  {
    id: 4,
    assetId: 8,
    inventoryDate: '2024-12-02',
    discrepancyTypeId: 4,
    actualStatus: 'in_use',
    actualLocation: '财务楼1层打印室',
    actualUser: '吴十',
    photoUrl: null,
    remarks: '资产标签丢失，需要重新打印',
    recorderName: '盘点员乙',
    createdAt: '2024-12-02 14:30:00',
    assetNo: 'AST-2024-008',
    assetName: '打印机HP LaserJet',
    discrepancyTypeName: '标签损坏',
    discrepancyTypeCode: 'TAG_DAMAGED',
    assetUser: '吴十',
    assetLocation: '财务楼1层打印室',
    assetBookValue: '2250',
    departmentName: '财务部',
    categoryName: '其他',
  },
  {
    id: 5,
    assetId: 2,
    inventoryDate: '2024-12-03',
    discrepancyTypeId: 1,
    actualStatus: 'in_use',
    actualLocation: '财务楼1层102室',
    actualUser: '李四',
    photoUrl: null,
    remarks: '账实一致',
    recorderName: '盘点员丙',
    createdAt: '2024-12-03 10:00:00',
    assetNo: 'AST-2024-002',
    assetName: '惠普笔记本ProBook 450',
    discrepancyTypeName: '账实一致',
    discrepancyTypeCode: 'MATCH',
    assetUser: '李四',
    assetLocation: '财务楼1层102室',
    assetBookValue: '6120',
    departmentName: '财务部',
    categoryName: '电脑设备',
  },
  {
    id: 6,
    assetId: 4,
    inventoryDate: '2024-12-03',
    discrepancyTypeId: 5,
    actualStatus: 'in_use',
    actualLocation: '停车场B区',
    actualUser: '赵六',
    photoUrl: null,
    remarks: '车辆停放位置变更',
    recorderName: '盘点员丙',
    createdAt: '2024-12-03 11:00:00',
    assetNo: 'AST-2023-004',
    assetName: '丰田凯美瑞轿车',
    discrepancyTypeName: '位置不符',
    discrepancyTypeCode: 'LOCATION_MISMATCH',
    assetUser: '赵六',
    assetLocation: '停车场A区',
    assetBookValue: '198000',
    departmentName: '行政部',
    categoryName: '车辆',
  },
  {
    id: 7,
    assetId: 5,
    inventoryDate: '2024-12-04',
    discrepancyTypeId: 6,
    actualStatus: 'in_use',
    actualLocation: '生产车间B区',
    actualUser: '郑十一',
    photoUrl: null,
    remarks: '使用人变更未登记',
    recorderName: '盘点员甲',
    createdAt: '2024-12-04 09:00:00',
    assetNo: 'AST-2022-005',
    assetName: '电子显微镜',
    discrepancyTypeName: '使用人不符',
    discrepancyTypeCode: 'USER_MISMATCH',
    assetUser: '钱七',
    assetLocation: '生产车间B区',
    assetBookValue: '105000',
    departmentName: '生产部',
    categoryName: '仪器设备',
  },
  {
    id: 8,
    assetId: 7,
    inventoryDate: '2024-12-04',
    discrepancyTypeId: 1,
    actualStatus: 'in_use',
    actualLocation: '研发楼3层会议室',
    actualUser: '周九',
    photoUrl: null,
    remarks: '账实一致',
    recorderName: '盘点员乙',
    createdAt: '2024-12-04 15:00:00',
    assetNo: 'AST-2023-007',
    assetName: '会议桌',
    discrepancyTypeName: '账实一致',
    discrepancyTypeCode: 'MATCH',
    assetUser: '周九',
    assetLocation: '研发楼3层会议室',
    assetBookValue: '4250',
    departmentName: '研发部',
    categoryName: '办公家具',
  },
]

export const mockDisposalProcesses: DisposalProcess[] = [
  {
    id: 1,
    inventoryRecordId: 2,
    processType: 'scrap',
    departmentRemark: '资产丢失，建议启动追责流程',
    departmentApprovedAt: '2024-12-05 10:00:00',
    departmentApproverName: '部门经理',
    financeRemark: '已核实账面价值，同意报废处理',
    financeApprovedAt: '2024-12-06 14:00:00',
    financeApproverName: '财务主管',
    supervisorRemark: '同意报废，同步启动追责',
    supervisorApprovedAt: '2024-12-07 09:00:00',
    supervisorApproverName: '总经理',
    status: 'approved',
    createdAt: '2024-12-05 09:00:00',
  },
  {
    id: 2,
    inventoryRecordId: 3,
    processType: 'transfer',
    departmentRemark: '同意调拨至研发部',
    departmentApprovedAt: '2024-12-05 11:00:00',
    departmentApproverName: '行政经理',
    financeRemark: '账务已处理完毕',
    financeApprovedAt: '2024-12-08 10:00:00',
    financeApproverName: '财务主管',
    supervisorRemark: '同意调拨',
    supervisorApprovedAt: '2024-12-09 14:00:00',
    supervisorApproverName: '总经理',
    status: 'approved',
    createdAt: '2024-12-05 10:30:00',
  },
  {
    id: 3,
    inventoryRecordId: 4,
    processType: 'maintain',
    departmentRemark: '同意重新打印标签',
    departmentApprovedAt: '2024-12-06 09:00:00',
    departmentApproverName: '财务主管',
    financeRemark: null,
    financeApprovedAt: null,
    financeApproverName: null,
    supervisorRemark: null,
    supervisorApprovedAt: null,
    supervisorApproverName: null,
    status: 'pending',
    createdAt: '2024-12-06 08:30:00',
  },
  {
    id: 4,
    inventoryRecordId: 6,
    processType: 'update',
    departmentRemark: '位置信息已更新',
    departmentApprovedAt: '2024-12-07 10:00:00',
    departmentApproverName: '行政专员',
    financeRemark: null,
    financeApprovedAt: null,
    financeApproverName: null,
    supervisorRemark: null,
    supervisorApprovedAt: null,
    supervisorApproverName: null,
    status: 'pending',
    createdAt: '2024-12-07 09:30:00',
  },
  {
    id: 5,
    inventoryRecordId: 7,
    processType: 'update',
    departmentRemark: '使用人信息待更新',
    departmentApprovedAt: null,
    departmentApproverName: null,
    financeRemark: null,
    financeApprovedAt: null,
    financeApproverName: null,
    supervisorRemark: null,
    supervisorApprovedAt: null,
    supervisorApproverName: null,
    status: 'pending',
    createdAt: '2024-12-08 10:00:00',
  },
]

export const mockAccountabilityRecords: AccountabilityRecord[] = [
  {
    id: 1,
    inventoryRecordId: 2,
    responsibleUserId: 'U006',
    responsibleUserName: '孙八',
    investigationResult: '资产因保管不善丢失，责任人已确认',
    compensationAmount: '5000',
    status: 'pending',
    createdAt: '2024-12-05 10:00:00',
    assetName: '联想ThinkPad X1',
    assetNo: 'AST-2024-006',
    assetBookValue: '10800',
  },
]

export async function getAssets(): Promise<Asset[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockAssets
}

export async function getInventoryRecords(): Promise<InventoryRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockInventoryRecords
}

export async function getInventoryRecordById(id: number): Promise<InventoryRecord | null> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockInventoryRecords.find(r => r.id === id) || null
}

export async function getDepartments(): Promise<Department[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockDepartments
}

export async function getAssetCategories(): Promise<AssetCategory[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockCategories
}

export async function getDiscrepancyTypes(): Promise<DiscrepancyType[]> {
  await new Promise(resolve => setTimeout(resolve, 200))
  return mockDiscrepancyTypes
}

export async function getDisposalProcesses(): Promise<DisposalProcess[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockDisposalProcesses
}

export async function getDisposalProcessById(inventoryRecordId: number): Promise<DisposalProcess | null> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockDisposalProcesses.find(p => p.inventoryRecordId === inventoryRecordId) || null
}

export async function createDisposalProcess(data: { inventoryRecordId: number; processType: string }): Promise<DisposalProcess> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const newProcess: DisposalProcess = {
    id: mockDisposalProcesses.length + 1,
    inventoryRecordId: data.inventoryRecordId,
    processType: data.processType,
    departmentRemark: null,
    departmentApprovedAt: null,
    departmentApproverName: null,
    financeRemark: null,
    financeApprovedAt: null,
    financeApproverName: null,
    supervisorRemark: null,
    supervisorApprovedAt: null,
    supervisorApproverName: null,
    status: 'pending',
    createdAt: new Date().toLocaleString(),
  }
  mockDisposalProcesses.push(newProcess)
  return newProcess
}

export async function updateDisposalProcess(id: number, data: Partial<DisposalProcess>): Promise<DisposalProcess | null> {
  await new Promise(resolve => setTimeout(resolve, 200))
  const index = mockDisposalProcesses.findIndex(p => p.id === id)
  if (index === -1) return null
  mockDisposalProcesses[index] = { ...mockDisposalProcesses[index], ...data }
  return mockDisposalProcesses[index]
}

export async function getAccountabilityRecords(): Promise<AccountabilityRecord[]> {
  await new Promise(resolve => setTimeout(resolve, 300))
  return mockAccountabilityRecords
}