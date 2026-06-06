import {
  mockStations,
  mockDevices,
  mockUsers,
  mockSpareParts,
  mockDefects,
  mockDefectHistories,
  type Defect,
  type DefectHistory,
  type PowerStation,
  type Device,
  type User,
  type SparePart,
  type DefectStatus,
  type HistoryAction,
} from "./mock-data";
import { generateDefectNo, calculateDuration } from "./utils";

class DataService {
  private stations: PowerStation[] = [...mockStations];
  private devices: Device[] = [...mockDevices];
  private users: User[] = [...mockUsers];
  private spareParts: SparePart[] = [...mockSpareParts];
  private defects: Defect[] = [...mockDefects];
  private defectHistories: DefectHistory[] = [...mockDefectHistories];
  private nextDefectId = mockDefects.length + 1;
  private nextHistoryId = mockDefectHistories.length + 1;

  getStations(): PowerStation[] {
    return this.stations;
  }

  getStationById(id: number): PowerStation | undefined {
    return this.stations.find((s) => s.id === id);
  }

  getDevices(): Device[] {
    return this.devices;
  }

  getDeviceById(id: number): Device | undefined {
    return this.devices.find((d) => d.id === id);
  }

  getDevicesByStation(stationId: number): Device[] {
    return this.devices.filter((d) => d.stationId === stationId);
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: number): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUsersByRole(role: string): User[] {
    return this.users.filter((u) => u.role === role);
  }

  getSpareParts(): SparePart[] {
    return this.spareParts;
  }

  getSparePartById(id: number): SparePart | undefined {
    return this.spareParts.find((s) => s.id === id);
  }

  getDefects(params?: {
    status?: DefectStatus;
    stationId?: number;
    deviceType?: string;
    defectLevel?: string;
    assigneeId?: number;
    inspectorId?: number;
  }): Defect[] {
    let result = [...this.defects];
    if (params?.status) {
      result = result.filter((d) => d.status === params.status);
    }
    if (params?.stationId) {
      result = result.filter((d) => d.stationId === params.stationId);
    }
    if (params?.deviceType) {
      result = result.filter((d) => d.deviceType === params.deviceType);
    }
    if (params?.defectLevel) {
      result = result.filter((d) => d.defectLevel === params.defectLevel);
    }
    if (params?.assigneeId) {
      result = result.filter((d) => d.assigneeId === params.assigneeId);
    }
    if (params?.inspectorId) {
      result = result.filter((d) => d.inspectorId === params.inspectorId);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getDefectById(id: number): Defect | undefined {
    return this.defects.find((d) => d.id === id);
  }

  getDefectHistories(defectId: number): DefectHistory[] {
    return this.defectHistories
      .filter((h) => h.defectId === defectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  createDefect(data: {
    stationId: number;
    deviceId: number;
    title: string;
    description: string;
    defectLevel: string;
    deviceType: string;
    affectedPower?: string;
    location?: string;
    array?: string;
    inspectorId?: number;
    photoUrls?: string[];
  }): Defect {
    const now = new Date().toISOString();
    const inspector = data.inspectorId ? this.getUserById(data.inspectorId) : undefined;
    const newDefect: Defect = {
      id: this.nextDefectId++,
      defectNo: generateDefectNo(),
      stationId: data.stationId,
      deviceId: data.deviceId,
      title: data.title,
      description: data.description,
      defectLevel: data.defectLevel as any,
      deviceType: data.deviceType as any,
      status: "registered",
      affectedPower: data.affectedPower,
      photoUrls: data.photoUrls || [],
      location: data.location,
      array: data.array,
      isFalsePositive: false,
      inspectorId: data.inspectorId,
      registeredAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.defects.push(newDefect);

    this.addHistory({
      defectId: newDefect.id,
      action: "register",
      userId: data.inspectorId,
      userName: inspector?.name,
      description: "登记缺陷",
      statusAfter: "registered",
    });

    return newDefect;
  }

  assignDefect(defectId: number, assigneeId: number, assigneeName?: string): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const assignee = this.getUserById(assigneeId);
    const now = new Date().toISOString();

    defect.assigneeId = assigneeId;
    defect.status = "assigned";
    defect.assignedAt = now;
    defect.updatedAt = now;

    this.addHistory({
      defectId,
      action: "assign",
      userId: assigneeId,
      userName: assignee?.name || assigneeName,
      description: "分派任务",
      statusBefore: "registered",
      statusAfter: "assigned",
    });

    return defect;
  }

  startProcessing(defectId: number, userId: number): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const user = this.getUserById(userId);
    const now = new Date().toISOString();

    defect.status = "processing";
    defect.processingStartedAt = now;
    defect.updatedAt = now;

    this.addHistory({
      defectId,
      action: "start_processing",
      userId,
      userName: user?.name,
      description: "开始现场处理",
      statusBefore: defect.status as any,
      statusAfter: "processing",
    });

    return defect;
  }

  submitProcessingResult(defectId: number, data: {
    result: string;
    photos?: string[];
    partsNeeded?: { partId: number; partName: string; quantity: number }[];
    userId: number;
  }): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const user = this.getUserById(data.userId);
    const now = new Date().toISOString();

    defect.processingResult = data.result;
    defect.processingPhotos = data.photos || [];
    defect.partsNeeded = data.partsNeeded;
    defect.processingFinishedAt = now;
    defect.updatedAt = now;

    const hasOutOfStockParts = data.partsNeeded?.some((p) => {
      const part = this.getSparePartById(p.partId);
      return !part || part.status === "out_of_stock" || part.quantity < p.quantity;
    });

    if (hasOutOfStockParts) {
      defect.status = "awaiting_parts";
      this.addHistory({
        defectId,
        action: "request_parts",
        userId: data.userId,
        userName: user?.name,
        description: "提交处理结果，需等待备件",
        statusBefore: "processing",
        statusAfter: "awaiting_parts",
      });
    } else {
      defect.status = "pending_review";
      this.addHistory({
        defectId,
        action: "submit_result",
        userId: data.userId,
        userName: user?.name,
        description: "提交处理结果，申请验收",
        statusBefore: "processing",
        statusAfter: "pending_review",
      });
    }

    return defect;
  }

  partsArrived(defectId: number, userId: number): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const user = this.getUserById(userId);
    const now = new Date().toISOString();

    defect.status = "processing";
    defect.updatedAt = now;

    this.addHistory({
      defectId,
      action: "parts_arrived",
      userId,
      userName: user?.name,
      description: "备件已到货，继续处理",
      statusBefore: "awaiting_parts",
      statusAfter: "processing",
    });

    return defect;
  }

  acceptDefect(defectId: number, reviewerId: number, comment?: string): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const hasOutOfStockParts = defect.partsNeeded?.some((p) => {
      const part = this.getSparePartById(p.partId);
      return !part || part.status === "out_of_stock" || part.quantity < p.quantity;
    });

    if (hasOutOfStockParts) {
      throw new Error("备件缺货时不能验收，请先等待备件到货");
    }

    const reviewer = this.getUserById(reviewerId);
    const now = new Date().toISOString();

    defect.status = "accepted";
    defect.reviewerId = reviewerId;
    defect.reviewComment = comment;
    defect.reviewedAt = now;
    defect.closedAt = now;
    defect.resolutionDuration = calculateDuration(defect.registeredAt, now);
    defect.updatedAt = now;

    this.addHistory({
      defectId,
      action: "accept",
      userId: reviewerId,
      userName: reviewer?.name,
      description: comment || "验收通过",
      statusBefore: "pending_review",
      statusAfter: "accepted",
    });

    return defect;
  }

  rejectDefect(defectId: number, reviewerId: number, comment: string): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const reviewer = this.getUserById(reviewerId);
    const now = new Date().toISOString();

    defect.status = "rejected";
    defect.reviewerId = reviewerId;
    defect.reviewComment = comment;
    defect.reviewedAt = now;
    defect.updatedAt = now;

    this.addHistory({
      defectId,
      action: "reject",
      userId: reviewerId,
      userName: reviewer?.name,
      description: comment || "退回重处理",
      statusBefore: "pending_review",
      statusAfter: "rejected",
    });

    return defect;
  }

  markFalsePositive(defectId: number, reviewerId: number, comment?: string): Defect | undefined {
    const defect = this.getDefectById(defectId);
    if (!defect) return undefined;

    const reviewer = this.getUserById(reviewerId);
    const now = new Date().toISOString();

    defect.status = "false_positive";
    defect.isFalsePositive = true;
    defect.reviewerId = reviewerId;
    defect.reviewComment = comment;
    defect.reviewedAt = now;
    defect.closedAt = now;
    defect.resolutionDuration = calculateDuration(defect.registeredAt, now);
    defect.updatedAt = now;

    this.addHistory({
      defectId,
      action: "mark_false_positive",
      userId: reviewerId,
      userName: reviewer?.name,
      description: comment || "标记为误报",
      statusBefore: defect.status as any,
      statusAfter: "false_positive",
    });

    return defect;
  }

  private addHistory(data: {
    defectId: number;
    action: HistoryAction;
    userId?: number;
    userName?: string;
    description?: string;
    statusBefore?: DefectStatus;
    statusAfter?: DefectStatus;
  }): DefectHistory {
    const history: DefectHistory = {
      id: this.nextHistoryId++,
      defectId: data.defectId,
      action: data.action,
      userId: data.userId,
      userName: data.userName,
      description: data.description,
      statusBefore: data.statusBefore,
      statusAfter: data.statusAfter,
      createdAt: new Date().toISOString(),
    };
    this.defectHistories.push(history);
    return history;
  }

  getStatistics() {
    const total = this.defects.length;
    const byStatus: Record<string, number> = {};
    const byStation: Record<string, { name: string; count: number; affectedPower: number }> = {};
    const byDeviceType: Record<string, { label: string; count: number }> = {};
    const byLevel: Record<string, { label: string; count: number }> = {};
    let avgDuration = 0;
    let closedCount = 0;

    for (const d of this.defects) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;

      const station = this.getStationById(d.stationId);
      if (station) {
        if (!byStation[d.stationId]) {
          byStation[d.stationId] = { name: station.name, count: 0, affectedPower: 0 };
        }
        byStation[d.stationId].count++;
        byStation[d.stationId].affectedPower += parseFloat(d.affectedPower || "0");
      }

      const deviceTypeLabels: Record<string, string> = {
        pv_module: "光伏组件",
        inverter: "逆变器",
        combiner_box: "汇流箱",
        tracker: "跟踪支架",
        transformer: "变压器",
        cable: "电缆/连接器",
      };
      if (!byDeviceType[d.deviceType]) {
        byDeviceType[d.deviceType] = { label: deviceTypeLabels[d.deviceType] || d.deviceType, count: 0 };
      }
      byDeviceType[d.deviceType].count++;

      const levelLabels: Record<string, string> = {
        critical: "紧急",
        major: "重要",
        minor: "一般",
        general: "轻微",
      };
      if (!byLevel[d.defectLevel]) {
        byLevel[d.defectLevel] = { label: levelLabels[d.defectLevel] || d.defectLevel, count: 0 };
      }
      byLevel[d.defectLevel].count++;

      if (d.resolutionDuration) {
        avgDuration += d.resolutionDuration;
        closedCount++;
      }
    }

    if (closedCount > 0) {
      avgDuration = Math.floor(avgDuration / closedCount);
    }

    return {
      total,
      byStatus,
      byStation: Object.values(byStation),
      byDeviceType: Object.values(byDeviceType),
      byLevel: Object.values(byLevel),
      avgDuration,
      closedCount,
    };
  }
}

export const dataService = new DataService();
