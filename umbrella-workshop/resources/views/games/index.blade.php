@extends('layouts.app')

@section('content')
<div class="page-header">
    <h1>☂ 纸伞作坊</h1>
    <p>欢迎来到纸伞作坊骨架装配游戏，在这里你可以制作属于自己的纸伞</p>
</div>

<div class="grid grid-3">
    <div class="card" style="text-align:center; cursor:pointer;" onclick="window.location='{{ route('games.create') }}'">
        <div style="font-size:48px; margin-bottom:12px;">🏗️</div>
        <h2 style="border:none; padding:0;">开工作坊</h2>
        <p class="text-muted text-sm">选择关卡，开始制作一把纸伞</p>
    </div>
    <div class="card" style="text-align:center; cursor:pointer;" onclick="window.location='{{ route('games.history') }}'">
        <div style="font-size:48px; margin-bottom:12px;">📜</div>
        <h2 style="border:none; padding:0;">变化历史</h2>
        <p class="text-muted text-sm">查看湿度与材料搭配的变化记录</p>
    </div>
    <div class="card" style="text-align:center; cursor:pointer;" onclick="window.location='{{ route('games.inspections') }}'">
        <div style="font-size:48px; margin-bottom:12px;">🔍</div>
        <h2 style="border:none; padding:0;">质检评价</h2>
        <p class="text-muted text-sm">质检结果与顾客订单评价</p>
    </div>
</div>

<div class="card mt-4">
    <h2>📋 作坊记录</h2>
    @if($games->count() > 0)
    <table>
        <thead>
            <tr>
                <th>局次</th>
                <th>匠人</th>
                <th>关卡</th>
                <th>状态</th>
                <th>评分</th>
                <th>湿度</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            @foreach($games as $game)
            <tr>
                <td>#{{ $game->id }}</td>
                <td>{{ $game->player_name }}</td>
                <td>{{ $game->level->name ?? '-' }}</td>
                <td>
                    @switch($game->status)
                        @case('completed')
                            <span class="badge badge-success">已完成</span>
                            @break
                        @case('failed')
                            <span class="badge badge-danger">失败</span>
                            @break
                        @case('draft')
                            <span class="badge badge-info">草稿</span>
                            @break
                        @case('assembly')
                            <span class="badge badge-warning">装配中</span>
                            @break
                        @case('drying')
                            <span class="badge badge-warning">晾晒中</span>
                            @break
                        @default
                            <span class="badge badge-info">{{ $game->status }}</span>
                    @endswitch
                </td>
                <td><strong>{{ $game->score }}</strong>/100</td>
                <td>{{ $game->humidity }}%</td>
                <td>
                    <a href="{{ route('games.show', $game) }}" class="btn btn-outline btn-sm">详情</a>
                    @if(in_array($game->status, ['draft', 'assembly', 'drying']))
                    <a href="{{ route('games.workbench', $game) }}" class="btn btn-primary btn-sm">继续</a>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @else
    <div class="empty-state">
        <div class="icon">☂</div>
        <p>还没有制作记录，快去开工作坊吧！</p>
    </div>
    @endif
</div>
@endsection
