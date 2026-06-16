@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">版本历史</h1>
            <p class="text-sm text-gray-500">{{ $session->name }}</p>
        </div>
        <a href="{{ route('sessions.show', $session) }}" class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm">返回详情</a>
    </div>

    <div class="space-y-3">
        @foreach($versions as $version)
        <div class="bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div>
                    <span class="font-bold text-indigo-600">v{{ $version->version_number }}</span>
                    <span class="text-sm text-gray-600 ml-3">{{ $version->change_description }}</span>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="text-xs text-gray-400">{{ $version->created_at->format('Y-m-d H:i:s') }}</span>
                    <a href="{{ route('sessions.versions.show', [$session, $version]) }}" class="text-indigo-600 hover:underline text-xs">查看快照</a>
                    <form method="POST" action="{{ route('sessions.versions.restore', [$session, $version]) }}" onsubmit="return confirm('确认恢复到v{{ $version->version_number }}？这将创建新版本。')">
                        @csrf
                        <button type="submit" class="text-orange-600 hover:underline text-xs">恢复到此版本</button>
                    </form>
                </div>
            </div>
            <div class="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-500">
                <div>基频: {{ $version->snapshot_data['fundamental_freq'] ?? '-' }}Hz</div>
                <div>状态: {{ $version->snapshot_data['status'] ?? '-' }}</div>
                <div>异常: {{ ($version->snapshot_data['has_anomaly'] ?? false) ? '是' : '否' }}</div>
                <div>泛音数: {{ count($version->snapshot_data['spectrum_data'] ?? []) }}</div>
            </div>
        </div>
        @endforeach
    </div>

    <div class="flex justify-center">
        {{ $versions->withQueryString()->links() }}
    </div>
</div>
@endsection
