@extends('layouts.app')

@section('title', '版本对比')
@section('page-title', '版本对比 - ' . $batch->batch_code)

@section('content')
    <div class="btn-group mb-4" style="justify-content: flex-end;">
        <a href="{{ route('versions.index', $batch) }}" class="btn btn-secondary">返回版本列表</a>
        <a href="{{ route('versions.show', [$batch, $version]) }}" class="btn btn-secondary">查看 v{{ $version->version_number }}</a>
        <a href="{{ route('batches.show', $batch) }}" class="btn btn-secondary">查看当前版本</a>
    </div>

    <div class="alert alert-info">
        <strong>对比说明：</strong> 左侧为历史版本 <span class="fw-bold">v{{ $version->version_number }}</span>，
        右侧为当前版本 <span class="fw-bold">v{{ $batch->version }}</span>。
        高亮行表示两个版本间存在差异。
    </div>

    <div class="card">
        <div class="card-header">
            <div class="card-title">🔍 逐字段对比</div>
            @php($changedCount = count(array_filter($differences, fn($d) => $d['changed'])))
            <div class="text-sm text-muted">
                共 {{ count($differences) }} 个字段，其中 <strong class="text-danger">{{ $changedCount }}</strong> 处存在差异
            </div>
        </div>
        <div class="card-body" style="padding: 0;">
            <table>
                <thead>
                    <tr>
                        <th style="width: 18%;">字段名称</th>
                        <th style="width: 41%;">v{{ $version->version_number }}（历史版本）</th>
                        <th style="width: 41%;">v{{ $batch->version }}（当前版本）</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($differences as $diff)
                        <tr style="{{ $diff['changed'] ? 'background: #fffbeb;' : '' }}">
                            <td class="fw-bold">
                                {{ $diff['label'] }}
                                @if($diff['changed'])
                                    <span class="badge badge-warning ml-2">变更</span>
                                @endif
                            </td>
                            <td>
                                @if($diff['changed'])
                                    <span class="version-diff-old">{{ $diff['old_value'] === '' || $diff['old_value'] === null ? '(空)' : $diff['old_value'] }}</span>
                                @else
                                    {{ $diff['old_value'] === '' || $diff['old_value'] === null ? '-' : $diff['old_value'] }}
                                @endif
                            </td>
                            <td>
                                @if($diff['changed'])
                                    <span class="version-diff-new">{{ $diff['new_value'] === '' || $diff['new_value'] === null ? '(空)' : $diff['new_value'] }}</span>
                                @else
                                    {{ $diff['new_value'] === '' || $diff['new_value'] === null ? '-' : $diff['new_value'] }}
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    @if($changedCount > 0)
        <div class="card">
            <div class="card-header">
                <div class="card-title">🔄 变更摘要</div>
            </div>
            <div class="card-body">
                @foreach($differences as $diff)
                    @if($diff['changed'])
                        <div class="anomaly-item anomaly-low" style="border-left-color: #8b5a2b;">
                            <strong>{{ $diff['label'] }}：</strong>
                            <span class="version-diff-old">{{ $diff['old_value'] === '' || $diff['old_value'] === null ? '(空)' : $diff['old_value'] }}</span>
                            <span style="margin: 0 8px;">→</span>
                            <span class="version-diff-new">{{ $diff['new_value'] === '' || $diff['new_value'] === null ? '(空)' : $diff['new_value'] }}</span>
                        </div>
                    @endif
                @endforeach
            </div>
        </div>
    @endif

    <div class="btn-group" style="justify-content: flex-end;">
        <a href="{{ route('versions.index', $batch) }}" class="btn btn-secondary">返回</a>
        @if($version->version_number != $batch->version)
            <form method="POST" action="{{ route('versions.restore', [$batch, $version]) }}"
                  onsubmit="return confirm('确定要回滚到 v{{ $version->version_number }} 吗？');">
                @csrf
                <button type="submit" class="btn btn-primary">回滚到 v{{ $version->version_number }}</button>
            </form>
        @endif
    </div>
@endsection
