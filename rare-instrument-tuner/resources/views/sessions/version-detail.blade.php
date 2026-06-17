@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">版本快照 v{{ $version->version_number }}</h1>
            <p class="text-sm text-gray-500">{{ $session->name }} · {{ $version->change_description }}</p>
        </div>
        <div class="flex space-x-2">
            <a href="{{ route('sessions.versions', $session) }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">返回版本列表</a>
            <form method="POST" action="{{ route('sessions.versions.restore', [$session, $version]) }}" onsubmit="return confirm('确认恢复？将把当前会话还原到此版本快照，并创建新版本记录。')">
                @csrf
                <button type="submit" class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm">恢复此版本</button>
            </form>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-5">
        <h3 class="font-medium text-gray-700 mb-3">快照数据 ({{ $version->created_at->format('Y-m-d H:i:s') }})</h3>

        <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-3">
                <div>
                    <label class="text-xs text-gray-500">会话名称</label>
                    <p class="text-sm font-medium">{{ $version->snapshot_data['name'] ?? '-' }}</p>
                </div>
                <div>
                    <label class="text-xs text-gray-500">基频</label>
                    <p class="text-sm font-mono">{{ $version->snapshot_data['fundamental_freq'] ?? '-' }} Hz</p>
                </div>
                <div>
                    <label class="text-xs text-gray-500">状态</label>
                    <p class="text-sm">
                        <span class="px-2 py-0.5 rounded text-xs {{ match(($version->snapshot_data['status'] ?? null)) { 'completed' => 'bg-green-100 text-green-700', 'in_progress' => 'bg-yellow-100 text-yellow-700', default => 'bg-gray-100 text-gray-600' } }}">
                            {{ match(($version->snapshot_data['status'] ?? null)) { 'draft' => '草稿', 'in_progress' => '进行中', 'completed' => '已完成', default => $version->snapshot_data['status'] ?? '-' } }}
                        </span>
                    </p>
                </div>
                <div>
                    <label class="text-xs text-gray-500">异常</label>
                    <p class="text-sm {{ ($version->snapshot_data['has_anomaly'] ?? false) ? 'text-red-600' : '' }}">
                        {{ ($version->snapshot_data['has_anomaly'] ?? false) ? '是 - ' . ($version->snapshot_data['anomaly_description'] ?? '') : '否' }}
                    </p>
                </div>
                <div>
                    <label class="text-xs text-gray-500">备注</label>
                    <p class="text-sm whitespace-pre-wrap">{{ $version->snapshot_data['notes'] ?? '-' }}</p>
                </div>
            </div>

            <div>
                <label class="text-xs text-gray-500">频谱数据 ({{ count($version->snapshot_data['spectrum_data'] ?? []) }}条)</label>
                @if(count($version->snapshot_data['spectrum_data'] ?? []) > 0)
                <table class="w-full text-xs mt-2">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-2 py-1">序号</th>
                            <th class="px-2 py-1">频率</th>
                            <th class="px-2 py-1">偏差</th>
                            <th class="px-2 py-1">异常</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($version->snapshot_data['spectrum_data'] ?? [] as $sd)
                        <tr class="{{ ($sd['is_anomaly'] ?? false) ? 'bg-red-50' : '' }}">
                            <td class="px-2 py-1">H{{ $sd['harmonic_order'] }}</td>
                            <td class="px-2 py-1 font-mono">{{ $sd['frequency'] }}</td>
                            <td class="px-2 py-1">{{ $sd['deviation_cents'] }}</td>
                            <td class="px-2 py-1">{{ ($sd['is_anomaly'] ?? false) ? '⚠' : '' }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
                @else
                <p class="text-sm text-gray-400 mt-2">无频谱数据</p>
                @endif
            </div>
        </div>

        <div class="mt-6">
            <label class="text-xs text-gray-500">调弦建议 ({{ count($version->snapshot_data['suggestions'] ?? []) }}条)</label>
            @if(count($version->snapshot_data['suggestions'] ?? []) > 0)
            <div class="space-y-2 mt-2">
                @foreach($version->snapshot_data['suggestions'] ?? [] as $sg)
                <div class="border rounded p-3 text-sm {{ ($sg['action'] ?? '') === 'note' ? 'border-yellow-300 bg-yellow-50' : '' }}">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-0.5 rounded text-xs font-bold {{ match(($sg['action'] ?? null)) { 'adjust' => 'bg-blue-100 text-blue-700', 'compensate' => 'bg-purple-100 text-purple-700', 'wait' => 'bg-yellow-100 text-yellow-700', 'note' => 'bg-orange-100 text-orange-700', default => 'bg-gray-100 text-gray-600' } }}">
                                {{ match(($sg['action'] ?? null)) { 'adjust' => '调弦', 'compensate' => '补偿', 'wait' => '等待', 'note' => '备注', default => $sg['action'] ?? '未知' } }}
                            </span>
                            <span>弦/泛音 #{{ $sg['string_index'] ?? '-' }}</span>
                        </div>
                        <div class="font-mono text-xs">
                            <span class="text-gray-500">{{ $sg['current_freq'] ?? '-' }}Hz</span>
                            <span class="mx-1">→</span>
                            <span class="text-indigo-600">{{ $sg['target_freq'] ?? '-' }}Hz</span>
                            <span class="ml-2">({{ ($sg['adjustment_cents'] ?? 0) > 0 ? '+' : '' }}{{ $sg['adjustment_cents'] ?? 0 }}¢)</span>
                        </div>
                    </div>
                    <p class="text-gray-600 mt-2 text-xs">{{ $sg['note'] ?? '' }}</p>
                </div>
                @endforeach
            </div>
            @else
            <p class="text-sm text-gray-400 mt-2">无调弦建议</p>
            @endif
        </div>
    </div>
</div>
@endsection
