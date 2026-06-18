import json, urllib.request

with open("data/database.json") as f:
    db = json.load(f)
first_id = db["archives"][0]["id"]
print(f"档案ID: {first_id}")

# 1. 详情页HTTP
req = urllib.request.Request(f"http://localhost:3010/archives/{first_id}")
with urllib.request.urlopen(req) as r:
    print(f"详情页HTTP: {r.status}")

# 2. 审批通过版本
data = json.dumps({
    "versionNumber": 999,
    "batchCode": "BATCH-TEST-APPROVAL",
    "changeLog": "审批通过：参数符合规范，同意生效",
    "createdBy": "张三",
    "label": "通过",
}).encode()
req = urllib.request.Request(
    f"http://localhost:3010/api/archives/{first_id}/versions",
    data=data, headers={"Content-Type": "application/json"}, method="POST",
)
with urllib.request.urlopen(req) as r:
    v = json.load(r)
    print(f"审批版本创建 OK: v{v['versionNumber']} by={v['createdBy']} label={v.get('label','')}")

# 3. 申请提交版本
data = json.dumps({
    "versionNumber": 1000,
    "batchCode": "BATCH-TEST-APPLY",
    "changeLog": "参数变更申请：调整弦距至8.5英寸消除箭杆打臂",
    "createdBy": "李四",
    "label": "申请",
}).encode()
req = urllib.request.Request(
    f"http://localhost:3010/api/archives/{first_id}/versions",
    data=data, headers={"Content-Type": "application/json"}, method="POST",
)
with urllib.request.urlopen(req) as r:
    v = json.load(r)
    print(f"申请版本创建 OK: v{v['versionNumber']} by={v['createdBy']} label={v.get('label','')}")

# 4. 读取版本列表看标签
with urllib.request.urlopen(f"http://localhost:3010/api/archives/{first_id}/versions") as r:
    vs = json.load(r)
    labels = []
    for v in vs[:8]:
        lb = v.get("label") or v.get("createdBy")
        if lb == "审批流转": lb = "审批"
        elif not lb: lb = "—"
        labels.append(f"v{v['versionNumber']}:{lb}")
    print(f"最近8条版本: {labels}")
    print(f"版本总数: {len(vs)}")
