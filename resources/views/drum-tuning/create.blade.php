@extends('layouts.app')

@section('title', '新建调校记录 - 传统鼓皮张力调校工具')

@section('content')
<div class="max-w-3xl mx-auto">
    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h2 class="section-title text-xl font-bold text-drum-900">新建鼓皮张力调校记录</h2>
            <p class="mt-1 text-sm text-gray-500">填写鼓的基本信息和鼓皮材质，创建新的调校记录批次</p>
        </div>

        <form action="{{ route('drum-tuning.store') }}" method="POST" class="p-6 space-y-6">
            @csrf

            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-drum-800 flex items-center">
                    <span class="w-8 h-8 bg-drum-100 rounded-full flex items-center justify-center mr-3 text-sm font-bold text-drum-600">1</span>
                    主记录信息
                </h3>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">批次号 <span class="text-red-500">*</span></label>
                        <input type="text" name="batch_number" value="{{ old('batch_number') }}" 
                               placeholder="例如：DRUM-2024-001" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        @error('batch_number')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">版本号</label>
                        <input type="text" name="version" value="{{ old('version', '1.0') }}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">鼓径 (英寸) <span class="text-red-500">*</span></label>
                        <input type="number" name="drum_diameter" step="0.01" value="{{ old('drum_diameter', 14) }}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">乐师姓名 <span class="text-red-500">*</span></label>
                        <input type="text" name="musician_name" value="{{ old('musician_name') }}" 
                               placeholder="请输入乐师姓名"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">记录日期</label>
                    <input type="date" name="record_date" value="{{ old('record_date', date('Y-m-d')) }}" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">总体备注</label>
                    <textarea name="notes" rows="3" 
                              placeholder="记录调音过程中的注意事项、特殊要求等..."
                              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">{{ old('notes') }}</textarea>
                </div>
            </div>

            <hr class="border-drum-100">

            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-drum-800 flex items-center">
                    <span class="w-8 h-8 bg-drum-100 rounded-full flex items-center justify-center mr-3 text-sm font-bold text-drum-600">2</span>
                    鼓皮明细
                </h3>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">鼓皮材质 <span class="text-red-500">*</span></label>
                        <select name="drumhead_material" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                            <option value="牛皮">牛皮</option>
                            <option value="羊皮">羊皮</option>
                            <option value="合成皮">合成皮</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">鼓面</label>
                        <select name="drum_side" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                            <option value="batter">击打面</option>
                            <option value="resonant">共振面</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">鼓皮品牌</label>
                        <input type="text" name="drumhead_brand" value="{{ old('drumhead_brand') }}" 
                               placeholder="例如：Remo、Evans"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">鼓皮厚度 (mm)</label>
                        <input type="number" name="drumhead_thickness" step="0.001" value="{{ old('drumhead_thickness') }}" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
                <a href="{{ route('drum-tuning.index') }}" 
                   class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
                    取消
                </a>
                <button type="submit" 
                        class="px-6 py-2 bg-drum-700 text-white rounded-lg font-medium hover:bg-drum-800 transition shadow">
                    创建记录
                </button>
            </div>
        </form>
    </div>
</div>
@endsection
