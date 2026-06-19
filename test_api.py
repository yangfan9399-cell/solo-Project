import urllib.request
import json

def req(method, url, data=None):
    d = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=d, method=method, headers={'Content-Type': 'application/json'})
    try:
        return json.loads(urllib.request.urlopen(r).read())
    except urllib.error.HTTPError as e:
        return {'error': e.code, 'detail': e.read().decode()}

BASE = 'http://localhost:8000/api'

print('=== 1. 查 ID=1 当前状态 ===')
s1 = req('GET', f'{BASE}/specimens/1')
print('ID=1 当前状态:', s1.get('status'))

print('\n=== 2. 已锁定 ID=1 解锁，跳转到"已退回" ===')
r = req('POST', f'{BASE}/specimens/1/lock', {
    'locked_by': '测试员',
    'unlock_reason': 'E2E测试解锁跳转',
    'target_status_after_unlock': '已退回',
})
print('Lock API 返回:', r)

print('\n=== 3. 验证 ID=1 状态 ===')
s2 = req('GET', f'{BASE}/specimens/1')
print('ID=1 现在状态:', s2.get('status'), '(期望: 已退回)')

print('\n=== 4. 查 ID=5 当前状态（也是已锁定）===')
s5 = req('GET', f'{BASE}/specimens/5')
print('ID=5 当前状态:', s5.get('status'))

print('\n=== 5. 已锁定 ID=5 解锁，跳转到"待接收" ===')
r5 = req('POST', f'{BASE}/specimens/5/lock', {
    'locked_by': '测试员',
    'unlock_reason': 'E2E测试跳转待接收',
    'target_status_after_unlock': '待接收',
})
print('Lock API 返回:', r5)

print('\n=== 6. 验证 ID=5 状态 ===')
s5b = req('GET', f'{BASE}/specimens/5')
print('ID=5 现在状态:', s5b.get('status'), '(期望: 待接收)')

print('\n=== 7. 非法目标：已锁定 → 已锁定（无效） ===')
r_bad = req('POST', f'{BASE}/specimens/8/lock', {
    'locked_by': '测试员',
    'unlock_reason': '测试非法目标',
    'target_status_after_unlock': '已锁定',
})
print('非法目标返回:', r_bad)

print('\n=== 8. 非法流转测试：已退回 → 已锁定 走 status API ===')
r_bad2 = req('POST', f'{BASE}/specimens/4/status', {'status': '已锁定'})
print('非法流转返回:', r_bad2)
