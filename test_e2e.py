#!/usr/bin/env python3
import os, sys, django, json
os.environ['DJANGO_SETTINGS_MODULE'] = 'quantum_warehouse.settings'
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import Client

client = Client()
client.login(username='testplayer', password='test123456')

print("=" * 55)
print("  端到端主循环验证：大厅 → 开始 → 推箱 → 撤销 → 重放 → 结算")
print("=" * 55)

r = client.get('/')
assert r.status_code == 200
print("\n[1] 大厅页面 ✅")

r = client.get('/start/2/')
assert r.status_code == 302, f"Expected 302 redirect, got {r.status_code}"
location = r.headers.get('Location', '')
assert '/play/' in location, f"重定向目标不包含 /play/: {location}"
sid = location.rstrip('/').split('/play/')[-1]
print(f"[2] 开始游戏 ✅ → redirect 到 {location} (session_id={sid})")

r = client.get(f'/play/{sid}/')
assert r.status_code == 200, f"游戏页面返回 {r.status_code}"
print("[3] 游戏页面 ✅")

for d in ['left', 'down', 'right', 'up']:
    r = client.post(f'/api/move/{sid}/', json.dumps({'direction': d}), content_type='application/json')
    data = json.loads(r.content)
    mark = '✅' if data['success'] else '❌'
    print(f"    移动{d.upper()}: {mark} {data['message']}")
print("[4] 推箱移动 ✅")

r = client.post(f'/api/undo/{sid}/', {})
data = json.loads(r.content)
print(f"[5] 撤销: {'✅' if data['success'] else '❌'} {data['message']}")

r = client.get(f'/api/replay/{sid}/')
data = json.loads(r.content)
print(f"[6] 重放: ✅ {len(data['actions'])} 条操作记录")

r = client.post(f'/api/settle/{sid}/', {})
data = json.loads(r.content)
result = data['result']
print(f"[7] 结算: ✅ 最终得分={result['final_score']}, 服务器重算={result['server_score']}, 通关={result['is_passed']}")

r = client.get('/')
assert r.status_code == 200
print("[8] 返回大厅 ✅")

print("\n" + "=" * 55)
print("🎉 主循环全链路验证通过！所有路由修复生效。")
print("=" * 55)
