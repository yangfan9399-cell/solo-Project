@extends('layouts.app')

@section('title', '调校方案比较')

@section('content')
<div class="space-y-6">
    <div class="drum-card rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-drum-900">调校方案比较</h2>
                <p class="mt-1 text-gray-500">选择多个调校记录进行对比分析，找出最佳方案</p>
            </div>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h3 class="section-title text-lg font-semibold text-drum-900">创建新比较方案</h3>
        </div>
        <div class="p-6">
            <form action="{{ route('comparison.create') }}" method="POST" class="space-y-4">
                @csrf
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">比较方案名称</label>
                        <input type="text" name="comparison_name" placeholder="例如：演出A方案 vs 演出B方案" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">比较说明</label>
                        <input type="text" name="description" placeholder="可选：比较目的、背景等"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">选择参与比较的记录 (至少选择2个)</label>
                    <div class="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-drum-50 sticky top-0">
                                <tr>
                                    <th class="px-4 py-2 text-left w-10">
                                        <input type="checkbox" id="selectAll" class="rounded text-drum-600" onchange="toggleSelectAll()">
                                    </th>
                                    <th class="px-4 py-2 text-left text-drum-700 font-medium">批次号</th>
                                    <th class="px-4 py-2 text-left text-drum-700 font-medium">版本</th>
                                    <th class="px-4 py-2 text-left text-drum-700 font-medium">鼓径</th>
                                    <th class="px-4 py-2 text-left text-drum-700 font-medium">乐师</th>
                                    <th class="px-4 py-2 text-left text-drum-700 font-medium">频率</th>
                                    <th class="px-4 py-2 text-left text-drum-700 font-medium">状态</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">
                                @foreach($records as $record)
                                <tr class="hover:bg-drum-50/30">
                                    <td class="px-4 py-2">
                                        <input type="checkbox" name="record_ids[]" value="{{ $record->id }}" 
                                               class="record-checkbox rounded text-drum-600 focus:ring-drum-500">
                                    </td>
                                    <td class="px-4 py-2 font-mono text-drum-900">{{ $record->batch_number }}</td>
                                    <td class="px-4 py-2">v{{ $record->version }}</td>
                                    <td class="px-4 py-2">{{ $record->drum_diameter }}"</td>
                                    <td class="px-4 py-2">{{ $record->musician_name }}</td>
                                    <td class="px-4 py-2">
                                        {{ $record->latestResult?->strike_frequency ? $record->latestResult->strike_frequency . ' Hz' : '-' }}
                                    </td>
                                    <td class="px-4 py-2">
                                        @if($record->status === 'completed')
                                            <span class="badge badge-success">已完成</span>
                                        @else
                                            <span class="badge badge-secondary">草稿</span>
                                        @endif
                                    </td>
                                </tr>
                                @endforeach
                            </tbody>
                        </table>
                        @if($records->isEmpty())
                        <div class="py-8 text-center text-gray-500">
                            暂无已完成的调校记录
                        </div>
                        @endif
                    </div>
                </div>

                <div class="flex justify-end">
                    <button type="submit" 
                            class="px-6 py-2 bg-drum-700 text-white rounded-lg font-medium hover:bg-drum-800 transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            id="createCompareBtn" disabled>
                        创建并执行比较
                    </button>
                </div>
            </form>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100">
            <h3 class="section-title text-lg font-semibold text-drum-900">历史比较方案</h3>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-drum-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">方案名称</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">参与记录</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">推荐方案</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">状态</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">创建时间</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-drum-100">
                    @foreach($comparisons as $cmp)
                    <tr class="hover:bg-drum-50/50 transition">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-medium text-drum-900">{{ $cmp->comparison_name }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {{ is_array($cmp->master_record_ids) ? count($cmp->master_record_ids) : 0 }} 个
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            @if($cmp->recommended_scheme)
                                <span class="text-green-600 font-medium text-sm">{{ $cmp->recommended_scheme }}</span>
                            @else
                                <span class="text-gray-400 text-sm">-</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            @if($cmp->status === 'completed')
                                <span class="badge badge-success">已完成</span>
                            @elseif($cmp->status === 'failed')
                                <span class="badge badge-danger">失败</span>
                            @else
                                <span class="badge badge-secondary">处理中</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {{ $cmp->created_at->format('Y-m-d H:i') }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <a href="{{ route('comparison.show', $cmp->id) }}" 
                               class="text-drum-600 hover:text-drum-800 font-medium">查看</a>
                            <span class="mx-1 text-gray-300">|</span>
                            <a href="{{ route('comparison.export', $cmp->id) }}" 
                               class="text-blue-600 hover:text-blue-800 font-medium">导出</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        @if($comparisons->isEmpty())
        <div class="py-12 text-center">
            <div class="w-16 h-16 bg-drum-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-drum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
            </div>
            <p class="text-gray-500">暂无比较方案</p>
        </div>
        @endif

        <div class="px-6 py-4 border-t border-drum-100">
            {{ $comparisons->links() }}
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    function toggleSelectAll() {
        const selectAll = document.getElementById('selectAll');
        const checkboxes = document.querySelectorAll('.record-checkbox');
        checkboxes.forEach(cb => cb.checked = selectAll.checked);
        updateButtonState();
    }

    function updateButtonState() {
        const checkboxes = document.querySelectorAll('.record-checkbox:checked');
        const btn = document.getElementById('createCompareBtn');
        btn.disabled = checkboxes.length < 2;
    }

    document.querySelectorAll('.record-checkbox').forEach(cb => {
        cb.addEventListener('change', updateButtonState);
    });
</script>
@endsection
