import os, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snow_rescue.settings')
import django
django.setup()

from rescue_game.models import SeedSample, RescueSession, RescueNode, RescueDetail, RescueHistory, RescueResult
from rescue_game.game_logic import create_session_from_seed, GameEngine, add_node_to_session, add_detail_to_session

seed = SeedSample.objects.get(seed_type='normal_complete')
print('种子样本:', seed.name)

session = create_session_from_seed(seed, '测试玩家')
print('创建局次:', session.session_id)

n1 = add_node_to_session(session, 'anchor', 50, 200, 'rock')
n2 = add_node_to_session(session, 'anchor', 400, 300, 'rock')
n3 = add_node_to_session(session, 'anchor', 750, 400, 'rock')
print('添加3个锚点节点')

d1 = add_detail_to_session(session, 'pulley', 200, 250)
d2 = add_detail_to_session(session, 'protection', 500, 350)
print('添加滑轮和保护站明细')

engine = GameEngine(session)
result = engine.execute_full_transfer(700, 150, 100, 400, steps=10)
print(f'\n执行转移: 成功={result["success"]}, 步骤数={result["total_steps"]}, 停止原因={result.get("stop_reason", "无")}')

histories = RescueHistory.objects.filter(session=session)
print(f'历史记录数量: {histories.count()}')
for h in histories[:5]:
    snap = json.loads(h.state_snapshot) if h.state_snapshot else {}
    print(f'  步骤{h.step}: {h.action}, 位置=({h.victim_x:.0f},{h.victim_y:.0f}), 张力={h.rope_tension:.2f}KN, 安全={h.is_safe}')
    if 'nodes' in snap:
        print(f'    节点快照={len(snap["nodes"])}, 明细快照={len(snap.get("details", []))}')

from django.utils import timezone
session.status = 'completed'
session.end_time = timezone.now()
session.save()

final_result = engine.generate_result(60)
print(f'\n结算结果: 最终得分={final_result.final_score}, 安全分={final_result.safety_score}')
print(f'  技术评分(含滑轮×10,保护站×15)={final_result.technique_score}')
print(f'  岩壁承力={final_result.terrain_rock_load}KN, 冰面={final_result.terrain_ice_load}KN, 雪檐={final_result.terrain_snow_load}KN')

from django.test import RequestFactory
from rescue_game.views import api_score_analysis
factory = RequestFactory()
request = factory.get(f'/api/session/{session.session_id}/analysis/')
response = api_score_analysis(request, session.session_id)
resp_data = json.loads(response.content)
print(f'\n评分分析API测试:')
print(f'  成功={resp_data["success"]}')
analysis = resp_data['analysis']
print(f'  救援前评分={analysis["before_score"]}, 救援后评分={analysis["after_score"]}')
print(f'  差异={analysis["score_diff"]}')
print(f'  变化原因数={len(analysis["reasons"])}')
for r in analysis["reasons"]:
    print(f'    [{r["icon"]}] {r["title"]} (影响:{r["impact"]})')
    print(f'       说明: {r["detail"]}')
print(f'  滑轮数={analysis["details_summary"]["pulley_count"]}, 保护站数={analysis["details_summary"]["protection_count"]}')
print(f'  锚点数={analysis["details_summary"]["anchor_count"]}, 节点总数={analysis["details_summary"]["total_nodes"]}')
print(f'\n测试完毕！SESSION_ID = {session.session_id}')
