import os, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snow_rescue.settings')
import django
django.setup()

from rescue_game.models import SeedSample, RescueSession, RescueNode, RescueDetail, RescueHistory, RescueResult
from rescue_game.game_logic import create_session_from_seed, GameEngine, add_node_to_session, add_detail_to_session

seed = SeedSample.objects.get(seed_type='force_approximation')
print(f'=== 种子样本: {seed.name} ===')

session = create_session_from_seed(seed, '测试玩家-独立天气')
print(f'创建局次: {session.session_id}')

n1 = add_node_to_session(session, 'anchor', 50, 200, 'rock')
n2 = add_node_to_session(session, 'anchor', 400, 300, 'ice')
n3 = add_node_to_session(session, 'anchor', 750, 400, 'snow_cornice')
d1 = add_detail_to_session(session, 'pulley', 200, 250)
d2 = add_detail_to_session(session, 'protection', 500, 350)
print(f'节点3个, 明细2个')

engine = GameEngine(session)

# 先执行4步转移
result = engine.execute_full_transfer(700, 150, 400, 280, steps=4)
print(f'\n执行4步转移: 成功={result["success"]}, 历史步数={result.get("total_history_steps")}')

print('\n=== 测试独立天气事件 (不传递 current_global_step) ===')
from django.test import RequestFactory
from rescue_game.views import api_weather_event
factory = RequestFactory()

request = factory.post(
    f'/api/session/{session.session_id}/weather/',
    data=json.dumps({'weather_type': 'blizzard'}),
    content_type='application/json'
)
response = api_weather_event(request, session.session_id)
resp = json.loads(response.content)
print(f'  成功={resp["success"]}')
print(f'  天气={resp.get("weather")}, 新步骤号={resp.get("new_step")}')
print(f'  失效项数={len(resp.get("failed_items", []))}')
for f in resp.get('failed_items', []):
    print(f'    - {f.get("type")}:{f.get("node_id")} 原因: {f.get("reason")}')

print('\n=== 测试所有历史记录 state_snapshot JSON 序列化 ===')
histories = list(RescueHistory.objects.filter(session=session).order_by('step', 'id'))
all_ok = True
for h in histories:
    try:
        snap = h.get_state_snapshot()
        text = json.dumps(snap)
        if snap:
            failures = snap.get('failures', [])
            has_bad = any(isinstance(f, (RescueNode, RescueDetail)) for f in failures)
            print(f'  [步骤{h.step:02d}] type={h.action_type:8s} JSON✅ failures数={len(failures)} 含Model={has_bad}  snap安全分={snap.get("safety_score")}')
    except Exception as e:
        all_ok = False
        print(f'  [步骤{h.step:02d}] JSON序列化失败: {e}')
print(f'全部可序列化: {"✅" if all_ok else "❌"}')

print('\n=== 测试步骤号唯一性 ===')
steps = [h.step for h in histories]
print(f'  步骤列表: {steps}')
print(f'  唯一? {len(steps) == len(set(steps))}')

print('\n=== 测试回放页API: 逐条获取步骤 ===')
from rescue_game.views import api_get_transfer_step, api_session_state
for i in range(1, len(histories) + 1):
    request = factory.get(f'/api/session/{session.session_id}/step/{i}/')
    resp = json.loads(api_get_transfer_step(request, session.session_id, i).content)
    ok = resp.get('success', False)
    h_step = resp.get('step', {}).get('step', '?')
    snap_exists = bool(resp.get('step', {}).get('state_snapshot'))
    print(f'  读取索引{i}: API成功={ok} 返回步骤号={h_step} 快照存在={snap_exists}')

print('\n=== 测试独立天气事件后再次转移 ===')
engine2 = GameEngine(session)
engine2.histories = list(session.histories.all().order_by('step', 'id'))
engine2.nodes = list(session.nodes.all())
engine2.details = list(session.details.all())
from rescue_game.game_logic import WEATHER_EFFECTS, WeatherType
engine2.weather_effect = WEATHER_EFFECTS.get(session.weather, WEATHER_EFFECTS[WeatherType.CLEAR])
r2 = engine2.execute_full_transfer(400, 280, 100, 400, steps=5)
print(f'  继续5步转移: 成功={r2["success"]}, 历史总数={r2.get("total_history_steps")}')

histories = list(RescueHistory.objects.filter(session=session).order_by('step', 'id'))
steps2 = [h.step for h in histories]
print(f'  最终步骤号: {steps2}')
print(f'  步骤号唯一? {len(steps2) == len(set(steps2))}')

all_ok2 = True
for h in histories:
    try:
        json.dumps(h.get_state_snapshot())
    except Exception as e:
        all_ok2 = False
        print(f'  ❌ 步骤{h.step} JSON失败: {e}')
print(f'  全部JSON可序列化? {all_ok2}')

print(f'\n✅ 全部测试完成！SESSION_ID={session.session_id}')
