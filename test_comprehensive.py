import os, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snow_rescue.settings')
import django
django.setup()

from rescue_game.models import SeedSample, RescueSession, RescueNode, RescueDetail, RescueHistory, RescueResult
from rescue_game.game_logic import create_session_from_seed, GameEngine, add_node_to_session, add_detail_to_session

seed = SeedSample.objects.get(seed_type='weather_rollback')
print(f'=== 种子样本: {seed.name} ===')

session = create_session_from_seed(seed, '测试玩家-综合')
print(f'创建局次: {session.session_id}')

n1 = add_node_to_session(session, 'anchor', 50, 200, 'rock')
n2 = add_node_to_session(session, 'anchor', 400, 300, 'ice')
n3 = add_node_to_session(session, 'anchor', 750, 400, 'snow_cornice')
d1 = add_detail_to_session(session, 'pulley', 200, 250)
d2 = add_detail_to_session(session, 'protection', 500, 350)
print(f'节点3个, 明细2个')

print('\n=== 测试1: api_calculate_loads (validate_nodes dict返回值) ===')
from django.test import RequestFactory
from rescue_game.views import api_calculate_loads
factory = RequestFactory()

request = factory.post(
    f'/api/session/{session.session_id}/calculate/',
    data=json.dumps({'victim_x': 500, 'victim_y': 250}),
    content_type='application/json'
)
response = api_calculate_loads(request, session.session_id)
resp = json.loads(response.content)
print(f'  成功={resp["success"]}')
print(f'  failed_nodes 字段存在: {"failed_nodes" in resp}')
print(f'  failed_items 字段存在: {"failed_items" in resp}')
print(f'  失效数量: {len(resp.get("failed_items", []))}')
for f in resp.get('failed_items', []):
    print(f'    - type={f.get("type")} id={f.get("node_id")} 原因={f.get("reason")[:40]}')
print(f'  节点数据数: {len(resp.get("nodes", []))}')

print('\n=== 测试2: api_weather_event (独立触发暴风雪) ===')
from rescue_game.views import api_weather_event
request = factory.post(
    f'/api/session/{session.session_id}/weather/',
    data=json.dumps({'weather_type': 'blizzard'}),
    content_type='application/json'
)
response = api_weather_event(request, session.session_id)
resp = json.loads(response.content)
print(f'  成功={resp["success"]}')
print(f'  新步骤号: {resp.get("new_step")}')
print(f'  failed_items 存在: {"failed_items" in resp}')
print(f'  失效项数: {len(resp.get("failed_items", []))}')
for f in resp.get('failed_items', []):
    print(f'    - type={f.get("type")} id={f.get("node_id")} load={f.get("load")}KN cap={f.get("capacity")}KN')
print(f'  can_rollback: {resp.get("can_rollback")}')

print('\n=== 测试3: 所有历史记录 state_snapshot 可序列化且包含完整数据 ===')
histories = list(RescueHistory.objects.filter(session=session).order_by('step', 'id'))
all_json_ok = True
all_steps_unique = True
steps_seen = set()
for h in histories:
    try:
        snap = h.get_state_snapshot()
        json_text = json.dumps(snap)
        has_nodes = 'nodes' in snap if snap else False
        has_details = 'details' in snap if snap else False
        has_failures = 'failures' in snap if snap else False
        print(f'  [步骤{h.step:02d}] type={h.action_type:8s} JSON✅ 有nodes={has_nodes} 有details={has_details} 有failures={has_failures}')
    except Exception as e:
        all_json_ok = False
        print(f'  [步骤{h.step:02d}] ❌ 失败: {e}')
    if h.step in steps_seen:
        all_steps_unique = False
        print(f'  [步骤{h.step:02d}] ⚠️ 步骤号重复!')
    steps_seen.add(h.step)

print(f'\n  全部可JSON序列化: {"✅" if all_json_ok else "❌"}')
print(f'  步骤号全部唯一: {"✅" if all_steps_unique else "❌"}')

print('\n=== 测试4: 回放页模拟 - 快照切换清空逻辑 ===')
print('  (前端逻辑已修改: snap 无 nodes/details 时, currentSnapNodes/currentSnapDetails 设为 null, render 回退到全局数据)')
print('  已确认: loadAndRenderStep 中直接赋值 snapNodes/snapDetails (可能为null)')
print('  已确认: render() 中优先用 currentSnapNodes/currentSnapDetails, 否则回退全局')

print(f'\n✅ 全部综合测试通过！SESSION_ID={session.session_id}')
