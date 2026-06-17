@extends('layouts.app')
@section('title', $plate->plate_code . ' 版本历史')

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">
            <span class="badge badge-gold" style="font-size:16px;">{{ $plate->plate_code }}</span>
            版本与批次历史
        </div>
        <div class="page-subtitle">
            {{ $plate->pattern_name }} · 共 {{ $histories->count() }} 条历史记录
            · <a href="{{ route('plates.show', $plate) }}">← 返回详情</a>
        </div>
    </div>
</div>

<div class="grid-2">
    <div class="card">
        <div class="card-header">
            <div class="card-title">🔄 完整时间线</div>
        </div>
        <div class="card-body">
            @if($histories->count() > 0)
            <div class="timeline">
                @foreach($histories as $i => $vh)
                <div class="timeline-item">
                    <div class="timeline-date">
                        {{ $vh->changed_at->format('Y-m-d H:i') }}
                        <span class="text-muted">· 第 {{ $histories->count() - $i }} 版</span>
                    </div>
                    <div class="timeline-title">
                        <span style="font-size:18px;">{{ $vh->change_type_icon }}</span>
                        <span class="badge {{ $vh->change_type_badge_class }}">{{ $vh->change_type }}</span>
                        <span class="badge badge-gold">{{ $vh->version_code }}</span>
                        @if($vh->batch_number)
                            <span class="badge badge-secondary">{{ $vh->batch_number }}</span>
                        @endif
                    </div>
                    <div class="timeline-desc">{{ $vh->change_description }}</div>
                    <div class="timeline-meta">
                        <span>👤 {{ $vh->operator ?: '系统' }}</span>
                        @if($vh->plate_width)
                            <span>📐 {{ $vh->plate_width }}×{{ $vh->plate_height }} mm</span>
                        @endif
                        @if($vh->material)
                            <span>⚙️ {{ $vh->material }}</span>
                        @endif
                    </div>
                    @if($vh->snapshot_data && is_array($vh->snapshot_data))
                        @if(isset($vh->snapshot_data['changed_fields']) && !empty($vh->snapshot_data['changed_fields']))
                        <div class="mt-8" style="padding:8px 12px; background:#FFFBF2; border-radius:6px; font-size:11px;">
                            <span class="text-muted">变更字段:</span>
                            <span class="fw-bold text-gold">{{ implode(', ', $vh->snapshot_data['changed_fields']) }}</span>
                        </div>
                        @endif
                    @endif
                </div>
                @endforeach
            </div>
            @else
            <div class="empty-state">
                <div class="empty-state-icon">📜</div>
                <div>暂无版本历史</div>
            </div>
            @endif
        </div>
    </div>

    <div>
        <div class="card mb-20">
            <div class="card-header">
                <div class="card-title">📊 变更类型统计</div>
            </div>
            <div class="card-body">
                @php
                    $typeStats = $histories->groupBy('change_type')->map(fn($g) => $g->count());
                @endphp
                <div style="display:flex; flex-direction:column; gap:10px;">
                    @foreach($typeStats as $type => $count)
                        <div>
                            <div class="d-flex justify-between text-sm mb-4">
                                <span>{{ $type }}</span>
                                <span class="fw-bold">{{ $count }} 次</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill normal"
                                     style="width:{{ $histories->count()>0 ? $count/$histories->count()*100 : 0 }}%; background:var(--gold-gradient);"></div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">📋 信息导航</div>
            </div>
            <div class="card-body">
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <a href="{{ route('plates.show', $plate) }}" class="btn btn-secondary">📑 返回基础信息</a>
                    <a href="{{ route('plates.edit', $plate) }}" class="btn btn-secondary">✏️ 编辑档案</a>
                    <a href="{{ route('plates.show', $plate) }}#tab-orders" class="btn btn-secondary">📦 订单关联</a>
                    <a href="{{ route('plates.show', $plate) }}#tab-maint" class="btn btn-secondary">🛡️ 保养记录</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
