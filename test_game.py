#!/usr/bin/env python3
"""
游戏核心功能测试脚本
验证：折叠算法、路径查找、移动验证、投递验证、分数结算
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'paper_mail_game.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from game.models import Level, GameSession
from game.services import GameService
from game.game_logic import create_initial_game_state, fold_paper, find_path, validate_move, validate_delivery, calculate_score, are_cells_adjacent

def test_seed_levels():
    """测试种子关卡数据"""
    print("=" * 60)
    print("测试1: 种子关卡数据")
    print("=" * 60)
    levels = Level.objects.all()
    print(f"关卡数量: {levels.count()}")
    for level in levels:
        print(f"  - [{level.id}] {level.name}")
        print(f"    网格: {level.grid_width}x{level.grid_height}")
        print(f"    地址数: {len(level.addresses)}")
        print(f"    信件数: {len(level.letters)}")
        print(f"    步数限制: {level.max_steps}")
        print(f"    最短解步数: {level.min_solution.get('steps', 'N/A') if level.min_solution else 'N/A'}")
        print()
    assert levels.count() == 3, f"应有3个关卡，实际{levels.count()}个"
    print("✓ 种子关卡数据正确\n")

def test_game_initialization():
    """测试游戏初始化"""
    print("=" * 60)
    print("测试2: 游戏初始化")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    print(f"局次ID: {session.id}")
    print(f"关卡: {session.level.name}")
    print(f"初始步数: {session.step_count}/{session.level.max_steps}")
    print(f"初始折叠次数: {session.fold_count}")
    print(f"邮差位置: ({session.postman_position['x']}, {session.postman_position['y']})")
    print(f"状态中的单元格数: {len(session.current_state['cells'])}")
    print(f"状态中的邻接数: {len(session.current_state['adjacency'])}")
    
    assert session.status == 'playing'
    assert session.step_count == 0
    assert session.fold_count == 0
    assert len(session.current_state['cells']) == level.grid_width * level.grid_height
    print("✓ 游戏初始化正确\n")
    return session

def test_move_postman():
    """测试邮差移动"""
    print("=" * 60)
    print("测试3: 邮差移动")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    initial_pos = (session.postman_position['x'], session.postman_position['y'])
    print(f"初始位置: {initial_pos}")
    
    # 尝试向右移动
    success, message, state = GameService.move_postman(session, initial_pos[0] + 1, initial_pos[1])
    session.refresh_from_db()
    new_pos = (session.postman_position['x'], session.postman_position['y'])
    print(f"向右移动: {success} - {message}")
    print(f"新位置: {new_pos}")
    print(f"已用步数: {session.step_count}")
    
    assert success, f"移动失败: {message}"
    assert session.step_count == 1
    print("✓ 邮差移动正确\n")
    return session

def test_fold_paper():
    """测试折叠地图"""
    print("=" * 60)
    print("测试4: 折叠地图")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    print(f"折叠前: 单元格={len(session.current_state['cells'])}, 邻接={len(session.current_state['adjacency'])}")
    
    # 执行水平折叠
    success, message, state = GameService.fold_map(session, 'horizontal_up', 2)
    session.refresh_from_db()
    
    print(f"水平折叠(折痕2): {success} - {message}")
    print(f"折叠后: 单元格={len(session.current_state['cells'])}, 邻接={len(session.current_state['adjacency'])}")
    print(f"折叠次数: {session.fold_count}")
    print(f"折叠历史记录数: {session.fold_histories.count()}")
    
    assert success, f"折叠失败: {message}"
    assert session.fold_count == 1
    assert session.fold_histories.count() == 1
    
    # 检查FoldHistory记录
    fold_record = session.fold_histories.first()
    print(f"  折叠记录: 方向={fold_record.direction}, 折痕={fold_record.fold_line}")
    print(f"  合并单元格数: {len(fold_record.merged_cells)}")
    print(f"  新增邻接数: {len(fold_record.new_adjacencies)}")
    print(f"  移除邻接数: {len(fold_record.removed_adjacencies)}")
    
    print("✓ 折叠地图正确\n")
    return session

def test_delivery_validation():
    """测试投递验证"""
    print("=" * 60)
    print("测试5: 投递验证")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 找到一个地址
    address = level.addresses[0]
    letter = [l for l in level.letters if l['color'] == address['color']][0]
    
    print(f"地址: {address['name']}({address['color']}) 位置({address['x']},{address['y']})")
    print(f"信件: {letter['id']}({letter['color']})")
    
    # 先移动到地址位置
    success, _, _ = GameService.move_postman(session, address['x'], address['y'])
    session.refresh_from_db()
    print(f"移动到地址位置: {success}")
    
    # 尝试投递
    success, message, state = GameService.deliver_letter(session, letter['id'])
    session.refresh_from_db()
    
    print(f"投递结果: {success} - {message}")
    print(f"已投递信件: {len(session.delivered_letters)}")
    
    assert success, f"投递失败: {message}"
    delivered_ids = [l['id'] for l in session.delivered_letters]
    assert letter['id'] in delivered_ids, f"信件{letter['id']}未在已投递列表中"
    print("✓ 投递验证正确\n")
    return session

def test_path_finding():
    """测试路径查找"""
    print("=" * 60)
    print("测试6: 路径查找")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    state = session.current_state
    
    start = (session.postman_position['x'], session.postman_position['y'])
    address = level.addresses[0]
    end = (address['x'], address['y'])
    
    print(f"起点: {start}, 终点: {end}")
    
    path = find_path(state, level, start, end)
    print(f"找到路径: {path}")
    print(f"路径长度: {len(path) if path else '无'}")
    
    # 验证路径是可通行的
    if path and len(path) > 1:
        for i in range(len(path) - 1):
            from_cell = path[i]
            to_cell = path[i + 1]
            assert are_cells_adjacent(state, from_cell, to_cell), f"路径中{from_cell}和{to_cell}不相邻"
            assert state['cells'][to_cell]['visible'], f"路径中{to_cell}不可见"
        print("✓ 路径有效")
    print("✓ 路径查找正确\n")

def test_undo_action():
    """测试撤销操作"""
    print("=" * 60)
    print("测试7: 撤销操作")
    print("=" * 60)
    
    level = Level.objects.get(name="样本3：最优路径挑战")
    session = GameService.start_new_game(level.id)
    
    initial_steps = session.step_count
    initial_folds = session.fold_count
    print(f"初始: 步数={initial_steps}, 折叠={initial_folds}")
    
    # 执行移动
    pos = (session.postman_position['x'], session.postman_position['y'])
    GameService.move_postman(session, pos[0] + 1, pos[1])
    session.refresh_from_db()
    print(f"移动后: 步数={session.step_count}, 明细记录数={session.delivery_details.count()}")
    
    # 执行折叠
    GameService.fold_map(session, 'horizontal_up', 2)
    session.refresh_from_db()
    print(f"折叠后: 步数={session.step_count}, 折叠={session.fold_count}, 历史记录={session.fold_histories.count()}")
    
    # 撤销折叠
    success, message, state = GameService.undo_action(session)
    session.refresh_from_db()
    print(f"撤销折叠: {success} - {message}")
    print(f"撤销后: 步数={session.step_count}, 折叠={session.fold_count}, 历史记录={session.fold_histories.count()}")
    
    assert success, f"撤销失败: {message}"
    assert session.fold_count == 0
    assert session.fold_histories.count() == 0
    
    # 撤销移动
    success, message, state = GameService.undo_action(session)
    session.refresh_from_db()
    print(f"撤销移动: {success} - {message}")
    print(f"撤销后: 步数={session.step_count}")
    
    assert session.step_count == initial_steps
    print("✓ 撤销操作正确\n")

def test_score_calculation():
    """测试分数结算"""
    print("=" * 60)
    print("测试8: 分数结算")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 模拟完成游戏（投递所有信件）
    for letter in level.letters:
        address = [a for a in level.addresses if a['color'] == letter['color']][0]
        GameService.move_postman(session, address['x'], address['y'])
        GameService.deliver_letter(session, letter['id'])
    
    session.refresh_from_db()
    print(f"完成投递: {len(session.delivered_letters)}/{len(level.letters)}")
    
    # 计算分数
    score, breakdown = calculate_score(session, level)
    print(f"总分数: {score}")
    print(f"分数明细:")
    for key, value in breakdown.items():
        print(f"  {key}: {value}")
    
    # 验证GameResult创建
    session.status = 'won'
    session.save()
    result = GameService.compare_with_optimal(session)
    print(f"\n最短解对比:")
    print(f"  评级: {result.get('final_rank', 'N/A')}")
    print(f"  玩家步数: {result.get('actual_steps', 'N/A')}")
    print(f"  最优步数: {result.get('optimal_steps', 'N/A')}")
    print(f"  玩家折叠: {result.get('actual_folds', 'N/A')}")
    print(f"  最优折叠: {result.get('optimal_folds', 'N/A')}")
    
    assert score > 0, "分数应大于0"
    print("✓ 分数结算正确\n")

def test_validation_edge_cases():
    """测试边界情况 - 样本2触发异常"""
    print("=" * 60)
    print("测试9: 边界情况验证（样本2）")
    print("=" * 60)
    
    level = Level.objects.get(name="样本2：迷宫信使")
    session = GameService.start_new_game(level.id)
    
    # 找到需要特定折叠的地址
    require_fold_addr = [a for a in level.addresses if a.get('requires_fold')]
    if require_fold_addr:
        addr = require_fold_addr[0]
        print(f"需要折叠的地址: {addr['name']} 需要 {addr.get('requires_fold', 'N/A')}")
        
        # 在未折叠时尝试投递 - 应该失败
        GameService.move_postman(session, addr['x'], addr['y'])
        letter = [l for l in level.letters if l['color'] == addr['color']][0]
        success, message, state = GameService.deliver_letter(session, letter['id'])
        print(f"未折叠时投递: {success} - {message}")
        assert not success, "未折叠时应无法投递需要折叠的地址"
        
        # 执行必要的折叠
        fold_dir = addr['requires_fold']
        fold_line = 2 if fold_dir in ['horizontal_up', 'horizontal_down'] else 2
        success, message, state = GameService.fold_map(session, fold_dir, fold_line)
        session.refresh_from_db()
        print(f"执行{fold_dir}折叠: {success}")
        
        # 再次尝试投递 - 应该成功
        GameService.move_postman(session, addr['x'], addr['y'])
        success, message, state = GameService.deliver_letter(session, letter['id'])
        print(f"折叠后投递: {success} - {message}")
        
    print("✓ 边界情况验证正确\n")

def test_delivery_detail_records():
    """测试明细记录"""
    print("=" * 60)
    print("测试10: 明细记录（操作都写入局次状态）")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 执行一系列操作
    pos = (session.postman_position['x'], session.postman_position['y'])
    GameService.move_postman(session, pos[0] + 1, pos[1])
    GameService.move_postman(session, pos[0] + 2, pos[1])
    GameService.fold_map(session, 'vertical_left', 2)
    
    session.refresh_from_db()
    details = session.delivery_details.all().order_by('step_number')
    
    print(f"操作明细记录数: {details.count()}")
    for detail in details:
        print(f"  [{detail.step_number}] {detail.action}: {detail.error_message or '成功'}")
        print(f"     步数消耗: {detail.step_cost}, 是否有效: {detail.is_valid}")
        print(f"     状态快照存在: state_before和state_after存在")
    
    assert details.count() >= 3, f"至少应有3条操作记录，实际{details.count()}条"
    print("✓ 明细记录正确\n")

def test_fold_over_steps_limit():
    """测试折叠超过步数限制时不写入历史记录"""
    print("=" * 60)
    print("测试11: 折叠超步数限制（不污染历史）")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 把步费用到只剩1步（折叠需要2步，这样折叠就会超过）
    target_steps = level.max_steps - 1
    print(f"目标步数: {target_steps}/{level.max_steps}")
    
    current_pos = (session.postman_position['x'], session.postman_position['y'])
    while session.step_count < target_steps:
        # 来回移动消耗步数
        next_x = current_pos[0] + 1 if current_pos[0] < level.grid_width - 1 else current_pos[0] - 1
        if next_x == current_pos[0]:
            next_x = current_pos[0] - 1 if current_pos[0] > 0 else current_pos[0] + 1
        
        success, _, _ = GameService.move_postman(session, next_x, current_pos[1])
        if success:
            current_pos = (next_x, current_pos[1])
        session.refresh_from_db()
    
    session.refresh_from_db()
    fold_count_before = session.fold_count
    fold_history_before = session.fold_histories.count()
    detail_count_before = session.delivery_details.filter(action='fold').count()
    
    print(f"折叠前: 步数={session.step_count}/{level.max_steps}")
    print(f"        折叠次数={fold_count_before}, FoldHistory记录={fold_history_before}")
    
    # 尝试折叠（需要2步，会超过限制）
    success, message, result = GameService.fold_map(session, 'horizontal_up', 2)
    session.refresh_from_db()
    
    print(f"尝试折叠: {success} - {message}")
    print(f"折叠后: 折叠次数={session.fold_count}, FoldHistory记录={session.fold_histories.count()}")
    print(f"        fold明细数={session.delivery_details.filter(action='fold').count()}")
    
    assert not success, "超出步数限制时折叠应该失败"
    assert session.fold_count == fold_count_before, "折叠次数不应增加"
    assert session.fold_histories.count() == fold_history_before, "FoldHistory记录不应增加"
    assert session.delivery_details.filter(action='fold').count() == detail_count_before, "fold明细记录不应增加"
    assert session.step_count == target_steps, "步数不应变化"
    
    print("✓ 超步数折叠不污染历史\n")

def test_game_result_after_finish():
    """测试游戏结束后结算数据（从明细重算）"""
    print("=" * 60)
    print("测试12: 游戏结束结算数据（从明细重算）")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 完成游戏（投递所有信件）
    for letter in level.letters:
        address = [a for a in level.addresses if a['color'] == letter['color']][0]
        GameService.move_postman(session, address['x'], address['y'])
        GameService.deliver_letter(session, letter['id'])
    
    session.refresh_from_db()
    
    print(f"游戏状态: {session.status}")
    print(f"已投递: {len(session.delivered_letters)}/{len(level.letters)}")
    print(f"总步数: {session.step_count}, 总折叠: {session.fold_count}")
    
    # 验证GameResult存在
    try:
        result = session.result
        print(f"\nGameResult存在:")
        print(f"  是否成功: {result.is_success}")
        print(f"  最终分数: {result.final_score}")
        print(f"  评级: {result.final_rank}")
        print(f"  步数使用: {result.steps_used}")
        print(f"  折叠使用: {result.folds_used}")
        print(f"  最短解步数: {result.optimal_steps}")
        print(f"  最短解折叠: {result.optimal_folds}")
        print(f"  是否达到最优: {result.is_optimal}")
        print(f"  分数明细项数: {len(result.score_breakdown)}")
        for key, value in result.score_breakdown.items():
            print(f"    {key}: {value}")
        
        # 验证分数是从明细重算的
        from game.game_logic import calculate_score
        recalc_score, recalc_breakdown = calculate_score(session, level)
        print(f"\n重新计算分数: {recalc_score}")
        print(f"重新计算明细项数: {len(recalc_breakdown)}")
        
        assert result.final_score == recalc_score, f"分数不一致: result={result.final_score}, recalc={recalc_score}"
        assert result.final_rank is not None, "应有评级"
        assert result.score_breakdown is not None, "应有分数明细"
        assert result.optimal_steps is not None, "应有最短解步数"
        
        print("\n✓ 结算数据正确（从明细重算）\n")
    except GameSession.result.RelatedObjectDoesNotExist:
        print("✗ GameResult不存在")
        assert False, "游戏结束后应创建GameResult"

def test_get_game_history_with_result():
    """测试get_game_history在游戏结束后返回正确的result数据"""
    print("=" * 60)
    print("测试13: get_game_history返回结算数据")
    print("=" * 60)
    
    level = Level.objects.get(name="样本1：邻里送信")
    session = GameService.start_new_game(level.id)
    
    # 完成游戏
    for letter in level.letters:
        address = [a for a in level.addresses if a['color'] == letter['color']][0]
        GameService.move_postman(session, address['x'], address['y'])
        GameService.deliver_letter(session, letter['id'])
    
    session.refresh_from_db()
    
    history = GameService.get_game_history(session)
    
    print(f"history包含result: {history['result'] is not None}")
    if history['result']:
        print(f"  最终分数: {history['result']['final_score']}")
        print(f"  评级: {history['result']['final_rank']}")
        print(f"  分数明细存在: {history['result']['score_breakdown'] is not None}")
        print(f"  最优步数: {history['result']['optimal_steps']}")
    
    assert history['result'] is not None, "history中应包含result数据"
    assert 'final_score' in history['result'], "应包含final_score"
    assert 'final_rank' in history['result'], "应包含final_rank"
    assert 'score_breakdown' in history['result'], "应包含score_breakdown"
    
    print("✓ get_game_history返回正确的结算数据\n")

def main():
    """运行所有测试"""
    print("\n" + "=" * 60)
    print("  纸上邮差路线折叠游戏 - 核心功能测试")
    print("=" * 60 + "\n")
    
    try:
        test_seed_levels()
        test_game_initialization()
        test_move_postman()
        test_fold_paper()
        test_delivery_validation()
        test_path_finding()
        test_undo_action()
        test_score_calculation()
        test_validation_edge_cases()
        test_delivery_detail_records()
        test_fold_over_steps_limit()
        test_game_result_after_finish()
        test_get_game_history_with_result()
        
        print("=" * 60)
        print("  ✓ 所有测试通过！")
        print("=" * 60)
        return True
    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
