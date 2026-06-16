@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">练习曲线</h1>
        <div class="flex items-center space-x-3">
            <label class="text-sm text-gray-600">按乐器筛选：</label>
            <select id="instrumentFilter" onchange="window.location.href='{{ route('practice.chart') }}?instrument_id='+this.value" class="border rounded px-3 py-1.5 text-sm">
                <option value="">全部乐器</option>
                @foreach($instruments as $inst)
                <option value="{{ $inst->id }}" {{ $instrumentId == $inst->id ? 'selected' : '' }}>{{ $inst->name }}</option>
                @endforeach
            </select>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-5">
        <canvas id="practiceChart" height="100"></canvas>
    </div>

    <div class="bg-white rounded-lg shadow p-5">
        <canvas id="durationChart" height="80"></canvas>
    </div>

    @if($chartData->count() > 0)
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        @foreach($chartData as $cd)
        <div class="bg-white rounded-lg shadow p-4">
            <h3 class="font-medium text-gray-700 mb-2">{{ $cd['instrument_name'] }}</h3>
            @if($cd['data']->count() > 0)
            <div class="text-sm text-gray-600 space-y-1">
                <div>练习次数: <span class="font-medium">{{ $cd['data']->count() }}</span></div>
                <div>平均精度: <span class="font-medium">{{ number_format($cd['data']->avg('score'), 1) }}</span></div>
                <div>最高精度: <span class="font-medium text-green-600">{{ number_format($cd['data']->max('score'), 1) }}</span></div>
                <div>总时长: <span class="font-medium">{{ $cd['data']->sum('duration') }}分钟</span></div>
                <div>趋势: <span class="font-medium {{ ($cd['data']->last()['score'] ?? 0) > ($cd['data']->first()['score'] ?? 0) ? 'text-green-600' : 'text-red-600' }}">
                    {{ ($cd['data']->last()['score'] ?? 0) > ($cd['data']->first()['score'] ?? 0) ? '↑ 进步' : '↓ 需加强' }}
                </span></div>
            </div>
            @else
            <p class="text-gray-400 text-sm">暂无数据</p>
            @endif
        </div>
        @endforeach
    </div>
    @else
    <div class="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        暂无练习记录数据，请先添加练习记录
    </div>
    @endif
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const chartData = @json($chartData);
    if (chartData.length === 0) return;

    const colors = [
        {border: 'rgb(99,102,241)', bg: 'rgba(99,102,241,0.1)'},
        {border: 'rgb(34,197,94)', bg: 'rgba(34,197,94,0.1)'},
        {border: 'rgb(239,68,68)', bg: 'rgba(239,68,68,0.1)'},
        {border: 'rgb(234,179,8)', bg: 'rgba(234,179,8,0.1)'},
        {border: 'rgb(168,85,247)', bg: 'rgba(168,85,247,0.1)'},
        {border: 'rgb(249,115,22)', bg: 'rgba(249,115,22,0.1)'},
    ];

    const scoreCtx = document.getElementById('practiceChart').getContext('2d');
    new Chart(scoreCtx, {
        type: 'line',
        data: {
            labels: [...new Set(chartData.flatMap(c => c.data.map(d => d.date)))].sort(),
            datasets: chartData.map((c, i) => ({
                label: c.instrument_name + ' 精度',
                data: c.data.map(d => ({x: d.date, y: d.score})),
                borderColor: colors[i % colors.length].border,
                backgroundColor: colors[i % colors.length].bg,
                fill: true,
                tension: 0.3,
                pointRadius: 4,
            }))
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: '练习精度曲线' } },
            scales: {
                x: { type: 'category' },
                y: { min: 0, max: 100, title: { display: true, text: '精度分数' } }
            }
        }
    });

    const durCtx = document.getElementById('durationChart').getContext('2d');
    new Chart(durCtx, {
        type: 'bar',
        data: {
            labels: [...new Set(chartData.flatMap(c => c.data.map(d => d.date)))].sort(),
            datasets: chartData.map((c, i) => ({
                label: c.instrument_name + ' 时长',
                data: c.data.map(d => ({x: d.date, y: d.duration})),
                backgroundColor: colors[i % colors.length].bg,
                borderColor: colors[i % colors.length].border,
                borderWidth: 1,
            }))
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: '练习时长分布(分钟)' } },
            scales: { x: { type: 'category' }, y: { title: { display: true, text: '分钟' } } }
        }
    });
});
</script>
@endsection
