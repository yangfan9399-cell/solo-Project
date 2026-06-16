@extends('layouts.app')

@section('content')
<div class="space-y-6">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold text-gray-800">{{ $instrument->name }}</h1>
            <p class="text-sm text-gray-500">{{ $instrument->type }} · {{ $instrument->origin }} · {{ $instrument->string_count }}弦</p>
        </div>
        <div class="flex space-x-2">
            <a href="{{ route('instruments.edit', $instrument) }}" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">编辑</a>
            <a href="{{ route('tone-libraries.index', ['instrument_id' => $instrument->id]) }}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm">目标音库</a>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-5">
        <h3 class="font-medium text-gray-700 mb-2">乐器描述</h3>
        <p class="text-gray-600 text-sm whitespace-pre-wrap">{{ $instrument->description }}</p>
        @if($instrument->tuning_notes)
        <div class="mt-3">
            <span class="text-sm text-gray-500">调弦音名：</span>
            <span class="text-sm font-medium">{{ implode(', ', $instrument->tuning_notes) }}</span>
        </div>
        @endif
    </div>

    <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-lg shadow p-5">
            <h3 class="font-medium text-gray-700 mb-3">目标音库 ({{ $instrument->toneLibraries->count() }})</h3>
            @if($instrument->toneLibraries->count() > 0)
            <table class="w-full text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="text-left px-3 py-2">音名</th>
                        <th class="text-left px-3 py-2">目标频率</th>
                        <th class="text-left px-3 py-2">容差</th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    @foreach($instrument->toneLibraries as $tone)
                    <tr>
                        <td class="px-3 py-2">{{ $tone->note_name }}</td>
                        <td class="px-3 py-2 font-mono">{{ $tone->target_freq }}Hz</td>
                        <td class="px-3 py-2">±{{ $tone->tolerance_cents }}¢</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            @else
            <p class="text-gray-400 text-sm">尚未配置目标音库</p>
            @endif
        </div>

        <div class="bg-white rounded-lg shadow p-5">
            <h3 class="font-medium text-gray-700 mb-3">调音会话 ({{ $instrument->tuningSessions->count() }})</h3>
            @if($instrument->tuningSessions->count() > 0)
            <div class="space-y-2">
                @foreach($instrument->tuningSessions->take(10) as $session)
                <div class="flex items-center justify-between text-sm">
                    <a href="{{ route('sessions.show', $session) }}" class="text-indigo-600 hover:underline">{{ $session->name }}</a>
                    <div class="flex items-center space-x-2">
                        @if($session->has_anomaly)
                        <span class="text-red-500 text-xs">⚠</span>
                        @endif
                        <span class="text-xs text-gray-400">{{ $session->status }}</span>
                    </div>
                </div>
                @endforeach
            </div>
            @else
            <p class="text-gray-400 text-sm">暂无调音会话</p>
            @endif
        </div>
    </div>
</div>
@endsection
