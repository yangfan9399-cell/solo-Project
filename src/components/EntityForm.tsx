import { Component, createSignal, onMount } from "solid-js";
import type { EntityType, AnyEntity, Channel, Entrance, Sign, Equipment, OfflineMap, InspectionTask } from "~/types";
import { getEntityById } from "~/lib/database";

interface EntityFormProps {
  type: EntityType;
  entityId?: string;
  onSubmit: (data: Partial<AnyEntity>) => void;
  onCancel: () => void;
}

const EntityForm: Component<EntityFormProps> = (props) => {
  const [formData, setFormData] = createSignal<Partial<AnyEntity>>({});
  const [activeTab, setActiveTab] = createSignal("basic");

  onMount(() => {
    if (props.entityId) {
      const entity = getEntityById<AnyEntity>(props.type, props.entityId);
      if (entity) {
        setFormData(entity);
      }
    }
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!formData().name) {
      alert("请填写名称");
      return;
    }
    props.onSubmit(formData());
  };

  const tabs = [
    { id: "basic", label: "基本信息" },
    { id: "spec", label: "规格属性" },
    { id: "meta", label: "元数据" }
  ];

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="border-b border-gray-200">
        <nav class="flex gap-8">
          {tabs.map(tab => (
            <button
              type="button"
              onClick={() => setActiveTab(tab.id)}
              class={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
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

      <div class={`space-y-4 ${activeTab() === "basic" ? "" : "hidden"}`}>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">编码</label>
            <input
              type="text"
              class="input"
              value={formData().code || ""}
              onInput={(e) => updateField("code", e.target.value)}
              placeholder="系统自动生成或手动输入"
            />
          </div>
          <div>
            <label class="label">名称 *</label>
            <input
              type="text"
              class="input"
              value={formData().name || ""}
              onInput={(e) => updateField("name", e.target.value)}
              placeholder="请输入名称"
              required
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">状态</label>
            <select
              class="input"
              value={formData().status || "normal"}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="normal">正常</option>
              <option value="warning">警告</option>
              <option value="fault">故障</option>
              <option value="maintenance">维护中</option>
              <option value="offline">离线</option>
            </select>
          </div>
          <div>
            <label class="label">创建人</label>
            <input
              type="text"
              class="input"
              value={formData().createdBy || "系统"}
              onInput={(e) => updateField("createdBy", e.target.value)}
            />
          </div>
        </div>

        {props.type === "channel" && (
          <ChannelFields data={formData() as Partial<Channel>} update={updateField} />
        )}
        {props.type === "entrance" && (
          <EntranceFields data={formData() as Partial<Entrance>} update={updateField} />
        )}
        {props.type === "sign" && (
          <SignFields data={formData() as Partial<Sign>} update={updateField} />
        )}
        {props.type === "equipment" && (
          <EquipmentFields data={formData() as Partial<Equipment>} update={updateField} />
        )}
        {props.type === "map" && (
          <MapFields data={formData() as Partial<OfflineMap>} update={updateField} />
        )}
        {props.type === "inspection" && (
          <InspectionFields data={formData() as Partial<InspectionTask>} update={updateField} />
        )}

        <div>
          <label class="label">备注</label>
          <textarea
            class="input min-h-20"
            value={formData().remarks || ""}
            onInput={(e) => updateField("remarks", e.target.value)}
            placeholder="请输入备注信息..."
          />
        </div>
      </div>

      <div class={`space-y-4 ${activeTab() === "spec" ? "" : "hidden"}`}>
        {props.type === "equipment" && (
          <EquipmentSpecFields data={formData() as Partial<Equipment>} update={updateField} />
        )}
        {props.type === "map" && (
          <MapSpecFields data={formData() as Partial<OfflineMap>} update={updateField} />
        )}
        {props.type === "channel" && (
          <div class="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            通道类型无额外规格参数
          </div>
        )}
        {props.type === "entrance" && (
          <div class="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            出入口类型无额外规格参数
          </div>
        )}
        {props.type === "sign" && (
          <div class="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
            指示牌类型无额外规格参数
          </div>
        )}
        {props.type === "inspection" && (
          <InspectionItemsFields data={formData() as Partial<InspectionTask>} update={updateField} />
        )}
      </div>

      <div class={`space-y-4 ${activeTab() === "meta" ? "" : "hidden"}`}>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">版本号</label>
            <input type="text" class="input bg-gray-50" value={formData().version || 1} disabled />
          </div>
          <div>
            <label class="label">批次ID</label>
            <input type="text" class="input bg-gray-50" value={formData().batchId || "-"} disabled />
          </div>
          <div>
            <label class="label">创建时间</label>
            <input type="text" class="input bg-gray-50" value={formData().createdAt ? new Date(formData().createdAt!).toLocaleString("zh-CN") : "-"} disabled />
          </div>
          <div>
            <label class="label">更新时间</label>
            <input type="text" class="input bg-gray-50" value={formData().updatedAt ? new Date(formData().updatedAt!).toLocaleString("zh-CN") : "-"} disabled />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button type="button" onClick={props.onCancel} class="btn btn-secondary">
          取消
        </button>
        <button type="submit" class="btn btn-primary">
          {props.entityId ? "保存修改" : "创建"}
        </button>
      </div>
    </form>
  );
};

const ChannelFields: Component<{ data: Partial<Channel>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div>
      <label class="label">起点</label>
      <input type="text" class="input" value={props.data.startPoint || ""} onInput={(e) => props.update("startPoint", e.target.value)} />
    </div>
    <div>
      <label class="label">终点</label>
      <input type="text" class="input" value={props.data.endPoint || ""} onInput={(e) => props.update("endPoint", e.target.value)} />
    </div>
    <div>
      <label class="label">当前状态</label>
      <input type="text" class="input" value={props.data.currentStatus || ""} onInput={(e) => props.update("currentStatus", e.target.value)} />
    </div>
    <div>
      <label class="label">长度 (m)</label>
      <input type="number" step="0.1" class="input" value={props.data.length || ""} onInput={(e) => props.update("length", parseFloat(e.target.value))} />
    </div>
    <div>
      <label class="label">宽度 (m)</label>
      <input type="number" step="0.1" class="input" value={props.data.width || ""} onInput={(e) => props.update("width", parseFloat(e.target.value))} />
    </div>
    <div>
      <label class="label">高度 (m)</label>
      <input type="number" step="0.1" class="input" value={props.data.height || ""} onInput={(e) => props.update("height", parseFloat(e.target.value))} />
    </div>
    <div>
      <label class="label">材质</label>
      <select class="input" value={props.data.material || ""} onChange={(e) => props.update("material", e.target.value)}>
        <option value="">请选择</option>
        <option value="钢筋混凝土">钢筋混凝土</option>
        <option value="砖混结构">砖混结构</option>
        <option value="钢结构">钢结构</option>
        <option value="其他">其他</option>
      </select>
    </div>
    <div>
      <label class="label">耐火等级</label>
      <select class="input" value={props.data.fireResistance || ""} onChange={(e) => props.update("fireResistance", e.target.value)}>
        <option value="">请选择</option>
        <option value="一级">一级</option>
        <option value="二级">二级</option>
        <option value="三级">三级</option>
      </select>
    </div>
    <div>
      <label class="label">最大容纳人数</label>
      <input type="number" class="input" value={props.data.maxOccupancy || ""} onInput={(e) => props.update("maxOccupancy", parseInt(e.target.value))} />
    </div>
  </div>
);

const EntranceFields: Component<{ data: Partial<Entrance>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div>
      <label class="label">出入口类型</label>
      <select class="input" value={props.data.entranceType || "main"} onChange={(e) => props.update("entranceType", e.target.value)}>
        <option value="main">主入口</option>
        <option value="emergency">紧急出入口</option>
        <option value="personnel">人员出入口</option>
        <option value="equipment">设备出入口</option>
        <option value="vehicular">车辆出入口</option>
      </select>
    </div>
    <div>
      <label class="label">楼层</label>
      <input type="text" class="input" value={props.data.floor || "B1"} onInput={(e) => props.update("floor", e.target.value)} />
    </div>
    <div>
      <label class="label">地下深度 (m)</label>
      <input type="number" step="0.1" class="input" value={props.data.groundLevel || ""} onInput={(e) => props.update("groundLevel", parseFloat(e.target.value))} />
    </div>
    <div class="col-span-3">
      <label class="label">位置描述</label>
      <input type="text" class="input" value={props.data.location || ""} onInput={(e) => props.update("location", e.target.value)} />
    </div>
    <div class="col-span-3">
      <label class="label">详细地址</label>
      <input type="text" class="input" value={props.data.address || ""} onInput={(e) => props.update("address", e.target.value)} />
    </div>
    <div>
      <label class="label">宽度 (m)</label>
      <input type="number" step="0.1" class="input" value={props.data.width || ""} onInput={(e) => props.update("width", parseFloat(e.target.value))} />
    </div>
    <div>
      <label class="label">高度 (m)</label>
      <input type="number" step="0.1" class="input" value={props.data.height || ""} onInput={(e) => props.update("height", parseFloat(e.target.value))} />
    </div>
    <div>
      <label class="label">门禁方式</label>
      <input type="text" class="input" value={props.data.accessControl || ""} onInput={(e) => props.update("accessControl", e.target.value)} />
    </div>
    <div class="flex items-end gap-4">
      <label class="flex items-center gap-2">
        <input type="checkbox" checked={props.data.hasElevator || false} onChange={(e) => props.update("hasElevator", e.target.checked)} />
        <span class="text-sm">有电梯</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" checked={props.data.hasRamp || false} onChange={(e) => props.update("hasRamp", e.target.checked)} />
        <span class="text-sm">有无障碍坡道</span>
      </label>
    </div>
    <div>
      <label class="label">应急电话</label>
      <input type="text" class="input" value={props.data.emergencyPhone || ""} onInput={(e) => props.update("emergencyPhone", e.target.value)} />
    </div>
  </div>
);

const SignFields: Component<{ data: Partial<Sign>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div>
      <label class="label">标识类型</label>
      <select class="input" value={props.data.signType || "direction"} onChange={(e) => props.update("signType", e.target.value)}>
        <option value="direction">方向指示</option>
        <option value="emergency">应急标识</option>
        <option value="warning">警告标识</option>
        <option value="information">信息牌</option>
        <option value="exit">安全出口</option>
      </select>
    </div>
    <div>
      <label class="label">照明类型</label>
      <select class="input" value={props.data.illuminationType || "illuminated"} onChange={(e) => props.update("illuminationType", e.target.value)}>
        <option value="illuminated">电致发光</option>
        <option value="reflective">反光型</option>
        <option value="photoluminescent">蓄光型</option>
        <option value="none">无照明</option>
      </select>
    </div>
    <div>
      <label class="label">箭头方向</label>
      <select class="input" value={props.data.arrowDirection || ""} onChange={(e) => props.update("arrowDirection", e.target.value)}>
        <option value="">无箭头</option>
        <option value="left">向左</option>
        <option value="right">向右</option>
        <option value="up">向上</option>
        <option value="down">向下</option>
        <option value="forward">向前</option>
        <option value="back">向后</option>
      </select>
    </div>
    <div class="col-span-2">
      <label class="label">位置</label>
      <input type="text" class="input" value={props.data.location || ""} onInput={(e) => props.update("location", e.target.value)} />
    </div>
    <div>
      <label class="label">所属通道</label>
      <input type="text" class="input" value={props.data.channelId || ""} onInput={(e) => props.update("channelId", e.target.value)} />
    </div>
    <div class="col-span-3">
      <label class="label">标识内容</label>
      <input type="text" class="input" value={props.data.content || ""} onInput={(e) => props.update("content", e.target.value)} />
    </div>
    <div>
      <label class="label">安装日期</label>
      <input type="date" class="input" value={(props.data.installationDate || "").slice(0, 10)} onInput={(e) => props.update("installationDate", e.target.value)} />
    </div>
    <div>
      <label class="label">上次巡检</label>
      <input type="date" class="input" value={(props.data.lastInspectionDate || "").slice(0, 10)} onInput={(e) => props.update("lastInspectionDate", e.target.value)} />
    </div>
    <div>
      <label class="label">下次巡检</label>
      <input type="date" class="input" value={(props.data.nextInspectionDate || "").slice(0, 10)} onInput={(e) => props.update("nextInspectionDate", e.target.value)} />
    </div>
  </div>
);

const EquipmentFields: Component<{ data: Partial<Equipment>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div>
      <label class="label">设备类型</label>
      <select class="input" value={props.data.equipmentType || "fire"} onChange={(e) => props.update("equipmentType", e.target.value)}>
        <option value="fire">消防设备</option>
        <option value="ventilation">通风设备</option>
        <option value="power">电力设备</option>
        <option value="communication">通信设备</option>
        <option value="lighting">照明设备</option>
        <option value="waterSupply">给水设备</option>
        <option value="drainage">排水设备</option>
        <option value="door">防护门</option>
        <option value="airtight">密闭设备</option>
        <option value="filter">滤毒设备</option>
      </select>
    </div>
    <div>
      <label class="label">型号</label>
      <input type="text" class="input" value={props.data.model || ""} onInput={(e) => props.update("model", e.target.value)} />
    </div>
    <div>
      <label class="label">生产厂商</label>
      <input type="text" class="input" value={props.data.manufacturer || ""} onInput={(e) => props.update("manufacturer", e.target.value)} />
    </div>
    <div class="col-span-2">
      <label class="label">安装位置</label>
      <input type="text" class="input" value={props.data.location || ""} onInput={(e) => props.update("location", e.target.value)} />
    </div>
    <div>
      <label class="label">所属通道</label>
      <input type="text" class="input" value={props.data.channelId || ""} onInput={(e) => props.update("channelId", e.target.value)} />
    </div>
    <div>
      <label class="label">安装日期</label>
      <input type="date" class="input" value={(props.data.installationDate || "").slice(0, 10)} onInput={(e) => props.update("installationDate", e.target.value)} />
    </div>
    <div>
      <label class="label">上次维护</label>
      <input type="date" class="input" value={(props.data.lastMaintenanceDate || "").slice(0, 10)} onInput={(e) => props.update("lastMaintenanceDate", e.target.value)} />
    </div>
    <div>
      <label class="label">下次维护</label>
      <input type="date" class="input" value={(props.data.nextMaintenanceDate || "").slice(0, 10)} onInput={(e) => props.update("nextMaintenanceDate", e.target.value)} />
    </div>
    <div>
      <label class="label">维护周期</label>
      <select class="input" value={props.data.maintenanceCycle || "90天"} onChange={(e) => props.update("maintenanceCycle", e.target.value)}>
        <option value="30天">30天</option>
        <option value="60天">60天</option>
        <option value="90天">90天</option>
        <option value="180天">180天</option>
        <option value="365天">365天</option>
      </select>
    </div>
  </div>
);

const EquipmentSpecFields: Component<{ data: Partial<Equipment>; update: (f: string, v: any) => void }> = (props) => {
  const [specs, setSpecs] = createSignal<Array<{ key: string; value: string }>>(
    Object.entries(props.data.specification || {}).map(([k, v]) => ({ key: k, value: String(v) }))
  );

  const addSpec = () => {
    setSpecs([...specs(), { key: "", value: "" }]);
  };

  const updateSpec = (idx: number, field: "key" | "value", val: string) => {
    const newSpecs = [...specs()];
    newSpecs[idx][field] = val;
    setSpecs(newSpecs);
    const specObj = specs().reduce((acc, s) => {
      if (s.key) acc[s.key] = isNaN(Number(s.value)) ? s.value : Number(s.value);
      return acc;
    }, {} as Record<string, string | number>);
    props.update("specification", specObj);
  };

  const removeSpec = (idx: number) => {
    setSpecs(specs().filter((_, i) => i !== idx));
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">规格参数</h4>
        <button type="button" onClick={addSpec} class="text-sm text-primary-600 hover:text-primary-700">
          + 添加参数
        </button>
      </div>
      <div class="space-y-2">
        {specs().map((spec, idx) => (
          <div class="flex gap-2">
            <input
              type="text"
              placeholder="参数名"
              class="input flex-1"
              value={spec.key}
              onInput={(e) => updateSpec(idx, "key", e.target.value)}
            />
            <input
              type="text"
              placeholder="参数值"
              class="input flex-1"
              value={spec.value}
              onInput={(e) => updateSpec(idx, "value", e.target.value)}
            />
            <button type="button" onClick={() => removeSpec(idx)} class="px-3 text-danger-600 hover:bg-danger-50 rounded">
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const MapFields: Component<{ data: Partial<OfflineMap>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div>
      <label class="label">地图版本</label>
      <input type="text" class="input" value={props.data.mapVersion || "v1.0"} onInput={(e) => props.update("mapVersion", e.target.value)} />
    </div>
    <div>
      <label class="label">比例尺</label>
      <input type="text" class="input" value={props.data.scale || "1:200"} onInput={(e) => props.update("scale", e.target.value)} />
    </div>
    <div>
      <label class="label">数据格式</label>
      <input type="text" class="input" value={props.data.format || "GeoJSON"} onInput={(e) => props.update("format", e.target.value)} />
    </div>
    <div>
      <label class="label">地图数据文件</label>
      <input type="text" class="input" value={props.data.mapData || ""} onInput={(e) => props.update("mapData", e.target.value)} />
    </div>
    <div>
      <label class="label">区域宽度</label>
      <input type="number" class="input" value={props.data.area?.width || 0} onInput={(e) => props.update("area", { ...props.data.area, width: parseInt(e.target.value) })} />
    </div>
    <div>
      <label class="label">区域高度</label>
      <input type="number" class="input" value={props.data.area?.height || 0} onInput={(e) => props.update("area", { ...props.data.area, height: parseInt(e.target.value) })} />
    </div>
  </div>
);

const MapSpecFields: Component<{ data: Partial<OfflineMap>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div class="text-center p-4 bg-gray-50 rounded-lg">
      <div class="text-2xl font-bold text-primary-600">{props.data.zones?.length || 0}</div>
      <div class="text-sm text-gray-600">区域数量</div>
    </div>
    <div class="text-center p-4 bg-gray-50 rounded-lg">
      <div class="text-2xl font-bold text-green-600">{props.data.paths?.length || 0}</div>
      <div class="text-sm text-gray-600">路径数量</div>
    </div>
    <div class="text-center p-4 bg-gray-50 rounded-lg">
      <div class="text-2xl font-bold text-purple-600">{props.data.pois?.length || 0}</div>
      <div class="text-sm text-gray-600">POI数量</div>
    </div>
  </div>
);

const InspectionFields: Component<{ data: Partial<InspectionTask>; update: (f: string, v: any) => void }> = (props) => (
  <div class="grid grid-cols-3 gap-4">
    <div>
      <label class="label">巡检类型</label>
      <select class="input" value={props.data.inspectionType || "routine"} onChange={(e) => props.update("inspectionType", e.target.value)}>
        <option value="routine">例行巡检</option>
        <option value="emergency">应急检查</option>
        <option value="special">专项检查</option>
        <option value="acceptance">验收检查</option>
      </select>
    </div>
    <div>
      <label class="label">计划日期</label>
      <input type="date" class="input" value={(props.data.plannedDate || "").slice(0, 10)} onInput={(e) => props.update("plannedDate", e.target.value)} />
    </div>
    <div>
      <label class="label">实际日期</label>
      <input type="date" class="input" value={(props.data.actualDate || "").slice(0, 10)} onInput={(e) => props.update("actualDate", e.target.value)} />
    </div>
    <div>
      <label class="label">巡检员</label>
      <input type="text" class="input" value={props.data.inspector || ""} onInput={(e) => props.update("inspector", e.target.value)} />
    </div>
    <div>
      <label class="label">巡检结果</label>
      <select class="input" value={props.data.result || "pending"} onChange={(e) => props.update("result", e.target.value)}>
        <option value="pending">待处理</option>
        <option value="in_progress">进行中</option>
        <option value="completed">已完成</option>
        <option value="failed">未通过</option>
      </select>
    </div>
  </div>
);

const InspectionItemsFields: Component<{ data: Partial<InspectionTask>; update: (f: string, v: any) => void }> = (props) => {
  const [items, setItems] = createSignal(props.data.items || []);

  const addItem = () => {
    const newItem = {
      id: Date.now().toString(36),
      entityType: "channel" as const,
      entityId: "",
      entityName: "",
      checkItem: "",
      standard: "",
      result: "pending" as const,
      remarks: "",
      photos: []
    };
    setItems([...items(), newItem]);
    props.update("items", [...items(), newItem]);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items()];
    (newItems[idx] as any)[field] = value;
    setItems(newItems);
    props.update("items", newItems);
  };

  const removeItem = (idx: number) => {
    setItems(items().filter((_, i) => i !== idx));
    props.update("items", items().filter((_, i) => i !== idx));
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-gray-900">检查项 ({items().length})</h4>
        <button type="button" onClick={addItem} class="text-sm text-primary-600 hover:text-primary-700">
          + 添加检查项
        </button>
      </div>
      <div class="space-y-4">
        {items().map((item, idx) => (
          <div class="p-4 border border-gray-200 rounded-lg space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-gray-700">检查项 {idx + 1}</span>
              <button type="button" onClick={() => removeItem(idx)} class="text-sm text-danger-600 hover:text-danger-700">
                删除
              </button>
            </div>
            <div class="grid grid-cols-4 gap-3">
              <div>
                <label class="label">实体类型</label>
                <select class="input text-sm" value={item.entityType} onChange={(e) => updateItem(idx, "entityType", e.target.value)}>
                  <option value="channel">通道</option>
                  <option value="entrance">出入口</option>
                  <option value="sign">指示牌</option>
                  <option value="equipment">设备</option>
                </select>
              </div>
              <div>
                <label class="label">实体名称</label>
                <input type="text" class="input text-sm" value={item.entityName} onInput={(e) => updateItem(idx, "entityName", e.target.value)} />
              </div>
              <div>
                <label class="label">检查项</label>
                <input type="text" class="input text-sm" value={item.checkItem} onInput={(e) => updateItem(idx, "checkItem", e.target.value)} />
              </div>
              <div>
                <label class="label">结果</label>
                <select class="input text-sm" value={item.result} onChange={(e) => updateItem(idx, "result", e.target.value)}>
                  <option value="pending">待检</option>
                  <option value="pass">通过</option>
                  <option value="fail">不通过</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">检查标准</label>
                <input type="text" class="input text-sm" value={item.standard} onInput={(e) => updateItem(idx, "standard", e.target.value)} />
              </div>
              <div>
                <label class="label">备注</label>
                <input type="text" class="input text-sm" value={item.remarks} onInput={(e) => updateItem(idx, "remarks", e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityForm;
