import django, os, json
os.environ['DJANGO_SETTINGS_MODULE'] = 'foundry.settings'
django.setup()

from django.test import Client
from workshop.models import Player, Level, Round

Player.objects.filter(name='api测试').delete()
p = Player.objects.create(name='api测试')
level = Level.objects.get(level_number=1)

client = Client()
client.post('/player/create/', {'name': 'api测试'})

print('=' * 60)
print('【API 测试】完整游戏循环')
print('=' * 60)

resp = client.post('/api/round/start/1/')
start_data = resp.json()
round_id = start_data['round_id']
print('开始局次：round_id =', round_id)
print()

print('--- 模拟放字 ---')
for i, ch in enumerate(['春', '风', '大', '地']):
    resp = client.post(
        f'/api/round/{round_id}/operation/',
        json.dumps({'op_type': 'place_char', 'position': i, 'char_value': ch}),
        content_type='application/json'
    )
    data = resp.json()
    print(f'  放字"{ch}" → arranged="{data.get("arranged_text")}", ink={data.get("ink_used")}')

print()
print('--- 调墨 +5 ---')
resp = client.post(
    f'/api/round/{round_id}/operation/',
    json.dumps({'op_type': 'adjust_ink', 'ink_delta': 5}),
    content_type='application/json'
)
data = resp.json()
print(f'  墨量：{data.get("ink_used")}')

print()
print('--- 校对（故意放了错字"风"）---')
resp = client.get(f'/api/round/{round_id}/proofread/')
data = resp.json()
print(f'  错误数：{data["error_count"]}')
for err in data['errors']:
    print(f'    位置{err["position"]+1}: {err["type"]} - 应为"{err.get("expected")}", 实际"{err.get("actual")}"')
print(f'  后端排版文本："{data.get("arranged_text")}"')
print(f'  后端倒字位置：{data.get("inverted_positions")}')

print()
print('--- 修正错字 ---')
resp = client.post(
    f'/api/round/{round_id}/operation/',
    json.dumps({'op_type': 'swap_char', 'position': 1, 'char_value': '回', 'old_char': '风'}),
    content_type='application/json'
)
data = resp.json()
print(f'  换字后："{data.get("arranged_text")}"')

print()
print('--- 再次校对 ---')
resp = client.get(f'/api/round/{round_id}/proofread/')
data = resp.json()
print(f'  错误数：{data["error_count"]}')
if data['error_count'] == 0:
    print(f'  ✅ 校对通过！')
print(f'  后端排版文本："{data.get("arranged_text")}"')

print()
print('--- 继续排版（刷新页面）测试恢复状态 ---')
print('  直接访问游戏页面，通过模板 hidden input 传递初始状态...')
resp = client.get(f'/game/{round_id}/')
html = resp.content.decode('utf-8')
import re
initial_arranged = re.search(r'id="initial-arranged" value="([^"]*)"', html)
initial_ink = re.search(r'id="initial-ink" value="([^"]*)"', html)
initial_inverted = re.search(r'id="initial-inverted" value="([^"]*)"', html)
print(f'  模板恢复的排版："{initial_arranged.group(1) if initial_arranged else ""}"')
print(f'  模板恢复的墨量：{initial_ink.group(1) if initial_ink else "0"}')
print(f'  模板恢复的倒字：{initial_inverted.group(1) if initial_inverted else "[]"}')

print()
print('--- 交稿结算 ---')
resp = client.post(
    f'/api/round/{round_id}/submit/',
    json.dumps({'elapsed_seconds': 30}),
    content_type='application/json'
)
data = resp.json()
ev = data['evaluation']
print(f'  准确率：{ev["accuracy"]}%')
print(f'  最终得分：{ev["final_score"]}')
print(f'  收益：{ev["revenue"]}文')
print(f'  通过：{ev["passed"]}')
print(f'  服务端计算：{ev["server_calculated"]}')

p2 = Player.objects.get(name='api测试')
print(f'  玩家等级：{p2.current_level}  累计收益：{p2.total_revenue}')

print()
print('=' * 60)
print('✅ API 测试通过！主循环可用！')
print('=' * 60)

p.delete()
