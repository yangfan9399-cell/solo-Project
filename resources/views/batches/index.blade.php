@extends('layouts.app')

@section('title', '批次台账 - 传统榨油坊批次压榨记录系统')
@section('page-title', '批次台账')

@section('content')
    <div class="card">
        <div class="card-header">
            <div class="card-title">🔎 筛选条件</div>
            <a href="{{ route('batches.index') }}" class="btn btn-secondary btn-sm">重置筛选</a>
        </div>
        <div class="card-body">
            <form method="GET" action="{{ route('batches.index') }}">
                <div class="filter-form">
                    <div class="form-group mb-0">
                        <label class="form-label">关键词搜索</label>
                        <input type="text" name="search" class="form-input" placeholder="批次号/溯源码/操作员" value="{{ $filters['search'] ?? '' }}">
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">油料种类</label>
                        <select name="seed_type" class="form-input">
                            <option value="">全部</option>
                            @foreach($seedTypes as $type)
                                <option value="{{ $type }}" {{ ($filters['seed_type'] ?? '') == $type ? 'selected' : '' }}>{{ $type }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">异常状态</label>
                        <select name="has_anomaly" class="form-input">
                            <option value="">全部</option>
                            <option value="yes" {{ ($filters['has_anomaly'] ?? '') == 'yes' ? 'selected' : '' }}>有异常</option>
                            <option value="no" {{ ($filters['has_anomaly'] ?? '') == 'no' ? 'selected' : '' }}>正常</option>
                        </select>
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">状态</label>
                        <select name="status" class="form-input">
                            <option value="">全部</option>
                            <option value="active" {{ ($filters['status'] ?? '') == 'active' ? 'selected' : '' }}>活跃</option>
                            <option value="archived" {{ ($filters['status'] ?? '') == 'archived' ? 'selected' : '' }}>已归档</option>
                        </select>
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">生产日期起</label>
                        <input type="date" name="date_from" class="form-input" value="{{ $filters['date_from'] ?? '' }}">
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">生产日期止</label>
                        <input type="date" name="date_to" class="form-input" value="{{ $filters['date_to'] ?? '' }}">
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">出油率最低(%)</label>
                        <input type="number" name="yield_min" step="0.01" class="form-input" placeholder="如: 30" value="{{ $filters['yield_min'] ?? '' }}">
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">出油率最高(%)</label>
                        <input type="number" name="yield_max" step="0.01" class="form-input" placeholder="如: 50" value="{{ $filters['yield_max'] ?? '' }}">
                    </div>
                    <div class="form-group mb-0">
                        <label class="form-label">&nbsp;</label>
                        <div class="btn-group">
                            <button type="submit" class="btn btn-primary">筛选</button>
                            <a href="{{ route('batches.index') }}" class="btn btn-secondary">重置</a>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">📋 批次列表 <span class="text-sm text-muted">(共 {{ $batches->total() }} 条记录)</span></div>
            <div class="btn-group">
                <a href="{{ route('exports.summary.excel', request()->all()) }}" class="btn btn-secondary btn-sm">导出CSV</a>
                <a href="{{ route('batches.create') }}" class="btn btn-primary btn-sm">新建记录</a>
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            <table>
                <thead>
                    <tr>
                        <th>批次编号</th>
                        <th>溯源码</th>
                        <th>油料</th>
                        <th>生产日期</th>
                        <th>原料(kg)</th>
                        <th>水分(%)</th>
                        <th>炒温(℃)</th>
                        <th>压力(MPa)</th>
                        <th>出油(L)</th>
                        <th>出油率</th>
                        <th>沉淀(h)</th>
                        <th>操作员</th>
                        <th>状态</th>
                        <th>异常</th>
                        <th>版本</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($batches as $batch)
                        <tr>
                            <td>
                                <a href="{{ route('batches.show', $batch) }}" class="fw-bold text-decoration-none" style="color: #8b5a2b;">{{ $batch->batch_code }}</a>
                            </td>
                            <td class="text-xs text-muted" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ $batch->trace_code }}</td>
                            <td>{{ $batch->seed_type }}</td>
                            <td>{{ $batch->production_date->format('m-d') }}</td>
                            <td>{{ $batch->seed_weight }}</td>
                            <td>{{ $batch->moisture_content }}</td>
                            <td>{{ $batch->roasting_temperature }}</td>
                            <td>{{ $batch->pressing_pressure }}</td>
                            <td>{{ $batch->oil_output }}</td>
                            <td class="fw-bold">{{ $batch->oil_yield_rate }}%</td>
                            <td>{{ $batch->settling_time }}</td>
                            <td>{{ $batch->operator ?? '-' }}</td>
                            <td>
                                <span class="badge {{ status_badge_class($batch->status) }}">{{ status_badge_label($batch->status) }}</span>
                            </td>
                            <td>
                                @php($unresolved = $batch->unresolvedAnomalies->count())
                                @if($unresolved > 0)
                                    @php($high = $batch->unresolvedAnomalies->where('anomaly_type', 'high')->count())
                                    @if($high > 0)
                                        <span class="badge badge-danger">{{ $high }} 严重</span>
                                    @else
                                        <span class="badge badge-warning">{{ $unresolved }} 项</span>
                                    @endif
                                @else
                                    <span class="badge badge-success">正常</span>
                                @endif
                            </td>
                            <td class="text-sm">v{{ $batch->version }}</td>
                            <td>
                                <div class="btn-group">
                                    <a href="{{ route('batches.show', $batch) }}" class="btn btn-secondary btn-sm">查看</a>
                                    <a href="{{ route('batches.edit', $batch) }}" class="btn btn-primary btn-sm">编辑</a>
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    {{ $batches->appends($filters)->links() }}
@endsection
