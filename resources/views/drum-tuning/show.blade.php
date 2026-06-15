@extends('layouts.app')

@section('title', $master->batch_number . ' - 调校详情')

@section('content')
<div class="space-y-6">
    <div class="drum-card rounded-xl p-6 shadow-sm">
        <div class="flex items-start justify-between">
            <div class="flex items-start space-x-4">
                <div class="w-14 h-14 bg-gradient-to-br from-drum-400 to-drum-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg class="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
                    </svg>
                </div>
                <div>
                    <div class="flex items-center space-x-3">
                        <h2 class="text-2xl font-bold text-drum-900">{{ $master->batch_number }}</h2>
                        <span class="badge badge-info">v{{ $master->version }}</span>
                        @if($master->status === 'completed')
                            <span class="badge badge-success">已完成</span>
                        @elseif($master->status === 'rolled_back')
                            <span class="badge badge-warning">已回滚</span>
                        @else
                            <span class="badge badge-secondary">草稿</span>
                        @endif
                    </div>
                    <p class="mt-1 text-gray-500">
                        {{ $master->drum_diameter }}" 鼓 · {{ $master->musician_name }} · {{ $master->record_date->format('Y年m月d日') }}
                    </p>
                </div>
            </div>
            <div class="flex space-x-2">
                <a href="{{ route('drum-tuning.edit', $master->id) }}" 
                   class="px-3 py-2 border border-drum-200 text-drum-700 rounded-lg text-sm font-medium hover:bg-drum-50 transition">
                    编辑
                </a>
                <a href="{{ route('drum-tuning.export', $master->id) }}" 
                   class="px-3 py-2 bg-drum-600 text-white rounded-lg text-sm font-medium hover:bg-drum-700 transition shadow">
                    导出 CSV
                </a>
            </div>
        </div>

        @if($master->notes)
        <div class="mt-4 p-4 bg-drum-50 rounded-lg border border-drum-100">
            <p class="text-sm text-drum-700"><span class="font-medium">备注：</span>{{ $master->notes }}</p>
        </div>
        @endif
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="drum-card rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
                <h3 class="section-title text-lg font-semibold text-drum-900">鼓皮明细</h3>
            </div>
            <div class="p-6">
                @if($master->detailRecords->isEmpty())
                    <p class="text-gray-500 text-center py-4">暂无鼓皮明细</p>
                @else
                    <div class="space-y-4">
                        @foreach($master->detailRecords as $detail)
                        <div class="flex items-center justify-between p-4 bg-drum-50/50 rounded-lg">
                            <div class="flex items-center space-x-3">
                                <div class="w-10 h-10 bg-drum-200 rounded-full flex items-center justify-center">
                                    <svg class="w-5 h-5 text-drum-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke-width="2"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-medium text-drum-900">{{ $detail->drumhead_material }}</p>
                                    <p class="text-sm text-gray-500">
                                        {{ $detail->drum_side === 'batter' ? '击打面' : '共振面' }}
                                        @if($detail->drumhead_brand)
                                            · {{ $detail->drumhead_brand }}
                                        @endif
                                    </p>
                                </div>
                            </div>
                            <div class="text-right">
                                @if($detail->drumhead_thickness)
                                    <p class="text-lg font-bold text-drum-800">{{ $detail->drumhead_thickness }}</p>
                                    <p class="text-xs text-gray-500">mm 厚度</p>
                                @endif
                            </div>
                        </div>
                        @endforeach
                    </div>
                @endif
            </div>
        </div>

        <div class="drum-card rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50 flex items-center justify-between">
                <h3 class="section-title text-lg font-semibold text-drum-900">最新调校结果</h3>
                @if($latestResult && $latestResult->spectrum_anomaly)
                    <span class="badge badge-danger">频谱异常</span>
                @endif
            </div>
            <div class="p-6">
                @if($latestResult)
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="text-center p-4 bg-blue-50 rounded-lg">
                            <p class="text-3xl font-bold text-blue-600">{{ $latestResult->strike_frequency }}</p>
                            <p class="text-sm text-gray-500 mt-1">敲击频率 (Hz)</p>
                        </div>
                        <div class="text-center p-4 bg-green-50 rounded-lg">
                            <p class="text-3xl font-bold text-green-600">{{ $latestResult->target_frequency ?? '-' }}</p>
                            <p class="text-sm text-gray-500 mt-1">目标频率 (Hz)</p>
                        </div>
                    </div>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">演出环境</span>
                            <span class="font-medium text-drum-800">{{ $latestResult->performance_environment }}</span>
                        </div>
                        @if($latestResult->ambient_temp)
                        <div class="flex justify-between">
                            <span class="text-gray-500">环境温度</span>
                            <span class="font-medium text-drum-800">{{ $latestResult->ambient_temp }}°C</span>
                        </div>
                        @endif
                        @if($latestResult->ambient_humidity)
                        <div class="flex justify-between">
                            <span class="text-gray-500">环境湿度</span>
                            <span class="font-medium text-drum-800">{{ $latestResult->ambient_humidity }}%</span>
                        </div>
                        @endif
                        @if($latestResult->performance_notes)
                        <div class="mt-3 p-3 bg-drum-50 rounded-lg">
                            <p class="text-gray-500 mb-1">演出备注</p>
                            <p class="text-drum-800">{{ $latestResult->performance_notes }}</p>
                        </div>
                        @endif
                    </div>
                @else
                    <p class="text-gray-500 text-center py-8">暂无调校结果记录</p>
                @endif
            </div>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50 flex items-center justify-between">
            <h3 class="section-title text-lg font-semibold text-drum-900">拉绳张力变化曲线</h3>
            <span class="text-sm text-gray-500">共 {{ $master->tensionHistoryRecords->count() }} 条张力记录</span>
        </div>
        <div class="p-6">
            @if($master->tensionHistoryRecords->count() > 0)
                <canvas id="tensionChart" height="100"></canvas>
            @else
                <p class="text-gray-500 text-center py-8">暂无张力数据，添加张力记录后可查看曲线</p>
            @endif
        </div>
    </div>

    @if($latestResult && $spectrumData && $spectrumData->count() > 0)
    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50 flex items-center justify-between">
            <div>
                <h3 class="section-title text-lg font-semibold text-drum-900">频谱分析</h3>
                <p class="text-sm text-gray-500 mt-1">敲击声音的频率成分分析</p>
            </div>
            @if($latestResult->spectrum_anomaly)
                <div class="text-right">
                    <span class="badge badge-danger">{{ $latestResult->anomaly_type ?? '异常' }}</span>
                    <p class="text-xs text-gray-500 mt-1">{{ $latestResult->anomaly_description }}</p>
                </div>
            @endif
        </div>
        <div class="p-6">
            <canvas id="spectrumChart" height="120"></canvas>
        </div>
    </div>
    @endif

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50 flex items-center justify-between">
            <div>
                <h3 class="section-title text-lg font-semibold text-drum-900">张力-频率对照表</h3>
                <p class="text-sm text-gray-500 mt-1">理论计算的张力与频率对应关系</p>
            </div>
            <div class="flex space-x-2">
                @if($currentTable)
                <select id="tableVersionSelect" class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg">
                    @foreach($tableVersions as $ver)
                        <option value="{{ $ver }}" {{ $ver === $currentTable->table_version ? 'selected' : '' }}>
                            版本 {{ $ver }}
                        </option>
                    @endforeach
                </select>
                @endif
                <button onclick="document.getElementById('generateTableModal').classList.remove('hidden')" 
                        class="px-3 py-1.5 bg-drum-600 text-white rounded-lg text-sm font-medium hover:bg-drum-700 transition">
                    生成张力表
                </button>
            </div>
        </div>
        <div class="p-6">
            @if($currentTable)
                <?php
                    $tableData = $master->tensionTables()
                        ->where('table_name', $currentTable->table_name)
                        ->where('table_version', $currentTable->table_version)
                        ->where('is_rollback', false)
                        ->orderBy('measurement_point')
                        ->get();
                ?>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-drum-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-drum-700 font-medium">测量点</th>
                                <th class="px-4 py-2 text-left text-drum-700 font-medium">张力 (N)</th>
                                <th class="px-4 py-2 text-left text-drum-700 font-medium">频率 (Hz)</th>
                                <th class="px-4 py-2 text-left text-drum-700 font-medium">偏差 (Hz)</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-drum-100">
                            @foreach($tableData as $row)
                            <tr class="hover:bg-drum-50/50">
                                <td class="px-4 py-2 font-medium">{{ $row->measurement_point }}</td>
                                <td class="px-4 py-2">{{ $row->tension_value }}</td>
                                <td class="px-4 py-2 font-mono text-drum-800">{{ $row->frequency }}</td>
                                <td class="px-4 py-2">
                                    <span class="{{ $row->deviation > 0 ? 'text-green-600' : ($row->deviation < 0 ? 'text-red-600' : 'text-gray-500') }}">
                                        {{ $row->deviation > 0 ? '+' : '' }}{{ $row->deviation }}
                                    </span>
                                </td>
                            </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>

                <div class="mt-4 flex justify-end space-x-2">
                    <button onclick="document.getElementById('rollbackModal').classList.remove('hidden')" 
                            class="px-3 py-1.5 border border-orange-300 text-orange-600 rounded-lg text-sm hover:bg-orange-50 transition">
                        回滚版本
                    </button>
                    <button onclick="document.getElementById('recalculateModal').classList.remove('hidden')" 
                            class="px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg text-sm hover:bg-blue-50 transition">
                        重算参数
                    </button>
                </div>
            @else
                <p class="text-gray-500 text-center py-8">暂无张力表，点击右上角按钮生成</p>
            @endif
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="drum-card rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
                <h3 class="section-title text-lg font-semibold text-drum-900">添加张力记录</h3>
            </div>
            <div class="p-6">
                <form action="{{ route('drum-tuning.tension.add', $master->id) }}" method="POST">
                    @csrf
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">拉绳张力 (N)</label>
                            <input type="number" name="rope_tension" step="0.01" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">测量点</label>
                            <input type="number" name="measurement_point" value="1" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">扳手转数</label>
                            <input type="number" name="tuning_key_turns" step="0.1"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">操作者</label>
                            <input type="text" name="operator"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">调校原因</label>
                        <input type="text" name="adjustment_reason" placeholder="例如：演出前微调"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    </div>
                    <button type="submit" 
                            class="w-full py-2 bg-drum-600 text-white rounded-lg font-medium hover:bg-drum-700 transition">
                        添加张力记录
                    </button>
                </form>
            </div>
        </div>

        <div class="drum-card rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
                <h3 class="section-title text-lg font-semibold text-drum-900">添加调校结果</h3>
            </div>
            <div class="p-6">
                <form action="{{ route('drum-tuning.result.add', $master->id) }}" method="POST">
                    @csrf
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">敲击频率 (Hz)</label>
                            <input type="number" name="strike_frequency" step="0.01" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">目标频率 (Hz)</label>
                            <input type="number" name="target_frequency" step="0.01"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">演出环境</label>
                        <select name="performance_environment" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                            <option value="室内">室内</option>
                            <option value="室外">室外</option>
                            <option value="剧场">剧场</option>
                            <option value="露天">露天</option>
                            <option value="录音棚">录音棚</option>
                        </select>
                    </div>
                    <div class="grid grid-cols-3 gap-3 mb-4">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">温度°C</label>
                            <input type="number" name="ambient_temp" step="0.1"
                                   class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">湿度%</label>
                            <input type="number" name="ambient_humidity" step="0.1"
                                   class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">气压hPa</label>
                            <input type="number" name="ambient_pressure" step="0.1"
                                   class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                        </div>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">演出备注</label>
                        <textarea name="performance_notes" rows="2" placeholder="记录演出中的听觉感受、特殊情况..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent text-sm"></textarea>
                    </div>
                    <div class="flex items-center space-x-4 mb-4">
                        <label class="flex items-center">
                            <input type="checkbox" name="generate_spectrum" value="1" checked
                                   class="rounded text-drum-600 focus:ring-drum-500">
                            <span class="ml-2 text-sm text-gray-700">生成频谱分析</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" name="spectrum_anomaly" value="1"
                                   class="rounded text-orange-600 focus:ring-orange-500">
                            <span class="ml-2 text-sm text-gray-700">模拟频谱异常</span>
                        </label>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-medium text-gray-700 mb-1">异常类型</label>
                        <select name="anomaly_type"
                                class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg">
                            <option value="">- 无 -</option>
                            <option value="subharmonic">次谐波异常</option>
                            <option value="high_frequency_noise">高频噪声</option>
                            <option value="inharmonicity">非谐性失真</option>
                        </select>
                    </div>
                    <button type="submit" 
                            class="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">
                        添加调校结果
                    </button>
                </form>
            </div>
        </div>
    </div>

    <div class="drum-card rounded-xl shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-drum-100 bg-drum-50/50">
            <h3 class="section-title text-lg font-semibold text-drum-900">张力历史记录</h3>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-drum-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">序号</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">测量点</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">张力(N)</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">扳手转数</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">操作者</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">测量时间</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">状态</th>
                        <th class="px-6 py-3 text-left text-drum-700 font-medium">原因</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-drum-100">
                    @foreach($master->tensionHistoryRecords as $idx => $record)
                    <tr class="hover:bg-drum-50/50">
                        <td class="px-6 py-3">{{ $idx + 1 }}</td>
                        <td class="px-6 py-3 font-medium">{{ $record->measurement_point }}</td>
                        <td class="px-6 py-3 font-mono text-drum-800">{{ $record->rope_tension }}</td>
                        <td class="px-6 py-3">{{ $record->tuning_key_turns }}</td>
                        <td class="px-6 py-3">{{ $record->operator ?? '-' }}</td>
                        <td class="px-6 py-3 text-gray-500">{{ $record->measured_at?->format('Y-m-d H:i') ?? '-' }}</td>
                        <td class="px-6 py-3">
                            @if($record->is_rollback)
                                <span class="badge badge-warning">已回滚</span>
                            @else
                                <span class="badge badge-success">有效</span>
                            @endif
                        </td>
                        <td class="px-6 py-3 text-gray-500">{{ $record->adjustment_reason ?? '-' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
</div>

<div id="generateTableModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-drum-100">
            <h3 class="text-lg font-semibold text-drum-900">生成张力表</h3>
        </div>
        <form action="{{ route('drum-tuning.tension-table.generate', $master->id) }}" method="POST" class="p-6 space-y-4">
            @csrf
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">张力表名称</label>
                <input type="text" name="table_name" value="标准调校表" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">最小张力 (N)</label>
                    <input type="number" name="min_tension" value="100" step="1" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">最大张力 (N)</label>
                    <input type="number" name="max_tension" value="500" step="1" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">测量点数</label>
                    <input type="number" name="point_count" value="10" min="2" max="50" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">目标频率 (Hz)</label>
                    <input type="number" name="target_frequency" step="0.01"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-2">
                <button type="button" onclick="document.getElementById('generateTableModal').classList.add('hidden')" 
                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                    取消
                </button>
                <button type="submit" 
                        class="px-4 py-2 bg-drum-600 text-white rounded-lg font-medium hover:bg-drum-700">
                    生成
                </button>
            </div>
        </form>
    </div>
</div>

<div id="rollbackModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-drum-100">
            <h3 class="text-lg font-semibold text-drum-900">回滚张力表版本</h3>
        </div>
        <form action="{{ route('drum-tuning.tension-table.rollback', $master->id) }}" method="POST" class="p-6 space-y-4">
            @csrf
            <input type="hidden" name="table_name" value="{{ $currentTable->table_name ?? '' }}">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">回滚至版本</label>
                <select name="target_version" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    @foreach($tableVersions as $ver)
                        <option value="{{ $ver }}">版本 {{ $ver }}</option>
                    @endforeach
                </select>
            </div>
            <p class="text-sm text-gray-500">
                注意：回滚操作会创建新版本，保留历史记录可追溯。
            </p>
            <div class="flex justify-end space-x-3 pt-2">
                <button type="button" onclick="document.getElementById('rollbackModal').classList.add('hidden')" 
                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                    取消
                </button>
                <button type="submit" 
                        class="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">
                    确认回滚
                </button>
            </div>
        </form>
    </div>
</div>

<div id="recalculateModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-drum-100">
            <h3 class="text-lg font-semibold text-drum-900">重算张力表参数</h3>
        </div>
        <form action="{{ route('drum-tuning.tension-table.recalculate', $master->id) }}" method="POST" class="p-6 space-y-4">
            @csrf
            <input type="hidden" name="table_name" value="{{ $currentTable->table_name ?? '' }}">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">鼓径 (英寸)</label>
                <input type="number" name="drum_diameter" value="{{ $master->drum_diameter }}" step="0.01"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">鼓皮材质</label>
                <select name="drumhead_material" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
                    <option value="牛皮">牛皮</option>
                    <option value="羊皮">羊皮</option>
                    <option value="合成皮">合成皮</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">目标频率 (Hz)</label>
                <input type="number" name="target_frequency" step="0.01"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-drum-500 focus:border-transparent">
            </div>
            <p class="text-sm text-gray-500">
                注意：重算会生成新版本的张力表，旧版本可在版本历史中查看。
            </p>
            <div class="flex justify-end space-x-3 pt-2">
                <button type="button" onclick="document.getElementById('recalculateModal').classList.add('hidden')" 
                        class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                    取消
                </button>
                <button type="submit" 
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                    开始重算
                </button>
            </div>
        </form>
    </div>
</div>
@endsection

@section('scripts')
<script>
    @if($master->tensionHistoryRecords->count() > 0)
    const tensionCtx = document.getElementById('tensionChart').getContext('2d');
    new Chart(tensionCtx, {
        type: 'line',
        data: {!! json_encode($tensionChartData) !!},
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '张力 (N)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '测量时间'
                    }
                }
            }
        }
    });
    @endif

    @if($latestResult && $spectrumData && $spectrumData->count() > 0)
    const spectrumCtx = document.getElementById('spectrumChart').getContext('2d');
    const spectrumLabels = {!! json_encode($spectrumData->pluck('frequency')->toArray()) !!};
    const spectrumAmplitudes = {!! json_encode($spectrumData->pluck('amplitude')->toArray()) !!};
    const harmonicData = {!! json_encode($spectrumData->where('is_harmonic', true)->pluck('amplitude', 'frequency')->toArray()) !!};

    new Chart(spectrumCtx, {
        type: 'bar',
        data: {
            labels: spectrumLabels,
            datasets: [{
                label: '振幅',
                data: spectrumAmplitudes,
                backgroundColor: function(context) {
                    const idx = context.dataIndex;
                    const freq = spectrumLabels[idx];
                    const amp = spectrumAmplitudes[idx];
                    if (harmonicData[freq] !== undefined) {
                        return 'rgba(234, 88, 12, 0.7)';
                    }
                    return 'rgba(59, 130, 246, 0.5)';
                },
                borderColor: function(context) {
                    const idx = context.dataIndex;
                    const freq = spectrumLabels[idx];
                    if (harmonicData[freq] !== undefined) {
                        return 'rgb(234, 88, 12)';
                    }
                    return 'rgb(59, 130, 246)';
                },
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `振幅: ${context.parsed.y.toFixed(4)}`;
                        },
                        title: function(context) {
                            return `频率: ${context[0].label} Hz`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '振幅'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '频率 (Hz)'
                    }
                }
            }
        }
    });
    @endif
</script>
@endsection
