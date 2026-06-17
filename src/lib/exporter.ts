import * as XLSX from "xlsx";
import type { AnyEntity, EntityType, DatabaseState } from "~/types";

const typeLabels: Record<EntityType, string> = {
  channel: "通道",
  entrance: "出入口",
  sign: "指示牌",
  equipment: "设备点位",
  map: "导览地图",
  inspection: "巡检任务"
};

const statusLabels: Record<string, string> = {
  normal: "正常",
  warning: "警告",
  fault: "故障",
  maintenance: "维护中",
  offline: "离线",
  pending: "待处理",
  in_progress: "进行中",
  completed: "已完成",
  failed: "未通过"
};

export interface ExportFilter {
  entityTypes?: EntityType[];
  statuses?: string[];
  dateRange?: { start: string; end: string };
  search?: string;
}

export function exportToExcel(state: DatabaseState, filters: ExportFilter = {}) {
  const wb = XLSX.utils.book_new();
  const exportResults: { type: EntityType; count: number; data: AnyEntity[] }[] = [];

  const allTypes: EntityType[] = ["channel", "entrance", "sign", "equipment", "map", "inspection"];
  const typesToExport = filters.entityTypes || allTypes;

  typesToExport.forEach(type => {
    let data: AnyEntity[] = [];

    switch (type) {
      case "channel": data = state.channels as AnyEntity[]; break;
      case "entrance": data = state.entrances as AnyEntity[]; break;
      case "sign": data = state.signs as AnyEntity[]; break;
      case "equipment": data = state.equipment as AnyEntity[]; break;
      case "map": data = state.maps as AnyEntity[]; break;
      case "inspection": data = state.inspections as AnyEntity[]; break;
    }

    if (filters.statuses) {
      data = data.filter(e => filters.statuses!.includes(e.status));
    }

    if (filters.dateRange) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      data = data.filter(e => {
        const d = new Date(e.createdAt);
        return d >= start && d <= end;
      });
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.remarks.toLowerCase().includes(q)
      );
    }

    if (data.length > 0) {
      const flatData = data.map(e => flattenEntity(e));
      const ws = XLSX.utils.json_to_sheet(flatData);
      XLSX.utils.book_append_sheet(wb, ws, typeLabels[type]);
      exportResults.push({ type, count: data.length, data });
    }
  });

  const summarySheet = createSummarySheet(state, exportResults, filters);
  XLSX.utils.book_append_sheet(wb, summarySheet, "导出摘要");

  const anomaliesSheet = createAnomaliesSheet(state);
  XLSX.utils.book_append_sheet(wb, anomaliesSheet, "异常记录");

  const fileName = `人防空间数据导出_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}.xlsx`;
  XLSX.writeFile(wb, fileName);

  return { fileName, exportResults, totalRecords: exportResults.reduce((sum, r) => sum + r.count, 0) };
}

function flattenEntity(entity: AnyEntity): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const basicFields = ["id", "code", "name", "status", "createdAt", "updatedAt", "createdBy", "version", "remarks"];
  basicFields.forEach(f => {
    const key = fieldLabels[f] || f;
    result[key] = f === "status" ? statusLabels[entity[f] as string] || entity[f] : entity[f as keyof AnyEntity];
  });

  if (entity.type === "channel") {
    result["起点"] = entity.startPoint;
    result["终点"] = entity.endPoint;
    result["长度(m)"] = entity.length;
    result["宽度(m)"] = entity.width;
    result["高度(m)"] = entity.height;
    result["材质"] = entity.material;
    result["耐火等级"] = entity.fireResistance;
    result["最大容纳人数"] = entity.maxOccupancy;
    result["当前状态"] = entity.currentStatus;
  } else if (entity.type === "entrance") {
    result["位置"] = entity.location;
    result["地址"] = entity.address;
    result["出入口类型"] = entity.entranceType;
    result["宽度(m)"] = entity.width;
    result["高度(m)"] = entity.height;
    result["楼层"] = entity.floor;
    result["地下深度(m)"] = entity.groundLevel;
    result["有电梯"] = entity.hasElevator ? "是" : "否";
    result["有无障碍坡道"] = entity.hasRamp ? "是" : "否";
    result["应急电话"] = entity.emergencyPhone;
  } else if (entity.type === "sign") {
    result["标识类型"] = entity.signType;
    result["位置"] = entity.location;
    result["内容"] = entity.content;
    result["箭头方向"] = entity.arrowDirection;
    result["照明类型"] = entity.illuminationType;
    result["安装日期"] = entity.installationDate;
    result["上次巡检"] = entity.lastInspectionDate;
    result["下次巡检"] = entity.nextInspectionDate;
  } else if (entity.type === "equipment") {
    result["设备类型"] = entity.equipmentType;
    result["位置"] = entity.location;
    result["型号"] = entity.model;
    result["厂商"] = entity.manufacturer;
    result["安装日期"] = entity.installationDate;
    result["上次维护"] = entity.lastMaintenanceDate;
    result["下次维护"] = entity.nextMaintenanceDate;
    result["维护周期"] = entity.maintenanceCycle;
    result["规格参数"] = JSON.stringify(entity.specification);
  } else if (entity.type === "map") {
    result["地图版本"] = entity.mapVersion;
    result["比例尺"] = entity.scale;
    result["格式"] = entity.format;
    result["区域数量"] = entity.zones.length;
    result["路径数量"] = entity.paths.length;
    result["POI数量"] = entity.pois.length;
  } else if (entity.type === "inspection") {
    result["巡检类型"] = entity.inspectionType;
    result["计划日期"] = entity.plannedDate;
    result["实际日期"] = entity.actualDate;
    result["巡检员"] = entity.inspector;
    result["检查项数"] = entity.items.length;
    result["通过项数"] = entity.items.filter(i => i.result === "pass").length;
    result["异常项数"] = entity.anomalies.length;
    result["巡检结果"] = statusLabels[entity.result || "pending"];
  }

  return result;
}

const fieldLabels: Record<string, string> = {
  id: "ID",
  code: "编码",
  name: "名称",
  status: "状态",
  createdAt: "创建时间",
  updatedAt: "更新时间",
  createdBy: "创建人",
  version: "版本号",
  remarks: "备注"
};

function createSummarySheet(state: DatabaseState, results: { type: EntityType; count: number }[], filters: ExportFilter) {
  const allEntities = [...state.channels, ...state.entrances, ...state.signs, ...state.equipment, ...state.maps, ...state.inspections];
  const byType: Record<string, number> = {
    channel: state.channels.length,
    entrance: state.entrances.length,
    sign: state.signs.length,
    equipment: state.equipment.length,
    map: state.maps.length,
    inspection: state.inspections.length
  };
  const byStatus = allEntities.reduce((acc, e) => {
    acc[statusLabels[e.status] || e.status] = (acc[statusLabels[e.status] || e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryData = [
    { "项目": "导出时间", "值": new Date().toLocaleString("zh-CN") },
    { "项目": "导出人", "值": "系统管理员" },
    { "项目": "筛选条件", "值": JSON.stringify(filters) },
    { "项目": "", "值": "" },
    { "项目": "导出概览", "值": "" },
    { "项目": "总实体数量", "值": allEntities.length },
    { "项目": "本次导出记录数", "值": results.reduce((sum, r) => sum + r.count, 0) },
    { "项目": "未解决异常数", "值": state.anomalies.filter(a => !a.resolved).length },
    { "项目": "维护逾期设备", "值": state.equipment.filter(e => new Date(e.nextMaintenanceDate) < new Date()).length },
    { "项目": "", "值": "" },
    { "项目": "按类型统计", "值": "" },
    ...Object.entries(byType).map(([k, v]) => ({ "项目": typeLabels[k as EntityType] || k, "值": v })),
    { "项目": "", "值": "" },
    { "项目": "按状态统计", "值": "" },
    ...Object.entries(byStatus).map(([k, v]) => ({ "项目": k, "值": v })),
    { "项目": "", "值": "" },
    { "项目": "导出明细", "值": "" },
    ...results.map(r => ({ "项目": typeLabels[r.type], "值": r.count }))
  ];

  return XLSX.utils.json_to_sheet(summaryData);
}

function createAnomaliesSheet(state: DatabaseState) {
  const severityLabels: Record<string, string> = { low: "低", medium: "中", high: "高", critical: "严重" };
  const typeLabels: Record<string, string> = {
    status: "状态异常",
    maintenance_overdue: "维护逾期",
    inspection_overdue: "巡检异常",
    data_inconsistency: "数据不一致",
    equipment_fault: "设备故障"
  };

  const data = state.anomalies.map(a => ({
    "ID": a.id,
    "关联实体": a.entityName,
    "实体类型": typeLabels[a.entityType] || a.entityType,
    "异常类型": typeLabels[a.anomalyType] || a.anomalyType,
    "严重程度": severityLabels[a.severity] || a.severity,
    "描述": a.description,
    "检测时间": new Date(a.detectedAt).toLocaleString("zh-CN"),
    "状态": a.resolved ? "已解决" : "未解决",
    "解决时间": a.resolvedAt ? new Date(a.resolvedAt).toLocaleString("zh-CN") : "-",
    "解决人": a.resolvedBy || "-"
  }));

  return XLSX.utils.json_to_sheet(data);
}

export function generateExportSummaryHtml(summary: {
  totalEntities: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  anomalies: number;
  maintenanceDue: number;
}): string {
  return `
    <div class="export-summary">
      <h3>导出摘要</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${summary.totalEntities}</div>
          <div class="stat-label">总实体数</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-value">${summary.anomalies}</div>
          <div class="stat-label">待处理异常</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-value">${summary.maintenanceDue}</div>
          <div class="stat-label">维护逾期</div>
        </div>
      </div>
    </div>
  `;
}
