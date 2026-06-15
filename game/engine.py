import random
from django.db import transaction
from game.models import (
    GameSession, DispatchDetail, TouristHistory,
    PatienceResult, Complaint, IncomeSnapshot,
)

DESTINATIONS = [
    '洪崖洞', '解放碑', '南山一棵树', '磁器口',
    '长江索道', '朝天门', '李子坝', '弹子石',
]


def generate_tourist(tick, ticket_price, rate=1.0):
    count = 0
    if random.random() < rate:
        count = 1
    if random.random() < rate * 0.3:
        count = 2
    tourists = []
    for _ in range(count):
        patience = random.randint(3, 12)
        needs_transfer = random.random() < 0.25
        destination = random.choice(DESTINATIONS)
        tourists.append({
            'id': random.randint(100000, 999999),
            'tick_entered': tick,
            'destination': destination,
            'patience': patience,
            'max_patience': patience,
            'needs_transfer': needs_transfer,
            'ticket_price_at_entry': ticket_price,
        })
    return tourists


def price_affects_arrival_rate(base_rate, ticket_price, base_price=10):
    ratio = base_price / max(ticket_price, 1)
    return base_rate * min(ratio, 2.0)


def advance_tick(session):
    if session.status != 'active':
        return session

    level = session.level
    session.current_tick += 1
    tick = session.current_tick

    queue = session.get_queue()
    income_history = session.get_income_history()

    arrival_rate = price_affects_arrival_rate(
        level.tourist_rate, session.ticket_price, level.initial_ticket_price
    )
    new_tourists = generate_tourist(tick, session.ticket_price, arrival_rate)

    for t in new_tourists:
        TouristHistory.objects.create(
            session=session,
            tick_entered=t['tick_entered'],
            destination=t['destination'],
            patience=t['patience'],
            needs_transfer=t['needs_transfer'],
            ticket_price_at_entry=t['ticket_price_at_entry'],
        )
        queue.append(t)

    tick_income = 0
    served_count = 0
    departed_count = 0
    complaint_count = 0

    patience_before_avg = 0
    if queue:
        patience_before_avg = sum(t['patience'] for t in queue) / len(queue)

    updated_queue = []
    for t in queue:
        t['patience'] -= 1
        if t['patience'] <= 0:
            departed_count += 1
            TouristHistory.objects.filter(
                session=session,
                tick_entered=t['tick_entered'],
                served=False,
            ).update(complained=True, wait_ticks=tick - t['tick_entered'])
            Complaint.objects.create(
                session=session,
                tick=tick,
                reason=f"等待超时离开-{t['destination']}",
                severity=2 if t['needs_transfer'] else 1,
            )
            complaint_count += 1
        else:
            updated_queue.append(t)

    queue = updated_queue

    can_dispatch = (tick % session.dispatch_interval) == 0
    if can_dispatch and queue:
        for window_idx in range(session.open_windows):
            if not queue:
                break
            passengers = queue[:session.car_capacity]
            queue = queue[session.car_capacity:]

            p_count = len(passengers)
            wait_times = [tick - p['tick_entered'] for p in passengers]
            destinations = [p['destination'] for p in passengers]
            revenue = p_count * session.ticket_price

            if any(p['needs_transfer'] for p in passengers):
                revenue = int(revenue * 1.3)

            tick_income += revenue
            served_count += p_count

            dd = DispatchDetail.objects.create(
                session=session,
                tick=tick,
                car_index=window_idx,
                passenger_count=p_count,
                revenue=revenue,
            )
            dd.set_wait_times(wait_times)
            dd.set_destinations(destinations)
            dd.save()

            TouristHistory.objects.filter(
                session=session,
                tick_entered__in=[p['tick_entered'] for p in passengers],
                served=False,
            ).update(
                served=True,
                wait_ticks=tick - passengers[0]['tick_entered'] if passengers else 0,
                revenue=session.ticket_price,
            )

    session.total_income += tick_income
    session.total_complaints += complaint_count
    session.total_served += served_count
    session.total_departed += departed_count

    patience_after_avg = 0
    if queue:
        patience_after_avg = sum(t['patience'] for t in queue) / len(queue)

    PatienceResult.objects.create(
        session=session,
        tick=tick,
        patience_before=int(patience_before_avg),
        patience_after=int(patience_after_avg),
        action='tick',
        tourist_count=len(queue),
        complaint_count=complaint_count,
        note=f'新到{len(new_tourists)}人,服务{served_count}人,离开{departed_count}人',
    )

    IncomeSnapshot.objects.update_or_create(
        session=session,
        tick=tick,
        defaults={
            'cumulative_income': session.total_income,
            'tick_income': tick_income,
            'ticket_price': session.ticket_price,
            'queue_length': len(queue),
        },
    )

    income_history.append({
        'tick': tick,
        'income': session.total_income,
        'tick_income': tick_income,
        'queue_len': len(queue),
    })

    session.set_queue(queue)
    session.set_income_history(income_history)
    session.save()

    if session.total_complaints >= level.max_complaints:
        session.status = 'failed'
        session.save()
    elif tick >= level.time_limit:
        session.status = 'completed'
        session.save()

    return session


def calculate_score(session):
    level = session.level
    dispatches = DispatchDetail.objects.filter(session=session)
    tourists = TouristHistory.objects.filter(session=session)

    total_revenue = sum(d.revenue for d in dispatches)
    served_count = tourists.filter(served=True).count()
    complaint_count = tourists.filter(complained=True).count()
    avg_wait = 0
    served_tourists = tourists.filter(served=True)
    if served_tourists.exists():
        avg_wait = sum(t.wait_ticks for t in served_tourists) / served_tourists.count()

    income_score = total_revenue
    complaint_penalty = complaint_count * 50
    wait_penalty = int(avg_wait * 10)
    target_bonus = 0
    if total_revenue >= level.target_income:
        target_bonus = (total_revenue - level.target_income) // 2
    transfer_bonus = tourists.filter(served=True, needs_transfer=True).count() * 20

    final_score = income_score - complaint_penalty - wait_penalty + target_bonus + transfer_bonus
    return max(final_score, 0), {
        'income_score': income_score,
        'complaint_penalty': complaint_penalty,
        'wait_penalty': wait_penalty,
        'target_bonus': target_bonus,
        'transfer_bonus': transfer_bonus,
        'total_revenue': total_revenue,
        'served_count': served_count,
        'complaint_count': complaint_count,
        'avg_wait': round(avg_wait, 1),
    }


def finalize_session(session):
    score, breakdown = calculate_score(session)
    session.final_score = score
    session.save()
    return score, breakdown


def rollback_complaints(session, to_tick):
    complaints = Complaint.objects.filter(
        session=session,
        tick__gt=to_tick,
        rolled_back=False,
    )
    count = complaints.count()

    complaints.update(rolled_back=True, rollback_tick=session.current_tick)

    session.total_complaints -= count
    session.total_complaints = max(session.total_complaints, 0)

    if session.status == 'failed' and session.total_complaints < session.level.max_complaints:
        session.status = 'active'

    session.save()

    tourists_affected = TouristHistory.objects.filter(
        session=session,
        complained=True,
    )
    tourists_to_restore = []
    for t in tourists_affected:
        if t.tick_entered > to_tick and t.complained:
            t.complained = False
            t.served = False
            t.wait_ticks = 0
            tourists_to_restore.append(t)
    TouristHistory.objects.bulk_update(tourists_to_restore, ['complained', 'served', 'wait_ticks'])

    return count


def recalculate_from_details(session):
    dispatches = DispatchDetail.objects.filter(session=session)
    tourists = TouristHistory.objects.filter(session=session)

    total_income = sum(d.revenue for d in dispatches)
    total_served = tourists.filter(served=True).count()
    total_departed = tourists.filter(complained=True).count()
    total_complaints = total_departed

    session.total_income = total_income
    session.total_served = total_served
    session.total_departed = total_departed
    session.total_complaints = total_complaints

    score, breakdown = calculate_score(session)
    session.final_score = score
    session.save()

    IncomeSnapshot.objects.filter(session=session).delete()

    tick_revenues = {}
    for d in dispatches.order_by('tick'):
        tick_revenues[d.tick] = tick_revenues.get(d.tick, 0) + d.revenue

    snapshots = []
    cumulative = 0
    for tick in sorted(tick_revenues.keys()):
        cumulative += tick_revenues[tick]
        snapshots.append(IncomeSnapshot(
            session=session,
            tick=tick,
            cumulative_income=cumulative,
            tick_income=tick_revenues[tick],
            ticket_price=session.ticket_price,
            queue_length=0,
        ))
    IncomeSnapshot.objects.bulk_create(snapshots)

    return score, breakdown
