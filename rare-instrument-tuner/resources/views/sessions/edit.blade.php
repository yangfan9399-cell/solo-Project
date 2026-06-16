@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">编辑调音会话</h1>

    <form method="POST" action="{{ route('sessions.update', $session) }}" class="bg-white rounded-lg shadow p-6 space-y-4">
        @csrf @method('PUT')

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">乐器 *</label>
            <select name="instrument_id" class="w-full border rounded px-3 py-2 text-sm">
                @foreach($instruments as $inst)
                <option value="{{ $inst->id }}" {{ old('instrument_id', $session->instrument_id) == $inst->id ? 'selected' : '' }}>{{ $inst->name }}</option>
                @endforeach
            </select>
            @error('instrument_id') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">会话名称 *</label>
            <input type="text" name="name" value="{{ old('name', $session->name) }}" class="w-full border rounded px-3 py-2 text-sm">
            @error('name') <p class="text-red-500 text-xs mt-1">{{ $message }}</p> @enderror
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">基频(Hz)</label>
            <input type="number" name="fundamental_freq" value="{{ old('fundamental_freq', $session->fundamental_freq) }}" step="0.01" min="20" max="10000" class="w-full border rounded px-3 py-2 text-sm">
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">状态 *</label>
            <select name="status" class="w-full border rounded px-3 py-2 text-sm">
                <option value="draft" {{ old('status', $session->status) === 'draft' ? 'selected' : '' }}>草稿</option>
                <option value="in_progress" {{ old('status', $session->status) === 'in_progress' ? 'selected' : '' }}>进行中</option>
                <option value="completed" {{ old('status', $session->status) === 'completed' ? 'selected' : '' }}>已完成</option>
            </select>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea name="notes" rows="4" class="w-full border rounded px-3 py-2 text-sm">{{ old('notes', $session->notes) }}</textarea>
        </div>

        @if($session->has_anomaly)
        <div class="bg-red-50 border border-red-200 rounded p-3">
            <p class="text-sm text-red-700"><strong>异常:</strong> {{ $session->anomaly_description }}</p>
        </div>
        @endif

        <div class="flex justify-end space-x-3 pt-4">
            <a href="{{ route('sessions.show', $session) }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">取消</a>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">保存</button>
        </div>
    </form>
</div>
@endsection
