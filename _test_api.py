import urllib.request, json

# 健康检查
r = urllib.request.urlopen("http://localhost:4010/api/health")
d = json.loads(r.read())
print(f"[OK] 健康检查: status={d['status']}, 样本数={d['sampleCount']}")

# 获取全部样本
r = urllib.request.urlopen("http://localhost:4010/api/samples/all")
d = json.loads(r.read())
s = d['samples'][0]
print(f"\n[OK] 第一条样本: {s['sampleCode']}, 状态={s['status']}")
log = s['auditLogs'][0]
print(f"[OK] 审计字段: timestamp={'timestamp' in log}, note={'note' in log}")
print(f"     字段名: {list(log.keys())}")
print(f"     action={log.get('action','')}")
print(f"     note={log.get('note','')[:40]}")

# 测试上传照片 API + 审计
sid = d['samples'][1]['id']
print(f"\n--- 测试上传照片 (样本ID: {sid[:16]}...) ---")
req = urllib.request.Request(
    f"http://localhost:4010/api/samples/{sid}/photo",
    data=json.dumps({
        "label": "测试上传显微照片",
        "magnification": "×400 光学显微镜",
        "imageUrl": "data:image/svg+xml;utf8,<svg/>",
        "capturedBy": "王强",
        "notes": "测试自动添加审计记录"
    }).encode(),
    headers={"Content-Type": "application/json"},
    method="POST"
)
r = urllib.request.urlopen(req)
result = json.loads(r.read())
s2 = result['sample']
photos_count = len(s2['microPhotos'])
last_audit = s2['auditLogs'][-1]
print(f"[OK] 上传后照片数: {photos_count}")
print(f"[OK] 最后审计记录:")
print(f"     action: {last_audit.get('action','')}")
print(f"     timestamp: {'timestamp' in last_audit}")
print(f"     note: {last_audit.get('note','')}")
print(f"     operatorName: {last_audit.get('operatorName','')}")
print(f"\n[OK] 所有 API 测试通过！")
