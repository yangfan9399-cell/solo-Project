@extends('layouts.app')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <h1 class="text-2xl font-bold text-gray-800">添加音库条目</h1>
    <form method="POST" action="{{ route('tone-libraries.store') }}" class="bg-white rounded-lg shadow p-6 space-y-4">
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
            <label class="block text-sm font-medium text-gray-700 mb-1">音名 *</label>
            <input type="text" name="note_name" value="{{ old('note_name') }}" class="w-full border rounded px-3 py-2 text-sm" placeholder="如：A4, C#3">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">目标频率(Hz) *</label>
            <input type="number" name="target_freq" value="{{ old('target_freq') }}" step="0.01" min="20" max="10000" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">容差(音分)</label>
            <input type="number" name="tolerance_cents" value="{{ old('tolerance_cents', 10) }}" step="0.1" min="0" max="100" class="w-full border rounded px-3 py-2 text-sm">
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea name="description" rows="2" class="w-full border rounded px-3 py-2 text-sm">{{ old('description') }}</textarea>
        </div>
        <div class="flex justify-end space-x-3 pt-4">
            <a href="{{ route('tone-libraries.index') }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm">取消</a>
            <button type="submit" class="bg-indigo-600 text-white px-4 py-2 rounded text-sm">创建</button>
        </div>
    </form>
</div>
@endsection
