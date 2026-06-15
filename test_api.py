#!/usr/bin/env python3
"""
API接口测试脚本 - 验证结算数据正确返回
"""

import os
import sys
import json
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paper_mail_game.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.test import Client
from game.models import Level, GameSession
from game.services import GameService

def test_state_api_with_result():
    """测试state接口在游戏结束后返回完整的result数据"""
    print("=" * 60)
    print("测试: /api/game/<session_id>/state/ 返回结算数据")
    print("=" * 60)
    
    client = Client()
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 完成游戏
    for letter in level.letters:
        address = [a for a in level.addresses if a['color'] == letter['color']][0]
        GameService.move_postman(session, address['x'], address['y'])
        GameService.deliver_letter(session, letter['id'])
    
    session.refresh_from_db()
    
    # 调用state接口
    response = client.get(f'/api/game/{session.session_id}/state/')
    data = response.json()
    
    print(f"HTTP状态码: {response.status_code}")
    print(f"success: {data.get('success')}")
    
    if data.get('success'):
        state = data['state']
        print(f"游戏状态: {state['status']}")
        print(f"result存在: {state['result'] is not None}")
        
        if state['result']:
            result = state['result']
            print(f"  最终分数: {result.get('final_score')}")
            print(f"  评级: {result.get('final_rank')}")
            print(f"  是否成功: {result.get('is_success')}")
            print(f"  步数使用: {result.get('steps_used')}")
            print(f"  折叠使用: {result.get('folds_used')}")
            print(f"  最短解步数: {result.get('optimal_steps')}")
            print(f"  最短解折叠: {result.get('optimal_folds')}")
            print(f"  是否最优: {result.get('is_optimal')}")
            print(f"  分数明细项数: {len(result.get('score_breakdown', {}))}")
            print(f"  送达数: {result.get('delivered_count')}/{result.get('total_letters')}")
            
            # 验证所有必需字段都存在
            required_fields = ['final_score', 'final_rank', 'is_success', 'steps_used', 
                              'folds_used', 'optimal_steps', 'optimal_folds', 'is_optimal',
                              'score_breakdown', 'delivered_count', 'total_letters']
            missing = [f for f in required_fields if f not in result]
            assert not missing, f"缺少字段: {missing}"
            
            print("\n✓ state接口返回完整的结算数据\n")
            return True
        else:
            print("✗ result为None")
            return False
    else:
        print(f"✗ 接口错误: {data.get('error')}")
        return False

def test_history_api_with_result():
    """测试history接口在游戏结束后返回完整的result数据"""
    print("=" * 60)
    print("测试: /api/game/<session_id>/history/ 返回结算数据")
    print("=" * 60)
    
    client = Client()
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 完成游戏
    for letter in level.letters:
        address = [a for a in level.addresses if a['color'] == letter['color']][0]
        GameService.move_postman(session, address['x'], address['y'])
        GameService.deliver_letter(session, letter['id'])
    
    session.refresh_from_db()
    
    # 调用history接口
    response = client.get(f'/api/game/{session.session_id}/history/')
    data = response.json()
    
    print(f"HTTP状态码: {response.status_code}")
    print(f"success: {data.get('success')}")
    
    if data.get('success'):
        history = data['history']
        print(f"游戏状态: {history['status']}")
        print(f"result存在: {history['result'] is not None}")
        print(f"折叠历史记录数: {len(history.get('fold_histories', []))}")
        print(f"操作明细记录数: {len(history.get('delivery_details', []))}")
        
        if history['result']:
            result = history['result']
            print(f"  最终分数: {result.get('final_score')}")
            print(f"  评级: {result.get('final_rank')}")
            print(f"  分数明细存在: {result.get('score_breakdown') is not None}")
            
            # 验证字段
            assert 'final_score' in result, "缺少final_score"
            assert 'final_rank' in result, "缺少final_rank"
            assert 'score_breakdown' in result, "缺少score_breakdown"
            
            print("\n✓ history接口返回完整的结算数据\n")
            return True
        else:
            print("✗ result为None")
            return False
    else:
        print(f"✗ 接口错误: {data.get('error')}")
        return False

def test_state_api_playing_no_result():
    """测试state接口在游戏进行中时result为None（不报错）"""
    print("=" * 60)
    print("测试: 游戏进行中state接口不报错（result为None）")
    print("=" * 60)
    
    client = Client()
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 只做一步移动，游戏未结束
    GameService.move_postman(session, 1, 2)
    session.refresh_from_db()
    
    # 调用state接口
    response = client.get(f'/api/game/{session.session_id}/state/')
    data = response.json()
    
    print(f"HTTP状态码: {response.status_code}")
    print(f"success: {data.get('success')}")
    
    if data.get('success'):
        state = data['state']
        print(f"游戏状态: {state['status']}")
        print(f"result: {state['result']}")
        assert state['result'] is None, "游戏进行中result应为None"
        
        print("\n✓ 游戏进行中state接口正常（result为None）\n")
        return True
    else:
        print(f"✗ 接口错误: {data.get('error')}")
        return False

def main():
    print("\n" + "=" * 60)
    print("  API接口测试 - 结算数据验证")
    print("=" * 60 + "\n")
    
    all_pass = True
    
    try:
        if not test_state_api_with_result():
            all_pass = False
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        all_pass = False
    
    try:
        if not test_history_api_with_result():
            all_pass = False
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        all_pass = False
    
    try:
        if not test_state_api_playing_no_result():
            all_pass = False
    except Exception as e:
        print(f"✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        all_pass = False
    
    if all_pass:
        print("=" * 60)
        print("  ✓ 所有API测试通过！")
        print("=" * 60)
        return True
    else:
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
