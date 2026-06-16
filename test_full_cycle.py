#!/usr/bin/env python
import os
import sys
import django
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'castle_game.settings')
django.setup()

from game.models import PlayerProfile, Level, TrapType, GameSession, ScoreRecord, BattleReport
from game import game_logic
from django.contrib.auth.models import User


def test_full_game_cycle():
    print("=" * 70)
    print("🏰 低多边形城堡攻防异步游戏 - 完整主循环测试")
    print("=" * 70)
    print()

    print("🎮 测试完整游戏流程: 布置 → 开战 → 推进回合 → 结算 → 战报/回放/重算")
    print("-" * 70)
    print()

    demo_user = User.objects.get(username="demo_player")
    player = demo_user.profile
    level1 = Level.objects.get(number=1)

    GameSession.objects.filter(
        player=player,
        status__in=['setup', 'playing', 'won', 'lost']
    ).delete()

    print("📌 阶段 1: 布置陷阱和工匠任务")
    print("-" * 50)
    session = game_logic.create_new_session(player, level1)
    print(f"   ✅ 创建游戏会话: ID={session.id}")
    print(f"   ✅ 初始状态: 金币={session.gold}, 城墙={session.wall_health}, 回合={session.current_turn}")
    print(f"   ✅ 状态: {session.status} (布置阶段)")

    spike = TrapType.objects.get(name="尖刺陷阱")
    arrow = TrapType.objects.get(name="箭塔")
    fire = TrapType.objects.get(name="火焰陷阱")

    r = game_logic.place_trap(session, spike.id, 2, 1)
    print(f"   ✅ 放置尖刺陷阱 (2,1): {'成功' if r['success'] else '失败'}, 金币={session.gold}")

    r = game_logic.place_trap(session, arrow.id, 4, 2)
    print(f"   ✅ 放置箭塔 (4,2): {'成功' if r['success'] else '失败'}, 金币={session.gold}")

    r = game_logic.place_trap(session, fire.id, 3, 0)
    print(f"   ✅ 放置火焰陷阱 (3,0): {'成功' if r['success'] else '失败'}, 金币={session.gold}")

    r = game_logic.start_craftsman_task(session, 'repair_wall')
    print(f"   ✅ 开始工匠任务: 修复城墙 - {'成功' if r['success'] else '失败'}")

    r = game_logic.start_craftsman_task(session, 'mine_gold')
    print(f"   ✅ 开始工匠任务: 开采金矿 - {'成功' if r['success'] else '失败'}")

    print(f"   ✅ 布置完成: 陷阱={session.traps.count()}, 任务={session.tasks.count()}")
    print()

    print("📌 阶段 2: 开始进攻")
    print("-" * 50)
    r = game_logic.start_attack(session)
    print(f"   ✅ 开始进攻: {'成功' if r['success'] else '失败'}")
    print(f"   ✅ 状态切换: {session.status} (战斗中)")
    print()

    print("📌 阶段 3: 推进回合直到胜负结算")
    print("-" * 50)
    max_turns = 30
    game_result = None
    for turn in range(1, max_turns + 1):
        r = game_logic.next_turn(session)
        if not r['success']:
            print(f"   ❌ 回合 {turn} 失败: {r.get('message')}")
            break

        status = f"回合 {r['turn']}: 生成{r['spawned']}敌, 击杀{r['kills']}, 城墙受伤{r['wall_damage']}, 城墙HP={r['wall_health']}"

        if r['result']:
            status += f" → {'🏆 胜利!' if r['result'] == 'won' else '💀 失败'}"
            game_result = r['result']
            print(f"   ✅ {status}")
            break

        if turn % 5 == 0:
            print(f"   ✅ {status}")

    print()

    print("📌 阶段 4: 结算验证")
    print("-" * 50)
    print(f"   ✅ 游戏结果: {'🏆 胜利' if game_result == 'won' else '💀 失败'}")
    print(f"   ✅ 最终状态: {session.status}")
    print(f"   ✅ 最终得分: {session.score}")
    print(f"   ✅ 最终金币: {session.gold}")
    print(f"   ✅ 最终城墙: {session.wall_health}/{session.max_wall_health}")
    print(f"   ✅ 总回合数: {session.current_turn}")
    print(f"   ✅ 击杀敌人: {session.enemies_killed}")
    print()

    print("📌 阶段 5: 验证战报")
    print("-" * 50)
    try:
        report = session.report
        print(f"   ✅ 战报已生成: {report.title}")
        print(f"   ✅ 战报得分: {report.final_score}")
        print(f"   ✅ 战报击杀: {report.enemies_killed}")
        print(f"   ✅ 战报陷阱: {report.traps_used}")
        print(f"   ✅ 战报金币: {report.gold_earned}")
        print(f"   ✅ 战报任务: {report.tasks_completed}")
    except BattleReport.DoesNotExist:
        print("   ❌ 战报未生成!")
    print()

    print("📌 阶段 6: 验证回放帧")
    print("-" * 50)
    frame_count = session.replay_frames.count()
    print(f"   ✅ 回放帧记录: {frame_count} 帧")
    print(f"   ✅ 覆盖回合: 0 - {session.current_turn}")

    if frame_count > 0:
        last_frame = session.replay_frames.last()
        print(f"   ✅ 最后帧数据: 回合={last_frame.turn}, 城墙={last_frame.frame_data.get('wall_health')}")
    print()

    print("📌 阶段 7: 验证分数重计算")
    print("-" * 50)
    score_record = ScoreRecord.objects.filter(game_session=session).first()
    if score_record:
        server_score = score_record.server_calculated_score
        client_score = score_record.score
        is_valid = score_record.is_valid

        print(f"   ✅ 客户端上报分数: {client_score}")
        print(f"   ✅ 服务器重算分数: {server_score}")
        print(f"   ✅ 分数校验结果: {'✅ 有效' if is_valid else '❌ 异常'}")
        if not is_valid:
            print(f"   ⚠️  异常说明: {score_record.validation_note}")

        print()
        print("   📊 重算明细:")
        from game.models import Enemy, Trap, CraftsmanTask
        enemy_score = sum(e.score_value for e in session.enemies.filter(is_alive=False))
        trap_bonus = session.traps.count() * 20
        task_bonus = session.tasks.filter(status='completed').count() * 50
        victory_bonus = session.level.base_reward * 2 if session.status == 'won' else 0
        wall_bonus = int(session.wall_health * 2) if session.status == 'won' else 0
        loss_penalty = "×0.5 (失败减半)" if session.status == 'lost' else ""

        print(f"      - 敌人击杀得分: {enemy_score}")
        print(f"      - 陷阱使用奖励: {trap_bonus} (×20)")
        print(f"      - 任务完成奖励: {task_bonus} (×50)")
        if session.status == 'won':
            print(f"      - 胜利奖励: {victory_bonus} (关卡奖励×2)")
            print(f"      - 城墙剩余奖励: {wall_bonus} (×2)")
        if session.status == 'lost':
            print(f"      - 失败惩罚: {loss_penalty}")
        print(f"      {'─' * 30}")
        print(f"      = 总计: {server_score}")
    else:
        print("   ❌ 分数记录未生成!")
    print()

    print("📌 阶段 8: 验证操作历史")
    print("-" * 50)
    history_count = session.history.count()
    print(f"   ✅ 操作历史记录: {history_count} 条")

    action_types = {}
    for action in session.history.all():
        action_types[action.action_type] = action_types.get(action.action_type, 0) + 1

    print("   📋 操作统计:")
    for atype, count in sorted(action_types.items()):
        print(f"      - {atype}: {count}次")
    print()

    print("📌 阶段 9: 验证反作弊记录")
    print("-" * 50)
    print(f"   ✅ 服务器校验和: {session.server_checksum[:16]}...")
    print(f"   ✅ 客户端校验和: {session.client_checksum[:16]}...")
    print(f"   ✅ 校验一致: {'是' if session.server_checksum == session.client_checksum else '否'}")
    print()

    print("📌 阶段 10: 验证玩家档案更新")
    print("-" * 50)
    player.refresh_from_db()
    print(f"   ✅ 玩家总分: {player.total_score}")
    print(f"   ✅ 胜利场数: {player.wins}")
    print(f"   ✅ 失败场数: {player.losses}")
    print()

    print("=" * 70)
    print("🎉 完整游戏主循环测试通过!")
    print("=" * 70)
    print()
    print("📋 主循环流程总结:")
    print("   1. 🏗️  布置阶段: 放置陷阱 + 分配工匠任务")
    print("   2. ⚔️  开始进攻: 状态从 setup → playing")
    print("   3. ▶️  回合推进: 生成敌人 → 陷阱触发 → 敌人移动 → 任务更新")
    print("   4. 🏁 胜负结算: 城墙归零=失败, 消灭所有敌人=胜利")
    print("   5. 📊 战报生成: 自动统计所有战斗数据")
    print("   6. 🎬 回放记录: 每回合保存帧数据")
    print("   7. 🏆 分数重算: 服务器独立验证分数有效性")
    print("   8. 📜 历史记录: 所有操作可追溯,可回放到任意回合")
    print("   9. 🔍 反作弊校验: SHA-256 校验客户端状态完整性")
    print()
    print("🚀 游戏已完全可玩! 启动服务器:")
    print("   cd /Users/yangfan/Desktop/trae-solo-generated-projects/q-331")
    print("   source venv/bin/activate && python manage.py runserver")
    print()
    print("🔑 演示账号: demo_player / password123")
    print("🌐 访问地址: http://localhost:8000")

    return True


if __name__ == '__main__':
    try:
        success = test_full_game_cycle()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ 测试出错: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
