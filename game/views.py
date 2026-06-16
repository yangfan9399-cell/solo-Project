import uuid
import json
from datetime import datetime
from django.utils import timezone
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_http_methods
from django.db import transaction
from django.contrib.auth.decorators import login_required

from .models import *
from .game_engine import QuantumWarehouseEngine, serialize_state, deserialize_state


_anonymous_profiles = {}


def get_or_create_player(request):
    if request.user.is_authenticated:
        profile, created = PlayerProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'nickname': request.user.username,
                'total_score': 0,
                'play_count': 0,
            }
        )
        return profile, False
    else:
        local_player_id = request.session.get('local_player_id')
        if local_player_id and local_player_id in _anonymous_profiles:
            return _anonymous_profiles[local_player_id], True
        local_player_id = str(uuid.uuid4())
        request.session['local_player_id'] = local_player_id
        anon_profile = type('AnonProfile', (), {
            'id': None,
            'nickname': f'游客_{local_player_id[:8]}',
            'total_score': 0,
            'play_count': 0,
            'user_id': None,
            'is_anonymous': True,
            'pk': None,
            'save': lambda *a, **kw: None,
        })()
        _anonymous_profiles[local_player_id] = anon_profile
        return anon_profile, True


def _is_anon(profile):
    return getattr(profile, 'is_anonymous', False) or profile.id is None


def _player_info(profile):
    return {
        'id': profile.id,
        'nickname': profile.nickname,
        'total_score': profile.total_score,
        'play_count': profile.play_count,
        'is_anonymous': _is_anon(profile),
    }


@require_http_methods(['GET'])
def index(request):
    player, is_anon = get_or_create_player(request)
    levels = Level.objects.all()
    level_list = []
    for level in levels:
        best = None
        if not _is_anon(player):
            best = GameResult.objects.filter(
                session__player=player,
                session__level=level,
                is_passed=True,
            ).order_by('final_score').first()
        level_list.append({
            'id': level.id,
            'name': level.name,
            'difficulty': level.difficulty,
            'best_steps': level.best_steps,
            'best_score': best.final_score if best else None,
        })

    recent_sessions = []
    if not _is_anon(player):
        recent = GameSession.objects.filter(player=player).order_by('-start_time')[:5]
        for s in recent:
            result = getattr(s, 'result', None)
            recent_sessions.append({
                'id': s.id,
                'level_name': s.level.name,
                'status': s.status,
                'score': result.final_score if result else None,
                'start_time': s.start_time.isoformat(),
            })

    context = {
        'player': _player_info(player),
        'levels': level_list,
        'recent_sessions': recent_sessions,
    }
    return render(request, 'game/index.html', context)


@require_http_methods(['GET', 'POST'])
def start_game(request, level_id):
    player, is_anon = get_or_create_player(request)
    level = get_object_or_404(Level, id=level_id)

    if _is_anon(player):
        session_id = str(uuid.uuid4())
        engine = QuantumWarehouseEngine(level.grid_data)
        state = engine.get_state()
        state_data = serialize_state(state)

        if not hasattr(start_game, '_anon_sessions'):
            start_game._anon_sessions = {}
        start_game._anon_sessions[session_id] = {
            'level_id': level.id,
            'player_nickname': player.nickname,
            'status': 'playing',
            'current_steps': 0,
            'start_time': timezone.now().isoformat(),
            'actions': [],
            'initial_state': state_data,
        }

        response_data = {
            'success': True,
            'session_id': session_id,
            'level_id': level.id,
            'level_name': level.name,
            'state': state_data,
            'is_anonymous': True,
        }
        if request.method == 'POST' or request.META.get('HTTP_ACCEPT', '').find('application/json') != -1:
            return JsonResponse(response_data)
        return redirect('game:game_play', session_id=session_id)

    with transaction.atomic():
        game_session = GameSession.objects.create(
            player=player,
            level=level,
            status='playing',
            current_steps=0,
        )
        engine = QuantumWarehouseEngine(level.grid_data)
        state = engine.get_state()
        state_data = serialize_state(state)

        GameAction.objects.create(
            session=game_session,
            action_number=0,
            action_type='move',
            direction=None,
            state_before=state_data,
            state_after=state_data,
            is_valid=True,
        )

    response_data = {
        'success': True,
        'session_id': game_session.id,
        'level_id': level.id,
        'level_name': level.name,
        'state': state_data,
        'is_anonymous': False,
    }
    if request.method == 'POST' or request.META.get('HTTP_ACCEPT', '').find('application/json') != -1:
        return JsonResponse(response_data)
    return redirect('game:game_play', session_id=game_session.id)


@require_http_methods(['GET'])
def game_play(request, session_id):
    player, is_anon = get_or_create_player(request)

    anon_session = None
    game_session = None

    if hasattr(start_game, '_anon_sessions') and session_id in start_game._anon_sessions:
        anon_session = start_game._anon_sessions[session_id]
    else:
        try:
            sid = int(session_id)
        except (ValueError, TypeError):
            raise Http404('无效的session_id')
        game_session = get_object_or_404(GameSession, id=sid)
        if not _is_anon(player) and game_session.player_id != player.id:
            return JsonResponse({'success': False, 'message': '无权访问此游戏'}, status=403)

    if anon_session:
        level_id = anon_session['level_id']
        level = Level.objects.get(id=level_id)
        last_state = anon_session['initial_state']
        if anon_session['actions']:
            last_state = anon_session['actions'][-1]['state_after']
        ctx = {
            'session_id': session_id,
            'level': {
                'id': level.id,
                'name': level.name,
                'difficulty': level.difficulty,
                'best_steps': level.best_steps,
            },
            'initial_state': last_state,
            'status': anon_session['status'],
            'current_steps': anon_session['current_steps'],
            'player': _player_info(player),
            'is_anonymous': True,
        }
    else:
        level = game_session.level
        last_action = game_session.actions.order_by('-action_number').first()
        initial_state = last_action.state_after if last_action else None
        ctx = {
            'session_id': game_session.id,
            'level': {
                'id': level.id,
                'name': level.name,
                'difficulty': level.difficulty,
                'best_steps': level.best_steps,
            },
            'initial_state': initial_state,
            'status': game_session.status,
            'current_steps': game_session.current_steps,
            'player': _player_info(player),
            'is_anonymous': False,
        }
    return render(request, 'game/game_play.html', ctx)


@require_http_methods(['POST'])
def api_move(request, session_id):
    try:
        body = json.loads(request.body) if request.body else {}
    except (json.JSONDecodeError, ValueError):
        body = {}
    direction = body.get('direction') or request.POST.get('direction')

    if not direction:
        return JsonResponse({
            'success': False,
            'message': '缺少direction参数',
            'state': None,
            'is_win': False,
            'is_deadlock': False,
            'action_id': None,
        }, status=400)

    if direction not in ('up', 'down', 'left', 'right'):
        return JsonResponse({
            'success': False,
            'message': f'无效方向: {direction}',
            'state': None,
            'is_win': False,
            'is_deadlock': False,
            'action_id': None,
        }, status=400)

    player, is_anon_player = get_or_create_player(request)

    anon_session = None
    game_session = None

    if hasattr(start_game, '_anon_sessions') and session_id in start_game._anon_sessions:
        anon_session = start_game._anon_sessions[session_id]
    else:
        try:
            sid = int(session_id)
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': '无效的session_id',
                'state': None,
                'is_win': False,
                'is_deadlock': False,
                'action_id': None,
            }, status=404)
        game_session = get_object_or_404(GameSession, id=sid)
        if not _is_anon(player) and game_session.player_id != player.id:
            return JsonResponse({
                'success': False,
                'message': '无权访问此游戏',
                'state': None,
                'is_win': False,
                'is_deadlock': False,
                'action_id': None,
            }, status=403)

    if anon_session:
        if anon_session['status'] != 'playing':
            return JsonResponse({
                'success': False,
                'message': '游戏已结束，无法移动',
                'state': anon_session['actions'][-1]['state_after'] if anon_session['actions'] else anon_session['initial_state'],
                'is_win': anon_session['status'] == 'won',
                'is_deadlock': anon_session['status'] == 'lost',
                'action_id': None,
            })

        level = Level.objects.get(id=anon_session['level_id'])
        engine = QuantumWarehouseEngine(level.grid_data)
        if anon_session['actions']:
            last_state = anon_session['actions'][-1]['state_after']
        else:
            last_state = anon_session['initial_state']
        engine.load_state(deserialize_state(last_state))

        ok, msg, state_before, state_after = engine.move(direction)
        sb = serialize_state(state_before)
        sa = serialize_state(state_after)
        is_win = engine.check_win()
        is_deadlock = engine.is_deadlock() and not is_win

        action_id = None
        if ok:
            next_num = len(anon_session['actions']) + 1
            action_record = {
                'action_number': next_num,
                'action_type': 'move',
                'direction': direction,
                'state_before': sb,
                'state_after': sa,
                'is_valid': True,
            }
            anon_session['actions'].append(action_record)
            action_id = next_num
            anon_session['current_steps'] = len([a for a in anon_session['actions'] if a['action_type'] == 'move' and a['is_valid']])
            if is_win:
                anon_session['status'] = 'won'
            elif is_deadlock:
                anon_session['status'] = 'lost'

        return JsonResponse({
            'success': ok,
            'message': msg,
            'state': sa,
            'is_win': is_win,
            'is_deadlock': is_deadlock,
            'action_id': action_id,
        })

    if game_session.status != 'playing':
        last_action = game_session.actions.order_by('-action_number').first()
        return JsonResponse({
            'success': False,
            'message': '游戏已结束，无法移动',
            'state': last_action.state_after if last_action else None,
            'is_win': game_session.status == 'won',
            'is_deadlock': game_session.status == 'lost',
            'action_id': None,
        })

    level = game_session.level
    engine = QuantumWarehouseEngine(level.grid_data)

    last_action = game_session.actions.order_by('-action_number').first()
    if last_action:
        engine.load_state(deserialize_state(last_action.state_after))

    ok, msg, state_before, state_after = engine.move(direction)
    sb = serialize_state(state_before)
    sa = serialize_state(state_after)
    is_win = engine.check_win()
    is_deadlock = engine.is_deadlock() and not is_win

    action_id = None
    if ok:
        with transaction.atomic():
            next_num = (game_session.actions.aggregate(models.Max('action_number'))['action_number__max'] or 0) + 1
            new_action = GameAction.objects.create(
                session=game_session,
                action_number=next_num,
                action_type='move',
                direction=direction,
                state_before=sb,
                state_after=sa,
                is_valid=True,
            )
            action_id = new_action.id

            game_session.current_steps = game_session.actions.filter(
                action_type='move',
                is_valid=True,
            ).count()
            game_session.save(update_fields=['current_steps'])

            if is_win:
                game_session.status = 'won'
                game_session.end_time = timezone.now()
                game_session.save(update_fields=['status', 'end_time'])
            elif is_deadlock:
                game_session.status = 'lost'
                game_session.end_time = timezone.now()
                game_session.save(update_fields=['status', 'end_time'])

    return JsonResponse({
        'success': ok,
        'message': msg,
        'state': sa,
        'is_win': is_win,
        'is_deadlock': is_deadlock,
        'action_id': action_id,
    })


@require_http_methods(['POST'])
def api_undo(request, session_id):
    player, is_anon_player = get_or_create_player(request)

    anon_session = None
    game_session = None

    if hasattr(start_game, '_anon_sessions') and session_id in start_game._anon_sessions:
        anon_session = start_game._anon_sessions[session_id]
    else:
        try:
            sid = int(session_id)
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': '无效的session_id',
                'state': None,
                'undo_count': 0,
            }, status=404)
        game_session = get_object_or_404(GameSession, id=sid)
        if not _is_anon(player) and game_session.player_id != player.id:
            return JsonResponse({
                'success': False,
                'message': '无权访问此游戏',
                'state': None,
                'undo_count': 0,
            }, status=403)

    if anon_session:
        if anon_session['status'] != 'playing':
            last = anon_session['actions'][-1]['state_after'] if anon_session['actions'] else anon_session['initial_state']
            undo_count = len([a for a in anon_session['actions'] if a['action_type'] == 'undo'])
            return JsonResponse({
                'success': False,
                'message': '游戏已结束，无法撤销',
                'state': last,
                'undo_count': undo_count,
            })

        move_actions = [a for a in anon_session['actions'] if a['action_type'] == 'move' and a['is_valid']]
        if not move_actions:
            undo_count = len([a for a in anon_session['actions'] if a['action_type'] == 'undo'])
            return JsonResponse({
                'success': False,
                'message': '没有可撤销的步骤',
                'state': anon_session['actions'][-1]['state_after'] if anon_session['actions'] else anon_session['initial_state'],
                'undo_count': undo_count,
            })

        level = Level.objects.get(id=anon_session['level_id'])
        engine = QuantumWarehouseEngine(level.grid_data)
        last_valid_move = move_actions[-1]
        target_state = last_valid_move['state_before']
        engine.load_state(deserialize_state(target_state))
        engine.undos += 1
        current_state = serialize_state(engine.get_state())

        next_num = len(anon_session['actions']) + 1
        anon_session['actions'].append({
            'action_number': next_num,
            'action_type': 'undo',
            'direction': None,
            'state_before': last_valid_move['state_after'],
            'state_after': current_state,
            'is_valid': True,
        })

        undo_count = len([a for a in anon_session['actions'] if a['action_type'] == 'undo'])
        return JsonResponse({
            'success': True,
            'message': '撤销成功',
            'state': current_state,
            'undo_count': undo_count,
        })

    if game_session.status != 'playing':
        last_action = game_session.actions.order_by('-action_number').first()
        undo_count = game_session.actions.filter(action_type='undo').count()
        return JsonResponse({
            'success': False,
            'message': '游戏已结束，无法撤销',
            'state': last_action.state_after if last_action else None,
            'undo_count': undo_count,
        })

    valid_moves = game_session.actions.filter(action_type='move', is_valid=True).order_by('-action_number')
    if not valid_moves.exists():
        undo_count = game_session.actions.filter(action_type='undo').count()
        last_action = game_session.actions.order_by('-action_number').first()
        return JsonResponse({
            'success': False,
            'message': '没有可撤销的步骤',
            'state': last_action.state_after if last_action else None,
            'undo_count': undo_count,
        })

    last_valid_move = valid_moves.first()
    target_state_data = last_valid_move.state_before

    level = game_session.level
    engine = QuantumWarehouseEngine(level.grid_data)
    engine.load_state(deserialize_state(target_state_data))
    engine.undos += 1
    current_state = serialize_state(engine.get_state())

    with transaction.atomic():
        next_num = (game_session.actions.aggregate(models.Max('action_number'))['action_number__max'] or 0) + 1
        GameAction.objects.create(
            session=game_session,
            action_number=next_num,
            action_type='undo',
            direction=None,
            state_before=last_valid_move.state_after,
            state_after=current_state,
            is_valid=True,
        )

        game_session.current_steps = game_session.actions.filter(
            action_type='move',
            is_valid=True,
        ).count()
        game_session.save(update_fields=['current_steps'])

    undo_count = game_session.actions.filter(action_type='undo').count()
    return JsonResponse({
        'success': True,
        'message': '撤销成功',
        'state': current_state,
        'undo_count': undo_count,
    })


@require_http_methods(['GET'])
def api_replay(request, session_id):
    player, is_anon_player = get_or_create_player(request)

    anon_session = None
    game_session = None

    if hasattr(start_game, '_anon_sessions') and session_id in start_game._anon_sessions:
        anon_session = start_game._anon_sessions[session_id]
    else:
        try:
            sid = int(session_id)
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': '无效的session_id',
                'actions': [],
            }, status=404)
        game_session = get_object_or_404(GameSession, id=sid)
        if not _is_anon(player) and game_session.player_id != player.id:
            return JsonResponse({
                'success': False,
                'message': '无权访问此游戏',
                'actions': [],
            }, status=403)

    if anon_session:
        actions_list = []
        initial_action = {
            'action_number': 0,
            'action_type': 'init',
            'direction': None,
            'state_before': anon_session['initial_state'],
            'state_after': anon_session['initial_state'],
            'is_valid': True,
        }
        actions_list.append(initial_action)
        for a in anon_session['actions']:
            actions_list.append({
                'action_number': a['action_number'],
                'action_type': a['action_type'],
                'direction': a['direction'],
                'state_before': a['state_before'],
                'state_after': a['state_after'],
                'is_valid': a['is_valid'],
            })
        return JsonResponse({
            'success': True,
            'actions': actions_list,
        })

    all_actions = game_session.actions.order_by('action_number')
    actions_list = []
    for a in all_actions:
        actions_list.append({
            'id': a.id,
            'action_number': a.action_number,
            'action_type': a.action_type,
            'direction': a.direction,
            'state_before': a.state_before,
            'state_after': a.state_after,
            'is_valid': a.is_valid,
            'timestamp': a.timestamp.isoformat() if a.timestamp else None,
        })
    return JsonResponse({
        'success': True,
        'actions': actions_list,
    })


@require_http_methods(['POST'])
def api_settle(request, session_id):
    player, is_anon_player = get_or_create_player(request)

    anon_session = None
    game_session = None

    if hasattr(start_game, '_anon_sessions') and session_id in start_game._anon_sessions:
        anon_session = start_game._anon_sessions[session_id]
    else:
        try:
            sid = int(session_id)
        except (ValueError, TypeError):
            return JsonResponse({
                'success': False,
                'message': '无效的session_id',
            }, status=404)
        game_session = get_object_or_404(GameSession, id=sid)
        if not _is_anon(player) and game_session.player_id != player.id:
            return JsonResponse({
                'success': False,
                'message': '无权访问此游戏',
            }, status=403)

    if anon_session:
        level = Level.objects.get(id=anon_session['level_id'])
        engine = QuantumWarehouseEngine(level.grid_data)

        move_count = 0
        collapse_count = 0
        undo_count = 0

        for a in anon_session['actions']:
            if a['action_type'] == 'move' and a['is_valid'] and a['direction']:
                ok, _, _, _ = engine.move(a['direction'])
                if ok:
                    move_count += 1
            elif a['action_type'] == 'undo':
                engine.undo()
                undo_count += 1

        collapse_count = engine.collapses
        moves_for_score = engine.moves
        is_passed = engine.check_win()

        if not is_passed and anon_session['status'] == 'playing':
            if engine.is_deadlock():
                anon_session['status'] = 'lost'

        base_best = level.best_steps if level.best_steps > 0 else max(moves_for_score, 1)
        server_score = engine.calculate_score(
            base_best_moves=base_best,
            actual_moves=moves_for_score,
            collapses=collapse_count,
            undos=undo_count,
        )

        if not is_passed:
            server_score = max(0, int(server_score * 0.3))

        final_score = server_score
        anon_session['status'] = 'won' if is_passed else 'lost'

        detail = {
            'is_anonymous': True,
            'base_score': 1000,
            'base_best_moves': base_best,
            'actual_moves': moves_for_score,
            'extra_moves_penalty': max(0, moves_for_score - base_best) * 10,
            'collapses_bonus': collapse_count * 50,
            'undos_penalty': undo_count * 20,
            'fail_penalty_applied': not is_passed,
            'collapse_count': collapse_count,
            'undo_count': undo_count,
            'steps_used': move_count,
        }

        return JsonResponse({
            'success': True,
            'message': '结算成功（匿名模式，未入库）',
            'result': {
                'session_id': session_id,
                'final_score': final_score,
                'server_score': server_score,
                'is_passed': is_passed,
                'steps_used': move_count,
                'collapse_count': collapse_count,
                'undo_count': undo_count,
                'detail': detail,
            },
        })

    level = game_session.level
    engine = QuantumWarehouseEngine(level.grid_data)

    move_count = 0
    collapse_count = 0
    undo_count = 0

    all_actions = game_session.actions.order_by('action_number')
    for a in all_actions:
        if a.action_number == 0:
            continue
        if a.action_type == 'move' and a.is_valid and a.direction:
            ok, _, _, _ = engine.move(a.direction)
            if ok:
                move_count += 1
        elif a.action_type == 'undo' and a.is_valid:
            engine.undo()
            undo_count += 1

    collapse_count = engine.collapses
    moves_for_score = engine.moves
    is_passed = engine.check_win()

    if not is_passed and game_session.status == 'playing':
        if engine.is_deadlock():
            game_session.status = 'lost'

    base_best = level.best_steps if level.best_steps > 0 else max(moves_for_score, 1)
    server_score = engine.calculate_score(
        base_best_moves=base_best,
        actual_moves=moves_for_score,
        collapses=collapse_count,
        undos=undo_count,
    )

    if not is_passed:
        server_score = max(0, int(server_score * 0.3))

    final_score = server_score

    detail = {
        'base_score': 1000,
        'base_best_moves': base_best,
        'actual_moves': moves_for_score,
        'extra_moves_penalty': max(0, moves_for_score - base_best) * 10,
        'collapses_bonus': collapse_count * 50,
        'undos_penalty': undo_count * 20,
        'fail_penalty_applied': not is_passed,
    }

    with transaction.atomic():
        if game_session.status == 'playing':
            game_session.status = 'won' if is_passed else 'lost'
            game_session.end_time = timezone.now()
            game_session.save(update_fields=['status', 'end_time'])

        result, created = GameResult.objects.update_or_create(
            session=game_session,
            defaults={
                'final_score': final_score,
                'server_score': server_score,
                'is_passed': is_passed,
                'steps_used': move_count,
                'collapse_count': collapse_count,
                'undo_count': undo_count,
                'detail': detail,
            }
        )

        if created or not _settle_updated_player(player.id, game_session.id):
            profile = PlayerProfile.objects.select_for_update().get(id=player.id)
            profile.total_score = models.F('total_score') + final_score
            profile.play_count = models.F('play_count') + 1
            profile.save()
            _mark_settle_updated(player.id, game_session.id)

    return JsonResponse({
        'success': True,
        'message': '结算成功',
        'result': {
            'session_id': game_session.id,
            'final_score': final_score,
            'server_score': server_score,
            'is_passed': is_passed,
            'steps_used': move_count,
            'collapse_count': collapse_count,
            'undo_count': undo_count,
            'detail': detail,
        },
    })


_settle_cache = set()


def _settle_updated_player(player_id, session_id):
    return (player_id, session_id) in _settle_cache


def _mark_settle_updated(player_id, session_id):
    _settle_cache.add((player_id, session_id))
