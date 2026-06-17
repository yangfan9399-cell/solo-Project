@extends('layouts.app')
@section('title', '工作台 - 烫金版管理工具')

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">工作台总览</div>
        <div class="page-subtitle">
            {{ now()->format('Y年m月d日 l') }} · 当前库存及状态实时监控
        </div>
    </div>
    <div class="d-flex gap-8 items-center">
        <a href="{{ route('plates.index') }}" class="btn btn-secondary">📚 查看台账</a>
        <a href="{{ route('plates.create') }}" class="btn btn-primary">➕ 新增烫金版</a>
        <a href="{{ route('plates.export') }}" class="btn btn-secondary">📥 导出CSV</a>
    </div>
</div>

<div class="stats-grid">
    <div class="stat-card" style="--accent-color: #DAA520; --accent-bg: rgba(218,165,32,0.1);">
        <div class="stat-icon">📚</div>
        <div class="stat-label">烫金版总库存</div>
        <div class="stat-value">{{ $totalPlates }}<small>件</small></div>
        <div class="stat-foot">其中在用 <span class="fw-bold text-gold">{{ $activePlates }}</span> 件 · 已报废 {{ $retiredPlates }} 件</div>
    </div>
    <div class="stat-card" style="--accent-color: #DC2626; --accent-bg: rgba(220,38,38,0.08);">
        <div class="stat-icon">⚠️</div>
        <div class="stat-label">需关注异常</div>
        <div class="stat-value text-danger">{{ $warningPlates }}<small>件</small></div>
        <div class="stat-foot">逾期保养 / 超量使用 / 维修中</div>
    </div>
    <div class="stat-card" style="--accent-color: #16A34A; --accent-bg: rgba(22,163,74,0.08);">
        <div class="stat-icon">🔥</div>
        <div class="stat-label">累计使用次数</div>
        <div class="stat-value">{{ number_format($totalUsage) }}<small>次</small></div>
        <div class="stat-foot">关联订单 <span class="fw-bold">{{ $totalOrders }}</span> 笔 · {{ number_format($totalOrderQuantity) }} 册</div>
    </div>
    <div class="stat-card" style="--accent-color: #6366F1; --accent-bg: rgba(99,102,241,0.08);">
        <div class="stat-icon">🛡️</div>
        <div class="stat-label">保养总投入</div>
        <div class="stat-value">¥{{ number_format($totalMaintenanceCost, 0) }}</div>
        <div class="stat-foot">平均单件 ¥{{ $totalPlates > 0 ? number_format($totalMaintenanceCost / $totalPlates, 1) : '0' }}</div>
    </div>
</div>

@if(!empty($abnormalities))
<div class="alert alert-danger mb-24">
    <span>🚨</span>
    <div style="flex:1;">
        <div class="fw-bold mb-8">检测到 {{ count($abnormalities) }} 条异常数据，需立即处理：</div>
        <div style="display:grid; gap:6px;">
            @foreach($abnormalities as $abn)
            <div class="d-flex items-center gap-12" style="padding:6px 0; border-bottom:1px dashed rgba(239,68,68,0.2);">
                <a href="{{ route('plates.show', $abn['plate']) }}" class="fw-bold" style="min-width:120px;">
                    {{ $abn['plate']->plate_code }}
                </a>
                <span class="text-muted" style="min-width:180px;">{{ $abn['plate']->pattern_name }}</span>
                <span>
                    @foreach($abn['issues'] as $issue)
                        <span class="badge badge-danger" style="margin-right:4px;">{{ $issue }}</span>
                    @endforeach
                </span>
            </div>
            @endforeach
        </div>
    </div>
</div>
@endif

<div class="grid-2-1 mb-24">
    <div>
        <div class="card">
            <div class="card-header">
                <div class="card-title">🔧 保养与维修状态面板</div>
                <a href="{{ route('plates.index', ['status' => 'warning']) }}" class="btn btn-sm btn-secondary">查看全部</a>
            </div>
            <div class="card-body">
                @if($pendingMaintenance->count() > 0 || $overdueMaintenance->count() > 0)
                <div class="mb-20">
                    <div class="fw-bold mb-12 text-warning" style="font-size:13px;">⏰ 保养逾期提醒 ({{ $overdueMaintenance->count() }})</div>
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>版号</th>
                                    <th>图案</th>
                                    <th>到期日</th>
                                    <th>逾期天数</th>
                                    <th>上次保养</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($overdueMaintenance as $plate)
                                <tr class="warning-row">
                                    <td class="fw-bold"><a href="{{ route('plates.show', $plate) }}">{{ $plate->plate_code }}</a></td>
                                    <td>{{ $plate->pattern_name }}</td>
                                    <td class="text-danger fw-bold">{{ $plate->next_maintenance_date->format('m-d') }}</td>
                                    <td><span class="badge badge-danger">{{ abs($plate->maintenance_days_left) }} 天</span></td>
                                    <td>{{ $plate->maintenances_count }} 次</td>
                                    <td><a href="{{ route('plates.show', $plate) }}#maint" class="btn btn-sm btn-primary">处理</a></td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>

                <div>
                    <div class="fw-bold mb-12 text-info" style="font-size:13px;">📋 进行中的保养工单 ({{ $pendingMaintenance->count() }})</div>
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>类型</th>
                                    <th>关联版号</th>
                                    <th>日期</th>
                                    <th>状态</th>
                                    <th>操作人</th>
                                    <th>备注</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($pendingMaintenance as $maint)
                                <tr>
                                    <td><span class="badge {{ $maint->maintenance_type_badge_class }}">{{ $maint->maintenance_type }}</span></td>
                                    <td class="fw-bold"><a href="{{ route('plates.show', $maint->plate) }}">{{ $maint->plate->plate_code }}</a></td>
                                    <td>{{ $maint->maintenance_date->format('Y-m-d') }}</td>
                                    <td><span class="badge {{ $maint->status_badge_class }}">{{ $maint->status }}</span></td>
                                    <td>{{ $maint->operator ?: '-' }}</td>
                                    <td class="text-muted" style="max-width:200px;">{{ \Illuminate\Support\Str::limit($maint->remark, 30) }}</td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                </div>
                @else
                <div class="empty-state">
                    <div class="empty-state-icon">✅</div>
                    <div>所有烫金版保养状态良好，无逾期工单</div>
                </div>
                @endif
            </div>
        </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:20px;">
        <div class="card">
            <div class="card-header">
                <div class="card-title">🔥 高频使用预警</div>
            </div>
            <div class="card-body">
                @if($highUsagePlates->count() > 0)
                <div style="display:flex; flex-direction:column; gap:12px;">
                    @foreach($highUsagePlates as $plate)
                    <div style="padding:10px 12px; border-radius:8px; background:#FFFBF2; border:1px solid var(--border);">
                        <div class="d-flex justify-between items-center mb-6">
                            <a href="{{ route('plates.show', $plate) }}" class="fw-bold">{{ $plate->plate_code }}</a>
                            @if($plate->usage_count > $plate->max_usage)
                                <span class="badge badge-danger">超上限</span>
                            @else
                                <span class="badge badge-warning">使用率 {{ $plate->usage_rate }}%</span>
                            @endif
                        </div>
                        <div class="text-sm text-muted mb-6">{{ \Illuminate\Support\Str::limit($plate->pattern_name, 18) }}</div>
                        <div class="progress-bar mb-4">
                            <div class="progress-fill {{ $plate->usage_rate >= 100 ? 'danger' : ($plate->usage_rate >= 85 ? 'warn' : 'normal') }}"
                                 style="width: {{ min(100, $plate->usage_rate) }}%"></div>
                        </div>
                        <div class="text-sm d-flex justify-between">
                            <span class="text-muted">{{ number_format($plate->usage_count) }} 次</span>
                            <span class="text-muted">/ {{ number_format($plate->max_usage) }} 次</span>
                        </div>
                    </div>
                    @endforeach
                </div>
                @else
                <div class="empty-state">
                    <div class="empty-state-icon">✨</div>
                    <div>当前无高频使用烫金版</div>
                </div>
                @endif
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">📊 材质与状态分布</div>
            </div>
            <div class="card-body">
                <div class="mb-16">
                    <div class="fw-bold text-sm mb-8">材质分布</div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        @foreach($materialStats as $mat => $cnt)
                        <div>
                            <div class="d-flex justify-between text-sm mb-4">
                                <span>{{ $mat }}</span>
                                <span class="fw-bold">{{ $cnt }} 件 ({{ $totalPlates>0 ? round($cnt/$totalPlates*100) : 0 }}%)</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill normal" style="width:{{ $totalPlates>0 ? $cnt/$totalPlates*100 : 0 }}%; background:linear-gradient(90deg, #DAA520, #B8860B);"></div>
                            </div>
                        </div>
                        @endforeach
                    </div>
                </div>
                <div>
                    <div class="fw-bold text-sm mb-8">状态分布</div>
                    <div class="d-flex flex-wrap gap-8">
                        @foreach($statusStats as $st => $cnt)
                            @php
                                $cls = match($st) {
                                    '正常' => 'badge-success',
                                    '待保养' => 'badge-warning',
                                    '维修中' => 'badge-info',
                                    '已报废' => 'badge-secondary',
                                    default => 'badge-secondary',
                                };
                            @endphp
                            <span class="badge {{ $cls }}" style="font-size:12px; padding:5px 12px;">{{ $st }} {{ $cnt }}</span>
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="grid-2 mb-24">
    <div class="card">
        <div class="card-header">
            <div class="card-title">📦 进行中订单</div>
            <a href="{{ route('plates.index') }}" class="btn btn-sm btn-secondary">台账</a>
        </div>
        <div class="card-body">
            @if($ongoingOrders->count() > 0)
            <div class="table-wrap">
                <table class="table">
                    <thead>
                        <tr>
                            <th>订单号</th>
                            <th>书名</th>
                            <th>版号</th>
                            <th>数量</th>
                            <th>交付期</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($ongoingOrders as $order)
                        <tr>
                            <td class="fw-bold"><span class="badge badge-gold">{{ $order->order_number }}</span></td>
                            <td>{{ \Illuminate\Support\Str::limit($order->book_title, 16) }}</td>
                            <td><a href="{{ route('plates.show', $order->plate) }}">{{ $order->plate->plate_code }}</a></td>
                            <td>{{ number_format($order->quantity) }}</td>
                            <td class="nowrap">
                                @if($order->delivery_date)
                                    @php $diff = $order->delivery_date->diffInDays(now(), false); @endphp
                                    <span class="{{ $diff < 0 ? 'text-danger' : ($diff < 7 ? 'text-warning' : '') }}">
                                        {{ $order->delivery_date->format('m-d') }}
                                        <small class="text-muted">({{ $diff < 0 ? '超'.abs($diff) : $diff.'天后' }})</small>
                                    </span>
                                @else - @endif
                            </td>
                            <td><span class="badge {{ $order->status_badge_class }}">{{ $order->status }}</span></td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            @else
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div>当前无进行中订单</div>
            </div>
            @endif
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">🕒 最近使用记录</div>
        </div>
        <div class="card-body">
            @if($recentlyUsed->count() > 0)
            <div style="display:flex; flex-direction:column; gap:10px;">
                @foreach($recentlyUsed as $idx => $plate)
                <div class="d-flex gap-12 items-center" style="padding:10px 12px; border-radius:8px; background:linear-gradient(90deg, #FFFBF2 0%, transparent 100%);">
                    <div style="width:32px; height:32px; border-radius:50%; background:var(--gold-gradient); color:#3D2914; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">
                        {{ $idx + 1 }}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div class="d-flex justify-between items-center">
                            <a href="{{ route('plates.show', $plate) }}" class="fw-bold">{{ $plate->plate_code }}</a>
                            @if($plate->is_warning)
                                <span class="badge badge-danger">异常</span>
                            @else
                                <span class="badge badge-success">正常</span>
                            @endif
                        </div>
                        <div class="text-sm text-muted mb-4">{{ \Illuminate\Support\Str::limit($plate->pattern_name, 20) }}</div>
                        <div class="text-sm text-muted">
                            上次使用: {{ $plate->last_used_at->format('m-d H:i') }} · 使用 {{ number_format($plate->usage_count) }} 次
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            @else
            <div class="empty-state">
                <div class="empty-state-icon">🕑</div>
                <div>暂无使用记录</div>
            </div>
            @endif
        </div>
    </div>
</div>

<div class="card">
    <div class="card-header">
        <div class="card-title">📜 快速操作指南</div>
    </div>
    <div class="card-body">
        <div class="detail-grid">
            <div class="detail-item">
                <div class="detail-label">1️⃣ 日常登记</div>
                <div class="detail-value">订单完成后在详情页登记使用次数，系统自动累计使用率和到期提醒</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">2️⃣ 保养流程</div>
                <div class="detail-value">详情页可新增保养记录，完成后自动更新下次保养日期及状态</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">3️⃣ 版本管理</div>
                <div class="detail-value">每次修改图案/尺寸自动生成版本快照，可在详情页查看历史</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">4️⃣ 导出摘要</div>
                <div class="detail-value">点击右上角导出，包含统计摘要与异常标记，支持 Excel 打开 CSV</div>
            </div>
        </div>
    </div>
</div>
@endsection
