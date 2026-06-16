import json
import random
from .models import (
    GameSession, Trap, Enemy, CraftsmanTask, ActionHistory,
    TrapType, BattleReport, ReplayFrame, ScoreRecord
)
from django.utils import timezone

GRID_WIDTH = 10
GRID_HEIGHT = 5
WALL_POSITION_X = GRID_WIDTH - 1

ENEMY_STATS = {
    'grunt': {'health': 30, 'speed': 1, 'damage': 10, 'score': 10, 'gold': 5},
    'fast': {'health': 20, 'speed': 2, 'damage': 8, 'score': 15, 'gold': 8},
    'tank': {'health': 80, 'speed': 0.5, 'damage': 20, 'score': 25, 'gold': 15},
    'boss': {'health': 200, 'speed': 0.5, 'damage': 30, 'score': 100, 'gold': 50},
}


def get_enemy_path(y):
    path = []
    for x in range(GRID_WIDTH):
        path.append((x, y))
    return path


def create_new_session(player, level):
    session = GameSession.objects.create(
        player=player,
        level=level,
        status='setup',
        current_turn=0,
        wall_health=100,
        max_wall_health=100,
        gold=100,
        score=0,
        enemies_killed=0,
    )
    ActionHistory.objects.create(
        game_session=session,
        turn=0,
        action_type='start_attack',
        details={'level': level.number, 'player': player.display_name}
    )
    save_replay_frame(session)
    return session


def place_trap(session, trap_type_id, x, y):
    if session.status != 'setup' and session.status != 'playing':
        return {'success': False, 'message': '游戏已结束'}
    if x < 0 or x >= WALL_POSITION_X or y < 0 or y >= GRID_HEIGHT:
        return {'success': False, 'message': '位置无效'}
    trap_type = TrapType.objects.get(id=trap_type_id)
    if session.gold < trap_type.cost:
        return {'success': False, 'message': '金币不足'}
    existing = Trap.objects.filter(game_session=session, position_x=x, position_y=y).exists()
    if existing:
        return {'success': False, 'message': '该位置已有陷阱'}
    trap = Trap.objects.create(
        game_session=session,
        trap_type=trap_type,
        position_x=x,
        position_y=y,
    )
    session.gold -= trap_type.cost
    session.save()
    ActionHistory.objects.create(
        game_session=session,
        turn=session.current_turn,
        action_type='place_trap',
        details={'trap_type': trap_type.name, 'x': x, 'y': y, 'cost': trap_type.cost}
    )
    save_replay_frame(session)
    return {'success': True, 'trap': trap, 'remaining_gold': session.gold}


def remove_trap(session, trap_id):
    if session.status not in ['setup', 'playing']:
        return {'success': False, 'message': '游戏已结束'}
    try:
        trap = Trap.objects.get(id=trap_id, game_session=session)
        refund = int(trap.trap_type.cost * 0.5)
        session.gold += refund
        session.save()
        x, y = trap.position_x, trap.position_y
        trap_name = trap.trap_type.name
        trap.delete()
        ActionHistory.objects.create(
            game_session=session,
            turn=session.current_turn,
            action_type='remove_trap',
            details={'trap_type': trap_name, 'x': x, 'y': y, 'refund': refund}
        )
        save_replay_frame(session)
        return {'success': True, 'refund': refund, 'remaining_gold': session.gold}
    except Trap.DoesNotExist:
        return {'success': False, 'message': '陷阱不存在'}


def start_craftsman_task(session, task_name):
    if session.status not in ['setup', 'playing']:
        return {'success': False, 'message': '游戏已结束'}
    task_templates = {
        'repair_wall': {
            'name': '修复城墙',
            'description': '工匠花费2回合修复城墙，恢复25点生命值',
            'required_gold': 30,
            'duration_turns': 2,
            'reward_gold': 0,
            'reward_score': 30,
            'reward_trap_type': None,
        },
        'build_arrow_trap': {
            'name': '建造箭塔',
            'description': '工匠花费3回合建造一个免费的箭塔陷阱',
            'required_gold': 20,
            'duration_turns': 3,
            'reward_gold': 0,
            'reward_score': 50,
            'reward_trap_type': '箭塔',
        },
        'mine_gold': {
            'name': '开采金矿',
            'description': '工匠花费2回合开采金矿，获得50金币',
            'required_gold': 10,
            'duration_turns': 2,
            'reward_gold': 50,
            'reward_score': 20,
            'reward_trap_type': None,
        },
        'forge_spike': {
            'name': '锻造尖刺',
            'description': '工匠花费4回合建造一个免费的尖刺陷阱',
            'required_gold': 25,
            'duration_turns': 4,
            'reward_gold': 0,
            'reward_score': 60,
            'reward_trap_type': '尖刺陷阱',
        },
    }
    template = task_templates.get(task_name)
    if not template:
        return {'success': False, 'message': '任务不存在'}
    if session.gold < template['required_gold']:
        return {'success': False, 'message': '金币不足'}
    active_tasks = CraftsmanTask.objects.filter(
        game_session=session,
        status__in=['pending', 'in_progress']
    ).count()
    if active_tasks >= 2:
        return {'success': False, 'message': '最多同时进行2个任务'}
    session.gold -= template['required_gold']
    session.save()
    reward_trap = None
    if template['reward_trap_type']:
        try:
            reward_trap = TrapType.objects.get(name=template['reward_trap_type'])
        except TrapType.DoesNotExist:
            pass
    task = CraftsmanTask.objects.create(
        game_session=session,
        name=template['name'],
        description=template['description'],
        required_gold=template['required_gold'],
        duration_turns=template['duration_turns'],
        start_turn=session.current_turn,
        end_turn=session.current_turn + template['duration_turns'],
        status='in_progress',
        reward_gold=template['reward_gold'],
        reward_score=template['reward_score'],
        reward_trap_type=reward_trap,
    )
    ActionHistory.objects.create(
        game_session=session,
        turn=session.current_turn,
        action_type='start_task',
        details={'task_id': task.id, 'task_name': task.name, 'cost': template['required_gold']}
    )
    save_replay_frame(session)
    return {'success': True, 'task': task}


def update_craftsman_tasks(session):
    completed_tasks = []
    tasks = CraftsmanTask.objects.filter(
        game_session=session,
        status='in_progress'
    )
    for task in tasks:
        if session.current_turn >= task.end_turn:
            task.status = 'completed'
            task.save()
            session.gold += task.reward_gold
            session.score += task.reward_score
            if task.reward_trap_type:
                available_slot = find_available_slot(session)
                if available_slot:
                    Trap.objects.create(
                        game_session=session,
                        trap_type=task.reward_trap_type,
                        position_x=available_slot[0],
                        position_y=available_slot[1],
                    )
            completed_tasks.append(task)
            ActionHistory.objects.create(
                game_session=session,
                turn=session.current_turn,
                action_type='complete_task',
                details={
                    'task_id': task.id,
                    'task_name': task.name,
                    'reward_gold': task.reward_gold,
                    'reward_score': task.reward_score,
                    'reward_trap': task.reward_trap_type.name if task.reward_trap_type else None,
                }
            )
    session.save()
    return completed_tasks


def find_available_slot(session):
    occupied = set(Trap.objects.filter(game_session=session).values_list('position_x', 'position_y'))
    for y in range(GRID_HEIGHT):
        for x in range(GRID_WIDTH - 2, 0, -1):
            if (x, y) not in occupied:
                return (x, y)
    return None


def start_attack(session):
    if session.status != 'setup':
        return {'success': False, 'message': '已经开始进攻了'}
    session.status = 'playing'
    session.save()
    ActionHistory.objects.create(
        game_session=session,
        turn=session.current_turn,
        action_type='start_attack',
        details={'message': '敌人开始进攻！'}
    )
    save_replay_frame(session)
    return {'success': True}


def spawn_enemies(session):
    waves = session.level.enemy_waves
    turn = session.current_turn
    spawned = []
    for wave in waves:
        if wave['turn'] == turn:
            for spawn in wave['enemies']:
                enemy_type = spawn['type']
                count = spawn['count']
                for i in range(count):
                    stats = ENEMY_STATS[enemy_type]
                    y = (i + turn) % GRID_HEIGHT
                    enemy = Enemy.objects.create(
                        game_session=session,
                        enemy_type=enemy_type,
                        health=stats['health'],
                        max_health=stats['health'],
                        speed=stats['speed'],
                        damage=stats['damage'],
                        position_x=0,
                        position_y=y,
                        spawn_turn=turn,
                        is_alive=True,
                        path_index=0,
                        score_value=stats['score'],
                        gold_value=stats['gold'],
                    )
                    spawned.append(enemy)
    return spawned


def move_enemies(session):
    enemies = Enemy.objects.filter(game_session=session, is_alive=True)
    wall_damage = 0
    moved = []
    for enemy in enemies:
        path = get_enemy_path(enemy.position_y)
        current_idx = enemy.path_index
        new_x = enemy.position_x + enemy.speed
        if new_x >= WALL_POSITION_X:
            wall_damage += enemy.damage
            enemy.is_alive = False
            enemy.position_x = WALL_POSITION_X
            ActionHistory.objects.create(
                game_session=session,
                turn=session.current_turn,
                action_type='wall_damage',
                details={
                    'enemy_type': enemy.enemy_type,
                    'damage': enemy.damage,
                    'enemy_id': enemy.id,
                }
            )
        else:
            enemy.position_x = new_x
            enemy.path_index = min(int(new_x), len(path) - 1)
            ActionHistory.objects.create(
                game_session=session,
                turn=session.current_turn,
                action_type='enemy_move',
                details={
                    'enemy_id': enemy.id,
                    'enemy_type': enemy.enemy_type,
                    'new_x': new_x,
                    'y': enemy.position_y,
                }
            )
        enemy.save()
        moved.append(enemy)
    if wall_damage > 0:
        session.wall_health -= wall_damage
        session.save()
    return moved, wall_damage


def trigger_traps(session):
    traps = Trap.objects.filter(game_session=session, is_active=True)
    enemies = Enemy.objects.filter(game_session=session, is_alive=True)
    triggered = []
    kills = 0
    for trap in traps:
        if session.current_turn - trap.last_triggered < trap.trap_type.cooldown:
            continue
        enemies_in_range = [
            e for e in enemies
            if e.is_alive and abs(e.position_x - trap.position_x) <= trap.trap_type.range
            and e.position_y == trap.position_y
        ]
        if enemies_in_range:
            for enemy in enemies_in_range:
                enemy.health -= trap.trap_type.damage
                ActionHistory.objects.create(
                    game_session=session,
                    turn=session.current_turn,
                    action_type='enemy_damage',
                    details={
                        'enemy_id': enemy.id,
                        'enemy_type': enemy.enemy_type,
                        'damage': trap.trap_type.damage,
                        'trap_type': trap.trap_type.name,
                        'old_health': enemy.health + trap.trap_type.damage,
                        'new_health': enemy.health,
                    }
                )
                if enemy.health <= 0:
                    enemy.is_alive = False
                    session.score += enemy.score_value
                    session.gold += enemy.gold_value
                    session.enemies_killed += 1
                    kills += 1
                enemy.save()
            trap.last_triggered = session.current_turn
            trap.save()
            triggered.append(trap)
            ActionHistory.objects.create(
                game_session=session,
                turn=session.current_turn,
                action_type='trigger_trap',
                details={
                    'trap_id': trap.id,
                    'trap_type': trap.trap_type.name,
                    'x': trap.position_x,
                    'y': trap.position_y,
                    'enemies_hit': len(enemies_in_range),
                }
            )
    session.save()
    return triggered, kills


def check_game_end(session):
    if session.wall_health <= 0:
        session.status = 'lost'
        session.completed_at = timezone.now()
        session.save()
        generate_battle_report(session)
        create_score_record(session)
        return 'lost'
    enemies = Enemy.objects.filter(game_session=session, is_alive=True)
    if not enemies.exists():
        waves = session.level.enemy_waves
        max_turn = max(w['turn'] for w in waves) if waves else 0
        if session.current_turn > max_turn + 5:
            session.status = 'won'
            session.completed_at = timezone.now()
            session.save()
            generate_battle_report(session)
            create_score_record(session)
            return 'won'
    return None


def next_turn(session):
    if session.status != 'playing':
        return {'success': False, 'message': '游戏不在进行中'}
    session.current_turn += 1
    session.save()
    ActionHistory.objects.create(
        game_session=session,
        turn=session.current_turn,
        action_type='next_turn',
        details={'turn': session.current_turn}
    )
    spawned = spawn_enemies(session)
    for enemy in spawned:
        ActionHistory.objects.create(
            game_session=session,
            turn=session.current_turn,
            action_type='enemy_move',
            details={
                'enemy_id': enemy.id,
                'enemy_type': enemy.enemy_type,
                'x': 0,
                'y': enemy.position_y,
                'spawned': True,
            }
        )
    update_craftsman_tasks(session)
    triggered, kills = trigger_traps(session)
    moved, wall_damage = move_enemies(session)
    result = check_game_end(session)
    save_replay_frame(session)
    return {
        'success': True,
        'turn': session.current_turn,
        'spawned': len(spawned),
        'kills': kills,
        'wall_damage': wall_damage,
        'wall_health': session.wall_health,
        'result': result,
    }


def generate_battle_report(session):
    enemy_stats = ENEMY_STATS
    total_enemies = session.enemies.count()
    killed = session.enemies_killed
    traps_used = session.traps.count()
    tasks_completed = session.tasks.filter(status='completed').count()
    damage_to_wall = session.max_wall_health - session.wall_health
    gold_earned = session.gold - 100
    is_victory = session.status == 'won'
    title = f"{'🏆 胜利!' if is_victory else '💀 失败'} - 第 {session.level.number} 关"
    summary_lines = [
        f"玩家: {session.player.display_name}",
        f"关卡: {session.level.name}",
        f"回合数: {session.current_turn}",
        f"击杀敌人: {killed}/{total_enemies}",
        f"城墙损伤: {damage_to_wall}/{session.max_wall_health}",
        f"使用陷阱: {traps_used}",
        f"完成任务: {tasks_completed}",
        f"最终得分: {session.score}",
        f"金币收益: {max(0, gold_earned)}",
    ]
    summary = '\n'.join(summary_lines)
    log_entries = []
    for action in session.history.all().order_by('turn', 'timestamp'):
        log_entries.append({
            'turn': action.turn,
            'type': action.action_type,
            'details': action.details,
            'time': action.timestamp.isoformat(),
        })
    report = BattleReport.objects.create(
        game_session=session,
        title=title,
        summary=summary,
        detailed_log=log_entries,
        final_score=session.score,
        gold_earned=max(0, gold_earned),
        enemies_killed=killed,
        traps_used=traps_used,
        tasks_completed=tasks_completed,
        damage_to_wall=damage_to_wall,
    )
    if is_victory:
        session.player.wins += 1
        session.player.gold += max(0, gold_earned)
    else:
        session.player.losses += 1
        session.player.gold += max(0, int(gold_earned * 0.3))
    session.player.total_score += session.score
    if is_victory and session.player.current_level == session.level.number:
        session.player.current_level += 1
    session.player.save()
    return report


def create_score_record(session):
    score_record = ScoreRecord.objects.create(
        player=session.player,
        level=session.level,
        game_session=session,
        score=session.score,
        gold_earned=max(0, session.gold - 100),
    )
    score_record.recalculate_score()
    return score_record


def save_replay_frame(session):
    frame_data = {
        'turn': session.current_turn,
        'status': session.status,
        'wall_health': session.wall_health,
        'max_wall_health': session.max_wall_health,
        'gold': session.gold,
        'score': session.score,
        'enemies_killed': session.enemies_killed,
        'traps': [
            {
                'id': t.id,
                'type': t.trap_type.name,
                'x': t.position_x,
                'y': t.position_y,
                'color': t.trap_type.color,
                'emoji': t.trap_type.emoji,
            }
            for t in session.traps.filter(is_active=True)
        ],
        'enemies': [
            {
                'id': e.id,
                'type': e.enemy_type,
                'health': e.health,
                'max_health': e.max_health,
                'x': e.position_x,
                'y': e.position_y,
                'is_alive': e.is_alive,
            }
            for e in session.enemies.all()
        ],
        'tasks': [
            {
                'id': t.id,
                'name': t.name,
                'status': t.status,
                'progress': session.current_turn - t.start_turn,
                'total': t.duration_turns,
            }
            for t in session.tasks.filter(status__in=['pending', 'in_progress'])
        ],
    }
    ReplayFrame.objects.create(
        game_session=session,
        turn=session.current_turn,
        frame_data=frame_data,
    )
    return frame_data


def validate_client_state(session, client_state):
    server_checksum = session.generate_server_checksum()
    client_checksum = client_state.get('checksum', '')
    is_valid = server_checksum == client_checksum
    if not is_valid:
        ActionHistory.objects.create(
            game_session=session,
            turn=session.current_turn,
            action_type='next_turn',
            details={
                'message': '反作弊校验失败',
                'client_checksum': client_checksum,
                'server_checksum': server_checksum,
            }
        )
    session.client_checksum = client_checksum
    session.server_checksum = server_checksum
    session.save()
    return {
        'valid': is_valid,
        'server_checksum': server_checksum,
        'expected': {
            'turn': session.current_turn,
            'wall_health': session.wall_health,
            'gold': session.gold,
            'score': session.score,
        }
    }


def resume_session_from_history(session, target_turn):
    history = session.history.filter(turn__lte=target_turn).order_by('turn', 'timestamp')
    replay_state = {
        'turn': 0,
        'wall_health': session.max_wall_health,
        'gold': 100,
        'score': 0,
        'traps': [],
        'enemies': [],
        'tasks': [],
    }
    for action in history:
        if action.action_type == 'place_trap':
            replay_state['traps'].append({
                'x': action.details['x'],
                'y': action.details['y'],
                'type': action.details['trap_type'],
            })
            replay_state['gold'] -= action.details['cost']
        elif action.action_type == 'remove_trap':
            replay_state['traps'] = [
                t for t in replay_state['traps']
                if not (t['x'] == action.details['x'] and t['y'] == action.details['y'])
            ]
            replay_state['gold'] += action.details['refund']
        elif action.action_type == 'wall_damage':
            replay_state['wall_health'] -= action.details['damage']
        elif action.action_type == 'enemy_damage':
            if action.details['new_health'] <= 0:
                replay_state['score'] += action.details.get('score_value', 10)
                replay_state['gold'] += action.details.get('gold_value', 5)
        elif action.action_type == 'complete_task':
            replay_state['gold'] += action.details['reward_gold']
            replay_state['score'] += action.details['reward_score']
        replay_state['turn'] = action.turn
    return replay_state
