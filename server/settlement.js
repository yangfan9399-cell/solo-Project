#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SettlementEngine = {
    levels: null,
    events: null,

    loadData() {
        const levelsPath = path.join(__dirname, '../js/game/levels.js');
        const eventsPath = path.join(__dirname, '../js/game/events.js');

        let levelsCode = fs.readFileSync(levelsPath, 'utf-8');
        let eventsCode = fs.readFileSync(eventsPath, 'utf-8');

        levelsCode = levelsCode.replace('const Levels', 'var Levels');
        eventsCode = eventsCode.replace('const GameEvents', 'var GameEvents');

        const combinedCode = levelsCode + '\n' + eventsCode;

        const sandbox = {};
        const script = new (require('vm').Script)(combinedCode);
        const context = require('vm').createContext(sandbox);
        script.runInContext(context);

        this.levels = context.Levels;
        this.events = context.GameEvents;
    },

    validateReplay(levelId, steps) {
        const level = this.levels.getLevel(levelId);
        if (!level) {
            return { valid: false, error: 'Invalid level ID' };
        }

        let state = { ...level.initialState };
        let currentNode = 'start';
        let visitedNodes = ['start'];
        let eventLog = [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];

            const edge = this.findEdge(level, currentNode, step.toNode);
            if (!edge) {
                return {
                    valid: false,
                    error: `Step ${i + 1}: Invalid move from ${currentNode} to ${step.toNode}`,
                    step: i
                };
            }

            if (state.balanceValue < edge.cost) {
                return {
                    valid: false,
                    error: `Step ${i + 1}: Insufficient balance (${state.balanceValue} < ${edge.cost})`,
                    step: i
                };
            }

            state.balanceValue -= edge.cost;

            const node = level.nodes.find(n => n.id === step.toNode);
            if (node && node.event) {
                const isFirstVisit = !visitedNodes.includes(step.toNode);
                if (isFirstVisit) {
                    const event = this.events.getEvent(node.event);
                    if (event) {
                        state = this.applyEventEffects(state, event.effects);
                        eventLog.push({
                            ...event,
                            nodeId: node.id,
                            nodeName: node.name
                        });
                    }
                }
            }

            if (!visitedNodes.includes(step.toNode)) {
                visitedNodes.push(step.toNode);
            }

            currentNode = step.toNode;

            const gameOverResult = this.checkGameEnd(level, state, currentNode);
            if (gameOverResult.gameOver && i < steps.length - 1) {
                return {
                    valid: false,
                    error: `Step ${i + 1}: Game ended prematurely`,
                    step: i,
                    state: { ...state }
                };
            }
        }

        const finalResult = this.checkGameEnd(level, state, currentNode);
        const score = this.calculateScore(state, steps.length, finalResult.gameWon);

        return {
            valid: true,
            finalState: state,
            currentNode: currentNode,
            visitedNodes: visitedNodes,
            eventLog: eventLog,
            gameOver: finalResult.gameOver,
            gameWon: finalResult.gameWon,
            score: score,
            details: this.getSettlementDetails(state, steps.length, eventLog.length, finalResult.gameWon)
        };
    },

    findEdge(level, from, to) {
        return level.edges.find(e =>
            (e.from === from && e.to === to) ||
            (e.from === to && e.to === from)
        );
    },

    applyEventEffects(state, effects) {
        const newState = { ...state };

        if (effects.balanceValue !== undefined) {
            newState.balanceValue += effects.balanceValue;
        }
        if (effects.infectionTank !== undefined) {
            newState.infectionTank = Math.max(0, newState.infectionTank + effects.infectionTank);
        }
        if (effects.mergeMark !== undefined) {
            newState.mergeMark += effects.mergeMark;
        }
        if (effects.ziRisk !== undefined) {
            newState.ziRisk += effects.ziRisk;
        }
        if (effects.maoReward !== undefined) {
            newState.maoReward += effects.maoReward;
        }
        if (effects.chouFailFactor !== undefined) {
            newState.chouFailFactor += effects.chouFailFactor;
        }

        return newState;
    },

    checkGameEnd(level, state, currentNode) {
        const winCondition = level.winCondition;
        const loseCondition = level.loseCondition;

        let gameOver = false;
        let gameWon = false;

        if (loseCondition) {
            if (loseCondition.type === 'balance_zero') {
                if (state.balanceValue <= loseCondition.minBalance) {
                    gameOver = true;
                    gameWon = false;
                }
            } else if (loseCondition.type === 'balance_or_fail') {
                if (state.balanceValue <= loseCondition.minBalance ||
                    state.chouFailFactor >= loseCondition.maxFailFactor) {
                    gameOver = true;
                    gameWon = false;
                }
            }
        }

        if (!gameOver) {
            const isAtEnd = currentNode === 'end';

            if (winCondition && isAtEnd) {
                if (winCondition.type === 'reach_end_and_balance') {
                    if (state.balanceValue >= winCondition.minBalance) {
                        gameOver = true;
                        gameWon = true;
                    } else {
                        gameOver = true;
                        gameWon = false;
                    }
                } else if (winCondition.type === 'reach_end_and_secret') {
                    const meetsBalance = state.balanceValue >= winCondition.minBalance;
                    let meetsSecret = false;

                    if (winCondition.secretCondition) {
                        if (winCondition.secretCondition.includes('mergeMark')) {
                            const value = parseInt(winCondition.secretCondition.split('>=')[1].trim());
                            meetsSecret = state.mergeMark >= value;
                        }
                    }

                    if (meetsBalance && meetsSecret) {
                        gameOver = true;
                        gameWon = true;
                    } else if (meetsBalance && !meetsSecret) {
                        gameOver = true;
                        gameWon = 'partial';
                    } else {
                        gameOver = true;
                        gameWon = false;
                    }
                }
            }
        }

        return { gameOver, gameWon };
    },

    calculateScore(state, stepCount, gameWon) {
        const baseScore = state.balanceValue * 10;
        const maoBonus = state.maoReward * 25;
        const mergeBonus = state.mergeMark * 15;
        const riskPenalty = state.ziRisk * 10;
        const failPenalty = state.chouFailFactor * 20;
        const stepPenalty = stepCount * 2;

        let score = baseScore + maoBonus + mergeBonus - riskPenalty - failPenalty - stepPenalty;

        if (gameWon === true) {
            score *= 1.5;
        } else if (gameWon === 'partial') {
            score *= 1.0;
        } else {
            score *= 0.3;
        }

        return Math.max(0, Math.round(score));
    },

    getSettlementDetails(state, stepCount, eventCount, gameWon) {
        return {
            baseScore: state.balanceValue * 10,
            maoBonus: state.maoReward * 25,
            mergeBonus: state.mergeMark * 15,
            riskPenalty: -state.ziRisk * 10,
            failPenalty: -state.chouFailFactor * 20,
            stepPenalty: -stepCount * 2
        };
    }
};

if (require.main === module) {
    SettlementEngine.loadData();

    const testCases = [
        {
            name: '子局 - 简单通关测试',
            levelId: 'zi',
            steps: [
                { toNode: 'n1' },
                { toNode: 'n4' },
                { toNode: 'n7' },
                { toNode: 'n8' },
                { toNode: 'end' }
            ]
        },
        {
            name: '子局 - 另一条路径',
            levelId: 'zi',
            steps: [
                { toNode: 'n2' },
                { toNode: 'n4' },
                { toNode: 'n6' },
                { toNode: 'n8' },
                { toNode: 'end' }
            ]
        },
        {
            name: '子局 - 探索更多节点',
            levelId: 'zi',
            steps: [
                { toNode: 'n1' },
                { toNode: 'n3' },
                { toNode: 'n1' },
                { toNode: 'n4' },
                { toNode: 'n2' },
                { toNode: 'n5' },
                { toNode: 'n7' },
                { toNode: 'n8' },
                { toNode: 'end' }
            ]
        },
        {
            name: '卯局 - 资源测试',
            levelId: 'mao',
            steps: [
                { toNode: 'n2' },
                { toNode: 'n4' },
                { toNode: 'n6' },
                { toNode: 'n9' },
                { toNode: 'n10' },
                { toNode: 'end' }
            ]
        },
        {
            name: '丑局 - 隐藏条件测试',
            levelId: 'chou',
            steps: [
                { toNode: 'n2' },
                { toNode: 'n5' },
                { toNode: 'n8' },
                { toNode: 'n12' },
                { toNode: 'n13' },
                { toNode: 'end' }
            ]
        }
    ];

    console.log('\n=== 银盐暗房航线推演局 - 后端结算验证 ===\n');

    let passed = 0;
    let failed = 0;

    testCases.forEach((testCase, index) => {
        console.log(`测试 ${index + 1}: ${testCase.name}`);
        console.log('-'.repeat(50));

        const result = SettlementEngine.validateReplay(testCase.levelId, testCase.steps);

        if (result.valid) {
            console.log('✅ 回放验证通过');
            console.log(`   最终配平值: ${result.finalState.balanceValue}`);
            console.log(`   归并痕: ${result.finalState.mergeMark}`);
            console.log(`   卯号奖励: ${result.finalState.maoReward}`);
            console.log(`   子号风险: ${result.finalState.ziRisk}`);
            console.log(`   触发事件数: ${result.eventLog.length}`);
            console.log(`   游戏状态: ${result.gameWon === true ? '胜利' : result.gameWon === 'partial' ? '部分胜利' : result.gameOver ? '失败' : '进行中'}`);
            console.log(`   最终得分: ${result.score}`);
            passed++;
        } else {
            console.log('❌ 回放验证失败');
            console.log(`   错误: ${result.error}`);
            failed++;
        }
        console.log('');
    });

    console.log('='.repeat(50));
    console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
    console.log('');
}

module.exports = SettlementEngine;
