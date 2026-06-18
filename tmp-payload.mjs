const steps = [];
const path = [[0,4],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0]];
const initField = {trackSwitchValue:5,translationSlot:3,overwriteMark:2,siRisk:0,shenReward:0,wuFailFactor:1};
path.forEach(([x,y],i) => steps.push({stepIndex:i, position:{x,y}}));
process.stdout.write(JSON.stringify({levelId:'si', steps, initialField:initField}));
