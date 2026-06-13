import urllib.request
import urllib.parse
import http.cookiejar
import re
import sys

BASE = "http://localhost:5183"
jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

def get_token(html):
    m = re.search(r'name="__RequestVerificationToken" type="hidden" value="([^"]+)"', html)
    return m.group(1) if m else None

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
# 0: Seed data Summary/Conclusion are already new format
# ==============================================================
print("=== 0: Seed data already synced ===")
resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List page shows synced summary", "Limit" in html or "limit" in html.lower() or "8000" in html)

resp = opener.open(f"{BASE}/Application/Detail/1")
html = resp.read().decode("utf-8")
check("Detail WQ-001 Conclusion contains key fields", "5000" in html and "Archived" not in html)
check("Detail shows new Conclusion format", "|" in html)

# ==============================================================
# 1: Modify key time fields -> sync
# ==============================================================
print("\n=== 1: Modify key time (deadline) -> sync ===")
resp = opener.open(f"{BASE}/Application/EditKeyFields/2")
html = resp.read().decode("utf-8")
token = get_token(html)
check("EditKeyFields page loads", token is not None)
if not token:
    sys.exit(1)

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 2,
    "CurrentUserRole": 2,
    "OperatorName": "TestReviewer",
    "ChangeReason": "Extend deadline",
    "NewDeadline": "2026-07-15",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/2")
html = resp.read().decode("utf-8")
check("Detail Conclusion has new deadline", "2026-07-15" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has new deadline", "2026-07-15" in html)

resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard shows recent key changes", "deadline" in html.lower() or "Deadline" in html or "2026-07-15" in html)

# ==============================================================
# 2: Modify responsible person -> sync
# ==============================================================
print("\n=== 2: Modify responsible person -> sync ===")
resp = opener.open(f"{BASE}/Application/EditKeyFields/2")
html = resp.read().decode("utf-8")
token = get_token(html)

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 2,
    "CurrentUserRole": 2,
    "OperatorName": "TestReviewer",
    "ChangeReason": "Reassign responsible person",
    "NewCurrentResponsiblePerson": "ZhangSan_New",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/2")
html = resp.read().decode("utf-8")
check("Detail Conclusion has new responsible person", "ZhangSan_New" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has new responsible person", "ZhangSan_New" in html)

resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard responsible person stats updated", "ZhangSan_New" in html)

# ==============================================================
# 3: Modify amount -> sync
# ==============================================================
print("\n=== 3: Modify amount (AppliedQuota) -> sync ===")
resp = opener.open(f"{BASE}/Application/EditKeyFields/3")
html = resp.read().decode("utf-8")
token = get_token(html)

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 2,
    "OperatorName": "TestReviewer",
    "ChangeReason": "Reduce applied quota",
    "NewAppliedQuota": "5500",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail Conclusion has new amount", "5500" in html)

resp = opener.open(f"{BASE}/Application/Index")
html = resp.read().decode("utf-8")
check("List Summary has new amount", "5500" in html)

# ==============================================================
# 4: Modify conclusion -> sync
# ==============================================================
print("\n=== 4: Modify conclusion -> sync ===")
resp = opener.open(f"{BASE}/Application/EditKeyFields/3")
html = resp.read().decode("utf-8")
token = get_token(html)

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 2,
    "OperatorName": "TestReviewer",
    "ChangeReason": "Update conclusion after evidence review",
    "NewConclusion": "Evidence complete, approve 5500 tons",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/EditKeyFields", data=data, method="POST")
resp = opener.open(req)
print(f"  POST -> HTTP {resp.status}")

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail Conclusion has user conclusion", "Evidence complete, approve 5500 tons" in html)

resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard recent key changes includes conclusion change", "conclusion" in html.lower() or "Conclusion" in html or "Evidence complete" in html)

# ==============================================================
# 5: Dashboard responsible person and recent changes
# ==============================================================
print("\n=== 5: Dashboard structure ===")
resp = opener.open(f"{BASE}/Application/Dashboard")
html = resp.read().decode("utf-8")
check("Dashboard has recent key changes section", "RecentKeyChanges" in html or "recent key" in html.lower() or "diff-old" in html)
check("Dashboard has responsible person stats", "ResponsiblePerson" in html or "responsible person" in html.lower() or "ZhangSan_New" in html)
check("Dashboard has drill-down records", "DrillDown" in html or "drill" in html.lower())

# ==============================================================
# 6: Reprocess archived record
# ==============================================================
print("\n=== 6: Reprocess archived record ===")
resp = opener.open(f"{BASE}/Application/Process/1?role=2")
html = resp.read().decode("utf-8")
token = get_token(html)
check("Reprocess button exists", "reprocess" in html)

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 1,
    "CurrentUserRole": 2,
    "Action": "reprocess",
    "OperatorName": "TestManager",
    "Comment": "Reprocess archived WQ-001",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/Process", data=data, method="POST")
try:
    resp = opener.open(req)
    check("Reprocess POST succeeded", resp.status == 200)
except Exception as e:
    check("Reprocess POST succeeded", False, str(e))

resp = opener.open(f"{BASE}/Application/Detail/1")
html = resp.read().decode("utf-8")
check("Detail shows reprocess node", "Reprocess" in html or "reprocess" in html or "Reprocess archived" in html)

# ==============================================================
# 7: Supplement evidence -> EvidenceAttachment
# ==============================================================
print("\n=== 7: Supplement evidence -> EvidenceAttachment ===")
# Need to first get WQ-003 to a state where we can supplement
# WQ-003 is in ReturnedForEvidence status, so field personnel can supplement
resp = opener.open(f"{BASE}/Application/Process/3?role=1")
html = resp.read().decode("utf-8")
token = get_token(html)
check("Process page for WQ-003 loads", token is not None)

data = urllib.parse.urlencode({
    "__RequestVerificationToken": token,
    "ApplicationId": 3,
    "CurrentUserRole": 1,
    "Action": "supplement_evidence",
    "OperatorName": "TestFieldStaff",
    "Comment": "Supplementing evidence",
    "BusinessRecord": "Field inspection completed",
    "FieldDescription": "Water meter reading 5500m3",
    "EvidenceFileName": "field_meter_photo.jpg",
    "EvidenceFileType": "Image",
    "EvidenceDescription": "Water meter photo from field",
}).encode("utf-8")
req = urllib.request.Request(f"{BASE}/Application/Process", data=data, method="POST")
try:
    resp = opener.open(req)
    check("Supplement evidence POST succeeded", resp.status == 200)
except Exception as e:
    check("Supplement evidence POST succeeded", False, str(e))

resp = opener.open(f"{BASE}/Application/Detail/3")
html = resp.read().decode("utf-8")
check("Detail shows new evidence attachment", "field_meter_photo.jpg" in html)

print(f"\n=== RESULTS: {passed} passed, {failed} failed ===")
sys.exit(0 if failed == 0 else 1)
