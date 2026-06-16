@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">新建调音会话</h1>

    <form method="POST" action="{{ route('sessions.store') }}" class="bg-white rounded-lg shadow p-6 space-y-4">
        @csrf
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">乐器 *</label>
            <select name="instrument_id" class="w-full border rounded px-3 py-2 text-sm">
                <option value="">请选择乐器</option>
                @foreach($instruments as $inst)
                <option value="{{ $inst->id }}" {{ old('instrument_id') == $inst->id ? 'selected' : '' }}>{{ $inst->name }} ({{ $inst->type }})</option>
                @endforeach
            </select>
            @error('instrument_id') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">会话名称 *</label>
            <input type="text" name="name" value="{{ old('name') }}" class="w-full border rounded px-3 py-2 text-sm" placeholder="如：尺八-1.8尺-竹材校准">
            @error('name') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">基频(Hz)</label>
            <input type="number" name="fundamental_freq" value="{{ old('fundamental_freq') }}" step="0.01" min="20" max="10000" class="w-full border rounded px-3 py-2 text-sm" placeholder="如：293.66">
            @error('fundamental_freq') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态 *</label>
            <select name="status" class="w-full border rounded px-3 py-2 text-sm">
                <option value="draft" {{ old('status', 'draft') === 'draft' ? 'selected' : '' }}>草稿</option>
                <option value="in_progress" {{ old('status') === 'in_progress' ? 'selected' : '' }}>进行中</option>
                <option value="completed" {{ old('status') === 'completed' ? 'selected' : '' }}>已完成</option>
            </select>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea name="notes" rows="3" class="w-full border rounded px-3 py-2 text-sm" placeholder="调音环境、乐器状态等">{{ old('notes') }}</textarea>
        </div>

        <div class="flex justify-end space-x-3 pt-4">
            <a href="{{ route('sessions.index') }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">取消</a>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">创建</button>
        </div>
    </form>
</div>
@endsection
