@extends('layouts.app')

@section('title', $level->name . ' - 胶水配比实验')

@section('content')
<div class="mb-4">
    <a href="{{ route('levels.index') }}" class="text-amber-700 hover:text-amber-900 text-sm">
        ← 返回关卡列表
    </a>
</div>

<div class="grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1 space-y-4">
        <div class="card p-5">
            <div class="flex items-center gap-2 mb-3">
                <span class="text-2xl">📖</span>
                <div>
                    <h2 class="font-bold text-amber-900">第 {{ $level->order }} 关</h2>
                    <p class="text-sm text-amber-700">{{ $level->name }}</p>
                </div>
            </div>
            <p class="text-sm text-amber-600 mb-3">{{ $level->description }}</p>
            <div class="bg-amber-50 rounded-lg p-3">
                <p class="text-sm font-semibold text-amber-800 mb-1">📄 {{ $level->paper_type }}</p>
                <p class="text-xs text-amber-600">{{ $level->paper_description }}</p>
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-bold text-amber-900 mb-3">🎯 目标值</h3>
            <div class="space-y-3">
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-amber-700">黏度</span>
                        <span class="font-semibold text-amber-900">{{ $level->target_viscosity }} ±{{ $level->viscosity_tolerance }}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill bg-blue-400" style="width: {{ min(100, $level->target_viscosity) }}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-amber-700">干燥时间</span>
                        <span class="font-semibold text-amber-900">{{ $level->target_drying_time }}s ±{{ $level->drying_time_tolerance }}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill bg-green-400" style="width: {{ min(100, $level->target_drying_time) }}%"></div>
                    </div>
                </div>
                <div>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-amber-700">透明度</span>
                        <span class="font-semibold text-amber-900">{{ $level->target_transparency }}% ±{{ $level->transparency_tolerance }}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill bg-purple-400" style="width: {{ min(100, $level->target_transparency) }}%"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-bold text-amber-900 mb-2">📊 尝试次数</h3>
            <div class="flex items-center gap-2">
                <span class="text-3xl font-bold text-amber-800" id="attemptCount">{{ $attemptCount }}</span>
                <span class="text-amber-600">/ {{ $level->max_attempts }}</span>
            </div>
            <p class="text-xs text-amber-500 mt-2">用完所有尝试次数仍未通过则挑战失败</p>
        </div>
    </div>

    <div class="lg:col-span-2 space-y-4">
        <div class="card p-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-amber-900">🧪 调配实验台</h3>
                <div class="flex gap-2">
                    <button onclick="undoAction()" class="btn-secondary !py-1 !px-3 text-sm" id="undoBtn" disabled>
                        ↩️ 撤销
                    </button>
                    <button onclick="resetRecipe()" class="btn-secondary !py-1 !px-3 text-sm">
                        🔄 重置
                    </button>
                </div>
            </div>

            <div class="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                <div class="relative">
                    <div class="glue-beaker" id="beaker">
                        <div class="glue-liquid" id="glueLiquid" style="height: 0%; background: rgba(245, 245, 220, 0.7);">
                            <div class="bubble" style="width: 8px; height: 8px; left: 20%; bottom: 10%; animation-delay: 0s;"></div>
                            <div class="bubble" style="width: 6px; height: 6px; left: 50%; bottom: 20%; animation-delay: 0.5s;"></div>
                            <div class="bubble" style="width: 10px; height: 10px; left: 70%; bottom: 15%; animation-delay: 1s;"></div>
                        </div>
                    </div>
                    <p class="text-center text-sm text-amber-600 mt-2">
                        总量: <span id="totalAmount" class="font-semibold">0</span> g
                    </p>
                </div>

                <div class="flex-1 space-y-4 w-full max-w-sm">
                    <div class="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-blue-700 font-semibold">💧 黏度</span>
                            <span class="text-blue-900 font-bold text-xl" id="currentViscosity">0</span>
                        </div>
                        <div class="progress-bar bg-blue-200">
                            <div class="progress-fill bg-blue-500" id="viscosityBar" style="width: 0%"></div>
                        </div>
                        <div class="text-xs text-blue-600 mt-1">
                            目标: {{ $level->target_viscosity }} (误差 ±{{ $level->viscosity_tolerance }})
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-green-700 font-semibold">⏱️ 干燥时间</span>
                            <span class="text-green-900 font-bold text-xl" id="currentDryingTime">0s</span>
                        </div>
                        <div class="progress-bar bg-green-200">
                            <div class="progress-fill bg-green-500" id="dryingTimeBar" style="width: 0%"></div>
                        </div>
                        <div class="text-xs text-green-600 mt-1">
                            目标: {{ $level->target_drying_time }}s (误差 ±{{ $level->drying_time_tolerance }})
                        </div>
                    </div>

                    <div class="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-purple-700 font-semibold">✨ 透明度</span>
                            <span class="text-purple-900 font-bold text-xl" id="currentTransparency">0%</span>
                        </div>
                        <div class="progress-bar bg-purple-200">
                            <div class="progress-fill bg-purple-500" id="transparencyBar" style="width: 0%"></div>
                        </div>
                        <div class="text-xs text-purple-600 mt-1">
                            目标: {{ $level->target_transparency }}% (误差 ±{{ $level->transparency_tolerance }})
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-center mt-4">
                <button onclick="submitRecipe()" class="btn-primary text-lg px-8 py-3" id="submitBtn">
                    🔬 提交检验
                </button>
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-bold text-amber-900 mb-3">🥣 基础胶料</h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3" id="baseMaterials">
                @foreach($baseMaterials as $material)
                <div class="material-card p-3 rounded-lg border-2 border-amber-200 bg-white" onclick="selectMaterial({{ $material->id }}, '{{ $material->name }}', '{{ $material->type }}', '{{ $material->color }}')">
                    <div class="flex items-center gap-2 mb-2">
                        <div class="w-8 h-8 rounded-full border-2 border-amber-300" style="background: {{ $material->color }};"></div>
                        <span class="font-semibold text-amber-900 text-sm">{{ $material->name }}</span>
                    </div>
                    <p class="text-xs text-amber-600 line-clamp-2">{{ $material->description }}</p>
                </div>
                @endforeach
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-bold text-amber-900 mb-3">✨ 添加剂</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3" id="additiveMaterials">
                @foreach($additiveMaterials as $material)
                <div class="material-card p-3 rounded-lg border-2 border-amber-200 bg-white" onclick="selectMaterial({{ $material->id }}, '{{ $material->name }}', '{{ $material->type }}', '{{ $material->color }}')">
                    <div class="flex items-center gap-2 mb-1">
                        <div class="w-6 h-6 rounded-full border-2 border-amber-300" style="background: {{ $material->color }};"></div>
                        <span class="font-semibold text-amber-900 text-xs">{{ $material->name }}</span>
                    </div>
                </div>
                @endforeach
            </div>
        </div>

        <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-amber-900">📋 当前配方</h3>
                <button onclick="saveRecipe()" class="text-sm text-amber-700 hover:text-amber-900">
                    💾 保存配方
                </button>
            </div>
            <div id="currentRecipe" class="space-y-2">
                <p class="text-amber-500 text-sm">还没有添加任何材料，点击上方材料开始调配吧！</p>
            </div>
        </div>

        <div class="card p-5">
            <h3 class="font-bold text-amber-900 mb-3">📜 操作历史</h3>
            <div id="historyList" class="space-y-1 max-h-40 overflow-y-auto">
                <p class="text-amber-500 text-sm">暂无操作记录</p>
            </div>
        </div>
    </div>
</div>

<div class="modal-overlay" id="materialModal">
    <div class="modal-content p-6">
        <h3 class="text-xl font-bold text-amber-900 mb-4" id="modalTitle">添加材料</h3>
        <input type="hidden" id="selectedMaterialId">
        <input type="hidden" id="selectedMaterialType">
        <input type="hidden" id="selectedMaterialColor">

        <div class="mb-6">
            <label class="block text-amber-800 mb-2 text-sm font-semibold">用量 (g)</label>
            <div class="flex items-center gap-4">
                <input type="range" id="amountSlider" min="1" max="100" value="10" step="1"
                    class="flex-1" oninput="updateAmountDisplay()">
                <input type="number" id="amountInput" value="10" min="1" max="100"
                    class="amount-input" oninput="syncAmountSlider()">
                <span class="text-amber-700">g</span>
            </div>
        </div>

        <div class="flex gap-3">
            <button onclick="closeMaterialModal()" class="btn-secondary flex-1">取消</button>
            <button onclick="confirmAddMaterial()" class="btn-primary flex-1">添加</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="saveRecipeModal">
    <div class="modal-content p-6">
        <h3 class="text-xl font-bold text-amber-900 mb-4">💾 保存配方</h3>
        <div class="mb-4">
            <label class="block text-amber-800 mb-2 text-sm font-semibold">配方名称</label>
            <input type="text" id="recipeName" placeholder="给你的配方起个名字"
                class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
        </div>
        <div class="mb-6">
            <label class="block text-amber-800 mb-2 text-sm font-semibold">备注 (可选)</label>
            <textarea id="recipeDescription" rows="2" placeholder="记录一下这个配方的特点..."
                class="w-full px-4 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
        </div>
        <div class="flex gap-3">
            <button onclick="closeSaveRecipeModal()" class="btn-secondary flex-1">取消</button>
            <button onclick="confirmSaveRecipe()" class="btn-primary flex-1">保存</button>
        </div>
    </div>
</div>

<div class="modal-overlay" id="resultModal">
    <div class="modal-content p-6">
        <div id="resultContent"></div>
    </div>
</div>

@endsection

@section('scripts')
<script>
    const levelId = {{ $level->id }};
    const sessionId = {{ $sessionId ?? 'null' }};
    const targetViscosity = {{ $level->target_viscosity }};
    const targetDryingTime = {{ $level->target_drying_time }};
    const targetTransparency = {{ $level->target_transparency }};
    const maxAttempts = {{ $level->max_attempts }};

    let currentState = @json($currentState);
    let historyCount = {{ count($historySteps) }};

    const materialInfo = {};
    @foreach($allMaterials as $m)
    materialInfo[{{ $m->id }}] = {
        id: {{ $m->id }},
        name: '{{ $m->name }}',
        type: '{{ $m->type }}',
        color: '{{ $m->color }}',
        description: '{{ $m->description }}'
    };
    @endforeach

    function init() {
        updateDisplay();
        updateHistoryDisplay();
    }

    function selectMaterial(id, name, type, color) {
        document.getElementById('selectedMaterialId').value = id;
        document.getElementById('selectedMaterialType').value = type;
        document.getElementById('selectedMaterialColor').value = color;
        document.getElementById('modalTitle').textContent = '添加 ' + name;

        const existing = currentState.materials.find(m => m.material_id == id);
        if (existing) {
            document.getElementById('amountSlider').value = Math.min(100, Math.max(1, existing.amount + 5));
            document.getElementById('amountInput').value = Math.min(100, Math.max(1, existing.amount + 5));
        } else {
            document.getElementById('amountSlider').value = 10;
            document.getElementById('amountInput').value = 10;
        }

        document.getElementById('materialModal').classList.add('active');
    }

    function closeMaterialModal() {
        document.getElementById('materialModal').classList.remove('active');
    }

    function updateAmountDisplay() {
        document.getElementById('amountInput').value = document.getElementById('amountSlider').value;
    }

    function syncAmountSlider() {
        let val = parseInt(document.getElementById('amountInput').value) || 1;
        val = Math.max(1, Math.min(100, val));
        document.getElementById('amountSlider').value = val;
        document.getElementById('amountInput').value = val;
    }

    async function ensureSession() {
        if (sessionId) return sessionId;

        try {
            const res = await fetch(`/game/${levelId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success) {
                return data.session_id;
            }
        } catch (e) {
            console.error(e);
        }
        return null;
    }

    async function confirmAddMaterial() {
        const materialId = document.getElementById('selectedMaterialId').value;
        const amount = parseFloat(document.getElementById('amountInput').value);

        if (!sessionId) {
            const sid = await ensureSession();
            if (!sid) {
                alert('无法创建游戏会话');
                return;
            }
            sessionId = sid;
        }

        try {
            const res = await fetch(`/game/session/${sessionId}/add-material`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({
                    material_id: materialId,
                    amount: amount,
                    current_state: currentState
                })
            });
            const data = await res.json();
            if (data.success) {
                currentState = data.new_state;
                historyCount = data.history_count;
                updateDisplay();
                updateHistoryDisplay();
                closeMaterialModal();
                animateBeaker();
            }
        } catch (e) {
            console.error(e);
            alert('操作失败');
        }
    }

    function updateDisplay() {
        const props = currentState.properties || { viscosity: 0, drying_time: 0, transparency: 0, total_amount: 0 };

        document.getElementById('currentViscosity').textContent = props.viscosity.toFixed(1);
        document.getElementById('currentDryingTime').textContent = props.drying_time.toFixed(1) + 's';
        document.getElementById('currentTransparency').textContent = props.transparency.toFixed(1) + '%';
        document.getElementById('totalAmount').textContent = props.total_amount.toFixed(1);

        const viscPercent = Math.min(100, Math.max(0, (props.viscosity / 100) * 100));
        const dryPercent = Math.min(100, Math.max(0, (props.drying_time / 100) * 100));
        const transPercent = Math.min(100, Math.max(0, props.transparency));

        document.getElementById('viscosityBar').style.width = viscPercent + '%';
        document.getElementById('dryingTimeBar').style.width = dryPercent + '%';
        document.getElementById('transparencyBar').style.width = transPercent + '%';

        updateBeaker(props);
        updateRecipeDisplay();

        document.getElementById('undoBtn').disabled = historyCount === 0;
    }

    function updateBeaker(props) {
        const liquid = document.getElementById('glueLiquid');
        const fillPercent = Math.min(85, Math.max(0, (props.total_amount / 200) * 85));
        liquid.style.height = fillPercent + '%';

        if (currentState.materials.length > 0) {
            const colors = currentState.materials.map(m => {
                const info = materialInfo[m.material_id];
                return info ? info.color : '#f5f5dc';
            });
            if (colors.length === 1) {
                liquid.style.background = colors[0] + 'cc';
            } else {
                liquid.style.background = `linear-gradient(180deg, ${colors.join(', ')})`;
            }
        } else {
            liquid.style.background = 'rgba(245, 245, 220, 0.7)';
        }
    }

    function updateRecipeDisplay() {
        const container = document.getElementById('currentRecipe');

        if (currentState.materials.length === 0) {
            container.innerHTML = '<p class="text-amber-500 text-sm">还没有添加任何材料，点击上方材料开始调配吧！</p>';
            return;
        }

        let html = '';
        currentState.materials.forEach(item => {
            const info = materialInfo[item.material_id];
            if (!info) return;

            html += `
                <div class="flex items-center justify-between p-2 bg-amber-50 rounded">
                    <div class="flex items-center gap-2">
                        <div class="w-5 h-5 rounded-full border border-amber-300" style="background: ${info.color};"></div>
                        <span class="text-sm text-amber-800">${info.name}</span>
                        <span class="text-xs text-amber-500">${info.type === 'base' ? '基料' : '添加剂'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-semibold text-amber-900">${item.amount.toFixed(1)} g</span>
                        <button onclick="removeMaterial(${item.material_id})" class="text-red-400 hover:text-red-600 text-sm">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function updateHistoryDisplay() {
        const container = document.getElementById('historyList');

        fetch(`/game/session/${sessionId}/history`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.history.length > 0) {
                    let html = '';
                    data.history.slice().reverse().forEach((step, idx) => {
                        const actionText = getActionText(step);
                        const stepNum = data.history.length - idx;
                        html += `
                            <div class="history-step flex items-center gap-2 p-2 rounded text-xs">
                                <span class="text-amber-400 w-6">#${stepNum}</span>
                                <span class="text-amber-700">${actionText}</span>
                            </div>
                        `;
                    });
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<p class="text-amber-500 text-sm">暂无操作记录</p>';
                }
            });
    }

    function getActionText(step) {
        const info = step.material_id ? materialInfo[step.material_id] : null;
        const matName = info ? info.name : '';

        switch (step.action_type) {
            case 'add_material':
                return `添加 ${matName} ${step.amount}g`;
            case 'remove_material':
                return `移除 ${matName} ${Math.abs(step.amount)}g`;
            case 'adjust_amount':
                return `调整 ${matName} 用量`;
            case 'reset':
                return '重置配方';
            default:
                return step.action_type;
        }
    }

    async function removeMaterial(materialId) {
        if (!sessionId) return;

        const item = currentState.materials.find(m => m.material_id == materialId);
        if (!item) return;

        try {
            const res = await fetch(`/game/session/${sessionId}/remove-material`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({
                    material_id: materialId,
                    amount: item.amount,
                    current_state: currentState
                })
            });
            const data = await res.json();
            if (data.success) {
                currentState = data.new_state;
                historyCount = data.history_count;
                updateDisplay();
                updateHistoryDisplay();
                animateBeaker();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function undoAction() {
        if (!sessionId || historyCount === 0) return;

        try {
            const res = await fetch(`/game/session/${sessionId}/undo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({ current_state: currentState })
            });
            const data = await res.json();
            if (data.success) {
                currentState = data.new_state;
                historyCount = data.history_count;
                updateDisplay();
                updateHistoryDisplay();
            }
        } catch (e) {
            console.error(e);
        }
    }

    async function resetRecipe() {
        if (!sessionId) return;

        if (!confirm('确定要重置配方吗？所有材料都会被清除。')) return;

        try {
            const res = await fetch(`/game/session/${sessionId}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({ current_state: currentState })
            });
            const data = await res.json();
            if (data.success) {
                currentState = data.new_state;
                historyCount = data.history_count;
                updateDisplay();
                updateHistoryDisplay();
            }
        } catch (e) {
            console.error(e);
        }
    }

    function animateBeaker() {
        const beaker = document.getElementById('beaker');
        beaker.classList.add('shake');
        setTimeout(() => beaker.classList.remove('shake'), 500);
    }

    async function submitRecipe() {
        if (!sessionId) {
            alert('请先添加材料开始游戏');
            return;
        }

        if (currentState.materials.length === 0) {
            alert('请先添加一些材料！');
            return;
        }

        const btn = document.getElementById('submitBtn');
        btn.disabled = true;
        btn.textContent = '检验中...';

        try {
            const res = await fetch(`/game/session/${sessionId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({ current_state: currentState })
            });
            const data = await res.json();

            if (data.success) {
                document.getElementById('attemptCount').textContent = data.session.attempt_count;
                showResultModal(data);
            }
        } catch (e) {
            console.error(e);
            alert('提交失败');
        }

        btn.disabled = false;
        btn.textContent = '🔬 提交检验';
    }

    function showResultModal(data) {
        const score = data.score;
        const props = data.properties;

        let resultHtml = '';

        if (score.is_passed) {
            resultHtml = `
                <div class="text-center">
                    <div class="text-6xl mb-4">🎉</div>
                    <h3 class="text-2xl font-bold text-green-600 mb-2">修补成功！</h3>
                    <div class="flex justify-center gap-1 mb-4">
                        ${[1,2,3].map(i => `<span class="text-3xl ${i <= score.stars ? 'star' : 'star-empty'}">★</span>`).join('')}
                    </div>
                    <p class="text-3xl font-bold text-amber-900 mb-6">${score.total_score.toFixed(1)} 分</p>
                </div>
            `;
        } else {
            const attemptsLeft = maxAttempts - (data.session.attempt_count || 0);
            if (attemptsLeft > 0) {
                resultHtml = `
                    <div class="text-center">
                        <div class="text-6xl mb-4">🤔</div>
                        <h3 class="text-2xl font-bold text-amber-700 mb-2">还需要调整...</h3>
                        <p class="text-amber-600 mb-4">胶水还不符合要求，再调整一下配方吧！</p>
                        <p class="text-lg font-bold text-amber-900">${score.total_score.toFixed(1)} 分</p>
                        <p class="text-sm text-amber-500 mt-2">还剩 ${attemptsLeft} 次机会</p>
                    </div>
                `;
            } else {
                resultHtml = `
                    <div class="text-center">
                        <div class="text-6xl mb-4">😢</div>
                        <h3 class="text-2xl font-bold text-red-600 mb-2">挑战失败</h3>
                        <p class="text-amber-600 mb-4">尝试次数用完了，下次再加油！</p>
                        <p class="text-lg font-bold text-amber-900">${score.total_score.toFixed(1)} 分</p>
                    </div>
                `;
            }
        }

        resultHtml += `
            <div class="mt-6 space-y-3">
                <div class="flex items-center justify-between p-3 rounded ${score.viscosity_pass ? 'bg-green-50' : 'bg-red-50'}">
                    <span class="text-sm">💧 黏度</span>
                    <div class="text-right">
                        <div class="font-bold ${score.viscosity_pass ? 'text-green-600' : 'text-red-600'}">${props.viscosity.toFixed(1)}</div>
                        <div class="text-xs text-gray-500">目标: ${targetViscosity} (差 ${score.viscosity_diff.toFixed(1)})</div>
                    </div>
                </div>
                <div class="flex items-center justify-between p-3 rounded ${score.drying_pass ? 'bg-green-50' : 'bg-red-50'}">
                    <span class="text-sm">⏱️ 干燥时间</span>
                    <div class="text-right">
                        <div class="font-bold ${score.drying_pass ? 'text-green-600' : 'text-red-600'}">${props.drying_time.toFixed(1)}s</div>
                        <div class="text-xs text-gray-500">目标: ${targetDryingTime}s (差 ${score.drying_diff.toFixed(1)})</div>
                    </div>
                </div>
                <div class="flex items-center justify-between p-3 rounded ${score.transparency_pass ? 'bg-green-50' : 'bg-red-50'}">
                    <span class="text-sm">✨ 透明度</span>
                    <div class="text-right">
                        <div class="font-bold ${score.transparency_pass ? 'text-green-600' : 'text-red-600'}">${props.transparency.toFixed(1)}%</div>
                        <div class="text-xs text-gray-500">目标: ${targetTransparency}% (差 ${score.transparency_diff.toFixed(1)})</div>
                    </div>
                </div>
            </div>
        `;

        if (data.is_new_unlock && data.unlocked_materials && data.unlocked_materials.length > 0) {
            resultHtml += `
                <div class="mt-4 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                    <p class="font-bold text-yellow-800 mb-2">🎁 解锁新材料！</p>
                    <ul class="text-sm text-yellow-700 space-y-1">
                        ${data.unlocked_materials.map(m => `<li>• ${m.name}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        if (score.is_passed || (data.session && data.session.status !== 'playing')) {
            resultHtml += `
                <div class="mt-6 flex gap-3">
                    <button onclick="closeResultModal(); goToLevels();" class="btn-secondary flex-1">返回关卡</button>
                    <button onclick="closeResultModal(); goToResult();" class="btn-primary flex-1">查看详情</button>
                </div>
            `;
        } else {
            resultHtml += `
                <div class="mt-6">
                    <button onclick="closeResultModal();" class="btn-primary w-full">继续调整</button>
                </div>
            `;
        }

        document.getElementById('resultContent').innerHTML = resultHtml;
        document.getElementById('resultModal').classList.add('active');
    }

    function closeResultModal() {
        document.getElementById('resultModal').classList.remove('active');
    }

    function goToLevels() {
        window.location.href = '{{ route('levels.index') }}';
    }

    function goToResult() {
        window.location.href = `/game/session/${sessionId}/result`;
    }

    function saveRecipe() {
        if (currentState.materials.length === 0) {
            alert('请先调配一个配方再保存');
            return;
        }
        document.getElementById('saveRecipeModal').classList.add('active');
    }

    function closeSaveRecipeModal() {
        document.getElementById('saveRecipeModal').classList.remove('active');
    }

    async function confirmSaveRecipe() {
        const name = document.getElementById('recipeName').value.trim();
        if (!name) {
            alert('请输入配方名称');
            return;
        }

        const description = document.getElementById('recipeDescription').value.trim();

        try {
            const res = await fetch('/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': '{{ csrf_token() }}'
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    level_id: levelId,
                    recipe_data: currentState,
                    properties: currentState.properties,
                    score: null
                })
            });
            const data = await res.json();
            if (data.success) {
                alert('配方保存成功！');
                closeSaveRecipeModal();
                document.getElementById('recipeName').value = '';
                document.getElementById('recipeDescription').value = '';
            }
        } catch (e) {
            console.error(e);
            alert('保存失败');
        }
    }

    init();
</script>
@endsection
