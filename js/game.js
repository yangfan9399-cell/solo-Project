(function() {
  const GAME_KEY = 'tidal_tower_game_state_v1';
  const REPLAY_KEY = 'tidal_tower_replay_v1';

  const Game = {
    level: null,
    levelId: null,
    gameState: null,
    replayHistory: [],

    init() {
      this.bindUI();
      const savedLevel = this.getSavedLevelId();
      if (savedLevel) {
        this.setSelectedLevelId(savedLevel);
      }
      const levelId = this.getSelectedLevelId();
      this.levelId = levelId;
      this.level = LEVELS[levelId];
      if (this.hasPlayingState(levelId)) {
        try {
          this.continueGame();
          return;
        } catch (e) {
          console.warn('Auto continue failed:', e);
        }
      }
      this.checkContinue();
    },

    getSavedLevelId() {
      try {
        const raw = localStorage.getItem(GAME_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data.levelId || null;
      } catch (e) {
        return null;
      }
    },

    setSelectedLevelId(id) {
      const sel = document.getElementById('levelSelect');
      if (sel) sel.value = id;
    },

    getSelectedLevelId() {
      const sel = document.getElementById('levelSelect');
      return sel ? sel.value : 'jia';
    },

    hasPlayingState(levelId) {
      try {
        const raw = localStorage.getItem(GAME_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        return data.levelId === levelId && data.gameState && data.gameState.status === 'playing';
      } catch (e) {
        return false;
      }
    },

    bindUI() {
      const sel = document.getElementById('levelSelect');
      if (sel) {
        sel.addEventListener('change', () => {
          this.checkContinue();
        });
      }

      const newBtn = document.getElementById('newGameBtn');
      if (newBtn) newBtn.addEventListener('click', () => this.startNew());

      const contBtn = document.getElementById('continueBtn');
      if (contBtn) contBtn.addEventListener('click', () => this.continueGame());

      const moveBtn = document.getElementById('moveBtn');
      if (moveBtn) moveBtn.addEventListener('click', () => this.handleMoveClick());

      const undoBtn = document.getElementById('undoBtn');
      if (undoBtn) undoBtn.addEventListener('click', () => this.undoStep());

      const recalcBtn = document.getElementById('recalcBtn');
      if (recalcBtn) recalcBtn.addEventListener('click', () => this.recalculate());

      const playBtn = document.getElementById('playReplayBtn');
      if (playBtn) playBtn.addEventListener('click', () => this.autoReplay());
      const stepBtn = document.getElementById('stepReplayBtn');
      if (stepBtn) stepBtn.addEventListener('click', () => this.singleReplayStep());
      const resetBtn = document.getElementById('resetReplayBtn');
      if (resetBtn) resetBtn.addEventListener('click', () => this.resetReplayView());

      window.onNodeClick = (nodeId) => this.onNodeSelect(nodeId);
      window.onTimelineStepClick = (idx, step) => this.onTimelineClick(idx, step);
    },

    checkContinue() {
      const levelId = document.getElementById('levelSelect').value;
      this.levelId = levelId;
      this.level = LEVELS[levelId];

      try {
        const raw = localStorage.getItem(GAME_KEY);
        if (!raw) {
          this.hideContinue();
          return;
        }
        const data = JSON.parse(raw);
        if (data.levelId !== levelId) {
          this.hideContinue();
          return;
        }
        if (!data.gameState || data.gameState.status === 'playing') {
          this.showContinue();
        } else {
          this.hideContinue();
        }
      } catch (e) {
        this.hideContinue();
      }
    },

    showContinue() {
      const b = document.getElementById('continueBtn');
      if (b) b.style.display = '';
    },
    hideContinue() {
      const b = document.getElementById('continueBtn');
      if (b) b.style.display = 'none';
    },

    startNew() {
      this.levelId = document.getElementById('levelSelect').value;
      this.level = LEVELS[this.levelId];
      this.replayHistory = [];

      this.gameState = {
        lightValue: this.level.initialState.lightValue,
        lightTarget: this.level.initialState.lightTarget,
        traceSlotMax: this.level.initialState.traceSlotMax,
        usedSteps: 0,
        riskA: this.level.initialState.riskA,
        riskAMax: this.level.initialState.riskAMax,
        rewardD: this.level.initialState.rewardD,
        failB: this.level.initialState.failB,
        failBMax: this.level.initialState.failBMax,
        hiddenFlag: this.level.initialState.hiddenFlag || false,
        flags: {},
        status: 'playing',
        currentNodeId: null,
        endReason: null
      };

      Board.init(this.level, this.gameState);
      const startNode = Board.getCurrentNode();
      this.gameState.currentNodeId = Board.getCurrentNodeId();

      Events.init(this.level);
      Settlement.clear();
      Replay.init(this.levelId);
      Replay.reset();

      this.hideContinue();
      Board.setMessage(`【${this.level.name}】${this.level.description}　目标：${this.level.winCondition.description}`, 'info');

      this.processNodeEnter(startNode, true);
      this.saveState();
      this.refreshUI();
    },

    continueGame() {
      this.levelId = document.getElementById('levelSelect').value;
      this.level = LEVELS[this.levelId];

      try {
        const gRaw = localStorage.getItem(GAME_KEY);
        const rRaw = localStorage.getItem(REPLAY_KEY);
        if (!gRaw) return;
        const g = JSON.parse(gRaw);
        if (g.levelId !== this.levelId) return;
        this.gameState = g.gameState;

        Board.init(this.level, this.gameState);

        let replaySteps = [];
        if (rRaw) {
          try {
            const rData = JSON.parse(rRaw);
            if (rData && rData.steps) replaySteps = rData.steps;
          } catch (e) {}
        }
        Board.restoreFromSteps(replaySteps);
        Board.setGameState(this.gameState);

        Events.init(this.level);
        if (g.eventsTriggered) {
          g.eventsTriggered.forEach(e => Events.addCustomEvent({
            title: e.displayedTitle,
            description: e.displayedDesc,
            type: e.type
          }));
        }

        Replay.init(this.levelId);
        Replay.loadFromStorage();
        Replay.render();

        this.replayHistory = Replay.getSteps();

        if (this.gameState.status !== 'playing') {
          Settlement.calculate(this.level, this.gameState, this.replayHistory);
        }

        Board.setMessage('已接续当前推演局，可继续操作。', 'success');
        this.refreshUI();
      } catch (e) {
        console.error(e);
        Board.setMessage('接续失败，数据损坏，请启新推演。', 'error');
      }
    },

    onNodeSelect(nodeId) {
      if (!this.gameState || this.gameState.status !== 'playing') return;

      const reachable = Board.getReachableNodeIds();
      if (!reachable.includes(nodeId)) {
        Board.setMessage('该节点不在当前航线可达范围内。', 'warn');
        return;
      }
      if (!Board.isNodeAccessible(nodeId)) {
        const node = Board.getNode(nodeId);
        if (node && node.type === 'hidden') {
          Board.setMessage('此为隐藏节点，需先集齐触发条件方可进入。', 'warn');
          return;
        }
        if (node && node.requireHidden) {
          Board.setMessage('此终点需要先达成隐藏条件。', 'warn');
          return;
        }
      }

      this.executeMove(nodeId);
    },

    handleMoveClick() {
      if (!this.gameState || this.gameState.status !== 'playing') return;
      const reachable = Board.getReachableNodeIds().filter(id => Board.isNodeAccessible(id));
      if (reachable.length === 0) {
        Board.setMessage('当前没有可到达的节点，推演陷入死局。', 'error');
        return;
      }
      if (reachable.length === 1) {
        this.executeMove(reachable[0]);
        return;
      }
      Board.setMessage(`存在 ${reachable.length} 条航线，请在局面盘上点击目标节点。`, 'info');
    },

    executeMove(nodeId) {
      const prevState = this.cloneState();
      const prevNodeId = Board.getCurrentNodeId();
      const node = Board.getNode(nodeId);

      const moveRes = Board.moveTo(nodeId);
      if (!moveRes.ok) {
        Board.setMessage(moveRes.error, 'error');
        return;
      }

      this.gameState.usedSteps += 1;
      this.gameState.currentNodeId = nodeId;

      const before = this.cloneState();
      this.processNodeEnter(node, false);
      const after = this.cloneState();

      const step = {
        nodeId,
        prevNodeId,
        nodeName: node.name,
        nodeType: node.type,
        label: this.buildStepLabel(node),
        deltaLight: after.lightValue - before.lightValue,
        deltaRisk: after.riskA - before.riskA,
        deltaReward: after.rewardD - before.rewardD,
        deltaFail: after.failB - before.failB,
        snapshot: this.cloneState()
      };

      Replay.record(step);
      this.replayHistory.push(step);

      const lossReason = this.checkLose();
      if (lossReason) {
        this.gameState.status = 'defeat';
        this.gameState.endReason = lossReason;
        Board.setMessage(`推演失败：${lossReason}`, 'error');
        Settlement.calculate(this.level, this.gameState, this.replayHistory);
        this.saveState();
        this.refreshUI();
        return;
      }

      if (node.type === 'end' && (!node.requireHidden || this.gameState.hiddenFlag)) {
        if (this.checkWin(node)) {
          this.gameState.status = 'victory';
          this.gameState.endReason = '达成目标';
          Board.setMessage('推演成功！航线顺利抵达终点。', 'success');
          Settlement.calculate(this.level, this.gameState, this.replayHistory);
          this.saveState();
          this.refreshUI();
          return;
        } else {
          Board.setMessage('虽抵达终点，但潮汐钟塔点亮值未达目标……继续前行或撤回？', 'warn');
        }
      }

      if (this.gameState.usedSteps >= this.gameState.traceSlotMax) {
        if (this.gameState.status === 'playing') {
          this.gameState.status = 'defeat';
          this.gameState.endReason = '描线槽用尽，航线无法继续';
          Board.setMessage('潮汐钟塔描线槽已用尽，推演失败。', 'error');
          Settlement.calculate(this.level, this.gameState, this.replayHistory);
        }
      }

      this.saveState();
      this.refreshUI();
    },

    buildStepLabel(node) {
      const icons = { start: '⚓起锚', end: '🏁归航', tower: '🗼点亮', reward: '💰拾宝', risk: '⚠涉险', event: '✦事件', hidden: '▣秘境' };
      return (icons[node.type] || '→') + node.name;
    },

    processNodeEnter(node, isStart) {
      const before = this.cloneState();

      if (node.lightOnEnter) {
        this.gameState.lightValue += node.lightOnEnter;
      }
      if (node.riskOnEnter) {
        this.gameState.riskA += node.riskOnEnter;
      }
      if (node.rewardOnEnter) {
        this.gameState.rewardD += node.rewardOnEnter;
      }
      if (node.failOnEnter) {
        this.gameState.failB += node.failOnEnter;
      }

      if (node.eventId) {
        const evt = Events.checkAndTrigger(node, this.gameState);
        if (evt) {
          for (const k in evt.effects) {
            if (typeof this.gameState[k] === 'number') {
              this.gameState[k] += evt.effects[k];
            }
          }
          if (evt.flags) {
            evt.flags.forEach(f => { this.gameState.flags[f] = true; });
            if (evt.flags.includes('yi_echo_triggered')) {
              Events.addCustomEvent({
                title: '隐藏条件进展',
                description: '回声窟已响应……符文之门即将开启。',
                type: 'special'
              });
            }
          }
        }
      }

      if (node.type === 'hidden') {
        this.gameState.hiddenFlag = true;
        Events.addCustomEvent({
          title: '秘境之门已开',
          description: '隐藏条件触发，秘境航线展开。',
          type: 'special'
        });
      }

      if (this.gameState.riskA < 0) this.gameState.riskA = 0;
    },

    checkLose() {
      for (const cond of this.level.loseConditions) {
        if (cond.type === 'risk_exceed' && this.gameState.riskA >= this.gameState.riskAMax) {
          return cond.description;
        }
        if (cond.type === 'fail_exceed' && this.gameState.failB >= this.gameState.failBMax) {
          return cond.description;
        }
        if (cond.type === 'reward_neg' && this.gameState.rewardD < 0) {
          return cond.description;
        }
      }
      return null;
    },

    checkWin(node) {
      if (this.gameState.lightValue < this.gameState.lightTarget) return false;
      if (node.requireHidden && !this.gameState.hiddenFlag) return false;
      const t = this.level.winCondition.type;
      if (t === 'reach_end_with_light') return true;
      if (t === 'reach_end_with_light_and_reward') {
        return this.gameState.rewardD >= 0;
      }
      if (t === 'reach_end_with_light_hidden') return true;
      return true;
    },

    undoStep() {
      if (!this.gameState) return;
      if (this.replayHistory.length === 0) return;
      if (this.gameState.status !== 'playing') {
        Board.setMessage('推演已结束，无法撤回。', 'warn');
        return;
      }

      const lastStep = this.replayHistory.pop();
      Replay.undoLast();

      if (lastStep && lastStep.prevNodeId) {
        Board.undoMove(lastStep.prevNodeId);
        this.gameState.currentNodeId = lastStep.prevNodeId;
      }

      const eventsList = Events.getTriggered();
      if (eventsList.length > 0) {
        const lastEvent = eventsList[eventsList.length - 1];
        if (lastEvent && this.isStepEvent(lastStep, lastEvent)) {
          Events.init(this.level);
          for (let i = 0; i < eventsList.length - 1; i++) {
            Events.addCustomEvent({
              title: eventsList[i].displayedTitle,
              description: eventsList[i].displayedDesc,
              type: eventsList[i].type
            });
          }
        }
      }

      let recoverSnapshot = null;
      if (this.replayHistory.length > 0) {
        const prev = this.replayHistory[this.replayHistory.length - 1];
        if (prev.snapshot) recoverSnapshot = prev.snapshot;
      } else {
        recoverSnapshot = {
          lightValue: this.level.initialState.lightValue,
          riskA: this.level.initialState.riskA,
          rewardD: this.level.initialState.rewardD,
          failB: this.level.initialState.failB,
          usedSteps: 0,
          flags: {},
          hiddenFlag: false
        };
        const startNode = this.level.map.nodes.find(n => n.type === 'start');
        if (startNode && startNode.lightOnEnter) {
          recoverSnapshot.lightValue += startNode.lightOnEnter;
        }
      }

      if (recoverSnapshot) {
        this.gameState.lightValue = recoverSnapshot.lightValue;
        this.gameState.riskA = recoverSnapshot.riskA;
        this.gameState.rewardD = recoverSnapshot.rewardD;
        this.gameState.failB = recoverSnapshot.failB;
        this.gameState.usedSteps = recoverSnapshot.usedSteps;
        this.gameState.flags = recoverSnapshot.flags || {};
        this.gameState.hiddenFlag = recoverSnapshot.hiddenFlag || false;
      }

      if (this.gameState.riskA < 0) this.gameState.riskA = 0;

      Board.setGameState(this.gameState);
      Board.setMessage('已撤回一步。', 'info');
      this.saveState();
      this.refreshUI();
    },

    isStepEvent(step, evt) {
      if (!step || !evt) return false;
      const node = Board.getNode(step.nodeId);
      if (!node) return false;
      return node.eventId === evt.eventId;
    },

    recalculate() {
      if (!this.gameState || (this.gameState.status !== 'victory' && this.gameState.status !== 'defeat')) {
        Board.setMessage('推演未结束，暂无需重算。', 'warn');
        return;
      }
      const res = Settlement.calculate(this.level, this.gameState, this.replayHistory, true);
      Settlement.flash();
      Board.setMessage(`后端重算完成，总分：${res.total}　评级：${res.grade}`, 'success');
    },

    autoReplay() {
      if (this.replayHistory.length === 0) {
        Board.setMessage('尚无步骤可回放。', 'warn');
        return;
      }
      Board.setMessage('自动回放开始……', 'info');
      Replay.startAutoPlay((step, idx) => {
        if (step.snapshot) {
          const s = step.snapshot;
          this.gameState.lightValue = s.lightValue;
          this.gameState.riskA = s.riskA;
          this.gameState.rewardD = s.rewardD;
          this.gameState.failB = s.failB;
          this.gameState.usedSteps = s.usedSteps;
          this.gameState.flags = s.flags || {};
          this.gameState.hiddenFlag = s.hiddenFlag || false;
          Board.setGameState(this.gameState);
          Board.undoMove(step.nodeId);
          Board.moveTo(step.nodeId);
          Board.render();
        }
      }, 700);
    },

    singleReplayStep() {
      if (this.replayHistory.length === 0) return;
      Replay.stepForward((step, idx) => {
        if (step.snapshot) {
          const s = step.snapshot;
          this.gameState.lightValue = s.lightValue;
          this.gameState.riskA = s.riskA;
          this.gameState.rewardD = s.rewardD;
          this.gameState.failB = s.failB;
          this.gameState.usedSteps = s.usedSteps;
          this.gameState.flags = s.flags || {};
          this.gameState.hiddenFlag = s.hiddenFlag || false;
          Board.setGameState(this.gameState);
          Board.undoMove(step.nodeId);
          Board.moveTo(step.nodeId);
          Board.render();
        }
      });
    },

    resetReplayView() {
      Replay.resetPointer(() => {
        this.startNew();
      });
    },

    onTimelineClick(idx, step) {
      if (!step || !step.snapshot) return;
      if (this.gameState.status === 'playing') {
        Board.setMessage('推演进行中，回放跳转请等待推演结束后进行。', 'warn');
        return;
      }
      const s = step.snapshot;
      this.gameState.lightValue = s.lightValue;
      this.gameState.riskA = s.riskA;
      this.gameState.rewardD = s.rewardD;
      this.gameState.failB = s.failB;
      this.gameState.usedSteps = s.usedSteps;
      this.gameState.flags = s.flags || {};
      this.gameState.hiddenFlag = s.hiddenFlag || false;
      Replay.setPointer(idx + 1);
      Board.setGameState(this.gameState);
      Board.undoMove(step.nodeId);
      Board.moveTo(step.nodeId);
      Board.render();
    },

    cloneState() {
      return {
        lightValue: this.gameState.lightValue,
        lightTarget: this.gameState.lightTarget,
        traceSlotMax: this.gameState.traceSlotMax,
        usedSteps: this.gameState.usedSteps,
        riskA: this.gameState.riskA,
        riskAMax: this.gameState.riskAMax,
        rewardD: this.gameState.rewardD,
        failB: this.gameState.failB,
        failBMax: this.gameState.failBMax,
        hiddenFlag: this.gameState.hiddenFlag,
        flags: { ...this.gameState.flags }
      };
    },

    saveState() {
      try {
        localStorage.setItem(GAME_KEY, JSON.stringify({
          levelId: this.levelId,
          gameState: this.gameState,
          eventsTriggered: Events.getTriggered()
        }));
      } catch (e) {
        console.warn(e);
      }
    },

    refreshUI() {
      Board.setGameState(this.gameState);
      Board.render();
      Replay.render();

      const undoBtn = document.getElementById('undoBtn');
      if (undoBtn) {
        undoBtn.disabled = this.replayHistory.length === 0 || this.gameState.status !== 'playing';
      }

      const moveBtn = document.getElementById('moveBtn');
      if (moveBtn) {
        moveBtn.disabled = this.gameState.status !== 'playing';
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => Game.init());
})();
