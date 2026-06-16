@extends('layouts.app')

@section('title', '图书修补胶水配比实验')

@section('content')
<div class="text-center py-12">
    <div class="mb-8">
        <div class="text-8xl mb-4">📚✨</div>
        <h1 class="text-4xl font-bold text-amber-900 mb-4">
            图书修补胶水配比实验
        </h1>
        <p class="text-xl text-amber-700 mb-2">
            成为最棒的图书修复师
        </p>
        <p class="text-amber-600 max-w-xl mx-auto">
            调配专属胶水配方，挑战不同纸张的修复任务。
            从普通平装书到珍贵羊皮卷，你的胶水配比技术将决定一切！
        </p>
    </div>

    <div class="flex flex-wrap justify-center gap-4 mb-12">
        <a href="{{ route('quick-play') }}" class="btn-primary text-lg px-8 py-3">
            🚀 快速开始
        </a>
        <a href="{{ route('login') }}" class="btn-secondary text-lg px-8 py-3">
            👤 登录账号
        </a>
    </div>

    <div class="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
        <div class="card p-6">
            <div class="text-4xl mb-3">🧪</div>
            <h3 class="text-lg font-bold text-amber-900 mb-2">调配胶水</h3>
            <p class="text-amber-700 text-sm">
                混合基础胶料与添加剂，精确控制黏度、干燥时间和透明度三大指标
            </p>
        </div>
        <div class="card p-6">
            <div class="text-4xl mb-3">📖</div>
            <h3 class="text-lg font-bold text-amber-900 mb-2">挑战关卡</h3>
            <p class="text-amber-700 text-sm">
                五种不同纸张类型，难度逐级递增，解锁更多神奇材料
            </p>
        </div>
        <div class="card p-6">
            <div class="text-4xl mb-3">📋</div>
            <h3 class="text-lg font-bold text-amber-900 mb-2">配方分享</h3>
            <p class="text-amber-700 text-sm">
                保存你的独家配方，分享给好友，一起探索胶水的奥秘
            </p>
        </div>
    </div>

    <div class="mt-12 card p-6 max-w-2xl mx-auto">
        <h3 class="text-lg font-bold text-amber-900 mb-4">🎯 游戏玩法</h3>
        <ol class="text-left text-amber-700 space-y-2">
            <li>1. 选择一个关卡，了解需要修复的纸张类型</li>
            <li>2. 使用已解锁的材料调配胶水，观察三项指标变化</li>
            <li>3. 尝试让胶水的黏度、干燥时间、透明度接近目标值</li>
            <li>4. 提交配方进行检验，获得评分和星级评价</li>
            <li>5. 通关后解锁新材料，挑战更高难度关卡！</li>
        </ol>
    </div>
</div>
@endsection
