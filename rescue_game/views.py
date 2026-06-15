import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import (
    RescueSession, RescueNode, RescueDetail, RescueHistory, RescueResult,
    SeedSample, TerrainType, NodeType, WeatherType, GameStatus
)
from .game_logic import (
    GameEngine, create_session_from_seed, add_node_to_session,
    add_detail_to_session, recalculate_session_score
)


def index(request):
    seeds = SeedSample.objects.filter(is_active=True)
    sessions = RescueSession.objects.all().order_by('-created_at')[:10]
    context = {
        'seeds': seeds,
        'sessions': sessions,
    }
    return render(request, 'rescue_game/index.html', context)


def game_board(request, session_id):
    session = get_object_or_404(RescueSession, session_id=session_id)
    seed = None
    if session.seed_type:
        seed = SeedSample.objects.filter(seed_type=session.seed_type).first()

    context = {
        'session': session,
        'seed': seed,
    }
    return render(request, 'rescue_game/game_board.html', context)


def replay_view(request, session_id):
    session = get_object_or_404(RescueSession, session_id=session_id)
    histories = list(session.histories.all().order_by('step'))
    result = getattr(session, 'result', None)

    before_score = 0
    after_score = 0
    if result:
        after_score = result.final_score
        before_score = result.final_score * 0.7 if session.status == GameStatus.FAILED else result.final_score

    context = {
        'session': session,
        'histories': histories,
        'result': result,
        'before_score': round(before_score, 2),
        'after_score': round(after_score, 2),
    }
    return render(request, 'rescue_game/replay.html', context)


@csrf_exempt
def api_create_session(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        seed_type = data.get('seed_type')
        player_name = data.get('player_name', '玩家')

        seed = get_object_or_404(SeedSample, seed_type=seed_type)
        session = create_session_from_seed(seed, player_name)

        return JsonResponse({
            'success': True,
            'session_id': session.session_id,
            'status': session.status,
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_session_state(request, session_id):
    session = get_object_or_404(RescueSession, session_id=session_id)

    if request.method == 'GET':
        nodes = list(session.nodes.all().values(
            'id', 'node_type', 'node_id', 'x', 'y', 'terrain_type',
            'load_capacity', 'actual_load', 'is_valid', 'failure_reason',
            'order_index', 'properties'
        ))
        details = list(session.details.all().values(
            'id', 'detail_type', 'detail_id', 'x', 'y',
            'load_capacity', 'actual_load', 'efficiency', 'is_valid',
            'order_index', 'properties'
        ))
        histories = list(session.histories.all().order_by('step').values(
            'step', 'action', 'action_type', 'victim_x', 'victim_y',
            'weather', 'rope_tension', 'is_safe', 'remark'
        ))

        seed = None
        if session.seed_type:
            seed_obj = SeedSample.objects.filter(seed_type=session.seed_type).first()
            if seed_obj:
                seed = {
                    'victim_x': seed_obj.victim_x,
                    'victim_y': seed_obj.victim_y,
                    'target_x': seed_obj.target_x,
                    'target_y': seed_obj.target_y,
                    'terrain_map': seed_obj.terrain_map,
                    'weather_events': seed_obj.weather_events,
                }

        result = None
        if hasattr(session, 'result') and session.result:
            result = {
                'final_score': session.result.final_score,
                'safety_score': session.result.safety_score,
                'speed_score': session.result.speed_score,
                'technique_score': session.result.technique_score,
                'grade': session.result.grade,
                'evaluation': session.result.evaluation,
            }

        return JsonResponse({
            'success': True,
            'session': {
                'session_id': session.session_id,
                'status': session.status,
                'weather': session.weather,
                'terrain_type': session.terrain_type,
                'difficulty': session.difficulty,
                'total_score': session.total_score,
                'safety_score': session.safety_score,
            },
            'nodes': nodes,
            'details': details,
            'histories': histories,
            'seed': seed,
            'result': result,
        })

    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_add_node(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)

        node_type = data.get('node_type')
        x = float(data.get('x', 0))
        y = float(data.get('y', 0))
        terrain_type = data.get('terrain_type', TerrainType.ROCK)
        node_id = data.get('node_id')

        node = add_node_to_session(session, node_type, x, y, terrain_type, node_id)

        engine = GameEngine(session)
        engine.nodes = list(session.nodes.all())
        capacity = engine.calculate_node_load(node)
        node.load_capacity = capacity
        node.save()

        return JsonResponse({
            'success': True,
            'node': {
                'id': node.id,
                'node_type': node.node_type,
                'node_id': node.node_id,
                'x': node.x,
                'y': node.y,
                'terrain_type': node.terrain_type,
                'load_capacity': node.load_capacity,
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_add_detail(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)

        detail_type = data.get('detail_type')
        x = float(data.get('x', 0))
        y = float(data.get('y', 0))
        detail_id = data.get('detail_id')

        detail = add_detail_to_session(session, detail_type, x, y, detail_id)

        return JsonResponse({
            'success': True,
            'detail': {
                'id': detail.id,
                'detail_type': detail.detail_type,
                'detail_id': detail.detail_id,
                'x': detail.x,
                'y': detail.y,
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_remove_node(request, session_id, node_id):
    if request.method == 'DELETE':
        session = get_object_or_404(RescueSession, session_id=session_id)
        try:
            node = RescueNode.objects.get(session=session, node_id=node_id)
            node.delete()
            return JsonResponse({'success': True})
        except RescueNode.DoesNotExist:
            return JsonResponse({'success': False, 'error': '节点不存在'}, status=404)
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_start_game(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        session.status = GameStatus.PLAYING
        session.start_time = timezone.now()
        session.save()

        seed = None
        if session.seed_type:
            seed = SeedSample.objects.filter(seed_type=session.seed_type).first()

        if seed:
            init_history = RescueHistory(
                session=session,
                step=0,
                action='救援准备就绪',
                action_type='init',
                victim_x=seed.victim_x,
                victim_y=seed.victim_y,
                weather=session.weather,
                rope_tension=0,
                is_safe=True,
                remark='游戏开始，请布置救援节点',
            )
            init_history.save()

        return JsonResponse({
            'success': True,
            'status': session.status,
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_calculate_loads(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)
        victim_x = float(data.get('victim_x', 0))
        victim_y = float(data.get('victim_y', 0))

        engine = GameEngine(session)
        total_load = 0.75 + 0.8

        valid_nodes = [n for n in engine.nodes if n.is_valid]
        for node in valid_nodes:
            tension = engine.calculate_rope_tension(
                (node.x, node.y),
                (victim_x, victim_y),
                total_load / max(len(valid_nodes), 1)
            )
            node.actual_load = tension
            node.save()

        failures = engine.validate_nodes()

        return JsonResponse({
            'success': True,
            'failed_nodes': [
                {'node_id': n.node_id, 'reason': n.failure_reason}
                for n in failures
            ],
            'nodes': [
                {
                    'node_id': n.node_id,
                    'actual_load': n.actual_load,
                    'load_capacity': n.load_capacity,
                    'is_valid': n.is_valid,
                }
                for n in engine.nodes
            ]
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_weather_event(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)
        weather_type = data.get('weather_type')

        engine = GameEngine(session)
        engine.histories = list(session.histories.all().order_by('step'))
        engine.nodes = list(session.nodes.all())

        failures = engine.apply_weather_event(weather_type)

        return JsonResponse({
            'success': True,
            'weather': weather_type,
            'failed_nodes': [
                {'node_id': n.node_id, 'reason': n.failure_reason}
                for n in failures
            ],
            'can_rollback': len(engine.histories) > 1,
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_rollback(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)
        step = int(data.get('step', 0))

        engine = GameEngine(session)
        engine.histories = list(session.histories.all().order_by('step'))
        engine.nodes = list(session.nodes.all())

        success = engine.rollback_to_step(step)

        return JsonResponse({
            'success': success,
            'current_step': step,
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_complete_game(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)
        total_time = float(data.get('total_time', 0))
        success = data.get('success', True)

        if success:
            session.status = GameStatus.COMPLETED
        else:
            session.status = GameStatus.FAILED

        session.end_time = timezone.now()
        session.save()

        result = recalculate_session_score(session)

        return JsonResponse({
            'success': True,
            'status': session.status,
            'result': {
                'final_score': result.final_score,
                'safety_score': result.safety_score,
                'speed_score': result.speed_score,
                'technique_score': result.technique_score,
                'grade': result.grade,
                'evaluation': result.evaluation,
                'nodes_valid': result.nodes_valid,
                'nodes_failed': result.nodes_failed,
                'weather_events': result.weather_events,
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_recalculate_score(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        result = recalculate_session_score(session)

        return JsonResponse({
            'success': True,
            'result': {
                'final_score': result.final_score,
                'safety_score': result.safety_score,
                'speed_score': result.speed_score,
                'technique_score': result.technique_score,
                'grade': result.grade,
                'evaluation': result.evaluation,
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_seeds(request):
    if request.method == 'GET':
        seeds = SeedSample.objects.filter(is_active=True).values(
            'id', 'name', 'seed_type', 'description', 'terrain_type',
            'weather', 'difficulty', 'expected_outcome'
        )
        return JsonResponse({
            'success': True,
            'seeds': list(seeds),
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_execute_transfer(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(RescueSession, session_id=session_id)
        data = json.loads(request.body)

        start_x = float(data.get('start_x', 700))
        start_y = float(data.get('start_y', 150))
        end_x = float(data.get('end_x', 100))
        end_y = float(data.get('end_y', 400))
        steps = int(data.get('steps', 20))

        seed = None
        weather_events = []
        if session.seed_type:
            seed = SeedSample.objects.filter(seed_type=session.seed_type).first()
            if seed:
                try:
                    weather_events = json.loads(seed.weather_events.replace("'", '"'))
                except:
                    weather_events = []

        engine = GameEngine(session)

        result = engine.execute_full_transfer(
            start_x, start_y, end_x, end_y, steps, weather_events
        )

        return JsonResponse({
            'success': True,
            'transfer_success': result['success'],
            'total_steps': result['total_steps'],
            'steps': result['steps'],
            'stop_reason': result['stop_reason'],
            'final_safety_score': result['final_safety_score'],
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_get_transfer_step(request, session_id, step):
    if request.method == 'GET':
        session = get_object_or_404(RescueSession, session_id=session_id)

        try:
            history = RescueHistory.objects.get(session=session, step=step)
        except RescueHistory.DoesNotExist:
            return JsonResponse({'success': False, 'error': '步骤不存在'}, status=404)

        state_snapshot = history.get_state_snapshot()

        return JsonResponse({
            'success': True,
            'step': {
                'step': history.step,
                'action': history.action,
                'action_type': history.action_type,
                'victim_x': history.victim_x,
                'victim_y': history.victim_y,
                'weather': history.weather,
                'rope_tension': history.rope_tension,
                'is_safe': history.is_safe,
                'remark': history.remark,
                'timestamp': history.timestamp.isoformat(),
                'state_snapshot': state_snapshot,
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_score_analysis(request, session_id):
    if request.method == 'GET':
        session = get_object_or_404(RescueSession, session_id=session_id)

        engine = GameEngine(session)

        initial_safety_score = 0
        if session.nodes.exists():
            for n in session.nodes.all():
                n.actual_load = 0
                n.is_valid = True
                n.failure_reason = None
            for d in session.details.all():
                d.actual_load = 0
                d.is_valid = True
            initial_safety_score = engine.calculate_safety_score()

        final_safety_score = engine.calculate_safety_score()
        technique_score = engine.calculate_technique_score()

        before_score = round(initial_safety_score * 0.5 + technique_score * 0.3, 2)

        result = None
        after_score = 0
        if hasattr(session, 'result') and session.result:
            result = session.result
            after_score = result.final_score

        reasons = []
        valid_count = len([n for n in session.nodes.all() if n.is_valid])
        invalid_count = len([n for n in session.nodes.all() if not n.is_valid])
        if invalid_count > 0:
            reasons.append({
                'icon': '📈',
                'title': '节点有效性下降',
                'detail': f'救援过程中{invalid_count}个节点因受力过载失效，有效节点从{session.nodes.count()}降至{valid_count}个',
                'impact': f'-{round((invalid_count / max(session.nodes.count(), 1)) * 30, 1)}分'
            })

        weather_count = len([h for h in session.histories.all() if h.action_type == 'weather'])
        if weather_count > 0:
            reasons.append({
                'icon': '🌦️',
                'title': '天气事件影响',
                'detail': f'遭遇{weather_count}次天气事件，导致地形承力系数下降',
                'impact': f'-{weather_count * 5}分'
            })

        min_safety_factor = float('inf')
        for node in session.nodes.all():
            if node.actual_load > 0 and node.load_capacity > 0:
                sf = node.load_capacity / node.actual_load
                if sf < min_safety_factor:
                    min_safety_factor = sf
        if min_safety_factor < 3.0 and min_safety_factor != float('inf'):
            reasons.append({
                'icon': '⚖️',
                'title': '安全储备不足',
                'detail': f'最小安全系数仅{round(min_safety_factor, 2)}，目标为3.0，受力分布不均',
                'impact': f'-{round((3.0 - min_safety_factor) * 13, 1)}分'
            })

        pulley_count = len([d for d in session.details.all() if d.detail_type == 'pulley'])
        protection_count = len([d for d in session.details.all() if d.detail_type == 'protection'])
        reasons.append({
            'icon': '🔧',
            'title': '滑轮与保护站明细影响',
            'detail': f'使用了{pulley_count}个滑轮(效率系数0.95)和{protection_count}个保护站，技术评分{technique_score}分',
            'impact': f'+{round(technique_score * 0.3, 1)}分'
        })

        return JsonResponse({
            'success': True,
            'analysis': {
                'before_score': before_score,
                'after_score': after_score,
                'score_diff': round(after_score - before_score, 2),
                'initial_safety_score': round(initial_safety_score, 2),
                'final_safety_score': round(final_safety_score, 2),
                'technique_score': technique_score,
                'reasons': reasons,
                'details_summary': {
                    'pulley_count': pulley_count,
                    'protection_count': protection_count,
                    'anchor_count': len([n for n in session.nodes.all() if n.node_type == 'anchor']),
                    'total_nodes': session.nodes.count(),
                    'total_details': session.details.count(),
                }
            }
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_session_list(request):
    if request.method == 'GET':
        sessions = RescueSession.objects.all().order_by('-created_at')[:20].values(
            'session_id', 'status', 'terrain_type', 'weather',
            'difficulty', 'total_score', 'safety_score',
            'seed_type', 'created_at'
        )
        return JsonResponse({
            'success': True,
            'sessions': list(sessions),
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)
