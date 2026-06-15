@extends('layouts.app')

@section('title', $comparison->comparison_name . ' - 方案比较')

@section('content')
<div class="space-y-6">
    <div class="drum-card rounded-xl p-6 shadow-sm">
        <div class="flex items-start justify-between">
            <div>
                <div class="flex items-center space-x-3">
                    <h2 class="text-2xl font-bold text-drum-900">{{ $comparison->comparison_name }}</h2>
                    @if($comparison->status === 'completed')
                        <span class="badge badge-success">比较完成</span>
                    @else
                        <span class="badge badge-secondary">{{ $comparison->status }}</span>
                    @endif
                </div>
                @if($comparison->description)
                    <p class="mt-2 text-gray-500">{{ $comparison->description }}</p>
                @endif
                <p class="mt-1 text-sm text-gray-400">
                    创建时间：{{ $comparison->created_at->format('Y年m月d日 H:i') }}
                </p>
            </div>
            <div class="flex space-x-2">
                <a href="{{ route('comparison.index') }}" 
                   class="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                    返回列表
                </a>
                <a href="{{ route('comparison.export', $comparison->id) }}" 
                   class="px-3 py-2 bg-drum-600 text-white rounded-lg text-sm font-medium hover:bg-drum-700 transition shadow">
                    导出 CSV
                </a>
            </div>
        </div>
    </div>

    @if($comparison->status === 'completed')
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">推荐方案</p>
                    <p class="text-lg font-bold text-green-600">{{ $comparison->recommended_scheme ?? '无' }}</p>
                </div>
            </div>
        </div>

        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">参与方案</p>
                    <p class="text-lg font-bold text-blue-600">{{ count($comparison->master_record_ids ?? []) }} 个</p>
                </div>
            </div>
        </div>

        <div class="drum-card rounded-xl p-5 shadow-sm">
            <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-gray-500">异常方案</p>
                    <p class="text-lg font-bold text-orange-600">
                        {{ $data['master_records']->filter(fn($r) => $r->latestResult?->spectrum_anomaly)->count() }} 个
                    </p>
                </div>
            </div>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h3 class="section-title text-lg font-semibold text-drum-900">频率对比图</h3>
        </div>
        <div class="p-6">
            <canvas id="comparisonChart" height="80"></canvas>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h3 class="section-title text-lg font-semibold text-drum-900">方案对比明细</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-drum-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">批次号</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">版本</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">鼓径</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">材质</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">敲击频率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">目标频率</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">演出环境</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">频谱</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-drum-700 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-drum-100">
                    @foreach($data['master_records'] as $record)
                    <tr class="hover:bg-drum-50/50">
                        <td class="px-6 py-4 whitespace-nowrap font-medium text-drum-900">
                            {{ $record->batch_number }}
                            @if($comparison->recommended_scheme === $record->batch_number . ' v' . $record->version)
                                <span class="badge badge-success ml-2">推荐</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="badge badge-info">v{{ $record->version }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ $record->drum_diameter }}"</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {{ $record->detailRecords->first()?->drumhead_material ?? '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-mono text-drum-800 font-medium">
                                {{ $record->latestResult?->strike_frequency ?? '-' }}
                                @if($record->latestResult) Hz @endif
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-mono text-green-600">
                                {{ $record->latestResult?->target_frequency ?? '-' }}
                                @if($record->latestResult?->target_frequency) Hz @endif
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {{ $record->latestResult?->performance_environment ?? '-' }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            @if($record->latestResult?->spectrum_anomaly)
                                <span class="badge badge-danger">异常</span>
                            @elseif($record->latestResult)
                                <span class="badge badge-success">正常</span>
                            @else
                                <span class="text-gray-400 text-sm">-</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <a href="{{ route('drum-tuning.show', $record->id) }}" 
                               class="text-drum-600 hover:text-drum-800 font-medium">详情</a>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>

    @if($comparison->conclusion)
    <div class="drum-card rounded-xl p-6 shadow-sm border-l-4 border-drum-500">
        <h3 class="text-lg font-semibold text-drum-900 mb-2">比较结论</h3>
        <p class="text-gray-700">{{ $comparison->conclusion }}</p>
    </div>
    @endif

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h3 class="section-title text-lg font-semibold text-drum-900">演出备注对比</h3>
        </div>
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @foreach($data['master_records'] as $record)
                <div class="p-4 bg-drum-50/50 rounded-lg border border-drum-100">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-medium text-drum-900">{{ $record->batch_number }}</span>
                        <span class="badge badge-info">v{{ $record->version }}</span>
                    </div>
                    @if($record->latestResult?->performance_notes)
                        <p class="text-sm text-gray-600 leading-relaxed">
                            {{ $record->latestResult->performance_notes }}
                        </p>
                    @else
                        <p class="text-sm text-gray-400 italic">暂无演出备注</p>
                    @endif
                    <div class="mt-3 pt-3 border-t border-drum-100">
                        <p class="text-xs text-gray-500">
                            环境: {{ $record->latestResult?->performance_environment ?? '未记录' }}
                            @if($record->latestResult?->ambient_temp)
                                · {{ $record->latestResult->ambient_temp }}°C
                            @endif
                        </p>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>

    @if($comparison->comparison_result && isset($comparison->comparison_result['analysis']))
    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h3 class="section-title text-lg font-semibold text-drum-900">详细分析数据</h3>
        </div>
        <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium text-drum-800 mb-3">频率分析</h4>
                    <?php $analysis = $comparison->comparison_result['analysis']; ?>
                    @if(isset($analysis['frequency']['average']))
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">平均频率</span>
                            <span class="font-mono font-medium">{{ $analysis['frequency']['average'] }} Hz</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">频率范围</span>
                            <span class="font-mono">{{ $analysis['frequency']['range'] }} Hz</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">稳定性</span>
                            <span class="badge badge-success">{{ $analysis['frequency']['stability'] }}</span>
                        </div>
                    </div>
                    @else
                    <p class="text-sm text-gray-400">数据不足</p>
                    @endif
                </div>
                <div>
                    <h4 class="font-medium text-drum-800 mb-3">材质与环境</h4>
                    @if(isset($analysis['material']))
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">材质种类</span>
                            <span>{{ $analysis['material']['count'] }} 种</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">环境种类</span>
                            <span>{{ $analysis['environment']['count'] }} 种</span>
                        </div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
    @endif
    @endif
</div>
@endsection

@section('scripts')
<script>
    @if($comparison->status === 'completed' && isset($data['chart_data']))
    const chartData = {!! json_encode($data['chart_data']) !!};
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '频率 (Hz)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '调校方案'
                    }
                }
            }
        }
    });
    @endif
</script>
@endsection
