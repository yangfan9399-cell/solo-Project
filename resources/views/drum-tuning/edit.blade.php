@extends('layouts.app')

@section('title', '编辑调校记录')

@section('content')
<div class="max-w-3xl mx-auto">
    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h2 class="section-title text-xl font-bold text-drum-900">编辑调校记录</h2>
            <p class="mt-1 text-sm text-gray-500">修改批次：{{ $master->batch_number }}</p>
        </div>

        <form action="{{ route('drum-tuning.update', $master->id) }}" method="POST" class="p-6 space-y-6">
            @csrf
            @method('PUT')

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">批次号</label>
                    <input type="text" name="batch_number" value="{{ old('batch_number', $master->batch_number) }}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                    <input type="text" name="version" value="{{ old('version', $master->version) }}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">鼓径 (英寸)</label>
                    <input type="number" name="drum_diameter" step="0.01" value="{{ old('drum_diameter', $master->drum_diameter) }}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">乐师姓名</label>
                    <input type="text" name="musician_name" value="{{ old('musician_name', $master->musician_name) }}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">记录日期</label>
                    <input type="date" name="record_date" value="{{ old('record_date', $master->record_date->format('Y-m-d')) }}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select name="status" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        <option value="draft" {{ $master->status === 'draft' ? 'selected' : '' }}>草稿</option>
                        <option value="completed" {{ $master->status === 'completed' ? 'selected' : '' }}>已完成</option>
                        <option value="rolled_back" {{ $master->status === 'rolled_back' ? 'selected' : '' }}>已回滚</option>
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">总体备注</label>
                <textarea name="notes" rows="4" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">{{ old('notes', $master->notes) }}</textarea>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
                <a href="{{ route('drum-tuning.show', $master->id) }}" 
                   class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                    取消
                </a>
                <button type="submit" 
                        class="px-6 py-2 bg-drum-700 text-white rounded-lg font-medium hover:bg-drum-800 transition shadow">
                    保存修改
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
