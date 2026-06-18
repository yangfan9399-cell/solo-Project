const initField = {trackSwitchValue:0,translationSlot:3,overwriteMark:2,siRisk:0,shenReward:0,wuFailFactor:1};
const path = [[0,4],[1,4],[2,4],[3,4],[4,4],[4,3],[4,2],[4,1],[4,0]];
const steps = [];
for (let i = 1; i < path.length; i++) {
  const [fx, fy] = path[i - 1];
  const [tx, ty] = path[i];
  steps.push({
    stepIndex: i - 1,
    positionFrom: { x: fx, y: fy },
    positionTo: { x: tx, y: ty },
  });
}
process.stdout.write(JSON.stringify({ levelId: 'si', steps, initialField: initField }));
