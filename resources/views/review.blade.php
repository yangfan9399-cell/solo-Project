@extends('layouts.app')
@section('title', '复盘聚合 - 烫金版管理工具')

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">📈 复盘聚合</div>
        <div class="page-subtitle">
            全库烫金版状态分布、版本演进与投入产出的宏观汇总分析
            · <a href="{{ route('dashboard') }}" class="text-gold fw-bold">← 返回工作台</a>
        </div>
    </div>
</div>

<div class="stats-grid">
    <div class="stat-card" style="--accent-color:#DAA520;">
        <div class="stat-icon">📋</div>
        <div class="stat-label">烫金版总数</div>
        <div class="stat-value">{{ $totalPlates }}<small>件</small></div>
        <div class="stat-foot">在用 {{ $activePlates }} · 异常 {{ $warningPlates }}</div>
    </div>
    <div class="stat-card" style="--accent-color:#10B981;">
        <div class="stat-icon">⏱️</div>
        <div class="stat-label">累计使用</div>
        <div class="stat-value">{{ number_format($totalUsage) }}<small>次</small></div>
        <div class="stat-foot">版本 {{ $totalVersions }} 次迭代</div>
    </div>
    <div class="stat-card" style="--accent-color:#6366F1;">
        <div class="stat-icon">📦</div>
        <div class="stat-label">关联订单</div>
        <div class="stat-value">{{ $totalOrders }}<small>单</small></div>
        <div class="stat-foot">{{ number_format($totalOrderQty) }} 册印刷</div>
    </div>
    <div class="stat-card" style="--accent-color:#0EA5E9;">
        <div class="stat-icon">🛡️</div>
        <div class="stat-label">保养投入</div>
        <div class="stat-value">¥{{ number_format($totalMaintenanceCost) }}</div>
        <div class="stat-foot">{{ $totalMaintenances }} 次保养作业</div>
    </div>
</div>

<div class="grid-2-1 mb-20">
    <div class="card">
        <div class="card-header">
            <div class="card-title">📊 全库状态分布</div>
        </div>
        <div class="card-body">
            <div class="mb-12">
                @foreach(['正常', '待保养', '维修中', '待审批', '已驳回', '待归档', '已归档', '已报废'] as $st)
                    @php $count = $statusStats[$st] ?? 0; @endphp
                    @if($count > 0 || in_array($st, ['正常', '待保养', '已归档']))
                    <div class="mb-8">
                        <div class="d-flex justify-between mb-4">
                            <span class="fw-bold">{{ $st }}</span>
                            <span class="text-muted">{{ $count }} 件 · {{ $totalPlates > 0 ? round(($count / $totalPlates) * 100, 1) : 0 }}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill {{ $st === '正常' ? 'normal' : ($st === '已报废' || $st === '已归档' ? '' : 'warn') }}"
                                 style="width: {{ $totalPlates > 0 ? min(100, ($count / $totalPlates) * 100) : 0 }}%"></div>
                        </div>
                    </div>
                    @endif
                @endforeach
            </div>
            <div class="grid-3-3 mt-16">
                <div class="stat-card stat-card-sm" style="--accent-color:#3B82F6;">
                    <div class="stat-icon">📝</div>
                    <div class="stat-label">待审批</div>
                    <div class="stat-value">{{ $pendingApproval }}</div>
                </div>
                <div class="stat-card stat-card-sm" style="--accent-color:#8B5CF6;">
                    <div class="stat-icon">📦</div>
                    <div class="stat-label">待归档</div>
                    <div class="stat-value">{{ $pendingArchive }}</div>
                </div>
                <div class="stat-card stat-card-sm" style="--accent-color:#6B7280;">
                    <div class="stat-icon">📥</div>
                    <div class="stat-label">已归档/报废</div>
                    <div class="stat-value">{{ $retiredPlates }}</div>
                </div>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <div class="card-title">🔄 版本变更类型分布</div>
        </div>
        <div class="card-body">
            @foreach($versionTypeStats as $type => $count)
            <div class="mb-8">
                <div class="d-flex justify-between mb-4">
                    <span class="fw-bold">{{ $type }}</span>
                    <span class="text-muted">{{ $count }} 次</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill warn" style="width: {{ $totalVersions > 0 ? min(100, ($count / $totalVersions) * 100) : 0 }}%"></div>
                </div>
            </div>
            @endforeach
            @if(empty($versionTypeStats))
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div>暂无版本变更数据</div>
            </div>
            @endif
        </div>
    </div>
</div>

<div class="grid-2-1 mb-20">
    <div class="card">
        <div class="card-header">
            <div class="card-title">🕒 最近变更时间线</div>
        </div>
        <div class="card-body" style="max-height:480px; overflow-y:auto;">
            @if($recentChanges->count() > 0)
            <div class="timeline">
                @foreach($recentChanges as $i => $vh)
                <div class="timeline-item">
                    <div class="timeline-date">
                        {{ $vh->changed_at->format('Y-m-d H:i') }}
                    </div>
                    <div class="timeline-title">
                        <span style="font-size:16px;">{{ $vh->change_type_icon }}</span>
                        <span class="badge {{ $vh->change_type_badge_class }}">{{ $vh->change_type }}</span>
                        <span class="badge badge-gold">{{ $vh->version_code }}</span>
                    </div>
                    <div class="timeline-desc">
                        <a href="{{ route('plates.show', $vh->plate) }}" class="fw-bold">{{ $vh->plate->plate_code }}</a>
                        · {{ $vh->plate->pattern_name }}
                    </div>
                    <div class="timeline-meta">
                        <span>👤 {{ $vh->operator ?: '系统' }}</span>
                    </div>
                </div>
                @endforeach
            </div>
            @else
            <div class="empty-state">
                <div class="empty-state-icon">📜</div>
                <div>暂无变更记录</div>
            </div>
            @endif
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <div class="card-title">🏆 高频使用 Top 5</div>
            <span class="text-sm text-muted">按关联订单数排序</span>
        </div>
        <div class="card-body">
            @if($highValuePlates->count() > 0)
                @foreach($highValuePlates as $i => $plate)
                <div class="mb-12 pb-12" style="border-bottom:1px solid var(--border); {{ $loop->last ? 'border-bottom:none; padding-bottom:0;' : '' }}">
                    <div class="d-flex justify-between mb-4">
                        <div>
                            <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; background:var(--gold-gradient); color:#fff; border-radius:50%; font-size:12px; font-weight:bold; margin-right:8px;">{{ $i + 1 }}</span>
                            <a href="{{ route('plates.show', $plate) }}" class="fw-bold">
                                <span class="badge badge-gold" style="font-size:11px;">{{ $plate->plate_code }}</span>
                                {{ $plate->pattern_name }}
                            </a>
                        </div>
                        <span class="badge badge-info">{{ $plate->orders_count }} 单</span>
                    </div>
                    <div class="text-sm text-muted">
                        {{ $plate->material }} · {{ $plate->plate_width }}×{{ $plate->plate_height }} mm · 使用率 {{ $plate->usage_rate }}%
                    </div>
                    <div class="progress-bar mt-6" style="height:8px;">
                        <div class="progress-fill {{ $plate->usage_level }}" style="width: {{ min(100, $plate->usage_rate) }}%"></div>
                    </div>
                </div>
                @endforeach
            @else
            <div class="empty-state">
                <div class="empty-state-icon">🏆</div>
                <div>暂无数据</div>
            </div>
            @endif
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <div class="card-title">📋 全库状态一览</div>
    </div>
    <div class="card-body">
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>版号</th>
                        <th>图案</th>
                        <th>状态</th>
                        <th>使用率</th>
                        <th>版本</th>
                        <th>订单</th>
                        <th>下次保养</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach(App\Models\Plate::orderBy('updated_at', 'desc')->get() as $plate)
                    @php
                        $rowClass = '';
                        if ($plate->is_retired) $rowClass = 'retired-row';
                        elseif ($plate->is_warning) $rowClass = 'warning-row';
                    @endphp
                    <tr class="{{ $rowClass }}">
                        <td><span class="badge badge-gold" style="font-size:11px;">{{ $plate->plate_code }}</span></td>
                        <td>{{ $plate->pattern_name }}</td>
                        <td><span class="badge {{ $plate->status_badge_class }}">{{ $plate->status }}</span></td>
                        <td>
                            <div class="d-flex align-items-center gap-8">
                                <div class="progress-bar" style="width:80px; height:8px;">
                                    <div class="progress-fill {{ $plate->usage_level }}" style="width: {{ min(100, $plate->usage_rate) }}%"></div>
                                </div>
                                <span class="text-sm">{{ $plate->usage_rate }}%</span>
                            </div>
                        </td>
                        <td>{{ $plate->versionHistories->count() }} 版</td>
                        <td>{{ $plate->orders->count() }} 单</td>
                        <td class="nowrap">
                            @if(!$plate->is_retired && $plate->next_maintenance_date)
                                <div class="fw-bold {{ $plate->is_overdue_maintenance ? 'text-danger' : '' }}">
                                    {{ $plate->next_maintenance_date->format('m-d') }}
                                </div>
                                <div class="text-sm text-muted">{{ $plate->maintenance_status_text }}</div>
                            @else
                                <span class="text-muted">—</span>
                            @endif
                        </td>
                        <td>
                            <a href="{{ route('plates.show', $plate) }}" class="text-gold fw-bold text-sm">查看</a>
                            @if($plate->can_edit)
                                · <a href="{{ route('plates.edit', $plate) }}" class="text-sm">编辑</a>
                            @endif
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
