"""
Django 视图层 - API 接口
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from .models import (
    Player, Level, GameSession, Order,
    ActionHistory, Settlement
)
from .game_logic import GameEngine
from .settlement import SettlementCalculator


def _json_response(data, status=200):
    return JsonResponse(data, status=status, json_dumps_params={'ensure_ascii': False})


def _get_session_data(session):
    return {
        'id': session.id,
        'player': session.player.nickname,
        'level_id': session.level.id,
        'level_number': session.level.level_number,
        'level_name': session.level.name,
        'level': {
            'id': session.level.id,
            'level_number': session.level.level_number,
            'name': session.level.name,
            'target_score': session.level.target_score,
            'time_limit': session.level.time_limit,
            'station_count': session.level.station_count,
            'carriages_count': session.level.carriages_count,
            'difficulty': session.level.difficulty
        },
        'status': session.status,
        'score': session.score,
        'money': session.money,
        'orders_completed': session.orders_completed,
        'orders_failed': session.orders_failed,
        'current_time': session.current_time,
        'current_station': session.current_station,
        'start_time': session.start_time.isoformat() if session.start_time else None,
        'end_time': session.end_time.isoformat() if session.end_time else None
    }


@csrf_exempt
@require_http_methods(['POST'])
def api_register(request):
    """玩家注册"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        nickname = data.get('nickname', '').strip()

        if not username or not password:
            return _json_response({'success': False, 'message': '用户名和密码不能为空'}, 400)

        if Player.objects.filter(username=username).exists():
            return _json_response({'success': False, 'message': '用户名已存在'}, 400)

        player = Player.objects.create_user(
            username=username,
            password=password,
            nickname=nickname or username
        )

        return _json_response({
            'success': True,
            'message': '注册成功',
            'player': {
                'id': player.id,
                'username': player.username,
                'nickname': player.nickname,
                'avatar': player.avatar
            }
        })
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_login(request):
    """玩家登录"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()

        player = authenticate(request, username=username, password=password)
        if player is not None:
            login(request, player)
            player.last_login_at = timezone.now()
            player.save()

            return _json_response({
                'success': True,
                'message': '登录成功',
                'player': {
                    'id': player.id,
                    'username': player.username,
                    'nickname': player.nickname,
                    'avatar': player.avatar,
                    'total_score': player.total_score,
                    'games_played': player.games_played,
                    'games_won': player.games_won,
                    'highest_level': player.highest_level
                }
            })
        else:
            return _json_response({'success': False, 'message': '用户名或密码错误'}, 401)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_logout(request):
    """玩家登出"""
    logout(request)
    return _json_response({'success': True, 'message': '已登出'})


@require_http_methods(['GET'])
def api_current_player(request):
    """获取当前玩家信息"""
    if request.user.is_authenticated:
        player = request.user
        return _json_response({
            'success': True,
            'player': {
                'id': player.id,
                'username': player.username,
                'nickname': player.nickname,
                'avatar': player.avatar,
                'total_score': player.total_score,
                'games_played': player.games_played,
                'games_won': player.games_won,
                'highest_level': player.highest_level
            }
        })
    return _json_response({'success': False, 'message': '未登录'}, 401)


@require_http_methods(['GET'])
def api_levels(request):
    """获取所有关卡列表"""
    levels = Level.objects.filter(is_active=True).order_by('level_number')
    unlocked_level = request.user.highest_level if request.user.is_authenticated else 1

    levels_data = []
    for level in levels:
        stations = list(level.stations.values('id', 'name', 'arrival_time', 'departure_time'))
        carriages = list(level.carriages.values('id', 'name', 'carriage_number', 'distance_from_kitchen', 'carriage_type'))

        levels_data.append({
            'id': level.id,
            'level_number': level.level_number,
            'name': level.name,
            'description': level.description,
            'difficulty': level.difficulty,
            'target_score': level.target_score,
            'time_limit': level.time_limit,
            'station_count': level.station_count,
            'carriages_count': level.carriages_count,
            'unlocked': level.level_number <= unlocked_level,
            'stations': stations,
            'carriages': carriages
        })

    return _json_response({'success': True, 'levels': levels_data})


@csrf_exempt
@require_http_methods(['POST'])
def api_start_game(request):
    """开始新游戏"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        data = json.loads(request.body)
        level_id = data.get('level_id')

        if not level_id:
            return _json_response({'success': False, 'message': '请选择关卡'}, 400)

        try:
            level = Level.objects.get(id=level_id, is_active=True)
        except Level.DoesNotExist:
            return _json_response({'success': False, 'message': '关卡不存在'}, 404)

        if level.level_number > request.user.highest_level:
            return _json_response({'success': False, 'message': '关卡未解锁'}, 403)

        active_session = GameSession.objects.filter(
            player=request.user,
            status__in=['playing', 'paused']
        ).first()
        if active_session:
            return _json_response({
                'success': False,
                'message': '存在进行中的游戏',
                'session_id': active_session.id
            }, 409)

        session = GameSession.objects.create(
            player=request.user,
            level=level,
            status='playing'
        )

        engine = GameEngine(session)
        engine.tick(0)

        return _json_response({
            'success': True,
            'message': '游戏开始',
            'session': _get_session_data(session),
            'game_state': engine.get_game_state()
        })
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@require_http_methods(['GET'])
def api_game_state(request, session_id):
    """获取游戏状态"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)

    engine = GameEngine(session)
    return _json_response({
        'success': True,
        'session': _get_session_data(session),
        'game_state': engine.get_game_state()
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_game_tick(request, session_id):
    """游戏时间推进"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        if session.status != 'playing':
            return _json_response({'success': False, 'message': '游戏已结束'}, 400)

        data = json.loads(request.body)
        delta = data.get('delta', 1)

        engine = GameEngine(session)
        game_over, result = engine.tick(delta)

        response = {
            'success': True,
            'game_state': engine.get_game_state(),
            'game_over': game_over
        }

        if game_over:
            session.status = 'won' if result.get('won', False) else 'lost'
            session.end_time = timezone.now()
            session.save()

            calculator = SettlementCalculator(session)
            settlement = calculator.recalculate_all()
            report = calculator.generate_daily_report()

            response['result'] = result
            response['settlement'] = report

        return _json_response(response)
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_start_preparation(request, session_id):
    """开始备料"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        if session.status != 'playing':
            return _json_response({'success': False, 'message': '游戏已结束'}, 400)

        data = json.loads(request.body)
        order_id = data.get('order_id')

        engine = GameEngine(session)
        result = engine.start_preparation(order_id)

        return _json_response({
            'success': result['success'],
            'message': result['message'],
            'game_state': engine.get_game_state()
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_start_delivery(request, session_id):
    """开始配送"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        if session.status != 'playing':
            return _json_response({'success': False, 'message': '游戏已结束'}, 400)

        data = json.loads(request.body)
        order_id = data.get('order_id')

        engine = GameEngine(session)
        result = engine.start_delivery(order_id)

        return _json_response({
            'success': result['success'],
            'message': result['message'],
            'game_state': engine.get_game_state()
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_pause_game(request, session_id):
    """暂停游戏"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        if session.status != 'playing':
            return _json_response({'success': False, 'message': '游戏状态不正确'}, 400)

        session.status = 'paused'
        session.save()

        return _json_response({
            'success': True,
            'message': '游戏已暂停',
            'session': _get_session_data(session)
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_resume_game(request, session_id):
    """恢复游戏"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        if session.status != 'paused':
            return _json_response({'success': False, 'message': '游戏状态不正确'}, 400)

        session.status = 'playing'
        session.save()

        engine = GameEngine(session)
        return _json_response({
            'success': True,
            'message': '游戏已恢复',
            'session': _get_session_data(session),
            'game_state': engine.get_game_state()
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_restore_game(request, session_id):
    """从操作历史恢复游戏状态"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)

        engine = GameEngine(session)
        restored_state = engine.restore_from_history()

        return _json_response({
            'success': True,
            'message': '游戏状态已恢复',
            'game_state': engine.get_game_state()
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_abandon_game(request, session_id):
    """放弃游戏"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        if session.status not in ['playing', 'paused']:
            return _json_response({'success': False, 'message': '游戏状态不正确'}, 400)

        session.status = 'abandoned'
        session.end_time = timezone.now()
        session.save()

        return _json_response({
            'success': True,
            'message': '已放弃游戏',
            'session': _get_session_data(session)
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@require_http_methods(['GET'])
def api_game_history(request):
    """获取玩家游戏历史"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        sessions = GameSession.objects.filter(
            player=request.user
        ).select_related('level').order_by('-start_time')[:20]

        history = []
        for session in sessions:
            settlement = Settlement.objects.filter(session=session).first()
            history.append({
                'session_id': session.id,
                'level_number': session.level.level_number,
                'level_name': session.level.name,
                'status': session.status,
                'score': session.score,
                'final_score': settlement.final_score if settlement else session.score,
                'stars': settlement.star_rating if settlement else 0,
                'orders_completed': session.orders_completed,
                'orders_failed': session.orders_failed,
                'start_time': session.start_time.isoformat(),
                'end_time': session.end_time.isoformat() if session.end_time else None
            })

        return _json_response({
            'success': True,
            'history': history
        })
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@require_http_methods(['GET'])
def api_get_settlement(request, session_id):
    """获取结算报告（后端重新计算）"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)

        calculator = SettlementCalculator(session)
        report = calculator.generate_daily_report()

        return _json_response({
            'success': True,
            'settlement': report
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_verify_score(request, session_id):
    """验证分数（防作弊）"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        data = json.loads(request.body)
        client_score = data.get('client_score', 0)

        calculator = SettlementCalculator(session)
        verification = calculator.verify_score(client_score)

        return _json_response({
            'success': True,
            'verification': verification
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@csrf_exempt
@require_http_methods(['POST'])
def api_update_profile(request):
    """更新玩家档案"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        data = json.loads(request.body)
        nickname = data.get('nickname')
        avatar = data.get('avatar')

        player = request.user
        if nickname:
            player.nickname = nickname
        if avatar:
            player.avatar = avatar
        player.save()

        return _json_response({
            'success': True,
            'message': '资料已更新',
            'player': {
                'id': player.id,
                'nickname': player.nickname,
                'avatar': player.avatar
            }
        })
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@require_http_methods(['GET'])
def api_get_action_history(request, session_id):
    """获取操作历史（用于恢复和审计）"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        session = GameSession.objects.get(id=session_id, player=request.user)
        actions = ActionHistory.objects.filter(
            session=session
        ).order_by('sequence').values(
            'id', 'action_type', 'action_data', 'game_time', 'sequence', 'timestamp'
        )

        return _json_response({
            'success': True,
            'actions': list(actions)
        })
    except GameSession.DoesNotExist:
        return _json_response({'success': False, 'message': '游戏不存在'}, 404)
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)


@require_http_methods(['GET'])
def api_player_stats(request):
    """获取玩家统计数据"""
    if not request.user.is_authenticated:
        return _json_response({'success': False, 'message': '请先登录'}, 401)

    try:
        player = request.user
        sessions = GameSession.objects.filter(player=player)

        total_orders = 0
        total_failed = 0
        total_perfect = 0
        total_late = 0

        settlements = Settlement.objects.filter(session__player=player)
        for s in settlements:
            total_orders += s.orders_completed
            total_failed += s.orders_failed
            total_perfect += s.perfect_orders
            total_late += s.late_orders

        from django.db.models import Avg, Sum
        avg_score = settlements.aggregate(
            avg=Avg('final_score')
        )['avg'] or 0

        total_score = settlements.aggregate(
            sum=Sum('final_score')
        )['sum'] or 0

        total_games = sessions.count()
        games_won = sessions.filter(status='won').count()
        win_rate = (games_won / total_games * 100) if total_games > 0 else 0

        highest_level_session = sessions.filter(status='won').order_by('-level__level_number').first()
        highest_level = highest_level_session.level.level_number if highest_level_session else 0

        stats = {
            'total_games': total_games,
            'games_won': games_won,
            'win_rate': round(win_rate, 1),
            'total_score': total_score,
            'avg_score': round(avg_score, 0),
            'highest_level': highest_level,
            'total_orders': total_orders,
            'total_failed': total_failed,
            'total_perfect': total_perfect,
            'total_late': total_late,
            'order_success_rate': round(
                total_orders / max(1, total_orders + total_failed) * 100, 1
            ) if (total_orders + total_failed) > 0 else 0
        }

        return _json_response({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return _json_response({'success': False, 'message': str(e)}, 500)
