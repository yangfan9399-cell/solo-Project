@extends('layouts.app')

@section('title', $batch->batch_code . ' - 批次详情')
@section('page-title', '批次详情 - ' . $batch->batch_code)

@section('content')
    <div class="btn-group mb-4" style="justify-content: flex-end;">
        <a href="{{ route('batches.index') }}" class="btn btn-secondary">返回台账</a>
        <a href="{{ route('versions.index', $batch) }}" class="btn btn-secondary">版本历史</a>
        <a href="{{ route('exports.batch.excel', $batch) }}" class="btn btn-secondary">导出CSV</a>
        <a href="{{ route('exports.batch.pdf', $batch) }}" class="btn btn-secondary">导出PDF</a>
        <a href="{{ route('batches.edit', $batch) }}" class="btn btn-primary">编辑此批次</a>
    </div>

    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">📌 批次基本信息</div>
                <div class="text-sm text-muted mt-1">
                    <span class="badge {{ status_badge_class($batch->status) }}">{{ status_badge_label($batch->status) }}</span>
                    <span class="ml-2">当前版本: v{{ $batch->version }}</span>
                </div>
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">批次编号</div>
                    <div class="detail-value">{{ $batch->batch_code }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">溯源码</div>
                    <div class="code-block">{{ $batch->trace_code }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">油料种类</div>
                    <div class="detail-value">{{ $batch->seed_type }}（{{ $batch->seed_type_label }}）</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">生产日期</div>
                    <div class="detail-value">{{ $batch->production_date->format('Y年m月d日') }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">操作员</div>
                    <div class="detail-value">{{ $batch->operator ?? '未记录' }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">创建时间</div>
                    <div class="detail-value">{{ $batch->created_at->format('Y-m-d H:i') }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">更新时间</div>
                    <div class="detail-value">{{ $batch->updated_at->format('Y-m-d H:i') }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">版本历史</div>
                    <div class="detail-value">
                        <a href="{{ route('versions.index', $batch) }}" style="color: #8b5a2b;">共 {{ $batch->versions->count() }} 个版本 →</a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">📊 工艺参数详情</div>
            <div class="text-sm text-muted">当前标准为 {{ $batch->seed_type }} 油传统工艺参考值</div>
        </div>
        <div class="card-body" style="padding: 0;">
            <table>
                <thead>
                    <tr>
                        <th>参数项目</th>
                        <th>实际数值</th>
                        <th>标准范围</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $paramFields = [
                            ['label' => '原料重量', 'field' => 'seed_weight', 'unit' => 'kg', 'range' => '-'],
                            ['label' => '原料水分含量', 'field' => 'moisture_content', 'unit' => '%', 'min' => $thresholds['moisture_min'], 'max' => $thresholds['moisture_max']],
                            ['label' => '炒籽温度', 'field' => 'roasting_temperature', 'unit' => '℃', 'min' => $thresholds['roasting_temp_min'], 'max' => $thresholds['roasting_temp_max']],
                            ['label' => '炒籽时长', 'field' => 'roasting_duration', 'unit' => '分钟', 'min' => $thresholds['roasting_duration_min'], 'max' => $thresholds['roasting_duration_max']],
                            ['label' => '压榨压力', 'field' => 'pressing_pressure', 'unit' => 'MPa', 'min' => $thresholds['pressing_pressure_min'], 'max' => $thresholds['pressing_pressure_max']],
                            ['label' => '压榨时长', 'field' => 'pressing_duration', 'unit' => '分钟', 'min' => $thresholds['pressing_duration_min'], 'max' => $thresholds['pressing_duration_max']],
                            ['label' => '出油量', 'field' => 'oil_output', 'unit' => 'L', 'range' => '-'],
                            ['label' => '出油率', 'field' => 'oil_yield_rate', 'unit' => '%', 'min' => $thresholds['oil_yield_min'], 'max' => $thresholds['oil_yield_max']],
                            ['label' => '沉淀时间', 'field' => 'settling_time', 'unit' => '小时', 'min' => $thresholds['settling_min'], 'max' => $thresholds['settling_max']],
                            ['label' => '沉淀物量', 'field' => 'sediment_amount', 'unit' => 'kg', 'range' => '-'],
                        ];
                        $anomalyFields = $batch->anomalies->pluck('field_name')->toArray();
                    @endphp
                    @foreach($paramFields as $param)
                        <tr>
                            <td class="fw-bold">{{ $param['label'] }}</td>
                            <td class="{{ in_array($param['field'], $anomalyFields) ? 'text-danger fw-bold' : '' }}">
                                {{ $batch->{$param['field']} }} {{ $param['unit'] }}
                            </td>
                            <td class="text-sm text-muted">
                                @if(isset($param['range']))
                                    {{ $param['range'] }}
                                @else
                                    {{ $param['min'] }} - {{ $param['max'] }} {{ $param['unit'] }}
                                @endif
                            </td>
                            <td>
                                @if(in_array($param['field'], $anomalyFields))
                                    @php($fieldAnomaly = $batch->anomalies->where('field_name', $param['field'])->first())
                                    <span class="badge {{ anomaly_badge_class($fieldAnomaly->anomaly_type) }}">{{ anomaly_badge_label($fieldAnomaly->anomaly_type) }}异常</span>
                                @else
                                    <span class="badge badge-success">正常</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    @if($batch->anomalies->count() > 0)
        <div class="card">
            <div class="card-header">
                <div class="card-title">⚠️ 异常数据详情</div>
                <div class="text-sm text-muted">
                    共 {{ $batch->anomalies->count() }} 项异常，其中严重 {{ $batch->anomalies->where('anomaly_type', 'high')->count() }} 项
                </div>
            </div>
            <div class="card-body">
                @foreach($batch->anomalies->sortByDesc('anomaly_type') as $anomaly)
                    <div class="anomaly-item anomaly-{{ $anomaly->anomaly_type }}">
                        <div class="flex-between">
                            <div>
                                <span class="badge {{ anomaly_badge_class($anomaly->anomaly_type) }} fw-bold">{{ anomaly_badge_label($anomaly->anomaly_type) }}</span>
                                <span class="fw-bold ml-2" style="margin-left: 8px;">{{ $anomaly->description }}</span>
                            </div>
                            <div class="text-sm text-muted">
                                实际: {{ $anomaly->actual_value }} / 范围: {{ $anomaly->min_threshold }} - {{ $anomaly->max_threshold }}
                            </div>
                        </div>
                        <div class="mt-2 text-sm">
                            <span class="text-muted">建议处理方案：</span>
                            {{ $anomaly->suggestion }}
                        </div>
                        <div class="mt-2 text-xs text-muted">
                            异常编码: {{ $anomaly->anomaly_code }} | 检测时间: {{ $anomaly->created_at->format('Y-m-d H:i') }}
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    @endif

    @if($batch->notes)
        <div class="card">
            <div class="card-header">
                <div class="card-title">📝 备注</div>
            </div>
            <div class="card-body">
                <p style="white-space: pre-wrap;">{{ $batch->notes }}</p>
            </div>
        </div>
    @endif

    <div class="card">
        <div class="card-header">
            <div class="card-title">🕐 最近版本变更</div>
            <a href="{{ route('versions.index', $batch) }}" class="btn btn-secondary btn-sm">查看全部历史</a>
        </div>
        <div class="card-body" style="padding: 0;">
            <table>
                <thead>
                    <tr>
                        <th>版本号</th>
                        <th>变更时间</th>
                        <th>变更人</th>
                        <th>变更摘要</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($batch->versions->take(5) as $version)
                        <tr>
                            <td class="fw-bold">v{{ $version->version_number }}</td>
                            <td>{{ $version->created_at->format('Y-m-d H:i') }}</td>
                            <td>{{ $version->changed_by ?? '系统' }}</td>
                            <td>{{ $version->change_summary ?? '-' }}</td>
                            <td>
                                <div class="btn-group">
                                    <a href="{{ route('versions.show', [$batch, $version]) }}" class="btn btn-secondary btn-sm">查看</a>
                                    <a href="{{ route('versions.compare', [$batch, $version]) }}" class="btn btn-secondary btn-sm">对比</a>
                                    @if($batch->version != $version->version_number)
                                        <form method="POST" action="{{ route('versions.restore', [$batch, $version]) }}" style="display: inline;"
                                              onsubmit="return confirm('确定要回滚到此版本吗？当前版本的数据将被覆盖，并自动创建新版本。');">
                                            @csrf
                                            <input type="hidden" name="expected_version" value="{{ $batch->version }}">
                                            <button type="submit" class="btn btn-danger btn-sm">回滚</button>
                                        </form>
                                    @endif
                                </div>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
@endsection
