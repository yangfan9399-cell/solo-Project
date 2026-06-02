import { getDatabase } from '../server/utils/database'

const db = getDatabase()

const tools = [
  {
    code: 'GJ-001',
    name: '数显游标卡尺',
    specification: '0-150mm',
    manufacturer: 'Mitutoyo',
    model: 'CD-15APX',
    serial_number: 'SN20230001',
    measurement_range: '0-150mm',
    accuracy: '0.01mm',
    department: '质量部',
    location: '量具室A区',
    status: 'available',
    calibration_cycle_days: 180,
    last_calibration_date: '2026-01-15',
    next_calibration_date: '2026-07-14',
    purchase_date: '2023-03-10',
    price: 850.00,
    remark: '高精度测量用'
  },
  {
    code: 'GJ-002',
    name: '外径千分尺',
    specification: '25-50mm',
    manufacturer: 'Mitutoyo',
    model: '103-138',
    serial_number: 'SN20230002',
    measurement_range: '25-50mm',
    accuracy: '0.001mm',
    department: '质量部',
    location: '量具室A区',
    status: 'available',
    calibration_cycle_days: 180,
    last_calibration_date: '2026-02-20',
    next_calibration_date: '2026-08-19',
    purchase_date: '2023-05-20',
    price: 1200.00,
    remark: ''
  },
  {
    code: 'GJ-003',
    name: '内径百分表',
    specification: '18-35mm',
    manufacturer: '哈量',
    model: '811-01',
    serial_number: 'SN20230003',
    measurement_range: '18-35mm',
    accuracy: '0.01mm',
    department: '生产一部',
    location: '车间量具柜',
    status: 'borrowed',
    calibration_cycle_days: 365,
    last_calibration_date: '2025-12-01',
    next_calibration_date: '2026-06-15',
    purchase_date: '2022-11-15',
    price: 450.00,
    remark: ''
  },
  {
    code: 'GJ-004',
    name: '电子天平',
    specification: '0-200g',
    manufacturer: 'Sartorius',
    model: 'BSA224S',
    serial_number: 'SN20230004',
    measurement_range: '0-200g',
    accuracy: '0.1mg',
    department: '质量部',
    location: '实验室',
    status: 'calibrating',
    calibration_cycle_days: 365,
    last_calibration_date: '2025-06-10',
    next_calibration_date: '2026-06-09',
    purchase_date: '2021-08-25',
    price: 5600.00,
    remark: '精密称量'
  },
  {
    code: 'GJ-005',
    name: '塞尺',
    specification: '0.02-1.00mm',
    manufacturer: '三丰',
    model: '184-313S',
    serial_number: 'SN20230005',
    measurement_range: '0.02-1.00mm',
    accuracy: '0.01mm',
    department: '生产二部',
    location: '装配车间',
    status: 'available',
    calibration_cycle_days: 365,
    last_calibration_date: '2026-03-01',
    next_calibration_date: '2027-02-28',
    purchase_date: '2024-01-10',
    price: 180.00,
    remark: ''
  },
  {
    code: 'GJ-006',
    name: '高度尺',
    specification: '0-300mm',
    manufacturer: 'Mitutoyo',
    model: '192-630-10',
    serial_number: 'SN20230006',
    measurement_range: '0-300mm',
    accuracy: '0.01mm',
    department: '质量部',
    location: '量具室B区',
    status: 'available',
    calibration_cycle_days: 180,
    last_calibration_date: '2026-04-15',
    next_calibration_date: '2026-10-12',
    purchase_date: '2023-09-05',
    price: 2800.00,
    remark: '数显型'
  },
  {
    code: 'GJ-007',
    name: '粗糙度仪',
    specification: '便携式',
    manufacturer: 'Taylor Hobson',
    model: 'Surtronic S-100',
    serial_number: 'SN20230007',
    measurement_range: 'Ra 0.05-100μm',
    accuracy: '±5%',
    department: '质量部',
    location: '检测室',
    status: 'available',
    calibration_cycle_days: 365,
    last_calibration_date: '2025-11-20',
    next_calibration_date: '2026-05-20',
    purchase_date: '2022-06-30',
    price: 12500.00,
    remark: '表面粗糙度测量'
  },
  {
    code: 'GJ-008',
    name: '硬度计',
    specification: '洛氏硬度',
    manufacturer: 'Wilson',
    model: '574',
    serial_number: 'SN20230008',
    measurement_range: 'HRA, HRB, HRC',
    accuracy: '±1HR',
    department: '质量部',
    location: '物理实验室',
    status: 'maintenance',
    calibration_cycle_days: 365,
    last_calibration_date: '2026-01-10',
    next_calibration_date: '2027-01-09',
    purchase_date: '2020-12-01',
    price: 35000.00,
    remark: '待更换压头'
  }
]

const insertTool = db.prepare(`
  INSERT INTO tools (
    code, name, specification, manufacturer, model, serial_number,
    measurement_range, accuracy, department, location, status,
    calibration_cycle_days, last_calibration_date, next_calibration_date,
    purchase_date, price, remark
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertBorrow = db.prepare(`
  INSERT INTO borrow_records (
    tool_id, tool_code, tool_name, applicant_id, applicant_name,
    applicant_department, purpose, expected_return_date, status,
    approver_id, approver_name, approved_at,
    handover_person_id, handover_person_name, handed_over_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertCalibration = db.prepare(`
  INSERT INTO calibration_records (
    tool_id, tool_code, tool_name, planned_date, actual_date,
    status, calibration_agency, certificate_number, calibration_result,
    next_calibration_date, cost, inspector_id, inspector_name
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertFeedback = db.prepare(`
  INSERT INTO feedbacks (
    tool_id, tool_code, reporter_id, reporter_name, type, title, description, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

db.transaction(() => {
  console.log('正在插入示例数据...')

  const toolIds: number[] = []
  for (const tool of tools) {
    const result = insertTool.run(
      tool.code, tool.name, tool.specification, tool.manufacturer,
      tool.model, tool.serial_number, tool.measurement_range, tool.accuracy,
      tool.department, tool.location, tool.status, tool.calibration_cycle_days,
      tool.last_calibration_date, tool.next_calibration_date,
      tool.purchase_date, tool.price, tool.remark
    )
    toolIds.push(Number(result.lastInsertRowid))
  }

  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  insertBorrow.run(
    toolIds[2], 'GJ-003', '内径百分表',
    2, '张三', '生产一部',
    '生产线零件检测',
    yesterday,
    'borrowed',
    1, '系统管理员', now,
    1, '系统管理员', now
  )

  insertBorrow.run(
    toolIds[0], 'GJ-001', '数显游标卡尺',
    3, '李四', '生产二部',
    '新产品试生产测量',
    nextWeek,
    'pending',
    null, null, null,
    null, null, null
  )

  insertCalibration.run(
    toolIds[3], 'GJ-004', '电子天平',
    lastMonth, null,
    'in_progress',
    '市计量检测院',
    null, null,
    null, null,
    4, '王质量'
  )

  insertCalibration.run(
    toolIds[1], 'GJ-002', '外径千分尺',
    nextWeek, null,
    'scheduled',
    '第三方校准机构',
    null, null,
    null, null,
    null, null
  )

  insertFeedback.run(
    toolIds[7], 'GJ-008',
    4, '王质量',
    '量具损坏',
    '硬度计压头磨损',
    '硬度计压头磨损严重，需要更换新压头后重新校准',
    'processing'
  )

  console.log('示例数据插入完成！')
  console.log(`- 量具: ${tools.length} 件`)
  console.log(`- 借用记录: 2 条`)
  console.log(`- 校准记录: 2 条`)
  console.log(`- 反馈记录: 1 条`)
})()

process.exit(0)
