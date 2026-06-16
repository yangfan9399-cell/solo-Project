@extends('layouts.app')

@section('title', '选择侦探档案')

@section('content')
<div class="max-w-4xl mx-auto">
    <div class="text-center mb-10">
        <div class="text-6xl mb-4">🎭</div>
        <h1 class="text-4xl font-bold text-white mb-2">选择你的侦探身份</h1>
        <p class="text-gray-400">选择一个已有档案或创建新的侦探身份</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        @foreach($players as $player)
            <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition {{ $currentPlayerId == $player->id ? 'ring-2 ring-purple-500' : '' }}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <div class="text-5xl">{{ $player->avatar }}</div>
                        <div>
                            <h3 class="text-xl font-bold text-white">{{ $player->name }}</h3>
                            <p class="text-gray-400 text-sm">资深侦探</p>
                        </div>
                    </div>
                    @if($currentPlayerId == $player->id)
                        <span class="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">当前使用</span>
                    @endif
                </div>

                <div class="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div class="bg-black/20 rounded-lg p-3">
                        <div class="text-2xl font-bold text-yellow-400">{{ $player->total_score }}</div>
                        <div class="text-xs text-gray-500">累计积分</div>
                    </div>
                    <div class="bg-black/20 rounded-lg p-3">
                        <div class="text-2xl font-bold text-blue-400">{{ $player->games_played }}</div>
                        <div class="text-xs text-gray-500">总场次</div>
                    </div>
                    <div class="bg-black/20 rounded-lg p-3">
                        <div class="text-2xl font-bold text-green-400">{{ $player->winRate() }}%</div>
                        <div class="text-xs text-gray-500">破案率</div>
                    </div>
                </div>

                <div class="flex space-x-3">
                    <a href="{{ route('players.select', $player) }}" class="flex-1 py-2 text-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium">
                        使用此档案
                    </a>
                    <a href="{{ route('players.show', $player) }}" class="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition">
                        详情
                    </a>
                </div>
            </div>
        @endforeach
    </div>

    <div class="text-center">
        <a href="{{ route('players.create') }}" class="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-lg font-semibold transition">
            <span>✨</span>
            <span>创建新侦探档案</span>
        </a>
    </div>
</div>
@endsection
