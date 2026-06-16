@extends('layouts.app')

@section('title', '配方库 - 胶水配比实验室')

@section('content')
<div class="mb-6">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-2xl font-bold text-amber-900">📋 配方库</h2>
            <p class="text-amber-700 mt-1">保存和分享你的独家胶水配方</p>
        </div>
        <div class="flex gap-2">
            <button onclick="showImportModal()" class="btn-secondary !py-2 !px-4 text-sm">
                📥 导入配方
            </button>
        </div>
    </div>
</div>

<div class="mb-8">
    <h3 class="font-bold text-amber-900 mb-4 flex items-center gap-2">
        <span>📝</span> 我的配方
        <span class="text-sm font-normal text-amber-500">({{ $myRecipes->total() }} 个)</span>
    </h3>

    @if($myRecipes->count() > 0)
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            @foreach($myRecipes as $recipe)
            <div class="card p-4 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-2">
                    <div>
                        <h4 class="font-bold text-amber-900">{{ $recipe->name }}</h4>
                        @if($recipe->level)
                            <p class="text-xs text-amber-500">{{ $recipe->level->name }}</p>
                        @endif
                    </div>
                    @if($recipe->is_shared)
                        <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">已分享</span>
                    @endif
                </div>

                @if($recipe->description)
                    <p class="text-sm text-amber-600 mb-3 line-clamp-2">{{ $recipe->description }}</p>
                @endif

                @if($recipe->score !== null)
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-2xl font-bold text-amber-900">{{ number_format($recipe->score, 1) }}</span>
                        <span class="text-sm text-amber-500">分</span>
                    </div>
                @endif

                <div class="grid grid-cols-3 gap-2 text-xs mb-4">
                    <div class="bg-blue-50 rounded p-2 text-center">
                        <div class="text-blue-500">黏度</div>
                        <div class="font-bold text-blue-700">{{ $recipe->viscosity ? number_format($recipe->viscosity, 1) : '-' }}</div>
                    </div>
                    <div class="bg-green-50 rounded p-2 text-center">
                        <div class="text-green-500">干燥</div>
                        <div class="font-bold text-green-700">{{ $recipe->drying_time ? number_format($recipe->drying_time, 1) . 's' : '-' }}</div>
                    </div>
                    <div class="bg-purple-50 rounded p-2 text-center">
                        <div class="text-purple-500">透明度</div>
                        <div class="font-bold text-purple-700">{{ $recipe->transparency ? number_format($recipe->transparency, 1) . '%' : '-' }}</div>
                    </div>
                </div>

                <div class="flex gap-2">
                    <a href="{{ route('recipes.show', $recipe) }}" class="btn-secondary !py-1 !px-3 text-xs flex-1 text-center">
                        查看
                    </a>
                    @if($recipe->level)
                        <a href="{{ route('game.play', $recipe->level_id) }}" class="btn-primary !py-1 !px-3 text-xs flex-1 text-center">
                            使用
                        </a>
                    @endif
                </div>
            </div>
            @endforeach
        </div>

        <div class="mt-4">
            {{ $myRecipes->links() }}
        </div>
    @else
        <div class="card p-8 text-center">
            <div class="text-5xl mb-3">📭</div>
            <p class="text-amber-600 mb-4">还没有保存任何配方</p>
            <p class="text-amber-500 text-sm mb-4">在游戏中调配出满意的配方后点击保存即可</p>
            <a href="{{ route('levels.index') }}" class="btn-primary">去调配配方</a>
        </div>
    @endif
</div>

@if($sharedRecipes->count() > 0)
<div class="mb-8">
    <h3 class="font-bold text-amber-900 mb-4 flex items-center gap-2">
        <span>🌟</span> 热门分享
    </h3>

    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        @foreach($sharedRecipes as $recipe)
        <div class="card p-4 hover:shadow-lg transition-shadow">
            <div class="flex items-start justify-between mb-2">
                <div>
                    <h4 class="font-bold text-amber-900">{{ $recipe->name }}</h4>
                    <p class="text-xs text-amber-500">by {{ $recipe->user->name }}</p>
                </div>
                <span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">分享</span>
            </div>

            @if($recipe->description)
                <p class="text-sm text-amber-600 mb-3 line-clamp-2">{{ $recipe->description }}</p>
            @endif

            <div class="grid grid-cols-3 gap-2 text-xs mb-4">
                <div class="bg-blue-50 rounded p-2 text-center">
                    <div class="text-blue-500">黏度</div>
                    <div class="font-bold text-blue-700">{{ $recipe->viscosity ? number_format($recipe->viscosity, 1) : '-' }}</div>
                </div>
                <div class="bg-green-50 rounded p-2 text-center">
                    <div class="text-green-500">干燥</div>
                    <div class="font-bold text-green-700">{{ $recipe->drying_time ? number_format($recipe->drying_time, 1) . 's' : '-' }}</div>
                </div>
                <div class="bg-purple-50 rounded p-2 text-center">
                    <div class="text-purple-500">透明度</div>
                    <div class="font-bold text-purple-700">{{ $recipe->transparency ? number_format($recipe->transparency, 1) . '%' : '-' }}</div>
                </div>
            </div>

            <div class="flex gap-2">
                <a href="{{ route('recipes.show', $recipe) }}" class="btn-secondary !py-1 !px-3 text-xs flex-1 text-center">
                    查看
                </a>
                <button onclick="likeRecipe({{ $recipe->id }})" class="btn-secondary !py-1 !px-3 text-xs">
                    ❤️ {{ $recipe->like_count }}
                </button>
            </div>
        </div>
        @endforeach
    </div>
</div>
@endif

<div class="modal-overlay" id="importModal">
    <div class="modal-content p-6">
        <h3 class="text-xl font-bold text-amber-900 mb-4">📥 导入配方</h3>
        <p class="text-sm text-amber-600 mb-4">输入分享码即可导入别人的配方</p>

        <div class="mb-6">
            <label class="block text-amber-800 mb-2 text-sm font-semibold">分享码</label>
            <input type="text" id="shareCodeInput" placeholder="输入 8 位分享码"
                class="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-lg uppercase tracking-widest font-mono">
        </div>

        <div class="flex gap-3">
            <button onclick="closeImportModal()" class="btn-secondary flex-1">取消</button>
            <button onclick="confirmImport()" class="btn-primary flex-1">导入</button>
        </div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    function showImportModal() {
        document.getElementById('importModal').classList.add('active');
    }

    function closeImportModal() {
        document.getElementById('importModal').classList.remove('active');
    }

    async function confirmImport() {
        const code = document.getElementById('shareCodeInput').value.trim().toUpperCase();
        if (!code) {
            alert('请输入分享码');
            return;
        }

        try {
            const res = await fetch('/import-recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({ share_code: code })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message || '导入成功！');
                closeImportModal();
                window.location.reload();
            } else {
                alert(data.error || '导入失败');
            }
        } catch (e) {
            console.error(e);
            alert('导入失败，请检查分享码是否正确');
        }
    }

    async function likeRecipe(id) {
        try {
            const res = await fetch(`/recipes/${id}/like`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                }
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        }
    }
</script>
@endsection
