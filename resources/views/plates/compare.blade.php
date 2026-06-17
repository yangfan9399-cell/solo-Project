@extends('layouts.app')
@section('title', '版本对比 - ' . $plate->plate_code)

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">
            🔍 版本对比
            <span class="badge badge-gold" style="font-size:16px; padding:4px 12px;">{{ $plate->plate_code }}</span>
            <span style="vertical-align:middle;">{{ $plate->pattern_name }}</span>
        </div>
        <div class="page-subtitle">
            选择两个版本进行字段差异对比，查看烫金版的演进轨迹
            · <a href="{{ route('plates.show', $plate) }}" class="text-gold fw-bold">← 返回详情页</a>
            · <a href="{{ route('plates.versions', $plate) }}" class="text-gold">查看完整时间线</a>
        </div>
    </div>
    <a href="{{ route('plates.show', $plate) }}" class="btn btn-secondary">返回</a>
</div>

<div class="card mb-20">
    <div class="card-header">
        <div class="card-title">📋 选择对比版本</div>
        <span class="text-muted text-sm">选择两个版本查看变更差异</span>
    </div>
    <div class="card-body">
        <form method="GET" action="{{ route('plates.compare', $plate) }}">
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">较早版本（基准）<span class="required">*</span></label>
                    <select name="vh1" class="form-select" required>
                        <option value="">-- 请选择 --</option>
                        @foreach($histories as $vh)
                            <option value="{{ $vh->id }}" {{ (old('vh1', $vh1->id ?? '') == $vh->id) ? 'selected' : '' }}>
                                {{ $vh->version_code }} · {{ $vh->change_type }} · {{ $vh->changed_at->format('Y-m-d H:i') }} · {{ $vh->operator }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group" style="flex:1;">
                    <label class="form-label">较新版本（对比）<span class="required">*</span></label>
                    <select name="vh2" class="form-select" required>
                        <option value="">-- 请选择 --</option>
                        @foreach($histories as $vh)
                            <option value="{{ $vh->id }}" {{ (old('vh2', $vh2->id ?? '') == $vh->id) ? 'selected' : '' }}>
                                {{ $vh->version_code }} · {{ $vh->change_type }} · {{ $vh->changed_at->format('Y-m-d H:i') }} · {{ $vh->operator }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group" style="display:flex; align-items:flex-end;">
                    <button type="submit" class="btn btn-primary">🔍 开始对比</button>
                </div>
            </div>
        </form>
    </div>
</div>

@if($vh1 && $vh2)
<div class="stats-grid">
    <div class="stat-card" style="--accent-color:#6366F1;">
        <div class="stat-icon">📜</div>
        <div class="stat-label">基准版本</div>
        <div class="stat-value" style="font-size:20px;">{{ $vh1->version_code }}</div>
        <div class="stat-foot">{{ $vh1->change_type }} · {{ $vh1->changed_at->format('Y-m-d H:i') }}</div>
    </div>
    <div class="stat-card" style="--accent-color:#10B981;">
        <div class="stat-icon">📜</div>
        <div class="stat-label">对比版本</div>
        <div class="stat-value" style="font-size:20px;">{{ $vh2->version_code }}</div>
        <div class="stat-foot">{{ $vh2->change_type }} · {{ $vh2->changed_at->format('Y-m-d H:i') }}</div>
    </div>
    <div class="stat-card" style="--accent-color:#F59E0B;">
        <div class="stat-icon">📝</div>
        <div class="stat-label">变更字段</div>
        <div class="stat-value">{{ count($changes) }}<small>项</small></div>
        <div class="stat-foot">两版本间差异字段数</div>
    </div>
    <div class="stat-card" style="--accent-color:#DAA520;">
        <div class="stat-icon">⏱️</div>
        <div class="stat-label">时间间隔</div>
        <div class="stat-value">{{ $vh1->changed_at->diffInDays($vh2->changed_at) }}<small>天</small></div>
        <div class="stat-foot">{{ $vh1->changed_at->diffForHumans($vh2->changed_at, true) }}</div>
    </div>
</div>

<div class="card mb-20">
    <div class="card-header">
        <div class="card-title">📊 变更明细对比</div>
        <span class="text-sm text-muted">共 {{ count($changes) }} 项字段变更</span>
    </div>
    <div class="card-body">
        @if(count($changes) > 0)
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th style="width:150px;">字段</th>
                            <th style="width:35%;">基准版本 · {{ $vh1->version_code }}</th>
                            <th style="width:40px;"></th>
                            <th style="width:35%;">对比版本 · {{ $vh2->version_code }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($changes as $change)
                        <tr>
                            <td class="fw-bold">{{ $change['label'] }}</td>
                            <td>
                                <span style="color:#9CA3AF; text-decoration:line-through;">
                                    {{ $change['before'] === null || $change['before'] === '' ? '(空)' : e($change['before']) }}
                                </span>
                            </td>
                            <td style="text-align:center; font-size:18px;">→</td>
                            <td>
                                <span style="color:#15803d; font-weight:500;">
                                    {{ $change['after'] === null || $change['after'] === '' ? '(空)' : e($change['after']) }}
                                </span>
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        @else
            <div class="empty-state">
                <div class="empty-state-icon">✅</div>
                <div class="mb-4 fw-bold">两个版本完全一致，没有检测到字段差异</div>
                <div class="text-sm text-muted">{{ $vh1->version_code }} → {{ $vh2->version_code }} 期间没有字段变更记录</div>
            </div>
        @endif
    </div>
</div>

<div class="grid-2-1">
    <div class="card">
        <div class="card-header">
            <div class="card-title">📜 基准版本详情 · {{ $vh1->version_code }}</div>
        </div>
        <div class="card-body">
            <div class="d-flex gap-8 mb-12 flex-wrap">
                <span class="badge {{ $vh1->change_type_badge_class }}">{{ $vh1->change_type_icon }} {{ $vh1->change_type }}</span>
                <span class="badge badge-gold">{{ $vh1->version_code }}</span>
                @if($vh1->batch_number)
                    <span class="badge badge-secondary">{{ $vh1->batch_number }}</span>
                @endif
            </div>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">操作人</div><div class="detail-value">{{ $vh1->operator ?: '系统' }}</div></div>
                <div class="detail-item"><div class="detail-label">变更时间</div><div class="detail-value">{{ $vh1->changed_at->format('Y-m-d H:i:s') }}</div></div>
                <div class="detail-item"><div class="detail-label">铜版尺寸</div><div class="detail-value">{{ $vh1->plate_width }}×{{ $vh1->plate_height }} mm</div></div>
                <div class="detail-item"><div class="detail-label">材质</div><div class="detail-value">{{ $vh1->material }}</div></div>
            </div>
            <div class="mt-12">
                <div class="detail-label mb-4">变更说明</div>
                <div class="detail-value">{{ $vh1->change_description }}</div>
            </div>
        </div>
    </div>
    <div class="card">
        <div class="card-header">
            <div class="card-title">📜 对比版本详情 · {{ $vh2->version_code }}</div>
        </div>
        <div class="card-body">
            <div class="d-flex gap-8 mb-12 flex-wrap">
                <span class="badge {{ $vh2->change_type_badge_class }}">{{ $vh2->change_type_icon }} {{ $vh2->change_type }}</span>
                <span class="badge badge-gold">{{ $vh2->version_code }}</span>
                @if($vh2->batch_number)
                    <span class="badge badge-secondary">{{ $vh2->batch_number }}</span>
                @endif
            </div>
            <div class="detail-grid">
                <div class="detail-item"><div class="detail-label">操作人</div><div class="detail-value">{{ $vh2->operator ?: '系统' }}</div></div>
                <div class="detail-item"><div class="detail-label">变更时间</div><div class="detail-value">{{ $vh2->changed_at->format('Y-m-d H:i:s') }}</div></div>
                <div class="detail-item"><div class="detail-label">铜版尺寸</div><div class="detail-value">{{ $vh2->plate_width }}×{{ $vh2->plate_height }} mm</div></div>
                <div class="detail-item"><div class="detail-label">材质</div><div class="detail-value">{{ $vh2->material }}</div></div>
            </div>
            <div class="mt-12">
                <div class="detail-label mb-4">变更说明</div>
                <div class="detail-value">{{ $vh2->change_description }}</div>
            </div>
        </div>
    </div>
</div>
@else
<div class="card">
    <div class="card-body">
        <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <div class="mb-4 fw-bold">请选择两个版本开始对比</div>
            <div class="text-sm text-muted">从上方下拉框中选择基准版本和对比版本，系统将自动分析字段差异</div>
        </div>
    </div>
</div>
@endif
@endsection
