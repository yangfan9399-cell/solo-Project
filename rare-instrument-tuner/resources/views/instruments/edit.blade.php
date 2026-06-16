@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">编辑乐器</h1>
    <form method="POST" action="{{ route('instruments.update', $instrument) }}" class="bg-white rounded-lg shadow p-6 space-y-4">
        @csrf @method('PUT')
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">乐器名称 *</label>
            <input type="text" name="name" value="{{ old('name', $instrument->name) }}" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
            <input type="text" name="type" value="{{ old('type', $instrument->type) }}" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">产地</label>
            <input type="text" name="origin" value="{{ old('origin', $instrument->origin) }}" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">弦数</label>
            <input type="number" name="string_count" value="{{ old('string_count', $instrument->string_count) }}" min="0" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea name="description" rows="4" class="w-full border rounded px-3 py-2 text-sm">{{ old('description', $instrument->description) }}</textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
            <a href="{{ route('instruments.show', $instrument) }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">取消</a>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">保存</button>
        </div>
    </form>
</div>
@endsection
