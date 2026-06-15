@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1>🔍 质检评价</h1>
    <p>质检结果与顾客订单评价，包括需要回滚重算的记录</p>
</div>

<div class="grid grid-2">
    <div class="card">
        <h2>🔍 质检结果</h2>
        @if($inspections->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>局次</th>
                    <th>关卡</th>
                    <th>类型</th>
                    <th>结果</th>
                    <th>评分</th>
                    <th>需回滚</th>
                    <th>备注</th>
                </tr>
            </thead>
            <tbody>
                @foreach($inspections as $inspection)
                <tr style="{{ $inspection->needs_rollback ? 'background: #fff8e1;' : '' }}">
                    <td>#{{ $inspection->game_id }}</td>
                    <td>{{ $inspection->game?->level?->name ?? '-' }}</td>
                    <td>{{ $inspection->inspection_type }}</td>
                    <td>
                        <span class="badge {{ $inspection->result === 'pass' ? 'badge-success' : ($inspection->result === 'warning' ? 'badge-warning' : 'badge-danger') }}">
                            {{ $inspection->result === 'pass' ? '通过' : ($inspection->result === 'warning' ? '警告' : '不通过') }}
                        </span>
                    </td>
                    <td class="fw-bold">{{ $inspection->score }}</td>
                    <td>
                        @if($inspection->needs_rollback)
                        <span class="badge badge-warning">⚠ 需回滚</span>
                        @else
                        <span class="badge badge-success">否</span>
                        @endif
                    </td>
                    <td class="text-sm" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ $inspection->notes }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-state">
            <div class="icon">🔍</div>
            <p>暂无质检记录</p>
        </div>
        @endif
    </div>

    <div class="card">
        <h2>📝 订单评价</h2>
        @if($evaluations->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>局次</th>
                    <th>关卡</th>
                    <th>顾客</th>
                    <th>满意度</th>
                    <th>评分</th>
                    <th>需重算</th>
                    <th>评价</th>
                </tr>
            </thead>
            <tbody>
                @foreach($evaluations as $evaluation)
                <tr style="{{ $evaluation->needs_recalc ? 'background: #fff8e1;' : '' }}">
                    <td>#{{ $evaluation->game_id }}</td>
                    <td>{{ $evaluation->game?->level?->name ?? '-' }}</td>
                    <td>{{ $evaluation->customer_name }}</td>
                    <td>
                        <span class="fw-bold {{ $evaluation->satisfaction >= 70 ? 'text-success' : 'text-danger' }}">{{ $evaluation->satisfaction }}</span>
                    </td>
                    <td class="fw-bold">{{ $evaluation->review_score }}</td>
                    <td>
                        @if($evaluation->needs_recalc)
                        <span class="badge badge-warning">⚠ 待重算</span>
                        @else
                        <span class="badge badge-success">已确认</span>
                        @endif
                    </td>
                    <td class="text-sm" style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ $evaluation->comment }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-state">
            <div class="icon">📝</div>
            <p>暂无订单评价</p>
        </div>
        @endif
    </div>
</div>

<div class="card mt-4">
    <h2>🔄 回滚与重算说明</h2>
    <div class="grid grid-3" style="gap:12px;">
        <div class="card" style="background: #e8f5e9;">
            <h3 style="color: var(--success);">✅ 正常完成样本</h3>
            <p class="text-sm">质检通过，订单评价确认，无需回滚。如种子样本#1（学徒试炼 - 张师傅）。</p>
        </div>
        <div class="card" style="background: #fde8e8;">
            <h3 style="color: var(--danger);">❌ 材料异常样本</h3>
            <p class="text-sm">材料批次缺陷导致质检失败，但不需要回滚重算，因为评分逻辑本身是正确的。如种子样本#2（匠人考验 - 王匠人）。</p>
        </div>
        <div class="card" style="background: #fff8e1;">
            <h3 style="color: var(--warning);">⚠️ 回滚重算样本</h3>
            <p class="text-sm">湿度在65%-75%之间时，质检评分可能被重复计算湿度惩罚，需要回滚重算。如种子样本#3（大师挑战 - 陈大师）。在局次详情页可执行回滚操作。</p>
        </div>
    </div>
</div>

<div class="mt-4">
    <a href="{{ route('games.index') }}" class="btn btn-outline">← 返回作坊记录</a>
</div>
@endsection
