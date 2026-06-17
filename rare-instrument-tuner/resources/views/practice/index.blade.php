@extends('layouts.app')

@section('content')
<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">练习记录</h1>
        <a href="{{ route('practice.create') }}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">+ 添加记录</a>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
        <form method="GET" action="{{ route('practice.index') }}" class="flex gap-3 items-end">
            <div>
                <label class="block text-xs text-gray-500 mb-1">乐器</label>
                <select name="instrument_id" class="border rounded px-3 py-1.5 text-sm">
                    <option value="">全部</option>
                    @foreach($instruments as $inst)
                    <option value="{{ $inst->id }}" {{ request('instrument_id') == $inst->id ? 'selected' : '' }}>{{ $inst->name }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">日期范围</label>
                <div class="flex space-x-1">
                    <input type="date" name="date_from" value="{{ request('date_from') }}" class="border rounded px-2 py-1.5 text-sm">
                    <input type="date" name="date_to" value="{{ request('date_to') }}" class="border rounded px-2 py-1.5 text-sm">
                </div>
            </div>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">筛选</button>
            <a href="{{ route('practice.index') }}" class="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm">重置</a>
        </form>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
            <thead class="bg-gray-100">
                <tr>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">日期</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">乐器</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">关联会话</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">时长</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">精度</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">备注</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                @if($records->count() > 0)
                @foreach($records as $record)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">{{ $record->session_date->format('Y-m-d') }}</td>
                    <td class="px-4 py-3">{{ $record->instrument->name }}</td>
                    <td class="px-4 py-3">
                        @if($record->tuningSession)
                        <a href="{{ route('sessions.show', $record->tuningSession) }}" class="text-indigo-600 hover:underline text-xs">{{ $record->tuningSession->name }}</a>
                        @else
                        <span class="text-gray-400">-</span>
                        @endif
                    </td>
                    <td class="px-4 py-3">{{ $record->duration_minutes }}分钟</td>
                    <td class="px-4 py-3">
                        <span class="font-mono {{ $record->accuracy_score >= 80 ? 'text-green-600' : ($record->accuracy_score >= 60 ? 'text-yellow-600' : 'text-red-600') }}">
                            {{ $record->accuracy_score }}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{{ $record->notes }}</td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <a href="{{ route('practice.edit', $record) }}" class="text-blue-600 hover:underline text-xs">编辑</a>
                            <form method="POST" action="{{ route('practice.destroy', $record) }}" onsubmit="return confirm('确认删除？')">
                                @csrf @method('DELETE')
                                <button type="submit" class="text-red-600 hover:underline text-xs">删除</button>
                            </form>
                        </div>
                    </td>
                </tr>
                @endforeach
                @else
                <tr>
                    <td colspan="7" class="px-4 py-16 text-center text-gray-400">
                        <div class="text-4xl mb-3">📝</div>
                        <p class="mb-1">暂无练习记录</p>
                        <p class="text-xs">点击右上角「添加记录」创建第一条记录</p>
                    </td>
                </tr>
                @endif
            </tbody>
        </table>
    </div>

    <div class="flex justify-center">
        {{ $records->withQueryString()->links() }}
    </div>
</div>
@endsection
