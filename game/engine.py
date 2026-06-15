import json
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

    transfer_patience_loss = 0
    normal_patience_loss = 0
    transfer_complaints = 0
    normal_complaints = 0
    transfer_served = 0
    normal_served = 0
    transfer_revenue_bonus = 0

    patience_before_avg = 0
    if queue:
        patience_before_avg = sum(t['patience'] for t in queue) / len(queue)

    updated_queue = []
    for t in queue:
        old_patience = t['patience']
        t['patience'] -= 1
        patience_loss = 1
        if t['needs_transfer']:
            transfer_patience_loss += patience_loss
        else:
            normal_patience_loss += patience_loss

        if t['patience'] <= 0:
            departed_count += 1
            matched_tourists = TouristHistory.objects.filter(
                session=session,
                tick_entered=t['tick_entered'],
                destination=t['destination'],
                served=False,
                complained=False,
            )
            th = None
            if matched_tourists.exists():
                th = matched_tourists.first()
                th.complained = True
                th.wait_ticks = tick - t['tick_entered']
                th.save()
            Complaint.objects.create(
                session=session,
                tick=tick,
                tourist=th,
                reason=f"等待超时离开-{t['destination']}",
                severity=3 if t['needs_transfer'] else 1,
            )
            complaint_count += 1
            if t['needs_transfer']:
                transfer_complaints += 1
            else:
                normal_complaints += 1
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
            base_revenue = p_count * session.ticket_price
            has_transfer = any(p['needs_transfer'] for p in passengers)
            revenue = int(base_revenue * 1.3) if has_transfer else base_revenue
            if has_transfer:
                transfer_revenue_bonus += (revenue - base_revenue)

            tick_income += revenue
            served_count += p_count

            for p in passengers:
                matched = TouristHistory.objects.filter(
                    session=session,
                    tick_entered=p['tick_entered'],
                    destination=p['destination'],
                    served=False,
                )
                if matched.exists():
                    th = matched.first()
                    th.served = True
                    th.wait_ticks = tick - p['tick_entered']
                    th.revenue = session.ticket_price
                    th.save()
                if p['needs_transfer']:
                    transfer_served += 1
                else:
                    normal_served += 1

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
        transfer_patience_loss=transfer_patience_loss,
        normal_patience_loss=normal_patience_loss,
        transfer_complaints=transfer_complaints,
        normal_complaints=normal_complaints,
        transfer_served=transfer_served,
        normal_served=normal_served,
        transfer_revenue_bonus=transfer_revenue_bonus,
        note=f'新到{len(new_tourists)}人,服务{served_count}人(换乘{transfer_served}),离开{departed_count}人(换乘{transfer_complaints}),换乘补贴{transfer_revenue_bonus}',
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
    active_complaints = Complaint.objects.filter(session=session, rolled_back=False)

    total_revenue = sum(d.revenue for d in dispatches)
    served_count = tourists.filter(served=True).count()
    complaint_count = active_complaints.count()
    avg_wait = 0
    served_tourists = tourists.filter(served=True)
    if served_tourists.exists():
        avg_wait = sum(t.wait_ticks for t in served_tourists) / served_tourists.count()

    transfer_served = tourists.filter(served=True, needs_transfer=True).count()
    normal_served = tourists.filter(served=True, needs_transfer=False).count()
    transfer_complaints = active_complaints.filter(tourist__needs_transfer=True).count()
    normal_complaints = active_complaints.filter(tourist__needs_transfer=False).count()

    patience_results = PatienceResult.objects.filter(session=session, action='tick')
    transfer_patience_loss = sum(p.transfer_patience_loss for p in patience_results)
    normal_patience_loss = sum(p.normal_patience_loss for p in patience_results)

    transfer_revenue_bonus = sum(p.transfer_revenue_bonus for p in patience_results)

    income_score = total_revenue
    complaint_penalty = complaint_count * 50
    wait_penalty = int(avg_wait * 10)
    target_bonus = 0
    if total_revenue >= level.target_income:
        target_bonus = (total_revenue - level.target_income) // 2
    transfer_bonus = transfer_served * 20

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
        'transfer_served': transfer_served,
        'normal_served': normal_served,
        'transfer_complaints': transfer_complaints,
        'normal_complaints': normal_complaints,
        'transfer_patience_loss': transfer_patience_loss,
        'normal_patience_loss': normal_patience_loss,
        'transfer_revenue_bonus': transfer_revenue_bonus,
    }


def finalize_session(session):
    score, breakdown = calculate_score(session)
    session.final_score = score
    session.save()
    return score, breakdown


def rollback_complaints(session, to_tick):
    with transaction.atomic():
        active_complaints = Complaint.objects.filter(
            session=session,
            tick__gt=to_tick,
            rolled_back=False,
        )
        count = active_complaints.count()
        if count == 0:
            return 0

        from game.models import RollbackSnapshot

        before_score, before_breakdown = calculate_score(session)
        before_complaints = active_complaints.count() + Complaint.objects.filter(
            session=session, rolled_back=False, tick__lte=to_tick
        ).count()
        before_income = session.total_income
        before_served = session.total_served

        before_snapshots = IncomeSnapshot.objects.filter(session=session).order_by('tick')
        income_curve_before = json.dumps([
            {'tick': s.tick, 'cumulative': s.cumulative_income, 'tick_income': s.tick_income}
            for s in before_snapshots
        ])

        queue = session.get_queue()
        restored_to_queue = []

        for c in active_complaints:
            c.rolled_back = True
            c.rollback_tick = session.current_tick
            c.save()

            if c.tourist is not None:
                th = c.tourist
                th.complained = False
                th.served = False
                th.wait_ticks = 0
                th.save()

                restored_to_queue.append({
                    'id': th.id,
                    'tick_entered': th.tick_entered,
                    'destination': th.destination,
                    'patience': th.patience,
                    'max_patience': th.patience,
                    'needs_transfer': th.needs_transfer,
                    'ticket_price_at_entry': th.ticket_price_at_entry,
                })

        queue = restored_to_queue + queue
        session.set_queue(queue)

        active_complaint_count = Complaint.objects.filter(
            session=session,
            rolled_back=False,
        ).count()
        complained_tourist_count = TouristHistory.objects.filter(
            session=session,
            complained=True,
        ).count()

        session.total_complaints = active_complaint_count
        session.total_departed = complained_tourist_count

        if session.status == 'failed' and active_complaint_count < session.level.max_complaints:
            session.status = 'active'

        session.save()

        after_score, after_breakdown = calculate_score(session)
        after_complaints = active_complaint_count
        after_income = session.total_income
        after_served = session.total_served

        transfer_restored = sum(1 for t in restored_to_queue if t.get('needs_transfer', False))
        normal_restored = len(restored_to_queue) - transfer_restored
        transfer_rolled_back = active_complaints.filter(tourist__needs_transfer=True).count()
        normal_rolled_back = active_complaints.filter(tourist__needs_transfer=False).count()

        RollbackSnapshot.objects.create(
            session=session,
            rollback_tick=session.current_tick,
            to_tick=to_tick,
            rolled_back_count=count,
            before_complaints=before_complaints,
            before_score=before_score,
            before_income=before_income,
            before_served=before_served,
            after_complaints=after_complaints,
            after_score=after_score,
            after_income=after_income,
            after_served=after_served,
            delta_complaints=after_complaints - before_complaints,
            delta_score=after_score - before_score,
            delta_income=after_income - before_income,
            delta_penalty=count * 50,
            transfer_rolled_back=transfer_rolled_back,
            normal_rolled_back=normal_rolled_back,
            restored_queue_count=len(restored_to_queue),
            income_curve_json=income_curve_before,
        )

        PatienceResult.objects.create(
            session=session,
            tick=session.current_tick,
            patience_before=before_score,
            patience_after=after_score,
            action=f'rollback:{to_tick}',
            tourist_count=len(restored_to_queue),
            complaint_count=count,
            transfer_patience_loss=0,
            normal_patience_loss=0,
            transfer_complaints=transfer_rolled_back,
            normal_complaints=normal_rolled_back,
            transfer_served=0,
            normal_served=0,
            transfer_revenue_bonus=0,
            note=f'回滚至回合{to_tick}，恢复{len(restored_to_queue)}名游客到队列(换乘{transfer_restored})，撤销{count}条投诉(换乘{transfer_rolled_back})，分数{before_score}→{after_score}',
        )

    return count


def recalculate_from_details(session):
    with transaction.atomic():
        dispatches = DispatchDetail.objects.filter(session=session)
        tourists = TouristHistory.objects.filter(session=session)
        active_complaints = Complaint.objects.filter(session=session, rolled_back=False)

        total_income = sum(d.revenue for d in dispatches)
        total_served = tourists.filter(served=True).count()

        active_complaint_ids = active_complaints.values_list('tourist_id', flat=True).exclude(tourist_id__isnull=True)
        tourists.update(complained=False)
        tourists.filter(id__in=list(active_complaint_ids)).update(complained=True)

        total_departed = tourists.filter(served=True).count()
        total_complaints = active_complaints.count()
        total_complained_tourists = tourists.filter(complained=True).count()

        session.total_income = total_income
        session.total_served = total_served
        session.total_departed = total_departed
        session.total_complaints = total_complaints

        if session.status == 'failed' and total_complaints < session.level.max_complaints:
            session.status = 'active'

        score, breakdown = calculate_score(session)
        session.final_score = score
        session.save()

        PatienceResult.objects.create(
            session=session,
            tick=session.current_tick,
            action=f'recalc:{session.current_tick}',
            tourist_count=tourists.count(),
            complaint_count=total_complaints,
            patience_before=0,
            patience_after=0,
            transfer_patience_loss=breakdown.get('transfer_patience_loss', 0),
            normal_patience_loss=breakdown.get('normal_patience_loss', 0),
            transfer_complaints=breakdown.get('transfer_complaints', 0),
            normal_complaints=breakdown.get('normal_complaints', 0),
            transfer_served=breakdown.get('transfer_served', 0),
            normal_served=breakdown.get('normal_served', 0),
            transfer_revenue_bonus=breakdown.get('transfer_revenue_bonus', 0),
        )

        IncomeSnapshot.objects.filter(session=session).delete()

        tick_revenues = {}
        for d in dispatches.order_by('tick'):
            tick_revenues[d.tick] = tick_revenues.get(d.tick, 0) + d.revenue

        snapshots = []
        cumulative = 0
        for tick in sorted(tick_revenues.keys()):
            cumulative += tick_revenues[tick]
            queue_len = len(session.get_queue())
            snapshots.append(IncomeSnapshot(
                session=session,
                tick=tick,
                cumulative_income=cumulative,
                tick_income=tick_revenues[tick],
                ticket_price=session.ticket_price,
                queue_length=queue_len,
            ))
        IncomeSnapshot.objects.bulk_create(snapshots)

        PatienceResult.objects.create(
            session=session,
            tick=session.current_tick,
            patience_before=session.final_score,
            patience_after=score,
            action='recalculate',
            tourist_count=total_served,
            complaint_count=total_complaints,
            transfer_patience_loss=breakdown.get('transfer_patience_loss', 0),
            normal_patience_loss=breakdown.get('normal_patience_loss', 0),
            transfer_complaints=breakdown.get('transfer_complaints', 0),
            normal_complaints=breakdown.get('normal_complaints', 0),
            transfer_served=breakdown.get('transfer_served', 0),
            normal_served=breakdown.get('normal_served', 0),
            transfer_revenue_bonus=breakdown.get('transfer_revenue_bonus', 0),
            note=f'重算完成：收入{total_income}，投诉{total_complaints}，分数{score}',
        )

    return score, breakdown
