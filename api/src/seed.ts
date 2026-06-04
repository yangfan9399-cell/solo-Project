import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { WorkOrder, WorkOrderStatus, FaultSource, FaultType, RepairType } from './entities/work-order.entity.js'
import { PartsFee } from './entities/parts-fee.entity.js'
import { LaborFee } from './entities/labor-fee.entity.js'
import { ProcessNode } from './entities/process-node.entity.js'
import { Evidence } from './entities/evidence.entity.js'

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'yangfan',
  password: '',
  database: 'charging_pile_platform',
  synchronize: true,
  entities: [WorkOrder, PartsFee, LaborFee, ProcessNode, Evidence]
})

async function seed() {
  await AppDataSource.initialize()
  console.log('数据库连接成功')

  const orderRepo = AppDataSource.getRepository(WorkOrder)
  const partsFeeRepo = AppDataSource.getRepository(PartsFee)
  const laborFeeRepo = AppDataSource.getRepository(LaborFee)
  const processNodeRepo = AppDataSource.getRepository(ProcessNode)
  const evidenceRepo = AppDataSource.getRepository(Evidence)

  await AppDataSource.query('TRUNCATE TABLE evidences, process_nodes, parts_fees, labor_fees, work_orders CASCADE')
  console.log('已清理旧数据')

  const now = new Date()

  const order1 = orderRepo.create({
    orderNo: 'WO2024A001',
    status: WorkOrderStatus.ARCHIVED,
    faultSource: FaultSource.MONITOR_ALERT,
    faultType: FaultType.COMMUNICATION_FAULT,
    deviceId: 'DEV-HD-001',
    deviceNo: 'CP-HD-001',
    stationId: 'ST-HD-ZGC',
    stationName: '海淀中关村充电站',
    repairType: RepairType.REMOTE_RECOVERY,
    repairNote: '通信模块重启后恢复正常，远程下发复位指令解决',
    repairDuration: 15,
    assigneeId: 'USER-ZHANG',
    assigneeName: '张工',
    isRepeat: false,
    repeatCount: 0,
    createdBy: 'system'
  })
  const saved1 = await orderRepo.save(order1)

  await processNodeRepo.save([
    processNodeRepo.create({
      orderId: saved1.id, action: '创建工单', operator: 'system', operatorRole: 'system',
      note: '故障来源: monitor_alert, 故障类型: communication_fault'
    }),
    processNodeRepo.create({
      orderId: saved1.id, action: '分配工单', operator: '调度中心', operatorRole: 'dispatcher',
      note: '分配给: 张工'
    }),
    processNodeRepo.create({
      orderId: saved1.id, action: '开始维修', operator: '张工', operatorRole: 'technician',
      note: '维修方式: remote_recovery, 维修时长: 15分钟'
    }),
    processNodeRepo.create({
      orderId: saved1.id, action: '提交结算', operator: '张工', operatorRole: 'technician',
      note: '维修完成，提交费用结算'
    }),
    processNodeRepo.create({
      orderId: saved1.id, action: '确认归档', operator: '财务李', operatorRole: 'finance',
      note: '费用确认无误，工单归档'
    })
  ])

  await laborFeeRepo.save(laborFeeRepo.create({
    orderId: saved1.id, amount: 200
  }))

  await evidenceRepo.save([
    evidenceRepo.create({
      orderId: saved1.id, type: 'log', title: '监控告警日志', url: '/evidences/WO2024A001/alert-log.txt'
    }),
    evidenceRepo.create({
      orderId: saved1.id, type: 'image', title: '远程恢复截图', url: '/evidences/WO2024A001/recovery-screenshot.png'
    })
  ])

  console.log('✅ 订单1 (远程恢复) 创建完成')

  const order2 = orderRepo.create({
    orderNo: 'WO2024A002',
    status: WorkOrderStatus.PENDING_SETTLEMENT,
    faultSource: FaultSource.USER_REPORT,
    faultType: FaultType.CHARGING_FAULT,
    deviceId: 'DEV-CY-003',
    deviceNo: 'CP-CY-003',
    stationId: 'ST-CY-WJ',
    stationName: '朝阳望京充电站',
    repairType: RepairType.ON_SITE_REPAIR,
    repairNote: '充电模块故障，更换充电模块及通信板卡后恢复正常',
    repairDuration: 120,
    assigneeId: 'USER-LI',
    assigneeName: '李工',
    isRepeat: false,
    repeatCount: 0,
    createdBy: 'user_report_001'
  })
  const saved2 = await orderRepo.save(order2)

  await processNodeRepo.save([
    processNodeRepo.create({
      orderId: saved2.id, action: '创建工单', operator: 'user_report_001', operatorRole: 'system',
      note: '故障来源: user_report, 故障类型: charging_fault'
    }),
    processNodeRepo.create({
      orderId: saved2.id, action: '分配工单', operator: '调度中心', operatorRole: 'dispatcher',
      note: '分配给: 李工'
    }),
    processNodeRepo.create({
      orderId: saved2.id, action: '开始维修', operator: '李工', operatorRole: 'technician',
      note: '维修方式: on_site_repair, 维修时长: 120分钟'
    }),
    processNodeRepo.create({
      orderId: saved2.id, action: '提交结算', operator: '李工', operatorRole: 'technician',
      note: '维修完成，提交费用结算'
    })
  ])

  await partsFeeRepo.save([
    partsFeeRepo.create({
      orderId: saved2.id, partName: '充电模块', quantity: 1, unitPrice: 3500, subtotal: 3500,
      isDisputed: false, disputeReason: null
    }),
    partsFeeRepo.create({
      orderId: saved2.id, partName: '通信板卡', quantity: 1, unitPrice: 1200, subtotal: 1200,
      isDisputed: false, disputeReason: null
    })
  ])

  await laborFeeRepo.save(laborFeeRepo.create({
    orderId: saved2.id, amount: 500
  }))

  await evidenceRepo.save([
    evidenceRepo.create({
      orderId: saved2.id, type: 'image', title: '故障充电模块照片', url: '/evidences/WO2024A002/fault-module.jpg'
    }),
    evidenceRepo.create({
      orderId: saved2.id, type: 'image', title: '维修后照片', url: '/evidences/WO2024A002/after-repair.jpg'
    })
  ])

  console.log('✅ 订单2 (现场维修) 创建完成')

  const order3 = orderRepo.create({
    orderNo: 'WO2024A003',
    status: WorkOrderStatus.DISPUTED,
    faultSource: FaultSource.PATROL_FOUND,
    faultType: FaultType.POWER_FAULT,
    deviceId: 'DEV-FT-007',
    deviceNo: 'CP-FT-007',
    stationId: 'ST-FT-KJY',
    stationName: '丰台科技园充电站',
    repairType: RepairType.ON_SITE_REPAIR,
    repairNote: '功率模块烧毁，更换功率模块及继电器后恢复正常',
    repairDuration: 180,
    assigneeId: 'USER-WANG',
    assigneeName: '王工',
    isRepeat: false,
    repeatCount: 0,
    createdBy: 'patrol_002'
  })
  const saved3 = await orderRepo.save(order3)

  await processNodeRepo.save([
    processNodeRepo.create({
      orderId: saved3.id, action: '创建工单', operator: 'patrol_002', operatorRole: 'system',
      note: '故障来源: patrol_found, 故障类型: power_fault'
    }),
    processNodeRepo.create({
      orderId: saved3.id, action: '分配工单', operator: '调度中心', operatorRole: 'dispatcher',
      note: '分配给: 王工'
    }),
    processNodeRepo.create({
      orderId: saved3.id, action: '开始维修', operator: '王工', operatorRole: 'technician',
      note: '维修方式: on_site_repair, 维修时长: 180分钟'
    }),
    processNodeRepo.create({
      orderId: saved3.id, action: '提交结算', operator: '王工', operatorRole: 'technician',
      note: '维修完成，提交费用结算'
    }),
    processNodeRepo.create({
      orderId: saved3.id, action: '发起争议', operator: '财务赵', operatorRole: 'finance',
      note: '功率模块报价偏高，供应商报价为 ¥6200'
    })
  ])

  await partsFeeRepo.save([
    partsFeeRepo.create({
      orderId: saved3.id, partName: '功率模块', quantity: 1, unitPrice: 8500, subtotal: 8500,
      isDisputed: true, disputeReason: '供应商报价为 ¥6200'
    }),
    partsFeeRepo.create({
      orderId: saved3.id, partName: '继电器', quantity: 2, unitPrice: 450, subtotal: 900,
      isDisputed: false, disputeReason: null
    })
  ])

  await laborFeeRepo.save(laborFeeRepo.create({
    orderId: saved3.id, amount: 800
  }))

  await evidenceRepo.save([
    evidenceRepo.create({
      orderId: saved3.id, type: 'image', title: '烧毁功率模块照片', url: '/evidences/WO2024A003/burnt-module.jpg'
    }),
    evidenceRepo.create({
      orderId: saved3.id, type: 'log', title: '供应商报价单', url: '/evidences/WO2024A003/supplier-quote.pdf'
    })
  ])

  console.log('✅ 订单3 (费用争议) 创建完成')

  const order4 = orderRepo.create({
    orderNo: 'WO2024A004',
    status: WorkOrderStatus.ASSIGNED,
    faultSource: FaultSource.MONITOR_ALERT,
    faultType: FaultType.GUN_FAULT,
    deviceId: 'DEV-HD-001',
    deviceNo: 'CP-HD-001',
    stationId: 'ST-HD-ZGC',
    stationName: '海淀中关村充电站',
    repairType: null,
    repairNote: '',
    repairDuration: null,
    assigneeId: 'USER-LI',
    assigneeName: '李工',
    isRepeat: true,
    repeatCount: 2,
    createdBy: 'system'
  })
  const saved4 = await orderRepo.save(order4)

  await processNodeRepo.save([
    processNodeRepo.create({
      orderId: saved4.id, action: '创建工单', operator: 'system', operatorRole: 'system',
      note: '故障来源: monitor_alert, 故障类型: gun_fault (重复报修第2次)'
    }),
    processNodeRepo.create({
      orderId: saved4.id, action: '分配工单', operator: '调度中心', operatorRole: 'dispatcher',
      note: '分配给: 李工 (重复报修工单优先处理)'
    })
  ])

  await partsFeeRepo.save([
    partsFeeRepo.create({
      orderId: saved4.id, partName: '充电枪头', quantity: 1, unitPrice: 2800, subtotal: 2800,
      isDisputed: false, disputeReason: null
    })
  ])

  await laborFeeRepo.save(laborFeeRepo.create({
    orderId: saved4.id, amount: 400
  }))

  await evidenceRepo.save([
    evidenceRepo.create({
      orderId: saved4.id, type: 'log', title: '监控告警日志', url: '/evidences/WO2024A004/alert-log.txt'
    })
  ])

  console.log('✅ 订单4 (重复报修) 创建完成')

  console.log('\n🎉 种子数据插入完成！共创建 4 条样本工单')
  console.log('  1. WO2024A001 - 远程恢复 (已归档)')
  console.log('  2. WO2024A002 - 现场维修 (待结算)')
  console.log('  3. WO2024A003 - 费用争议 (争议中)')
  console.log('  4. WO2024A004 - 重复报修 (已分配)')

  await AppDataSource.destroy()
}

seed().catch(err => {
  console.error('种子数据执行失败:', err)
  process.exit(1)
})
