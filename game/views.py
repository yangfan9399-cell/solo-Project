import json
import hashlib
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from .models import (
    PlayerProfile, Level, TrapType, GameSession, Trap, Enemy,
    CraftsmanTask, BattleReport, ScoreRecord, ReplayFrame, ActionHistory
)
from . import game_logic


def ensure_profile(user):
    try:
        return user.profile
    except PlayerProfile.DoesNotExist:
        return PlayerProfile.objects.create(
            user=user,
            display_name=user.username,
        )


def login_or_create(request):
    if request.user.is_authenticated:
        ensure_profile(request.user)
        return redirect('dashboard')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password', 'password123')
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password(password)
            user.save()
        else:
            user = authenticate(username=username, password=password)
            if user is None:
                user = User.objects.get(username=username)
        login(request, user)
        ensure_profile(user)
        return redirect('dashboard')
    return render(request, 'login.html')


@login_required
def dashboard(request):
    profile = ensure_profile(request.user)
    levels = Level.objects.all().order_by('number')
    recent_sessions = GameSession.objects.filter(
        player=profile
    ).order_by('-created_at')[:10]
    high_scores = ScoreRecord.objects.filter(
        is_valid=True
    ).order_by('-score')[:10]
    context = {
        'profile': profile,
        'levels': levels,
        'recent_sessions': recent_sessions,
        'high_scores': high_scores,
    }
    return render(request, 'dashboard.html', context)


@login_required
def start_game(request, level_id):
    profile = ensure_profile(request.user)
    level = get_object_or_404(Level, id=level_id)
    active_session = GameSession.objects.filter(
        player=profile,
        status__in=['setup', 'playing']
    ).first()
    if active_session:
        return redirect('game_view', session_id=active_session.id)
    session = game_logic.create_new_session(profile, level)
    return redirect('game_view', session_id=session.id)


@login_required
def game_view(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    trap_types = TrapType.objects.all()
    context = {
        'session': session,
        'trap_types': trap_types,
        'grid_width': game_logic.GRID_WIDTH,
        'grid_height': game_logic.GRID_HEIGHT,
        'wall_x': game_logic.WALL_POSITION_X,
    }
    return render(request, 'game.html', context)


@login_required
def session_state(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    state = {
        'session_id': session.id,
        'status': session.status,
        'turn': session.current_turn,
        'wall_health': session.wall_health,
        'max_wall_health': session.max_wall_health,
        'gold': session.gold,
        'score': session.score,
        'enemies_killed': session.enemies_killed,
        'level': {
            'id': session.level.id,
            'number': session.level.number,
            'name': session.level.name,
        },
        'traps': [
            {
                'id': t.id,
                'type_id': t.trap_type.id,
                'type_name': t.trap_type.name,
                'x': t.position_x,
                'y': t.position_y,
                'color': t.trap_type.color,
                'emoji': t.trap_type.emoji,
                'damage': t.trap_type.damage,
                'range': t.trap_type.range,
                'cooldown': t.trap_type.cooldown,
                'last_triggered': t.last_triggered,
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
                'speed': e.speed,
                'damage': e.damage,
            }
            for e in session.enemies.filter(is_alive=True)
        ],
        'tasks': [
            {
                'id': t.id,
                'name': t.name,
                'description': t.description,
                'status': t.status,
                'progress': max(0, session.current_turn - t.start_turn),
                'total': t.duration_turns,
                'end_turn': t.end_turn,
            }
            for t in session.tasks.filter(status__in=['pending', 'in_progress'])
        ],
        'recent_actions': [
            {
                'turn': a.turn,
                'type': a.action_type,
                'details': a.details,
            }
            for a in session.history.order_by('-timestamp')[:15]
        ],
        'checksum': session.generate_server_checksum(),
    }
    return JsonResponse(state)


@login_required
@require_POST
def place_trap(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    data = json.loads(request.body)
    result = game_logic.place_trap(
        session,
        data.get('trap_type_id'),
        data.get('x'),
        data.get('y'),
    )
    return JsonResponse(result)


@login_required
@require_POST
def remove_trap(request, session_id, trap_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    result = game_logic.remove_trap(session, trap_id)
    return JsonResponse(result)


@login_required
@require_POST
def start_task(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    data = json.loads(request.body)
    result = game_logic.start_craftsman_task(
        session,
        data.get('task_name'),
    )
    return JsonResponse(result)


@login_required
@require_POST
def start_attack(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    result = game_logic.start_attack(session)
    return JsonResponse(result)


@login_required
@require_POST
def next_turn(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    data = json.loads(request.body)
    client_checksum = data.get('checksum', '')
    validation = game_logic.validate_client_state(session, {'checksum': client_checksum})
    if not validation['valid']:
        return JsonResponse({
            'success': False,
            'message': '状态校验失败，请刷新页面',
            'validation': validation,
        }, status=400)
    result = game_logic.next_turn(session)
    result['validation'] = validation
    return JsonResponse(result)


@login_required
def battle_report(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    try:
        report = session.report
    except BattleReport.DoesNotExist:
        report = game_logic.generate_battle_report(session)
    score_record = ScoreRecord.objects.filter(game_session=session).first()
    context = {
        'session': session,
        'report': report,
        'score_record': score_record,
    }
    return render(request, 'report.html', context)


@login_required
def replay_view(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    frames = ReplayFrame.objects.filter(
        game_session=session
    ).order_by('turn')
    context = {
        'session': session,
        'frames_count': frames.count(),
        'max_turn': session.current_turn,
    }
    return render(request, 'replay.html', context)


@login_required
def replay_frames(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    frames = ReplayFrame.objects.filter(
        game_session=session
    ).order_by('turn')
    data = [f.frame_data for f in frames]
    return JsonResponse({'frames': data, 'total': len(data)})


@login_required
def resume_from_history(request, session_id, turn):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    state = game_logic.resume_session_from_history(session, turn)
    return JsonResponse(state)


@login_required
@require_POST
def validate_score(request, session_id):
    profile = ensure_profile(request.user)
    session = get_object_or_404(GameSession, id=session_id, player=profile)
    score_record = ScoreRecord.objects.filter(game_session=session).first()
    if not score_record:
        score_record = game_logic.create_score_record(session)
    server_score = score_record.recalculate_score()
    return JsonResponse({
        'client_score': session.score,
        'server_score': server_score,
        'is_valid': score_record.is_valid,
        'note': score_record.validation_note,
    })


@login_required
def history_view(request):
    profile = ensure_profile(request.user)
    sessions = GameSession.objects.filter(
        player=profile,
        status__in=['won', 'lost']
    ).order_by('-created_at')[:50]
    score_records = ScoreRecord.objects.filter(
        player=profile
    ).order_by('-created_at')[:50]
    context = {
        'sessions': sessions,
        'score_records': score_records,
        'profile': profile,
    }
    return render(request, 'history.html', context)


@login_required
def leaderboard(request):
    scores = ScoreRecord.objects.filter(
        is_valid=True
    ).order_by('-score')[:50]
    context = {
        'scores': scores,
    }
    return render(request, 'leaderboard.html', context)
