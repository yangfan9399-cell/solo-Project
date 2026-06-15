@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1>📜 变化历史</h1>
    <p>湿度对开合顺滑度的影响记录，以及材料搭配对成本与耐用的影响记录</p>
</div>

<div class="grid grid-2">
    <div class="card">
        <h2>🌡️ 湿度影响记录</h2>
        @if($histories->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>局次</th>
                    <th>关卡</th>
                    <th>湿度</th>
                    <th>顺滑度变化</th>
                    <th>原因</th>
                </tr>
            </thead>
            <tbody>
                @foreach($histories as $history)
                <tr>
                    <td>#{{ $history->game_id }}</td>
                    <td>{{ $history->game?->level?->name ?? '-' }}</td>
                    <td>{{ $history->humidity }}%</td>
                    <td>
                        <span class="text-danger">{{ $history->smoothness_before }}</span> →
                        <span class="fw-bold {{ $history->smoothness_after >= 60 ? 'text-success' : 'text-danger' }}">{{ $history->smoothness_after }}</span>
                        <span class="text-danger">(-{{ $history->smoothness_before - $history->smoothness_after }})</span>
                    </td>
                    <td class="text-sm">{{ $history->change_reason }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-state">
            <div class="icon">🌡️</div>
            <p>暂无湿度影响记录</p>
        </div>
        @endif
    </div>

    <div class="card">
        <h2>💰 材料搭配影响记录</h2>
        @if($results->count() > 0)
        <table>
            <thead>
                <tr>
                    <th>局次</th>
                    <th>关卡</th>
                    <th>材料搭配</th>
                    <th>成本变化</th>
                    <th>耐用变化</th>
                    <th>原因</th>
                </tr>
            </thead>
            <tbody>
                @foreach($results as $result)
                <tr>
                    <td>#{{ $result->game_id }}</td>
                    <td>{{ $result->game?->level?->name ?? '-' }}</td>
                    <td class="text-sm">{{ $result->material_combo ? implode('+', $result->material_combo) : '-' }}</td>
                    <td>
                        {{ $result->cost_before }} → {{ $result->cost_after }}
                    </td>
                    <td>
                        {{ $result->durability_before }} →
                        <span class="fw-bold {{ $result->durability_after >= $result->durability_before ? 'text-success' : 'text-danger' }}">{{ $result->durability_after }}</span>
                    </td>
                    <td class="text-sm">{{ $result->change_reason }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
        @else
        <div class="empty-state">
            <div class="icon">💰</div>
            <p>暂无材料搭配影响记录</p>
        </div>
        @endif
    </div>
</div>

<div class="mt-4">
    <a href="{{ route('games.index') }}" class="btn btn-outline">← 返回作坊记录</a>
</div>
@endsection
