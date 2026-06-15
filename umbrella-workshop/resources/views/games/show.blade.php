@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1>☂️ 纸伞制作结果 — #{{ $game->id }}</h1>
    <p>关卡：{{ $game->level->name }} | 匠人：{{ $game->player_name }}</p>
</div>

<div class="grid grid-2">
    <div>
        <div class="card" style="text-align:center; {{ $game->status === 'completed' ? 'border-color: var(--success);' : 'border-color: var(--danger);' }}">
            <div style="font-size:64px; margin-bottom:12px;">{{ $game->status === 'completed' ? '🎉' : '😞' }}</div>
            <h2 style="border:none; padding:0; font-size:28px;">
                {{ $game->status === 'completed' ? '制作成功！' : '制作失败' }}
            </h2>
            <div style="font-size:48px; font-weight:900; color: {{ $game->status === 'completed' ? 'var(--success)' : 'var(--danger)' }}; margin:16px 0;">
                {{ $game->score }}分
            </div>
            <p class="text-muted">目标分数：{{ $game->level->target_score }}分</p>
        </div>

        <div class="card">
            <h2>📊 属性总览</h2>
            <table>
                <tr>
                    <th>属性</th>
                    <th>数值</th>
                    <th>进度</th>
                </tr>
                <tr>
                    <td>开合顺滑度</td>
                    <td>{{ $game->smoothness }}/100</td>
                    <td>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: {{ $game->smoothness }}%; background: {{ $game->smoothness >= 70 ? 'var(--success)' : ($game->smoothness >= 40 ? 'var(--warning)' : 'var(--danger)') }};"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>耐用度</td>
                    <td>{{ $game->total_durability }}</td>
                    <td>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: {{ min(100, $game->total_durability) }}%; background: {{ $game->total_durability >= 150 ? 'var(--success)' : ($game->total_durability >= 80 ? 'var(--warning)' : 'var(--danger)') }};"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>总成本</td>
                    <td>{{ $game->total_cost }}</td>
                    <td>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: {{ min(100, $game->total_cost) }}%; background: var(--warning);"></div>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td>湿度</td>
                    <td>{{ $game->humidity }}%</td>
                    <td>
                        <div class="stat-bar">
                            <div class="stat-bar-fill" style="width: {{ $game->humidity }}%; background: {{ $game->humidity <= 55 ? 'var(--success)' : ($game->humidity <= 70 ? 'var(--warning)' : 'var(--danger)') }};"></div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        <div class="card">
            <h2>🧵 材料搭配</h2>
            <table>
                <tr>
                    <th>类型</th>
                    <th>名称</th>
                    <th>费用</th>
                    <th>耐用</th>
                    <th>状态</th>
                </tr>
                <tr>
                    <td>伞骨</td>
                    <td>{{ $game->ribMaterial?->name ?? '-' }}</td>
                    <td>{{ $game->ribMaterial?->cost ?? 0 }}</td>
                    <td>{{ $game->ribMaterial?->durability ?? 0 }}</td>
                    <td>{{ $game->ribMaterial?->is_defective ? '<span class="badge badge-danger">缺陷</span>' : '<span class="badge badge-success">正常</span>' }}</td>
                </tr>
                <tr>
                    <td>伞面</td>
                    <td>{{ $game->surfaceMaterial?->name ?? '-' }}</td>
                    <td>{{ $game->surfaceMaterial?->cost ?? 0 }}</td>
                    <td>{{ $game->surfaceMaterial?->durability ?? 0 }}</td>
                    <td>{{ $game->surfaceMaterial?->is_defective ? '<span class="badge badge-danger">缺陷</span>' : '<span class="badge badge-success">正常</span>' }}</td>
                </tr>
                <tr>
                    <td>糊纸</td>
                    <td>{{ $game->paperMaterial?->name ?? '-' }}</td>
                    <td>{{ $game->paperMaterial?->cost ?? 0 }}</td>
                    <td>{{ $game->paperMaterial?->durability ?? 0 }}</td>
                    <td>{{ $game->paperMaterial?->is_defective ? '<span class="badge badge-danger">缺陷</span>' : '<span class="badge badge-success">正常</span>' }}</td>
                </tr>
            </table>
        </div>

        @if($game->details)
        <div class="card">
            <h2>🔄 工序详情</h2>
            <table>
                <tr>
                    <th>项目</th>
                    <th>详情</th>
                </tr>
                <tr>
                    <td>糊纸顺序</td>
                    <td>{{ implode(' → ', $game->details->pasting_order ?? []) }}</td>
                </tr>
                <tr>
                    <td>晾晒时间</td>
                    <td>{{ $game->details->drying_time }} 分钟</td>
                </tr>
                <tr>
                    <td>晾晒进度</td>
                    <td>{{ $game->details->actual_drying_progress }}%</td>
                </tr>
            </table>
        </div>
        @endif
    </div>

    <div>
        <div class="card">
            <h2>📜 湿度影响记录</h2>
            @if($game->histories->count() > 0)
            @foreach($game->histories as $history)
            <div class="card" style="background: #f5ede3; margin-bottom:8px;">
                <div class="flex flex-between">
                    <span class="badge badge-info">湿度 {{ $history->humidity }}%</span>
                    <span class="text-sm text-muted">{{ $history->created_at->format('H:i') }}</span>
                </div>
                <div class="mt-2 text-sm">
                    <strong>顺滑度变化：</strong>{{ $history->smoothness_before }} → {{ $history->smoothness_after }}
                    <span class="text-danger">(-{{ $history->smoothness_before - $history->smoothness_after }})</span>
                </div>
                <div class="text-sm text-muted mt-2">{{ $history->change_reason }}</div>
            </div>
            @endforeach
            @else
            <p class="text-muted text-sm">暂无湿度影响记录</p>
            @endif
        </div>

        <div class="card">
            <h2>💰 材料搭配影响</h2>
            @if($game->results->count() > 0)
            @foreach($game->results as $result)
            <div class="card" style="background: #f5ede3; margin-bottom:8px;">
                <div class="text-sm mb-2">
                    <strong>搭配：</strong>{{ $result->material_combo ? implode(' + ', $result->material_combo) : '-' }}
                </div>
                <div class="grid grid-2" style="gap:8px;">
                    <div>
                        <div class="text-sm"><strong>成本变化</strong></div>
                        <div class="text-sm">{{ $result->cost_before }} → {{ $result->cost_after }}</div>
                    </div>
                    <div>
                        <div class="text-sm"><strong>耐用变化</strong></div>
                        <div class="text-sm">{{ $result->durability_before }} → {{ $result->durability_after }}</div>
                    </div>
                </div>
                <div class="text-sm text-muted mt-2">{{ $result->change_reason }}</div>
            </div>
            @endforeach
            @else
            <p class="text-muted text-sm">暂无材料搭配影响记录</p>
            @endif
        </div>

        <div class="card">
            <h2>🔍 质检结果</h2>
            @if($game->qualityInspections->count() > 0)
            @foreach($game->qualityInspections as $inspection)
            <div class="card" style="background: #f5ede3; margin-bottom:8px; {{ $inspection->needs_rollback ? 'border-color: var(--warning);' : '' }}">
                <div class="flex flex-between">
                    <span class="badge {{ $inspection->result === 'pass' ? 'badge-success' : ($inspection->result === 'warning' ? 'badge-warning' : 'badge-danger') }}">
                        {{ $inspection->result === 'pass' ? '✅ 通过' : ($inspection->result === 'warning' ? '⚠️ 警告' : '❌ 不通过') }}
                    </span>
                    <span class="text-sm text-muted">{{ $inspection->inspection_type }} | {{ $inspection->created_at->format('H:i') }}</span>
                </div>
                <div class="text-sm mt-2"><strong>评分：</strong>{{ $inspection->score }}/100</div>
                <div class="text-sm mt-2">{{ $inspection->notes }}</div>
                @if($inspection->needs_rollback)
                <div class="alert alert-warning mt-2">⚠️ 此质检结果需要回滚重算</div>
                @endif
            </div>
            @endforeach

            @if($game->qualityInspections->where('needs_rollback', true)->count() > 0)
            <form action="{{ route('games.rollback', $game) }}" method="POST">
                @csrf
                <button type="submit" class="btn btn-warning" style="width:100%;">🔄 执行回滚重算</button>
            </form>
            @endif
            @else
            <p class="text-muted text-sm">暂无质检记录</p>
            @endif
        </div>

        <div class="card">
            <h2>📝 订单评价</h2>
            @if($game->orderEvaluations->count() > 0)
            @foreach($game->orderEvaluations as $evaluation)
            <div class="card" style="background: #f5ede3; margin-bottom:8px; {{ $evaluation->needs_recalc ? 'border-color: var(--warning);' : '' }}">
                <div class="flex flex-between">
                    <strong>{{ $evaluation->customer_name }}</strong>
                    <span class="badge {{ $evaluation->needs_recalc ? 'badge-warning' : 'badge-info' }}">
                        {{ $evaluation->needs_recalc ? '待重算' : '已确认' }}
                    </span>
                </div>
                <div class="text-sm mt-2">
                    <strong>满意度：</strong>{{ $evaluation->satisfaction }}/100 |
                    <strong>评分：</strong>{{ $evaluation->review_score }}/100
                </div>
                <div class="text-sm text-muted mt-2">"{{ $evaluation->comment }}"</div>
            </div>
            @endforeach
            @else
            <p class="text-muted text-sm">暂无订单评价</p>
            @endif
        </div>

        <div class="card">
            <h2>🖥️ 局次状态日志</h2>
            <div class="round-state-log">
                @json($game->round_state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
            </div>
        </div>
    </div>
</div>

<div class="mt-4 flex gap-4">
    <a href="{{ route('games.index') }}" class="btn btn-outline">← 返回作坊记录</a>
    <a href="{{ route('games.create') }}" class="btn btn-primary">开始新一局</a>
</div>
@endsection
