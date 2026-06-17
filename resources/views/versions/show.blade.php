@extends('layouts.app')

@section('title', '版本详情 - v' . $version->version_number)
@section('page-title', '版本详情 - ' . $batch->batch_code . ' v' . $version->version_number)

@section('content')
    <div class="btn-group mb-4" style="justify-content: flex-end;">
        <a href="{{ route('versions.index', $batch) }}" class="btn btn-secondary">返回版本列表</a>
        <a href="{{ route('versions.compare', [$batch, $version]) }}" class="btn btn-secondary">与当前版本对比</a>
        <a href="{{ route('batches.show', $batch) }}" class="btn btn-secondary">查看当前版本</a>
        @if($version->version_number != $batch->version)
            <form method="POST" action="{{ route('versions.restore', [$batch, $version]) }}" style="display: inline;"
                  onsubmit="return confirm('确定要回滚到此版本吗？当前版本的数据将被覆盖，并自动创建新版本。');">
                @csrf
                <input type="hidden" name="expected_version" value="{{ $batch->version }}">
                <button type="submit" class="btn btn-primary">回滚到此版本</button>
            </form>
        @endif
    </div>

    <div class="card">
        <div class="card-header">
            <div>
                <div class="card-title">📌 版本元信息</div>
                <div class="text-sm text-muted mt-1">
                    @if($version->version_number == $batch->version)
                        <span class="badge badge-success">当前版本</span>
                    @else
                        <span class="badge badge-gray">历史版本</span>
                    @endif
                </div>
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            <div class="detail-grid">
                <div class="detail-item">
                    <div class="detail-label">版本号</div>
                    <div class="detail-value">v{{ $version->version_number }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">所属批次</div>
                    <div class="detail-value">{{ $version->batch_code }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">溯源码</div>
                    <div class="code-block">{{ $version->trace_code }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">变更时间</div>
                    <div class="detail-value">{{ $version->created_at->format('Y年m月d日 H:i:s') }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">变更人</div>
                    <div class="detail-value">{{ $version->changed_by ?? '系统自动' }}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">变更摘要</div>
                    <div class="detail-value">{{ $version->change_summary ?? '初始版本创建' }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">📊 工艺参数快照</div>
        </div>
        <div class="card-body" style="padding: 0;">
            <table>
                <thead>
                    <tr>
                        <th>参数项目</th>
                        <th>数值</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $fields = [
                            ['油料种类', 'seed_type', ''],
                            ['生产日期', 'production_date', '', 'date'],
                            ['操作员', 'operator', ''],
                            ['原料重量(kg)', 'seed_weight', '2'],
                            ['原料水分含量(%)', 'moisture_content', '2'],
                            ['炒籽温度(℃)', 'roasting_temperature', '2'],
                            ['炒籽时长(分钟)', 'roasting_duration', ''],
                            ['压榨压力(MPa)', 'pressing_pressure', '2'],
                            ['压榨时长(分钟)', 'pressing_duration', ''],
                            ['出油量(L)', 'oil_output', '2'],
                            ['出油率(%)', 'oil_yield_rate', '2'],
                            ['沉淀时间(小时)', 'settling_time', ''],
                            ['沉淀物量(kg)', 'sediment_amount', '2'],
                            ['状态', 'status', ''],
                        ];
                    @endphp
                    @foreach($fields as $field)
                        <tr>
                            <td class="fw-bold">{{ $field[0] }}</td>
                            <td>
                                @if(($field[3] ?? '') === 'date')
                                    {{ $version->{$field[1]}?->format('Y年m月d日') ?? '-' }}
                                @elseif($field[1] === 'status')
                                    <span class="badge {{ status_badge_class($version->status) }}">{{ status_badge_label($version->status) }}</span>
                                @elseif($field[2] !== '')
                                    {{ number_format((float)$version->{$field[1]}, (int)$field[2]) }}
                                @else
                                    {{ $version->{$field[1]} ?? '-' }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    @if($version->changed_fields && count($version->changed_fields) > 0)
        <div class="card">
            <div class="card-header">
                <div class="card-title">🔄 本版本变更字段详情</div>
                <div class="text-sm text-muted">相对上一版本共 {{ count($version->changed_fields) }} 处变更</div>
            </div>
            <div class="card-body" style="padding: 0;">
                <table>
                    <thead>
                        <tr>
                            <th>字段名</th>
                            <th>变更前</th>
                            <th>变更后</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($version->changed_fields as $field => $change)
                            <tr>
                                <td class="fw-bold">{{ field_label($field) }}</td>
                                <td><span class="version-diff-old">{{ $change['old'] ?? '(空)' }}</span></td>
                                <td><span class="version-diff-new">{{ $change['new'] ?? '(空)' }}</span></td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    @endif

    @if($version->notes)
        <div class="card">
            <div class="card-header">
                <div class="card-title">📝 备注</div>
            </div>
            <div class="card-body">
                <p style="white-space: pre-wrap;">{{ $version->notes }}</p>
            </div>
        </div>
    @endif
@endsection
