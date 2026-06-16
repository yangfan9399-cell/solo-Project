@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">数据导出</h1>

    <div class="grid md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">📋</div>
            <h3 class="font-bold text-gray-700 mb-2">调音会话汇总</h3>
            <p class="text-sm text-gray-500 mb-4">导出所有调音会话的基础信息、异常状态、频谱统计等汇总数据</p>
            <a href="{{ route('export.sessions') }}" class="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 text-sm">导出CSV</a>
        </div>

        <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">📊</div>
            <h3 class="font-bold text-gray-700 mb-2">练习记录汇总</h3>
            <p class="text-sm text-gray-500 mb-4">导出所有练习记录，包括精度分数、时长、关联会话等</p>
            <a href="{{ route('export.practice') }}" class="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 text-sm">导出CSV</a>
        </div>

        <div class="bg-white rounded-lg shadow p-6 text-center">
            <div class="text-4xl mb-3">🎵</div>
            <h3 class="font-bold text-gray-700 mb-2">目标音库</h3>
            <p class="text-sm text-gray-500 mb-4">导出所有罕见乐器的目标频率、音名和容差配置</p>
            <a href="{{ route('export.tones') }}" class="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 text-sm">导出CSV</a>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="font-bold text-gray-700 mb-3">单会话详细导出</h3>
        <p class="text-sm text-gray-500 mb-4">从调音台账中任一会话的详情页点击"导出CSV"，可导出该会话的完整频谱数据、调弦建议等</p>
        <a href="{{ route('sessions.index') }}" class="text-indigo-600 hover:underline text-sm">前往调音台账 →</a>
    </div>
</div>
@endsection
