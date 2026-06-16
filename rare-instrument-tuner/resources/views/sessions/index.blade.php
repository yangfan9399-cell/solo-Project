@extends('layouts.app')

@section('content')
<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">调音台账</h1>
        <a href="{{ route('sessions.create') }}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">+ 新建会话</a>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
        <form method="GET" action="{{ route('sessions.index') }}" class="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
            <div>
                <label class="block text-xs text-gray-500 mb-1">关键词搜索</label>
                <input type="text" name="search" value="{{ request('search') }}" class="w-full border rounded px-3 py-1.5 text-sm" placeholder="名称/备注/异常">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">乐器</label>
                <select name="instrument_id" class="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">全部</option>
                    @foreach($instruments as $inst)
                    <option value="{{ $inst->id }}" {{ request('instrument_id') == $inst->id ? 'selected' : '' }}>{{ $inst->name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">状态</label>
                <select name="status" class="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">全部</option>
                    <option value="draft" {{ request('status') === 'draft' ? 'selected' : '' }}>草稿</option>
                    <option value="in_progress" {{ request('status') === 'in_progress' ? 'selected' : '' }}>进行中</option>
                    <option value="completed" {{ request('status') === 'completed' ? 'selected' : '' }}>已完成</option>
                </select>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">仅异常</label>
                <select name="has_anomaly" class="w-full border rounded px-3 py-1.5 text-sm">
                    <option value="">全部</option>
                    <option value="1" {{ request('has_anomaly') === '1' ? 'selected' : '' }}>仅异常</option>
                </select>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">基频范围(Hz)</label>
                <div class="flex space-x-1">
                    <input type="number" name="freq_min" value="{{ request('freq_min') }}" class="w-1/2 border rounded px-2 py-1.5 text-sm" placeholder="最小">
                    <input type="number" name="freq_max" value="{{ request('freq_max') }}" class="w-1/2 border rounded px-2 py-1.5 text-sm" placeholder="最大">
                </div>
            </div>
            <div class="flex space-x-2">
                <button type="submit" class="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-700">筛选</button>
                <a href="{{ route('sessions.index') }}" class="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm hover:bg-gray-300">重置</a>
            </div>
        </form>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
            <thead class="bg-gray-100">
                <tr>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">会话名称</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">乐器</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">基频(Hz)</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">异常</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">泛音数</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">更新时间</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                @foreach($sessions as $session)
                <tr class="hover:bg-gray-50 {{ $session->has_anomaly ? 'bg-red-50' : '' }}">
                    <td class="px-4 py-3">
                        <a href="{{ route('sessions.show', $session) }}" class="text-indigo-600 hover:underline font-medium">{{ $session->name }}</a>
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ $session->instrument->name }}</td>
                    <td class="px-4 py-3 font-mono text-gray-700">{{ $session->fundamental_freq ?? '-' }}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded text-xs {{ match($session->status) { 'completed' => 'bg-green-100 text-green-700', 'in_progress' => 'bg-yellow-100 text-yellow-700', default => 'bg-gray-100 text-gray-600' } }}">
                            {{ match($session->status) { 'completed' => '已完成', 'in_progress' => '进行中', 'draft' => '草稿', default => $session->status } }}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        @if($session->has_anomaly)
                        <span class="text-red-600 font-bold">⚠ 异常</span>
                        @else
                        <span class="text-gray-400">-</span>
                        @endif
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ $session->spectrumData->count() }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">{{ $session->updated_at->format('m-d H:i') }}</td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <a href="{{ route('sessions.show', $session) }}" class="text-indigo-600 hover:underline text-xs">详情</a>
                            <a href="{{ route('sessions.edit', $session) }}" class="text-blue-600 hover:underline text-xs">编辑</a>
                            <form method="POST" action="{{ route('sessions.destroy', $session) }}" onsubmit="return confirm('确认删除？')">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline text-xs">删除</button>
                            </form>
                        </div>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="flex justify-center">
        {{ $sessions->withQueryString()->links() }}
    </div>
</div>
@endsection
