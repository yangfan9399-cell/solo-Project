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

    function handleRecalculate() {
        var result = ns.Engine.backendRecalculate();
        ns.SettlementUI.renderWithResult(result);

        var btn = document.getElementById('recalc-btn');
        if (btn) {
            var origText = btn.textContent;
            btn.textContent = '重算中...';
            btn.disabled = true;
            setTimeout(function() {
                btn.textContent = '重算完成 ✓';
                setTimeout(function() {
                    btn.textContent = origText;
                    btn.disabled = false;
                }, 900);
            }, 400);
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
