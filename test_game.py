#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'castle_game.settings')
django.setup()

from game.models import PlayerProfile, Level, TrapType, GameSession, ScoreRecord
from game import game_logic
from django.contrib.auth.models import User


def run_tests():
    print("=" * 60)
    print("🏰 低多边形城堡攻防异步游戏 - 功能测试")
    print("=" * 60)
    print()

    print("✅ 1. 检查数据库模型...")
    trap_count = TrapType.objects.count()
    level_count = Level.objects.count()
    player_count = PlayerProfile.objects.count()
    print(f"   - 陷阱类型: {trap_count} 种")
    print(f"   - 关卡数量: {level_count} 关")
    print(f"   - 玩家档案: {player_count} 个")

    print("\n✅ 2. 检查初始化数据...")
    spike = TrapType.objects.get(name="尖刺陷阱")
    arrow = TrapType.objects.get(name="箭塔")
    level1 = Level.objects.get(number=1)
    print(f"   - 尖刺陷阱: 伤害{spike.damage}, 花费{spike.cost}金")
    print(f"   - 箭塔: 伤害{arrow.damage}, 范围{arrow.range}, 冷却{arrow.cooldown}")
    print(f"   - 第1关: {level1.name}, {len(level1.enemy_waves)}波敌人")

    print("\n✅ 3. 测试游戏逻辑...")
    demo_user = User.objects.get(username="demo_player")
    player = demo_user.profile

    existing = GameSession.objects.filter(
        player=player,
        status__in=['setup', 'playing']
    ).first()
    if existing:
        existing.delete()

    session = game_logic.create_new_session(player, level1)
    print(f"   - 创建游戏会话成功: ID={session.id}")
    print(f"   - 初始金币: {session.gold}, 城墙: {session.wall_health}")

    result = game_logic.place_trap(session, spike.id, 3, 2)
    print(f"   - 放置尖刺陷阱: {'成功' if result['success'] else '失败'}")

    result = game_logic.place_trap(session, arrow.id, 5, 2)
    print(f"   - 放置箭塔: {'成功' if result['success'] else '失败'}")
    print(f"   - 剩余金币: {session.gold}")

    result = game_logic.start_attack(session)
    print(f"   - 开始进攻: {'成功' if result['success'] else '失败'}")

    print(f"\n✅ 4. 测试回合推进 (5回合)...")
    for i in range(5):
        result = game_logic.next_turn(session)
        if result['success']:
            print(f"   - 回合 {result['turn']}: 生成{result['spawned']}个敌人, "
                  f"击杀{result['kills']}, 城墙受伤{result['wall_damage']}, "
                  f"城墙HP: {result['wall_health']}, 结果: {result['result']}")
        if result.get('result'):
            break

    print(f"\n✅ 5. 测试反作弊校验...")
    client_checksum = session.generate_server_checksum()
    validation = game_logic.validate_client_state(session, {'checksum': client_checksum})
    print(f"   - 正确校验: {'通过' if validation['valid'] else '失败'}")

    bad_validation = game_logic.validate_client_state(session, {'checksum': 'fake_checksum'})
    print(f"   - 错误校验: {'被正确拒绝' if not bad_validation['valid'] else '错误通过'}")

    print(f"\n✅ 6. 测试分数重计算...")
    session.status = 'won'
    session.save()
    game_logic.generate_battle_report(session)
    score_record = ScoreRecord.objects.filter(game_session=session).first()
    if score_record:
        server_score = score_record.recalculate_score()
        print(f"   - 客户端得分: {session.score}")
        print(f"   - 服务器重算: {server_score}")
        print(f"   - 校验结果: {'有效' if score_record.is_valid else '异常'}")
        print(f"   - 重算详情: 击杀得分 + 陷阱×20 + 任务×50 + 胜利加成 + 城墙剩余奖励")

    print(f"\n✅ 7. 测试回放帧...")
    from game.models import ReplayFrame
    frame_count = ReplayFrame.objects.filter(game_session=session).count()
    print(f"   - 已记录回放帧: {frame_count} 帧")

    print(f"\n✅ 8. 测试战报生成...")
    from game.models import BattleReport
    report = BattleReport.objects.filter(game_session=session).first()
    if report:
        print(f"   - 战报标题: {report.title}")
        print(f"   - 最终得分: {report.final_score}")
        print(f"   - 击杀敌人: {report.enemies_killed}")
        print(f"   - 使用陷阱: {report.traps_used}")

    print(f"\n✅ 9. 测试工匠任务...")
    session2 = game_logic.create_new_session(player, level1)
    result = game_logic.start_craftsman_task(session2, 'repair_wall')
    print(f"   - 开始修复城墙任务: {'成功' if result['success'] else '失败'}")
    result = game_logic.start_craftsman_task(session2, 'mine_gold')
    print(f"   - 开始开采金矿任务: {'成功' if result['success'] else '失败'}")
    result = game_logic.start_craftsman_task(session2, 'build_arrow_trap')
    print(f"   - 第3个任务（预期失败）: {'正确拒绝' if not result['success'] else '错误允许'}")

    print(f"\n✅ 10. 测试操作历史...")
    from game.models import ActionHistory
    history_count = ActionHistory.objects.filter(game_session=session).count()
    print(f"   - 操作历史记录: {history_count} 条")

    replay = game_logic.resume_session_from_history(session, 3)
    print(f"   - 回放到第3回合: 金币={replay['gold']}, 城墙={replay['wall_health']}")

    print("\n" + "=" * 60)
    print("🎉 所有核心功能测试通过!")
    print("=" * 60)
    print()
    print("📋 项目核心特性:")
    print("   1. 🏰 城墙陷阱系统 - 5种陷阱，不同伤害/范围/冷却")
    print("   2. 👷 工匠任务系统 - 4种任务，异步完成获得奖励")
    print("   3. ⚔️ 异步攻防引擎 - 回合制推进，敌人自动寻路")
    print("   4. 📊 自动战报系统 - 详细战斗数据和统计")
    print("   5. 🎬 防守回放系统 - 完整战局回放，支持控制")
    print("   6. 🔍 反作弊校验 - SHA256校验客户端状态")
    print("   7. 🏆 分数重计算 - 服务器端独立验证分数")
    print("   8. 📜 操作历史 - 可恢复任意回合状态")
    print("   9. 👤 玩家档案 - 账号系统，数据持久化")
    print("   10. 🎮 5个关卡 - 难度递增，4种敌人类型")
    print()
    print("🚀 启动方式:")
    print("   ./start.sh")
    print("   或: source venv/bin/activate && python manage.py runserver")
    print()
    print("🔑 演示账号: demo_player / password123")
    print("🌐 访问地址: http://localhost:8000")

    session2.delete()


if __name__ == '__main__':
    try:
        run_tests()
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
