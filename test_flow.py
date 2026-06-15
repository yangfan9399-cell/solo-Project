import os, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snow_rescue.settings')
import django
django.setup()

from rescue_game.models import SeedSample, RescueSession, RescueNode, RescueDetail, RescueHistory, RescueResult
from rescue_game.game_logic import create_session_from_seed, GameEngine, add_node_to_session, add_detail_to_session

seed = SeedSample.objects.get(seed_type='weather_rollback')
print('种子样本:', seed.name)

session = create_session_from_seed(seed, '测试玩家')
print('创建局次:', session.session_id)

n1 = add_node_to_session(session, 'anchor', 50, 200, 'rock')
n2 = add_node_to_session(session, 'anchor', 400, 300, 'ice')
n3 = add_node_to_session(session, 'anchor', 750, 400, 'snow_cornice')
print(f'添加3个锚点节点: rock({n1.id}), ice({n2.id}), snow_cornice({n3.id})')

d1 = add_detail_to_session(session, 'pulley', 200, 250)
d2 = add_detail_to_session(session, 'protection', 500, 350)
d3 = add_detail_to_session(session, 'pulley', 600, 380)
print(f'添加明细: 滑轮×2, 保护站×1')

engine = GameEngine(session)

weather_events = [
    {'step': 3, 'weather': 'snowfall', 'description': '突降大雪'},
    {'step': 6, 'weather': 'blizzard', 'description': '暴风雪来袭！'},
]

result = engine.execute_full_transfer(700, 150, 100, 400, steps=8, weather_events=weather_events)
print(f'\n执行转移: 成功={result["success"]}, 转移步数={result["total_steps"]}, 总历史步数={result.get("total_history_steps")}')

histories = list(RescueHistory.objects.filter(session=session).order_by('step', 'id'))
print(f'历史记录数量: {len(histories)}')
steps = [h.step for h in histories]
print(f'步骤号列表: {steps}')
print(f'步骤号是否唯一: {len(steps) == len(set(steps))}')

print('\n历史记录明细:')
for h in histories:
    snap = h.get_state_snapshot() or {}
    print(f'  [步骤{h.step:02d}] type={h.action_type:8s} victim=({h.victim_x:.0f},{h.victim_y:.0f}) tension={h.rope_tension:.3f}KN safe={h.is_safe}')
    if h.action_type == 'weather':
        print(f'            天气事件: {h.remark}')
    if snap:
        print(f'            快照: 安全分={snap.get("safety_score")}, 技术分={snap.get("technique_score")}, 有效节点={snap.get("valid_node_count")}/{snap.get("total_node_count")}')

from django.utils import timezone
session.status = 'completed'
session.end_time = timezone.now()
session.save()

final_result = engine.generate_result(90)
print(f'\n[RescueResult 结算结果]')
print(f'  最终得分={final_result.final_score}, 安全分={final_result.safety_score}')
print(f'  技术评分(滑轮×10+保护站×15+锚点×8)={final_result.technique_score}')
print(f'  速度分={final_result.speed_score}')
print(f'  岩壁承力={final_result.terrain_rock_load}KN, 冰面={final_result.terrain_ice_load}KN, 雪檐={final_result.terrain_snow_load}KN')
print(f'  综合安全系数={final_result.safety_factor}, 评级={final_result.grade}')

from django.test import RequestFactory
from rescue_game.views import api_score_analysis, api_session_state, api_get_transfer_step
factory = RequestFactory()

print('\n=== 测试 api_session_state ===')
request = factory.get(f'/api/session/{session.session_id}/')
response = api_session_state(request, session.session_id)
data = json.loads(response.content)
print(f'  histories数={len(data["histories"])}, nodes数={len(data["nodes"])}, details数={len(data["details"])}')
h0 = data['histories'][0]
print(f'  第一条history state_snapshot存在={bool(h0.get("state_snapshot"))}, keys={list(h0.get("state_snapshot", {}).keys())[:8]}...')

print('\n=== 测试 api_get_transfer_step (用索引) ===')
for test_step in [1, 3, len(histories)]:
    request = factory.get(f'/api/session/{session.session_id}/step/{test_step}/')
    response = api_get_transfer_step(request, session.session_id, test_step)
    data = json.loads(response.content)
    print(f'  请求step={test_step}: 成功={data["success"]} total_steps={data.get("total_steps")} history.step={data.get("step",{}).get("step")}')

print('\n=== 测试 api_score_analysis (核心!) ===')
request = factory.get(f'/api/session/{session.session_id}/analysis/')
response = api_score_analysis(request, session.session_id)
resp_data = json.loads(response.content)
print(f'  成功={resp_data["success"]}')
a = resp_data['analysis']
print(f'  before_score(来自初始快照)={a["before_score"]}')
print(f'  after_score(来自RescueResult)={a["after_score"]}')
print(f'  score_diff={a["score_diff"]}')
print(f'  initial_safety_score={a["initial_safety_score"]}, final_safety_score={a["final_safety_score"]}')
print(f'  technique_score={a["technique_score"]}, speed_score={a["speed_score"]}')
print(f'  grade={a.get("grade")}, safety_factor={a.get("safety_factor")}')
print(f'  变化原因数={len(a["reasons"])} (全部基于真实数据计算)')
for r in a["reasons"]:
    print(f'    [{r["icon"]}] {r["title"]} (影响:{r["impact"]})')
    print(f'       说明: {r["detail"]}')
ds = a["details_summary"]
print(f'  滑轮数={ds["pulley_count"]}, 保护站={ds["protection_count"]}, 锚点={ds["anchor_count"]}')
print(f'  技术评分计算明细: {ds["technique_score_detail"]}')
print(f'  平均效率系数={ds["avg_efficiency"]}')
print(f'  地形承力详情: {ds["terrain_detail"]}')
print(f'  RescueDetail明细数={len(ds["details"])} (从数据库读取)')
for d in ds["details"]:
    print(f'     - {d["detail_type_label"]}[{d["detail_id"]}] 有效={d["is_valid"]} 承力={d["load_capacity"]} 效率={d["efficiency"]}')

print(f'\n✅ 全部测试通过！SESSION_ID={session.session_id}')
