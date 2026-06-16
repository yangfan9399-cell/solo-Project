(function() {
    const roundId = document.getElementById('round-id').value;
    const timeLimit = parseInt(document.getElementById('level-time-limit').value);
    const inkBudget = parseInt(document.getElementById('level-ink-budget').value);
    const csrfToken = document.getElementById('csrf-token').value;

    let arrangedChars = [];
    let selectedChar = null;
    let selectedStickIdx = null;
    let inkUsed = 0;
    let proofreadCount = 0;
    let elapsedSeconds = 0;
    let timerInterval = null;
    let invertedPositions = new Set();

    const composingStick = document.getElementById('composing-stick');
    const placeholder = document.getElementById('composing-placeholder');
    const inkDisplay = document.getElementById('ink-display');
    const inkBar = document.getElementById('ink-bar');
    const timerEl = document.getElementById('timer');
    const historyList = document.getElementById('history-list');
    const proofreadPanel = document.getElementById('proofread-panel');
    const proofreadResult = document.getElementById('proofread-result');
    const selectedCharDisplay = document.getElementById('selected-char-display');

    function getCSRFHeaders() {
        return {'X-CSRFToken': csrfToken, 'Content-Type': 'application/json'};
    }

    async function apiPost(url, data) {
        const resp = await fetch(url, {
            method: 'POST',
            headers: getCSRFHeaders(),
            body: JSON.stringify(data),
        });
        return resp.json();
    }

    async function apiGet(url) {
        const resp = await fetch(url);
        return resp.json();
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            elapsedSeconds++;
            const remaining = Math.max(0, timeLimit - elapsedSeconds);
            timerEl.textContent = remaining + '秒';
            if (remaining <= 10) {
                timerEl.style.color = '#e74c3c';
            } else if (remaining <= 30) {
                timerEl.style.color = '#f39c12';
            }
            if (remaining <= 0) {
                clearInterval(timerInterval);
                autoSubmit();
            }
        }, 1000);
    }

    function updateComposingStick() {
        composingStick.innerHTML = '';
        if (arrangedChars.length === 0) {
            const ph = document.createElement('div');
            ph.className = 'composing-placeholder';
            ph.textContent = '从字匣取字放入排版架';
            composingStick.appendChild(ph);
            return;
        }
        arrangedChars.forEach((ch, idx) => {
            const span = document.createElement('span');
            span.className = 'stick-char';
            if (invertedPositions.has(idx)) {
                span.classList.add('inverted');
            }
            if (selectedStickIdx === idx) {
                span.classList.add('selected');
            }
            span.textContent = ch;
            span.dataset.idx = idx;
            span.addEventListener('click', () => onStickCharClick(idx));
            composingStick.appendChild(span);
        });
    }

    function updateInkDisplay() {
        inkDisplay.textContent = '墨量：' + inkUsed + '/' + inkBudget;
        const pct = Math.min(100, (inkUsed / inkBudget) * 100);
        inkBar.style.width = pct + '%';
        if (inkUsed > inkBudget) {
            inkBar.style.background = 'linear-gradient(90deg, #c0392b, #e74c3c)';
        } else {
            inkBar.style.background = 'linear-gradient(90deg, var(--accent-dark), var(--accent))';
        }
    }

    function addHistoryItem(text) {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.textContent = new Date().toLocaleTimeString() + ' - ' + text;
        historyList.prepend(div);
    }

    document.querySelectorAll('.type-char').forEach(el => {
        el.addEventListener('click', () => {
            document.querySelectorAll('.type-char').forEach(e => e.classList.remove('selected'));
            const ch = el.dataset.char;
            selectedChar = ch;
            selectedStickIdx = null;
            el.classList.add('selected');
            selectedCharDisplay.textContent = '已选：' + ch;
        });
    });

    function onStickCharClick(idx) {
        if (selectedChar) {
            const oldChar = arrangedChars[idx];
            arrangedChars[idx] = selectedChar;
            updateComposingStick();
            apiPost('/api/round/' + roundId + '/operation/', {
                op_type: 'swap_char',
                position: idx,
                char_value: selectedChar,
                old_char: oldChar,
            });
            addHistoryItem('换字：位置' + (idx + 1) + ' "' + oldChar + '"→"' + selectedChar + '"');
            selectedChar = null;
            selectedStickIdx = null;
            selectedCharDisplay.textContent = '';
            document.querySelectorAll('.type-char').forEach(e => e.classList.remove('selected'));
        } else {
            if (selectedStickIdx === idx) {
                invertedPositions.add(idx);
                updateComposingStick();
                apiPost('/api/round/' + roundId + '/operation/', {
                    op_type: 'flip_char',
                    position: idx,
                    char_value: arrangedChars[idx],
                });
                addHistoryItem('翻字：位置' + (idx + 1) + ' "' + arrangedChars[idx] + '" (倒字!)');
                selectedStickIdx = null;
            } else {
                selectedStickIdx = idx;
                updateComposingStick();
            }
        }
    }

    composingStick.addEventListener('click', (e) => {
        if (e.target === composingStick || e.target === placeholder) {
            if (selectedChar) {
                const pos = arrangedChars.length;
                arrangedChars.push(selectedChar);
                updateComposingStick();
                apiPost('/api/round/' + roundId + '/operation/', {
                    op_type: 'place_char',
                    position: pos,
                    char_value: selectedChar,
                });
                addHistoryItem('放字：位置' + (pos + 1) + ' "' + selectedChar + '"');
                selectedChar = null;
                selectedCharDisplay.textContent = '';
                document.querySelectorAll('.type-char').forEach(e => e.classList.remove('selected'));
            }
        }
    });

    document.querySelectorAll('.btn-ink').forEach(btn => {
        btn.addEventListener('click', () => {
            const delta = parseInt(btn.dataset.delta);
            const newInk = inkUsed + delta;
            if (newInk < 0) return;
            inkUsed = newInk;
            updateInkDisplay();
            apiPost('/api/round/' + roundId + '/operation/', {
                op_type: 'adjust_ink',
                ink_delta: delta,
            });
            addHistoryItem('调墨：' + (delta > 0 ? '+' : '') + delta + ' (当前' + inkUsed + ')');
        });
    });

    document.getElementById('btn-undo').addEventListener('click', async () => {
        try {
            const data = await apiPost('/api/round/' + roundId + '/undo/', {});
            if (data.status === 'ok') {
                arrangedChars = data.arranged_text ? data.arranged_text.split('') : [];
                inkUsed = data.ink_used || 0;
                invertedPositions.clear();
                updateComposingStick();
                updateInkDisplay();
                addHistoryItem('撤销上一步操作');
            } else {
                alert(data.error || '无法撤销');
            }
        } catch(e) {
            alert('网络错误');
        }
    });

    document.getElementById('btn-proofread').addEventListener('click', async () => {
        proofreadPanel.style.display = 'block';
        proofreadResult.innerHTML = '<p style="color:var(--fg-muted)">校对中...</p>';

        await apiPost('/api/round/' + roundId + '/operation/', {
            op_type: 'proofread',
        });
        proofreadCount++;
        addHistoryItem('校对 (第' + proofreadCount + '次)');

        try {
            const data = await apiGet('/api/round/' + roundId + '/proofread/');
            proofreadResult.innerHTML = '';
            if (data.error_count === 0) {
                proofreadResult.innerHTML = '<div class="proofread-ok">✅ 校对通过！无误！</div>';
            } else {
                data.errors.forEach(err => {
                    const div = document.createElement('div');
                    div.className = 'proofread-error';
                    if (err.type === 'wrong') {
                        div.textContent = '位置' + (err.position + 1) + '：错字！应为"' + err.expected + '"，实际为"' + err.actual + '"';
                    } else if (err.type === 'missing') {
                        div.textContent = '位置' + (err.position + 1) + '：缺字！缺少"' + err.expected + '"';
                    } else if (err.type === 'extra') {
                        div.textContent = '位置' + (err.position + 1) + '：多余字"' + err.actual + '"';
                    }
                    proofreadResult.appendChild(div);
                });
            }
            highlightErrors(data.errors || []);
        } catch(e) {
            proofreadResult.innerHTML = '<p style="color:var(--danger)">校对失败</p>';
        }
    });

    function highlightErrors(errors) {
        const stickChars = composingStick.querySelectorAll('.stick-char');
        stickChars.forEach(el => { el.classList.remove('correct', 'wrong'); });
        errors.forEach(err => {
            if (err.position < stickChars.length) {
                stickChars[err.position].classList.add('wrong');
            }
        });
    }

    document.getElementById('btn-submit').addEventListener('click', () => {
        if (confirm('确认交稿？交稿后将无法修改。')) {
            submitRound();
        }
    });

    async function submitRound() {
        clearInterval(timerInterval);
        try {
            const data = await apiPost('/api/round/' + roundId + '/submit/', {
                elapsed_seconds: elapsedSeconds,
            });
            if (data.evaluation) {
                window.location.href = '/result/' + roundId + '/';
            } else {
                alert(data.error || '提交失败');
            }
        } catch(e) {
            alert('网络错误，请重试');
        }
    }

    async function autoSubmit() {
        alert('时间到！自动交稿。');
        await submitRound();
    }

    document.getElementById('history-toggle').addEventListener('click', () => {
        historyList.style.display = historyList.style.display === 'none' ? 'block' : 'none';
    });

    updateComposingStick();
    updateInkDisplay();
    startTimer();
})();
