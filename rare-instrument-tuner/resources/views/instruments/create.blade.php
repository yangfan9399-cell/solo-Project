@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">添加乐器</h1>
    <form method="POST" action="{{ route('instruments.store') }}" class="bg-white rounded-lg shadow p-6 space-y-4">
        @csrf
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">乐器名称 *</label>
            <input type="text" name="name" value="{{ old('name') }}" class="w-full border rounded px-3 py-2 text-sm">
            @error('name') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
            <input type="text" name="type" value="{{ old('type') }}" class="w-full border rounded px-3 py-2 text-sm" placeholder="如：管乐器、拨弦乐器、拉弦乐器、电子乐器">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">产地</label>
            <input type="text" name="origin" value="{{ old('origin') }}" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">弦数</label>
            <input type="number" name="string_count" value="{{ old('string_count', 0) }}" min="0" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">调弦音名（每行一个）</label>
            <textarea name="tuning_notes" rows="4" class="w-full border rounded px-3 py-2 text-sm" placeholder="D4&#10;F4&#10;G4">{{ old('tuning_notes') }}</textarea>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea name="description" rows="4" class="w-full border rounded px-3 py-2 text-sm">{{ old('description') }}</textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
            <a href="{{ route('instruments.index') }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">取消</a>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">创建</button>
        </div>
    </form>
</div>
@endsection
