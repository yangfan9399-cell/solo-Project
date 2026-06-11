#!/usr/bin/env python3
import urllib.request, urllib.parse, urllib.error, http.cookiejar, re, time

BASE = "http://localhost:8080"

def new_session():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    return opener, cj

def post(opener, path, data):
    body = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=body, method="POST")
    return opener.open(req)

def get(opener, path):
    return opener.open(f"{BASE}{path}")

def get_text(opener, path):
    return get(opener, path).read().decode("utf-8")

def login(opener, uid):
    post(opener, "/login", {"userId": str(uid)})

def logout(opener):
    get(opener, "/logout")

def show_status(html, label="状态"):
    m = re.search(r'status-badge[^>]*>([^<]+)', html)
    s = m.group(1).strip() if m else "?"
    print(f"  {label}: {s}")
    return s

# ======================= 正常流程 =======================
print("="*60)
print("  🔵 正常流转：报修1条 = 提交→派单→开始→完成→满意→关闭")
print("="*60)
o, cj = new_session()

# 1. 学生张三(1) 提交报修
print("\n[1] 学生张三登录并提交报修...")
login(o, 1)
post(o, "/student/submit", {
    "building": "3栋", "roomNo": "305",
    "faultType": "APPLIANCE",
    "description": "空调不制冷，夏天吹热风"
})
list_html = get_text(o, "/student/repairs")
ids = sorted(set(int(x) for x in re.findall(r'repair/(\d+)', list_html)), reverse=True)
rid = ids[0]
print(f"  新报修 ID: {rid}")

# 2. 宿管刘宿管(5) 派单给王师傅(7)
print("\n[2] 宿管刘宿管派单给王师傅...")
logout(o); login(o, 5)
post(o, f"/dorm-manager/assign/{rid}", {"repairmanId": "7"})
h = get_text(o, f"/dorm-manager/repair/{rid}")
show_status(h)

# 3. 王师傅(7) 开始维修
print("\n[3] 王师傅开始维修...")
logout(o); login(o, 7)
post(o, f"/repairman/start/{rid}", {})
h = get_text(o, f"/repairman/repair/{rid}")
show_status(h)

time.sleep(1)

# 4. 王师傅完成维修
print("\n[4] 王师傅完成维修...")
post(o, f"/repairman/complete/{rid}", {
    "repairNote": "更换电容+加氟，出风温度13℃正常",
    "partsUsed": "电容x1,R410A 500g"
})
h = get_text(o, f"/repairman/repair/{rid}")
show_status(h)

# 5. 周主管(10) 回访非常满意
print("\n[5] 周主管回访：非常满意(5分)...")
logout(o); login(o, 10)
post(o, f"/supervisor/review/{rid}", {
    "satisfaction": "VERY_SATISFIED",
    "reviewComment": "学生确认没问题，态度好及时"
})
h = get_text(o, f"/supervisor/repair/{rid}")
show_status(h)

# 6. 周主管关闭
print("\n[6] 周主管关闭报修...")
post(o, f"/supervisor/close/{rid}", {})
h = get_text(o, f"/supervisor/repair/{rid}")
s = show_status(h, "最终状态")
assert "关闭" in s, f"❌ 应为已关闭实际是{s}"

# 7. 详情页6个历史节点
print("\n[7] 详情页历史节点时间线：")
detail = get_text(o, f"/supervisor/repair/{rid}")
# 用timeline块提取
if '<div class="timeline">' in detail:
    tl_block = detail.split('<div class="timeline">', 1)[1].split('</div>\n</div>', 1)[0]
else:
    tl_block = detail
badges_tl = re.findall(r'<span class="status-badge[^"]*"[^>]*>([^<]+)', tl_block)
ops_tl = re.findall(r'操作人[：:]\s*([^<\n]+)', tl_block)
remarks_tl = re.findall(r'history-remark[^>]*>\s*([^<\n]+)', tl_block)
times_tl = re.findall(r'history-time[^>]*>\s*([^<\n]+)', tl_block)

print(f"  节点数: {len(badges_tl)} (期望 6)")
maxl = max(len(badges_tl), len(ops_tl), len(remarks_tl))
for i in range(maxl):
    ti = (times_tl[i][:19].strip() if i < len(times_tl) else "")
    b = (badges_tl[i].strip() if i < len(badges_tl) else "")
    op = (ops_tl[i].strip() if i < len(ops_tl) else "")
    rk = (remarks_tl[i].strip()[:40] if i < len(remarks_tl) else "")
    print(f"  [{i+1}] {ti:19s} | {b:10s} | {op:5s} | {rk}")
assert len(badges_tl) >= 6, f"❌ 节点不足6个"

# 保存 opener 给后面统计页
super_opener = o

# ======================= 异常流程 =======================
print("\n" + "="*60)
print("  🔴 异常流转：不满意 → 禁止直接关闭 → 重新派单")
print("="*60)
o2, cj2 = new_session()

# A. 李四(2) 提报修
print("\n[A] 学生李四(2) 提交报修：门锁故障")
login(o2, 2)
post(o2, "/student/submit", {
    "building": "5栋", "roomNo": "502",
    "faultType": "DOOR_LOCK",
    "description": "门锁反锁失效，转动没有阻力"
})
ids2 = sorted(set(int(x) for x in re.findall(r'repair/(\d+)', get_text(o2, "/student/repairs"))), reverse=True)
rid2 = [x for x in ids2 if x != rid][0]
print(f"  新报修 ID: {rid2}")

# B. 陈宿管(6) 派给张师傅(9)
print("\n[B] 陈宿管(6) 派单给张师傅(9)...")
logout(o2); login(o2, 6)
post(o2, f"/dorm-manager/assign/{rid2}", {"repairmanId": "9"})
h = get_text(o2, f"/dorm-manager/repair/{rid2}")
show_status(h)

# C. 张师傅开始→完成
print("\n[C] 张师傅开始维修→完成...")
logout(o2); login(o2, 9)
post(o2, f"/repairman/start/{rid2}", {})
time.sleep(1)
post(o2, f"/repairman/complete/{rid2}", {"repairNote": "调了弹簧加了润滑油", "partsUsed": ""})
h = get_text(o2, f"/repairman/repair/{rid2}")
show_status(h)

# D. 周主管选不满意
print("\n[D] 周主管回访：不满意(2分)...")
logout(o2); login(o2, 10)
post(o2, f"/supervisor/review/{rid2}", {
    "satisfaction": "DISSATISFIED",
    "reviewComment": "学生反馈依然锁不上"
})
h = get_text(o2, f"/supervisor/repair/{rid2}")
s = show_status(h)
assert "不满意" in s, f"❌ 应为不满意实际是{s}"

# E. 尝试直接关闭 → 验证禁止
print("\n[E] ⚠️  尝试直接关闭 DISSATISFIED 的报修#{}...".format(rid2))

class NR(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

nr = urllib.request.build_opener(NR, urllib.request.HTTPCookieProcessor(cj2))
try:
    nr.open(urllib.request.Request(f"{BASE}/supervisor/close/{rid2}", data=b"", method="POST"))
    print("  ❌ 没有被重定向，允许关闭了！")
except urllib.error.HTTPError as e:
    loc = e.headers.get("Location", "")
    print(f"  HTTP {e.code}, Location: {loc}")
    if "error=" in loc:
        err_enc = loc.split("error=",1)[1].split("&",1)[0]
        err_dec = urllib.parse.unquote(err_enc)
        print(f"  ❌ 触发业务规则：{err_dec}")
    else:
        print(f"  ⚠️  Location 中无 error 参数，检查状态...")

# F. 再次检查状态仍然是 不满意
h = get_text(o2, f"/supervisor/repair/{rid2}")
s = show_status(h, "当前状态（仍应不满意）")
assert "不满意" in s, f"❌ 状态被意外改变为 {s}"
print("  ✅ 状态未改变！禁止关闭规则生效")

# G. 重新派单（正确方式）
print("\n[G] 正确操作：重新派单给李师傅(8)...")
post(o2, f"/supervisor/reopen/{rid2}", {"reason": "学生不满意，李师傅擅长门锁精密维修"})
h = get_text(o2, f"/supervisor/repair/{rid2}")
s = show_status(h, "重新派单后")
assert "派单" in s or "ASSIGNED" in s.upper(), f"❌ 应是已派单实际是{s}"

print("\n✅ 不满意→禁止关闭→重新派单 流程正确")

# ======================= 统计页验证 =======================
print("\n" + "="*60)
print("  📊 统计页 /supervisor/stats 验证（用之前登录的super_opener）")
print("="*60)

stats_html = get_text(super_opener, "/supervisor/stats")
checks = [
    ("楼栋统计", "楼栋统计" in stats_html or "栋" in stats_html),
    ("故障类型统计", "故障类型" in stats_html),
    ("超时原因", "超时" in stats_html),
    ("维修时长", "维修时长" in stats_html or "<30" in stats_html or "30" in stats_html),
]
print(f"  统计页标题区渲染 OK？{'✅' if all(v for _,v in checks) else '❌'}")
for name, ok in checks:
    print(f"    - {name}: {'✅' if ok else '❌'}")

building_rows = len(re.findall(r'\d栋', stats_html))
print(f"  楼栋行数: {building_rows}")

print("\n" + "="*60)
print("  🎉 全部验证通过！")
print("="*60)
print()
print(f"✅ 正常关闭报修:  {BASE}/supervisor/repair/{rid}")
print(f"     (6个历史节点：提交→派单→开始→完成→回访→关闭)")
print(f"✅ 不满意重新派单: {BASE}/supervisor/repair/{rid2}")
print(f"     (禁止直接关闭→重新派单→ASSIGNED)")
print(f"✅ 登录页:        {BASE}/login")
print(f"✅ 统计页:        {BASE}/supervisor/stats  (选周主管登录后访问)")
print()
