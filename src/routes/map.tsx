import { Component, createSignal, createMemo } from "solid-js";
import { useDatabase } from "~/lib/database";
import { StatusBadge, EntityTypeBadge } from "~/components/common";
import type { OfflineMap, MapPOI, EntityType } from "~/types";

const MapViewer: Component = () => {
  const { state } = useDatabase();
  const [selectedMapId, setSelectedMapId] = createSignal(state().maps[0]?.id || "");
  const [hoveredPOI, setHoveredPOI] = createSignal<MapPOI | null>(null);
  const [selectedPOI, setSelectedPOI] = createSignal<MapPOI | null>(null);
  const [viewMode, setViewMode] = createSignal<"all" | "channel" | "entrance" | "sign" | "equipment">("all");
  const [zoom, setZoom] = createSignal(1);

  const selectedMap = createMemo(() =>
    state().maps.find(m => m.id === selectedMapId())
  );

  const filteredPOIs = createMemo(() => {
    const map = selectedMap();
    if (!map) return [];
    if (viewMode() === "all") return map.pois;
    return map.pois.filter(p => p.entityType === viewMode());
  });

  const getPOIEntity = (poi: MapPOI) => {
    const s = state();
    switch (poi.entityType) {
      case "channel": return s.channels.find(e => e.id === poi.entityId);
      case "entrance": return s.entrances.find(e => e.id === poi.entityId);
      case "sign": return s.signs.find(e => e.id === poi.entityId);
      case "equipment": return s.equipment.find(e => e.id === poi.entityId);
      default: return undefined;
    }
  };

  const handleMapClick = (e: MouseEvent & { currentTarget: SVGSVGElement }) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom();
    const y = (e.clientY - rect.top) / zoom();
    console.log(`Clicked at: (${x.toFixed(1)}, ${y.toFixed(1)})`);
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <select
            class="input w-72"
            value={selectedMapId()}
            onChange={(e) => setSelectedMapId(e.target.value)}
          >
            {state().maps.map(m => (
              <option value={m.id}>{m.name} ({m.mapVersion})</option>
            ))}
          </select>
          <StatusBadge status={selectedMap()?.status || "normal"} />
          <span class="text-sm text-gray-500">
            比例尺: {selectedMap()?.scale} | {selectedMap()?.zones.length} 个区域 | {selectedMap()?.paths.length} 条路径 | {selectedMap()?.pois.length} 个POI
          </span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex bg-gray-100 rounded-lg p-1">
            {(["all", "channel", "entrance", "sign", "equipment"] as const).map(mode => (
              <button
                onClick={() => setViewMode(mode)}
                class={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode() === mode ? "bg-white shadow text-primary-600 font-medium" : "text-gray-600"
                }`}
              >
                {mode === "all" ? "全部" : mode === "channel" ? "通道" : mode === "entrance" ? "出入口" : mode === "sign" ? "指示牌" : "设备"}
              </button>
            ))}
          </div>
          <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom() - 0.1))}
              class="w-8 h-8 rounded hover:bg-white transition-colors"
            >
              −
            </button>
            <span class="w-16 text-center text-sm font-medium">{Math.round(zoom() * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom() + 0.1))}
              class="w-8 h-8 rounded hover:bg-white transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-3">
          <div class="card p-6 overflow-hidden">
            <div class="overflow-auto bg-slate-50 rounded-lg border border-slate-200" style={{ "max-height": "600px" }}>
              {selectedMap() && (
                <svg
                  width={selectedMap()!.area.width * zoom()}
                  height={selectedMap()!.area.height * zoom()}
                  onClick={handleMapClick}
                  class="cursor-crosshair"
                >
                  <defs>
                    <pattern id="grid" width={20 * zoom()} height={20 * zoom()} patternUnits="userSpaceOnUse">
                      <path d={`M ${20 * zoom()} 0 L 0 0 0 ${20 * zoom()}`} fill="none" stroke="#e2e8f0" stroke-width="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {selectedMap()!.zones.map(zone => (
                    <g>
                      <polygon
                        points={zone.polygon.map(p => `${p.x * zoom()},${p.y * zoom()}`).join(" ")}
                        fill={zone.type === "shelter" ? "#dcfce7" : zone.type === "equipment_room" ? "#fef3c7" : "#dbeafe"}
                        stroke={zone.type === "shelter" ? "#22c55e" : zone.type === "equipment_room" ? "#f59e0b" : "#3b82f6"}
                        stroke-width="2"
                        opacity="0.6"
                      />
                      <text
                        x={zone.polygon[0].x * zoom() + 5}
                        y={zone.polygon[0].y * zoom() + 20}
                        class="text-xs"
                        fill="#374151"
                        font-size={`${12 * zoom()}px`}
                      >
                        {zone.name}
                      </text>
                    </g>
                  ))}

                  {selectedMap()!.paths.map(path => (
                    <polyline
                      points={path.points.map(p => `${p.x * zoom()},${p.y * zoom()}`).join(" ")}
                      fill="none"
                      stroke={path.type === "main" ? "#3b82f6" : path.type === "emergency" ? "#ef4444" : "#6b7280"}
                      stroke-width={path.type === "main" ? 4 * zoom() : 2 * zoom()}
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray={path.type === "emergency" ? `${5 * zoom()},${3 * zoom()}` : undefined}
                    />
                  ))}

                  {filteredPOIs().map(poi => {
                    const entity = getPOIEntity(poi);
                    const isHovered = hoveredPOI()?.id === poi.id;
                    const isSelected = selectedPOI()?.id === poi.id;
                    const colors: Record<EntityType, string> = {
                      channel: "#3b82f6",
                      entrance: "#22c55e",
                      sign: "#f59e0b",
                      equipment: "#8b5cf6",
                      map: "#6366f1",
                      inspection: "#ec4899"
                    };
                    const icons: Record<EntityType, string> = {
                      channel: "↔",
                      entrance: "🚪",
                      sign: "🪧",
                      equipment: "⚙",
                      map: "🗺",
                      inspection: "✅"
                    };
                    return (
                      <g
                        onMouseEnter={() => setHoveredPOI(poi)}
                        onMouseLeave={() => setHoveredPOI(null)}
                        onClick={(e) => { e.stopPropagation(); setSelectedPOI(poi); }}
                        class="cursor-pointer"
                      >
                        <circle
                          cx={poi.position.x * zoom()}
                          cy={poi.position.y * zoom()}
                          r={(isHovered || isSelected ? 14 : 12) * zoom()}
                          fill={colors[poi.entityType]}
                          opacity={entity?.status === "normal" ? 1 : 0.6}
                          stroke={isSelected ? "#1e293b" : "white"}
                          stroke-width={isSelected ? 3 : 2}
                        />
                        <text
                          x={poi.position.x * zoom()}
                          y={poi.position.y * zoom() + 4 * zoom()}
                          text-anchor="middle"
                          font-size={`${12 * zoom()}px`}
                          fill="white"
                          class="pointer-events-none select-none"
                        >
                          {icons[poi.entityType]}
                        </text>
                        {isHovered && entity && (
                          <g>
                            <rect
                              x={poi.position.x * zoom() + 15}
                              y={poi.position.y * zoom() - 15}
                              width={150 * zoom()}
                              height={50 * zoom()}
                              fill="white"
                              stroke="#e2e8f0"
                              stroke-width="1"
                              rx="4"
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                            />
                            <text
                              x={poi.position.x * zoom() + 22}
                              y={poi.position.y * zoom() + 5}
                              font-size={`${11 * zoom()}px`}
                              font-weight="bold"
                              fill="#1e293b"
                            >
                              {entity.name}
                            </text>
                            <text
                              x={poi.position.x * zoom() + 22}
                              y={poi.position.y * zoom() + 22}
                              font-size={`${10 * zoom()}px`}
                              fill="#6b7280"
                            >
                              {entity.code}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
            <div class="mt-4 flex items-center gap-6 text-sm">
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-blue-500"></div>
                <span class="text-gray-600">通道</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-green-500"></div>
                <span class="text-gray-600">出入口</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span class="text-gray-600">指示牌</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-4 h-4 rounded-full bg-purple-500"></div>
                <span class="text-gray-600">设备点位</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-1 bg-blue-500 rounded"></div>
                <span class="text-gray-600">主通道</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-0.5 bg-red-500 rounded" style={{ "background-image": "repeating-linear-gradient(90deg, #ef4444, #ef4444 5px, transparent 5px, transparent 8px)" }}></div>
                <span class="text-gray-600">应急通道</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-4">
            <h3 class="font-semibold text-gray-900 mb-4">地图信息</h3>
            {selectedMap() && (
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">地图版本</span>
                  <span class="font-mono">{selectedMap()!.mapVersion}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">比例尺</span>
                  <span>{selectedMap()!.scale}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">格式</span>
                  <span>{selectedMap()!.format}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">数据文件</span>
                  <span class="font-mono text-xs">{selectedMap()!.mapData}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">区域数</span>
                  <span>{selectedMap()!.zones.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">路径数</span>
                  <span>{selectedMap()!.paths.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">POI数</span>
                  <span>{filteredPOIs().length}/{selectedMap()!.pois.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">版本</span>
                  <span>v{selectedMap()!.version}</span>
                </div>
              </div>
            )}
          </div>

          <div class="card p-4">
            <h3 class="font-semibold text-gray-900 mb-4">
              {selectedPOI() ? "选中POI详情" : "点位列表"}
            </h3>
            {selectedPOI() ? (
              <div class="space-y-3">
                {(() => {
                  const poi = selectedPOI()!;
                  const entity = getPOIEntity(poi);
                  if (!entity) return null;
                  return (
                    <>
                      <div class="flex items-center gap-2">
                        <EntityTypeBadge type={poi.entityType} />
                        <StatusBadge status={entity.status} />
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">{entity.name}</div>
                        <div class="font-mono text-xs text-gray-500">{entity.code}</div>
                      </div>
                      <div class="text-sm text-gray-600">
                        坐标: ({poi.position.x}, {poi.position.y})
                      </div>
                      {entity.remarks && (
                        <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {entity.remarks}
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedPOI(null)}
                        class="w-full btn btn-secondary text-sm py-1.5"
                      >
                        关闭详情
                      </button>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div class="max-h-80 overflow-y-auto space-y-1">
                {filteredPOIs().map(poi => {
                  const entity = getPOIEntity(poi);
                  if (!entity) return null;
                  return (
                    <div
                      onClick={() => setSelectedPOI(poi)}
                      class="p-2 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    >
                      <EntityTypeBadge type={poi.entityType} />
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 truncate">{entity.name}</div>
                        <div class="text-xs text-gray-500">({poi.position.x}, {poi.position.y})</div>
                      </div>
                      <StatusBadge status={entity.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
