@extends('layouts.app')

@section('content')
<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">目标音库</h1>
        <a href="{{ route('tone-libraries.create') }}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">+ 添加音库条目</a>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
        <form method="GET" action="{{ route('tone-libraries.index') }}" class="flex gap-3 items-end">
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
                <label class="block text-xs text-gray-500 mb-1">搜索</label>
                <input type="text" name="search" value="{{ request('search') }}" class="border rounded px-3 py-1.5 text-sm" placeholder="音名/描述">
            </div>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">筛选</button>
        </form>
    </div>

    <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
            <thead class="bg-gray-100">
                <tr>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">乐器</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">音名</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">目标频率(Hz)</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">容差(音分)</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">描述</th>
                    <th class="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                @foreach($tones as $tone)
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3">{{ $tone->instrument->name }}</td>
                    <td class="px-4 py-3 font-medium">{{ $tone->note_name }}</td>
                    <td class="px-4 py-3 font-mono">{{ $tone->target_freq }}</td>
                    <td class="px-4 py-3">±{{ $tone->tolerance_cents }}</td>
                    <td class="px-4 py-3 text-gray-500 text-xs">{{ $tone->description }}</td>
                    <td class="px-4 py-3">
                        <div class="flex space-x-2">
                            <a href="{{ route('tone-libraries.edit', $tone) }}" class="text-blue-600 hover:underline text-xs">编辑</a>
                            <form method="POST" action="{{ route('tone-libraries.destroy', $tone) }}" onsubmit="return confirm('确认删除？')">
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
        {{ $tones->withQueryString()->links() }}
    </div>
</div>
@endsection
