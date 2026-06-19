const GameEngine = {
    state: null,
    level: null,
    currentNode: null,
    visitedNodes: [],
    pathEdges: [],
    steps: [],
    eventLog: [],
    gameOver: false,
    gameWon: false,

    init(levelId) {
        const level = Levels.getLevel(levelId);
        if (!level) return false;

        this.level = level;
        this.state = { ...level.initialState };
        this.currentNode = 'start';
        this.visitedNodes = ['start'];
        this.pathEdges = [];
        this.steps = [];
        this.eventLog = [];
        this.gameOver = false;
        this.gameWon = false;

        this.saveState();
        return true;
    },

    getReachableNodes() {
        if (this.gameOver) return [];

        const reachable = [];
        const currentId = this.currentNode;

        this.level.edges.forEach(edge => {
            if (edge.from === currentId) {
                reachable.push({
                    nodeId: edge.to,
                    cost: edge.cost
                });
            } else if (edge.to === currentId) {
                reachable.push({
                    nodeId: edge.from,
                    cost: edge.cost
                });
            }
        });

        return reachable;
    },

    moveTo(nodeId) {
        if (this.gameOver) return { success: false, message: '游戏已结束' };

        const reachable = this.getReachableNodes();
        const target = reachable.find(n => n.nodeId === nodeId);

        if (!target) {
            return { success: false, message: '无法到达该节点' };
        }

        const edge = this.findEdge(this.currentNode, nodeId);
        const cost = edge ? edge.cost : 0;

        if (this.state.balanceValue < cost) {
            return { success: false, message: '配平值不足，无法移动' };
        }

        const stepRecord = {
            stepIndex: this.steps.length,
            fromNode: this.currentNode,
            toNode: nodeId,
            cost: cost,
            stateBefore: { ...this.state },
            events: [],
            stateAfter: null
        };

        this.state.balanceValue -= cost;

        this.pathEdges.push({ from: this.currentNode, to: nodeId });

        this.currentNode = nodeId;
        if (!this.visitedNodes.includes(nodeId)) {
            this.visitedNodes.push(nodeId);
        }

        const node = this.getNode(nodeId);
        let triggeredEvent = null;
        if (node && node.event) {
            const event = GameEvents.getEvent(node.event);
            if (event) {
                const newState = GameEvents.applyEvent(this.state, node.event);
                this.state = newState;

                triggeredEvent = {
                    ...event,
                    nodeId: nodeId,
                    nodeName: node.name
                };

                this.eventLog.push(triggeredEvent);
                stepRecord.events.push(triggeredEvent);
            }
        }

        stepRecord.stateAfter = { ...this.state };
        this.steps.push(stepRecord);

        this.checkGameEnd();

        this.saveState();

        return {
            success: true,
            node: node,
            event: triggeredEvent,
            state: { ...this.state }
        };
    },

    findEdge(from, to) {
        return this.level.edges.find(e =>
            (e.from === from && e.to === to) ||
            (e.from === to && e.to === from)
        );
    },

    getNode(nodeId) {
        return this.level.nodes.find(n => n.id === nodeId);
    },

    checkGameEnd() {
        const winCondition = this.level.winCondition;
        const loseCondition = this.level.loseCondition;

        if (loseCondition) {
            if (loseCondition.type === 'balance_zero') {
                if (this.state.balanceValue <= loseCondition.minBalance) {
                    this.gameOver = true;
                    this.gameWon = false;
                    return;
                }
            } else if (loseCondition.type === 'balance_or_fail') {
                if (this.state.balanceValue <= loseCondition.minBalance ||
                    this.state.chouFailFactor >= loseCondition.maxFailFactor) {
                    this.gameOver = true;
                    this.gameWon = false;
                    return;
                }
            }
        }

        const isAtEnd = this.currentNode === 'end';

        if (winCondition && isAtEnd) {
            if (winCondition.type === 'reach_end_and_balance') {
                if (this.state.balanceValue >= winCondition.minBalance) {
                    this.gameOver = true;
                    this.gameWon = true;
                } else {
                    this.gameOver = true;
                    this.gameWon = false;
                }
            } else if (winCondition.type === 'reach_end_and_secret') {
                const meetsBalance = this.state.balanceValue >= winCondition.minBalance;
                let meetsSecret = false;

                if (winCondition.secretCondition) {
                    if (winCondition.secretCondition.includes('mergeMark')) {
                        const value = parseInt(winCondition.secretCondition.split('>=')[1].trim());
                        meetsSecret = this.state.mergeMark >= value;
                    }
                }

                if (meetsBalance && meetsSecret) {
                    this.gameOver = true;
                    this.gameWon = true;
                } else if (meetsBalance && !meetsSecret) {
                    this.gameOver = true;
                    this.gameWon = 'partial';
                } else {
                    this.gameOver = true;
                    this.gameWon = false;
                }
            }
        }
    },

    undo() {
        if (this.steps.length === 0) return { success: false, message: '没有可撤销的步骤' };
        if (this.gameOver) return { success: false, message: '游戏已结束，无法撤销' };

        const lastStep = this.steps.pop();

        this.state = { ...lastStep.stateBefore };
        this.currentNode = lastStep.fromNode;

        this.pathEdges.pop();

        const nodeId = lastStep.toNode;
        const stillVisited = this.visitedNodes.filter(n => n === nodeId).length > 1 ||
            this.visitedNodes.indexOf(nodeId) !== this.visitedNodes.length - 1;

        if (!stillVisited && lastStep.events.length > 0) {
            this.visitedNodes = this.visitedNodes.filter(n => n !== nodeId);
        }

        if (lastStep.events.length > 0) {
            this.eventLog.pop();
        }

        this.saveState();
        return { success: true, state: { ...this.state } };
    },

    reset() {
        if (this.level) {
            this.init(this.level.id);
        }
    },

    calculateScore() {
        if (!this.gameOver) return null;

        const baseScore = this.state.balanceValue * 10;
        const maoBonus = this.state.maoReward * 25;
        const mergeBonus = this.state.mergeMark * 15;
        const riskPenalty = this.state.ziRisk * 10;
        const failPenalty = this.state.chouFailFactor * 20;
        const stepPenalty = this.steps.length * 2;

        let score = baseScore + maoBonus + mergeBonus - riskPenalty - failPenalty - stepPenalty;

        if (this.gameWon === true) {
            score *= 1.5;
        } else if (this.gameWon === 'partial') {
            score *= 1.0;
        } else {
            score *= 0.3;
        }

        return Math.max(0, Math.round(score));
    },

    getSettlementDetails() {
        return {
            won: this.gameWon,
            finalState: { ...this.state },
            steps: this.steps.length,
            eventsTriggered: this.eventLog.length,
            score: this.calculateScore(),
            details: {
                baseScore: this.state.balanceValue * 10,
                maoBonus: this.state.maoReward * 25,
                mergeBonus: this.state.mergeMark * 15,
                riskPenalty: -this.state.ziRisk * 10,
                failPenalty: -this.state.chouFailFactor * 20,
                stepPenalty: -this.steps.length * 2
            }
        };
    },

    saveState() {
        const saveData = {
            levelId: this.level.id,
            state: { ...this.state },
            currentNode: this.currentNode,
            visitedNodes: [...this.visitedNodes],
            pathEdges: [...this.pathEdges],
            steps: JSON.parse(JSON.stringify(this.steps)),
            eventLog: JSON.parse(JSON.stringify(this.eventLog)),
            gameOver: this.gameOver,
            gameWon: this.gameWon
        };
        Storage.saveGameState(saveData);
    },

    loadState() {
        const savedData = Storage.loadGameState();
        if (!savedData || !savedData.levelId) return false;

        const level = Levels.getLevel(savedData.levelId);
        if (!level) return false;

        this.level = level;
        this.state = savedData.state;
        this.currentNode = savedData.currentNode;
        this.visitedNodes = savedData.visitedNodes;
        this.pathEdges = savedData.pathEdges;
        this.steps = savedData.steps;
        this.eventLog = savedData.eventLog;
        this.gameOver = savedData.gameOver;
        this.gameWon = savedData.gameWon;

        return true;
    },

    getStepByIndex(index) {
        return this.steps[index] || null;
    },

    replayToStep(stepIndex) {
        if (stepIndex < -1 || stepIndex >= this.steps.length) return false;

        if (stepIndex === -1) {
            this.state = { ...this.level.initialState };
            this.currentNode = 'start';
            this.visitedNodes = ['start'];
            this.pathEdges = [];
        } else {
            const step = this.steps[stepIndex];
            this.state = { ...step.stateAfter };

            this.pathEdges = [];
            this.visitedNodes = ['start'];
            for (let i = 0; i <= stepIndex; i++) {
                const s = this.steps[i];
                this.pathEdges.push({ from: s.fromNode, to: s.toNode });
                if (!this.visitedNodes.includes(s.toNode)) {
                    this.visitedNodes.push(s.toNode);
                }
            }
            this.currentNode = step.toNode;
        }

        return true;
    }
};
