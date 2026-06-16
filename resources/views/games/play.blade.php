@extends('layouts.app')

@section('title', $level->title . ' - 调查中')

@section('content')
<div class="space-y-6">
    <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-white flex items-center space-x-3">
                    <span>{{ $level->id == 1 ? '🏰' : '🎨' }}</span>
                    <span>{{ $level->title }}</span>
                </h1>
                <p class="text-gray-400">第 {{ $game->current_round }} 轮 · 侦探: {{ $player->name }} {{ $player->avatar }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-4">
                <div class="bg-black/30 rounded-lg px-4 py-2">
                    <span class="text-gray-400 text-sm">⏱️ 剩余</span>
                    <span id="timer" class="text-white font-bold ml-2">{{ $game->getRemainingMinutes() }}:00</span>
                </div>
                <div id="required-clues-container" class="bg-black/30 rounded-lg px-4 py-2">
                    <span class="text-gray-400 text-sm">🔑 关键线索</span>
                    <span id="required-clues-count" class="text-yellow-400 font-bold ml-2">{{ $requiredFound }}/{{ $requiredTotal }}</span>
                </div>
                <div class="bg-black/30 rounded-lg px-4 py-2">
                    <span class="text-gray-400 text-sm">📊 分数预估</span>
                    <span id="score-estimate" class="text-green-400 font-bold ml-2">{{ $game->calculateScore() }}</span>
                </div>
                <div class="bg-{{ $spoilerRisk['color'] }}-500/20 border border-{{ $spoilerRisk['color'] }}-500/50 rounded-lg px-4 py-2">
                    <span class="text-sm">{{ $spoilerRisk['label'] }}</span>
                    <span class="text-white font-bold ml-2">{{ $spoilerRisk['total'] }}</span>
                </div>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
            <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span>📜</span>
                    <span>案件背景</span>
                </h2>
                <p class="text-gray-300 leading-relaxed whitespace-pre-line">{{ $level->story_intro }}</p>
            </div>

            <div id="drop-zone" class="drop-zone bg-white/5 backdrop-blur rounded-xl p-6 border-2 border-dashed border-white/20 min-h-[200px]">
                <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span>🗂️</span>
                    <span>已收集线索 ({{ $distributedClues->count() }})</span>
                    <span class="text-sm text-gray-400 ml-2">- 拖动线索到此处进行发放</span>
                </h2>
                @if($distributedClues->count() > 0)
                    <div id="distributed-clues" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        @foreach($distributedClues as $clue)
                            <div class="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-lg p-4 border border-purple-500/30 fade-in">
                                <div class="flex items-start justify-between mb-2">
                                    <div class="flex items-center space-x-2">
                                        <span class="text-3xl">{{ $clue->icon }}</span>
                                        <div>
                                            <h3 class="font-bold text-white">{{ $clue->title }}</h3>
                                            <span class="text-xs text-purple-300">{{ $clue->getCategoryLabel() }}</span>
                                        </div>
                                    </div>
                                    @if($clue->is_required)
                                        <span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">🔑 关键</span>
                                    @endif
                                </div>
                                <p class="text-gray-300 text-sm leading-relaxed">{{ $clue->content }}</p>
                                <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
                                    <span>重要度: {{ $clue->importance_score }}%</span>
                                    <span>{{ $clue->getSpoilerRiskLabel() }}</span>
                                </div>
                            </div>
                        @endforeach
                    </div>
                @else
                    <div class="text-center py-12 text-gray-500">
                        <div class="text-5xl mb-4">🔍</div>
                        <p>还没有收集到任何线索</p>
                        <p class="text-sm mt-2">从右侧线索库中拖拽线索卡到此处，或通过提问获取线索</p>
                    </div>
                @endif
            </div>

            <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span>❓</span>
                    <span>侦探提问</span>
                </h2>
                <form id="question-form" class="space-y-4">
                    @csrf
                    <textarea name="question" id="question-input" rows="3"
                        placeholder="向主持人提问，例如：'谁有作案动机？'、'现场有什么奇怪的地方？'..."
                        class="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"></textarea>
                    <div class="flex items-center justify-between">
                        <p class="text-sm text-gray-500">💡 好的提问可能会触发新线索的发现</p>
                        <button type="submit" class="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg font-medium transition">
                            提交问题
                        </button>
                    </div>
                </form>

                <div id="questions-history" class="mt-6 space-y-3 max-h-96 overflow-y-auto">
                    @foreach($playerQuestions as $pq)
                        <div class="bg-black/30 rounded-lg p-4">
                            <div class="flex items-start space-x-3">
                                <span class="text-2xl">{{ $player->avatar }}</span>
                                <div class="flex-1">
                                    <p class="text-white font-medium">{{ $pq->question }}</p>
                                    <p class="text-xs text-gray-500 mt-1">第 {{ $pq->round_number }} 轮 · 相关度: {{ $pq->relevance_score }}%</p>
                                </div>
                                @if($pq->is_relevant)
                                    <span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">相关</span>
                                @else
                                    <span class="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">一般</span>
                                @endif
                            </div>
                            <div class="mt-3 ml-10 p-3 bg-purple-500/10 border-l-2 border-purple-500 rounded">
                                <p class="text-purple-200 text-sm">🎙️ 主持人：{{ $pq->host_response }}</p>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <h2 id="clue-library-title" class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span>🎴</span>
                    <span>线索库 ({{ $undistributedClues->count() }})</span>
                </h2>
                <p class="text-sm text-gray-500 mb-4">💡 拖动线索卡到左侧"已收集线索"区域进行发放</p>
                <div id="clue-library" class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    @foreach($undistributedClues as $clue)
                        <div class="clue-card bg-black/40 rounded-lg p-4 border border-white/10 hover:border-purple-500/50"
                            draggable="true"
                            data-clue-id="{{ $clue->id }}"
                            data-clue-title="{{ $clue->title }}"
                            data-clue-content="{{ $clue->content }}"
                            data-clue-icon="{{ $clue->icon }}"
                            data-clue-category="{{ $clue->getCategoryLabel() }}"
                            data-clue-importance="{{ $clue->importance_score }}"
                            data-clue-spoiler="{{ $clue->getSpoilerRiskLabel() }}"
                            data-clue-required="{{ $clue->is_required ? '1' : '0' }}">
                            <div class="flex items-start justify-between">
                                <div class="flex items-center space-x-2">
                                    <span class="text-2xl">{{ $clue->icon }}</span>
                                    <div>
                                        <h3 class="font-semibold text-white text-sm">{{ $clue->title }}</h3>
                                        <span class="text-xs text-gray-500">{{ $clue->getCategoryLabel() }}</span>
                                    </div>
                                </div>
                                <button class="distribute-btn text-xs px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-white rounded transition"
                                    data-clue-id="{{ $clue->id }}">
                                    发放
                                </button>
                            </div>
                            <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                                <span>重要: {{ $clue->importance_score }}%</span>
                                @if($clue->is_required)
                                    <span class="text-yellow-400">🔑 关键</span>
                                @else
                                    <span>{{ $clue->getSpoilerRiskLabel() }}</span>
                                @endif
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>

            <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
                <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                    <span>📋</span>
                    <span>操作历史</span>
                </h2>
                <div id="operation-history" class="space-y-2 max-h-60 overflow-y-auto">
                    @foreach($operationHistory as $op)
                        <div class="flex items-center justify-between text-sm bg-black/30 rounded-lg p-3">
                            <span class="text-gray-300">{{ $op->getOperationTypeLabel() }}</span>
                            @if($op->can_undo)
                                <form action="{{ route('games.undo', [$game, $op]) }}" method="POST" class="inline">
                                    @csrf
                                    <button type="submit" class="text-xs px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded transition">
                                        ↩️ 撤销
                                    </button>
                                </form>
                            @else
                                <span class="text-xs text-gray-600">已处理</span>
                            @endif
                        </div>
                    @endforeach
                    @if($operationHistory->count() == 0)
                        <p class="text-gray-500 text-sm text-center py-4">暂无操作记录</p>
                    @endif
                </div>
            </div>

            <div class="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 space-y-3">
                <form action="{{ route('games.advance-round', $game) }}" method="POST">
                    @csrf
                    <button type="submit" class="w-full py-3 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2">
                        <span>⏭️</span>
                        <span>进入下一轮</span>
                    </button>
                </form>

                <button id="solve-btn" type="button"
                    class="w-full py-3 {{ $canSolve ? 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500' : 'bg-gray-600/50 cursor-not-allowed' }} text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                    {{ $canSolve ? '' : 'disabled' }}>
                    <span>🎯</span>
                    <span>{{ $canSolve ? '提交推理破案' : '需要更多关键线索 (' . $requiredFound . '/' . $requiredTotal . ')' }}</span>
                </button>

                <form action="{{ route('games.abandon', $game) }}" method="POST" onsubmit="return confirm('确定要放弃这局游戏吗？所有进度将丢失。');">
                    @csrf
                    <button type="submit" class="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition">
                        放弃本局
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<div id="solve-modal" class="hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-800 rounded-2xl p-8 max-w-2xl w-full border border-white/10">
        <h2 class="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>🎯</span>
            <span>提交你的推理</span>
        </h2>
        <p class="text-gray-400 mb-6">详细描述你对案件的推理：谁是凶手？动机是什么？作案手法是怎样的？</p>
        <form id="solve-form" action="{{ route('games.solve', $game) }}" method="POST">
            @csrf
            <textarea name="accusation" id="accusation-input" rows="6"
                placeholder="写下你的完整推理，包括凶手身份、作案动机、犯罪手法、以及关键证据..."
                class="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition resize-none mb-4"></textarea>
            <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p class="text-yellow-400 text-sm">⚠️ 提交后本局游戏将结束，请确保你已经收集了足够的证据并进行了充分的推理！</p>
            </div>
            <div class="flex space-x-4">
                <button type="button" id="close-modal" class="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition">
                    取消
                </button>
                <button type="submit" class="flex-1 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white rounded-lg font-bold transition">
                    ✅ 确认提交
                </button>
            </div>
        </form>
    </div>
</div>

<div id="toast" class="hidden fixed bottom-6 right-6 z-50 px-6 py-3 rounded-lg shadow-2xl text-white font-medium fade-in"></div>
@endsection

@section('scripts')
<script>
const gameId = {{ $game->id }};
const distributeUrl = "{{ route('games.distribute-clue', $game) }}";
const askQuestionUrl = "{{ route('games.ask-question', $game) }}";
const scoreEstimateUrl = "{{ route('games.score-estimate', $game) }}";
let remainingSeconds = {{ $game->getRemainingMinutes() * 60 }};
let cluesDistributedCount = {{ $distributedClues->count() }};

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'fixed bottom-6 right-6 z-50 px-6 py-3 rounded-lg shadow-2xl text-white font-medium fade-in';
    if (type === 'success') toast.classList.add('bg-green-600');
    else if (type === 'error') toast.classList.add('bg-red-600');
    else toast.classList.add('bg-blue-600');
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function updateTimer() {
    if (remainingSeconds <= 0) {
        document.getElementById('timer').textContent = '0:00';
        return;
    }
    remainingSeconds--;
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    document.getElementById('timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}
setInterval(updateTimer, 1000);

function updateClueCounts() {
    const libraryCount = document.querySelectorAll('#clue-library .clue-card').length;
    document.querySelector('#drop-zone h2').innerHTML = `
        <span>🗂️</span>
        <span>已收集线索 (${cluesDistributedCount})</span>
        <span class="text-sm text-gray-400 ml-2">- 拖动线索到此处进行发放</span>
    `;
    const libraryTitle = document.getElementById('clue-library-title');
    if (libraryTitle) {
        libraryTitle.innerHTML = `
            <span>🎴</span>
            <span>线索库 (${libraryCount})</span>
        `;
    }
}

function updateScoreEstimate() {
    return fetch(scoreEstimateUrl, {
        headers: { 'Accept': 'application/json' }
    })
    .then(res => res.json())
    .then(data => {
        if (data.score !== undefined) {
            const scoreEl = document.getElementById('score-estimate');
            scoreEl.textContent = data.score;
            scoreEl.classList.add('text-yellow-400');
            setTimeout(() => scoreEl.classList.remove('text-yellow-400'), 1000);
        }
        return data;
    })
    .catch(err => {
        console.error('分数更新失败:', err);
    });
}

function updateRequiredCluesCount(found, total) {
    const requiredEl = document.getElementById('required-clues-count');
    if (requiredEl) {
        requiredEl.textContent = `${found}/${total}`;
        const container = document.getElementById('required-clues-container');
        container.classList.add('ring-2', 'ring-yellow-400', 'ring-opacity-50');
        setTimeout(() => {
            container.classList.remove('ring-2', 'ring-yellow-400', 'ring-opacity-50');
        }, 1500);
    }
}

function distributeClue(clueId) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    return fetch(distributeUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        },
        body: JSON.stringify({ clue_card_id: clueId, reason: '拖拽发放' })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast('✅ ' + data.message);
            addDistributedClue(data.clue);
            removeClueFromLibrary(clueId);
            cluesDistributedCount++;
            updateClueCounts();
            if (data.required_found !== undefined && data.required_total !== undefined) {
                updateRequiredCluesCount(data.required_found, data.required_total);
            }
            return updateScoreEstimate().then(() => data);
        } else {
            showToast('❌ ' + (data.error || '发放失败'), 'error');
            throw new Error(data.error || '发放失败');
        }
    })
    .catch(err => {
        console.error(err);
        if (!err.message.includes('发放失败')) {
            showToast('❌ 网络错误', 'error');
        }
        throw err;
    });
}

function addDistributedClue(clue) {
    let container = document.getElementById('distributed-clues');
    if (!container) {
        const dropZone = document.getElementById('drop-zone');
        dropZone.innerHTML = `
            <h2 class="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <span>🗂️</span>
                <span>已收集线索 (1)</span>
                <span class="text-sm text-gray-400 ml-2">- 拖动线索到此处进行发放</span>
            </h2>
            <div id="distributed-clues" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
        `;
        container = document.getElementById('distributed-clues');
    }

    const div = document.createElement('div');
    div.className = 'bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-lg p-4 border border-purple-500/30 fade-in';
    div.setAttribute('data-clue-id', clue.id);
    div.innerHTML = `
        <div class="flex items-start justify-between mb-2">
            <div class="flex items-center space-x-2">
                <span class="text-3xl">${clue.icon}</span>
                <div>
                    <h3 class="font-bold text-white">${escapeHtml(clue.title)}</h3>
                    <span class="text-xs text-purple-300">${escapeHtml(clue.category)}</span>
                </div>
            </div>
            ${clue.is_required ? '<span class="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">🔑 关键</span>' : ''}
        </div>
        <p class="text-gray-300 text-sm leading-relaxed">${escapeHtml(clue.content)}</p>
        <div class="mt-3 flex items-center justify-between text-xs text-gray-500">
            <span>重要度: ${clue.importance}%</span>
        </div>
    `;
    container.appendChild(div);

    div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function removeClueFromLibrary(clueId) {
    const card = document.querySelector(`.clue-card[data-clue-id="${clueId}"]`);
    if (card) {
        card.style.transition = 'all 0.3s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateX(100px) scale(0.8)';
        setTimeout(() => {
            card.remove();
            updateClueCounts();
        }, 300);
    }
}

document.querySelectorAll('.clue-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.clueId);
        e.dataTransfer.effectAllowed = 'move';
    });
    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });
});

const dropZone = document.getElementById('drop-zone');
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', (e) => {
    if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('drag-over');
    }
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const clueId = e.dataTransfer.getData('text/plain');
    if (clueId) {
        distributeClue(parseInt(clueId));
    }
});

document.querySelectorAll('.distribute-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const clueId = btn.dataset.clueId;
        const btnOriginalText = btn.textContent;
        btn.textContent = '发放中...';
        btn.disabled = true;
        distributeClue(parseInt(clueId))
            .catch(() => {
                btn.textContent = btnOriginalText;
                btn.disabled = false;
            });
    });
});

document.getElementById('question-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('question-input');
    const question = input.value.trim();
    if (!question) return;

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '发送中...';

    fetch(askQuestionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken,
            'Accept': 'application/json'
        },
        body: JSON.stringify({ question: question })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const toastMsg = data.is_relevant ? '💡 好问题！获得了主持人的详细回答' : '📝 问题已记录';
            showToast(toastMsg, data.is_relevant ? 'success' : 'info');
            addQuestionToHistory(data);
            input.value = '';

            if (data.related_clue_id && !document.querySelector(`#distributed-clues [data-clue-id="${data.related_clue_id}"]`)) {
                showToast('🔍 你的提问触发了新线索！正在发放...', 'info');
                setTimeout(() => {
                    distributeClue(data.related_clue_id)
                        .then(() => {
                            showToast('🎴 新线索已加入收集区！', 'success');
                            updateScoreEstimate();
                        })
                        .catch(() => {});
                }, 800);
            } else {
                updateScoreEstimate();
            }
        } else {
            showToast('❌ ' + (data.error || '提问失败'), 'error');
        }
    })
    .catch(err => {
        console.error(err);
        showToast('❌ 网络错误', 'error');
    })
    .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = '提交问题';
    });
});

function addQuestionToHistory(data) {
    const container = document.getElementById('questions-history');
    const div = document.createElement('div');
    div.className = 'bg-black/30 rounded-lg p-4 fade-in';
    div.innerHTML = `
        <div class="flex items-start space-x-3">
            <span class="text-2xl">{{ $player->avatar }}</span>
            <div class="flex-1">
                <p class="text-white font-medium">${escapeHtml(data.question)}</p>
                <p class="text-xs text-gray-500 mt-1">第 ${data.round} 轮 · 相关度: <span class="${data.is_relevant ? 'text-green-400' : 'text-gray-400'}">${data.relevance_score}%</span></p>
            </div>
            ${data.is_relevant
                ? '<span class="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">相关</span>'
                : '<span class="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">一般</span>'}
        </div>
        <div class="mt-3 ml-10 p-3 bg-purple-500/10 border-l-2 border-purple-500 rounded">
            <p class="text-purple-200 text-sm">🎙️ 主持人：${escapeHtml(data.response)}</p>
        </div>
        ${data.related_clue_id ? '<div class="mt-2 ml-10 text-xs text-yellow-400">🔍 此提问触发了新线索！</div>' : ''}
    `;
    container.insertBefore(div, container.firstChild);
    div.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const solveBtn = document.getElementById('solve-btn');
const solveModal = document.getElementById('solve-modal');
const closeModal = document.getElementById('close-modal');

if (solveBtn && solveModal) {
    solveBtn.addEventListener('click', () => {
        if (!solveBtn.disabled) {
            solveModal.classList.remove('hidden');
        }
    });
    closeModal.addEventListener('click', () => {
        solveModal.classList.add('hidden');
    });
    solveModal.addEventListener('click', (e) => {
        if (e.target === solveModal) {
            solveModal.classList.add('hidden');
        }
    });
}
</script>
@endsection
