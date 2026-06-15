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
        histories_qs = session.histories.all().order_by('step', 'id')
        histories = []
        for h in histories_qs:
            snap = h.get_state_snapshot()
            histories.append({
                'id': h.id,
                'step': h.step,
                'action': h.action,
                'action_type': h.action_type,
                'victim_x': h.victim_x,
                'victim_y': h.victim_y,
                'weather': h.weather,
                'rope_tension': h.rope_tension,
                'is_safe': h.is_safe,
                'remark': h.remark,
                'timestamp': h.timestamp.isoformat() if h.timestamp else None,
                'state_snapshot': snap,
            })

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

        failed_list = []
        for f in failures:
            if isinstance(f, dict):
                failed_list.append({
                    'node_id': f.get('id'),
                    'type': f.get('type'),
                    'reason': f.get('reason'),
                    'load': f.get('load'),
                    'capacity': f.get('capacity'),
                })
            else:
                failed_list.append({
                    'node_id': getattr(f, 'node_id', str(f)),
                    'reason': getattr(f, 'failure_reason', str(f)),
                })

        return JsonResponse({
            'success': True,
            'failed_nodes': failed_list,
            'failed_items': failed_list,
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
        engine.histories = list(session.histories.all().order_by('step', 'id'))
        engine.nodes = list(session.nodes.all())
        engine.details = list(session.details.all())
        if not hasattr(engine, 'weather_effect') or engine.weather_effect is None:
            from rescue_game.game_logic import WEATHER_EFFECTS, WeatherType
            engine.weather_effect = WEATHER_EFFECTS.get(session.weather, WEATHER_EFFECTS[WeatherType.CLEAR])

        failures, new_step_num = engine.apply_weather_event(weather_type)

        failed_list = []
        for f in failures:
            if isinstance(f, dict):
                failed_list.append({
                    'node_id': f.get('id'),
                    'type': f.get('type'),
                    'reason': f.get('reason'),
                    'load': f.get('load'),
                    'capacity': f.get('capacity'),
                })
            else:
                failed_list.append({
                    'node_id': getattr(f, 'node_id', str(f)),
                    'reason': getattr(f, 'failure_reason', str(f)),
                })

        return JsonResponse({
            'success': True,
            'weather': weather_type,
            'new_step': new_step_num,
            'failed_items': failed_list,
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

        histories = list(RescueHistory.objects.filter(session=session).order_by('step', 'id'))
        if not histories:
            return JsonResponse({'success': False, 'error': '步骤不存在'}, status=404)

        idx = max(0, min(step - 1, len(histories) - 1))
        history = histories[idx]
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
            },
            'total_steps': len(histories),
        })
    return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)


@csrf_exempt
def api_score_analysis(request, session_id):
    if request.method == 'GET':
        session = get_object_or_404(RescueSession, session_id=session_id)

        histories = list(RescueHistory.objects.filter(session=session).order_by('step', 'id'))

        initial_snap = None
        final_snap = None
        if histories:
            initial_snap = histories[0].get_state_snapshot() or {}
            final_snap = histories[-1].get_state_snapshot() or {}

        details = list(RescueDetail.objects.filter(session=session))
        result = None
        try:
            result = RescueResult.objects.get(session=session)
        except RescueResult.DoesNotExist:
            pass

        initial_safety_score = initial_snap.get('safety_score', 0) if initial_snap else 0
        final_safety_score = final_snap.get('safety_score', 0) if final_snap else 0
        initial_technique_score = initial_snap.get('technique_score', 0) if initial_snap else 0
        final_technique_score = final_snap.get('technique_score', 0) if final_snap else 0

        pulley_count = len([d for d in details if d.detail_type == 'pulley'])
        protection_count = len([d for d in details if d.detail_type == 'protection'])
        anchor_count = len([n for n in session.nodes.all() if n.node_type == 'anchor'])

        if result:
            after_score = result.final_score
            after_speed_score = result.speed_score
            after_safety_score = result.safety_score
            after_technique_score = result.technique_score
        else:
            after_score = round(final_safety_score * 0.5 + final_technique_score * 0.3, 2)
            after_speed_score = 0
            after_safety_score = final_safety_score
            after_technique_score = final_technique_score

        before_score = round(initial_safety_score * 0.5 + initial_technique_score * 0.3, 2)

        reasons = []

        initial_valid = initial_snap.get('valid_node_count', 0) if initial_snap else 0
        final_valid = final_snap.get('valid_node_count', 0) if final_snap else 0
        total_nodes = initial_snap.get('total_node_count', session.nodes.count()) if initial_snap else session.nodes.count()
        invalid_delta = initial_valid - final_valid
        if invalid_delta > 0:
            node_impact = round((invalid_delta / max(total_nodes, 1)) * 30, 1)
            reasons.append({
                'icon': '📈',
                'title': '节点有效性下降',
                'detail': f'救援过程中{invalid_delta}个节点因受力过载或天气事件失效，有效节点从{initial_valid}降至{final_valid}个（共{total_nodes}个）',
                'impact': f'-{node_impact}分'
            })

        weather_events = [h for h in histories if h.action_type == 'weather']
        weather_count = len(weather_events)
        if weather_count > 0:
            weather_names = [h.action.replace('天气变化: ', '') for h in weather_events]
            weather_impact = weather_count * 5
            reasons.append({
                'icon': '🌦️',
                'title': '天气事件影响',
                'detail': f'遭遇{weather_count}次天气事件（{", ".join(weather_names)}），导致地形承力系数下降',
                'impact': f'-{weather_impact}分'
            })

        min_safety_factor = final_snap.get('min_safety_factor') if final_snap else None
        if min_safety_factor is not None and min_safety_factor < 3.0:
            safety_impact = round((3.0 - min_safety_factor) * 13, 1)
            reasons.append({
                'icon': '⚖️',
                'title': '安全储备不足',
                'detail': f'最小安全系数仅{round(min_safety_factor, 2)}，目标为3.0，受力分布不均',
                'impact': f'-{safety_impact}分'
            })

        technique_detail = f'滑轮{pulley_count}×10={min(pulley_count*10,30)} + 保护站{protection_count}×15={min(protection_count*15,40)} + 锚点{anchor_count}×8={min(anchor_count*8,30)}'
        technique_impact = round(after_technique_score * 0.3, 1)
        reasons.append({
            'icon': '🔧',
            'title': '滑轮与保护站明细影响',
            'detail': f'使用了{pulley_count}个滑轮（效率系数0.95）和{protection_count}个保护站、{anchor_count}个锚点；技术评分计算：{technique_detail} = {after_technique_score}分',
            'impact': f'+{technique_impact}分'
        })

        terrain_rock_load = result.terrain_rock_load if result else 0
        terrain_ice_load = result.terrain_ice_load if result else 0
        terrain_snow_load = result.terrain_snow_load if result else 0
        terrain_impact_detail = f'岩壁最大承力{terrain_rock_load}KN（上限25）、冰面{terrain_ice_load}KN（上限8）、雪檐{terrain_snow_load}KN（上限3）'
        if result and result.safety_factor:
            terrain_impact_detail += f'；综合安全系数 {result.safety_factor:.2f}'

        details_list = []
        for d in details:
            details_list.append({
                'id': d.id,
                'detail_id': d.detail_id,
                'detail_type': d.detail_type,
                'detail_type_label': '滑轮' if d.detail_type == 'pulley' else ('保护站' if d.detail_type == 'protection' else d.detail_type),
                'x': d.x,
                'y': d.y,
                'load_capacity': d.load_capacity,
                'actual_load': d.actual_load,
                'efficiency': d.efficiency,
                'is_valid': d.is_valid,
            })

        return JsonResponse({
            'success': True,
            'analysis': {
                'before_score': before_score,
                'after_score': after_score,
                'score_diff': round(after_score - before_score, 2),
                'initial_safety_score': round(initial_safety_score, 2),
                'final_safety_score': round(after_safety_score, 2),
                'technique_score': round(after_technique_score, 2),
                'speed_score': round(after_speed_score, 2),
                'safety_factor': round(result.safety_factor, 2) if result and result.safety_factor else None,
                'grade': result.grade if result else None,
                'evaluation_text': result.evaluation if result else ('基于历史记录快照计算得出' if histories else '暂无数据'),
                'reasons': reasons,
                'details_summary': {
                    'pulley_count': pulley_count,
                    'protection_count': protection_count,
                    'anchor_count': anchor_count,
                    'total_nodes': session.nodes.count(),
                    'total_details': len(details),
                    'technique_score_detail': technique_detail,
                    'avg_efficiency': round(sum(d.efficiency for d in details) / max(len(details), 1), 3),
                    'terrain_detail': terrain_impact_detail,
                    'terrain_rock_load': terrain_rock_load,
                    'terrain_ice_load': terrain_ice_load,
                    'terrain_snow_load': terrain_snow_load,
                    'details': details_list,
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
