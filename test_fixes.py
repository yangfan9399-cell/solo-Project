import urllib.request
import urllib.parse
import http.cookiejar
import re
import sys

BASE = "http://localhost:5183"
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def get_token(url):
    resp = opener.open(url)
    html = resp.read().decode("utf-8")
    m = re.search(r'name="__RequestVerificationToken" type="hidden" value="([^"]+)"', html)
    return m.group(1) if m else None, html

passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  OK {name}")
    else:
        failed += 1
        print(f"  FAIL {name}: {detail}")

# ==============================================================
# 0: Restart survival - ReviewerComment from previous test survives
# ==============================================================
print("=== 0: Restart survival ===")
resp = opener.open(f"{BASE}/Application/Detail/2")
html = resp.read().decode("utf-8")
check("ReviewerComment survived restart in detail", "Overlimit confirmed by field inspection" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("ReviewerComment visible in list conclusion column", "Overlimit confirmed by field inspection" in html)

# ==============================================================
# 1: Modify key time -> sync to list/detail/dashboard
# ==============================================================
print("\n=== 1: Key time change ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/3")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 2,
    "OperatorName": "TestManager",
    "ChangeReason": "Update deadline",
    "NewDeadline": "2026-09-30",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail conclusion has new deadline", "2026-09-30" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List conclusion has new deadline", "2026-09-30" in html)

# ==============================================================
# 2: Modify responsible person -> sync + ReviewerComment preserved
# ==============================================================
print("\n=== 2: Responsible person change ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/3")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 2,
    "OperatorName": "TestManager",
    "ChangeReason": "Reassign person",
    "NewCurrentResponsiblePerson": "WangWu_Reviewer",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail conclusion has new responsible person", "WangWu_Reviewer" in html)
check("Detail conclusion has new deadline preserved", "2026-09-30" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List conclusion has new responsible person", "WangWu_Reviewer" in html)

# ==============================================================
# 3: Modify amount -> sync + ReviewerComment preserved
# ==============================================================
print("\n=== 3: Amount change ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/3")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 2,
    "OperatorName": "TestManager",
    "ChangeReason": "Update quota",
    "NewAppliedQuota": "6000",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail conclusion has new amount", "6000" in html)
check("Detail responsible person preserved", "WangWu_Reviewer" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List conclusion has new amount", "6000" in html)

# ==============================================================
# 4: Modify conclusion -> ReviewerComment persisted, all synced
# ==============================================================
print("\n=== 4: Conclusion change ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/3")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 2,
    "OperatorName": "TestManager",
    "ChangeReason": "Update conclusion",
    "NewConclusion": "All evidence verified, approve 6000 tons per month",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail shows ReviewerComment", "All evidence verified, approve 6000 tons per month" in html)
check("Detail shows 复核意见 label", "复核意见" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List conclusion includes ReviewerComment", "All evidence verified" in html)

# ==============================================================
# 5: Dashboard shows conclusion distribution
# ==============================================================
print("\n=== 5: Dashboard ===")
resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard has conclusion distribution", "结论分布" in html)
check("Dashboard shows conclusion type counts", "含复核意见" in html)
check("Dashboard shows reviewer comment samples", "All evidence verified" in html)
check("Dashboard shows field change frequency", "频次" in html)
check("Dashboard responsible person stats", "WangWu_Reviewer" in html)

# ==============================================================
# 6: Reprocess archived still works
# ==============================================================
print("\n=== 6: Reprocess archived ===")
token, _ = get_token(f"{BASE}/Application/Process/1?role=2")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 1,
    "CurrentUserRole": 2,
    "Action": "reprocess",
    "OperatorName": "TestManager",
    "Comment": "Reprocess test",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/Process", data=data, method="POST")
try:
    resp = opener.open(req)
    check("Reprocess succeeded", resp.status == 200)
except Exception as e:
    check("Reprocess succeeded", False, str(e))

print(f"\n=== RESULTS: {passed} passed, {failed} failed ===")
sys.exit(0 if failed == 0 else 1)
