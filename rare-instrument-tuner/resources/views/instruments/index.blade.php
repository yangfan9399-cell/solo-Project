@extends('layouts.app')

@section('content')
<div class="space-y-4">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">乐器库</h1>
        <a href="{{ route('instruments.create') }}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">+ 添加乐器</a>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
        <form method="GET" action="{{ route('instruments.index') }}" class="flex gap-3 items-end">
            <div>
                <label class="block text-xs text-gray-500 mb-1">关键词</label>
                <input type="text" name="search" value="{{ request('search') }}" class="border rounded px-3 py-1.5 text-sm" placeholder="乐器名/产地/描述">
            </div>
            <div>
                <label class="block text-xs text-gray-500 mb-1">类型</label>
                <select name="type" class="border rounded px-3 py-1.5 text-sm">
                    <option value="">全部</option>
                    @foreach($types as $type)
                    <option value="{{ $type }}" {{ request('type') === $type ? 'selected' : '' }}>{{ $type }}</option>
                    @endforeach
                </select>
            </div>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm">筛选</button>
            <a href="{{ route('instruments.index') }}" class="bg-gray-200 text-gray-700 px-4 py-1.5 rounded text-sm">重置</a>
        </form>
    </div>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        @foreach($instruments as $instrument)
        <div class="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div class="p-5">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="font-bold text-lg text-gray-800">{{ $instrument->name }}</h3>
                    <span class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{{ $instrument->type }}</span>
                </div>
                <p class="text-sm text-gray-500 mb-2">{{ $instrument->origin }} · {{ $instrument->string_count }}弦</p>
                <p class="text-sm text-gray-600 line-clamp-2">{{ $instrument->description }}</p>
                <div class="flex items-center justify-between mt-4 pt-3 border-t">
                    <div class="flex space-x-3 text-xs text-gray-400">
                        <span>{{ $instrument->tuning_sessions_count }}次调音</span>
                        <span>{{ $instrument->tone_libraries_count }}个音库</span>
                    </div>
                    <div class="flex space-x-2">
                        <a href="{{ route('instruments.show', $instrument) }}" class="text-indigo-600 hover:underline text-sm">详情</a>
                        <a href="{{ route('instruments.edit', $instrument) }}" class="text-blue-600 hover:underline text-sm">编辑</a>
                    </div>
                </div>
            </div>
        </div>
        @endforeach
    </div>

    <div class="flex justify-center">
        {{ $instruments->withQueryString()->links() }}
    </div>
</div>
@endsection
