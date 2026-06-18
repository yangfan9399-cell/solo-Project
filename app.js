(function() {
    var ns = MeteorWorkshop;

    function renderAll() {
        ns.BoardUI.render();
        ns.EventsUI.render();
        ns.ReplayUI.render();
        ns.SettlementUI.render();
        updateSessionButtons();
    }

    function updateSessionButtons() {
        var btns = document.querySelectorAll('.session-btn');
        btns.forEach(function(btn) {
            var sid = btn.getAttribute('data-session');
            if (sid === ns.StateManager.currentSessionId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function handleEventClick(index) {
        var sessionId = ns.StateManager.currentSessionId;
        var allEvents = ns.Events[sessionId] || [];
        var ev = allEvents[index];
        if (!ev) return;

        if (!ns.StateManager.isAtLatest()) {
            if (!confirm('当前处于回放模式，继续将覆盖之后的所有历史步骤，确定执行吗？')) {
                return;
            }
        }

        var ok = ns.StateManager.applyEvent(ev);
        if (ok) {
            renderAll();
        }
    }

    function handleStepBack() {
        ns.StateManager.stepBack();
        renderAll();
    }

    function handleStepForward() {
        ns.StateManager.stepForward();
        renderAll();
    }

    function handleJumpTo(step) {
        ns.StateManager.jumpToStep(step);
        renderAll();
    }

    function handleReset() {
        ns.StateManager.reset();
        renderAll();
    }

    function handleSessionSwitch(sessionId) {
        if (sessionId === ns.StateManager.currentSessionId) return;
        if (ns.StateManager.getHistoryLength() > 1) {
            if (!confirm('切换局将清空当前历史，确定切换吗？')) return;
        }
        ns.StateManager.switchSession(sessionId);
        renderAll();
    }

    var API_BASE = 'http://localhost:3009';

    function handleRecalculate() {
        var sessionId = ns.StateManager.currentSessionId;
        var history = ns.StateManager.history;
        var payload = JSON.stringify({
            sessionId: sessionId,
            history: history
        });

        var btn = document.getElementById('recalc-btn');
        var origText = btn ? btn.textContent : '';
        if (btn) {
            btn.textContent = '请求后端重算中...';
            btn.disabled = true;
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', API_BASE + '/api/recalculate', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 8000;

        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var result = JSON.parse(xhr.responseText);
                    result._source = 'backend';
                    ns.SettlementUI.renderWithResult(result);
                    if (btn) {
                        btn.textContent = '后端重算完成 ✓';
                        setTimeout(function() {
                            btn.textContent = origText;
                            btn.disabled = false;
                        }, 1500);
                    }
                } catch (e) {
                    fallbackRecalc('后端返回数据解析失败: ' + e.message, btn, origText);
                }
            } else {
                fallbackRecalc('后端返回错误状态: ' + xhr.status, btn, origText);
            }
        };

        xhr.onerror = function() {
            fallbackRecalc('无法连接后端服务 (node server.js)', btn, origText);
        };

        xhr.ontimeout = function() {
            fallbackRecalc('后端请求超时', btn, origText);
        };

        xhr.send(payload);
    }

    function fallbackRecalc(reason, btn, origText) {
        var result = ns.Engine.backendRecalculate();
        result._source = 'local_fallback';
        result._fallbackReason = reason;
        ns.SettlementUI.renderWithResult(result);
        if (btn) {
            btn.textContent = '本地回退 (后端不可用)';
            setTimeout(function() {
                btn.textContent = origText;
                btn.disabled = false;
            }, 1800);
        }
    }

    function bindGlobalEvents() {
        var sessionBtns = document.querySelectorAll('.session-btn');
        sessionBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var sid = btn.getAttribute('data-session');
                handleSessionSwitch(sid);
            });
        });

        ns.EventsUI.onEventClick = handleEventClick;
        ns.ReplayUI.onStepBack = handleStepBack;
        ns.ReplayUI.onStepForward = handleStepForward;
        ns.ReplayUI.onJumpTo = handleJumpTo;
        ns.ReplayUI.onReset = handleReset;
        ns.SettlementUI.onRecalculate = handleRecalculate;
    }

    function initApp() {
        var restored = ns.StateManager.loadFromStorage();
        if (!restored) {
            ns.StateManager.init('ren');
        }
        bindGlobalEvents();
        renderAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
