import { createSignal, Show } from "solid-js";

export default function Export() {
  const [exportType, setExportType] = createSignal('all');
  const [exportFormat, setExportFormat] = createSignal('json');

  function doExport() {
    const params = new URLSearchParams();
    params.set('type', exportType());
    params.set('format', exportFormat());
    
    window.location.href = `/api/export?${params.toString()}`;
  }

  const typeOptions = [
    { value: 'all', label: '全部数据', desc: '导出字盘、任务、批次、历史所有数据' },
    { value: 'trays', label: '字盘格位', desc: '导出所有字盘的格位数据和状态' },
    { value: 'tasks', label: '印刷任务', desc: '导出印刷任务清单和需求' },
    { value: 'batches', label: '补刻批次', desc: '导出补刻批次和计划明细' },
    { value: 'history', label: '历史记录', desc: '导出所有状态变更历史' },
  ];

  return (
    <div>
      <h2 class="page-title">数据导出</h2>
      <p class="page-subtitle">导出字盘、任务、批次等数据，支持 JSON 和 CSV 格式</p>

      <div class="sample-section">
        <div class="sample-title">
          <span>📤</span>
          <span>导出功能说明</span>
        </div>
        <p class="sample-desc">
          系统支持多维度数据导出，包括<span class="sample-tag">主记录</span>（字盘格位）、
          <span class="sample-tag">明细记录</span>（印刷任务、补刻计划）、
          <span class="sample-tag">历史记录</span>（状态变更）、
          <span class="sample-tag">结果记录</span>（补刻批次）。
          导出文件包含版本标识和时间戳，可用于存档或导入其他系统。
        </p>
      </div>

      <div class="layout-2col">
        <div>
          <div class="card">
            <h3 class="card-title">📦 选择导出内容</h3>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              {typeOptions.map(opt => (
                <label 
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    border: `2px solid ${exportType() === opt.value ? 'var(--color-wood)' : '#eee'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: exportType() === opt.value ? 'var(--color-wood-bg)' : 'white'
                  }}
                >
                  <input 
                    type="radio" 
                    name="exportType"
                    checked={exportType() === opt.value}
                    onChange={() => setExportType(opt.value)}
                    style="margin-top: 2px;"
                  />
                  <div>
                    <div style={{ fontWeight: '500', color: 'var(--color-ink)', marginBottom: '4px' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {opt.desc}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div class="card">
            <h3 class="card-title">📄 选择导出格式</h3>
            <div style="display: flex; gap: 12px;">
              <label style={{
                flex: 1,
                padding: '16px',
                border: `2px solid ${exportFormat() === 'json' ? 'var(--color-wood)' : '#eee'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                background: exportFormat() === 'json' ? 'var(--color-wood-bg)' : 'white'
              }}>
                <input 
                  type="radio" 
                  name="exportFormat"
                  checked={exportFormat() === 'json'}
                  onChange={() => setExportFormat('json')}
                  style="margin-bottom: 8px;"
                />
                <div style={{ fontWeight: '500' }}>JSON</div>
                <div style={{ fontSize: '11px', color: '#666' }}>结构化数据</div>
              </label>
              <label style={{
                flex: 1,
                padding: '16px',
                border: `2px solid ${exportFormat() === 'csv' ? 'var(--color-wood)' : '#eee'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                background: exportFormat() === 'csv' ? 'var(--color-wood-bg)' : 'white'
              }}>
                <input 
                  type="radio" 
                  name="exportFormat"
                  checked={exportFormat() === 'csv'}
                  onChange={() => setExportFormat('csv')}
                  style="margin-bottom: 8px;"
                />
                <div style={{ fontWeight: '500' }}>CSV</div>
                <div style={{ fontSize: '11px', color: '#666' }}>表格格式</div>
              </label>
            </div>
          </div>

          <div class="card">
            <button 
              class="btn btn-primary"
              style="width: 100%; padding: 14px; font-size: 15px;"
              onClick={doExport}
            >
              📥 立即导出
            </button>
            <p style="font-size: 11px; color: #999; text-align: center; margin-top: 8px;">
              文件将自动下载到本地
            </p>
          </div>
        </div>

        <div>
          <div class="detail-panel">
            <h3>ℹ️ 导出内容预览</h3>
            <div class="detail-row">
              <span class="detail-label">导出类型</span>
              <span class="detail-value">{typeOptions.find(t => t.value === exportType())?.label}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">文件格式</span>
              <span class="detail-value">{exportFormat().toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">文件名</span>
              <span class="detail-value" style="font-size: 11px; word-break: break-all;">
                woodtype-export-{exportType()}-{Date.now()}.{exportFormat()}
              </span>
            </div>
          </div>

          <div class="detail-panel" style="margin-top: 20px;">
            <h3>📋 导出数据结构</h3>
            <div style="font-size: 12px; color: #666; line-height: 1.8;">
              <p><strong>主记录：</strong>字盘格位表</p>
              <ul style="padding-left: 20px; margin: 4px 0 12px;">
                <li>tray_id - 字盘编号</li>
                <li>row / col - 行列位置</li>
                <li>character - 汉字</li>
                <li>status - 状态</li>
                <li>wear_level - 磨损度</li>
                <li>version - 版本号</li>
              </ul>
              
              <p><strong>明细记录：</strong>印刷任务 + 补刻计划</p>
              <ul style="padding-left: 20px; margin: 4px 0 12px;">
                <li>task_no / title - 任务信息</li>
                <li>required_chars - 所需汉字</li>
                <li>batch_no - 批次编号</li>
                <li>priority - 优先级</li>
              </ul>
              
              <p><strong>结果记录：</strong>补刻批次</p>
              <ul style="padding-left: 20px; margin: 4px 0 12px;">
                <li>total_chars - 总字数</li>
                <li>completed_chars - 完成数</li>
                <li>status - 批次状态</li>
                <li>version - 版本</li>
              </ul>
              
              <p><strong>历史记录：</strong>状态变更轨迹</p>
              <ul style="padding-left: 20px; margin: 4px 0;">
                <li>action_type - 操作类型</li>
                <li>old/new_status - 状态变更</li>
                <li>operator - 操作人</li>
                <li>timestamp - 时间戳</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
