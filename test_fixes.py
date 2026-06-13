import urllib.request
import urllib.parse
import http.cookiejar
import re

BASE = "http://localhost:5183"
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def get_token(html):
    m = re.search(r'name="__RequestVerificationToken" type="hidden" value="([^"]+)"', html)
    return m.group(1) if m else None

# ==============================================================
# 修复1测试：归档记录 WQ-2026-001（id=1）能否重新处理
# ==============================================================
print("=== 修复1: 归档记录重新处理 ===")
resp = opener.open(f"{BASE}/Application/Process/1?role=2")
html = resp.read().decode("utf-8")
assert "重新处理（生成新节点）" in html, "未找到重新处理按钮"
token = get_token(html)
assert token, "未获取到 CSRF Token"

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 1,
    "CurrentUserRole": 2,
    "Action": "reprocess",
    "OperatorName": "测试主管",
    "Comment": "测试重新处理归档记录"
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/Process", data=data, method="POST")
resp = opener.open(req)
print(f"  重新处理提交 -> HTTP {resp.status}")

# 查看详情验证生成了新节点
resp = opener.open(f"{BASE}/Application/Detail/1")
html = resp.read().decode("utf-8")
assert "测试重新处理归档记录" in html, "详情中未显示新处理节点"
print("  OK 修复1验证通过: 归档记录重新处理成功，生成新节点")

# ==============================================================
# 修复2测试：现场人员补充证据是否写入 EvidenceAttachment
# ==============================================================
print("\n=== 修复2: 现场人员补充证据写入 EvidenceAttachment ===")
resp = opener.open(f"{BASE}/Application/Process/3?role=1")
html = resp.read().decode("utf-8")
token = get_token(html)
assert token, "未获取到 CSRF Token"

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 1,
    "Action": "supplement_evidence",
    "OperatorName": "测试现场人员",
    "Comment": "补充现场照片证据",
    "BusinessRecord": "现场检测水压正常",
    "FieldDescription": "水表读数 202400 m3",
    "EvidenceFileName": "现场水表读数_20250703.jpg",
    "EvidenceFileType": "Image",
    "EvidenceDescription": "2025年7月3日现场水表拍照"
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/Process", data=data, method="POST")
resp = opener.open(req)
print(f"  补充证据提交 -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
assert "现场水表读数_20250703.jpg" in html, "EvidenceAttachment 未写入详情展示"
assert "测试现场人员" in html, "操作人未记录"
print("  OK 修复2验证通过: 证据附件已写入 EvidenceAttachment 并展示")

# ==============================================================
# 修复3测试：关键字段修改是否同步更新列表/详情/看板
# ==============================================================
print("\n=== 修复3: 关键字段修改同步列表摘要/详情结论/看板统计 ===")
resp = opener.open(f"{BASE}/Application/EditKeyFields/2")
html = resp.read().decode("utf-8")
assert "同步影响" in html, "关键字段编辑页缺失同步说明"
token = get_token(html)
assert token, "未获取到 CSRF Token"

resp = opener.open(f"{BASE}/Application/Index")
html_before = resp.read().decode("utf-8")
resp = opener.open(f"{BASE}/Application/Dashboard")
dash_before = resp.read().decode("utf-8")

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 2,
    "CurrentUserRole": 2,
    "OperatorName": "测试主管",
    "Comment": "修改审批指标和责任人，验证同步",
    "NewAppliedQuota": "9500",
    "NewApprovedQuota": "7000",
    "NewCurrentResponsiblePerson": "测试新责任人张三",
    "NewConclusion": "经复核，同意审批7000吨月"
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  关键字段修改提交 -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Index")
html_after = resp.read().decode("utf-8")
assert "7000" in html_after, "列表摘要未同步新审批指标"
assert "测试新责任人张三" in html_after, "列表摘要未同步新责任人"
print("  OK 列表摘要已同步关键字段变更")

resp = opener.open(f"{BASE}/Application/Detail/2")
html_detail = resp.read().decode("utf-8")
assert "经复核，同意审批7000吨月" in html_detail, "详情结论未同步"
assert "测试新责任人张三" in html_detail, "详情责任人未同步"
print("  OK 详情结论已同步关键字段变更")

resp = opener.open(f"{BASE}/Application/Dashboard")
dash_after = resp.read().decode("utf-8")
assert dash_after != dash_before, "看板统计未同步变化"
print("  OK 看板统计已同步变化")

print("\n=== 三项修复全部验证通过! ===")
