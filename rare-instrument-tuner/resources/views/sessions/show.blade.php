@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">{{ $session->name }}</h1>
            <p class="text-sm text-gray-500 mt-1">{{ $session->instrument->name }} · {{ $session->instrument->type }} · {{ $session->instrument->origin }}</p>
        </div>
        <div class="flex space-x-2">
            <a href="{{ route('sessions.edit', $session) }}" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">编辑</a>
            <a href="{{ route('sessions.versions', $session) }}" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm">版本历史</a>
            <a href="{{ route('sessions.export', $session) }}" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm">导出CSV</a>
        </div>
    </div>

    @if($session->has_anomaly)
    <div class="bg-red-50 border border-red-300 rounded-lg p-4 anomaly-pulse">
        <h3 class="font-bold text-red-800">⚠️ 异常数据提示</h3>
        <p class="text-red-700 mt-1">{{ $session->anomaly_description }}</p>
    </div>
    @endif

    <div class="grid md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">基频</div>
            <div class="text-2xl font-bold text-indigo-600 mt-1">{{ $session->fundamental_freq ?? '-' }} <span class="text-sm font-normal text-gray-400">Hz</span></div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">状态</div>
            <div class="mt-1">
                <span class="px-3 py-1 rounded text-sm {{ match($session->status) { 'completed' => 'bg-green-100 text-green-700', 'in_progress' => 'bg-yellow-100 text-yellow-700', default => 'bg-gray-100 text-gray-600' } }}">
                    {{ match($session->status) { 'completed' => '已完成', 'in_progress' => '进行中', 'draft' => '草稿', default => $session->status } }}
                </span>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
            <div class="text-sm text-gray-500">版本数</div>
            <div class="text-2xl font-bold text-purple-600 mt-1">{{ $session->versions->count() }}</div>
        </div>
    </div>

    @if($session->notes)
    <div class="bg-white rounded-lg shadow p-4">
        <h3 class="font-medium text-gray-700 mb-2">备注</h3>
        <p class="text-gray-600 text-sm whitespace-pre-wrap">{{ $session->notes }}</p>
    </div>
    @endif

    <div class="bg-white rounded-lg shadow p-5">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-medium text-gray-700">音频上传与分析</h3>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <div class="border rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-600 mb-2">上传音频</h4>
                <form method="POST" action="{{ route('sessions.upload-audio', $session) }}" enctype="multipart/form-data">
                    @csrf
                    <input type="file" name="audio_file" accept=".wav,.mp3,.ogg,.flac" class="w-full text-sm mb-2">
                    <button type="submit" class="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700">上传</button>
                </form>
                @if($session->audio_path)
                <p class="text-green-600 text-xs mt-2">已上传: {{ basename($session->audio_path) }}</p>
                @endif
            </div>

            <div class="border rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-600 mb-2">频谱分析</h4>
                <form method="POST" action="{{ route('sessions.analyze', $session) }}">
                    @csrf
                    <div class="flex space-x-2 mb-2">
                        <div class="flex-1">
                            <label class="text-xs text-gray-500">基频(Hz)</label>
                            <input type="number" name="fundamental_freq" value="{{ $session->fundamental_freq ?? '' }}" step="0.01" class="w-full border rounded px-2 py-1 text-sm">
                        </div>
                        <div class="w-24">
                            <label class="text-xs text-gray-500">泛音数</label>
                            <input type="number" name="harmonic_count" value="8" min="1" max="32" class="w-full border rounded px-2 py-1 text-sm">
                        </div>
                    </div>
                    <button type="submit" class="bg-orange-600 text-white px-3 py-1.5 rounded text-sm hover:bg-orange-700">执行分析</button>
                </form>
            </div>
        </div>
    </div>

    @if($session->spectrumData->count() > 0)
    <div class="bg-white rounded-lg shadow p-5">
        <h3 class="font-medium text-gray-700 mb-4">频谱数据</h3>
        <div class="grid md:grid-cols-2 gap-6">
            <div>
                <canvas id="spectrumChart" height="200"></canvas>
            </div>
            <div>
                <table class="w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left px-3 py-2">序号</th>
                            <th class="text-left px-3 py-2">频率(Hz)</th>
                            <th class="text-left px-3 py-2">振幅</th>
                            <th class="text-left px-3 py-2">偏差(音分)</th>
                            <th class="text-left px-3 py-2">状态</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        @foreach($session->spectrumData->sortBy('harmonic_order') as $sd)
                        <tr class="{{ $sd->is_anomaly ? 'bg-red-50' : '' }}">
                            <td class="px-3 py-2">H{{ $sd->harmonic_order }}</td>
                            <td class="px-3 py-2 font-mono">{{ $sd->frequency }}</td>
                            <td class="px-3 py-2">{{ $sd->amplitude }}</td>
                            <td class="px-3 py-2 font-mono {{ abs($sd->deviation_cents) > 20 ? 'text-red-600 font-bold' : '' }}">{{ $sd->deviation_cents > 0 ? '+' : '' }}{{ $sd->deviation_cents }}</td>
                            <td class="px-3 py-2">
                                @if($sd->is_anomaly)
                                <span class="text-red-600 text-xs font-bold">⚠异常</span>
                                @else
                                <span class="text-green-500 text-xs">正常</span>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const ctx = document.getElementById('spectrumChart').getContext('2d');
        const data = @json($session->spectrumData->sortBy('harmonic_order')->values());
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => 'H' + d.harmonic_order),
                datasets: [{
                    label: '偏差(音分)',
                    data: data.map(d => d.deviation_cents),
                    backgroundColor: data.map(d => d.is_anomaly ? 'rgba(239,68,68,0.7)' : 'rgba(99,102,241,0.7)'),
                    borderColor: data.map(d => d.is_anomaly ? 'rgb(239,68,68)' : 'rgb(99,102,241)'),
                    borderWidth: 1
                }, {
                    label: '振幅',
                    data: data.map(d => d.amplitude * 20),
                    type: 'line',
                    borderColor: 'rgba(34,197,94,0.8)',
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: { title: { display: true, text: '泛音偏差与振幅分布' } },
                scales: { y: { title: { display: true, text: '音分 / 振幅×20' } } }
            }
        });
    });
    </script>
    @endif

    @if($session->tuningSuggestions->count() > 0)
    <div class="bg-white rounded-lg shadow p-5">
        <h3 class="font-medium text-gray-700 mb-4">调弦建议</h3>
        <div class="space-y-3">
            @foreach($session->tuningSuggestions as $suggestion)
            <div class="border rounded-lg p-3 {{ $suggestion->action === 'note' ? 'border-yellow-300 bg-yellow-50' : '' }}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="px-2 py-0.5 rounded text-xs font-bold {{ match($suggestion->action) { 'adjust' => 'bg-blue-100 text-blue-700', 'compensate' => 'bg-purple-100 text-purple-700', 'wait' => 'bg-yellow-100 text-yellow-700', 'note' => 'bg-orange-100 text-orange-700', default => 'bg-gray-100' } }}">
                            {{ match($suggestion->action) { 'adjust' => '调弦', 'compensate' => '补偿', 'wait' => '等待', 'note' => '备注', default => $suggestion->action } }}
                        </span>
                        <span class="text-sm font-medium">弦/泛音 #{{ $suggestion->string_index }}</span>
                    </div>
                    <div class="text-sm font-mono">
                        <span class="text-gray-500">{{ $suggestion->current_freq }}Hz</span>
                        <span class="mx-1">→</span>
                        <span class="text-indigo-600">{{ $suggestion->target_freq }}Hz</span>
                        <span class="ml-2 {{ abs($suggestion->adjustment_cents) > 20 ? 'text-red-600 font-bold' : 'text-gray-600' }}">
                            ({{ $suggestion->adjustment_cents > 0 ? '+' : '' }}{{ $suggestion->adjustment_cents }}¢)
                        </span>
                    </div>
                </div>
                <p class="text-sm text-gray-600 mt-2">{{ $suggestion->note }}</p>
            </div>
            @endforeach
        </div>
    </div>
    @endif

    @if($session->practiceRecords->count() > 0)
    <div class="bg-white rounded-lg shadow p-5">
        <h3 class="font-medium text-gray-700 mb-3">关联练习记录</h3>
        <table class="w-full text-sm">
            <thead class="bg-gray-50">
                <tr>
                    <th class="text-left px-3 py-2">日期</th>
                    <th class="text-left px-3 py-2">时长</th>
                    <th class="text-left px-3 py-2">精度</th>
                    <th class="text-left px-3 py-2">备注</th>
                </tr>
            </thead>
            <tbody class="divide-y">
                @foreach($session->practiceRecords as $pr)
                <tr>
                    <td class="px-3 py-2">{{ $pr->session_date->format('Y-m-d') }}</td>
                    <td class="px-3 py-2">{{ $pr->duration_minutes }}分钟</td>
                    <td class="px-3 py-2">{{ $pr->accuracy_score }}</td>
                    <td class="px-3 py-2 text-gray-500">{{ $pr->notes }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif
</div>
@endsection
