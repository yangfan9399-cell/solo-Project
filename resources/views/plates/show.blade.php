@extends('layouts.app')
@section('title', $plate->plate_code . ' - ' . $plate->pattern_name)

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">
            <span class="badge badge-gold" style="font-size:16px; padding:6px 16px;">{{ $plate->plate_code }}</span>
            <span style="vertical-align:middle;">{{ $plate->pattern_name }}</span>
        </div>
        <div class="page-subtitle">
            @php
                $stClass = match($plate->status) {
                    '正常' => 'badge-success',
                    '待保养' => 'badge-warning',
                    '维修中' => 'badge-info',
                    '已报废' => 'badge-secondary',
                    default => 'badge-secondary',
                };
            @endphp
            <span class="badge {{ $stClass }}">{{ $plate->status }}</span>
            @if($plate->is_high_usage && $plate->status !== '已报废')
                <span class="badge badge-warning" style="margin-left:6px;">🔥 高频使用</span>
            @endif
            @if($plate->is_overdue_maintenance && $plate->status !== '已报废')
                <span class="badge badge-danger" style="margin-left:6px;">⏰ 保养逾期</span>
            @endif
            <span style="margin-left:8px;">
                版本: <span class="fw-bold">{{ $currentVersion->version_code ?? 'V1.0' }}</span>
                · 创建于 {{ $plate->created_at->format('Y-m-d') }}
                · 最近使用 {{ $plate->last_used_at ? $plate->last_used_at->format('Y-m-d H:i') : '暂无记录' }}
            </span>
        </div>
    </div>
    <div class="d-flex gap-8 flex-wrap">
        <button type="button" class="btn btn-secondary" onclick="togglePanel('usagePanel')">📝 登记使用</button>
        <a href="{{ route('plates.edit', $plate) }}" class="btn btn-primary">✏️ 编辑信息</a>
        <a href="{{ route('plates.export') }}" class="btn btn-secondary">📥 导出</a>
        <a href="{{ route('plates.index') }}" class="btn btn-secondary">← 返回台账</a>
    </div>
</div>

@if($plate->is_warning)
<div class="alert alert-warning mb-20">
    <span>⚠️</span>
    <div>
        @if($plate->is_overdue_maintenance)
            <div>保养已于 <span class="fw-bold">{{ $plate->next_maintenance_date->format('Y-m-d') }}</span> 到期，逾期 {{ abs($plate->maintenance_days_left) }} 天，请尽快处理</div>
        @endif
        @if($plate->usage_count > $plate->max_usage)
            <div>使用次数超出设计上限 <span class="fw-bold">{{ $plate->usage_count - $plate->max_usage }}</span> 次，建议安排更换或修复</div>
        @elseif($plate->is_high_usage)
            <div>使用率已达 <span class="fw-bold">{{ $plate->usage_rate }}%</span>，接近设计寿命，请注意图案质量</div>
        @endif
        @if($plate->status === '维修中')
            <div>当前烫金版正处于维修状态，请勿用于生产订单</div>
        @endif
    </div>
</div>
@endif

<div id="usagePanel" class="sub-panel mb-20" style="display:none;">
    <div class="sub-panel-title">📝 登记使用次数（直接添加到累计次数，用于快速登记小批量生产）</div>
    <form method="POST" action="{{ route('plates.usage', $plate) }}">
        @csrf
        <div class="form-row">
            <div class="form-group" style="max-width:200px;">
                <label class="form-label">使用次数<span class="required">*</span></label>
                <input type="number" name="count" class="form-control" value="100" min="1" required>
            </div>
            <div class="form-group" style="flex:1;">
                <label class="form-label">备注说明</label>
                <input type="text" name="note" class="form-control" placeholder="订单号、书名等">
            </div>
            <div class="form-group" style="display:flex; align-items:flex-end;">
                <button type="submit" class="btn btn-primary">确认登记</button>
            </div>
        </div>
    </form>
</div>

<div class="stats-grid">
    <div class="stat-card" style="--accent-color:#DAA520;">
        <div class="stat-icon">📐</div>
        <div class="stat-label">铜版尺寸</div>
        <div class="stat-value" style="font-size:20px;">{{ $plate->plate_width }}×{{ $plate->plate_height }}</div>
        <div class="stat-foot">厚度 {{ $plate->plate_thickness }} mm · {{ $plate->material }}</div>
    </div>
    @php
        $levelColors = ['normal' => '#16A34A', 'warn' => '#F59E0B', 'danger' => '#DC2626'];
    @endphp
    <div class="stat-card" style="--accent-color:{{ $levelColors[$plate->usage_level] }};">
        <div class="stat-icon">📊</div>
        <div class="stat-label">使用进度</div>
        <div class="stat-value">{{ $plate->usage_rate }}<small>%</small></div>
        <div class="stat-foot">{{ number_format($plate->usage_count) }} / {{ number_format($plate->max_usage) }} 次</div>
    </div>
    <div class="stat-card" style="--accent-color:#6366F1;">
        <div class="stat-icon">📋</div>
        <div class="stat-label">关联订单</div>
        <div class="stat-value">{{ $plate->orders->count() }}<small>单</small></div>
        <div class="stat-foot">{{ number_format($totalOrderQty) }} 册 · ¥{{ number_format($totalOrderValue) }}</div>
    </div>
    <div class="stat-card" style="--accent-color:#0EA5E9;">
        <div class="stat-icon">🛡️</div>
        <div class="stat-label">保养记录</div>
        <div class="stat-value">{{ $plate->maintenances->count() }}<small>次</small></div>
        <div class="stat-foot">总投入 ¥{{ number_format($totalMaintenanceCost) }}</div>
    </div>
</div>

<div class="grid-2-1 mb-24">
    <div>
        <div class="tabs">
            <button class="tab active" data-target="tab-basic">📋 基础信息</button>
            <button class="tab" data-target="tab-orders">📦 订单关联 ({{ $plate->orders->count() }})</button>
            <button class="tab" data-target="tab-versions">🔄 版本/批次历史 ({{ $plate->versionHistories->count() }})</button>
            <button class="tab" data-target="tab-maint" id="maint-tab">🛡️ 保养记录 ({{ $plate->maintenances->count() }})</button>
        </div>

        <div id="tab-basic" class="tab-section active">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📋 详细档案信息</div>
                </div>
                <div class="card-body">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">版号编码</div>
                            <div class="detail-value fw-bold">{{ $plate->plate_code }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">图案名称</div>
                            <div class="detail-value fw-bold">{{ $plate->pattern_name }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">图案描述</div>
                            <div class="detail-value">{{ $plate->pattern_description ?: '—' }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">铜版尺寸</div>
                            <div class="detail-value">{{ $plate->plate_size }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">材质</div>
                            <div class="detail-value">{{ $plate->material }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">当前状态</div>
                            <div class="detail-value"><span class="badge {{ $stClass }}">{{ $plate->status }}</span></div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">存放位置</div>
                            <div class="detail-value">{{ $plate->location ?: '未登记' }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">制作日期</div>
                            <div class="detail-value">{{ $plate->manufacture_date ? $plate->manufacture_date->format('Y-m-d') : '—' }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">累计使用</div>
                            <div class="detail-value">
                                <span class="fw-bold">{{ number_format($plate->usage_count) }}</span> 次
                                <small class="text-muted">/ 上限 {{ number_format($plate->max_usage) }}</small>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">最近使用</div>
                            <div class="detail-value">{{ $plate->last_used_at ? $plate->last_used_at->format('Y-m-d H:i') : '暂无记录' }}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">下次保养</div>
                            <div class="detail-value">
                                @if($plate->next_maintenance_date && $plate->status !== '已报废')
                                    <span class="{{ $plate->is_overdue_maintenance ? 'text-danger fw-bold' : '' }}">
                                        {{ $plate->next_maintenance_date->format('Y-m-d') }}
                                        <small class="text-muted">
                                            ({{ $plate->maintenance_days_left < 0 ? '逾期'.abs($plate->maintenance_days_left).'天' : $plate->maintenance_days_left.'天后' }})
                                        </small>
                                    </span>
                                @else
                                    <span class="text-muted">未设定</span>
                                @endif
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">档案创建</div>
                            <div class="detail-value">{{ $plate->created_at->format('Y-m-d H:i') }}</div>
                        </div>
                        <div class="detail-item" style="grid-column:1 / -1;">
                            <div class="detail-label">🎯 适用书名 ({{ count($plate->applicable_books_array) }} 本)</div>
                            <div class="detail-value">
                                <div class="tag-list">
                                    @foreach($plate->applicable_books_array as $book)
                                        <span class="tag" style="font-size:12px;">📖 {{ $book }}</span>
                                    @endforeach
                                </div>
                            </div>
                        </div>
                        <div class="detail-item" style="grid-column:1 / -1;">
                            <div class="detail-label">📝 备注说明</div>
                            <div class="detail-value" style="background:#FFFBF2; padding:10px 12px; border-radius:6px; border:1px dashed var(--border);">
                                {{ $plate->remark ?: '暂无备注' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="tab-orders" class="tab-section">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">📦 关联订单记录</div>
                    <button type="button" class="btn btn-sm btn-primary" onclick="togglePanel('addOrderPanel')">➕ 新增订单</button>
                </div>
                <div id="addOrderPanel" class="card-body" style="border-bottom:1px solid var(--border); display:none; background:#FFFBF2;">
                    <div class="sub-panel-title">新增关联订单</div>
                    @if($errors->has('order_error'))
                        <div class="alert alert-danger">{{ $errors->first('order_error') }}</div>
                    @endif
                    <form method="POST" action="{{ route('plates.orders.store', $plate) }}">
                        @csrf
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">订单号<span class="required">*</span></label>
                                <input type="text" name="order_number" class="form-control @error('order_number') is-invalid @enderror" placeholder="例：OR-2026-0618-001" required value="{{ old('order_number') }}">
                                @error('order_number')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">书名<span class="required">*</span></label>
                                <input type="text" name="book_title" class="form-control @error('book_title') is-invalid @enderror" placeholder="书籍全称" required value="{{ old('book_title') }}">
                                @error('book_title')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">客户名称</label>
                                <input type="text" name="customer_name" class="form-control" value="{{ old('customer_name') }}">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">数量<span class="required">*</span></label>
                                <input type="number" name="quantity" class="form-control @error('quantity') is-invalid @enderror" min="1" value="{{ old('quantity', 1000) }}" required>
                                @error('quantity')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">单价 (元)</label>
                                <input type="number" name="unit_price" class="form-control @error('unit_price') is-invalid @enderror" step="0.01" min="0" value="{{ old('unit_price') }}">
                                @error('unit_price')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">下单日期<span class="required">*</span></label>
                                <input type="date" name="order_date" class="form-control @error('order_date') is-invalid @enderror" required value="{{ old('order_date', now()->format('Y-m-d')) }}">
                                @error('order_date')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">交付日期</label>
                                <input type="date" name="delivery_date" class="form-control @error('delivery_date') is-invalid @enderror" value="{{ old('delivery_date') }}">
                                @error('delivery_date')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">状态<span class="required">*</span></label>
                                <select name="status" class="form-select @error('status') is-invalid @enderror" required>
                                    @foreach(['进行中', '已完成', '已延期', '已取消'] as $st)
                                    <option value="{{ $st }}" {{ old('status', '进行中') === $st ? 'selected' : '' }}>{{ $st }}</option>
                                    @endforeach
                                </select>
                                <div class="form-hint">选择「已完成」会自动累计使用次数</div>
                                @error('status')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-textarea" rows="2">{{ old('remark') }}</textarea>
                        </div>
                        <div class="d-flex gap-8">
                            <button type="submit" class="btn btn-primary">创建订单</button>
                            <button type="button" class="btn btn-secondary" onclick="togglePanel('addOrderPanel')">取消</button>
                        </div>
                    </form>
                </div>
                <div class="card-body" style="padding:0;">
                    @if($plate->orders->count() > 0)
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>订单号</th>
                                    <th>书名</th>
                                    <th>客户</th>
                                    <th>数量</th>
                                    <th>金额</th>
                                    <th>下单</th>
                                    <th>交付</th>
                                    <th>状态</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($plate->orders->sortByDesc('order_date')->values() as $order)
                                <tr>
                                    <td class="fw-bold"><span class="badge badge-gold">{{ $order->order_number }}</span></td>
                                    <td>{{ \Illuminate\Support\Str::limit($order->book_title, 20) }}</td>
                                    <td class="text-muted">{{ $order->customer_name ?: '—' }}</td>
                                    <td class="nowrap">{{ number_format($order->quantity) }}</td>
                                    <td>
                                        @if($order->total_amount !== null)
                                            ¥{{ number_format($order->total_amount, 2) }}
                                        @else <span class="text-muted">—</span> @endif
                                    </td>
                                    <td class="nowrap">{{ $order->order_date->format('Y-m-d') }}</td>
                                    <td class="nowrap">
                                        @if($order->delivery_date)
                                            {{ $order->delivery_date->format('Y-m-d') }}
                                        @else <span class="text-muted">—</span> @endif
                                    </td>
                                    <td><span class="badge {{ $order->status_badge_class }}">{{ $order->status }}</span></td>
                                    <td>
                                        @if($order->status !== '已完成')
                                        <form method="POST" action="{{ route('orders.status', $order) }}" style="display:inline;">
                                            @csrf @method('PUT')
                                            <input type="hidden" name="status" value="已完成">
                                            <button type="submit" class="btn btn-sm btn-success" data-confirm="确定标记订单 {{ $order->order_number }} 为已完成？系统将自动累计使用次数">✓ 完成</button>
                                        </form>
                                        @endif
                                    </td>
                                </tr>
                                @if($order->remark)
                                <tr>
                                    <td colspan="9" style="background:#FFFBF2; padding:8px 14px;" class="text-muted text-sm">
                                        💬 {{ $order->remark }}
                                    </td>
                                </tr>
                                @endif
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    @else
                    <div class="empty-state">
                        <div class="empty-state-icon">📦</div>
                        <div>暂无关联订单，点击上方新增按钮登记</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <div id="tab-versions" class="tab-section">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🔄 版本与批次历史时间线</div>
                </div>
                <div class="card-body">
                    @if($plate->versionHistories->count() > 0)
                    <div class="timeline">
                        @foreach($plate->versionHistories as $i => $vh)
                        <div class="timeline-item">
                            <div class="timeline-date">
                                {{ $vh->changed_at->format('Y-m-d H:i') }}
                                <span class="text-muted">· 第 {{ $plate->versionHistories->count() - $i }} 版</span>
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
                                @if($vh->snapshot_data && is_array($vh->snapshot_data) && isset($vh->snapshot_data['changed_fields']))
                                    <span>📝 变更: {{ implode(', ', $vh->snapshot_data['changed_fields']) }}</span>
                                @endif
                            </div>
                        </div>
                        @endforeach
                    </div>
                    @else
                    <div class="empty-state">
                        <div class="empty-state-icon">📜</div>
                        <div>暂无版本历史记录</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>

        <div id="tab-maint" class="tab-section">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🛡️ 保养记录</div>
                    <button type="button" class="btn btn-sm btn-primary" onclick="togglePanel('addMaintPanel')">➕ 新增保养</button>
                </div>
                <div id="addMaintPanel" class="card-body" style="border-bottom:1px solid var(--border); display:none; background:#FFFBF2;">
                    <div class="sub-panel-title">新增保养记录（完成后自动更新下次保养日期）</div>
                    @if($errors->has('maint_error'))
                        <div class="alert alert-danger">{{ $errors->first('maint_error') }}</div>
                    @endif
                    <form method="POST" action="{{ route('plates.maintenances.store', $plate) }}">
                        @csrf
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">保养类型<span class="required">*</span></label>
                                <select name="maintenance_type" class="form-select @error('maintenance_type') is-invalid @enderror" required>
                                    @foreach(['日常清洁', '防锈处理', '抛光修复', '图案修复', '深度保养', '更换重做'] as $type)
                                    <option value="{{ $type }}" {{ old('maintenance_type', '日常清洁') === $type ? 'selected' : '' }}>{{ $type }}</option>
                                    @endforeach
                                </select>
                                @error('maintenance_type')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">保养状态<span class="required">*</span></label>
                                <select name="status" class="form-select @error('status') is-invalid @enderror" required>
                                    @foreach(['已完成', '进行中', '待处理'] as $st)
                                    <option value="{{ $st }}" {{ old('status', '已完成') === $st ? 'selected' : '' }}>{{ $st }}</option>
                                    @endforeach
                                </select>
                                @error('status')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">保养日期<span class="required">*</span></label>
                                <input type="date" name="maintenance_date" class="form-control @error('maintenance_date') is-invalid @enderror" required value="{{ old('maintenance_date', now()->format('Y-m-d')) }}">
                                @error('maintenance_date')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">操作人</label>
                                <input type="text" name="operator" class="form-control" value="{{ old('operator') }}" placeholder="例：张师傅">
                            </div>
                            <div class="form-group">
                                <label class="form-label">成本 (元)</label>
                                <input type="number" name="cost" class="form-control @error('cost') is-invalid @enderror" step="0.01" min="0" value="{{ old('cost', 0) }}">
                                @error('cost')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                            <div class="form-group">
                                <label class="form-label">下次保养</label>
                                <input type="date" name="next_maintenance_date" class="form-control @error('next_maintenance_date') is-invalid @enderror" value="{{ old('next_maintenance_date') }}">
                                <div class="form-hint">仅当状态为「已完成」时自动更新版号信息</div>
                                @error('next_maintenance_date')<div class="form-error">{{ $message }}</div>@enderror
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">保养详情描述</label>
                            <textarea name="description" class="form-textarea @error('description') is-invalid @enderror" rows="2" placeholder="详细说明保养操作内容">{{ old('description') }}</textarea>
                            @error('description')<div class="form-error">{{ $message }}</div>@enderror
                        </div>
                        <div class="form-group">
                            <label class="form-label">备注</label>
                            <textarea name="remark" class="form-textarea" rows="2">{{ old('remark') }}</textarea>
                        </div>
                        <div class="d-flex gap-8">
                            <button type="submit" class="btn btn-primary">保存记录</button>
                            <button type="button" class="btn btn-secondary" onclick="togglePanel('addMaintPanel')">取消</button>
                        </div>
                    </form>
                </div>
                <div class="card-body" style="padding:0;">
                    @if($plate->maintenances->count() > 0)
                    <div class="table-wrap">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>日期</th>
                                    <th>类型</th>
                                    <th>详情</th>
                                    <th>操作人</th>
                                    <th>成本</th>
                                    <th>状态</th>
                                    <th>下次保养</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($plate->maintenances as $m)
                                <tr>
                                    <td class="nowrap">{{ $m->maintenance_date->format('Y-m-d') }}</td>
                                    <td><span class="badge {{ $m->maintenance_type_badge_class }}">{{ $m->maintenance_type }}</span></td>
                                    <td style="min-width:200px;">
                                        <div>{{ \Illuminate\Support\Str::limit($m->description, 30) ?: '—' }}</div>
                                        @if($m->remark)
                                            <div class="text-sm text-muted mt-4">💬 {{ \Illuminate\Support\Str::limit($m->remark, 30) }}</div>
                                        @endif
                                    </td>
                                    <td>{{ $m->operator ?: '—' }}</td>
                                    <td>¥{{ number_format($m->cost, 2) }}</td>
                                    <td><span class="badge {{ $m->status_badge_class }}">{{ $m->status }}</span></td>
                                    <td class="nowrap">
                                        @if($m->next_maintenance_date)
                                            {{ $m->next_maintenance_date->format('Y-m-d') }}
                                        @else <span class="text-muted">—</span> @endif
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                    @else
                    <div class="empty-state">
                        <div class="empty-state-icon">🛡️</div>
                        <div>暂无保养记录，点击上方新增按钮登记首次保养</div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>

    <div>
        <div class="card mb-20">
            <div class="card-header">
                <div class="card-title">📊 使用状况</div>
            </div>
            <div class="card-body">
                <div class="mb-16">
                    <div class="d-flex justify-between text-sm mb-6">
                        <span>累计使用 <span class="fw-bold">{{ number_format($plate->usage_count) }}</span> 次</span>
                        <span>设计上限 <span class="fw-bold">{{ number_format($plate->max_usage) }}</span> 次</span>
                    </div>
                    <div class="progress-bar" style="height:16px; border-radius:8px;">
                        <div class="progress-fill {{ $plate->usage_level }}"
                             style="width: {{ min(100, $plate->usage_rate) }}%; border-radius:8px;"></div>
                    </div>
                    <div class="d-flex justify-between mt-6">
                        <span class="text-sm text-muted">使用率: <span class="fw-bold {{ $plate->usage_level === 'danger' ? 'text-danger' : ($plate->usage_level === 'warn' ? 'text-warning' : '') }}">{{ $plate->usage_rate }}%</span></span>
                        <span class="text-sm text-muted">
                            @if($plate->is_over_usage)
                                <span class="text-danger">已超上限 {{ $plate->usage_count - $plate->max_usage }} 次</span>
                            @else
                                剩余 {{ number_format($plate->max_usage - $plate->usage_count) }} 次额度
                            @endif
                        </span>
                    </div>
                </div>
                <div class="detail-grid" style="font-size:13px;">
                    <div class="detail-item">
                        <div class="detail-label">总订单数</div>
                        <div class="detail-value">{{ $plate->orders->count() }} 单</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">总生产册数</div>
                        <div class="detail-value">{{ number_format($totalOrderQty) }} 册</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">订单总额</div>
                        <div class="detail-value">¥{{ number_format($totalOrderValue, 2) }}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">平均单量</div>
                        <div class="detail-value">
                            {{ $plate->orders->count() > 0 ? number_format($totalOrderQty / $plate->orders->count()) : 0 }} 册/单
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mb-20">
            <div class="card-header">
                <div class="card-title">🏷️ 当前版本快照</div>
            </div>
            <div class="card-body">
                @if($currentVersion)
                <div style="display:flex; flex-direction:column; gap:8px; font-size:13px;">
                    <div class="d-flex justify-between">
                        <span class="text-muted">版本号</span>
                        <span class="badge badge-gold">{{ $currentVersion->version_code }}</span>
                    </div>
                    <div class="d-flex justify-between">
                        <span class="text-muted">批次号</span>
                        <span class="fw-bold">{{ $currentVersion->batch_number ?: '—' }}</span>
                    </div>
                    <div class="d-flex justify-between">
                        <span class="text-muted">变更类型</span>
                        <span class="badge {{ $currentVersion->change_type_badge_class }}">{{ $currentVersion->change_type }}</span>
                    </div>
                    <div class="d-flex justify-between">
                        <span class="text-muted">操作人</span>
                        <span>{{ $currentVersion->operator ?: '系统' }}</span>
                    </div>
                    <div class="d-flex justify-between">
                        <span class="text-muted">变更时间</span>
                        <span class="nowrap">{{ $currentVersion->changed_at->format('Y-m-d H:i') }}</span>
                    </div>
                    <div class="mt-8" style="padding:10px; background:#FFFBF2; border-radius:6px; border:1px dashed var(--border);">
                        <div class="text-muted mb-4 text-sm">变更描述</div>
                        <div>{{ $currentVersion->change_description }}</div>
                    </div>
                </div>
                @else
                <div class="text-muted text-sm">暂无版本记录</div>
                @endif
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">⚠️ 危险操作区</div>
            </div>
            <div class="card-body">
                <div class="d-flex justify-between items-center gap-16 flex-wrap" style="padding:10px; background:#FEF2F2; border:1px dashed #FECACA; border-radius:8px;">
                    <div>
                        <div class="fw-bold text-danger">删除烫金版档案</div>
                        <div class="text-sm text-muted">将同时删除所有关联订单、版本历史、保养记录，不可恢复</div>
                    </div>
                    <form method="POST" action="{{ route('plates.destroy', $plate) }}" data-confirm="确定永久删除烫金版 {{ $plate->plate_code }} 及其所有关联数据？此操作不可撤销！">
                        @csrf @method('DELETE')
                        <button type="submit" class="btn btn-danger">🗑️ 确认删除</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    var isOrderSubmit = {{ old('order_number') !== null ? 'true' : 'false' }};
    var isMaintSubmit = {{ old('maintenance_type') !== null ? 'true' : 'false' }};
    var hasOrderError = isOrderSubmit && {!! $errors->any() ? 'true' : 'false' !!};
    var hasMaintError = isMaintSubmit && {!! $errors->any() ? 'true' : 'false' !!};

    if (hasOrderError) {
        setTimeout(function() {
            var tab = document.querySelector('[data-target="tab-orders"]');
            if (tab) tab.click();
            var panel = document.getElementById('addOrderPanel');
            if (panel) panel.style.display = 'block';
        }, 50);
    }
    if (hasMaintError) {
        setTimeout(function() {
            var tab = document.querySelector('[data-target="tab-maint"]');
            if (tab) tab.click();
            var panel = document.getElementById('addMaintPanel');
            if (panel) panel.style.display = 'block';
        }, 50);
    }
});
</script>
@endsection
