import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

interface TrayInfo {
  tray_id: string;
  total_slots: number;
  normal_count: number;
  missing_count: number;
  worn_count: number;
  reserved_count: number;
}

export default function TraysList() {
  const navigate = useNavigate();
  const [trays, setTrays] = createSignal<TrayInfo[]>([]);
  const [filter, setFilter] = createSignal('all');

  onMount(() => {
    loadTrays();
  });

  async function loadTrays() {
    const res = await fetch('/api/trays');
    const data = await res.json();
    setTrays(data);
  }

  return (
    <div>
      <h2 class="page-title">字盘视图</h2>
      <p class="page-subtitle">查看印坊所有木活字盘的格位分布、缺字和磨损情况</p>

      <div class="sample-section">
        <div class="sample-title">
          <span>🎯</span>
          <span>场景提示</span>
        </div>
        <p class="sample-desc">
          本页展示<span class="sample-tag">主记录</span>——字盘格位数据。每个字盘为一个管理单元，
          包含若干行列格位，每个格位可存放一个木活字。状态分为：正常(绿)、缺字(红)、磨损(橙)、预留(蓝)。
          点击字盘可查看详细格位视图和历史变更记录。
        </p>
      </div>

      <div class="tabs">
        <div 
          class={`tab ${filter() === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部字盘 ({trays().length})
        </div>
        <div 
          class={`tab ${filter() === 'has-issues' ? 'active' : ''}`}
          onClick={() => setFilter('has-issues')}
        >
          有异常
        </div>
      </div>

      <div class="stats-grid">
        <For each={
          filter() === 'all' 
            ? trays() 
            : trays().filter(t => t.missing_count > 0 || t.worn_count > 0)
        }>
          {tray => (
            <div 
              class="card" 
              style="cursor: pointer; margin-bottom: 0;"
              onClick={() => navigate(`/trays/${tray.tray_id}`)}
            >
              <div class="card-title">
                <span>📦</span>
                <span>{tray.tray_id}</span>
              </div>
              <div class="tray-stats" style="margin-bottom: 12px;">
                <span class="tray-stat"><span class="dot normal"></span>正常 {tray.normal_count}</span>
                <span class="tray-stat"><span class="dot missing"></span>缺字 {tray.missing_count}</span>
                <span class="tray-stat"><span class="dot worn"></span>磨损 {tray.worn_count}</span>
                <span class="tray-stat"><span class="dot reserved"></span>预留 {tray.reserved_count}</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  style={`width: ${(tray.normal_count / tray.total_slots * 100).toFixed(1)}%; 
                          background: linear-gradient(90deg, #388E3C ${(tray.normal_count / tray.total_slots * 100).toFixed(1)}%, #FF9800 ${(tray.normal_count / tray.total_slots * 100).toFixed(1)}%);`}
                />
              </div>
              <p style="font-size: 12px; color: #666; margin-top: 8px;">
                共 {tray.total_slots} 个格位 · 完好率 {((tray.normal_count / tray.total_slots) * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
