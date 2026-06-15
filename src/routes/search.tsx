import { createSignal, onMount, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";

interface Slot {
  id: number;
  tray_id: string;
  row: number;
  col: number;
  character: string | null;
  status: string;
  wear_level: number;
  version: number;
  task_title?: string;
  carve_batch?: string;
}

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = createSignal('');
  const [statusFilter, setStatusFilter] = createSignal('');
  const [trayFilter, setTrayFilter] = createSignal('');
  const [results, setResults] = createSignal<Slot[]>([]);
  const [searching, setSearching] = createSignal(false);

  onMount(() => {
    doSearch();
  });

  async function doSearch() {
    setSearching(true);
    const params = new URLSearchParams();
    if (query()) params.set('q', query());
    if (statusFilter()) params.set('status', statusFilter());
    if (trayFilter()) params.set('tray', trayFilter());
    
    const res = await fetch(`/api/slots/search?${params.toString()}`);
    const data = await res.json();
    setResults(data);
    setSearching(false);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      doSearch();
    }
  }

  const statusLabels: Record<string, string> = {
    'normal': '正常',
    'missing': '缺字',
    'worn': '磨损',
    'reserved': '预留'
  };

  return (
    <div>
      <h2 class="page-title">字检索</h2>
      <p class="page-subtitle">在所有字盘中搜索特定汉字，查看位置、状态和关联信息</p>

      <div class="card">
        <div class="search-bar">
          <input
            type="text"
            class="search-input"
            placeholder="输入汉字搜索..."
            value={query()}
            onInput={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <select 
            class="select-input"
            value={statusFilter()}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="normal">正常</option>
            <option value="missing">缺字</option>
            <option value="worn">磨损</option>
            <option value="reserved">预留</option>
          </select>
          <select 
            class="select-input"
            value={trayFilter()}
            onChange={(e) => setTrayFilter(e.target.value)}
          >
            <option value="">全部字盘</option>
            <option value="TRAY-A01">TRAY-A01</option>
            <option value="TRAY-A02">TRAY-A02</option>
            <option value="TRAY-B01">TRAY-B01</option>
            <option value="TRAY-B02">TRAY-B02</option>
          </select>
          <button class="btn btn-primary" onClick={doSearch}>
            🔍 搜索
          </button>
        </div>

        <div style="font-size: 13px; color: #666; margin-bottom: 12px;">
          共找到 <strong>{results().length}</strong> 个结果
          <Show when={searching()}>
            <span style="margin-left: 8px;">搜索中...</span>
          </Show>
        </div>

        <Show when={results().length === 0}>
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <div class="empty-text">未找到匹配的字格</div>
          </div>
        </Show>

        <Show when={results().length > 0}>
          <table>
            <thead>
              <tr>
                <th>字</th>
                <th>字盘</th>
                <th>位置</th>
                <th>状态</th>
                <th>磨损度</th>
                <th>版本</th>
                <th>关联信息</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <For each={results()}>
                {slot => (
                  <tr>
                    <td>
                      <span style="font-size: 20px; font-weight: 500;">
                        {slot.character || '○'}
                      </span>
                    </td>
                    <td>{slot.tray_id}</td>
                    <td>第{slot.row + 1}行第{slot.col + 1}列</td>
                    <td>
                      <span class={`badge badge-${slot.status}`}>
                        {statusLabels[slot.status]}
                      </span>
                    </td>
                    <td>{slot.wear_level}%</td>
                    <td>v{slot.version}</td>
                    <td>
                      <Show when={slot.carve_batch}>
                        <span style="font-size: 11px; color: var(--color-info);">
                          补刻: {slot.carve_batch}
                        </span>
                      </Show>
                      <Show when={slot.task_title}>
                        <div style="font-size: 11px; color: #666;">
                          任务: {slot.task_title}
                        </div>
                      </Show>
                    </td>
                    <td>
                      <button 
                        class="btn btn-sm btn-outline"
                        onClick={() => navigate(`/trays/${slot.tray_id}`)}
                      >
                        查看字盘
                      </button>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      <div class="card">
        <h3 class="card-title">💡 检索说明</h3>
        <ul style="font-size: 13px; color: #666; line-height: 1.8; padding-left: 20px;">
          <li>支持汉字模糊搜索，输入任意汉字即可在所有字盘中查找</li>
          <li>可按状态筛选：正常 / 缺字 / 磨损 / 预留（补刻中）</li>
          <li>「预留」状态表示该字格已分配补刻计划，正在制作中</li>
          <li>磨损度超过 80% 的字会自动标记为磨损状态</li>
          <li>每个字格都有版本号，每次状态变更版本递增</li>
        </ul>
      </div>
    </div>
  );
}
