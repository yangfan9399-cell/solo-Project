@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">工作台总览</h1>
        <div class="flex space-x-2">
            <a href="{{ route('sessions.create') }}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">+ 新建调音会话</a>
            <a href="{{ route('instruments.create') }}" class="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 text-sm">+ 添加乐器</a>
        </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-indigo-600">{{ $totalSessions }}</div>
            <div class="text-sm text-gray-500 mt-1">调音会话</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-green-600">{{ $completedCount }}</div>
            <div class="text-sm text-gray-500 mt-1">已完成</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-yellow-600">{{ $inProgressCount }}</div>
            <div class="text-sm text-gray-500 mt-1">进行中</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center {{ $anomalyCount > 0 ? 'anomaly-pulse' : '' }}">
            <div class="text-3xl font-bold text-red-600">{{ $anomalyCount }}</div>
            <div class="text-sm text-gray-500 mt-1">异常标记</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4 text-center">
            <div class="text-3xl font-bold text-purple-600">{{ $instrumentCount }}</div>
            <div class="text-sm text-gray-500 mt-1">罕见乐器</div>
        </div>
    </div>

    @if($anomalySessions->count() > 0)
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h2 class="text-lg font-semibold text-red-800 mb-3">⚠️ 异常数据提示</h2>
        <div class="space-y-2">
            @foreach($anomalySessions as $session)
            <div class="bg-white rounded p-3 flex items-center justify-between">
                <div>
                    <span class="font-medium text-red-700">{{ $session->name }}</span>
                    <span class="text-sm text-gray-500 ml-2">({{ $session->instrument->name }})</span>
                    <p class="text-sm text-red-600 mt-1">{{ $session->anomaly_description }}</p>
                </div>
                <a href="{{ route('sessions.show', $session) }}" class="text-indigo-600 hover:underline text-sm whitespace-nowrap">查看详情 →</a>
            </div>
            @endforeach
        </div>
    </div>
    @endif

    <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-5">
            <h2 class="text-lg font-semibold text-gray-700 mb-3">最近调音会话</h2>
            @if($recentSessions->count() > 0)
            <div class="divide-y">
                @foreach($recentSessions as $session)
                <div class="py-3 flex items-center justify-between">
                    <div>
                        <a href="{{ route('sessions.show', $session) }}" class="text-indigo-600 hover:underline font-medium">{{ $session->name }}</a>
                        <span class="text-sm text-gray-400 ml-2">{{ $session->instrument->name }}</span>
                    </div>
                    <div class="flex items-center space-x-2">
                        @if($session->has_anomaly)
                        <span class="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">异常</span>
                        @endif
                        <span class="text-xs {{ $session->status_badge_class }}">
                            {{ $session->status_label }}
                        </span>
                    </div>
                </div>
                @endforeach
            </div>
            @else
            <p class="text-gray-400 text-sm">暂无会话记录</p>
            @endif
        </div>

        <div class="bg-white rounded-lg shadow p-5">
            <h2 class="text-lg font-semibold text-gray-700 mb-3">快速入口</h2>
            <div class="grid grid-cols-2 gap-3">
                <a href="{{ route('sessions.index', ['has_anomaly' => 1]) }}" class="block bg-red-50 border border-red-200 rounded-lg p-3 text-center hover:bg-red-100">
                    <div class="text-red-600 font-bold text-lg">{{ $anomalyCount }}</div>
                    <div class="text-sm text-red-700">异常会话</div>
                </a>
                <a href="{{ route('sessions.index', ['status' => 'in_progress']) }}" class="block bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center hover:bg-yellow-100">
                    <div class="text-yellow-600 font-bold text-lg">{{ $inProgressCount }}</div>
                    <div class="text-sm text-yellow-700">进行中</div>
                </a>
                <a href="{{ route('practice.chart') }}" class="block bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center hover:bg-indigo-100">
                    <div class="text-indigo-600 font-bold text-lg">📈</div>
                    <div class="text-sm text-indigo-700">练习曲线</div>
                </a>
                <a href="{{ route('export.sessions') }}" class="block bg-green-50 border border-green-200 rounded-lg p-3 text-center hover:bg-green-100">
                    <div class="text-green-600 font-bold text-lg">📊</div>
                    <div class="text-sm text-green-700">导出数据</div>
                </a>
            </div>
        </div>
    </div>
</div>
@endsection
