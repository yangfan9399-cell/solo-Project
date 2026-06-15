import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.shortcuts import render, get_object_or_404, redirect
from game.models import (
    Level, GameSession, DispatchDetail, TouristHistory,
    PatienceResult, Complaint, IncomeSnapshot,
)
from game.engine import (
    advance_tick, calculate_score, finalize_session,
    rollback_complaints, recalculate_from_details,
)


def home(request):
    levels = Level.objects.all()
    recent_sessions = GameSession.objects.all()[:10]
    return render(request, 'game/home.html', {
        'levels': levels,
        'recent_sessions': recent_sessions,
    })


def level_detail(request, level_id):
    level = get_object_or_404(Level, pk=level_id)
    sessions = GameSession.objects.filter(level=level)
    return render(request, 'game/level.html', {
        'level': level,
        'sessions': sessions,
    })


def play(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    level = session.level
    queue = session.get_queue()
    income_history = session.get_income_history()

    return render(request, 'game/play.html', {
        'session': session,
        'level': level,
        'queue': queue,
        'queue_length': len(queue),
        'income_history': json.dumps(income_history),
    })


def report(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    score, breakdown = calculate_score(session)

    dispatches = DispatchDetail.objects.filter(session=session).order_by('tick')
    tourists = TouristHistory.objects.filter(session=session).order_by('tick_entered')
    complaints = Complaint.objects.filter(session=session).order_by('tick')
    snapshots = IncomeSnapshot.objects.filter(session=session).order_by('tick')
    patience_results = PatienceResult.objects.filter(session=session).order_by('tick')[:50]

    income_curve = json.dumps([
        {'tick': s.tick, 'cumulative': s.cumulative_income, 'tick_income': s.tick_income, 'price': s.ticket_price, 'queue': s.queue_length}
        for s in snapshots
    ])

    patience_data = json.dumps([
        {'tick': p.tick, 'before': p.patience_before, 'after': p.patience_after, 'complaints': p.complaint_count}
        for p in patience_results
    ])

    dispatch_summary = []
    for d in dispatches:
        dispatch_summary.append({
            'tick': d.tick,
            'car': d.car_index,
            'passengers': d.passenger_count,
            'revenue': d.revenue,
            'wait_times': d.get_wait_times(),
            'destinations': d.get_destinations(),
        })

    destination_stats = {}
    for t in tourists:
        dest = t.destination
        if dest not in destination_stats:
            destination_stats[dest] = {'served': 0, 'complained': 0, 'total': 0}
        destination_stats[dest]['total'] += 1
        if t.served:
            destination_stats[dest]['served'] += 1
        if t.complained:
            destination_stats[dest]['complained'] += 1

    return render(request, 'game/report.html', {
        'session': session,
        'level': session.level,
        'score': score,
        'breakdown': breakdown,
        'dispatch_summary': dispatch_summary,
        'complaints': complaints,
        'destination_stats': destination_stats,
        'income_curve': income_curve,
        'patience_data': patience_data,
        'total_dispatches': dispatches.count(),
        'total_tourists': tourists.count(),
        'total_complaints': complaints.count(),
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_new_game(request, level_id):
    level = get_object_or_404(Level, pk=level_id)
    session = GameSession.objects.create(
        level=level,
        ticket_price=level.initial_ticket_price,
        open_windows=level.initial_windows,
        car_capacity=level.car_capacity,
        dispatch_interval=10,
    )
    accept = request.META.get('HTTP_ACCEPT', '')
    if 'text/html' in accept:
        return redirect('play', session_id=session.id)
    return JsonResponse({
        'session_id': session.id,
        'status': session.status,
        'ticket_price': session.ticket_price,
        'open_windows': session.open_windows,
        'car_capacity': session.car_capacity,
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_tick(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    session = advance_tick(session)
    queue = session.get_queue()
    return JsonResponse({
        'tick': session.current_tick,
        'status': session.status,
        'queue_length': len(queue),
        'total_income': session.total_income,
        'total_complaints': session.total_complaints,
        'total_served': session.total_served,
        'total_departed': session.total_departed,
        'queue': queue[:20],
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_set_price(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    try:
        data = json.loads(request.body)
        price = int(data.get('price', 10))
        if price < 1:
            price = 1
        if price > 100:
            price = 100
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': '无效票价'}, status=400)

    session.ticket_price = price
    session.save()
    PatienceResult.objects.create(
        session=session,
        tick=session.current_tick,
        patience_before=0,
        patience_after=0,
        action=f'price_change:{price}',
        tourist_count=0,
        complaint_count=0,
        note=f'票价调整为{price}',
    )
    return JsonResponse({'ticket_price': session.ticket_price})


@csrf_exempt
@require_http_methods(['POST'])
def api_set_windows(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    try:
        data = json.loads(request.body)
        windows = int(data.get('windows', 2))
        if windows < 1:
            windows = 1
        if windows > 5:
            windows = 5
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': '无效窗口数'}, status=400)

    session.open_windows = windows
    session.save()
    return JsonResponse({'open_windows': session.open_windows})


@csrf_exempt
@require_http_methods(['POST'])
def api_set_dispatch_interval(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    try:
        data = json.loads(request.body)
        interval = int(data.get('interval', 10))
        if interval < 3:
            interval = 3
        if interval > 30:
            interval = 30
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': '无效发车间隔'}, status=400)

    session.dispatch_interval = interval
    session.save()
    return JsonResponse({'dispatch_interval': session.dispatch_interval})


@csrf_exempt
@require_http_methods(['POST'])
def api_finalize(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    if session.status == 'active':
        session.status = 'completed'
        session.save()
    score, breakdown = finalize_session(session)
    return JsonResponse({
        'score': score,
        'breakdown': breakdown,
        'status': session.status,
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_rollback(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    try:
        data = json.loads(request.body)
        to_tick = int(data.get('to_tick', 0))
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({'error': '无效参数'}, status=400)

    count = rollback_complaints(session, to_tick)
    return JsonResponse({
        'rolled_back_count': count,
        'total_complaints': session.total_complaints,
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_recalculate(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    score, breakdown = recalculate_from_details(session)
    return JsonResponse({
        'score': score,
        'breakdown': breakdown,
        'total_income': session.total_income,
        'total_served': session.total_served,
        'total_complaints': session.total_complaints,
    })


def api_session_state(request, session_id):
    session = get_object_or_404(GameSession, pk=session_id)
    queue = session.get_queue()
    income_history = session.get_income_history()
    return JsonResponse({
        'id': session.id,
        'status': session.status,
        'tick': session.current_tick,
        'ticket_price': session.ticket_price,
        'open_windows': session.open_windows,
        'car_capacity': session.car_capacity,
        'dispatch_interval': session.dispatch_interval,
        'total_income': session.total_income,
        'total_complaints': session.total_complaints,
        'total_served': session.total_served,
        'total_departed': session.total_departed,
        'final_score': session.final_score,
        'queue': queue[:30],
        'queue_length': len(queue),
        'income_history': income_history[-50:],
    })
