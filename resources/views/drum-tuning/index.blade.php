@extends('layouts.app')

@section('title', '调校记录列表 - 传统鼓皮张力调校工具')

@section('content')
<div class="space-y-6">
    <div class="drum-card rounded-xl p-6 shadow-sm">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-drum-900">调校记录总览</h2>
                <p class="mt-1 text-gray-500">管理所有鼓皮张力调校记录，支持批次和版本追踪</p>
            </div>
            <div class="flex space-x-3">
                <a href="{{ route('drum-tuning.create') }}" 
                   class="px-4 py-2 bg-drum-700 text-white rounded-lg font-medium hover:bg-drum-800 transition shadow">
                    + 新建调校记录
                </a>
                <a href="{{ route('comparison.index') }}" 
                   class="px-4 py-2 border border-drum-300 text-drum-700 rounded-lg font-medium hover:bg-drum-50 transition">
                    方案比较
                </a>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500">总记录数</p>
                    <p class="text-3xl font-bold text-drum-800 mt-1">{{ $stats['total_records'] }}</p>
                </div>
                <div class="w-12 h-12 bg-drum-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-drum-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                </div>
            </div>
        </div>

        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500">已完成调校</p>
                    <p class="text-3xl font-bold text-green-600 mt-1">{{ $stats['completed_records'] }}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            </div>
        </div>

        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500">比较方案</p>
                    <p class="text-3xl font-bold text-blue-600 mt-1">{{ $stats['total_comparisons'] }}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                    </svg>
                </div>
            </div>
        </div>

        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500">频谱异常</p>
                    <p class="text-3xl font-bold text-orange-600 mt-1">{{ $stats['anomaly_count'] }}</p>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
            </div>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100">
            <h3 class="section-title text-lg font-semibold text-drum-900">调校记录列表</h3>
        </div>
        
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-drum-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">批次号</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">版本</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">鼓径</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">乐师</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">鼓皮材质</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">敲击频率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">状态</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-drum-100">
                    @foreach($records as $record)
                    <tr class="hover:bg-drum-50/50 transition">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-mono text-sm font-medium text-drum-900">{{ $record->batch_number }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="badge badge-info">v{{ $record->version }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {{ $record->drum_diameter }}"
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {{ $record->musician_name }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {{ $record->detailRecords->first()?->drumhead_material ?? '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            @if($record->latestResult)
                                <span class="text-sm font-medium text-drum-800">{{ $record->latestResult->strike_frequency }} Hz</span>
                                @if($record->latestResult->spectrum_anomaly)
                                    <span class="badge badge-danger ml-1">异常</span>
                                @endif
                            @else
                                <span class="text-sm text-gray-400">-</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            @if($record->status === 'completed')
                                <span class="badge badge-success">已完成</span>
                            @elseif($record->status === 'rolled_back')
                                <span class="badge badge-warning">已回滚</span>
                            @else
                                <span class="badge badge-secondary">草稿</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <a href="{{ route('drum-tuning.show', $record->id) }}" 
                               class="text-drum-600 hover:text-drum-800 font-medium">
                                查看详情
                            </a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        @if($records->isEmpty())
        <div class="py-12 text-center">
            <div class="w-16 h-16 bg-drum-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-drum-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
            </div>
            <p class="text-gray-500">暂无调校记录</p>
            <a href="{{ route('drum-tuning.create') }}" 
               class="inline-block mt-4 text-drum-600 hover:text-drum-800 font-medium">
                + 创建第一条记录
            </a>
        </div>
        @endif

        <div class="px-6 py-4 border-t border-drum-100">
            {{ $records->links() }}
        </div>
    </div>

    @if($comparisons->isNotEmpty())
    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 flex items-center justify-between">
            <h3 class="section-title text-lg font-semibold text-drum-900">最近比较方案</h3>
            <a href="{{ route('comparison.index') }}" class="text-sm text-drum-600 hover:text-drum-800">
                查看全部 →
            </a>
        </div>
        <div class="divide-y divide-drum-100">
            @foreach($comparisons as $cmp)
            <div class="px-6 py-4 flex items-center justify-between hover:bg-drum-50/50 transition">
                <div>
                    <p class="font-medium text-drum-900">{{ $cmp->comparison_name }}</p>
                    <p class="text-sm text-gray-500 mt-1">
                        参与记录: {{ is_array($cmp->master_record_ids) ? count($cmp->master_record_ids) : 0 }} 个
                        · {{ $cmp->created_at->format('Y-m-d H:i') }}
                    </p>
                </div>
                <div class="flex items-center space-x-3">
                    @if($cmp->status === 'completed')
                        <span class="badge badge-success">已完成</span>
                        @if($cmp->recommended_scheme)
                            <span class="text-sm text-green-600">推荐: {{ $cmp->recommended_scheme }}</span>
                        @endif
                    @else
                        <span class="badge badge-secondary">{{ $cmp->status }}</span>
                    @endif
                    <a href="{{ route('comparison.show', $cmp->id) }}" 
                       class="text-drum-600 hover:text-drum-800 font-medium text-sm">
                        查看
                    </a>
                </div>
            </div>
            @endforeach
        </div>
    </div>
    @endif
</div>
@endsection
