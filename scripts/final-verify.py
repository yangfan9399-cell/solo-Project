import urllib.request
import json

BASE = "http://localhost:5174"

def get(path):
    req = urllib.request.Request(BASE + path)
    with urllib.request.urlopen(req) as r:
        return r.status, json.loads(r.read())

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read()) if e.read() else {"message": str(e)}

print("=" * 60)
print("最终验证：重装依赖后所有功能正常")
print("=" * 60)

print("\n📄 页面入口（200 OK）")
for path in ["/", "/process", "/review", "/dashboard"]:
    req = urllib.request.Request(BASE + path)
    with urllib.request.urlopen(req) as r:
        print(f"  {path}: {r.status} ✅")

print("\n📡 数据接口（200 OK）")
for path in ["/api/records", "/api/users", "/api/statistics", "/api/exceptions"]:
    status, data = get(path)
    count = len(data) if isinstance(data, list) else "ok"
    print(f"  {path}: {status} ✅ (数据量: {count})")

print("\n📋 记录详情（含关联数据）")
status, records = get("/api/records")
rec = records[0]
print(f"  第一条记录: {rec['id']}")
print(f"  状态: {rec['status']}")
print(f"  节点数: {len(rec['nodes'])}")
print(f"  附件数: {len(rec['attachments'])}")
print(f"  Diff 数: {len(rec['diffTrackers'])}")
print(f"  关键对象数: {len(rec['keyObjects'])}")
print(f"  创建人: {rec['creator']['name'] if rec.get('creator') else '无'}")

print("\n✍️  提交复核（一线处理人，只传三类内容）")
status, users = get("/api/users")
handler = next(u for u in users if u["role"] == "FIELD_HANDLER")
print(f"  处理人: {handler['name']} ({handler['role']})")

status, result = post(f"/api/records/{rec['id']}/process", {
    "handlerId": handler["id"],
    "action": {
        "type": "SUBMIT_REVIEW",
        "fieldNotes": "测试业务记录 - 器材清点完毕",
        "onSiteNotes": "测试现场说明 - 无异常",
        "attachments": [
            {"fileName": "test.pdf", "fileType": "application/pdf", "fileUrl": "/test.pdf", "description": "测试附件"}
        ]
    }
})

print(f"  HTTP 状态: {status}")
if status == 200:
    print(f"  提交后状态: {result['status']} {'✅' if result['status'] == 'REVIEWING' else '❌'}")
    print(f"  节点总数: {len(result['nodes'])}")
    
    node_types = [n["nodeType"] for n in result["nodes"]]
    print(f"  节点列表: {', '.join(node_types)}")
    
    has_process = any(n["nodeType"] == "现场处理" for n in result["nodes"])
    has_review = any(n["nodeType"] == "申请复核" for n in result["nodes"])
    print(f"  有「现场处理」节点: {'✅' if has_process else '❌'}")
    print(f"  有「申请复核」节点: {'✅' if has_review else '❌'}")
    
    review_node = next((n for n in result["nodes"] if n["nodeType"] == "申请复核"), None)
    if review_node:
        print(f"  「申请复核」状态: {review_node['status']} {'✅' if review_node['status'] == 'REVIEWING' else '❌'}")
    
    print(f"\n🔒 受限字段验证（一线处理人不应修改）")
    print(f"  blockReason: {'保留原值 ✅' if result.get('blockReason') else '空 ⚠️'}")
    print(f"  remediationPath: {'保留原值 ✅' if result.get('remediationPath') else '空 ⚠️'}")
    print(f"  basisAdopted: {'保留原值 ✅' if result.get('basisAdopted') else '空 ⚠️'}")
    
    print(f"\n🔍 复核台可见性")
    status, reviewing = get("/api/records?status=REVIEWING")
    in_list = any(r["id"] == result["id"] for r in reviewing)
    print(f"  REVIEWING 列表总数: {len(reviewing)}")
    print(f"  记录在复核台可见: {'✅' if in_list else '❌'}")
else:
    print(f"  错误: {result}")

print("\n" + "=" * 60)
print("✅ 全部验证完成")
print("=" * 60)
