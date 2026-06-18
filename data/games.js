const games = {
  bing: {
    id: 'bing',
    name: '丙局·琉璃温室教学篇',
    description: '学习时序修复基础操作，倒排值与配平槽的协同',
    difficulty: '入门',
    maxSteps: 12,
    initialState: {
      invertedValue: 50,
      balanceSlots: [0, 0, 0],
      measureTraces: [
        { time: 0, value: 50, stable: true },
        { time: 1, value: 48, stable: false },
        { time: 2, value: 52, stable: false }
      ],
      riskC: 3,
      rewardM: 2,
      failureY: 0
    },
    winCondition: (state) => {
      const allSlotsBalanced = state.balanceSlots.every(s => s >= 30 && s <= 70);
      const invertedOk = state.invertedValue >= 60 && state.invertedValue <= 80;
      const failureOk = state.failureY < 5;
      return allSlotsBalanced && invertedOk && failureOk;
    },
    loseCondition: (state) => {
      return state.failureY >= 5 || state.riskC <= 0 || state.rewardM < 0;
    },
    winFormula: '倒排值∈[60,80] ∧ 配平槽全∈[30,70] ∧ 酉号<5',
    loseFormula: '酉号≥5 ∨ 丙号≤0 ∨ 卯号<0',
    events: [
      { id: 'e1', name: '晨露校准', description: '倒排值+5，配平槽0+10', cost: { riskC: 0 }, effect: (s) => { s.invertedValue += 5; s.balanceSlots[0] += 10; } },
      { id: 'e2', name: '琉璃共振', description: '倒排值-3，配平槽1+15，量测痕标记', cost: { riskC: 1 }, effect: (s) => { s.invertedValue -= 3; s.balanceSlots[1] += 15; s.measureTraces.push({ time: Date.now(), value: s.invertedValue, stable: true }); } },
      { id: 'e3', name: '温室调和', description: '配平槽2+20，卯号+1', cost: { riskC: 0, rewardM: 0 }, effect: (s) => { s.balanceSlots[2] += 20; s.rewardM += 1; } },
      { id: 'e4', name: '时序脉冲', description: '倒排值+10，酉号+1', cost: { riskC: 1 }, effect: (s) => { s.invertedValue += 10; s.failureY += 1; } },
      { id: 'e5', name: '裂隙封印', description: '酉号-1，丙号-1', cost: { riskC: 1 }, effect: (s) => { s.failureY = Math.max(0, s.failureY - 1); s.riskC -= 1; } }
    ],
    map: {
      name: '初芽温室',
      slots: [
        { id: 0, name: '光脉槽', position: 'top' },
        { id: 1, name: '水分槽', position: 'middle' },
        { id: 2, name: '养分槽', position: 'bottom' }
      ],
      theme: 'emerald'
    }
  },

  mao: {
    id: 'mao',
    name: '卯局·资源匮乏之境',
    description: '丙号风险稀缺，每一步都要精打细算',
    difficulty: '困难',
    maxSteps: 15,
    initialState: {
      invertedValue: 30,
      balanceSlots: [10, 5, 15],
      measureTraces: [
        { time: 0, value: 30, stable: false },
        { time: 1, value: 28, stable: false },
        { time: 2, value: 35, stable: false }
      ],
      riskC: 2,
      rewardM: 1,
      failureY: 1
    },
    winCondition: (state) => {
      const slotSum = state.balanceSlots.reduce((a, b) => a + b, 0);
      const invertedOk = state.invertedValue >= 70;
      const rewardOk = state.rewardM >= 5;
      const failureOk = state.failureY < 3;
      return slotSum >= 180 && invertedOk && rewardOk && failureOk;
    },
    loseCondition: (state) => {
      return state.failureY >= 3 || state.riskC < 0 || state.invertedValue <= 0;
    },
    winFormula: '配平槽和≥180 ∧ 倒排值≥70 ∧ 卯号≥5 ∧ 酉号<3',
    loseFormula: '酉号≥3 ∨ 丙号<0 ∨ 倒排值≤0',
    events: [
      { id: 'e1', name: '光脉汲引', description: '倒排值+8，配平槽0+8，消耗丙号1', cost: { riskC: 1 }, effect: (s) => { s.invertedValue += 8; s.balanceSlots[0] += 8; } },
      { id: 'e2', name: '水分循环', description: '配平槽1+12，卯号+1，酉号+1', cost: { riskC: 0 }, effect: (s) => { s.balanceSlots[1] += 12; s.rewardM += 1; s.failureY += 1; } },
      { id: 'e3', name: '养分萃取', description: '配平槽2+15，消耗卯号2', cost: { riskC: 0, rewardM: 2 }, effect: (s) => { s.balanceSlots[2] += 15; } },
      { id: 'e4', name: '能量置换', description: '倒排值+15，配平槽各-5', cost: { riskC: 1 }, effect: (s) => { s.invertedValue += 15; s.balanceSlots = s.balanceSlots.map(v => Math.max(0, v - 5)); } },
      { id: 'e5', name: '风险对冲', description: '丙号+2，酉号+2', cost: { rewardM: 2 }, effect: (s) => { s.riskC += 2; s.failureY += 2; } },
      { id: 'e6', name: '精密调控', description: '倒排值微调+3，配平槽0+5', cost: { riskC: 0 }, effect: (s) => { s.invertedValue += 3; s.balanceSlots[0] += 5; } }
    ],
    map: {
      name: '荒瘠温室',
      slots: [
        { id: 0, name: '枯光槽', position: 'top' },
        { id: 1, name: '涩水槽', position: 'middle' },
        { id: 2, name: '瘦养槽', position: 'bottom' }
      ],
      theme: 'amber'
    }
  },

  you: {
    id: 'you',
    name: '酉局·隐藏裂隙之秘',
    description: '触发隐藏条件，揭开温室的真正秘密',
    difficulty: '深渊',
    maxSteps: 20,
    initialState: {
      invertedValue: 100,
      balanceSlots: [50, 50, 50, 0],
      measureTraces: [
        { time: 0, value: 100, stable: true },
        { time: 1, value: 95, stable: false },
        { time: 2, value: 105, stable: false },
        { time: 3, value: 90, stable: false }
      ],
      riskC: 5,
      rewardM: 3,
      failureY: 0,
      hiddenTrigger: 0,
      secretUnlocked: false
    },
    winCondition: (state) => {
      if (state.secretUnlocked) {
        const allPerfect = state.balanceSlots.every(s => s === 66);
        const invertedPerfect = state.invertedValue === 88;
        return allPerfect && invertedPerfect && state.failureY === 0;
      }
      const allSlotsBalanced = state.balanceSlots.slice(0, 3).every(s => s >= 40 && s <= 80);
      const invertedOk = state.invertedValue >= 50 && state.invertedValue <= 120;
      return allSlotsBalanced && invertedOk && state.failureY < 3;
    },
    loseCondition: (state) => {
      return state.failureY >= 7 || state.riskC <= 0 || state.invertedValue <= 0 || state.invertedValue >= 200;
    },
    winFormula: '隐藏: 配平槽全=66 ∧ 倒排值=88 ∧ 酉号=0 | 普通: 配平槽∈[40,80] ∧ 倒排值∈[50,120]',
    loseFormula: '酉号≥7 ∨ 丙号≤0 ∨ 倒排值∉(0,200)',
    events: [
      { id: 'e1', name: '琉璃震颤', description: '倒排值-10，配平槽0-5，丙号-1', cost: { riskC: 1 }, effect: (s) => { s.invertedValue -= 10; s.balanceSlots[0] -= 5; s.hiddenTrigger += 1; } },
      { id: 'e2', name: '时序涟漪', description: '倒排值+5，配平槽1+10，卯号+1', cost: { riskC: 0 }, effect: (s) => { s.invertedValue += 5; s.balanceSlots[1] += 10; s.rewardM += 1; } },
      { id: 'e3', name: '裂隙窥伺', description: '酉号+2，隐藏触发+2', cost: { riskC: 1, rewardM: 1 }, effect: (s) => { s.failureY += 2; s.hiddenTrigger += 2; } },
      { id: 'e4', name: '温室庇护', description: '酉号-2，丙号-1', cost: { riskC: 1 }, effect: (s) => { s.failureY = Math.max(0, s.failureY - 2); } },
      { id: 'e5', name: '第四共鸣', description: '解锁隐藏槽，配平槽3=66', cost: { riskC: 2, rewardM: 3 }, effect: (s) => { if (s.hiddenTrigger >= 5) { s.balanceSlots[3] = 66; s.secretUnlocked = true; s.measureTraces.push({ time: Date.now(), value: s.invertedValue, stable: true, secret: true }); } } },
      { id: 'e6', name: '精准校准', description: '倒排值=88，需解锁隐藏', cost: { riskC: 3 }, effect: (s) => { if (s.secretUnlocked) { s.invertedValue = 88; } } },
      { id: 'e7', name: '完美调和', description: '配平槽前3=66，需解锁隐藏', cost: { riskC: 2, rewardM: 2 }, effect: (s) => { if (s.secretUnlocked) { s.balanceSlots[0] = 66; s.balanceSlots[1] = 66; s.balanceSlots[2] = 66; } } },
      { id: 'e8', name: '净化仪式', description: '酉号=0，消耗丙号3', cost: { riskC: 3 }, effect: (s) => { s.failureY = 0; } }
    ],
    map: {
      name: '秘境温室',
      slots: [
        { id: 0, name: '东之琉璃槽', position: 'top' },
        { id: 1, name: '南之翡翠槽', position: 'right' },
        { id: 2, name: '西之水晶槽', position: 'bottom' },
        { id: 3, name: '北之琥珀槽', position: 'left', hidden: true }
      ],
      theme: 'purple'
    }
  }
};

module.exports = games;
