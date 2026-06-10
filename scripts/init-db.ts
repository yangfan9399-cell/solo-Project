import prisma from '../src/lib/prisma'

async function main() {
  console.log('Initializing database...')

  await prisma.pipeSection.deleteMany()
  await prisma.repairTeam.deleteMany()
  await prisma.workOrder.deleteMany()

  const ps1 = await prisma.pipeSection.create({
    data: { name: '管段A-001', area: '东城片区', diameter: 'DN300', material: '铸铁', installationYear: 2005 },
  })
  const ps2 = await prisma.pipeSection.create({
    data: { name: '管段B-002', area: '西城片区', diameter: 'DN200', material: 'PE', installationYear: 2018 },
  })
  const ps3 = await prisma.pipeSection.create({
    data: { name: '管段C-003', area: '南城片区', diameter: 'DN400', material: '钢管', installationYear: 1998 },
  })
  const ps4 = await prisma.pipeSection.create({
    data: { name: '管段D-004', area: '北城片区', diameter: 'DN150', material: 'PE', installationYear: 2020 },
  })
  const ps5 = await prisma.pipeSection.create({
    data: { name: '管段E-005', area: '中心片区', diameter: 'DN500', material: '钢管', installationYear: 2010 },
  })

  const rt1 = await prisma.repairTeam.create({
    data: { name: '抢修一队', leaderName: '张师傅', leaderPhone: '13800138001' },
  })
  const rt2 = await prisma.repairTeam.create({
    data: { name: '抢修二队', leaderName: '李师傅', leaderPhone: '13800138002' },
  })
  const rt3 = await prisma.repairTeam.create({
    data: { name: '抢修三队', leaderName: '王师傅', leaderPhone: '13800138003' },
  })

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  await prisma.workOrder.create({
    data: {
      serialNumber: 'LS2606080001',
      status: 'COMPLETED',
      reporterName: '刘先生',
      reporterPhone: '13900139001',
      pipeSectionId: ps1.id,
      leakLevel: 'MEDIUM',
      waterStopArea: '东城小区1-3号楼',
      description: '用户反映楼下水管漏水，地面有积水',
      createdAt: twoDaysAgo,
      dispatchTo: rt1.id,
      repairResult: 'FIXED',
      repairPhotos: ['photo1.jpg', 'photo2.jpg'],
      reviewResult: 'APPROVED',
      mergedFrom: [],
      history: {
        create: [
          { action: 'REPORTED', operator: '客服小王', createdAt: twoDaysAgo },
          { action: 'DISPATCHED', operator: '调度员老李', comment: '派往抢修一队', createdAt: new Date(twoDaysAgo.getTime() + 1 * 60 * 60 * 1000) },
          { action: 'REPAIRED', operator: '张师傅', comment: '已修复漏水点', createdAt: new Date(twoDaysAgo.getTime() + 4 * 60 * 60 * 1000) },
          { action: 'REVIEWED', operator: '复核员陈工', comment: '确认恢复供水', createdAt: new Date(twoDaysAgo.getTime() + 6 * 60 * 60 * 1000) },
        ],
      },
    },
  })

  await prisma.workOrder.create({
    data: {
      serialNumber: 'LS2606090002',
      status: 'REVIEWING',
      reporterName: '王女士',
      reporterPhone: '13900139002',
      pipeSectionId: ps2.id,
      leakLevel: 'HIGH',
      waterStopArea: '西城商业街A区',
      description: '商铺反映水压明显下降，怀疑管道破损',
      createdAt: yesterday,
      dispatchTo: rt2.id,
      repairResult: 'FIXED',
      repairPhotos: ['photo3.jpg'],
      mergedFrom: [],
      history: {
        create: [
          { action: 'REPORTED', operator: '客服小张', createdAt: yesterday },
          { action: 'DISPATCHED', operator: '调度员老李', comment: '派往抢修二队', createdAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000) },
          { action: 'REPAIRED', operator: '李师傅', comment: '更换DN200管道一节', createdAt: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000) },
        ],
      },
    },
  })

  await prisma.workOrder.create({
    data: {
      serialNumber: 'LS2606090003',
      status: 'DISPATCHED',
      reporterName: '赵先生',
      reporterPhone: '13900139003',
      pipeSectionId: ps3.id,
      leakLevel: 'CRITICAL',
      waterStopArea: '南城医院周边',
      description: '医院反馈大面积停水，紧急抢修',
      createdAt: yesterday,
      dispatchTo: rt1.id,
      mergedFrom: ['LS2606090004', 'LS2606090005'],
      repairPhotos: [],
      history: {
        create: [
          { action: 'REPORTED', operator: '客服紧急热线', createdAt: yesterday },
          { action: 'DISPATCHED', operator: '调度员老李', comment: '紧急派往抢修一队', createdAt: new Date(yesterday.getTime() + 30 * 60 * 1000) },
          { action: 'MERGED', operator: '客服小王', comment: '合并工单 LS2606090004, LS2606090005', createdAt: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000) },
        ],
      },
    },
  })

  await prisma.workOrder.create({
    data: {
      serialNumber: 'LS2606100006',
      status: 'REPAIRED',
      reporterName: '孙女士',
      reporterPhone: '13900139004',
      pipeSectionId: ps2.id,
      leakLevel: 'LOW',
      description: '家中水龙头出水变小，怀疑楼内管道问题',
      createdAt: now,
      dispatchTo: rt2.id,
      repairResult: 'VALVE_LOCATION_FAILED',
      repairPhotos: [],
      mergedFrom: [],
      history: {
        create: [
          { action: 'REPORTED', operator: '客服小李', createdAt: now },
          { action: 'DISPATCHED', operator: '调度员老王', comment: '派往抢修二队', createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) },
          { action: 'REPAIRED', operator: '李师傅', comment: '阀门定位失败，需要进一步排查', createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
        ],
      },
    },
  })

  await prisma.workOrder.create({
    data: {
      serialNumber: 'LS2606100007',
      status: 'REJECTED',
      reporterName: '周先生',
      reporterPhone: '13900139005',
      pipeSectionId: ps1.id,
      leakLevel: 'MEDIUM',
      description: '重复报修同一漏点',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      repairResult: 'SUSPECTED_DUPLICATE',
      mergedFrom: [],
      repairPhotos: [],
      history: {
        create: [
          { action: 'REPORTED', operator: '客服小王', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
          { action: 'REJECTED', operator: '调度员老李', comment: '疑似重复报修，已合并到工单 LS2606080001', createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
        ],
      },
    },
  })

  await prisma.workOrder.create({
    data: {
      serialNumber: 'LS2606100008',
      status: 'PENDING',
      reporterName: '吴先生',
      reporterPhone: '13900139006',
      pipeSectionId: ps4.id,
      leakLevel: 'MEDIUM',
      waterStopArea: '北城新区5-8号楼',
      description: '夜间发现楼道有水渗出',
      createdAt: now,
      mergedFrom: [],
      repairPhotos: [],
      history: {
        create: [
          { action: 'REPORTED', operator: '客服小张', createdAt: now },
        ],
      },
    },
  })

  console.log('Database initialized successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })