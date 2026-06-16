@extends('layouts.app')

@section('title', $recipe->name . ' - 配方详情')

@section('content')
<div class="max-w-3xl mx-auto">
    <div class="mb-4">
        <a href="{{ route('recipes.index') }}" class="text-amber-700 hover:text-amber-900 text-sm">
            ← 返回配方库
        </a>
    </div>

    <div class="card p-6 mb-6">
        <div class="flex items-start justify-between mb-4">
            <div>
                <h2 class="text-2xl font-bold text-amber-900">{{ $recipe->name }}</h2>
                @if($recipe->level)
                    <p class="text-amber-600 text-sm mt-1">
                        适用关卡: {{ $recipe->level->name }}
                    </p>
                @endif
                <p class="text-amber-500 text-xs mt-1">
                    by {{ $recipe->user->name }}
                </p>
            </div>
            @if($recipe->is_shared)
                <div class="text-right">
                    <span class="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm mb-2">
                        🌐 已分享
                    </span>
                    <p class="text-xs text-amber-500">分享码: <strong class="font-mono">{{ $recipe->share_code }}</strong></p>
                </div>
            @endif
        </div>

        @if($recipe->description)
            <div class="bg-amber-50 rounded-lg p-4 mb-6">
                <p class="text-amber-700 text-sm">{{ $recipe->description }}</p>
            </div>
        @endif

        @if($recipe->score !== null)
            <div class="text-center mb-6">
                <p class="text-amber-600 text-sm">配方评分</p>
                <p class="text-4xl font-bold text-amber-900">{{ number_format($recipe->score, 1) }}</p>
            </div>
        @endif

        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <p class="text-blue-500 text-sm">💧 黏度</p>
                <p class="text-2xl font-bold text-blue-700 mt-1">
                    {{ $recipe->viscosity ? number_format($recipe->viscosity, 1) : '-' }}
                </p>
            </div>
            <div class="bg-gradient-to-b from-green-50 to-green-100 rounded-xl p-4 text-center">
                <p class="text-green-500 text-sm">⏱️ 干燥时间</p>
                <p class="text-2xl font-bold text-green-700 mt-1">
                    {{ $recipe->drying_time ? number_format($recipe->drying_time, 1) . 's' : '-' }}
                </p>
            </div>
            <div class="bg-gradient-to-b from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <p class="text-purple-500 text-sm">✨ 透明度</p>
                <p class="text-2xl font-bold text-purple-700 mt-1">
                    {{ $recipe->transparency ? number_format($recipe->transparency, 1) . '%' : '-' }}
                </p>
            </div>
        </div>
    </div>

    <div class="card p-6 mb-6">
        <h3 class="font-bold text-amber-900 mb-4">🧪 配方成分</h3>

        <div class="space-y-3">
            @foreach($materials as $item)
                <div class="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full border-2 border-amber-300"
                            style="background: {{ $item['material']->color }};"></div>
                        <div>
                            <p class="font-semibold text-amber-900">{{ $item['material']->name }}</p>
                            <p class="text-xs text-amber-500">
                                {{ $item['material']->type === 'base' ? '基础胶料' : '添加剂' }}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-amber-900 text-lg">{{ number_format($item['amount'], 1) }} g</p>
                    </div>
                </div>
            @endforeach
        </div>
    </div>

    <div class="card p-6 mb-6">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="font-bold text-amber-900">🔬 重新计算</h3>
                <p class="text-sm text-amber-600 mt-1">由后端服务器重新计算配方分数，确保准确</p>
            </div>
            <button onclick="recalculateScore()" class="btn-secondary" id="recalcBtn">
                重新计算
            </button>
        </div>
        <div id="recalcResult" class="mt-4 hidden">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-green-700 text-sm">✓ 计算完成，分数已更新</p>
            </div>
        </div>
    </div>

    <div class="flex gap-4">
        @if($isOwner)
            <button onclick="shareRecipe()" class="btn-secondary flex-1" id="shareBtn">
                {{ $recipe->is_shared ? '🔗 已分享 - 复制链接' : '📤 分享配方' }}
            </button>
            <button onclick="deleteRecipe()" class="bg-red-100 text-red-600 hover:bg-red-200 px-6 py-2 rounded-lg font-semibold transition">
                删除
            </button>
        @else
            <button onclick="importThisRecipe()" class="btn-primary flex-1">
                📥 导入这个配方
            </button>
        @endif

        @if($recipe->level)
            <a href="{{ route('game.play', $recipe->level_id) }}" class="btn-primary flex-1 text-center">
                🎮 用这个配方游戏
            </a>
        @endif
    </div>
</div>

<div class="modal-overlay" id="shareModal">
    <div class="modal-content p-6">
        <h3 class="text-xl font-bold text-amber-900 mb-4">🔗 分享配方</h3>
        <p class="text-amber-600 text-sm mb-4">分享给好友，让他们也来挑战这个配方！</p>

        <div class="bg-amber-50 rounded-lg p-4 mb-4">
            <p class="text-sm text-amber-600 mb-1">分享码</p>
            <p class="font-mono text-2xl font-bold text-amber-900 tracking-wider" id="shareCodeText">-</p>
        </div>

        <div class="mb-6">
            <p class="text-sm text-amber-600 mb-1">分享链接</p>
            <div class="flex gap-2">
                <input type="text" id="shareUrlInput" readonly
                    class="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white">
                <button onclick="copyShareUrl()" class="btn-secondary !py-1 !px-3 text-sm">复制</button>
            </div>
        </div>

        <button onclick="closeShareModal()" class="btn-primary w-full">关闭</button>
    </div>
</div>

@endsection

@section('scripts')
<script>
    const recipeId = {{ $recipe->id }};
    const isOwner = {{ $isOwner ? 'true' : 'false' }};
    const shareCode = '{{ $recipe->share_code }}';
    const shareUrl = '{{ route('recipes.share-code', $recipe->share_code) }}';

    async function shareRecipe() {
        if (!isOwner) return;

        @if(!$recipe->is_shared)
            try {
                const res = await fetch(`/recipes/${recipeId}/share`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    }
                });
                const data = await res.json();
                if (data.success) {
                    showShareModal(data.recipe.share_code, data.share_url);
                }
            } catch (e) {
                console.error(e);
                alert('分享失败');
            }
        @else
            showShareModal(shareCode, shareUrl);
        @endif
    }

    function showShareModal(code, url) {
        document.getElementById('shareCodeText').textContent = code;
        document.getElementById('shareUrlInput').value = url;
        document.getElementById('shareModal').classList.add('active');
    }

    function closeShareModal() {
        document.getElementById('shareModal').classList.remove('active');
    }

    function copyShareUrl() {
        const input = document.getElementById('shareUrlInput');
        input.select();
        document.execCommand('copy');
        alert('链接已复制！');
    }

    async function deleteRecipe() {
        if (!confirm('确定要删除这个配方吗？此操作不可恢复。')) return;

        try {
            const res = await fetch(`/recipes/${recipeId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                }
            });
            if (res.ok) {
                window.location.href = '{{ route('recipes.index') }}';
            }
        } catch (e) {
            console.error(e);
            alert('删除失败');
        }
    }

    async function recalculateScore() {
        const btn = document.getElementById('recalcBtn');
        btn.disabled = true;
        btn.textContent = '计算中...';

        try {
            const res = await fetch(`/recipes/${recipeId}/recalculate`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                }
            });
            const data = await res.json();
            if (data.success) {
                document.getElementById('recalcResult').classList.remove('hidden');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (e) {
            console.error(e);
            alert('计算失败');
        }

        btn.disabled = false;
        btn.textContent = '重新计算';
    }

    async function importThisRecipe() {
        try {
            const res = await fetch('/import-recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({ share_code: shareCode })
            });
            const data = await res.json();
            if (data.success) {
                alert('配方已导入到我的配方库！');
                window.location.href = '{{ route('recipes.index') }}';
            } else {
                alert(data.error || '导入失败');
            }
        } catch (e) {
            console.error(e);
            alert('导入失败');
        }
    }
</script>
@endsection
