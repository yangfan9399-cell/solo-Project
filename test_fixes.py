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
# 0: List Summary column now has ReviewerComment
# ==============================================================
print("=== 0: List Summary has ReviewerComment ===")
resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary (Summary column, not Conclusion) has ReviewerComment", "Overlimit confirmed by field inspection" in html)

# ==============================================================
# 1: All 4 key field types -> Summary, Conclusion, Drill Dashboard all sync
# ==============================================================
print("\n=== 1: Key Time modification sync ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/4")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 4,
    "CurrentUserRole": 2,
    "OperatorName": "TestOperator",
    "ChangeReason": "Update deadline",
    "NewDeadline": "2026-12-01",
    "NewConclusion": "Urgent time sensitive approval needed",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has deadline", "2026-12-01" in html)
check("List Summary has ReviewerComment", "Urgent time sensitive approval needed" in html)

resp = opener.open(f"{BASE}/Application/Detail/4")
html = resp.read().decode("utf-8")
check("Detail Conclusion has deadline", "2026-12-01" in html)
check("Detail ReviewerComment exists", "Urgent time sensitive approval needed" in html)

print("\n=== 2: Responsible Person sync ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/4")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 4,
    "CurrentUserRole": 2,
    "OperatorName": "TestOperator",
    "ChangeReason": "Reassign",
    "NewCurrentResponsiblePerson": "ZhaoLiu_Manager",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has new responsible person", "ZhaoLiu_Manager" in html)
check("List Summary ReviewerComment preserved", "Urgent time sensitive approval needed" in html)

resp = opener.open(f"{BASE}/Application/Detail/4")
html = resp.read().decode("utf-8")
check("Detail Conclusion has new responsible", "ZhaoLiu_Manager" in html)
check("Detail ReviewerComment preserved", "Urgent time sensitive approval needed" in html)

resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard responsible person row has drill link", "reviewer_ZhaoLiu_Manager" in html)

print("\n=== 3: Amount sync ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/4")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 4,
    "CurrentUserRole": 2,
    "OperatorName": "TestOperator",
    "ChangeReason": "Adjust quota",
    "NewAppliedQuota": "9200",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has new amount", "9200" in html)
check("List Summary ReviewerComment preserved", "Urgent time sensitive approval needed" in html)

resp = opener.open(f"{BASE}/Application/Detail/4")
html = resp.read().decode("utf-8")
check("Detail Conclusion has new amount", "9200" in html)

print("\n=== 4: Conclusion (ReviewerComment) sync ===")
token, _ = get_token(f"{BASE}/Application/EditKeyFields/4")
data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 4,
    "CurrentUserRole": 2,
    "OperatorName": "TestOperator",
    "ChangeReason": "Update review conclusion",
    "NewConclusion": "Final approval granted after time extension",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has new ReviewerComment", "Final approval granted after time extension" in html)
check("List Summary previous comment cleared", "Urgent time sensitive approval needed" not in html)

resp = opener.open(f"{BASE}/Application/Detail/4")
html = resp.read().decode("utf-8")
check("Detail has new ReviewerComment", "Final approval granted after time extension" in html)

print("\n=== 5: Dashboard drill-downs work ===")
resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard has drill link to conclusion type", "conclusion_" in html)
check("Dashboard has drill link to field change", "field_" in html)
check("Dashboard has drill link to reviewer", "reviewer_" in html)
check("Dashboard conclusion distribution visible", "ConclusionDistribution" in html or "结论分布" in html)
check("Dashboard field frequency visible", "变更频次" in html or "频次" in html)

resp = opener.open(f"{BASE}/Application/Dashboard?drill=reviewer_ZhaoLiu_Manager")
html = resp.read().decode("utf-8")
check("Reviewer drill shows label", "ZhaoLiu_Manager" in html)
check("Reviewer drill shows matching apps", "WQ-2026-004" in html)

resp = opener.open(f"{BASE}/Application/Dashboard?drill=field_CurrentResponsiblePerson")
html = resp.read().decode("utf-8")
check("Field drill shows label", "CurrentResponsiblePerson" in html or "当前责任人" in html)

resp = opener.open(f"{BASE}/Application/Dashboard?drill=conclusion_%E5%B7%B2%E9%98%BB%E6%96%AD")
html = resp.read().decode("utf-8")
check("Conclusion type drill shows label", "已阻断" in html or "阻断" in html)

print(f"\n=== RESULTS: {passed} passed, {failed} failed ===")
sys.exit(0 if failed == 0 else 1)
