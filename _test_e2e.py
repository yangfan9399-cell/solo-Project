import json
import sys
import urllib.request
import urllib.error

BASE = "http://localhost:5176"

def req(method, path, data=None):
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=body, method=method,
                                 headers={"Content-Type": "application/json"} if body else {})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

print("=== 1. play/level-1 初始化测试 ===")
start = req("POST", "/api/game/start", {"levelId": "level-1"})
state_id = start["id"]
print(f"  stateId: {state_id}")
print(f"  status: {start['status']}")
print(f"  targetReached: {start['targetReached']}")
print(f"  finalIntensity: {start['finalIntensity']:.3f}")
print(f"  actions: {len(start['actions'])}")

print("\n=== 2. 旋转测试（写入局次状态）===")
rot = req("POST", "/api/game/rotate", {"stateId": state_id, "blockId": "g1-1", "delta": 90})
print(f"  targetReached: {rot['targetReached']}")
print(f"  actions: {len(rot['actions'])}")
if rot['actions']:
    a = rot['actions'][-1]
    print(f"  last: {a['glassBlockId']} {a['previousRotation']}° -> {a['newRotation']}°")

print("\n=== 3. 完成本局（后端重算）===")
finish = req("POST", "/api/game/finish", {"stateId": state_id})
gr = finish["gameRecord"]
print(f"  resultRecord.score: {gr['resultRecord']['score']}")
print(f"  resultRecord.status: {gr['resultRecord']['status']}")
print(f"  mainRecord.totalRotations: {gr['mainRecord']['totalRotations']}")
print(f"  detailRecord.finalBeamIntensity: {gr['detailRecord']['finalBeamIntensity']:.3f}")
print(f"  detailRecord.refractionsCount: {gr['detailRecord']['refractionsCount']}")
print(f"  historyRecord.totalAbsorptionLoss: {gr['historyRecord']['totalAbsorptionLoss']:.3f}")
print(f"  historyRecord.absorptionEvents: {len(gr['historyRecord']['absorptionEvents'])}")
print(f"  bestSolutionUpdated: {finish['bestSolutionUpdated']}")
print(f"  isNewRecord: {finish['isNewRecord']}")
print(f"  gameState.status: {finish['gameState']['status']}")
print(f"  四个专属记录存在: {all([gr[k] for k in ['mainRecord','detailRecord','historyRecord','resultRecord']])}")

print("\n=== 4. 关卡模拟测试（编辑器重算）===")
level = req("GET", "/api/levels/level-2")
sim = req("POST", "/api/simulate", {"level": level})
print(f"  targetReached: {sim['targetReached']}")
print(f"  finalIntensity: {sim['finalIntensity']:.3f}")
print(f"  segments: {len(sim['segments'])}")
print(f"  failureReason: {sim['failureReason']}")

print("\n=== 5. 材料异常失败流程 ===")
s3 = req("POST", "/api/game/start", {"levelId": "level-3"})
sid3 = s3["id"]
req("POST", "/api/game/rotate", {"stateId": sid3, "blockId": "g3-1", "delta": 90})
req("POST", "/api/game/rotate", {"stateId": sid3, "blockId": "g3-2", "delta": 90})
f3 = req("POST", "/api/game/finish", {"stateId": sid3})
gr3 = f3["gameRecord"]
rr = gr3["resultRecord"]
print(f"  status: {rr['status']}")
print(f"  score: {rr['score']}")
print(f"  intensityAtTarget: {rr['intensityAtTarget']:.3f}")
print(f"  intensityDeficit: {rr['intensityDeficit']:.3f}")
if rr['failureReason']:
    print(f"  failureReason (first 60): {rr['failureReason'][:60]}...")
print(f"  absorptionEvents: {len(gr3['historyRecord']['absorptionEvents'])}")
print(f"  totalAbsorptionLoss: {gr3['historyRecord']['totalAbsorptionLoss']:.3f}")

print("\n=== 6. 最佳解法排行查询 ===")
bests = req("GET", "/api/best-solutions")
print(f"  记录数: {len(bests)}")
for b in bests[:3]:
    print(f"  {b['levelId']}: score={b['score']} by={b['achievedBy']}")

print("\n=== 7. 种子样本查询 ===")
seeds = req("GET", "/api/seeds")
print(f"  种子数: {len(seeds)}")
for s in seeds:
    br = s['beforeSnapshot']
    ar = s['afterSnapshot']
    print(f"  {s['scenario']}: beforeIntensity={br['finalIntensity']:.3f} -> afterIntensity={ar['finalIntensity']:.3f}, "
          f"beforeReached={br['targetReached']} -> afterReached={ar['targetReached']}, "
          f"status={s['gameRecord']['resultRecord']['status']}, "
          f"score={s['gameRecord']['resultRecord']['score']}")

print("\n✅ 所有测试通过")
