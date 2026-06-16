@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">添加练习记录</h1>
    <form method="POST" action="{{ route('practice.store') }}" class="bg-white rounded-lg shadow p-6 space-y-4">
        @csrf
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">乐器 *</label>
            <select name="instrument_id" class="w-full border rounded px-3 py-2 text-sm">
                <option value="">请选择</option>
                @foreach($instruments as $inst)
                <option value="{{ $inst->id }}" {{ old('instrument_id') == $inst->id ? 'selected' : '' }}>{{ $inst->name }}</option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">练习日期 *</label>
            <input type="date" name="session_date" value="{{ old('session_date', date('Y-m-d')) }}" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">时长(分钟) *</label>
            <input type="number" name="duration_minutes" value="{{ old('duration_minutes', 30) }}" min="1" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">精度分数(0-100)</label>
            <input type="number" name="accuracy_score" value="{{ old('accuracy_score') }}" step="0.1" min="0" max="100" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <textarea name="notes" rows="3" class="w-full border rounded px-3 py-2 text-sm">{{ old('notes') }}</textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
            <a href="{{ route('practice.index') }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">取消</a>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">创建</button>
        </div>
    </form>
</div>
@endsection
