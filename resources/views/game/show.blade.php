@extends('layouts.app')

@section('title', $gameState['level']->name)

@section('styles')
<style>
    .cipher-display {
        font-family: 'SF Mono', 'Menlo', monospace;
        font-size: 1.1rem;
        line-height: 2;
        word-break: break-all;
        letter-spacing: 0.1em;
    }
    .cipher-char {
        display: inline-block;
        min-width: 1.8rem;
        text-align: center;
        padding: 0.2rem 0.1rem;
        border-radius: 0.25rem;
        transition: all 0.15s;
    }
    .cipher-char.decrypted {
        background: rgba(16, 185, 129, 0.15);
        color: #6ee7b7;
        border-bottom: 2px solid #10b981;
    }
    .cipher-char.unknown {
        color: #94a3b8;
        border-bottom: 2px dashed #475569;
    }
    .cipher-char.space {
        color: transparent;
        border: none;
        min-width: 0.8rem;
    }
    .rotor-wheel {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        background: rgba(15, 23, 42, 0.9);
        border: 2px solid rgba(99, 102, 241, 0.5);
        border-radius: 0.75rem;
        padding: 0.5rem;
        min-width: 60px;
    }
    .rotor-btn {
        width: 36px;
        height: 28px;
        background: rgba(99, 102, 241, 0.3);
        border: none;
        color: #a5b4fc;
        border-radius: 0.35rem;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.15s;
    }
    .rotor-btn:hover { background: rgba(99, 102, 241, 0.6); }
    .rotor-value {
        font-size: 1.75rem;
        font-weight: bold;
        color: #fbbf24;
        padding: 0.5rem 0;
        font-family: monospace;
    }
    .sub-grid {
        display: grid;
        grid-template-columns: repeat(13, 1fr);
        gap: 0.4rem;
    }
    @media (max-width: 768px) {
        .sub-grid { grid-template-columns: repeat(6, 1fr); }
    }
    .sub-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.5rem 0.25rem;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 0.4rem;
        transition: all 0.15s;
    }
    .sub-cell:hover {
        border-color: #6366f1;
        background: rgba(99, 102, 241, 0.1);
    }
    .sub-cell.mapped {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.1);
    }
    .sub-from {
        font-size: 0.85rem;
        color: #94a3b8;
        font-family: monospace;
    }
    .sub-to {
        font-size: 1.1rem;
        font-weight: bold;
        font-family: monospace;
        min-height: 1.3rem;
    }
    .sub-to.mapped { color: #6ee7b7; }
    .sub-to.unmapped { color: #475569; }
    .sub-input {
        width: 100%;
        background: transparent;
        border: 1px solid rgba(99, 102, 241, 0.4);
        border-radius: 0.25rem;
        color: #a5b4fc;
        text-align: center;
        font-size: 0.9rem;
        padding: 0.15rem;
        text-transform: uppercase;
        font-family: monospace;
    }
    .freq-bar {
        height: 20px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6);
        border-radius: 0.25rem;
        transition: width 0.3s;
    }
    .freq-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.25rem;
    }
    .freq-letter {
        width: 1.5rem;
        font-weight: bold;
        font-family: monospace;
        color: #cbd5e1;
    }
    .freq-bar-container {
        flex: 1;
        background: rgba(15, 23, 42, 0.6);
        border-radius: 0.25rem;
        overflow: hidden;
    }
    .freq-count {
        width: 4rem;
        text-align: right;
        font-size: 0.8rem;
        color: #94a3b8;
    }
    .note-item {
        background: rgba(15, 23, 42, 0.6);
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
        border-left: 3px solid #6366f1;
    }
    .note-category {
        font-size: 0.75rem;
        color: #a5b4fc;
        margin-bottom: 0.25rem;
    }
    .pattern-item {
        background: rgba(15, 23, 42, 0.6);
        padding: 0.5rem 0.75rem;
        border-radius: 0.4rem;
        margin-bottom: 0.4rem;
        font-family: monospace;
    }
    .hud-bar {
        display: flex;
        gap: 1.5rem;
        padding: 0.75rem 1.25rem;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }
    .hud-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }
    .hud-label { color: #94a3b8; font-size: 0.85rem; }
    .hud-value { font-weight: bold; color: #fbbf24; }
    .hud-value.danger { color: #ef4444; }
    .hud-value.success { color: #10b981; }
    .tabs {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    }
    .tab-btn {
        padding: 0.5rem 1rem;
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-weight: 500;
        border-bottom: 2px solid transparent;
        transition: all 0.15s;
    }
    .tab-btn.active {
        color: #a5b4fc;
        border-bottom-color: #6366f1;
    }
    .tab-btn:hover { color: #cbd5e1; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .action-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding: 1rem 0;
        border-top: 1px solid rgba(99, 102, 241, 0.2);
        margin-top: 1rem;
    }
    .result-modal-score {
        font-size: 3rem;
        font-weight: bold;
        color: #fbbf24;
        text-align: center;
        margin: 1rem 0;
    }
    .score-breakdown {
        background: rgba(15, 23, 42, 0.6);
        border-radius: 0.5rem;
        padding: 1rem;
        margin: 1rem 0;
    }
    .score-breakdown-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4rem 0;
        border-bottom: 1px solid rgba(99, 102, 241, 0.1);
    }
    .score-breakdown-row:last-child { border-bottom: none; font-weight: bold; }
</style>
@endsection

@section('content')
<h1 style="font-size: 1.75rem; margin-bottom: 0.5rem;">
    🎯 {{ $gameState['level']->name }}
    <span class="badge badge-{{ $gameState['level']->difficulty }}" style="font-size: 0.75rem; margin-left: 0.5rem;">
        {{ $gameState['level']->difficulty_label }}
    </span>
</h1>
<p class="text-muted" style="margin-bottom: 1rem;">{{ $gameState['level']->description }}</p>

<div class="hud-bar">
    <div class="hud-item">
        <span class="hud-label">⏱️ 用时:</span>
        <span class="hud-value" id="elapsedTime">0</span>
        <span class="hud-label">秒</span>
    </div>
    <div class="hud-item">
        <span class="hud-label">🎯 基础分:</span>
        <span class="hud-value success">{{ $gameState['level']->base_score }}</span>
    </div>
    <div class="hud-item">
        <span class="hud-label">💡 提示:</span>
        <span class="hud-value @if($gameState['hints_used'] > 0) danger @endif">
            {{ $gameState['hints_used'] }}/{{ $gameState['hints_total'] }}
        </span>
    </div>
    <div class="hud-item">
        <span class="hud-label">📉 已扣分:</span>
        <span class="hud-value danger">-{{ $gameState['current_penalty'] }}</span>
    </div>
    @if($gameState['level']->time_bonus_threshold)
    <div class="hud-item">
        <span class="hud-label">⚡ 时间奖励阈值:</span>
        <span class="hud-value">{{ $gameState['level']->time_bonus_threshold }}s</span>
    </div>
    @endif
</div>

<div id="gameContent" @if($isCompleted) style="opacity: 0.6; pointer-events: none;" @endif>
    @if($gameState['level']->cipher_type === 'rotor' && $gameState['level']->rotor_count > 0)
    <div class="card" style="margin-bottom: 1.5rem;">
        <h2 class="card-title">⚙️ 转轮设置</h2>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
            @foreach($gameState['rotor_positions'] as $idx => $pos)
                <div class="rotor-wheel">
                    <button class="rotor-btn" onclick="adjustRotor({{ $idx }}, 1)">▲</button>
                    <div class="rotor-value" id="rotor-{{ $idx }}">{{ str_pad($pos, 2, '0', STR_PAD_LEFT) }}</div>
                    <button class="rotor-btn" onclick="adjustRotor({{ $idx }}, -1)">▼</button>
                    <div class="text-sm text-muted mt-1">转轮 {{ $idx + 1 }}</div>
                </div>
            @endforeach
        </div>
        <div class="text-center text-sm text-muted mt-3">
            当前解密结果（基于转轮位置）:
            <div class="cipher-display mt-2 font-mono" id="rotorPreview">{{ $gameState['partial_solution'] }}</div>
        </div>
    </div>
    @endif

    <div class="card" style="margin-bottom: 1.5rem;">
        <h2 class="card-title">📝 密文与解密预览</h2>
        <div style="margin-bottom: 1rem;">
            <div class="text-sm text-muted mb-2">密文 (CIPHERTEXT):</div>
            <div class="cipher-display font-mono" id="cipherTextDisplay">
                @foreach(str_split($gameState['ciphertext']) as $char)
                    @if(ctype_alpha($char))
                        <span class="cipher-char unknown cipher-char-{{ strtoupper($char) }}">{{ strtoupper($char) }}</span>
                    @elseif($char === ' ')
                        <span class="cipher-char space">&nbsp;</span>
                    @else
                        <span class="cipher-char unknown">{{ $char }}</span>
                    @endif
                @endforeach
            </div>
        </div>
        <div>
            <div class="text-sm text-muted mb-2">解密结果 (PLAINTEXT):</div>
            <div class="cipher-display font-mono" id="plainTextDisplay">
                @foreach(str_split($gameState['ciphertext']) as $char)
                    @if(ctype_alpha($char))
                        @php
                            $upper = strtoupper($char);
                            $mapped = $gameState['substitution_table'][$upper] ?? null;
                        @endphp
                        <span class="cipher-char {{ $mapped ? 'decrypted' : 'unknown' }} plain-char-{{ $upper }}">
                            {{ $mapped ?? '?' }}
                        </span>
                    @elseif($char === ' ')
                        <span class="cipher-char space">&nbsp;</span>
                    @else
                        <span class="cipher-char decrypted">{{ $char }}</span>
                    @endif
                @endforeach
            </div>
        </div>
    </div>

    <div class="grid @if($gameState['level']->cipher_type === 'rotor') grid-1 @else grid-2 @endif" style="margin-bottom: 1.5rem;">
        <div class="card">
            <h2 class="card-title">🔤 替换表 (Substitution Table)</h2>
            <p class="text-sm text-muted mb-3">点击字母输入对应的明文字母，留空表示未映射。</p>
            <div class="sub-grid" id="substitutionGrid">
                @foreach(str_split(\App\Services\CipherService::ALPHABET) as $letter)
                    @php
                        $mapped = $gameState['substitution_table'][$letter] ?? null;
                    @endphp
                    <div class="sub-cell {{ $mapped ? 'mapped' : '' }}" data-letter="{{ $letter }}">
                        <div class="sub-from">{{ $letter }}</div>
                        <input
                            type="text"
                            class="sub-input"
                            maxlength="1"
                            value="{{ $mapped ?? '' }}"
                            oninput="updateSubstitution('{{ $letter }}', this.value)"
                            placeholder="?"
                        >
                    </div>
                @endforeach
            </div>
            <div class="mt-3 flex justify-between items-center">
                <div class="text-sm text-muted">
                    已映射: <span class="text-success font-bold" id="mappedCount">{{ count($gameState['substitution_table']) }}</span>/26
                </div>
                <button class="btn btn-secondary" onclick="clearSubstitution()" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;">
                    清空全部
                </button>
            </div>
        </div>
        @endif

        <div class="card">
            <h2 class="card-title">📊 分析面板</h2>
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('freq')">频率分析</button>
                <button class="tab-btn" onclick="switchTab('ngram')">N-grams</button>
                @if($gameState['level']->cipher_type !== 'caesar')
                <button class="tab-btn" onclick="switchTab('pattern')">模式匹配</button>
                @endif
            </div>
            <div id="tab-freq" class="tab-content active">
                <div class="text-sm text-muted mb-2">
                    重合指数 (IC): <span class="text-info font-bold">{{ $gameState['index_of_coincidence'] }}</span>
                    <span class="text-xs">（英文约为 0.065，随机文本约为 0.038）</span>
                </div>
                @php $maxFreq = max(array_column($gameState['frequency_analysis'], 'count')); @endphp
                @foreach($gameState['frequency_analysis'] as $letter => $data)
                    <div class="freq-row">
                        <span class="freq-letter">{{ $letter }}</span>
                        <div class="freq-bar-container">
                            <div class="freq-bar" style="width: {{ $maxFreq > 0 ? ($data['count'] / $maxFreq * 100) : 0 }}%;"></div>
                        </div>
                        <span class="freq-count">{{ $data['count'] }} ({{ $data['percentage'] }}%)</span>
                    </div>
                @endforeach
                <div class="text-xs text-muted mt-3">
                    💡 英文高频字母参考: E(12.7%), T(9.1%), A(8.2%), O(7.5%), I(7.0%), N(6.7%), S(6.3%), H(6.1%), R(6.0%)
                </div>
            </div>
            <div id="tab-ngram" class="tab-content">
                <div style="margin-bottom: 1rem;">
                    <div class="font-bold mb-2 text-sm">双字母组 (Bigrams) TOP 15:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                        @foreach($gameState['bigrams'] as $gram => $count)
                            <span class="badge badge-medium">{{ $gram }} × {{ $count }}</span>
                        @endforeach
                    </div>
                    <div class="text-xs text-muted mt-1">💡 常见: TH, HE, AN, IN, ER, ON, RE, ED, ND, AT</div>
                </div>
                <div>
                    <div class="font-bold mb-2 text-sm">三字母组 (Trigrams) TOP 15:</div>
                    <div style="display: flex; flex-wrap: gap: 0.3rem;">
                        @foreach($gameState['trigrams'] as $gram => $count)
                            <span class="badge badge-success">{{ $gram }} × {{ $count }}</span>
                        @endforeach
                    </div>
                    <div class="text-xs text-muted mt-1">💡 常见: THE, AND, ING, HER, ERE, ENT, THA, NTH, WAS, ETH</div>
                </div>
            </div>
            @if($gameState['level']->cipher_type !== 'caesar')
            <div id="tab-pattern" class="tab-content">
                <div class="text-sm text-muted mb-2">重复模式（Kasiski 检验辅助分析密钥长度）:</div>
                @if(count($gameState['patterns']) > 0)
                    @foreach($gameState['patterns'] as $pattern => $data)
                        <div class="pattern-item">
                            <div class="flex justify-between">
                                <span class="font-bold text-info">{{ $pattern }}</span>
                                <span class="text-warning">× {{ $data['count'] }}</span>
                            </div>
                            <div class="text-xs text-muted mt-1">
                                间距: {{ implode(', ', $data['distances']) }} ·
                                最大公约数: <span class="text-success font-bold">{{ $data['gcd'] }}</span>
                            </div>
                        </div>
                    @endforeach
                @else
                    <div class="text-muted">未发现明显重复模式</div>
                @endif
            </div>
            @endif
        </div>
    </div>

    <div class="grid grid-2">
        <div class="card">
            <h2 class="card-title">📝 推理笔记</h2>
            <form onsubmit="addNote(event)" class="mb-3">
                <div class="form-group">
                    <label>笔记类别</label>
                    <select class="form-control" id="noteCategory">
                        <option value="general">综合笔记</option>
                        <option value="frequency">频率分析</option>
                        <option value="pattern">模式发现</option>
                        <option value="rotor">转轮推理</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>笔记内容</label>
                    <textarea class="form-control" id="noteContent" rows="3" placeholder="记录你的推理过程、假设、观察..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary">添加笔记</button>
            </form>
            <div id="notesList">
                @foreach($gameState['notes'] as $note)
                    <div class="note-item">
                        <div class="note-category">[{{ $note->category_label }}] {{ $note->created_at->format('H:i') }}</div>
                        <div>{{ $note->content }}</div>
                    </div>
                @endforeach
                @if($gameState['notes']->count() === 0)
                    <div class="text-muted text-sm">还没有笔记，开始记录你的推理吧！</div>
                @endif
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">💡 提示 & 操作</h2>
            <div class="mb-3">
                <div class="text-sm text-muted mb-2">
                    使用提示会扣除 <span class="text-danger font-bold">{{ $gameState['level']->hint_penalty }}</span> 分，当前已使用 {{ $gameState['hints_used'] }} 次
                </div>
                <button type="button" class="btn btn-warning w-full" onclick="useHint()" @if($gameState['hints_used'] >= $gameState['hints_total']) disabled @endif>
                    💡 获取下一条提示 ({{ $gameState['hints_total'] - $gameState['hints_used'] }} 条可用)
                </button>
            </div>
            <div id="hintList">
            </div>
        </div>
    </div>

    <div class="action-row">
        <button type="button" class="btn btn-secondary" onclick="undoAction()">↩️ 撤销上一步</button>
        <a href="{{ route('game.history', $session) }}" class="btn btn-secondary">📜 查看操作历史</a>
        <div style="flex: 1;"></div>
        <form method="POST" action="{{ route('game.abandon', $session) }}" onsubmit="return confirm('确定要放弃本局吗？放弃后将记录为失败。')">
            @csrf
            <button type="submit" class="btn btn-danger">放弃本局</button>
        </form>
        <button type="button" class="btn btn-success" onclick="submitSolution()">
            ✅ 提交解答
        </button>
    </div>
</div>

@if($isCompleted)
<div class="card" style="border-color: #10b981; margin-top: 1.5rem;">
    <h2 class="card-title" style="color: #10b981;">
        {{ $session->status === 'completed' ? '🎉 恭喜通关！' : ($session->status === 'failed' ? '❌ 解答错误' : '📝 已放弃') }}
    </h2>
    @php
        $scoreSvc = app(\App\Services\ScoreService::class);
        $scoreBreakdown = $scoreSvc->calculateFinalScore($session);
    @endphp
    <div class="result-modal-score">{{ $scoreBreakdown['final_score'] }} 分</div>
    <div class="score-breakdown">
        @foreach($scoreBreakdown['breakdown'] as $label => $value)
            <div class="score-breakdown-row">
                <span>{{ $label }}</span>
                <span class="@if(is_numeric($value) && $value < 0) text-danger @else text-success @endif">
                    {{ is_numeric($value) ? ($value > 0 ? '+' : '') . $value : $value }}
                </span>
            </div>
        @endforeach
    </div>
    @if($session->status === 'failed')
        <div class="alert alert-warning" style="margin-top: 1rem;">
            <div class="font-bold mb-1">正确答案:</div>
            <div class="font-mono">{{ $gameState['level']->plaintext }}</div>
        </div>
    @endif
    <div class="flex gap-3 justify-center mt-3">
        <a href="{{ route('dashboard') }}" class="btn btn-primary">返回控制台</a>
        <form method="POST" action="{{ route('game.start', $session->level) }}">
            @csrf
            <button type="submit" class="btn btn-secondary">再来一局</button>
        </form>
    </div>
</div>
@endif

<div class="modal-overlay" id="resultModal">
    <div class="modal">
        <h2 class="modal-title" id="resultTitle">结算</h2>
        <div id="resultContent"></div>
        <div class="flex justify-end gap-2 mt-4">
            <button class="btn btn-secondary" onclick="hideModal('resultModal')">关闭</button>
            <a href="{{ route('dashboard') }}" class="btn btn-primary">返回控制台</a>
        </div>
    </div>
</div>
@endsection

@section('scripts')
<script>
    const gameSessionId = {{ $session->id }};
    const cipherType = '{{ $gameState['level']->cipher_type }}';
    const initialPartialSolution = {!! json_encode($gameState['partial_solution'] ?? '') !!};
    let startTime = {{ $gameState['elapsed_seconds'] }};
    const isCompleted = {{ $isCompleted ? 'true' : 'false' }};

    document.addEventListener('DOMContentLoaded', function() {
        if (cipherType === 'rotor' && initialPartialSolution) {
            renderDecryptedText(initialPartialSolution);
        }
    });

    if (!isCompleted) {
        setInterval(() => {
            startTime++;
            const el = document.getElementById('elapsedTime');
            if (el) el.textContent = startTime;
        }, 1000);
    }

    function switchTab(name) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-' + name).classList.add('active');
        event.target.classList.add('active');
    }

    async function adjustRotor(index, delta) {
        const current = parseInt(document.getElementById('rotor-' + index).textContent);
        let newPos = ((current + delta) % 26 + 26) % 26;

        const result = await apiCall(`/game/${gameSessionId}/rotor`, 'POST', {
            rotor_index: index,
            position: newPos
        });

        if (result.success) {
            result.rotor_positions.forEach((pos, i) => {
                const el = document.getElementById('rotor-' + i);
                if (el) el.textContent = String(pos).padStart(2, '0');
            });
            if (result.partial_solution) {
                renderDecryptedText(result.partial_solution);
            }
        }
    }

    function renderDecryptedText(decrypted) {
        const rotorPreview = document.getElementById('rotorPreview');
        if (rotorPreview && cipherType === 'rotor') {
            rotorPreview.textContent = decrypted;
        }

        const plainTextDisplay = document.getElementById('plainTextDisplay');
        if (!plainTextDisplay) return;

        if (cipherType === 'rotor') {
            let html = '';
            for (let i = 0; i < decrypted.length; i++) {
                const ch = decrypted[i];
                if (ch === ' ') {
                    html += '<span class="cipher-char space">&nbsp;</span>';
                } else if (/[A-Za-z]/.test(ch)) {
                    html += `<span class="cipher-char decrypted">${ch.toUpperCase()}</span>`;
                } else {
                    html += `<span class="cipher-char decrypted">${ch}</span>`;
                }
            }
            plainTextDisplay.innerHTML = html;
        }
    }

    async function updateSubstitution(cipherChar, plainChar) {
        const result = await apiCall(`/game/${gameSessionId}/substitution`, 'POST', {
            cipher_char: cipherChar,
            plain_char: plainChar || null
        });

        if (result.success) {
            Object.entries(result.substitution_table).forEach(([c, p]) => {
                const plainEls = document.querySelectorAll('.plain-char-' + c);
                plainEls.forEach(el => {
                    el.textContent = p;
                    el.classList.add('decrypted');
                    el.classList.remove('unknown');
                });

                const cell = document.querySelector(`.sub-cell[data-letter="${c}"]`);
                if (cell) {
                    cell.classList.add('mapped');
                }
            });

            const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            allLetters.forEach(c => {
                if (!result.substitution_table[c]) {
                    const plainEls = document.querySelectorAll('.plain-char-' + c);
                    plainEls.forEach(el => {
                        el.textContent = '?';
                        el.classList.remove('decrypted');
                        el.classList.add('unknown');
                    });
                    const cell = document.querySelector(`.sub-cell[data-letter="${c}"]`);
                    if (cell) {
                        cell.classList.remove('mapped');
                    }
                }
            });

            document.getElementById('mappedCount').textContent = Object.keys(result.substitution_table).length;
        }
    }

    function clearSubstitution() {
        if (!confirm('确定清空所有替换映射吗？')) return;
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        letters.forEach(async (c) => {
            await apiCall(`/game/${gameSessionId}/substitution`, 'POST', {
                cipher_char: c,
                plain_char: null
            });
        });
        setTimeout(() => location.reload(), 500);
    }

    async function addNote(e) {
        e.preventDefault();
        const content = document.getElementById('noteContent').value.trim();
        const category = document.getElementById('noteCategory').value;
        if (!content) return;

        const result = await apiCall(`/game/${gameSessionId}/note`, 'POST', {
            content, category
        });

        if (result.success) {
            document.getElementById('noteContent').value = '';
            location.reload();
        }
    }

    async function useHint() {
        const result = await apiCall(`/game/${gameSessionId}/hint`, 'POST', {});
        if (result.success) {
            const hintList = document.getElementById('hintList');
            const hintDiv = document.createElement('div');
            hintDiv.className = 'note-item';
            hintDiv.style.borderLeftColor = '#f59e0b';
            hintDiv.innerHTML = `
                <div class="note-category" style="color: #f59e0b;">💡 提示 #${result.hint_index + 1} (扣 ${result.penalty} 分)</div>
                <div>${result.hint_content}</div>
            `;
            hintList.appendChild(hintDiv);
            location.reload();
        } else {
            alert(result.message || '获取提示失败');
        }
    }

    async function undoAction() {
        const result = await apiCall(`/game/${gameSessionId}/undo`, 'POST', {});
        if (result.success) {
            location.reload();
        } else {
            alert(result.message || '撤销失败');
        }
    }

    async function submitSolution() {
        if (!confirm('确定提交你的解答吗？提交后游戏结束。')) return;

        const result = await apiCall(`/game/${gameSessionId}/submit`, 'POST', {});
        if (result.success) {
            const titleEl = document.getElementById('resultTitle');
            const contentEl = document.getElementById('resultContent');

            if (result.passed) {
                titleEl.textContent = '🎉 恭喜通关！';
                titleEl.style.color = '#10b981';
            } else {
                titleEl.textContent = '❌ 解答错误';
                titleEl.style.color = '#ef4444';
            }

            let html = `<div class="result-modal-score">${result.final_score} 分</div>`;
            html += '<div class="score-breakdown">';
            Object.entries(result.score_breakdown.breakdown).forEach(([label, value]) => {
                const valStr = typeof value === 'number'
                    ? (value > 0 ? '+' : '') + value
                    : value;
                const colorClass = typeof value === 'number' && value < 0 ? 'text-danger' : 'text-success';
                html += `<div class="score-breakdown-row"><span>${label}</span><span class="${colorClass}">${valStr}</span></div>`;
            });
            html += '</div>';

            if (!result.passed && result.correct_plaintext) {
                html += `<div class="alert alert-warning"><div class="font-bold mb-1">正确答案:</div><div class="font-mono">${result.correct_plaintext}</div></div>`;
            }

            html += `<div class="text-center mt-3">准确率: <span class="font-bold text-info">${result.accuracy}%</span></div>`;

            contentEl.innerHTML = html;
            showModal('resultModal');

            setTimeout(() => location.reload(), 100);
        }
    }
</script>
@endsection
