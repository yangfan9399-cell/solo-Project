var SESSIONS = {
    ren: { initialState: { unlockValue:10, unlockSlot:3, traceMark:0, renRisk:5, dingReward:3, maoFailure:0 } },
    ding: { initialState: { unlockValue:5, unlockSlot:1, traceMark:0, renRisk:8, dingReward:1, maoFailure:2 } },
    mao: { initialState: { unlockValue:15, unlockSlot:2, traceMark:0, renRisk:10, dingReward:2, maoFailure:5 } }
};

var EVENTS = {
    mao: [
        { id:'mao_e1', cost:{unlockSlot:1}, effect:{unlockValue:5,maoFailure:2} },
        { id:'mao_e2', cost:{unlockSlot:1,maoFailure:1}, effect:{traceMark:3} },
        { id:'mao_e3', cost:{renRisk:2}, effect:{maoFailure:3,unlockValue:3} },
        { id:'mao_e4', cost:{traceMark:2}, effect:{dingReward:3,maoFailure:1} },
        { id:'mao_e5', cost:{unlockValue:1,renRisk:1}, effect:{maoFailure:2,traceMark:2} },
        { id:'mao_e6', cost:{traceMark:2,maoFailure:2,unlockSlot:1}, effect:{unlockValue:12,dingReward:2} },
        { id:'mao_e7', cost:{maoFailure:1,renRisk:1,dingReward:1}, effect:{traceMark:4,unlockValue:5} },
        { id:'mao_e8', cost:{maoFailure:1}, effect:{unlockValue:4} },
        { id:'mao_e9', cost:{dingReward:1}, effect:{unlockSlot:1,maoFailure:1} }
    ]
};

function apply(state, eventId) {
    var ev = EVENTS.mao.find(function(e){ return e.id === eventId; });
    if (!ev) return null;
    var ns = Object.assign({}, state);
    for (var k in ev.cost) { ns[k] = (ns[k]||0) - ev.cost[k]; if(ns[k]<0) ns[k]=0; }
    for (var k2 in ev.effect) { ns[k2] = (ns[k2]||0) + ev.effect[k2]; if(ns[k2]<0) ns[k2]=0; }
    return ns;
}

function canApply(state, eventId) {
    var ev = EVENTS.mao.find(function(e){ return e.id === eventId; });
    if (!ev) return false;
    for (var k in ev.cost) { if ((state[k]||0) < ev.cost[k]) return false; }
    return true;
}

var path = ['mao_e7','mao_e5','mao_e5','mao_e3','mao_e3','mao_e9','mao_e1','mao_e3','mao_e8','mao_e8','mao_e8','mao_e8'];
var s = Object.assign({}, SESSIONS.mao.initialState);
var step = 0;
var valid = true;

console.log('=== 卯局可达性验证 ===');
console.log('初始:', JSON.stringify(s));

for (var i = 0; i < path.length; i++) {
    if (!canApply(s, path[i])) {
        console.log('第' + (i+1) + '步 ' + path[i] + ' 不可用! 当前状态:', JSON.stringify(s));
        valid = false;
        break;
    }
    s = apply(s, path[i]);
    step++;
    console.log('步骤' + step + ' ' + path[i] + ': UV=' + s.unlockValue + ' TM=' + s.traceMark + ' MF=' + s.maoFailure + ' RR=' + s.renRisk + ' DR=' + s.dingReward + ' US=' + s.unlockSlot);
}

if (valid) {
    var win = s.unlockValue >= 45 && s.traceMark >= 8 && s.maoFailure >= 15 && s.maoFailure <= 20;
    var lose = s.maoFailure > 25 || s.renRisk >= 40 || step > 30;
    console.log('');
    console.log('=== 结果 ===');
    console.log('UV=' + s.unlockValue + ' (需>=45): ' + (s.unlockValue >= 45 ? 'PASS' : 'FAIL'));
    console.log('TM=' + s.traceMark + ' (需>=8): ' + (s.traceMark >= 8 ? 'PASS' : 'FAIL'));
    console.log('MF=' + s.maoFailure + ' (需15~20): ' + (s.maoFailure >= 15 && s.maoFailure <= 20 ? 'PASS' : 'FAIL'));
    console.log('RR=' + s.renRisk + ' (需<40): ' + (s.renRisk < 40 ? 'PASS' : 'FAIL'));
    console.log('总步数=' + step + ' (需<=30): ' + (step <= 30 ? 'PASS' : 'FAIL'));
    console.log('胜利: ' + (win ? 'YES' : 'NO'));
    console.log('失败: ' + (lose ? 'YES' : 'NO'));
}
