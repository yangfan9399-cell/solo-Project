<?php $__env->startSection('title', '创建自定义谜题'); ?>

<?php $__env->startSection('styles'); ?>
<style>
    .config-panel {
        background: rgba(15, 23, 42, 0.6);
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(99, 102, 241, 0.2);
        margin-top: 0.5rem;
    }
    .preview-box {
        background: rgba(0, 0, 0, 0.4);
        padding: 1rem;
        border-radius: 0.5rem;
        font-family: 'SF Mono', monospace;
        word-break: break-all;
        line-height: 1.8;
        border: 1px solid rgba(99, 102, 241, 0.3);
        max-height: 300px;
        overflow-y: auto;
    }
    .freq-mini {
        display: inline-block;
        padding: 0.2rem 0.4rem;
        margin: 0.15rem;
        background: rgba(99, 102, 241, 0.2);
        border-radius: 0.25rem;
        font-size: 0.8rem;
        font-family: monospace;
    }
</style>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<div class="flex justify-between items-center mb-4">
    <h1 style="font-size: 1.75rem;">🎨 创建自定义谜题</h1>
    <a href="<?php echo e(route('custom-levels.index')); ?>" class="btn btn-secondary">返回列表</a>
</div>

<div class="grid grid-2">
    <div class="card">
        <h2 class="card-title">📋 谜题配置</h2>
        <form method="POST" action="<?php echo e(route('custom-levels.store')); ?>" id="levelForm">
            <?php echo csrf_field(); ?>

            <div class="form-group">
                <label>谜题名称 *</label>
                <input type="text" name="name" class="form-control" value="<?php echo e(old('name')); ?>" placeholder="例如：我的第一个替换密码" required maxlength="255">
            </div>

            <div class="form-group">
                <label>谜题描述 *</label>
                <textarea name="description" class="form-control" rows="2" placeholder="介绍这个谜题的背景或提示..." required maxlength="1000"><?php echo e(old('description')); ?></textarea>
            </div>

            <div class="grid grid-2">
                <div class="form-group">
                    <label>难度等级 *</label>
                    <select name="difficulty" class="form-control" required>
                        <?php $__currentLoopData = $difficulties; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $value => $label): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                            <option value="<?php echo e($value); ?>" <?php echo e(old('difficulty') === $value ? 'selected' : ''); ?>><?php echo e($label); ?></option>
                        <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                    </select>
                </div>
                <div class="form-group">
                    <label>基础分数 *</label>
                    <input type="number" name="base_score" class="form-control" value="<?php echo e(old('base_score', 200)); ?>" min="10" max="10000" required>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="form-group">
                    <label>每次提示扣分 *</label>
                    <input type="number" name="hint_penalty" class="form-control" value="<?php echo e(old('hint_penalty', 25)); ?>" min="5" max="500" required>
                </div>
                <div class="form-group">
                    <label>时间奖励阈值（秒，可选）</label>
                    <input type="number" name="time_bonus_threshold" class="form-control" value="<?php echo e(old('time_bonus_threshold')); ?>" min="30" placeholder="例如：180">
                </div>
            </div>

            <div class="form-group">
                <label>密码类型 *</label>
                <select name="cipher_type" id="cipherType" class="form-control" required>
                    <?php $__currentLoopData = $cipherTypes; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $value => $label): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <option value="<?php echo e($value); ?>" <?php echo e(old('cipher_type') === $value ? 'selected' : ''); ?>><?php echo e($label); ?></option>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </select>
            </div>

            <div class="form-group">
                <label>明文 (Plaintext) *</label>
                <textarea name="plaintext" id="plaintext" class="form-control" rows="4" placeholder="输入要加密的明文，只保留英文字母和空格..." required maxlength="5000"><?php echo e(old('plaintext', 'HELLO WORLD THIS IS A CUSTOM CIPHER CHALLENGE')); ?></textarea>
                <div class="text-xs text-muted mt-1">非英文字母会被自动过滤，只保留 A-Z 和空格</div>
            </div>

            <div id="caesarConfig" class="config-panel" style="display:none;">
                <div class="form-group">
                    <label>凯撒偏移量 (1-25，留空随机)</label>
                    <input type="number" name="caesar_shift" class="form-control" value="<?php echo e(old('caesar_shift')); ?>" min="1" max="25" placeholder="例如：7">
                </div>
            </div>

            <div id="substitutionConfig" class="config-panel" style="display:none;">
                <div class="form-group">
                    <label>替换密钥 (26个字母的排列，留空自动生成)</label>
                    <input type="text" name="substitution_key" class="form-control font-mono" value="<?php echo e(old('substitution_key')); ?>" placeholder="例如：QWERTYUIOPASDFGHJKLZXCVBNM" maxlength="26">
                    <div class="text-xs text-muted mt-1">密钥用于生成替换表，系统会自动去重并补全26个字母</div>
                </div>
            </div>

            <div id="vigenereConfig" class="config-panel" style="display:none;">
                <div class="form-group">
                    <label>维吉尼亚关键词 (3-20个英文字母) *</label>
                    <input type="text" name="vigenere_key" class="form-control font-mono" value="<?php echo e(old('vigenere_key', 'SECRET')); ?>" minlength="3" maxlength="20" pattern="[A-Za-z]+" placeholder="例如：SECRET">
                </div>
            </div>

            <div id="rotorConfig" class="config-panel" style="display:none;">
                <div class="grid grid-2">
                    <div class="form-group">
                        <label>转轮数量 (1-5)</label>
                        <input type="number" name="rotor_count" class="form-control" value="<?php echo e(old('rotor_count', 1)); ?>" min="1" max="5" id="rotorCount">
                    </div>
                    <div class="form-group">
                        <label>随机种子 (整数，留空随机)</label>
                        <input type="number" name="rotor_seed" class="form-control" value="<?php echo e(old('rotor_seed')); ?>" placeholder="例如：42">
                    </div>
                </div>
                <div class="form-group">
                    <label>目标转轮位置 (用逗号分隔，留空随机)</label>
                    <input type="text" name="rotor_target_positions" class="form-control font-mono" value="<?php echo e(old('rotor_target_positions')); ?>" placeholder="例如：5,13,21">
                    <div class="text-xs text-muted mt-1">解密需要将转轮调整到这些位置，每个数字 0-25，数量等于转轮数</div>
                </div>
            </div>

            <div class="form-group mt-3">
                <label>解谜提示（每行一条，可选）</label>
                <textarea name="hints" class="form-control" rows="4" placeholder="提示1：这是关于凯撒密码的提示...
提示2：高频字母 E 对应...
提示3：..."><?php echo e(old('hints')); ?></textarea>
                <div class="text-xs text-muted mt-1">每使用一条提示会扣除对应的分数</div>
            </div>

            <div class="flex gap-3 mt-4">
                <button type="button" class="btn btn-secondary" onclick="previewEncryption()">🔍 预览加密结果</button>
                <button type="submit" class="btn btn-primary">💾 创建谜题</button>
            </div>
        </form>
    </div>

    <div class="card">
        <h2 class="card-title">👁️ 实时预览</h2>

        <div style="margin-bottom: 1.5rem;">
            <div class="text-sm text-muted mb-2">明文 (处理后):</div>
            <div class="preview-box" id="plaintextPreview">-</div>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <div class="text-sm text-muted mb-2">密文 (加密后):</div>
            <div class="preview-box" id="ciphertextPreview" style="color: #fbbf24;">-</div>
        </div>

        <div>
            <div class="text-sm text-muted mb-2">密文字母频率 TOP 10:</div>
            <div id="freqPreview">
                <span class="text-muted">输入明文后点击预览</span>
            </div>
        </div>

        <div class="alert alert-warning mt-4" id="previewNote" style="display:none;">
            ⚠️ 此为实时预览，实际保存时可能因随机参数不同而有差异。点击创建谜题时会使用当前配置生成最终版本。
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
<script>
    function toggleCipherConfig() {
        const type = document.getElementById('cipherType').value;
        document.getElementById('caesarConfig').style.display = type === 'caesar' ? 'block' : 'none';
        document.getElementById('substitutionConfig').style.display = type === 'substitution' ? 'block' : 'none';
        document.getElementById('vigenereConfig').style.display = type === 'vigenere' ? 'block' : 'none';
        document.getElementById('rotorConfig').style.display = type === 'rotor' ? 'block' : 'none';
    }

    document.getElementById('cipherType').addEventListener('change', toggleCipherConfig);
    toggleCipherConfig();

    async function previewEncryption() {
        const form = document.getElementById('levelForm');
        const formData = new FormData(form);

        const data = {
            cipher_type: formData.get('cipher_type'),
            plaintext: formData.get('plaintext'),
        };

        if (formData.get('caesar_shift')) data.caesar_shift = parseInt(formData.get('caesar_shift'));
        if (formData.get('substitution_key')) data.substitution_key = formData.get('substitution_key');
        if (formData.get('vigenere_key')) data.vigenere_key = formData.get('vigenere_key');
        if (formData.get('rotor_count')) data.rotor_count = parseInt(formData.get('rotor_count'));
        if (formData.get('rotor_seed')) data.rotor_seed = parseInt(formData.get('rotor_seed'));
        if (formData.get('rotor_target_positions')) data.rotor_target_positions = formData.get('rotor_target_positions');

        const result = await apiCall('/custom-levels/encrypt', 'POST', data);

        if (result.success) {
            document.getElementById('plaintextPreview').textContent = result.plaintext;
            document.getElementById('ciphertextPreview').textContent = result.ciphertext;

            const freq = result.frequency_analysis;
            const topTen = Object.entries(freq).slice(0, 10);
            const freqHtml = topTen.map(([letter, d]) =>
                `<span class="freq-mini">${letter}: ${d.count} (${d.percentage}%)</span>`
            ).join('');
            document.getElementById('freqPreview').innerHTML = freqHtml;
            document.getElementById('previewNote').style.display = 'block';
        } else {
            alert('预览失败：' + (result.message || '请检查输入'));
        }
    }

    document.getElementById('plaintext').addEventListener('blur', function() {
        if (this.value && !document.getElementById('ciphertextPreview').textContent || document.getElementById('ciphertextPreview').textContent === '-') {
            previewEncryption();
        }
    });
</script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/yangfan/Desktop/trae-solo-generated-projects/q-333/resources/views/custom-levels/create.blade.php ENDPATH**/ ?>