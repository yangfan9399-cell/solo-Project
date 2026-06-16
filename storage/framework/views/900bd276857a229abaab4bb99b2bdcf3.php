<?php $__env->startSection('title', $gameState['level']->name); ?>

<?php $__env->startSection('styles'); ?>
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
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<h1 style="font-size: 1.75rem; margin-bottom: 0.5rem;">
    🎯 <?php echo e($gameState['level']->name); ?>

    <span class="badge badge-<?php echo e($gameState['level']->difficulty); ?>" style="font-size: 0.75rem; margin-left: 0.5rem;">
        <?php echo e($gameState['level']->difficulty_label); ?>

    </span>
</h1>
<p class="text-muted" style="margin-bottom: 1rem;"><?php echo e($gameState['level']->description); ?></p>

<div class="hud-bar">
    <div class="hud-item">
        <span class="hud-label">⏱️ 用时:</span>
        <span class="hud-value" id="elapsedTime">0</span>
        <span class="hud-label">秒</span>
    </div>
    <div class="hud-item">
        <span class="hud-label">🎯 基础分:</span>
        <span class="hud-value success"><?php echo e($gameState['level']->base_score); ?></span>
    </div>
    <div class="hud-item">
        <span class="hud-label">💡 提示:</span>
        <span class="hud-value <?php if($gameState['hints_used'] > 0): ?> danger <?php endif; ?>">
            <?php echo e($gameState['hints_used']); ?>/<?php echo e($gameState['hints_total']); ?>

        </span>
    </div>
    <div class="hud-item">
        <span class="hud-label">📉 已扣分:</span>
        <span class="hud-value danger">-<?php echo e($gameState['current_penalty']); ?></span>
    </div>
    <?php if($gameState['level']->time_bonus_threshold): ?>
    <div class="hud-item">
        <span class="hud-label">⚡ 时间奖励阈值:</span>
        <span class="hud-value"><?php echo e($gameState['level']->time_bonus_threshold); ?>s</span>
    </div>
    <?php endif; ?>
</div>

<div id="gameContent" <?php if($isCompleted): ?> style="opacity: 0.6; pointer-events: none;" <?php endif; ?>>
    <div class="card" style="margin-bottom: 1.5rem;">
        <h2 class="card-title">📝 密文与解密预览</h2>
        <div style="margin-bottom: 1rem;">
            <div class="text-sm text-muted mb-2">密文 (CIPHERTEXT):</div>
            <div class="cipher-display font-mono" id="cipherTextDisplay">
                <?php $__currentLoopData = str_split($gameState['ciphertext']); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $char): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php if(ctype_alpha($char)): ?>
                        <span class="cipher-char unknown cipher-char-<?php echo e(strtoupper($char)); ?>"><?php echo e(strtoupper($char)); ?></span>
                    <?php elseif($char === ' '): ?>
                        <span class="cipher-char space">&nbsp;</span>
                    <?php else: ?>
                        <span class="cipher-char unknown"><?php echo e($char); ?></span>
                    <?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        </div>
        <div>
            <div class="text-sm text-muted mb-2">解密结果 (PLAINTEXT):</div>
            <div class="cipher-display font-mono" id="plainTextDisplay">
                <?php $__currentLoopData = str_split($gameState['ciphertext']); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $char): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php if(ctype_alpha($char)): ?>
                        <?php
                            $upper = strtoupper($char);
                            $mapped = $gameState['substitution_table'][$upper] ?? null;
                        ?>
                        <span class="cipher-char <?php echo e($mapped ? 'decrypted' : 'unknown'); ?> plain-char-<?php echo e($upper); ?>">
                            <?php echo e($mapped ?? '?'); ?>

                        </span>
                    <?php elseif($char === ' '): ?>
                        <span class="cipher-char space">&nbsp;</span>
                    <?php else: ?>
                        <span class="cipher-char decrypted"><?php echo e($char); ?></span>
                    <?php endif; ?>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        </div>
    </div>

    <div class="grid grid-2" style="margin-bottom: 1.5rem;">

        <?php if($gameState['level']->cipher_type === 'caesar'): ?>
        <div class="card">
            <h2 class="card-title">🔄 凯撒偏移设置</h2>
            <p class="text-sm text-muted mb-3">调整偏移量 (0-25)，实时查看解密结果。</p>
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <input type="range" id="caesarShift" min="0" max="25" value="0" 
                           class="form-control" oninput="updateCaesarShift(this.value)">
                </div>
                <div class="text-3xl font-bold text-warning" id="caesarShiftValue" style="min-width: 60px; text-align: center;">00</div>
            </div>
            <div class="text-sm text-muted mb-2">💡 提示：尝试所有 25 个偏移，找到有意义的明文。</div>
            <div class="flex gap-2 mt-3">
                <button class="btn btn-secondary" style="flex: 1;" onclick="updateCaesarShift((parseInt(document.getElementById('caesarShift').value) + 1) % 26)">+1</button>
                <button class="btn btn-secondary" style="flex: 1;" onclick="updateCaesarShift((parseInt(document.getElementById('caesarShift').value) + 25) % 26)">-1</button>
                <button class="btn btn-secondary" style="flex: 1;" onclick="updateCaesarShift(0)">重置</button>
            </div>
        </div>
        <?php endif; ?>

        <?php if($gameState['level']->cipher_type === 'substitution'): ?>
        <div class="card">
            <h2 class="card-title">🔤 替换表 (Substitution Table)</h2>
            <p class="text-sm text-muted mb-3">点击字母输入对应的明文字母，留空表示未映射。</p>
            <div class="sub-grid" id="substitutionGrid">
                <?php $__currentLoopData = str_split(\App\Services\CipherService::ALPHABET); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $letter): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <?php
                        $mapped = $gameState['substitution_table'][$letter] ?? null;
                    ?>
                    <div class="sub-cell <?php echo e($mapped ? 'mapped' : ''); ?>" data-letter="<?php echo e($letter); ?>">
                        <div class="sub-from"><?php echo e($letter); ?></div>
                        <input
                            type="text"
                            class="sub-input"
                            maxlength="1"
                            value="<?php echo e($mapped ?? ''); ?>"
                            oninput="updateSubstitution('<?php echo e($letter); ?>', this.value)"
                            placeholder="?"
                        >
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
            <div class="mt-3 flex justify-between items-center">
                <div class="text-sm text-muted">
                    已映射: <span class="text-success font-bold" id="mappedCount"><?php echo e(count($gameState['substitution_table'])); ?></span>/26
                </div>
                <button class="btn btn-secondary" onclick="clearSubstitution()" style="padding: 0.35rem 0.8rem; font-size: 0.8rem;">
                    清空全部
                </button>
            </div>
        </div>
        <?php endif; ?>

        <?php if($gameState['level']->cipher_type === 'vigenere'): ?>
        <div class="card">
            <h2 class="card-title">🔑 维吉尼亚关键词</h2>
            <p class="text-sm text-muted mb-3">输入关键词来解密，关键词决定了每个字母的偏移量。</p>
            <div class="form-group">
                <label>关键词 (字母)</label>
                <input type="text" id="vigenereKey" class="form-control font-mono" 
                       value="" placeholder="例如：SECRET" 
                       style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 1.1rem;"
                       oninput="updateVigenereKey(this.value)">
            </div>
            <div class="text-sm text-muted mt-2">
                💡 提示：通过频率分析和 Kasiski 检验推测关键词长度，再逐一猜出每个字母。
            </div>
            <div class="text-xs text-muted mt-2">
                当前关键词长度: <span id="vigenereKeyLen" class="text-info font-bold">0</span>
            </div>
        </div>
        <?php endif; ?>

        <?php if($gameState['level']->cipher_type === 'rotor'): ?>
        <div class="card">
            <h2 class="card-title">⚙️ 转轮设置</h2>
            <p class="text-sm text-muted mb-3">调整每个转轮的位置，实时查看解密结果。</p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; margin-bottom: 1rem;">
                <?php $__currentLoopData = $gameState['rotor_positions']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $idx => $pos): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="rotor-wheel">
                        <button class="rotor-btn" onclick="adjustRotor(<?php echo e($idx); ?>, 1)">▲</button>
                        <div class="rotor-value" id="rotor-<?php echo e($idx); ?>"><?php echo e(str_pad($pos, 2, '0', STR_PAD_LEFT)); ?></div>
                        <button class="rotor-btn" onclick="adjustRotor(<?php echo e($idx); ?>, -1)">▼</button>
                        <div class="text-sm text-muted mt-1">转轮 <?php echo e($idx + 1); ?></div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
            <div class="text-center text-sm text-muted">
                💡 尝试不同组合，观察解密结果中是否出现有意义的单词片段。
            </div>
        </div>
        <?php endif; ?>

        <div class="card">
            <h2 class="card-title">📊 分析面板</h2>
            <div class="tabs">
                <button class="tab-btn active" onclick="switchTab('freq')">频率分析</button>
                <button class="tab-btn" onclick="switchTab('ngram')">N-grams</button>
                <?php if($gameState['level']->cipher_type !== 'caesar'): ?>
                <button class="tab-btn" onclick="switchTab('pattern')">模式匹配</button>
                <?php endif; ?>
            </div>
            <div id="tab-freq" class="tab-content active">
                <div class="text-sm text-muted mb-2">
                    重合指数 (IC): <span class="text-info font-bold"><?php echo e($gameState['index_of_coincidence']); ?></span>
                    <span class="text-xs">（英文约为 0.065，随机文本约为 0.038）</span>
                </div>
                <?php $maxFreq = max(array_column($gameState['frequency_analysis'], 'count')); ?>
                <?php $__currentLoopData = $gameState['frequency_analysis']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $letter => $data): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="freq-row">
                        <span class="freq-letter"><?php echo e($letter); ?></span>
                        <div class="freq-bar-container">
                            <div class="freq-bar" style="width: <?php echo e($maxFreq > 0 ? ($data['count'] / $maxFreq * 100) : 0); ?>%;"></div>
                        </div>
                        <span class="freq-count"><?php echo e($data['count']); ?> (<?php echo e($data['percentage']); ?>%)</span>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <div class="text-xs text-muted mt-3">
                    💡 英文高频字母参考: E(12.7%), T(9.1%), A(8.2%), O(7.5%), I(7.0%), N(6.7%), S(6.3%), H(6.1%), R(6.0%)
                </div>
            </div>
            <div id="tab-ngram" class="tab-content">
                <div style="margin-bottom: 1rem;">
                    <div class="font-bold mb-2 text-sm">双字母组 (Bigrams) TOP 15:</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">
                        <?php $__currentLoopData = $gameState['bigrams']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $gram => $count): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <span class="badge badge-medium"><?php echo e($gram); ?> × <?php echo e($count); ?></span>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </div>
                    <div class="text-xs text-muted mt-1">💡 常见: TH, HE, AN, IN, ER, ON, RE, ED, ND, AT</div>
                </div>
                <div>
                    <div class="font-bold mb-2 text-sm">三字母组 (Trigrams) TOP 15:</div>
                    <div style="display: flex; flex-wrap: gap: 0.3rem;">
                        <?php $__currentLoopData = $gameState['trigrams']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $gram => $count): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <span class="badge badge-success"><?php echo e($gram); ?> × <?php echo e($count); ?></span>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </div>
                    <div class="text-xs text-muted mt-1">💡 常见: THE, AND, ING, HER, ERE, ENT, THA, NTH, WAS, ETH</div>
                </div>
            </div>
            <?php if($gameState['level']->cipher_type !== 'caesar'): ?>
            <div id="tab-pattern" class="tab-content">
                <div class="text-sm text-muted mb-2">重复模式（Kasiski 检验辅助分析密钥长度）:</div>
                <?php if(count($gameState['patterns']) > 0): ?>
                    <?php $__currentLoopData = $gameState['patterns']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $pattern => $data): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="pattern-item">
                            <div class="flex justify-between">
                                <span class="font-bold text-info"><?php echo e($pattern); ?></span>
                                <span class="text-warning">× <?php echo e($data['count']); ?></span>
                            </div>
                            <div class="text-xs text-muted mt-1">
                                间距: <?php echo e(implode(', ', $data['distances'])); ?> ·
                                最大公约数: <span class="text-success font-bold"><?php echo e($data['gcd']); ?></span>
                            </div>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <?php else: ?>
                    <div class="text-muted">未发现明显重复模式</div>
                <?php endif; ?>
            </div>
            <?php endif; ?>
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
                <?php $__currentLoopData = $gameState['notes']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $note): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div class="note-item">
                        <div class="note-category">[<?php echo e($note->category_label); ?>] <?php echo e($note->created_at->format('H:i')); ?></div>
                        <div><?php echo e($note->content); ?></div>
                    </div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                <?php if($gameState['notes']->count() === 0): ?>
                    <div class="text-muted text-sm">还没有笔记，开始记录你的推理吧！</div>
                <?php endif; ?>
            </div>
        </div>

        <div class="card">
            <h2 class="card-title">💡 提示 & 操作</h2>
            <div class="mb-3">
                <div class="text-sm text-muted mb-2">
                    使用提示会扣除 <span class="text-danger font-bold"><?php echo e($gameState['level']->hint_penalty); ?></span> 分，当前已使用 <?php echo e($gameState['hints_used']); ?> 次
                </div>
                <button type="button" class="btn btn-warning w-full" onclick="useHint()" <?php if($gameState['hints_used'] >= $gameState['hints_total']): ?> disabled <?php endif; ?>>
                    💡 获取下一条提示 (<?php echo e($gameState['hints_total'] - $gameState['hints_used']); ?> 条可用)
                </button>
            </div>
            <div id="hintList">
            </div>
        </div>
    </div>

    <div class="action-row">
        <button type="button" class="btn btn-secondary" onclick="undoAction()">↩️ 撤销上一步</button>
        <a href="<?php echo e(route('game.history', $session)); ?>" class="btn btn-secondary">📜 查看操作历史</a>
        <div style="flex: 1;"></div>
        <form method="POST" action="<?php echo e(route('game.abandon', $session)); ?>" onsubmit="return confirm('确定要放弃本局吗？放弃后将记录为失败。')">
            <?php echo csrf_field(); ?>
            <button type="submit" class="btn btn-danger">放弃本局</button>
        </form>
        <button type="button" class="btn btn-success" onclick="submitSolution()">
            ✅ 提交解答
        </button>
    </div>
</div>

<?php if($isCompleted): ?>
<div class="card" style="border-color: #10b981; margin-top: 1.5rem;">
    <h2 class="card-title" style="color: #10b981;">
        <?php echo e($session->status === 'completed' ? '🎉 恭喜通关！' : ($session->status === 'failed' ? '❌ 解答错误' : '📝 已放弃')); ?>

    </h2>
    <?php
        $scoreSvc = app(\App\Services\ScoreService::class);
        $scoreBreakdown = $scoreSvc->calculateFinalScore($session);
    ?>
    <div class="result-modal-score"><?php echo e($scoreBreakdown['final_score']); ?> 分</div>
    <div class="score-breakdown">
        <?php $__currentLoopData = $scoreBreakdown['breakdown']; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $label => $value): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
            <div class="score-breakdown-row">
                <span><?php echo e($label); ?></span>
                <span class="<?php if(is_numeric($value) && $value < 0): ?> text-danger <?php else: ?> text-success <?php endif; ?>">
                    <?php echo e(is_numeric($value) ? ($value > 0 ? '+' : '') . $value : $value); ?>

                </span>
            </div>
        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
    </div>
    <?php if($session->status === 'failed'): ?>
        <div class="alert alert-warning" style="margin-top: 1rem;">
            <div class="font-bold mb-1">正确答案:</div>
            <div class="font-mono"><?php echo e($gameState['level']->plaintext); ?></div>
        </div>
    <?php endif; ?>
    <div class="flex gap-3 justify-center mt-3">
        <a href="<?php echo e(route('dashboard')); ?>" class="btn btn-primary">返回控制台</a>
        <form method="POST" action="<?php echo e(route('game.start', $session->level)); ?>">
            <?php echo csrf_field(); ?>
            <button type="submit" class="btn btn-secondary">再来一局</button>
        </form>
    </div>
</div>
<?php endif; ?>

<div class="modal-overlay" id="resultModal">
    <div class="modal">
        <h2 class="modal-title" id="resultTitle">结算</h2>
        <div id="resultContent"></div>
        <div class="flex justify-end gap-2 mt-4">
            <button class="btn btn-secondary" onclick="hideModal('resultModal')">关闭</button>
            <a href="<?php echo e(route('dashboard')); ?>" class="btn btn-primary">返回控制台</a>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
<script>
    const gameSessionId = <?php echo e($session->id); ?>;
    const cipherType = '<?php echo e($gameState['level']->cipher_type); ?>';
    const initialPartialSolution = <?php echo json_encode($gameState['partial_solution'] ?? ''); ?>;
    let startTime = <?php echo e($gameState['elapsed_seconds']); ?>;
    const isCompleted = <?php echo e($isCompleted ? 'true' : 'false'); ?>;

    document.addEventListener('DOMContentLoaded', function() {
        if (initialPartialSolution) {
            renderDecryptedText(initialPartialSolution);
        }
        if (cipherType === 'caesar') {
            const shiftEl = document.getElementById('caesarShift');
            const valEl = document.getElementById('caesarShiftValue');
            if (shiftEl && valEl) {
                valEl.textContent = String(shiftEl.value).padStart(2, '0');
            }
        }
        if (cipherType === 'vigenere') {
            updateVigenereKeyLen();
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

        if (cipherType === 'substitution') {
            return;
        }

        let html = '';
        for (let i = 0; i < decrypted.length; i++) {
            const ch = decrypted[i];
            if (ch === ' ') {
                html += '<span class="cipher-char space">&nbsp;</span>';
            } else if (/[A-Za-z]/.test(ch)) {
                const isDecrypted = ch && cipherType !== 'substitution';
                html += `<span class="cipher-char ${isDecrypted ? 'decrypted' : 'unknown'}">${ch.toUpperCase()}</span>`;
            } else {
                html += `<span class="cipher-char decrypted">${ch}</span>`;
            }
        }
        plainTextDisplay.innerHTML = html;
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

    let caesarDebounce = null;
    async function updateCaesarShift(shift) {
        shift = parseInt(shift);
        if (isNaN(shift) || shift < 0 || shift > 25) return;

        const shiftEl = document.getElementById('caesarShift');
        const valEl = document.getElementById('caesarShiftValue');
        if (shiftEl) shiftEl.value = shift;
        if (valEl) valEl.textContent = String(shift).padStart(2, '0');

        if (caesarDebounce) clearTimeout(caesarDebounce);
        caesarDebounce = setTimeout(async () => {
            const result = await apiCall(`/game/${gameSessionId}/caesar`, 'POST', { shift });
            if (result.success && result.partial_solution) {
                renderDecryptedText(result.partial_solution);
            }
        }, 150);
    }

    let vigenereDebounce = null;
    function updateVigenereKeyLen() {
        const keyEl = document.getElementById('vigenereKey');
        const lenEl = document.getElementById('vigenereKeyLen');
        if (keyEl && lenEl) {
            lenEl.textContent = keyEl.value.replace(/[^A-Za-z]/g, '').length;
        }
    }
    async function updateVigenereKey(key) {
        updateVigenereKeyLen();
        key = key.replace(/[^A-Za-z]/g, '').toUpperCase();

        if (vigenereDebounce) clearTimeout(vigenereDebounce);
        vigenereDebounce = setTimeout(async () => {
            const result = await apiCall(`/game/${gameSessionId}/vigenere`, 'POST', { key });
            if (result.success && result.partial_solution) {
                renderDecryptedText(result.partial_solution);
            }
        }, 300);
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
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/yangfan/Desktop/trae-solo-generated-projects/q-333/resources/views/game/show.blade.php ENDPATH**/ ?>