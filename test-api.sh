#!/bin/bash
set -e

BASE="http://localhost:3002"

echo "=== 1. 获取第一个玩家 ==="
PLAYER_ID=$(curl -s $BASE/api/players | python3 -c "import sys,json; print(json.load(sys.stdin)['players'][0]['id'])")
echo "玩家ID: $PLAYER_ID"
echo ""

echo "=== 2. 创建新局次 ==="
SESSION=$(curl -s -X POST -d "intent=create&playerId=$PLAYER_ID&levelId=level-1" $BASE/api/sessions)
echo "$SESSION" | python3 -c "
import sys, json
d = json.load(sys.stdin)['session']
print(f'局次ID: {d[\"id\"]}')
print(f'状态: {d[\"status\"]}')
print(f'分数: {d[\"score\"]}')
print(f'展品数: {len(d[\"exhibits\"])}')
print(f'灯光数: {len(d[\"lights\"])}')
"
SESSION_ID=$(echo "$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin)['session']['id'])")
echo ""

echo "=== 3. 后端评分计算 (空状态) ==="
SCORE=$(curl -s -X POST -d "sessionId=$SESSION_ID&exhibits=[]&lights=[]" $BASE/api/score)
echo "$SCORE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d['score']
print(f'总分: {s[\"total\"]}')
print(f'  展品安全: {s[\"exhibitSafety\"]}')
print(f'  灯光效率: {s[\"lightEfficiency\"]}')
print(f'  路径可见: {s[\"pathVisibility\"]}')
print(f'  布局质量: {s[\"placementQuality\"]}')
print(f'  扣分: {s[\"penalty\"]}')
print(f'目标分: {d[\"targetScore\"]}')
"
echo ""

echo "=== 4. 应用操作(放置展品和灯光) ==="
EXHIBITS='[{"id":"e1","defId":"paint-mona","x":2,"y":0}]'
LIGHTS='[{"id":"l1","x":3,"y":1,"intensity":50,"radius":3}]'
OP_DATA='{"exhibitId":"e1","defId":"paint-mona","x":2,"y":0}'
curl -s -X POST \
  --data-urlencode "intent=apply" \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "opType=place_exhibit" \
  --data-urlencode "exhibits=$EXHIBITS" \
  --data-urlencode "lights=$LIGHTS" \
  --data-urlencode "opData=$OP_DATA" \
  $BASE/api/sessions
echo ""
echo ""

echo "=== 5. 带展品的后端评分 ==="
SCORE2=$(curl -s -X POST \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "exhibits=$EXHIBITS" \
  --data-urlencode "lights=$LIGHTS" \
  $BASE/api/score)
echo "$SCORE2" | python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d['score']
print(f'总分: {s[\"total\"]}')
print(f'  展品安全: {s[\"exhibitSafety\"]}')
print(f'  灯光效率: {s[\"lightEfficiency\"]}')
print(f'  路径可见: {s[\"pathVisibility\"]}')
print(f'  布局质量: {s[\"placementQuality\"]}')
print(f'  扣分: {s[\"penalty\"]}')
print(f'展品详情数: {len(d[\"exhibitDetails\"])}')
for e in d['exhibitDetails']:
    print(f'  展品 {e[\"defId\"]}: 光照={e[\"lightLevel\"]}, 安全={e[\"safe\"]}, 安全分={e[\"safetyScore\"]}')
"
echo ""

echo "=== 6. 操作历史 ==="
curl -s "$BASE/api/sessions?id=$SESSION_ID&ops=1" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'操作数: {len(d[\"operations\"])}')
for op in d['operations']:
    print(f'  {op[\"type\"]}')
"
echo ""

echo "=== 7. 通关结算 ==="
curl -s -X POST -d "intent=complete&sessionId=$SESSION_ID&status=completed&score=75" $BASE/api/sessions
echo ""
echo ""

echo "=== 8. 验证局次状态 ==="
curl -s "$BASE/api/sessions?id=$SESSION_ID" | python3 -c "
import sys, json
d = json.load(sys.stdin)['session']
print(f'状态: {d[\"status\"]}')
print(f'分数: {d[\"score\"]}')
print(f'完成时间存在: {d[\"completedAt\"] is not None}')
"
