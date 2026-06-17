import { Component, createSignal, createMemo, onMount } from "solid-js";
import { A, useParams, useNavigate, useSearchParams } from "@solidjs/router";
import { getEntityById, updateEntity, getVersionHistory, useDatabase } from "~/lib/database";
import { StatusBadge, EntityTypeBadge, SeverityBadge, Modal } from "~/components/common";
import EntityForm from "~/components/EntityForm";
import type { EntityType, AnyEntity, Channel, Entrance, Sign, Equipment, OfflineMap, InspectionTask } from "~/types";
import { format, formatDistance } from "date-fns";
import { zhCN } from "date-fns/locale";

const typeLabels: Record<EntityType, string> = {
  channel: "通道",
  entrance: "出入口",
  sign: "指示牌",
  equipment: "设备点位",
  map: "导览地图",
  inspection: "巡检任务"
};

const Detail: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = createSignal("overview");
  const [showEditModal, setShowEditModal] = createSignal(searchParams.action === "edit");

  const entityType = params.type as EntityType;
  const entityId = params.id!;

  onMount(() => {
    if (searchParams.action === "edit") {
      setSearchParams({ ...searchParams, action: undefined }, { replace: true });
    }
  });

  const entity = createMemo(() => getEntityById<AnyEntity>(entityType, entityId));
  const history = createMemo(() => getVersionHistory(entityId));
  const anomalies = createMemo(() => {
    return [];
  });

  const handleUpdate = (data: Partial<AnyEntity>) => {
    updateEntity(entityType, entityId, data);
    setShowEditModal(false);
  };

  if (!entity()) {
    return (
      <div class="card p-12 text-center">
        <div class="text-5xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">未找到记录</h3>
        <p class="text-gray-500 mb-4">该记录可能已被删除或ID无效</p>
        <A href="/ledger" class="btn btn-primary inline-flex">
          ← 返回台账
        </A>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "概览" },
    { id: "details", label: "详细信息" },
    { id: "history", label: `版本历史 (${history().length})` },
    { id: "anomalies", label: "异常记录" }
  ];

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <A href="/ledger" class="text-gray-500 hover:text-gray-700 text-xl">
            ←
          </A>
          <div>
            <div class="flex items-center gap-3">
              <EntityTypeBadge type={entityType} />
              <span class="font-mono text-sm text-gray-500">{entity()!.code}</span>
              <StatusBadge status={entity()!.status} />
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mt-1">{entity()!.name}</h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            onClick={() => navigate(`/versions?entity=${entityId}`)}
            class="btn btn-secondary"
          >
            <span>📜</span> 完整历史
          </button>
          <button onClick={() => setShowEditModal(true)} class="btn btn-primary">
            <span>✏️</span> 编辑
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-1 space-y-6">
          <div class="card p-6">
            <h3 class="font-semibold text-gray-900 mb-4">基本信息</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">版本</span>
                <span class="font-medium">v{entity()!.version}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">批次</span>
                <span class="font-mono text-xs">{entity()!.batchId}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">创建人</span>
                <span>{entity()!.createdBy}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">创建时间</span>
                <span>{format(new Date(entity()!.createdAt), "yyyy-MM-dd", { locale: zhCN })}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">更新时间</span>
                <span>{format(new Date(entity()!.updatedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
              </div>
            </div>
          </div>

          {history().length > 0 && (
            <div class="card p-6">
              <h3 class="font-semibold text-gray-900 mb-4">最近变更</h3>
              <div class="space-y-3">
                {history().slice(0, 5).map(h => (
                  <div class="border-l-2 border-gray-200 pl-3 py-1">
                    <div class="text-sm font-medium text-gray-900">{h.changeSummary}</div>
                    <div class="text-xs text-gray-500 mt-1">
                      {h.changedBy} • {formatDistance(new Date(h.changedAt), new Date(), { addSuffix: true, locale: zhCN })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entity()!.remarks && (
            <div class="card p-6">
              <h3 class="font-semibold text-gray-900 mb-2">备注</h3>
              <p class="text-sm text-gray-600">{entity()!.remarks}</p>
            </div>
          )}
        </div>

        <div class="lg:col-span-3 space-y-6">
          <div class="border-b border-gray-200 bg-white rounded-t-xl">
            <nav class="flex gap-8 px-6">
              {tabs.map(tab => (
                <button
                  onClick={() => setActiveTab(tab.id)}
                  class={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab() === tab.id
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div class={activeTab() === "overview" ? "" : "hidden"}>
            <OverviewCard entity={entity()!} />
          </div>

          <div class={activeTab() === "details" ? "" : "hidden"}>
            <DetailsCard entity={entity()!} type={entityType} />
          </div>

          <div class={activeTab() === "history" ? "" : "hidden"}>
            <HistoryCard history={history()} />
          </div>

          <div class={activeTab() === "anomalies" ? "" : "hidden"}>
            <AnomaliesCard entityId={entityId} />
          </div>
        </div>
      </div>

      <Modal
        show={showEditModal()}
        onClose={() => setShowEditModal(false)}
        title={`编辑 ${typeLabels[entityType]} - ${entity()!.name}`}
        width="max-w-4xl"
      >
        <EntityForm
          type={entityType}
          entityId={entityId}
          onSubmit={handleUpdate}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>
    </div>
  );
};

const OverviewCard: Component<{ entity: AnyEntity }> = (props) => {
  const entity = props.entity;

  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {entity.type === "channel" && (
        <>
          <StatBox label="长度" value={`${(entity as Channel).length} m`} icon="📏" />
          <StatBox label="宽度" value={`${(entity as Channel).width} m`} icon="↔️" />
          <StatBox label="高度" value={`${(entity as Channel).height} m`} icon="↕️" />
          <StatBox label="材质" value={(entity as Channel).material} icon="🧱" />
          <StatBox label="耐火等级" value={(entity as Channel).fireResistance} icon="🔥" />
          <StatBox label="最大容纳" value={`${(entity as Channel).maxOccupancy} 人`} icon="👥" />
        </>
      )}
      {entity.type === "entrance" && (
        <>
          <StatBox label="类型" value={getEntranceTypeLabel((entity as Entrance).entranceType)} icon="🚪" />
          <StatBox label="楼层" value={(entity as Entrance).floor} icon="🏢" />
          <StatBox label="宽度" value={`${(entity as Entrance).width} m`} icon="📏" />
          <StatBox label="电梯" value={(entity as Entrance).hasElevator ? "有" : "无"} icon="🛗" />
          <StatBox label="无障碍" value={(entity as Entrance).hasRamp ? "有" : "无"} icon="♿" />
          <StatBox label="地下深度" value={`${(entity as Entrance).groundLevel} m`} icon="⬇️" />
        </>
      )}
      {entity.type === "sign" && (
        <>
          <StatBox label="类型" value={getSignTypeLabel((entity as Sign).signType)} icon="🪧" />
          <StatBox label="照明" value={getIlluminationLabel((entity as Sign).illuminationType)} icon="💡" />
          <StatBox label="下次巡检" value={format(new Date((entity as Sign).nextInspectionDate), "yyyy-MM-dd", { locale: zhCN })} icon="📅" />
        </>
      )}
      {entity.type === "equipment" && (
        <>
          <StatBox label="类型" value={getEquipmentTypeLabel((entity as Equipment).equipmentType)} icon="⚙️" />
          <StatBox label="型号" value={(entity as Equipment).model} icon="🏷️" />
          <StatBox label="维护周期" value={(entity as Equipment).maintenanceCycle} icon="🔄" />
          <StatBox label="下次维护" value={format(new Date((entity as Equipment).nextMaintenanceDate), "yyyy-MM-dd", { locale: zhCN })} icon="📅" />
          <StatBox label="厂商" value={(entity as Equipment).manufacturer} icon="🏭" />
          <StatBox label="安装日期" value={format(new Date((entity as Equipment).installationDate), "yyyy-MM-dd", { locale: zhCN })} icon="📆" />
        </>
      )}
      {entity.type === "map" && (
        <>
          <StatBox label="版本" value={(entity as OfflineMap).mapVersion} icon="📋" />
          <StatBox label="比例尺" value={(entity as OfflineMap).scale} icon="📐" />
          <StatBox label="区域" value={`${(entity as OfflineMap).zones.length} 个`} icon="🗺️" />
          <StatBox label="路径" value={`${(entity as OfflineMap).paths.length} 条`} icon="🛤️" />
          <StatBox label="POI" value={`${(entity as OfflineMap).pois.length} 个`} icon="📍" />
          <StatBox label="格式" value={(entity as OfflineMap).format} icon="📄" />
        </>
      )}
      {entity.type === "inspection" && (
        <>
          <StatBox label="类型" value={getInspectionTypeLabel((entity as InspectionTask).inspectionType)} icon="✅" />
          <StatBox label="巡检员" value={(entity as InspectionTask).inspector} icon="👤" />
          <StatBox label="检查项" value={`${(entity as InspectionTask).items.length} 项`} icon="📋" />
          <StatBox label="通过" value={`${(entity as InspectionTask).items.filter(i => i.result === "pass").length} 项`} icon="✅" />
          <StatBox label="异常" value={`${(entity as InspectionTask).anomalies.length} 项`} icon="⚠️" />
          <StatBox label="计划日期" value={format(new Date((entity as InspectionTask).plannedDate), "yyyy-MM-dd", { locale: zhCN })} icon="📅" />
        </>
      )}
    </div>
  );
};

const StatBox: Component<{ label: string; value: string; icon: string }> = (props) => (
  <div class="card p-5">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
        {props.icon}
      </div>
      <div>
        <div class="text-xs text-gray-500">{props.label}</div>
        <div class="text-base font-semibold text-gray-900">{props.value}</div>
      </div>
    </div>
  </div>
);

const DetailsCard: Component<{ entity: AnyEntity; type: EntityType }> = (props) => {
  const entity = props.entity;
  const fields: { label: string; value: any }[] = [];

  if (entity.type === "channel") {
    const e = entity as Channel;
    fields.push(
      { label: "起点", value: e.startPoint },
      { label: "终点", value: e.endPoint },
      { label: "长度 (m)", value: e.length },
      { label: "宽度 (m)", value: e.width },
      { label: "高度 (m)", value: e.height },
      { label: "材质", value: e.material },
      { label: "耐火等级", value: e.fireResistance },
      { label: "最大容纳人数", value: e.maxOccupancy },
      { label: "当前状态", value: e.currentStatus },
      { label: "连接出入口", value: e.connectedEntrances.join(", ") || "无" },
      { label: "连接通道", value: e.connectedChannels.join(", ") || "无" }
    );
  } else if (entity.type === "entrance") {
    const e = entity as Entrance;
    fields.push(
      { label: "位置", value: e.location },
      { label: "详细地址", value: e.address },
      { label: "出入口类型", value: getEntranceTypeLabel(e.entranceType) },
      { label: "门禁方式", value: e.accessControl },
      { label: "宽度 (m)", value: e.width },
      { label: "高度 (m)", value: e.height },
      { label: "楼层", value: e.floor },
      { label: "地下深度 (m)", value: e.groundLevel },
      { label: "连接通道", value: e.connectedChannels.join(", ") || "无" },
      { label: "有电梯", value: e.hasElevator ? "是" : "否" },
      { label: "有无障碍坡道", value: e.hasRamp ? "是" : "否" },
      { label: "应急电话", value: e.emergencyPhone }
    );
  } else if (entity.type === "sign") {
    const e = entity as Sign;
    fields.push(
      { label: "标识类型", value: getSignTypeLabel(e.signType) },
      { label: "位置", value: e.location },
      { label: "所属通道ID", value: e.channelId },
      { label: "地图坐标", value: `(${e.position.x}, ${e.position.y})` },
      { label: "内容", value: e.content },
      { label: "箭头方向", value: e.arrowDirection || "无" },
      { label: "照明类型", value: getIlluminationLabel(e.illuminationType) },
      { label: "安装日期", value: format(new Date(e.installationDate), "yyyy-MM-dd", { locale: zhCN }) },
      { label: "上次巡检", value: format(new Date(e.lastInspectionDate), "yyyy-MM-dd", { locale: zhCN }) },
      { label: "下次巡检", value: format(new Date(e.nextInspectionDate), "yyyy-MM-dd", { locale: zhCN }) }
    );
  } else if (entity.type === "equipment") {
    const e = entity as Equipment;
    fields.push(
      { label: "设备类型", value: getEquipmentTypeLabel(e.equipmentType) },
      { label: "位置", value: e.location },
      { label: "所属通道ID", value: e.channelId },
      { label: "地图坐标", value: `(${e.position.x}, ${e.position.y})` },
      { label: "型号", value: e.model },
      { label: "生产厂商", value: e.manufacturer },
      { label: "安装日期", value: format(new Date(e.installationDate), "yyyy-MM-dd", { locale: zhCN }) },
      { label: "上次维护", value: format(new Date(e.lastMaintenanceDate), "yyyy-MM-dd", { locale: zhCN }) },
      { label: "下次维护", value: format(new Date(e.nextMaintenanceDate), "yyyy-MM-dd", { locale: zhCN }) },
      { label: "维护周期", value: e.maintenanceCycle }
    );
  } else if (entity.type === "map") {
    const e = entity as OfflineMap;
    fields.push(
      { label: "地图版本", value: e.mapVersion },
      { label: "数据文件", value: e.mapData },
      { label: "区域范围", value: `x:${e.area.x}, y:${e.area.y}, w:${e.area.width}, h:${e.area.height}` },
      { label: "比例尺", value: e.scale },
      { label: "格式", value: e.format },
      { label: "区域数量", value: e.zones.length },
      { label: "路径数量", value: e.paths.length },
      { label: "POI数量", value: e.pois.length }
    );
  } else if (entity.type === "inspection") {
    const e = entity as InspectionTask;
    fields.push(
      { label: "巡检类型", value: getInspectionTypeLabel(e.inspectionType) },
      { label: "计划日期", value: format(new Date(e.plannedDate), "yyyy-MM-dd", { locale: zhCN }) },
      { label: "实际日期", value: e.actualDate ? format(new Date(e.actualDate), "yyyy-MM-dd", { locale: zhCN }) : "未执行" },
      { label: "巡检员", value: e.inspector },
      { label: "检查项数", value: e.items.length },
      { label: "通过项数", value: e.items.filter(i => i.result === "pass").length },
      { label: "异常项数", value: e.anomalies.length },
      { label: "巡检结果", value: e.result || "未完成" },
      { label: "附件", value: e.attachments.join(", ") || "无" }
    );
  }

  return (
    <div class="card p-6">
      <h3 class="font-semibold text-gray-900 mb-6">详细属性</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {fields.map((f) => (
          <div class="flex items-start py-2 border-b border-gray-100">
            <span class="w-36 text-sm text-gray-500 flex-shrink-0">{f.label}</span>
            <span class="text-sm text-gray-900 font-medium">{f.value}</span>
          </div>
        ))}
      </div>

      {props.type === "equipment" && (
        <div class="mt-8">
          <h4 class="font-semibold text-gray-900 mb-4">规格参数</h4>
          <div class="bg-gray-50 rounded-lg p-4">
            <pre class="text-sm text-gray-700 whitespace-pre-wrap">
              {JSON.stringify((entity as Equipment).specification, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {props.type === "inspection" && (
        <div class="mt-8">
          <h4 class="font-semibold text-gray-900 mb-4">检查明细</h4>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-header">检查项</th>
                  <th class="table-header">标准</th>
                  <th class="table-header">结果</th>
                  <th class="table-header">备注</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {(entity as InspectionTask).items.map(item => (
                  <tr>
                    <td class="table-cell">
                      <div class="font-medium">{item.checkItem}</div>
                      <div class="text-xs text-gray-500">{item.entityName}</div>
                    </td>
                    <td class="table-cell text-sm text-gray-600">{item.standard}</td>
                    <td class="table-cell">
                      <span class={`badge ${
                        item.result === "pass" ? "bg-success-100 text-success-600" :
                        item.result === "fail" ? "bg-danger-100 text-danger-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {item.result === "pass" ? "通过" : item.result === "fail" ? "不通过" : "待检"}
                      </span>
                    </td>
                    <td class="table-cell text-sm text-gray-600">{item.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryCard: Component<{ history: any[] }> = (props) => (
  <div class="card">
    <div class="divide-y divide-gray-100">
      {props.history.map(h => (
        <div class="p-4 hover:bg-gray-50">
          <div class="flex items-start justify-between">
            <div class="flex items-start gap-3">
              <div class={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                h.changeType === "create" ? "bg-green-100 text-green-700" :
                h.changeType === "update" ? "bg-blue-100 text-blue-700" :
                "bg-red-100 text-red-700"
              }`}>
                {h.changeType === "create" ? "+" : h.changeType === "update" ? "~" : "×"}
              </div>
              <div>
                <div class="font-medium text-gray-900">{h.changeSummary}</div>
                <div class="text-sm text-gray-500 mt-1">
                  版本 v{h.version} • {h.changedBy} • {format(new Date(h.changedAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                </div>
                <div class="text-xs text-gray-400 mt-1">批次: {h.batchId}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AnomaliesCard: Component<{ entityId: string }> = (props) => {
  const { state } = useDatabase();
  const entityAnomalies = createMemo(() =>
    state().anomalies.filter((a: any) => a.entityId === props.entityId)
  );

  return (
    <div class="card">
      {entityAnomalies().length === 0 ? (
        <div class="p-12 text-center text-gray-500">
          <div class="text-4xl mb-3">✅</div>
          <div>当前无异常记录</div>
        </div>
      ) : (
        <div class="divide-y divide-gray-100">
          {entityAnomalies().map((a: any) => (
            <div class="p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <SeverityBadge severity={a.severity} />
                <div>
                  <div class="font-medium text-gray-900">{a.description}</div>
                  <div class="text-xs text-gray-500 mt-1">
                    {format(new Date(a.detectedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                  </div>
                </div>
              </div>
              {a.resolved ? (
                <span class="badge bg-success-100 text-success-600">已解决</span>
              ) : (
                <span class="badge bg-danger-100 text-danger-600">待处理</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getEntranceTypeLabel(t: string) {
  const labels: Record<string, string> = {
    main: "主入口", emergency: "紧急出入口", personnel: "人员出入口",
    equipment: "设备出入口", vehicular: "车辆出入口"
  };
  return labels[t] || t;
}

function getSignTypeLabel(t: string) {
  const labels: Record<string, string> = {
    direction: "方向指示", emergency: "应急标识", warning: "警告标识",
    information: "信息牌", exit: "安全出口"
  };
  return labels[t] || t;
}

function getIlluminationLabel(t: string) {
  const labels: Record<string, string> = {
    illuminated: "电致发光", reflective: "反光型",
    photoluminescent: "蓄光型", none: "无照明"
  };
  return labels[t] || t;
}

function getEquipmentTypeLabel(t: string) {
  const labels: Record<string, string> = {
    fire: "消防设备", ventilation: "通风设备", power: "电力设备",
    communication: "通信设备", lighting: "照明设备", waterSupply: "给水设备",
    drainage: "排水设备", door: "防护门", airtight: "密闭设备", filter: "滤毒设备"
  };
  return labels[t] || t;
}

function getInspectionTypeLabel(t: string) {
  const labels: Record<string, string> = {
    routine: "例行巡检", emergency: "应急检查", special: "专项检查", acceptance: "验收检查"
  };
  return labels[t] || t;
}

export default Detail;
