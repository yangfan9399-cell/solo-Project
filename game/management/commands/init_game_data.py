from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from game.models import (
    Level, TrapType, PlayerProfile, GameSession, Enemy,
    Trap, ScoreRecord, ActionHistory
)
from game import game_logic
import json


class Command(BaseCommand):
    help = 'Initialize game data: levels, trap types, and sample sessions'

    def handle(self, *args, **options):
        self.stdout.write('Initializing game data...')

        trap_types_data = [
            {
                'name': '尖刺陷阱',
                'description': '地面尖刺，对经过的敌人造成中等伤害',
                'cost': 20,
                'damage': 15,
                'range': 0,
                'cooldown': 1,
                'emoji': '⚔️',
                'color': '#ef4444',
            },
            {
                'name': '箭塔',
                'description': '远程箭塔，可以攻击前方2格内的敌人',
                'cost': 40,
                'damage': 20,
                'range': 2,
                'cooldown': 2,
                'emoji': '🏹',
                'color': '#3b82f6',
            },
            {
                'name': '投石车',
                'description': '重型投石车，范围攻击前方3格内的所有敌人',
                'cost': 60,
                'damage': 35,
                'range': 3,
                'cooldown': 3,
                'emoji': '🪨',
                'color': '#8b5cf6',
            },
            {
                'name': '火焰陷阱',
                'description': '喷射火焰，对敌人造成高伤害，冷却较慢',
                'cost': 50,
                'damage': 30,
                'range': 1,
                'cooldown': 3,
                'emoji': '🔥',
                'color': '#f97316',
            },
            {
                'name': '冰冻陷阱',
                'description': '冰冻陷阱，伤害较低但能减速敌人',
                'cost': 35,
                'damage': 10,
                'range': 1,
                'cooldown': 2,
                'emoji': '❄️',
                'color': '#06b6d4',
            },
        ]

        for t_data in trap_types_data:
            TrapType.objects.update_or_create(
                name=t_data['name'],
                defaults=t_data
            )
        self.stdout.write('Created 5 trap types')

        levels_data = [
            {
                'number': 1,
                'name': '前哨站',
                'description': '新手关卡，少量步兵进攻，熟悉游戏机制',
                'enemy_waves': [
                    {'turn': 1, 'enemies': [{'type': 'grunt', 'count': 2}]},
                    {'turn': 3, 'enemies': [{'type': 'grunt', 'count': 3}]},
                    {'turn': 5, 'enemies': [{'type': 'grunt', 'count': 3}, {'type': 'fast', 'count': 1}]},
                ],
                'base_reward': 50,
                'difficulty': 1.0,
                'unlocked': True,
            },
            {
                'number': 2,
                'name': '边境防线',
                'description': '敌人增加了快骑兵，需要更合理的陷阱布局',
                'enemy_waves': [
                    {'turn': 1, 'enemies': [{'type': 'grunt', 'count': 3}]},
                    {'turn': 3, 'enemies': [{'type': 'fast', 'count': 2}]},
                    {'turn': 5, 'enemies': [{'type': 'grunt', 'count': 3}, {'type': 'fast', 'count': 2}]},
                    {'turn': 7, 'enemies': [{'type': 'tank', 'count': 1}]},
                ],
                'base_reward': 80,
                'difficulty': 1.3,
                'unlocked': True,
            },
            {
                'number': 3,
                'name': '重装来袭',
                'description': '大量重装兵进攻，城墙面临巨大压力',
                'enemy_waves': [
                    {'turn': 1, 'enemies': [{'type': 'grunt', 'count': 2}, {'type': 'fast', 'count': 2}]},
                    {'turn': 3, 'enemies': [{'type': 'tank', 'count': 2}]},
                    {'turn': 5, 'enemies': [{'type': 'grunt', 'count': 4}, {'type': 'tank', 'count': 1}]},
                    {'turn': 7, 'enemies': [{'type': 'fast', 'count': 3}, {'type': 'tank', 'count': 2}]},
                    {'turn': 9, 'enemies': [{'type': 'tank', 'count': 3}]},
                ],
                'base_reward': 120,
                'difficulty': 1.6,
                'unlocked': True,
            },
            {
                'number': 4,
                'name': 'BOSS战',
                'description': '敌方首领亲自上阵，带领大军攻城！',
                'enemy_waves': [
                    {'turn': 1, 'enemies': [{'type': 'grunt', 'count': 3}, {'type': 'fast', 'count': 2}]},
                    {'turn': 3, 'enemies': [{'type': 'tank', 'count': 2}, {'type': 'fast', 'count': 2}]},
                    {'turn': 5, 'enemies': [{'type': 'grunt', 'count': 4}, {'type': 'tank', 'count': 2}]},
                    {'turn': 7, 'enemies': [{'type': 'fast', 'count': 4}, {'type': 'tank', 'count': 2}]},
                    {'turn': 10, 'enemies': [{'type': 'boss', 'count': 1}, {'type': 'grunt', 'count': 3}]},
                ],
                'base_reward': 200,
                'difficulty': 2.0,
                'unlocked': True,
            },
            {
                'number': 5,
                'name': '终极防线',
                'description': '混合兵种持续进攻，考验你的策略和资源管理',
                'enemy_waves': [
                    {'turn': 1, 'enemies': [{'type': 'grunt', 'count': 4}]},
                    {'turn': 2, 'enemies': [{'type': 'fast', 'count': 3}]},
                    {'turn': 4, 'enemies': [{'type': 'tank', 'count': 2}]},
                    {'turn': 5, 'enemies': [{'type': 'grunt', 'count': 3}, {'type': 'fast', 'count': 3}]},
                    {'turn': 7, 'enemies': [{'type': 'tank', 'count': 3}, {'type': 'fast', 'count': 2}]},
                    {'turn': 9, 'enemies': [{'type': 'boss', 'count': 1}]},
                    {'turn': 10, 'enemies': [{'type': 'grunt', 'count': 4}, {'type': 'tank', 'count': 2}]},
                    {'turn': 12, 'enemies': [{'type': 'boss', 'count': 1}, {'type': 'fast', 'count': 3}]},
                ],
                'base_reward': 300,
                'difficulty': 2.5,
                'unlocked': True,
            },
        ]

        for l_data in levels_data:
            Level.objects.update_or_create(
                number=l_data['number'],
                defaults=l_data
            )
        self.stdout.write('Created 5 levels')

        sample_user, created = User.objects.get_or_create(
            username='demo_player',
            defaults={'email': 'demo@example.com'}
        )
        if created:
            sample_user.set_password('password123')
            sample_user.save()

        demo_profile, created = PlayerProfile.objects.get_or_create(
            user=sample_user,
            defaults={
                'display_name': '演示玩家',
                'gold': 150,
                'total_score': 0,
                'wins': 0,
                'losses': 0,
                'current_level': 1,
            }
        )

        self.stdout.write('Created demo player account')

        existing_sessions = GameSession.objects.filter(player=demo_profile).count()
        if existing_sessions == 0:
            self.create_sample_sessions(demo_profile)
            self.stdout.write('Created sample game sessions with history')
        else:
            self.stdout.write('Sample sessions already exist, skipping')

        self.stdout.write(self.style.SUCCESS('Game data initialization complete!'))
        self.stdout.write('Demo account: demo_player / password123')

    def create_sample_sessions(self, player):
        level1 = Level.objects.get(number=1)
        spike_trap = TrapType.objects.get(name='尖刺陷阱')
        arrow_trap = TrapType.objects.get(name='箭塔')

        session1 = GameSession.objects.create(
            player=player,
            level=level1,
            status='won',
            current_turn=8,
            wall_health=65,
            max_wall_health=100,
            gold=120,
            score=180,
            enemies_killed=8,
        )

        Trap.objects.create(
            game_session=session1,
            trap_type=spike_trap,
            position_x=3,
            position_y=1,
            last_triggered=5,
            is_active=True,
        )
        Trap.objects.create(
            game_session=session1,
            trap_type=arrow_trap,
            position_x=5,
            position_y=2,
            last_triggered=6,
            is_active=True,
        )

        enemy_types = ['grunt', 'grunt', 'grunt', 'fast', 'grunt', 'grunt', 'grunt', 'fast']
        for i, et in enumerate(enemy_types):
            stats = game_logic.ENEMY_STATS[et]
            Enemy.objects.create(
                game_session=session1,
                enemy_type=et,
                health=0,
                max_health=stats['health'],
                speed=stats['speed'],
                damage=stats['damage'],
                position_x=9,
                position_y=i % 5,
                spawn_turn=(i // 2) + 1,
                is_alive=False,
                path_index=9,
                score_value=stats['score'],
                gold_value=stats['gold'],
            )

        actions = [
            (0, 'place_trap', {'trap_type': '尖刺陷阱', 'x': 3, 'y': 1, 'cost': 20}),
            (0, 'place_trap', {'trap_type': '箭塔', 'x': 5, 'y': 2, 'cost': 40}),
            (0, 'start_attack', {'message': '敌人开始进攻！'}),
            (1, 'next_turn', {'turn': 1}),
            (1, 'enemy_move', {'enemy_type': 'grunt', 'new_x': 1, 'y': 0}),
            (1, 'enemy_move', {'enemy_type': 'grunt', 'new_x': 1, 'y': 1}),
            (2, 'next_turn', {'turn': 2}),
            (2, 'enemy_move', {'enemy_type': 'grunt', 'new_x': 2, 'y': 0}),
            (2, 'trigger_trap', {'trap_type': '尖刺陷阱', 'x': 3, 'y': 1, 'enemies_hit': 1}),
            (3, 'next_turn', {'turn': 3}),
            (3, 'wall_damage', {'enemy_type': 'grunt', 'damage': 10}),
            (3, 'trigger_trap', {'trap_type': '箭塔', 'x': 5, 'y': 2, 'enemies_hit': 2}),
            (5, 'next_turn', {'turn': 5}),
            (5, 'wall_damage', {'enemy_type': 'fast', 'damage': 8}),
            (5, 'complete_task', {'task_name': '修复城墙', 'reward_gold': 0, 'reward_score': 30}),
            (8, 'next_turn', {'turn': 8}),
        ]

        for turn, action_type, details in actions:
            ActionHistory.objects.create(
                game_session=session1,
                turn=turn,
                action_type=action_type,
                details=details,
            )

        for turn in range(0, 9):
            game_logic.save_replay_frame(session1)

        score1 = ScoreRecord.objects.create(
            player=player,
            level=level1,
            game_session=session1,
            score=180,
            gold_earned=20,
        )
        score1.recalculate_score()

        level2 = Level.objects.get(number=2)
        session2 = GameSession.objects.create(
            player=player,
            level=level2,
            status='lost',
            current_turn=6,
            wall_health=0,
            max_wall_health=100,
            gold=80,
            score=95,
            enemies_killed=5,
        )

        Trap.objects.create(
            game_session=session2,
            trap_type=spike_trap,
            position_x=4,
            position_y=0,
            last_triggered=4,
            is_active=True,
        )

        enemy_types2 = ['grunt', 'grunt', 'grunt', 'fast', 'fast', 'tank']
        for i, et in enumerate(enemy_types2):
            stats = game_logic.ENEMY_STATS[et]
            alive = i >= 4
            Enemy.objects.create(
                game_session=session2,
                enemy_type=et,
                health=stats['health'] if alive else 0,
                max_health=stats['health'],
                speed=stats['speed'],
                damage=stats['damage'],
                position_x=9 if alive else 8,
                position_y=i % 5,
                spawn_turn=(i // 2) + 1,
                is_alive=alive,
                path_index=8,
                score_value=stats['score'],
                gold_value=stats['gold'],
            )

        actions2 = [
            (0, 'place_trap', {'trap_type': '尖刺陷阱', 'x': 4, 'y': 0, 'cost': 20}),
            (0, 'start_attack', {'message': '敌人开始进攻！'}),
            (1, 'next_turn', {'turn': 1}),
            (2, 'next_turn', {'turn': 2}),
            (3, 'next_turn', {'turn': 3}),
            (3, 'wall_damage', {'enemy_type': 'grunt', 'damage': 20}),
            (4, 'next_turn', {'turn': 4}),
            (4, 'trigger_trap', {'trap_type': '尖刺陷阱', 'x': 4, 'y': 0, 'enemies_hit': 1}),
            (4, 'wall_damage', {'enemy_type': 'fast', 'damage': 16}),
            (5, 'next_turn', {'turn': 5}),
            (5, 'wall_damage', {'enemy_type': 'fast', 'damage': 8}),
            (6, 'next_turn', {'turn': 6}),
            (6, 'wall_damage', {'enemy_type': 'tank', 'damage': 40}),
        ]

        for turn, action_type, details in actions2:
            ActionHistory.objects.create(
                game_session=session2,
                turn=turn,
                action_type=action_type,
                details=details,
            )

        for turn in range(0, 7):
            game_logic.save_replay_frame(session2)

        score2 = ScoreRecord.objects.create(
            player=player,
            level=level2,
            game_session=session2,
            score=95,
            gold_earned=0,
        )
        score2.recalculate_score()

        player.wins = 1
        player.losses = 1
        player.total_score = score1.score + score2.score
        player.gold = 150 + max(0, session1.gold - 100) + max(0, int((session2.gold - 100) * 0.3))
        player.current_level = 2
        player.save()

        self.generate_mock_scores()

    def generate_mock_scores(self):
        mock_names = ['城堡守卫者', '铁血战士', '暗夜游侠', '圣光骑士', '暴风领主']
        trap_types = list(TrapType.objects.all())
        levels = list(Level.objects.all())

        for i, name in enumerate(mock_names):
            user, _ = User.objects.get_or_create(username=f'player_{i+1}')
            if not hasattr(user, 'profile'):
                profile = PlayerProfile.objects.create(
                    user=user,
                    display_name=name,
                    gold=200 + i * 50,
                    total_score=300 + i * 150,
                    wins=2 + i,
                    losses=i,
                    current_level=min(3 + i, 5),
                )
            else:
                profile = user.profile

            for j, level in enumerate(levels[:min(3 + i, 5)]):
                session = GameSession.objects.create(
                    player=profile,
                    level=level,
                    status='won',
                    current_turn=10 + j,
                    wall_health=50 + j * 10,
                    max_wall_health=100,
                    gold=100 + j * 20,
                    score=150 + j * 80 + i * 30,
                    enemies_killed=6 + j * 2,
                )

                for k in range(2 + j):
                    Trap.objects.create(
                        game_session=session,
                        trap_type=trap_types[k % len(trap_types)],
                        position_x=2 + k,
                        position_y=k % 5,
                        last_triggered=8,
                        is_active=True,
                    )

                for k in range(6 + j * 2):
                    stats = game_logic.ENEMY_STATS['grunt']
                    Enemy.objects.create(
                        game_session=session,
                        enemy_type='grunt',
                        health=0,
                        max_health=stats['health'],
                        position_x=9,
                        position_y=k % 5,
                        spawn_turn=1,
                        is_alive=False,
                        score_value=stats['score'],
                        gold_value=stats['gold'],
                    )

                sr = ScoreRecord.objects.create(
                    player=profile,
                    level=level,
                    game_session=session,
                    score=150 + j * 80 + i * 30,
                    gold_earned=j * 20,
                )
                sr.recalculate_score()

                for turn in range(0, 12 + j):
                    game_logic.save_replay_frame(session)

            profile.total_score = sum(
                sr.score for sr in ScoreRecord.objects.filter(player=profile)
            )
            profile.wins = GameSession.objects.filter(player=profile, status='won').count()
            profile.losses = GameSession.objects.filter(player=profile, status='lost').count()
            profile.save()
