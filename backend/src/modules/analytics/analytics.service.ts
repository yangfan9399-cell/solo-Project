import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DispatchOrder, DispatchStatus } from '../../entities/dispatch-order.entity';
import { RepairOrder, FaultType } from '../../entities/repair-order.entity';
import { Station } from '../../entities/station.entity';
import { HistoryNode, NodeType } from '../../entities/history-node.entity';

export interface DistrictStats {
  district: string;
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  timeoutOrders: number;
  faultOrders: number;
}

export interface FaultTypeStats {
  faultType: FaultType;
  faultTypeLabel: string;
  count: number;
  percentage: number;
}

export interface ResponseTimeStats {
  range: string;
  label: string;
  count: number;
  percentage: number;
  avgMinutes: number;
}

export interface OverallStats {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  faultRate: number;
  avgResponseTime: number;
  avgRepairTime: number;
  districtStats: DistrictStats[];
  faultTypeStats: FaultTypeStats[];
  responseTimeStats: ResponseTimeStats[];
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(DispatchOrder)
    private dispatchOrderRepository: Repository<DispatchOrder>,
    @InjectRepository(RepairOrder)
    private repairOrderRepository: Repository<RepairOrder>,
    @InjectRepository(Station)
    private stationRepository: Repository<Station>,
    @InjectRepository(HistoryNode)
    private historyNodeRepository: Repository<HistoryNode>,
  ) {}

  async getOverallStats(): Promise<OverallStats> {
    const [districtStats, faultTypeStats, responseTimeStats, orders] = await Promise.all([
      this.getDistrictStats(),
      this.getFaultTypeStats(),
      this.getResponseTimeStats(),
      this.dispatchOrderRepository.find({ relations: ['station'] }),
    ]);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === DispatchStatus.COMPLETED).length;
    const inProgressOrders = orders.filter(
      (o) =>
        o.status === DispatchStatus.DISPATCHING ||
        o.status === DispatchStatus.IN_REPAIR ||
        o.status === DispatchStatus.PENDING_REVIEW,
    ).length;
    const faultOrders = orders.filter((o) => o.status === DispatchStatus.IN_REPAIR || o.status === DispatchStatus.COMPLETED && o.repairOrder).length;
    const faultRate = totalOrders > 0 ? (faultOrders / totalOrders) * 100 : 0;

    const avgResponseTime = await this.calculateAvgResponseTime();
    const avgRepairTime = await this.calculateAvgRepairTime();

    return {
      totalOrders,
      completedOrders,
      inProgressOrders,
      faultRate,
      avgResponseTime,
      avgRepairTime,
      districtStats,
      faultTypeStats,
      responseTimeStats,
    };
  }

  async getDistrictStats(): Promise<DistrictStats[]> {
    const stations = await this.stationRepository.find();
    const orders = await this.dispatchOrderRepository.find({ relations: ['station'] });

    const districtMap = new Map<string, DistrictStats>();

    for (const station of stations) {
      if (!districtMap.has(station.district)) {
        districtMap.set(station.district, {
          district: station.district,
          totalOrders: 0,
          completedOrders: 0,
          inProgressOrders: 0,
          timeoutOrders: 0,
          faultOrders: 0,
        });
      }
    }

    for (const order of orders) {
      if (!order.station) continue;
      const district = order.station.district;
      if (!districtMap.has(district)) {
        districtMap.set(district, {
          district,
          totalOrders: 0,
          completedOrders: 0,
          inProgressOrders: 0,
          timeoutOrders: 0,
          faultOrders: 0,
        });
      }

      const stats = districtMap.get(district)!;
      stats.totalOrders++;

      if (order.status === DispatchStatus.COMPLETED) {
        stats.completedOrders++;
      }
      if (
        order.status === DispatchStatus.DISPATCHING ||
        order.status === DispatchStatus.IN_REPAIR ||
        order.status === DispatchStatus.PENDING_REVIEW
      ) {
        stats.inProgressOrders++;
      }
      if (order.status === DispatchStatus.TIMEOUT) {
        stats.timeoutOrders++;
      }
      if (order.status === DispatchStatus.IN_REPAIR || order.repairOrder) {
        stats.faultOrders++;
      }
    }

    return Array.from(districtMap.values()).sort((a, b) => b.totalOrders - a.totalOrders);
  }

  async getFaultTypeStats(): Promise<FaultTypeStats[]> {
    const repairs = await this.repairOrderRepository.find();
    const total = repairs.length;

    const countMap = new Map<FaultType, number>();
    for (const repair of repairs) {
      countMap.set(repair.faultType, (countMap.get(repair.faultType) || 0) + 1);
    }

    const labels: Record<FaultType, string> = {
      [FaultType.BRAKE]: '刹车故障',
      [FaultType.TIRE]: '轮胎故障',
      [FaultType.CHAIN]: '链条故障',
      [FaultType.ELECTRIC]: '电气故障',
      [FaultType.STRUCTURE]: '结构故障',
      [FaultType.OTHER]: '其他故障',
    };

    const stats: FaultTypeStats[] = [];
    for (const [faultType, count] of countMap.entries()) {
      stats.push({
        faultType,
        faultTypeLabel: labels[faultType] || faultType,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      });
    }

    return stats.sort((a, b) => b.count - a.count);
  }

  async getResponseTimeStats(): Promise<ResponseTimeStats[]> {
    const orders = await this.dispatchOrderRepository.find({
      where: { status: DispatchStatus.COMPLETED },
      relations: ['historyNodes'],
    });

    const ranges = [
      { min: 0, max: 15, label: '0-15分钟', range: '0-15' },
      { min: 15, max: 30, label: '15-30分钟', range: '15-30' },
      { min: 30, max: 60, label: '30-60分钟', range: '30-60' },
      { min: 60, max: 9999, label: '60分钟以上', range: '60+' },
    ];

    const responseTimes: number[] = [];
    for (const order of orders) {
      const time = this.calculateResponseTime(order);
      if (time !== null) {
        responseTimes.push(time);
      }
    }

    const total = responseTimes.length;
    const result: ResponseTimeStats[] = [];

    for (const range of ranges) {
      const timesInRange = responseTimes.filter((t) => t >= range.min && t < range.max);
      const avg = timesInRange.length > 0
        ? timesInRange.reduce((sum, t) => sum + t, 0) / timesInRange.length
        : 0;

      result.push({
        range: range.range,
        label: range.label,
        count: timesInRange.length,
        percentage: total > 0 ? (timesInRange.length / total) * 100 : 0,
        avgMinutes: Math.round(avg * 10) / 10,
      });
    }

    return result;
  }

  private calculateResponseTime(order: DispatchOrder): number | null {
    if (!order.historyNodes || order.historyNodes.length === 0) return null;

    const alertNode = order.historyNodes.find((n) => n.nodeType === NodeType.ALERT || n.nodeType === NodeType.DISPATCH_ASSIGNED);
    const arriveNode = order.historyNodes.find((n) => n.nodeType === NodeType.ARRIVED);

    if (!alertNode || !arriveNode) return null;

    const diff = arriveNode.createdAt.getTime() - alertNode.createdAt.getTime();
    return Math.round(diff / 60000);
  }

  private async calculateAvgResponseTime(): Promise<number> {
    const orders = await this.dispatchOrderRepository.find({
      where: { status: DispatchStatus.COMPLETED },
      relations: ['historyNodes'],
    });

    const times: number[] = [];
    for (const order of orders) {
      const time = this.calculateResponseTime(order);
      if (time !== null) {
        times.push(time);
      }
    }

    if (times.length === 0) return 0;
    return Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
  }

  private async calculateAvgRepairTime(): Promise<number> {
    const repairs = await this.repairOrderRepository.find({
      where: { status: 'completed' as any },
    });

    const times: number[] = [];
    for (const repair of repairs) {
      if (repair.repairedAt && repair.createdAt) {
        const diff = repair.repairedAt.getTime() - repair.createdAt.getTime();
        times.push(Math.round(diff / 60000));
      }
    }

    if (times.length === 0) return 0;
    return Math.round((times.reduce((a, b) => a + b, 0) / times.length) * 10) / 10;
  }
}
