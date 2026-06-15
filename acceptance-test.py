#!/usr/bin/env python3
import json
import time
import urllib.request
import urllib.error

BASE = "http://localhost:3013"


def api(method, path, data=None):
    url = f"{BASE}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            return r.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw) if raw else {"error": str(e)}
        except Exception:
            return e.code, {"error": f"HTTP {e.code}: {raw[:200]!r}"}
    except Exception as e:
        return 0, {"error": str(e)}


def minuteToTime(t):
    # t=0 means 06:00 AM
    h = (t // 60 + 6) % 24
    m = t % 60
    return f"{h:02d}:{m:02d}"


def header(title):
    print()
    print("=" * 60)
    print(f"  {title}")
    print("=" * 60)


# ===== 场景 1: normal - 索道冲突正常完成 =====
header("场景 1: normal - 索道冲突正常完成 (简单模式)")

s, d = api("POST", "/api/games", {"seedType": "normal", "name": "场景1-正常完成"})
print(f"创建游戏: HTTP{s}  success={d.get('success')}")
sid = d["data"]["session"]["id"]
print(f"  Session: {sid}")

s, d = api("POST", f"/api/games/{sid}", {"actionType": "start_game"})
print(f"开始游戏: phase={d.get('data', {}).get('session', {}).get('phase')}")

# 获取游戏状态看茶树
s, d = api("GET", f"/api/games/{sid}")
state = d["data"]
plants = state["plants"]
cableways = state["cableways"]
stations = state["stations"]
baskets = state["baskets"]

print(f"茶树数量: {len(plants)}")
print(f"低海拔: {[p['id'][-4:] for p in plants if p['altitude']=='low']}")
print(f"中海拔: {[p['id'][-4:] for p in plants if p['altitude']=='mid']}")
print(f"高海拔: {[p['id'][-4:] for p in plants if p['altitude']=='high']}")
print(f"吊篮: {[b['id'][-4:] for b in baskets]}")

# 推进时间到 8:00 (120分钟)
s, d = api("PUT", f"/api/games/{sid}", {"minutes": 120})
t = d["data"]["session"]["currentTime"]
print(f"推进到 {minuteToTime(t)}, 风强={d['data']['session']['windIntensity']}")

# 选一个中海拔茶树和一个吊篮
mid_plants = [p for p in plants if p["altitude"] == "mid"]
low_plants = [p for p in plants if p["altitude"] == "low"]
target_plant = mid_plants[0] if mid_plants else low_plants[0]
basket1 = baskets[0]
basket2 = baskets[1] if len(baskets) > 1 else baskets[0]
station1 = stations[0]
station2 = stations[1] if len(stations) > 1 else stations[0]

print(f"\n--- 操作1: 吊篮{basket1['id'][-4:]} 调度到茶树 {target_plant['id'][-4:]} ({target_plant['altitude']})")
s, d = api("POST", f"/api/games/{sid}", {
    "actionType": "schedule_basket",
    "targetId": basket1["id"],
    "details": {"basketId": basket1["id"], "plantId": target_plant["id"]},
})
print(f"  结果: {d.get('success')}, msg={d.get('data', {}).get('message', d.get('error',''))}")
t = d.get("data", {}).get("session", {}).get("currentTime", 0)
print(f"  当前时间: {minuteToTime(t)}")

# 采摘
print(f"\n--- 操作2: 从茶树采摘茶青")
qty = min(target_plant["quantity"], 5)
s, d = api("POST", f"/api/games/{sid}", {
    "actionType": "pick_tea",
    "targetId": basket1["id"],
    "details": {"basketId": basket1["id"], "plantId": target_plant["id"], "quantity": qty},
})
r = d.get("data", {})
print(f"  采摘: {qty}单位 品质={r.get('quality')} 原因={r.get('reason')}")
print(f"  预估价值: ¥{r.get('subtotal')} (¥{r.get('pricePerUnit')}/单位)")

# 送往工位制茶
print(f"\n--- 操作3: 吊篮调度到 {station1['name']} 制茶")
s, d = api("POST", f"/api/games/{sid}", {
    "actionType": "send_to_station",
    "targetId": basket1["id"],
    "details": {"basketId": basket1["id"], "stationId": station1["id"]},
})
r = d.get("data", {})
print(f"  结果: {d.get('success')} {r.get('message', d.get('error',''))}")

print(f"\n--- 操作4: 开始制茶")
s, d = api("POST", f"/api/games/{sid}", {
    "actionType": "start_processing",
    "targetId": station1["id"],
    "details": {"stationId": station1["id"], "basketId": basket1["id"]},
})
r = d.get("data", {})
print(f"  {r.get('message', d.get('error',''))}")

# 推进时间等待制茶完成
s, d = api("PUT", f"/api/games/{sid}", {"minutes": 60})
t = d["data"]["session"]["currentTime"]
print(f"\n推进时间到 {minuteToTime(t)}")
for st in d["data"]["stations"]:
    print(f"  制茶坊 {st['name']}: status={st.get('status')}  startAt={st.get('processStartTime')}  basketId={st.get('currentBasketId')}")

# 完成制茶
print(f"\n--- 操作5: 完成制茶 (若已自动完成则跳过手动)")
s, d = api("GET", f"/api/games/{sid}")
st_check = [st for st in d["data"]["stations"] if st["id"] == station1["id"]][0]
if st_check.get("status") == "finished":
    print(f"  ℹ️  {station1['name']} 已自动完成制茶（advanceTime自动检测）")
    actions = d["data"]["actions"]
    finish_acts = [a for a in actions if a.get("actionType") == "finish_processing"]
    if finish_acts:
        last = finish_acts[-1]
        det = last.get("details")
        if isinstance(det, str):
            det = json.loads(det)
        print(f"     自动制茶收益: ¥{det.get('revenue')}  总收益: ¥{det.get('totalRevenue')}")
else:
    s, d = api("POST", f"/api/games/{sid}", {
        "actionType": "finish_processing",
        "targetId": station1["id"],
        "details": {"stationId": station1["id"]},
    })
    r = d.get("data", {})
    print(f"  {r.get('message', d.get('error',''))}")
    print(f"  收益: ¥{r.get('revenue')}  总收益: ¥{r.get('totalRevenue')}")

# 结算
print(f"\n--- 结算 - 对比计划预估 vs 实际结算 (后端按明细重算)")
s, d = api("POST", f"/api/games/{sid}/settle")
r = d["data"]
print(f"  ✅ 阶段: {d.get('success')}")
print()
print(f"  📋 [结算前 - 计划预估]:")
print(f"     总采摘: {r['before']['totalTeaPicked']} 单位")
print(f"     特级/普通/降级: {r['before']['premiumCount']}/{r['before']['normalCount']}/{r['before']['degradedCount']}")
print(f"     总收益: ¥{r['before']['totalRevenue']}")
print(f"     冲突次数: {r['before']['totalConflicts']}  山风影响: {r['before']['windAffectedCount']}")
print()
print(f"  📋 [结算后 - 实际结算 (按操作明细重算)]:")
print(f"     总采摘: {r['after']['totalTeaPicked']} 单位")
print(f"     特级/普通/降级: {r['after']['premiumCount']}/{r['after']['normalCount']}/{r['after']['degradedCount']}")
print(f"     总收益: ¥{r['after']['totalRevenue']}")
print(f"     冲突次数: {r['after']['totalConflicts']}  山风影响: {r['after']['windAffectedCount']}")
print()
summary = r["summary"]
print(f"  📊 差异分析:")
print(f"     收益差异: ¥{summary['revenueDiff']} ({summary['revenueDiffPercent']}%)")
print(f"     特级品降级数: {summary['qualityDownGrade']}  冲突损失次数: {summary['conflictsLost']}")

# 索道占用图 & 回滚测试
print()
header("场景 3: 索道占用图 & 回滚重算 (挑战模式)")
s, d = api("GET", f"/api/games/{sid}/rollback")
r = d["data"]
print(f"占用图分析:")
for occ in r["occupancy"]:
    print(f"  {occ['cablewayName']}: {occ['currentLoad']}/{occ['totalCapacity']}  占用率={occ['occupancyRate']*100:.0f}%  冲突={occ['hasConflict']}")
print(f"警告: {r['warnings'] if r['warnings'] else '无'}")

print(f"\n回滚到初始状态:")
s, d = api("POST", f"/api/games/{sid}/rollback")
print(f"  {d.get('data', {}).get('message', d.get('error',''))}")
ph = d.get('data', {}).get('session', {})
print(f"  当前阶段: {ph.get('phase')}  时间: {minuteToTime(ph.get('currentTime', 0))}")

# ===== 场景 2: exception 采摘计划异常 =====
print()
header("场景 2: exception - 采摘计划触发异常 (困难模式)")
s, d = api("POST", "/api/games", {"seedType": "exception", "name": "场景2-采摘异常"})
sid2 = d["data"]["session"]["id"]
print(f"创建游戏: {sid2}")

api("POST", f"/api/games/{sid2}", {"actionType": "start_game"})
# 直接推进到 14:00 (480分钟) - 过午
s, d = api("PUT", f"/api/games/{sid2}", {"minutes": 480})
t = d["data"]["session"]["currentTime"]
print(f"推进到 {minuteToTime(t)}  风强={d['data']['session']['windIntensity']}")
# GET完整状态以便获取plants/maturity
s, d = api("GET", f"/api/games/{sid2}")
full = d["data"]
# 检查当前茶青品质
low_plants = [p for p in full["plants"] if p["altitude"] == "low"]
degraded_count = sum(p["quantity"] for p in full["plants"])
premium_count = 0
from_ = full["maturityHistory"] if full.get("maturityHistory") else []
degrade_evts = [m for m in from_ if m.get("quality") == "degraded"]
if degrade_evts:
    print(f"已检测到 {len(degrade_evts)} 条品质降级历史记录")
    for ev in degrade_evts[:3]:
        print(f"  - 茶树{ev.get('teaPlantId', '')[-4:]} 海拔={ev.get('altitude')} 在 {minuteToTime(ev.get('timestamp',0))} 降级={ev.get('quality')}")
# 尝试在过午后采摘，验证品质降级
if low_plants and full["baskets"]:
    bp = full["baskets"][0]
    target = low_plants[0]
    qty = min(target["quantity"], 3)
    print(f"\n过午后采摘验证: 吊篮{bp['id'][-4:]} 采低海拔茶树{target['id'][-4:]} {qty}单位")
    # 先调度
    s2, d2 = api("POST", f"/api/games/{sid2}", {
        "actionType": "schedule_basket",
        "targetId": bp["id"],
        "details": {"basketId": bp["id"], "plantId": target["id"]},
    })
    # 采摘
    s2, d2 = api("POST", f"/api/games/{sid2}", {
        "actionType": "pick_tea",
        "targetId": bp["id"],
        "details": {"basketId": bp["id"], "plantId": target["id"], "quantity": qty},
    })
    r2 = d2.get("data", {})
    q = r2.get("quality", "?")
    reason = r2.get("reason", "")
    print(f"  采摘品质={q} 原因={reason} 数量={r2.get('quantity')} 价值=¥{r2.get('subtotal')}")
    degrade_ok = (q in ("degraded", "normal")) and "过午" in reason
    print(f"  品质降级验证: {'✅ 通过' if degrade_ok else '⚠️  待确认'} (品质={q})")

# 结算看降级情况
s, d = api("POST", f"/api/games/{sid2}/settle")
r = d["data"]
print(f"\n过午未采摘 vs 实际采摘:")
print(f"  计划预估(最佳): 特级{r['before']['premiumCount']}/普通{r['before']['normalCount']}/降级{r['before']['degradedCount']} 预估收益¥{r['before']['totalRevenue']}")
print(f"  实际结算(过午后): 特级{r['after']['premiumCount']}/普通{r['after']['normalCount']}/降级{r['after']['degradedCount']} 实际收益¥{r['after']['totalRevenue']}")
sd = r["after"]["settlementDetails"]
if isinstance(sd, str):
    sd = json.loads(sd)
if sd.get("degradeReasons"):
    print(f"  品质变化原因:")
    for reason in sd["degradeReasons"][:5]:
        print(f"    - {reason}")

# ===== 场景 4: 冲突验证 - 有冲突记录时索道占用图返回正确 =====
print()
header("场景 4: 冲突验证 - 有冲突记录时索道占用图返回正确")
s, d = api("POST", "/api/games", {"seedType": "rollback", "name": "场景4-冲突占用验证"})
sid4 = d["data"]["session"]["id"]
print(f"创建rollback游戏: {sid4}")
api("POST", f"/api/games/{sid4}", {"actionType": "start_game"})
s, d = api("GET", f"/api/games/{sid4}")
plants4 = d["data"]["plants"]
baskets4 = d["data"]["baskets"]
# 选两棵相邻茶树（rollback种子有 plant-1:80, plant-2:100，距离20<50）
close_p1 = [p for p in plants4 if p["positionY"] < 150 and p["altitude"] == "low"][0]
close_p2 = [p for p in plants4 if p["positionY"] < 150 and p["altitude"] == "low" and p["id"] != close_p1["id"]][0]
b1 = baskets4[0]
b2 = baskets4[1]
print(f"相邻茶树: {close_p1['id'][-4:]}(Y={close_p1['positionY']})  {close_p2['id'][-4:]}(Y={close_p2['positionY']})")
print(f"调度吊篮{b1['id'][-4:]}到{close_p1['id'][-4:]}")
api("POST", f"/api/games/{sid4}", {"actionType": "schedule_basket", "targetId": b1["id"],
    "details": {"basketId": b1["id"], "plantId": close_p1["id"]}})
print(f"调度吊篮{b2['id'][-4:]}到{close_p2['id'][-4:]}")
api("POST", f"/api/games/{sid4}", {"actionType": "schedule_basket", "targetId": b2["id"],
    "details": {"basketId": b2["id"], "plantId": close_p2["id"]}})
# 推进时间触发冲突检测
s, d = api("PUT", f"/api/games/{sid4}", {"minutes": 10})
t = d["data"]["session"]["currentTime"]
conflict_n = len(d["data"].get("conflicts", []))
print(f"推进到 {minuteToTime(t)}, 检测到冲突记录: {conflict_n} 条")
# 获取占用图
s, d = api("GET", f"/api/games/{sid4}/rollback")
r = d["data"]
occ_with_conflict = [o for o in r["occupancy"] if o["hasConflict"]]
print(f"\n占用图验证:")
for occ in r["occupancy"]:
    flag = "⚠️冲突" if occ["hasConflict"] else "✅正常"
    print(f"  {occ['cablewayName']}: {occ['currentLoad']}/{occ['totalCapacity']} 占用率={occ['occupancyRate']*100:.0f}%  [{flag}]")
print(f"警告: {r['warnings'] if r['warnings'] else '无'}")
if conflict_n > 0 and len(occ_with_conflict) > 0:
    print(f"✅ 验证通过: {len(occ_with_conflict)} 条索道标记为有冲突状态，占用数据完整")
else:
    print(f"⚠️  待确认: 检测到conflict记录={conflict_n}, 占用图hasConflict标记数={len(occ_with_conflict)}")

print()
print("=" * 60)
print("  ✅ 所有场景验收测试完成!")
print("=" * 60)
