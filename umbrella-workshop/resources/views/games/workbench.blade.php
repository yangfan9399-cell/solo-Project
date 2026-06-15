@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1>🔧 工序台 — #{{ $game->id }}</h1>
    <p>关卡：{{ $game->level->name }} | 匠人：{{ $game->player_name }} | 湿度：{{ $game->humidity }}%</p>
</div>

<div class="step-indicator">
    <div class="step {{ $game->rib_material_id ? 'done' : 'active' }}">① 选伞骨</div>
    <div class="step {{ $game->surface_material_id ? 'done' : ($game->rib_material_id ? 'active' : '') }}">② 选伞面</div>
    <div class="step {{ $game->paper_material_id ? 'done' : ($game->surface_material_id ? 'active' : '') }}">③ 选糊纸</div>
    <div class="step {{ $game->details && $game->details->pasting_order ? 'done' : ($game->paper_material_id ? 'active' : '') }}">④ 糊纸顺序</div>
    <div class="step {{ $game->status === 'drying' || $game->status === 'completed' || $game->status === 'failed' ? 'done' : ($game->details && $game->details->pasting_order ? 'active' : '') }}">⑤ 晾晒</div>
    <div class="step {{ in_array($game->status, ['completed', 'failed']) ? 'done' : '' }}">⑥ 结算</div>
</div>

<div class="grid grid-2">
    <div>
        <div class="card">
            <h2>🌡️ 当前环境湿度</h2>
            <div class="humidity-meter">
                <div class="humidity-indicator" style="left: {{ $game->humidity }}%;"></div>
            </div>
            <div class="humidity-label">
                <span>0% 干燥</span>
                <span><strong>{{ $game->humidity }}%</strong></span>
                <span>100% 潮湿</span>
            </div>
            @if($game->humidity > 65)
            <div class="alert alert-warning mt-2">⚠️ 湿度偏高，竹骨可能膨胀，影响开合顺滑度</div>
            @elseif($game->humidity < 40)
            <div class="alert alert-info mt-2">💡 湿度偏低，竹骨微缩，对开合影响较小</div>
            @else
            <div class="alert alert-success mt-2">✅ 湿度适中，有利于纸伞制作</div>
            @endif
        </div>

        <div class="card">
            <h2>🦴 选择伞骨</h2>
            <div class="grid grid-1" style="gap:8px;">
                @foreach($ribs as $rib)
                <div class="material-card {{ $game->rib_material_id == $rib->id ? 'selected' : '' }} {{ $rib->is_defective ? 'defective' : '' }}">
                    <div class="flex flex-between">
                        <div>
                            <div class="name">{{ $rib->name }}</div>
                            <div class="meta">批次：{{ $rib->batch_code }} | 费用：{{ $rib->cost }} | 耐用：{{ $rib->durability }}</div>
                            @if($rib->is_defective)
                            <div class="mt-2"><span class="defect-tag">⚠ 缺陷：{{ $rib->defect_description }}</span></div>
                            @endif
                        </div>
                        @if(!$game->rib_material_id || $game->rib_material_id != $rib->id)
                        <form action="{{ route('games.select-rib', $game) }}" method="POST">
                            @csrf
                            <input type="hidden" name="rib_material_id" value="{{ $rib->id }}">
                            <button type="submit" class="btn btn-primary btn-sm">选择</button>
                        </form>
                        @elseif($game->rib_material_id == $rib->id)
                        <span class="badge badge-success">已选</span>
                        @endif
                    </div>
                </div>
                @endforeach
            </div>
        </div>

        <div class="card">
            <h2>🎭 选择伞面</h2>
            @if(!$game->rib_material_id)
            <div class="alert alert-info">请先选择伞骨</div>
            @else
            <div class="grid grid-1" style="gap:8px;">
                @foreach($surfaces as $surface)
                <div class="material-card {{ $game->surface_material_id == $surface->id ? 'selected' : '' }} {{ $surface->is_defective ? 'defective' : '' }}">
                    <div class="flex flex-between">
                        <div>
                            <div class="name">{{ $surface->name }}</div>
                            <div class="meta">批次：{{ $surface->batch_code }} | 费用：{{ $surface->cost }} | 耐用：{{ $surface->durability }}</div>
                            @if($surface->is_defective)
                            <div class="mt-2"><span class="defect-tag">⚠ 缺陷：{{ $surface->defect_description }}</span></div>
                            @endif
                        </div>
                        @if(!$game->surface_material_id || $game->surface_material_id != $surface->id)
                        <form action="{{ route('games.select-surface', $game) }}" method="POST">
                            @csrf
                            <input type="hidden" name="surface_material_id" value="{{ $surface->id }}">
                            <button type="submit" class="btn btn-primary btn-sm">选择</button>
                        </form>
                        @elseif($game->surface_material_id == $surface->id)
                        <span class="badge badge-success">已选</span>
                        @endif
                    </div>
                </div>
                @endforeach
            </div>
            @endif
        </div>

        <div class="card">
            <h2>📄 选择糊纸</h2>
            @if(!$game->surface_material_id)
            <div class="alert alert-info">请先选择伞面</div>
            @else
            <div class="grid grid-1" style="gap:8px;">
                @foreach($papers as $paper)
                <div class="material-card {{ $game->paper_material_id == $paper->id ? 'selected' : '' }} {{ $paper->is_defective ? 'defective' : '' }}">
                    <div class="flex flex-between">
                        <div>
                            <div class="name">{{ $paper->name }}</div>
                            <div class="meta">批次：{{ $paper->batch_code }} | 费用：{{ $paper->cost }} | 耐用：{{ $paper->durability }}</div>
                            @if($paper->is_defective)
                            <div class="mt-2"><span class="defect-tag">⚠ 缺陷：{{ $paper->defect_description }}</span></div>
                            @endif
                        </div>
                        @if(!$game->paper_material_id || $game->paper_material_id != $paper->id)
                        <form action="{{ route('games.select-paper', $game) }}" method="POST">
                            @csrf
                            <input type="hidden" name="paper_material_id" value="{{ $paper->id }}">
                            <button type="submit" class="btn btn-primary btn-sm">选择</button>
                        </form>
                        @elseif($game->paper_material_id == $paper->id)
                        <span class="badge badge-success">已选</span>
                        @endif
                    </div>
                </div>
                @endforeach
            </div>
            @endif
        </div>
    </div>

    <div>
        <div class="card">
            <h2>📋 当前选择</h2>
            <table>
                <tr>
                    <th>项目</th>
                    <th>选择</th>
                </tr>
                <tr>
                    <td>伞骨</td>
                    <td>{{ $game->ribMaterial ? $game->ribMaterial->name . ($game->ribMaterial->is_defective ? ' ⚠️' : '') : '未选择' }}</td>
                </tr>
                <tr>
                    <td>伞面</td>
                    <td>{{ $game->surfaceMaterial ? $game->surfaceMaterial->name . ($game->surfaceMaterial->is_defective ? ' ⚠️' : '') : '未选择' }}</td>
                </tr>
                <tr>
                    <td>糊纸</td>
                    <td>{{ $game->paperMaterial ? $game->paperMaterial->name . ($game->paperMaterial->is_defective ? ' ⚠️' : '') : '未选择' }}</td>
                </tr>
            </table>
        </div>

        @if($game->paper_material_id)
        <div class="card">
            <h2>🔄 糊纸顺序</h2>
            <p class="text-sm text-muted mb-2">拖拽或按顺序点击排列工序（最优顺序影响顺滑度）</p>
            <form action="{{ route('games.pasting-order', $game) }}" method="POST" id="pastingForm">
                @csrf
                <div id="pastingOrderList">
                    <div class="pasting-order-item">
                        <span class="step-num">1</span>
                        <select name="pasting_order[]" class="pasting-select" style="flex:1;">
                            <option value="骨架固定">骨架固定</option>
                            <option value="伞面铺展">伞面铺展</option>
                            <option value="糊纸贴合">糊纸贴合</option>
                            <option value="收拢整形">收拢整形</option>
                        </select>
                    </div>
                    <div class="pasting-order-item">
                        <span class="step-num">2</span>
                        <select name="pasting_order[]" class="pasting-select" style="flex:1;">
                            <option value="骨架固定">骨架固定</option>
                            <option value="伞面铺展">伞面铺展</option>
                            <option value="糊纸贴合">糊纸贴合</option>
                            <option value="收拢整形">收拢整形</option>
                        </select>
                    </div>
                    <div class="pasting-order-item">
                        <span class="step-num">3</span>
                        <select name="pasting_order[]" class="pasting-select" style="flex:1;">
                            <option value="骨架固定">骨架固定</option>
                            <option value="伞面铺展">伞面铺展</option>
                            <option value="糊纸贴合">糊纸贴合</option>
                            <option value="收拢整形">收拢整形</option>
                        </select>
                    </div>
                    <div class="pasting-order-item">
                        <span class="step-num">4</span>
                        <select name="pasting_order[]" class="pasting-select" style="flex:1;">
                            <option value="骨架固定">骨架固定</option>
                            <option value="伞面铺展">伞面铺展</option>
                            <option value="糊纸贴合">糊纸贴合</option>
                            <option value="收拢整形">收拢整形</option>
                        </select>
                    </div>
                </div>
                @if(!$game->details || !$game->details->pasting_order)
                <button type="submit" class="btn btn-success mt-2" style="width:100%;">确认糊纸顺序</button>
                @else
                <div class="alert alert-success mt-2">✅ 糊纸顺序已设定</div>
                @endif
            </form>
        </div>
        @endif

        @if($game->details && $game->details->pasting_order)
        <div class="card">
            <h2>☀️ 设定晾晒时间</h2>
            <p class="text-sm text-muted mb-2">最佳晾晒时间：90-150分钟</p>
            <form action="{{ route('games.drying-time', $game) }}" method="POST">
                @csrf
                <div class="form-group">
                    <label>晾晒时间（分钟）</label>
                    <input type="number" name="drying_time" min="30" max="300" value="{{ $game->details->drying_time ?: 120 }}" @if($game->status === 'drying' || $game->status === 'completed' || $game->status === 'failed') disabled @endif>
                </div>
                @if(!in_array($game->status, ['drying', 'completed', 'failed']))
                <button type="submit" class="btn btn-warning" style="width:100%;">开始晾晒</button>
                @endif
            </form>
            @if($game->details && $game->details->actual_drying_progress > 0)
            <div class="mt-2">
                <div class="text-sm"><strong>晾晒进度：</strong>{{ $game->details->actual_drying_progress }}%</div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: {{ $game->details->actual_drying_progress }}%; background: {{ $game->details->actual_drying_progress >= 80 ? 'var(--success)' : 'var(--warning)' }};"></div>
                </div>
            </div>
            @endif
        </div>
        @endif

        @if($game->status === 'drying')
        <div class="card">
            <h2>🎯 完成制作</h2>
            <p class="text-sm text-muted mb-2">晾晒完成，可以进行最终结算</p>
            <form action="{{ route('games.finalize', $game) }}" method="POST">
                @csrf
                <button type="submit" class="btn btn-primary" style="width:100%; font-size:16px; padding:12px;">☂️ 提交质检并结算</button>
            </form>
        </div>
        @endif
    </div>
</div>

<div class="mt-4">
    <a href="{{ route('games.index') }}" class="btn btn-outline">← 返回作坊记录</a>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const selects = document.querySelectorAll('.pasting-select');
    selects.forEach((select, index) => {
        select.addEventListener('change', function() {
            selects.forEach((otherSelect, otherIndex) => {
                if (otherIndex !== index) {
                    const options = otherSelect.querySelectorAll('option');
                    options.forEach(opt => {
                        opt.disabled = (opt.value === select.value && otherIndex !== index);
                    });
                }
            });
        });
    });

    const existingOrder = @json($game->details?->pasting_order);
    if (existingOrder) {
        selects.forEach((select, index) => {
            if (existingOrder[index]) {
                select.value = existingOrder[index];
                select.dispatchEvent(new Event('change'));
            }
        });
    }
});
</script>
@endsection
