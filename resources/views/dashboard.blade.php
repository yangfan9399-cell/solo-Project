@extends('layouts.app')

@section('title', '工作台 - 传统榨油坊批次压榨记录系统')
@section('page-title', '工作台')

@section('content')
    <div class="stat-grid mb-4">
        <div class="stat-card info">
            <div class="stat-label">总批次记录</div>
            <div class="stat-value">{{ $stats['total_batches'] }}</div>
        </div>
        <div class="stat-card success">
            <div class="stat-label">本月生产批次</div>
            <div class="stat-value">{{ $stats['this_month_batches'] }}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">累计出油量</div>
            <div class="stat-value">{{ $stats['total_oil_output'] }} <span class="text-sm text-muted">L</span></div>
        </div>
        <div class="stat-card success">
            <div class="stat-label">平均出油率</div>
            <div class="stat-value">{{ $stats['avg_oil_yield'] }} <span class="text-sm text-muted">%</span></div>
        </div>
        <div class="stat-card warning">
            <div class="stat-label">待处理异常数</div>
            <div class="stat-value">{{ $stats['anomaly_count'] }}</div>
        </div>
        <div class="stat-card danger">
            <div class="stat-label">严重异常批次</div>
            <div class="stat-value">{{ $stats['anomalous_batches'] }}</div>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">📈 各油料种类生产统计</div>
            <div class="text-sm text-muted">按油料类型分类汇总</div>
        </div>
        <div class="card-body">
            <div class="stat-grid">
                @foreach($seedTypes as $seedType)
                    @php($stat = $stats['seed_type_stats'][$seedType] ?? ['count' => 0, 'avg_yield' => 0, 'total_oil' => 0])
                    <div class="stat-card">
                        <div class="stat-label fw-bold">{{ $seedType }}油</div>
                        <div class="mt-2 text-sm">
                            <span class="text-muted">批次数：</span>
                            <span class="fw-bold">{{ $stat['count'] }}</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-muted">平均出油率：</span>
                            <span class="fw-bold">{{ $stat['avg_yield'] }}%</span>
                        </div>
                        <div class="text-sm">
                            <span class="text-muted">总出油量：</span>
                            <span class="fw-bold">{{ $stat['total_oil'] }}L</span>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">🕐 最近批次记录</div>
            <div class="btn-group">
                <a href="{{ route('batches.index') }}" class="btn btn-secondary btn-sm">查看全部</a>
                <a href="{{ route('batches.create') }}" class="btn btn-primary btn-sm">新建记录</a>
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            @if($stats['recent_batches']->isEmpty())
                <div class="text-center py-8">
                    <div style="font-size: 48px; color: #d4c4a8; margin-bottom: 12px;">🏺</div>
                    <div class="text-muted mb-2">暂无批次记录</div>
                    <div class="text-sm text-muted mb-4">点击下方按钮录入第一条压榨生产记录</div>
                    <a href="{{ route('batches.create') }}" class="btn btn-primary">📝 新建批次记录</a>
                </div>
            @else
                <table>
                    <thead>
                        <tr>
                            <th>批次编号</th>
                            <th>油料种类</th>
                            <th>生产日期</th>
                            <th>原料重量</th>
                            <th>出油率</th>
                            <th>操作员</th>
                            <th>异常</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($stats['recent_batches'] as $batch)
                            <tr>
                                <td>
                                    <span class="fw-bold">{{ $batch->batch_code }}</span>
                                    <div class="text-xs text-muted">v{{ $batch->version }}</div>
                                </td>
                                <td>{{ $batch->seed_type }}</td>
                                <td>{{ $batch->production_date->format('Y-m-d') }}</td>
                                <td>{{ $batch->seed_weight }} kg</td>
                                <td class="fw-bold">{{ $batch->oil_yield_rate }}%</td>
                                <td>{{ $batch->operator ?? '-' }}</td>
                                <td>
                                    @if($batch->unresolvedAnomalies->count() > 0)
                                        @php($highAnomalies = $batch->unresolvedAnomalies->where('anomaly_type', 'high')->count())
                                        @if($highAnomalies > 0)
                                            <span class="badge badge-danger">{{ $highAnomalies }} 严重</span>
                                        @else
                                            <span class="badge badge-warning">{{ $batch->unresolvedAnomalies->count() }} 异常</span>
                                        @endif
                                    @else
                                        <span class="badge badge-success">正常</span>
                                    @endif
                                </td>
                                <td>
                                    <a href="{{ route('batches.show', $batch) }}" class="btn btn-secondary btn-sm">详情</a>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">⚙️ 快速操作</div>
        </div>
        <div class="card-body">
            <div class="stat-grid">
                <a href="{{ route('batches.create') }}" class="stat-card text-decoration-none" style="cursor: pointer;">
                    <div class="stat-label fw-bold">➕ 新建批次记录</div>
                    <div class="mt-2 text-sm text-muted">录入新的压榨生产批次</div>
                </a>
                <a href="{{ route('batches.index') }}" class="stat-card text-decoration-none" style="cursor: pointer;">
                    <div class="stat-label fw-bold">🔍 筛选检索批次</div>
                    <div class="mt-2 text-sm text-muted">按条件查询历史批次记录</div>
                </a>
                <a href="{{ route('exports.summary.excel') }}" class="stat-card text-decoration-none" style="cursor: pointer;">
                    <div class="stat-label fw-bold">📊 导出汇总报表</div>
                    <div class="mt-2 text-sm text-muted">导出所有批次的CSV格式报表</div>
                </a>
                <a href="{{ route('exports.summary.pdf') }}" class="stat-card text-decoration-none" style="cursor: pointer;">
                    <div class="stat-label fw-bold">📄 导出PDF报告</div>
                    <div class="mt-2 text-sm text-muted">生成打印格式的汇总报告</div>
                </a>
            </div>
        </div>
    </div>
@endsection
