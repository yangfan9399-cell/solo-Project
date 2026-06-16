#!/usr/bin/env python3
"""量子仓库游戏流程测试脚本 - 验证主循环逻辑"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quantum_warehouse.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth.models import User
from django.test import Client
import json


def run_tests():
    print("=" * 60)
    print("量子仓库推箱策略游戏 - 流程测试")
    print("=" * 60)

    client = Client()

    # --- 1. 测试游戏大厅 ---
    print("\n[1/7] 测试游戏大厅页面...")
    resp = client.get('/')
    assert resp.status_code == 200, f"大厅页面失败: {resp.status_code}"
    content = resp.content.decode()
    assert '量子仓库' in content, "缺少游戏标题"
    assert '入门' in content or '初级' in content, "缺少关卡列表"
    print("  ✅ 大厅页面加载成功")

    # --- 2. 测试用户登录 ---
    print("\n[2/7] 测试用户登录...")
    login_ok = client.login(username='testplayer', password='test123456')
    assert login_ok, "登录失败"
    print("  ✅ 测试玩家登录成功")

    # --- 3. 测试开始游戏 ---
    print("\n[3/7] 测试开始新局(第2关-初级)...")
    resp = client.get('/start/2/', HTTP_ACCEPT='application/json')
    assert resp.status_code == 200, f"开始游戏失败: {resp.status_code}"
    data = json.loads(resp.content)
    assert data['success'], f"开始游戏返回失败: {data}"
    session_id = data['session_id']
    state = data['state']
    print(f"  ✅ 新局创建成功 SessionID={session_id}")
    print(f"     网格尺寸: {len(state['grid'])}行 x {len(state['grid'][0])}列")
    print(f"     箱子数: {len(state['boxes'])}, 玩家位置: {state['player_pos']}")

    # --- 4. 测试移动操作 ---
    print("\n[4/7] 测试推箱移动...")
    moves = ['right', 'right', 'right', 'left', 'left', 'down', 'up']
    for idx, direction in enumerate(moves):
        resp = client.post(
            f'/api/move/{session_id}/',
            data=json.dumps({'direction': direction}),
            content_type='application/json',
        )
        assert resp.status_code == 200, f"移动请求失败: {resp.status_code}"
        data = json.loads(resp.content)
        print(f"     移动{direction.upper()}: {'✅' if data['success'] else '❌'} {data['message']}")
    latest_state = data['state']
    print(f"  ✅ 当前步数: {latest_state['moves']}, 坍缩: {latest_state['collapses']}")

    # --- 5. 测试撤销操作 ---
    print("\n[5/7] 测试撤销操作...")
    resp = client.post(f'/api/undo/{session_id}/', {})
    assert resp.status_code == 200, f"撤销请求失败: {resp.status_code}"
    data = json.loads(resp.content)
    print(f"     撤销结果: {'✅' if data['success'] else '❌'} {data['message']}")
    state_after_undo = data['state']
    assert state_after_undo['undos'] >= 1, "撤销计数未增加"
    print(f"  ✅ 撤销成功, 撤销次数: {state_after_undo['undos']}")

    # --- 6. 测试重放历史 ---
    print("\n[6/7] 测试操作历史重放...")
    resp = client.get(f'/api/replay/{session_id}/')
    assert resp.status_code == 200, f"重放请求失败: {resp.status_code}"
    data = json.loads(resp.content)
    assert data['success'], "获取历史失败"
    action_count = len(data['actions'])
    print(f"  ✅ 获取到 {action_count} 条操作记录:")
    for a in data['actions']:
        dir_str = f" [{a['direction']}]" if a['direction'] else ""
        print(f"     #{a['action_number']} {a['action_type']}{dir_str} - valid={a['is_valid']}")

    # --- 7. 测试后端结算(分数重算) ---
    print("\n[7/7] 测试后端结算 & 服务器分数重算...")
    resp = client.post(f'/api/settle/{session_id}/', {})
    assert resp.status_code == 200, f"结算请求失败: {resp.status_code}"
    data = json.loads(resp.content)
    assert data['success'], f"结算失败: {data}"
    result = data['result']
    print(f"  ✅ 结算成功!")
    print(f"     通关状态: {'🏆 通关' if result['is_passed'] else '💔 未通关'}")
    print(f"     使用步数: {result['steps_used']}")
    print(f"     坍缩次数: {result['collapse_count']}")
    print(f"     撤销次数: {result['undo_count']}")
    print(f"     🖥️  服务器重算分数: {result['server_score']} (用于最终得分)")
    print(f"     🎯 最终得分: {result['final_score']}")
    print(f"     结算详情: {json.dumps(result['detail'], ensure_ascii=False)}")

    # --- 验证数据库记录 ---
    print("\n" + "=" * 60)
    print("数据库验证:")
    from game.models import GameSession, GameAction, GameResult, PlayerProfile
    sess = GameSession.objects.get(id=session_id)
    actions_count = GameAction.objects.filter(session=sess).count()
    result_count = GameResult.objects.filter(session=sess).count()
    player = PlayerProfile.objects.get(user__username='testplayer')
    print(f"  局次状态: {sess.status}")
    print(f"  操作记录数: {actions_count}")
    print(f"  结算记录数: {result_count}")
    print(f"  玩家总分: {player.total_score}, 游玩次数: {player.play_count}")

    print("\n" + "=" * 60)
    print("🎉 所有测试通过! 游戏主循环逻辑验证完成。")
    print("=" * 60)
    return True


if __name__ == '__main__':
    try:
        run_tests()
    except AssertionError as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 系统错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(2)
