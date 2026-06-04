import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between, Like, FindOptionsWhere, IsNull } from 'typeorm'
import { WorkOrder, WorkOrderStatus, FaultType } from '../entities/work-order.entity.js'
import { PartsFee } from '../entities/parts-fee.entity.js'
import { LaborFee } from '../entities/labor-fee.entity.js'
import { ProcessNode } from '../entities/process-node.entity.js'
import {
  CreateWorkOrderDto,
  AssignWorkOrderDto,
  RepairWorkOrderDto,
  DisputeDto,
  AdjustFeeDto
} from '../dto/work-order.dto.js'

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly orderRepo: Repository<WorkOrder>,
    @InjectRepository(PartsFee)
    private readonly partsFeeRepo: Repository<PartsFee>,
    @InjectRepository(LaborFee)
    private readonly laborFeeRepo: Repository<LaborFee>,
    @InjectRepository(ProcessNode)
    private readonly processNodeRepo: Repository<ProcessNode>
  ) {}

  async findAll(query: {
    status?: string
    faultType?: string
    stationId?: string
    keyword?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) {
    const qb = this.orderRepo.createQueryBuilder('o')

    if (query.status) {
      qb.andWhere('o.status = :status', { status: query.status })
    }
    if (query.faultType) {
      qb.andWhere('o.fault_type = :faultType', { faultType: query.faultType })
    }
    if (query.stationId) {
      qb.andWhere('o.station_id = :stationId', { stationId: query.stationId })
    }
    if (query.keyword) {
      qb.andWhere('(o.order_no LIKE :kw OR o.device_no LIKE :kw OR o.station_name LIKE :kw)', {
        kw: `%${query.keyword}%`
      })
    }
    if (query.startDate && query.endDate) {
      qb.andWhere('o.created_at BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate
      })
    }

    qb.orderBy('o.created_at', 'DESC')

    const page = query.page || 1
    const pageSize = query.pageSize || 20
    qb.skip((page - 1) * pageSize).take(pageSize)

    const [items, total] = await qb.getManyAndCount()
    return { items, total, page, pageSize }
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['partsFees', 'laborFees', 'processNodes', 'evidences']
    })
    if (!order) throw new NotFoundException(`工单 ${id} 不存在`)
    return order
  }

  async create(dto: CreateWorkOrderDto) {
    const orderNo = `WO${Date.now().toString(36).toUpperCase()}`

    const order = this.orderRepo.create({
      orderNo,
      faultSource: dto.faultSource,
      faultType: dto.faultType,
      deviceId: dto.deviceId,
      deviceNo: dto.deviceNo,
      stationId: dto.stationId,
      stationName: dto.stationName,
      isRepeat: dto.isRepeat || false,
      repeatCount: dto.repeatCount || 0,
      createdBy: dto.createdBy,
      status: WorkOrderStatus.PENDING
    })
    const saved = await this.orderRepo.save(order)

    await this.processNodeRepo.save({
      orderId: saved.id,
      action: '创建工单',
      operator: dto.createdBy,
      operatorRole: 'system',
      note: `故障来源: ${dto.faultSource}, 故障类型: ${dto.faultType}`
    })

    return saved
  }

  async assign(id: string, dto: AssignWorkOrderDto) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.PENDING) {
      throw new BadRequestException('只有待处理工单可以分配')
    }

    await this.orderRepo.update(id, {
      status: WorkOrderStatus.ASSIGNED,
      assigneeId: dto.assigneeId,
      assigneeName: dto.assigneeName
    })

    await this.processNodeRepo.save({
      orderId: id,
      action: '分配工单',
      operator: dto.assigneeName,
      operatorRole: 'dispatcher',
      note: `分配给: ${dto.assigneeName}`
    })

    return this.findOne(id)
  }

  async repair(id: string, dto: RepairWorkOrderDto) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.ASSIGNED) {
      throw new BadRequestException('只有已分配工单可以开始维修')
    }

    await this.orderRepo.update(id, {
      status: WorkOrderStatus.REPAIRING,
      repairType: dto.repairType,
      repairNote: dto.repairNote,
      repairDuration: dto.repairDuration
    })

    await this.processNodeRepo.save({
      orderId: id,
      action: '开始维修',
      operator: dto.operator,
      operatorRole: 'technician',
      note: `维修方式: ${dto.repairType}, 维修时长: ${dto.repairDuration}分钟`
    })

    return this.findOne(id)
  }

  async submitSettlement(id: string, operator: string) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.REPAIRING) {
      throw new BadRequestException('只有维修中工单可以提交结算')
    }

    await this.orderRepo.update(id, { status: WorkOrderStatus.PENDING_SETTLEMENT })

    await this.processNodeRepo.save({
      orderId: id,
      action: '提交结算',
      operator,
      operatorRole: 'technician',
      note: '维修完成，提交费用结算'
    })

    return this.findOne(id)
  }

  async confirm(id: string, operator: string) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.PENDING_SETTLEMENT && order.status !== WorkOrderStatus.DISPUTED) {
      throw new BadRequestException('只有待结算或争议中工单可以确认归档')
    }

    const disputedFees = await this.partsFeeRepo.find({
      where: { orderId: id, isDisputed: true, adjustedPrice: IsNull() }
    })
    if (disputedFees.length > 0) {
      throw new BadRequestException('存在未处理的争议配件费用，无法归档')
    }

    await this.orderRepo.update(id, { status: WorkOrderStatus.ARCHIVED })

    await this.processNodeRepo.save({
      orderId: id,
      action: '确认归档',
      operator,
      operatorRole: 'finance',
      note: '费用确认无误，工单归档'
    })

    return this.findOne(id)
  }

  async dispute(id: string, dto: DisputeDto) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.PENDING_SETTLEMENT) {
      throw new BadRequestException('只有待结算工单可以发起争议')
    }

    const disputedFeeIds = dto.disputedParts.map(p => p.feeId)
    const fees = await this.partsFeeRepo.find({ where: { orderId: id } })
    const feeMap = new Map(fees.map(f => [f.id, f]))

    for (const item of dto.disputedParts) {
      const fee = feeMap.get(item.feeId)
      if (!fee) {
        throw new NotFoundException(`配件费用 ${item.feeId} 不存在`)
      }
      fee.isDisputed = true
      fee.disputeReason = item.disputeReason
      await this.partsFeeRepo.save(fee)
    }

    await this.orderRepo.update(id, { status: WorkOrderStatus.DISPUTED })

    const partNames = dto.disputedParts
      .map(p => {
        const fee = feeMap.get(p.feeId)
        return fee ? `${fee.partName}: ${p.disputeReason}` : p.feeId
      })
      .join('; ')

    await this.processNodeRepo.save({
      orderId: id,
      action: '发起争议',
      operator: dto.operator,
      operatorRole: 'finance',
      note: `争议配件: ${partNames}`
    })

    return this.findOne(id)
  }

  async adjustFee(id: string, dto: AdjustFeeDto) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.DISPUTED) {
      throw new BadRequestException('只有争议中工单可以调整费用')
    }

    const fee = await this.partsFeeRepo.findOne({ where: { id: dto.feeId, orderId: id } })
    if (!fee) throw new NotFoundException('配件费用记录不存在')

    fee.adjustedPrice = dto.adjustedPrice
    fee.adjustmentReason = dto.adjustmentReason
    await this.partsFeeRepo.save(fee)

    await this.processNodeRepo.save({
      orderId: id,
      action: '调整费用',
      operator: dto.operator,
      operatorRole: 'finance',
      note: `配件: ${fee.partName}, 调整价: ${dto.adjustedPrice}, 原因: ${dto.adjustmentReason}`
    })

    const unresolvedFees = await this.partsFeeRepo.find({
      where: { orderId: id, isDisputed: true, adjustedPrice: IsNull() }
    })
    if (unresolvedFees.length === 0) {
      await this.orderRepo.update(id, { status: WorkOrderStatus.PENDING_SETTLEMENT })

      await this.processNodeRepo.save({
        orderId: id,
        action: '争议解决，返回待结算',
        operator: dto.operator,
        operatorRole: 'finance',
        note: '所有争议费用已调整'
      })
    }

    return fee
  }

  async returnOrder(id: string, operator: string) {
    const order = await this.findOne(id)
    if (order.status !== WorkOrderStatus.DISPUTED) {
      throw new BadRequestException('只有争议中工单可以退回')
    }

    await this.orderRepo.update(id, { status: WorkOrderStatus.PENDING_SETTLEMENT })

    await this.processNodeRepo.save({
      orderId: id,
      action: '退回待结算',
      operator,
      operatorRole: 'finance',
      note: '争议处理完成，退回待结算'
    })

    return this.findOne(id)
  }

  async getStats() {
    const byFaultType = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.fault_type', 'faultType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.fault_type')
      .getRawMany()

    const byStation = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.station_id', 'stationId')
      .addSelect('o.station_name', 'stationName')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.station_id, o.station_name')
      .getRawMany()

    const byStatus = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany()

    const avgRepairDuration = await this.orderRepo
      .createQueryBuilder('o')
      .select('AVG(o.repair_duration)', 'avgDuration')
      .where('o.repair_duration IS NOT NULL')
      .getRawOne()

    const repeatStats = await this.orderRepo
      .createQueryBuilder('o')
      .select('COUNT(*)', 'repeatCount')
      .where('o.is_repeat = true')
      .getRawOne()

    const totalPartsFees = await this.partsFeeRepo
      .createQueryBuilder('f')
      .select('SUM(f.subtotal)', 'total')
      .getRawOne()

    const totalLaborFees = await this.laborFeeRepo
      .createQueryBuilder('f')
      .select('SUM(f.amount)', 'total')
      .getRawOne()

    return {
      byFaultType,
      byStation,
      byStatus,
      avgRepairDuration: parseFloat(avgRepairDuration?.avgDuration || '0').toFixed(1),
      repeatCount: parseInt(repeatStats?.repeatCount || '0'),
      totalPartsFees: parseFloat(totalPartsFees?.total || '0'),
      totalLaborFees: parseFloat(totalLaborFees?.total || '0')
    }
  }

  async getReviewByFaultType() {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.fault_type', 'faultType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(o.repair_duration)', 'avgDuration')
      .addSelect('SUM(CASE WHEN o.is_repeat = true THEN 1 ELSE 0 END)', 'repeatCount')
      .leftJoin('parts_fees', 'pf', 'pf.order_id = o.id')
      .addSelect('COALESCE(SUM(pf.subtotal), 0)', 'totalPartsFee')
      .leftJoin('labor_fees', 'lf', 'lf.order_id = o.id')
      .addSelect('COALESCE(SUM(lf.amount), 0)', 'totalLaborFee')
      .groupBy('o.fault_type')
      .orderBy('count', 'DESC')
      .getRawMany()

    return result.map(item => ({
      faultType: item.faultType,
      count: parseInt(item.count),
      avgDuration: parseFloat(item.avgDuration || '0').toFixed(1),
      repeatCount: parseInt(item.repeatCount),
      totalPartsFee: parseFloat(item.totalPartsFee || '0'),
      totalLaborFee: parseFloat(item.totalLaborFee || '0'),
      totalFee: parseFloat(item.totalPartsFee || '0') + parseFloat(item.totalLaborFee || '0')
    }))
  }

  async getReviewByStation() {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.station_id', 'stationId')
      .addSelect('o.station_name', 'stationName')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(o.repair_duration)', 'avgDuration')
      .addSelect('SUM(CASE WHEN o.is_repeat = true THEN 1 ELSE 0 END)', 'repeatCount')
      .leftJoin('parts_fees', 'pf', 'pf.order_id = o.id')
      .addSelect('COALESCE(SUM(pf.subtotal), 0)', 'totalPartsFee')
      .leftJoin('labor_fees', 'lf', 'lf.order_id = o.id')
      .addSelect('COALESCE(SUM(lf.amount), 0)', 'totalLaborFee')
      .groupBy('o.station_id, o.station_name')
      .orderBy('count', 'DESC')
      .getRawMany()

    return result.map(item => ({
      stationId: item.stationId,
      stationName: item.stationName,
      count: parseInt(item.count),
      avgDuration: parseFloat(item.avgDuration || '0').toFixed(1),
      repeatCount: parseInt(item.repeatCount),
      totalPartsFee: parseFloat(item.totalPartsFee || '0'),
      totalLaborFee: parseFloat(item.totalLaborFee || '0'),
      totalFee: parseFloat(item.totalPartsFee || '0') + parseFloat(item.totalLaborFee || '0')
    }))
  }

  async getReviewByRepairDuration() {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select(`
        CASE
          WHEN o.repair_duration < 30 THEN '0-30分钟'
          WHEN o.repair_duration < 60 THEN '30-60分钟'
          WHEN o.repair_duration < 120 THEN '60-120分钟'
          WHEN o.repair_duration < 240 THEN '120-240分钟'
          ELSE '240分钟以上'
        END`, 'durationRange')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(o.repair_duration)', 'avgDuration')
      .leftJoin('parts_fees', 'pf', 'pf.order_id = o.id')
      .addSelect('COALESCE(SUM(pf.subtotal), 0)', 'totalPartsFee')
      .leftJoin('labor_fees', 'lf', 'lf.order_id = o.id')
      .addSelect('COALESCE(SUM(lf.amount), 0)', 'totalLaborFee')
      .where('o.repair_duration IS NOT NULL')
      .groupBy('durationRange')
      .orderBy('MIN(o.repair_duration)', 'ASC')
      .getRawMany()

    const orderMap: Record<string, number> = {
      '0-30分钟': 0,
      '30-60分钟': 1,
      '60-120分钟': 2,
      '120-240分钟': 3,
      '240分钟以上': 4
    }

    return result
      .sort((a, b) => (orderMap[a.durationRange as string] || 0) - (orderMap[b.durationRange as string] || 0))
      .map(item => ({
        durationRange: item.durationRange,
        count: parseInt(item.count),
        avgDuration: parseFloat(item.avgDuration || '0').toFixed(1),
        totalPartsFee: parseFloat(item.totalPartsFee || '0'),
        totalLaborFee: parseFloat(item.totalLaborFee || '0'),
        totalFee: parseFloat(item.totalPartsFee || '0') + parseFloat(item.totalLaborFee || '0')
      }))
  }

  async getReviewByRepeatCount() {
    const result = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.repeat_count', 'repeatCount')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(o.repair_duration)', 'avgDuration')
      .leftJoin('parts_fees', 'pf', 'pf.order_id = o.id')
      .addSelect('COALESCE(SUM(pf.subtotal), 0)', 'totalPartsFee')
      .leftJoin('labor_fees', 'lf', 'lf.order_id = o.id')
      .addSelect('COALESCE(SUM(lf.amount), 0)', 'totalLaborFee')
      .where('o.repeat_count >= 0')
      .groupBy('o.repeat_count')
      .orderBy('o.repeat_count', 'ASC')
      .getRawMany()

    return result.map(item => ({
      repeatCount: parseInt(item.repeatCount),
      count: parseInt(item.count),
      avgDuration: parseFloat(item.avgDuration || '0').toFixed(1),
      totalPartsFee: parseFloat(item.totalPartsFee || '0'),
      totalLaborFee: parseFloat(item.totalLaborFee || '0'),
      totalFee: parseFloat(item.totalPartsFee || '0') + parseFloat(item.totalLaborFee || '0')
    }))
  }

  async getReviewSummary() {
    const totalOrders = await this.orderRepo.count()
    const archivedOrders = await this.orderRepo.count({ where: { status: WorkOrderStatus.ARCHIVED } })
    const disputedOrders = await this.orderRepo.count({ where: { status: WorkOrderStatus.DISPUTED } })

    const avgDuration = await this.orderRepo
      .createQueryBuilder('o')
      .select('AVG(o.repair_duration)', 'avg')
      .where('o.repair_duration IS NOT NULL')
      .getRawOne()

    const totalParts = await this.partsFeeRepo
      .createQueryBuilder('f')
      .select('SUM(f.subtotal)', 'total')
      .getRawOne()

    const totalLabor = await this.laborFeeRepo
      .createQueryBuilder('f')
      .select('SUM(f.amount)', 'total')
      .getRawOne()

    const repeatOrders = await this.orderRepo.count({ where: { isRepeat: true } })

    return {
      totalOrders,
      archivedOrders,
      disputedOrders,
      avgRepairDuration: parseFloat(avgDuration?.avg || '0').toFixed(1),
      totalPartsFee: parseFloat(totalParts?.total || '0'),
      totalLaborFee: parseFloat(totalLabor?.total || '0'),
      totalFee: parseFloat(totalParts?.total || '0') + parseFloat(totalLabor?.total || '0'),
      repeatOrders,
      repeatRate: totalOrders > 0 ? ((repeatOrders / totalOrders) * 100).toFixed(1) : '0'
    }
  }
}
