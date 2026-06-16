import json
from django.db import models
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST, require_GET
from django.utils import timezone
from .models import Player, Level, Round, Operation, OrderEvaluation
from .scoring import calculate_score, server_recalculate, replay_operations


def index(request):
    player_id = request.session.get('player_id')
    player = None
    if player_id:
        try:
            player = Player.objects.get(pk=player_id)
        except Player.DoesNotExist:
            request.session.pop('player_id', None)

    levels = Level.objects.all().order_by('level_number')
    current_round = None
    if player:
        current_round = Round.objects.filter(
            player=player, status='in_progress'
        ).select_related('level').first()

    return render(request, 'workshop/index.html', {
        'player': player,
        'levels': levels,
        'current_round': current_round,
    })


def create_player(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        if name:
            player, created = Player.objects.get_or_create(name=name)
            request.session['player_id'] = player.id
            return redirect('workshop:index')
    return redirect('workshop:index')


def switch_player(request):
    request.session.pop('player_id', None)
    return redirect('workshop:index')


@require_GET
def level_list(request):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    player = get_object_or_404(Player, pk=player_id)
    levels = Level.objects.all().order_by('level_number')
    data = []
    for lv in levels:
        best = player.rounds.filter(
            level=lv, status='completed'
        ).order_by('-evaluation__final_score').values_list('evaluation__final_score', flat=True).first()
        data.append({
            'level_number': lv.level_number,
            'title': lv.title,
            'difficulty': lv.difficulty,
            'pass_score': lv.pass_score,
            'base_reward': lv.base_reward,
            'unlocked': lv.level_number <= player.current_level,
            'best_score': int(best) if best else None,
        })
    return JsonResponse({'levels': data, 'player_level': player.current_level})


@require_POST
def start_round(request, level_number):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    player = get_object_or_404(Player, pk=player_id)
    level = get_object_or_404(Level, level_number=level_number)

    if level.level_number > player.current_level:
        return JsonResponse({'error': '关卡未解锁'}, status=403)

    existing = Round.objects.filter(player=player, status='in_progress').first()
    if existing:
        return JsonResponse({'error': '已有进行中的局次', 'round_id': existing.id}, status=409)

    round_obj = Round.objects.create(player=player, level=level)
    return JsonResponse({
        'round_id': round_obj.id,
        'level': {
            'level_number': level.level_number,
            'title': level.title,
            'description': level.description,
            'target_text': level.target_text,
            'time_limit': level.time_limit,
            'ink_budget': level.ink_budget,
            'char_pool': json.loads(level.char_pool),
        },
    })


@require_GET
def resume_round(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id, status='in_progress')
    level = round_obj.level
    operations = round_obj.operations.all().values('op_type', 'position', 'char_value', 'old_char', 'ink_delta', 'seq')
    return JsonResponse({
        'round_id': round_obj.id,
        'arranged_text': round_obj.arranged_text,
        'ink_used': round_obj.ink_used,
        'proofread_count': round_obj.proofread_count,
        'elapsed_seconds': round_obj.elapsed_seconds,
        'level': {
            'level_number': level.level_number,
            'title': level.title,
            'description': level.description,
            'target_text': level.target_text,
            'time_limit': level.time_limit,
            'ink_budget': level.ink_budget,
            'char_pool': json.loads(level.char_pool),
        },
        'operations': list(operations),
    })


@csrf_exempt
@require_POST
def record_operation(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id, status='in_progress')

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': '无效JSON'}, status=400)

    op_type = data.get('op_type')
    if op_type not in dict(Operation.OP_TYPE_CHOICES):
        return JsonResponse({'error': '无效操作类型'}, status=400)

    max_seq = round_obj.operations.aggregate(max_seq=models.Max('seq'))['max_seq'] or 0

    op = Operation(
        round=round_obj,
        op_type=op_type,
        position=data.get('position'),
        char_value=data.get('char_value', ''),
        old_char=data.get('old_char', ''),
        ink_delta=data.get('ink_delta', 0),
        data_json=json.dumps(data.get('data', {}), ensure_ascii=False),
        seq=max_seq + 1,
    )
    op.save()

    if op_type == 'adjust_ink':
        round_obj.ink_used = max(0, round_obj.ink_used + op.ink_delta)
        round_obj.save(update_fields=['ink_used'])
    elif op_type == 'proofread':
        round_obj.proofread_count += 1
        round_obj.save(update_fields=['proofread_count'])

    return JsonResponse({'seq': op.seq, 'status': 'ok'})


@csrf_exempt
@require_POST
def submit_round(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id, status='in_progress')

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': '无效JSON'}, status=400)

    round_obj.elapsed_seconds = data.get('elapsed_seconds', 0)
    round_obj.save(update_fields=['elapsed_seconds'])

    evaluation = server_recalculate(round_obj)

    return JsonResponse({
        'evaluation': {
            'accuracy': evaluation.accuracy,
            'wrong_char_count': evaluation.wrong_char_count,
            'inverted_char_count': evaluation.inverted_char_count,
            'missing_char_count': evaluation.missing_char_count,
            'extra_char_count': evaluation.extra_char_count,
            'ink_efficiency': evaluation.ink_efficiency,
            'ink_waste': evaluation.ink_waste,
            'time_bonus': evaluation.time_bonus,
            'proofread_bonus': evaluation.proofread_bonus,
            'raw_score': evaluation.raw_score,
            'final_score': evaluation.final_score,
            'revenue': evaluation.revenue,
            'passed': evaluation.passed,
            'server_calculated': evaluation.server_calculated,
        },
        'round_status': round_obj.status,
    })


@require_GET
def player_profile(request):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    player = get_object_or_404(Player, pk=player_id)
    rounds = player.rounds.select_related('level', 'evaluation').order_by('-started_at')[:20]
    rounds_data = []
    for r in rounds:
        ev = getattr(r, 'evaluation', None)
        rounds_data.append({
            'round_id': r.id,
            'level_number': r.level.level_number,
            'level_title': r.level.title,
            'status': r.status,
            'score': ev.final_score if ev else None,
            'revenue': ev.revenue if ev else None,
            'passed': ev.passed if ev else None,
            'started_at': r.started_at.isoformat(),
        })
    return JsonResponse({
        'name': player.name,
        'current_level': player.current_level,
        'total_revenue': player.total_revenue,
        'total_rounds': player.total_rounds,
        'best_score': player.best_score,
        'recent_rounds': rounds_data,
    })


@require_GET
def operation_history(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id)
    ops = round_obj.operations.all().values('seq', 'op_type', 'position', 'char_value', 'old_char', 'ink_delta', 'created_at')
    return JsonResponse({'operations': list(ops)})


@csrf_exempt
@require_POST
def undo_operation(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id, status='in_progress')

    last_op = round_obj.operations.order_by('-seq').first()
    if not last_op:
        return JsonResponse({'error': '没有可撤销的操作'}, status=400)

    last_op.delete()

    replayed = replay_operations(round_obj)
    round_obj.arranged_text = replayed['arranged_text']
    round_obj.ink_used = replayed['ink_used']
    round_obj.save(update_fields=['arranged_text', 'ink_used'])

    return JsonResponse({
        'status': 'ok',
        'arranged_text': replayed['arranged_text'],
        'ink_used': replayed['ink_used'],
    })


@require_GET
def proofread(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return JsonResponse({'error': '未登录'}, status=403)
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id, status='in_progress')
    level = round_obj.level
    target = list(level.target_text)
    arranged = list(round_obj.arranged_text) if round_obj.arranged_text else []

    errors = []
    max_len = max(len(target), len(arranged))
    for i in range(max_len):
        if i >= len(arranged):
            errors.append({'position': i, 'type': 'missing', 'expected': target[i]})
        elif i >= len(target):
            errors.append({'position': i, 'type': 'extra', 'actual': arranged[i]})
        elif arranged[i] != target[i]:
            errors.append({
                'position': i,
                'type': 'wrong',
                'expected': target[i],
                'actual': arranged[i],
            })

    return JsonResponse({
        'error_count': len(errors),
        'errors': errors,
        'proofread_count': round_obj.proofread_count + 1,
    })


def game_view(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return redirect('workshop:index')
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id, status='in_progress')
    level = round_obj.level
    return render(request, 'workshop/game.html', {
        'round': round_obj,
        'level': level,
        'char_pool': json.loads(level.char_pool),
        'player': round_obj.player,
    })


def result_view(request, round_id):
    player_id = request.session.get('player_id')
    if not player_id:
        return redirect('workshop:index')
    round_obj = get_object_or_404(Round, pk=round_id, player_id=player_id)
    evaluation = getattr(round_obj, 'evaluation', None)
    if not evaluation:
        return redirect('workshop:index')
    return render(request, 'workshop/result.html', {
        'round': round_obj,
        'level': round_obj.level,
        'evaluation': evaluation,
        'player': round_obj.player,
    })
