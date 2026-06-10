import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/water_leak_db',
})

export default pool

// Type definitions (matching Prisma schema)
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
  pipeSection?: PipeSection
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
  history?: WorkOrderHistory[]
}

// Reference data
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

// Prisma-like client interface
interface PrismaLikeClient {
  pipeSection: {
    findMany: () => Promise<PipeSection[]>
    findUnique: (args: { where: { id: string } }) => Promise<PipeSection | null>
  }
  repairTeam: {
    findMany: () => Promise<RepairTeam[]>
    findUnique: (args: { where: { id: string } }) => Promise<RepairTeam | null>
  }
  workOrder: {
    findMany: (args?: { where?: { status?: string; pipeSectionId?: string; dispatchTo?: string } }) => Promise<WorkOrder[]>
    findUnique: (args: { where: { id: string } }) => Promise<WorkOrder | null>
    create: (args: { data: Partial<WorkOrder> }) => Promise<WorkOrder>
    update: (args: { where: { id: string }; data: Partial<WorkOrder> }) => Promise<WorkOrder>
    delete: (args: { where: { id: string } }) => Promise<void>
  }
}

// Database initialization
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS pipe_sections (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        area VARCHAR(100) NOT NULL,
        diameter VARCHAR(50) NOT NULL,
        material VARCHAR(50) NOT NULL,
        installation_year INT NOT NULL
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS repair_teams (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        leader_name VARCHAR(100) NOT NULL,
        leader_phone VARCHAR(20) NOT NULL
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id VARCHAR(50) PRIMARY KEY,
        serial_number VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        reporter_name VARCHAR(100) NOT NULL,
        reporter_phone VARCHAR(20) NOT NULL,
        pipe_section_id VARCHAR(50) REFERENCES pipe_sections(id),
        leak_level VARCHAR(20) NOT NULL,
        water_stop_area VARCHAR(200),
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        dispatch_to VARCHAR(50) REFERENCES repair_teams(id),
        repair_result VARCHAR(50),
        repair_photos TEXT[] DEFAULT '{}',
        review_result VARCHAR(20),
        review_comment TEXT,
        merged_from TEXT[] DEFAULT '{}'
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS work_order_history (
        id VARCHAR(50) PRIMARY KEY,
        work_order_id VARCHAR(50) REFERENCES work_orders(id) ON DELETE CASCADE,
        action VARCHAR(20) NOT NULL,
        operator VARCHAR(100) NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Initialize reference data
    const sectionsResult = await client.query('SELECT COUNT(*) FROM pipe_sections')
    if (parseInt(sectionsResult.rows[0].count) === 0) {
      for (const ps of pipeSections) {
        await client.query(
          'INSERT INTO pipe_sections (id, name, area, diameter, material, installation_year) VALUES ($1, $2, $3, $4, $5, $6)',
          [ps.id, ps.name, ps.area, ps.diameter, ps.material, ps.installationYear]
        )
      }
    }

    const teamsResult = await client.query('SELECT COUNT(*) FROM repair_teams')
    if (parseInt(teamsResult.rows[0].count) === 0) {
      for (const rt of repairTeams) {
        await client.query(
          'INSERT INTO repair_teams (id, name, leader_name, leader_phone) VALUES ($1, $2, $3, $4)',
          [rt.id, rt.name, rt.leaderName, rt.leaderPhone]
        )
      }
    }

    // Initialize sample data
    const ordersResult = await client.query('SELECT COUNT(*) FROM work_orders')
    if (parseInt(ordersResult.rows[0].count) === 0) {
      await initializeSampleData(client)
    }
  } finally {
    client.release()
  }
}

async function initializeSampleData(client: any): Promise<void> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const sampleOrders = [
    {
      id: 'wo1',
      serial_number: 'LS2606080001',
      status: 'COMPLETED',
      reporter_name: '刘先生',
      reporter_phone: '13900139001',
      pipe_section_id: 'ps1',
      leak_level: 'MEDIUM',
      water_stop_area: '东城小区1-3号楼',
      description: '用户反映楼下水管漏水，地面有积水',
      created_at: twoDaysAgo,
      dispatch_to: 'rt1',
      repair_result: 'FIXED',
      repair_photos: ['photo1.jpg', 'photo2.jpg'],
      review_result: 'APPROVED',
      merged_from: ['LS2606100007'],
    },
    {
      id: 'wo2',
      serial_number: 'LS2606090002',
      status: 'REVIEWING',
      reporter_name: '王女士',
      reporter_phone: '13900139002',
      pipe_section_id: 'ps2',
      leak_level: 'HIGH',
      water_stop_area: '西城商业街A区',
      description: '商铺反映水压明显下降，怀疑管道破损',
      created_at: yesterday,
      dispatch_to: 'rt2',
      repair_result: 'FIXED',
      repair_photos: ['photo3.jpg'],
      merged_from: [],
    },
    {
      id: 'wo3',
      serial_number: 'LS2606090003',
      status: 'DISPATCHED',
      reporter_name: '赵先生',
      reporter_phone: '13900139003',
      pipe_section_id: 'ps3',
      leak_level: 'CRITICAL',
      water_stop_area: '南城医院周边',
      description: '医院反馈大面积停水，紧急抢修',
      created_at: yesterday,
      dispatch_to: 'rt1',
      repair_photos: [],
      merged_from: ['LS2606090004', 'LS2606090005'],
    },
    {
      id: 'wo4',
      serial_number: 'LS2606100006',
      status: 'REPAIRED',
      reporter_name: '孙女士',
      reporter_phone: '13900139004',
      pipe_section_id: 'ps2',
      leak_level: 'LOW',
      description: '家中水龙头出水变小，怀疑楼内管道问题',
      created_at: now,
      dispatch_to: 'rt2',
      repair_result: 'VALVE_LOCATION_FAILED',
      repair_photos: [],
      merged_from: [],
    },
    {
      id: 'wo5',
      serial_number: 'LS2606100007',
      status: 'REJECTED',
      reporter_name: '周先生',
      reporter_phone: '13900139005',
      pipe_section_id: 'ps1',
      leak_level: 'MEDIUM',
      description: '重复报修同一漏点',
      created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      repair_result: 'SUSPECTED_DUPLICATE',
      repair_photos: [],
      merged_from: [],
    },
    {
      id: 'wo6',
      serial_number: 'LS2606100008',
      status: 'PENDING',
      reporter_name: '吴先生',
      reporter_phone: '13900139006',
      pipe_section_id: 'ps4',
      leak_level: 'MEDIUM',
      water_stop_area: '北城新区5-8号楼',
      description: '夜间发现楼道有水渗出',
      created_at: now,
      repair_photos: [],
      merged_from: [],
    },
  ]

  for (const order of sampleOrders) {
    await client.query(
      `INSERT INTO work_orders (id, serial_number, status, reporter_name, reporter_phone, pipe_section_id, leak_level, water_stop_area, description, created_at, dispatch_to, repair_result, repair_photos, review_result, merged_from)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        order.id, order.serial_number, order.status, order.reporter_name, order.reporter_phone,
        order.pipe_section_id, order.leak_level, order.water_stop_area, order.description,
        order.created_at, order.dispatch_to, order.repair_result, order.repair_photos,
        order.review_result, order.merged_from
      ]
    )
  }

  const histories = [
    { id: 'h1', work_order_id: 'wo1', action: 'REPORTED', operator: '客服小王', created_at: twoDaysAgo },
    { id: 'h2', work_order_id: 'wo1', action: 'DISPATCHED', operator: '调度员老李', comment: '派往抢修一队', created_at: new Date(twoDaysAgo.getTime() + 1 * 60 * 60 * 1000) },
    { id: 'h3', work_order_id: 'wo1', action: 'REPAIRED', operator: '张师傅', comment: '已修复漏水点', created_at: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000) },
    { id: 'h4', work_order_id: 'wo1', action: 'REVIEWED', operator: '复核员陈工', comment: '确认恢复供水', created_at: new Date(twoDaysAgo.getTime() + 6 * 60 * 60 * 1000) },
    { id: 'h17', work_order_id: 'wo1', action: 'MERGED', operator: '调度员老李', comment: '合并工单 LS2606100007', created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'h5', work_order_id: 'wo2', action: 'REPORTED', operator: '客服小张', created_at: yesterday },
    { id: 'h6', work_order_id: 'wo2', action: 'DISPATCHED', operator: '调度员老李', comment: '派往抢修二队', created_at: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) },
    { id: 'h7', work_order_id: 'wo2', action: 'REPAIRED', operator: '李师傅', comment: '更换DN200管道一节', created_at: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000) },
    { id: 'h8', work_order_id: 'wo3', action: 'REPORTED', operator: '客服紧急热线', created_at: yesterday },
    { id: 'h9', work_order_id: 'wo3', action: 'DISPATCHED', operator: '调度员老李', comment: '紧急派往抢修一队', created_at: new Date(yesterday.getTime() + 30 * 60 * 1000) },
    { id: 'h10', work_order_id: 'wo3', action: 'MERGED', operator: '客服小王', comment: '合并工单 LS2606090004, LS2606090005', created_at: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000) },
    { id: 'h11', work_order_id: 'wo4', action: 'REPORTED', operator: '客服小李', created_at: now },
    { id: 'h12', work_order_id: 'wo4', action: 'DISPATCHED', operator: '调度员老王', comment: '派往抢修二队', created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
    { id: 'h13', work_order_id: 'wo4', action: 'REPAIRED', operator: '李师傅', comment: '阀门定位失败，需要进一步排查', created_at: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
    { id: 'h14', work_order_id: 'wo5', action: 'REPORTED', operator: '客服小王', created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    { id: 'h15', work_order_id: 'wo5', action: 'REJECTED', operator: '调度员老李', comment: '疑似重复报修，已合并到工单 LS2606080001', created_at: new Date(now.getTime() - 30 * 60 * 1000) },
    { id: 'h16', work_order_id: 'wo6', action: 'REPORTED', operator: '客服小张', created_at: now },
  ]

  for (const h of histories) {
    await client.query(
      'INSERT INTO work_order_history (id, work_order_id, action, operator, comment, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [h.id, h.work_order_id, h.action, h.operator, h.comment || null, h.created_at]
    )
  }
}

// Prisma-like database client
export const prisma: PrismaLikeClient = {
  pipeSection: {
    findMany: async () => {
      const result = await pool.query('SELECT * FROM pipe_sections')
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        area: row.area,
        diameter: row.diameter,
        material: row.material,
        installationYear: row.installation_year,
      }))
    },
    findUnique: async (args) => {
      const result = await pool.query('SELECT * FROM pipe_sections WHERE id = $1', [args.where.id])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        id: row.id,
        name: row.name,
        area: row.area,
        diameter: row.diameter,
        material: row.material,
        installationYear: row.installation_year,
      }
    },
  },
  repairTeam: {
    findMany: async () => {
      const result = await pool.query('SELECT * FROM repair_teams')
      return result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        leaderName: row.leader_name,
        leaderPhone: row.leader_phone,
      }))
    },
    findUnique: async (args) => {
      const result = await pool.query('SELECT * FROM repair_teams WHERE id = $1', [args.where.id])
      if (result.rows.length === 0) return null
      const row = result.rows[0]
      return {
        id: row.id,
        name: row.name,
        leaderName: row.leader_name,
        leaderPhone: row.leader_phone,
      }
    },
  },
  workOrder: {
    findMany: async (args) => {
      let query = `
        SELECT wo.*, 
               ps.id as ps_id, ps.name as ps_name, ps.area as ps_area, ps.diameter as ps_diameter, ps.material as ps_material,
               rt.id as rt_id, rt.name as rt_name, rt.leader_name as rt_leader, rt.leader_phone as rt_phone
        FROM work_orders wo
        LEFT JOIN pipe_sections ps ON wo.pipe_section_id = ps.id
        LEFT JOIN repair_teams rt ON wo.dispatch_to = rt.id
      `
      const params: any[] = []
      const conditions: string[] = []

      if (args?.where) {
        if (args.where.status) {
          params.push(args.where.status)
          conditions.push(`wo.status = $${params.length}`)
        }
        if (args.where.pipeSectionId) {
          params.push(args.where.pipeSectionId)
          conditions.push(`wo.pipe_section_id = $${params.length}`)
        }
        if (args.where.dispatchTo) {
          params.push(args.where.dispatchTo)
          conditions.push(`wo.dispatch_to = $${params.length}`)
        }
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ')
      }
      query += ' ORDER BY wo.created_at DESC'

      const result = await pool.query(query, params)
      return result.rows.map((row: any) => mapRowToWorkOrder(row))
    },
    findUnique: async (args) => {
      const result = await pool.query(`
        SELECT wo.*, 
               ps.id as ps_id, ps.name as ps_name, ps.area as ps_area, ps.diameter as ps_diameter, ps.material as ps_material,
               rt.id as rt_id, rt.name as rt_name, rt.leader_name as rt_leader, rt.leader_phone as rt_phone
        FROM work_orders wo
        LEFT JOIN pipe_sections ps ON wo.pipe_section_id = ps.id
        LEFT JOIN repair_teams rt ON wo.dispatch_to = rt.id
        WHERE wo.id = $1
      `, [args.where.id])
      if (result.rows.length === 0) return null
      return mapRowToWorkOrder(result.rows[0])
    },
    create: async (args) => {
      const nextSeq = await pool.query('SELECT COUNT(*) FROM work_orders')
      const seq = parseInt(nextSeq.rows[0].count) + 1
      const date = new Date()
      const year = date.getFullYear().toString().slice(2)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const serialNumber = `LS${year}${month}${day}${String(seq).padStart(4, '0')}`
      const id = `wo${Date.now()}`

      await pool.query(
        `INSERT INTO work_orders (id, serial_number, status, reporter_name, reporter_phone, pipe_section_id, leak_level, water_stop_area, description, repair_photos, merged_from)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id, serialNumber, args.data.status || 'PENDING',
          args.data.reporterName, args.data.reporterPhone,
          args.data.pipeSectionId, args.data.leakLevel,
          args.data.waterStopArea || null, args.data.description || '',
          JSON.stringify(args.data.repairPhotos || []),
          JSON.stringify(args.data.mergedFrom || [])
        ]
      )

      await pool.query(
        'INSERT INTO work_order_history (id, work_order_id, action, operator) VALUES ($1, $2, $3, $4)',
        [`h${Date.now()}`, id, 'REPORTED', args.data.reporterName || '系统']
      )

      const result = await pool.query('SELECT * FROM work_orders WHERE id = $1', [id])
      return mapRowToWorkOrder(result.rows[0])
    },
    update: async (args) => {
      const updates: string[] = ['updated_at = NOW()']
      const params: any[] = []

      if (args.data.status) {
        params.push(args.data.status)
        updates.push(`status = $${params.length}`)
      }
      if (args.data.dispatchTo !== undefined) {
        params.push(args.data.dispatchTo || null)
        updates.push(`dispatch_to = $${params.length}`)
      }
      if (args.data.repairResult !== undefined) {
        params.push(args.data.repairResult || null)
        updates.push(`repair_result = $${params.length}`)
      }
      if (args.data.repairPhotos !== undefined) {
        params.push(JSON.stringify(args.data.repairPhotos))
        updates.push(`repair_photos = $${params.length}`)
      }
      if (args.data.reviewResult !== undefined) {
        params.push(args.data.reviewResult || null)
        updates.push(`review_result = $${params.length}`)
      }
      if (args.data.reviewComment !== undefined) {
        params.push(args.data.reviewComment || null)
        updates.push(`review_comment = $${params.length}`)
      }
      if (args.data.mergedFrom !== undefined) {
        params.push(JSON.stringify(args.data.mergedFrom))
        updates.push(`merged_from = $${params.length}`)
      }

      params.push(args.where.id)
      await pool.query(
        `UPDATE work_orders SET ${updates.join(', ')} WHERE id = $${params.length}`,
        params
      )

      const result = await pool.query('SELECT * FROM work_orders WHERE id = $1', [args.where.id])
      return mapRowToWorkOrder(result.rows[0])
    },
    delete: async (args) => {
      await pool.query('DELETE FROM work_orders WHERE id = $1', [args.where.id])
    },
  },
}

function mapRowToWorkOrder(row: any): WorkOrder {
  return {
    id: row.id,
    serialNumber: row.serial_number,
    status: row.status,
    reporterName: row.reporter_name,
    reporterPhone: row.reporter_phone,
    pipeSectionId: row.pipe_section_id,
    pipeSection: row.ps_id ? {
      id: row.ps_id,
      name: row.ps_name,
      area: row.ps_area,
      diameter: row.ps_diameter,
      material: row.ps_material,
      installationYear: 0,
    } : undefined,
    leakLevel: row.leak_level,
    waterStopArea: row.water_stop_area,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dispatchTo: row.dispatch_to,
    repairTeam: row.rt_id ? {
      id: row.rt_id,
      name: row.rt_name,
      leaderName: row.rt_leader,
      leaderPhone: row.rt_phone,
    } : undefined,
    repairResult: row.repair_result,
    repairPhotos: row.repair_photos || [],
    reviewResult: row.review_result,
    reviewComment: row.review_comment,
    mergedFrom: row.merged_from || [],
  }
}

// Export db for compatibility
export const db = prisma