import fs from 'fs'
import path from 'path'

export type WorkOrderStatus = 'PENDING' | 'DISPATCHED' | 'REPAIRED' | 'REVIEWING' | 'COMPLETED' | 'REJECTED'
export type LeakLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type RepairResult = 'FIXED' | 'SUSPECTED_DUPLICATE' | 'VALVE_LOCATION_FAILED' | 'NOT_REPAIRED'
export type ReviewResult = 'APPROVED' | 'REJECTED'
export type HistoryAction = 'REPORTED' | 'DISPATCHED' | 'REPAIRED' | 'REVIEWED' | 'REJECTED' | 'MERGED'

export interface PipeSection {
  id: string
  name: string
  area: string
  diameter: string
  material: string
  installationYear: number
}

export interface RepairTeam {
  id: string
  name: string
  leaderName: string
  leaderPhone: string
}

export interface WorkOrderHistory {
  id: string
  workOrderId: string
  action: HistoryAction
  operator: string
  comment?: string
  createdAt: Date
}

export interface WorkOrder {
  id: string
  serialNumber: string
  status: WorkOrderStatus
  reporterName: string
  reporterPhone: string
  pipeSectionId: string
  pipeSection: PipeSection
  leakLevel: LeakLevel
  waterStopArea?: string
  description: string
  createdAt: Date
  updatedAt: Date
  dispatchTo?: string
  repairTeam?: RepairTeam
  repairResult?: RepairResult
  repairPhotos: string[]
  reviewResult?: ReviewResult
  reviewComment?: string
  mergedFrom: string[]
  history: WorkOrderHistory[]
}

const DB_DIR = path.join(process.cwd(), 'data')
const WORK_ORDERS_FILE = path.join(DB_DIR, 'workOrders.json')
const NEXT_SERIAL_FILE = path.join(DB_DIR, 'nextSerial.json')

export const pipeSections: PipeSection[] = [
  { id: 'ps1', name: '管段A-001', area: '东城片区', diameter: 'DN300', material: '铸铁', installationYear: 2005 },
  { id: 'ps2', name: '管段B-002', area: '西城片区', diameter: 'DN200', material: 'PE', installationYear: 2018 },
  { id: 'ps3', name: '管段C-003', area: '南城片区', diameter: 'DN400', material: '钢管', installationYear: 1998 },
  { id: 'ps4', name: '管段D-004', area: '北城片区', diameter: 'DN150', material: 'PE', installationYear: 2020 },
  { id: 'ps5', name: '管段E-005', area: '中心片区', diameter: 'DN500', material: '钢管', installationYear: 2010 },
]

export const repairTeams: RepairTeam[] = [
  { id: 'rt1', name: '抢修一队', leaderName: '张师傅', leaderPhone: '13800138001' },
  { id: 'rt2', name: '抢修二队', leaderName: '李师傅', leaderPhone: '13800138002' },
  { id: 'rt3', name: '抢修三队', leaderName: '王师傅', leaderPhone: '13800138003' },
]

function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true })
  }
}

function readWorkOrders(): WorkOrder[] {
  ensureDir()
  if (!fs.existsSync(WORK_ORDERS_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(WORK_ORDERS_FILE, 'utf-8')
    const orders = JSON.parse(data)
    return orders.map((o: WorkOrder) => ({
      ...o,
      createdAt: new Date(o.createdAt),
      updatedAt: new Date(o.updatedAt),
      history: o.history.map((h: WorkOrderHistory) => ({
        ...h,
        createdAt: new Date(h.createdAt),
      })),
    }))
  } catch {
    return []
  }
}

function writeWorkOrders(orders: WorkOrder[]) {
  ensureDir()
  fs.writeFileSync(WORK_ORDERS_FILE, JSON.stringify(orders, null, 2))
}

function readNextSerial(): number {
  ensureDir()
  if (!fs.existsSync(NEXT_SERIAL_FILE)) {
    return 1
  }
  try {
    const data = fs.readFileSync(NEXT_SERIAL_FILE, 'utf-8')
    return JSON.parse(data).nextSerialNumber || 1
  } catch {
    return 1
  }
}

function writeNextSerial(num: number) {
  ensureDir()
  fs.writeFileSync(NEXT_SERIAL_FILE, JSON.stringify({ nextSerialNumber: num }))
}

function generateSerialNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = String(readNextSerial()).padStart(4, '0')
  writeNextSerial(readNextSerial() + 1)
  return `LS${year}${month}${day}${seq}`
}

function initSampleDataIfEmpty() {
  const existingOrders = readWorkOrders()
  if (existingOrders.length > 0) return
  
  const ps1 = pipeSections[0]
  const ps2 = pipeSections[1]
  const ps3 = pipeSections[2]
  const ps4 = pipeSections[3]
  const rt1 = repairTeams[0]
  const rt2 = repairTeams[1]

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const sampleOrders: WorkOrder[] = [
    {
      id: 'wo1',
      serialNumber: 'LS2606080001',
      status: 'COMPLETED',
      reporterName: '刘先生',
      reporterPhone: '13900139001',
      pipeSectionId: ps1.id,
      pipeSection: ps1,
      leakLevel: 'MEDIUM',
      waterStopArea: '东城小区1-3号楼',
      description: '用户反映楼下水管漏水，地面有积水',
      createdAt: twoDaysAgo,
      updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      dispatchTo: rt1.id,
      repairTeam: rt1,
      repairResult: 'FIXED',
      repairPhotos: ['photo1.jpg', 'photo2.jpg'],
      reviewResult: 'APPROVED',
      mergedFrom: ['LS2606100007'],
      history: [
        { id: 'h1', workOrderId: 'wo1', action: 'REPORTED', operator: '客服小王', createdAt: twoDaysAgo },
        { id: 'h2', workOrderId: 'wo1', action: 'DISPATCHED', operator: '调度员老李', comment: '派往抢修一队', createdAt: new Date(twoDaysAgo.getTime() + 1 * 60 * 60 * 1000) },
        { id: 'h3', workOrderId: 'wo1', action: 'REPAIRED', operator: '张师傅', comment: '已修复漏水点', createdAt: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000) },
        { id: 'h4', workOrderId: 'wo1', action: 'REVIEWED', operator: '复核员陈工', comment: '确认恢复供水', createdAt: new Date(twoDaysAgo.getTime() + 6 * 60 * 60 * 1000) },
        { id: 'h17', workOrderId: 'wo1', action: 'MERGED', operator: '调度员老李', comment: '合并工单 LS2606100007', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      ],
    },
    {
      id: 'wo2',
      serialNumber: 'LS2606090002',
      status: 'REVIEWING',
      reporterName: '王女士',
      reporterPhone: '13900139002',
      pipeSectionId: ps2.id,
      pipeSection: ps2,
      leakLevel: 'HIGH',
      waterStopArea: '西城商业街A区',
      description: '商铺反映水压明显下降，怀疑管道破损',
      createdAt: yesterday,
      updatedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      dispatchTo: rt2.id,
      repairTeam: rt2,
      repairResult: 'FIXED',
      repairPhotos: ['photo3.jpg'],
      mergedFrom: [],
      history: [
        { id: 'h5', workOrderId: 'wo2', action: 'REPORTED', operator: '客服小张', createdAt: yesterday },
        { id: 'h6', workOrderId: 'wo2', action: 'DISPATCHED', operator: '调度员老李', comment: '派往抢修二队', createdAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) },
        { id: 'h7', workOrderId: 'wo2', action: 'REPAIRED', operator: '李师傅', comment: '更换DN200管道一节', createdAt: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000) },
      ],
    },
    {
      id: 'wo3',
      serialNumber: 'LS2606090003',
      status: 'DISPATCHED',
      reporterName: '赵先生',
      reporterPhone: '13900139003',
      pipeSectionId: ps3.id,
      pipeSection: ps3,
      leakLevel: 'CRITICAL',
      waterStopArea: '南城医院周边',
      description: '医院反馈大面积停水，紧急抢修',
      createdAt: yesterday,
      updatedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      dispatchTo: rt1.id,
      repairTeam: rt1,
      mergedFrom: ['LS2606090004', 'LS2606090005'],
      repairPhotos: [],
      history: [
        { id: 'h8', workOrderId: 'wo3', action: 'REPORTED', operator: '客服紧急热线', createdAt: yesterday },
        { id: 'h9', workOrderId: 'wo3', action: 'DISPATCHED', operator: '调度员老李', comment: '紧急派往抢修一队', createdAt: new Date(yesterday.getTime() + 30 * 60 * 1000) },
        { id: 'h10', workOrderId: 'wo3', action: 'MERGED', operator: '客服小王', comment: '合并工单 LS2606090004, LS2606090005', createdAt: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000) },
      ],
    },
    {
      id: 'wo4',
      serialNumber: 'LS2606100006',
      status: 'REPAIRED',
      reporterName: '孙女士',
      reporterPhone: '13900139004',
      pipeSectionId: ps2.id,
      pipeSection: ps2,
      leakLevel: 'LOW',
      description: '家中水龙头出水变小，怀疑楼内管道问题',
      createdAt: now,
      updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      dispatchTo: rt2.id,
      repairTeam: rt2,
      repairResult: 'VALVE_LOCATION_FAILED',
      repairPhotos: [],
      mergedFrom: [],
      history: [
        { id: 'h11', workOrderId: 'wo4', action: 'REPORTED', operator: '客服小李', createdAt: now },
        { id: 'h12', workOrderId: 'wo4', action: 'DISPATCHED', operator: '调度员老王', comment: '派往抢修二队', createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
        { id: 'h13', workOrderId: 'wo4', action: 'REPAIRED', operator: '李师傅', comment: '阀门定位失败，需要进一步排查', createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
      ],
    },
    {
      id: 'wo5',
      serialNumber: 'LS2606100007',
      status: 'REJECTED',
      reporterName: '周先生',
      reporterPhone: '13900139005',
      pipeSectionId: ps1.id,
      pipeSection: ps1,
      leakLevel: 'MEDIUM',
      description: '重复报修同一漏点',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
      repairResult: 'SUSPECTED_DUPLICATE',
      mergedFrom: [],
      repairPhotos: [],
      history: [
        { id: 'h14', workOrderId: 'wo5', action: 'REPORTED', operator: '客服小王', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
        { id: 'h15', workOrderId: 'wo5', action: 'REJECTED', operator: '调度员老李', comment: '疑似重复报修，已合并到工单 LS2606080001', createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
      ],
    },
    {
      id: 'wo6',
      serialNumber: 'LS2606100008',
      status: 'PENDING',
      reporterName: '吴先生',
      reporterPhone: '13900139006',
      pipeSectionId: ps4.id,
      pipeSection: pipeSections[3],
      leakLevel: 'MEDIUM',
      waterStopArea: '北城新区5-8号楼',
      description: '夜间发现楼道有水渗出',
      createdAt: now,
      updatedAt: now,
      mergedFrom: [],
      repairPhotos: [],
      history: [
        { id: 'h16', workOrderId: 'wo6', action: 'REPORTED', operator: '客服小张', createdAt: now },
      ],
    },
  ]

  writeWorkOrders(sampleOrders)
  writeNextSerial(9)
}

export const db = {
  pipeSection: {
    findMany: () => Promise.resolve(pipeSections),
    findUnique: (args: { where: { id: string } }) => 
      Promise.resolve(pipeSections.find(ps => ps.id === args.where.id) || null),
  },
  repairTeam: {
    findMany: () => Promise.resolve(repairTeams),
    findUnique: (args: { where: { id: string } }) => 
      Promise.resolve(repairTeams.find(rt => rt.id === args.where.id) || null),
  },
  workOrder: {
    findMany: (args?: { where?: Partial<WorkOrder> }) => {
      initSampleDataIfEmpty()
      let result = [...readWorkOrders()]
      const where = args?.where
      if (where) {
        if (where.status) {
          result = result.filter(w => w.status === where.status)
        }
        if (where.pipeSectionId) {
          result = result.filter(w => w.pipeSectionId === where.pipeSectionId)
        }
        if (where.dispatchTo) {
          result = result.filter(w => w.dispatchTo === where.dispatchTo)
        }
      }
      return Promise.resolve(result)
    },
    findUnique: (args: { where: { id: string } }) => {
      initSampleDataIfEmpty()
      return Promise.resolve(readWorkOrders().find(w => w.id === args.where.id) || null)
    },
    create: (args: { data: Omit<WorkOrder, 'id' | 'serialNumber' | 'createdAt' | 'updatedAt' | 'history'> }) => {
      initSampleDataIfEmpty()
      const newOrder: WorkOrder = {
        id: Math.random().toString(36).substr(2, 9),
        serialNumber: generateSerialNumber(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
        history: [{
          id: Math.random().toString(36).substr(2, 9),
          workOrderId: '',
          action: 'REPORTED',
          operator: args.data.reporterName,
          createdAt: new Date(),
        }],
        mergedFrom: args.data.mergedFrom || [],
        repairPhotos: args.data.repairPhotos || [],
      }
      newOrder.history[0].workOrderId = newOrder.id
      const orders = readWorkOrders()
      orders.push(newOrder)
      writeWorkOrders(orders)
      return Promise.resolve(newOrder)
    },
    update: (args: { where: { id: string }, data: Partial<WorkOrder> }) => {
      initSampleDataIfEmpty()
      const orders = readWorkOrders()
      const index = orders.findIndex(w => w.id === args.where.id)
      if (index === -1) return Promise.resolve(null)
      orders[index] = { ...orders[index], ...args.data, updatedAt: new Date() }
      writeWorkOrders(orders)
      return Promise.resolve(orders[index])
    },
  },
}