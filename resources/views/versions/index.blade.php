@extends('layouts.app')

@section('title', '版本历史 - ' . $batch->batch_code)
@section('page-title', '版本历史 - ' . $batch->batch_code)

@section('content')
    <div class="btn-group mb-4" style="justify-content: flex-end;">
        <a href="{{ route('batches.show', $batch) }}" class="btn btn-secondary">返回批次详情</a>
        <a href="{{ route('batches.edit', $batch) }}" class="btn btn-primary">创建新版本</a>
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">📜 版本变更记录</div>
            <div class="text-sm text-muted">
                当前最新版本: <span class="fw-bold" style="color: #8b5a2b;">v{{ $batch->version }}</span>
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            <table>
                <thead>
                    <tr>
                        <th>版本号</th>
                        <th>变更时间</th>
                        <th>变更人</th>
                        <th>变更摘要</th>
                        <th>油料</th>
                        <th>出油率</th>
                        <th>变更字段数</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($versions as $version)
                        <tr>
                            <td>
                                <span class="fw-bold" style="color: #8b5a2b;">v{{ $version->version_number }}</span>
                                @if($version->version_number == $batch->version)
                                    <span class="badge badge-success ml-2">当前</span>
                                @endif
                            </td>
                            <td>{{ $version->created_at->format('Y-m-d H:i') }}</td>
                            <td>{{ $version->changed_by ?? '系统' }}</td>
                            <td>{{ $version->change_summary ?? '初始版本' }}</td>
                            <td>{{ $version->seed_type }}</td>
                            <td>{{ $version->oil_yield_rate }}%</td>
                            <td>
                                @if($version->changed_fields)
                                    {{ count($version->changed_fields) }} 项
                                @else
                                    -
                                @endif
                            </td>
                            <td>
                                <div class="btn-group">
                                    <a href="{{ route('versions.show', [$batch, $version]) }}" class="btn btn-secondary btn-sm">查看</a>
                                    <a href="{{ route('versions.compare', [$batch, $version]) }}" class="btn btn-secondary btn-sm">对比</a>
                                    @if($version->version_number != $batch->version)
                                        <form method="POST" action="{{ route('versions.restore', [$batch, $version]) }}" style="display: inline;"
                                              onsubmit="return confirm('确定要回滚到 v{{ $version->version_number }} 吗？当前版本的数据将被覆盖，并自动创建新版本。');">
                                            @csrf
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

    {{ $versions->links() }}
@endsection
