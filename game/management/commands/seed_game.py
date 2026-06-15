import random
from django.core.management.base import BaseCommand
from django.db import transaction
from game.models import (
    Level, GameSession, DispatchDetail, TouristHistory,
    PatienceResult, Complaint, IncomeSnapshot,
)
from game.engine import advance_tick, finalize_session, rollback_complaints, recalculate_from_details

DESTINATIONS = ['洪崖洞', '解放碑', '南山一棵树', '磁器口', '长江索道', '朝天门', '李子坝', '弹子石']


class Command(BaseCommand):
    help = '初始化山城缆车售票排队游戏的关卡和种子数据'

    def handle(self, *args, **options):
        self.stdout.write('=== 初始化山城缆车售票排队游戏 ===')

        Level.objects.all().delete()

        l1 = Level.objects.create(
            name='朝天门-洪崖洞线',
            description='朝天门到洪崖洞的经典观光线路，游客适中，适合新手学习售票管理',
            difficulty=1,
            target_income=300,
            max_complaints=15,
            time_limit=60,
            initial_ticket_price=10,
            initial_windows=2,
            car_capacity=6,
            tourist_rate=0.8,
        )
        l2 = Level.objects.create(
            name='解放碑-南山线',
            description='解放碑到南山的登山线路，游客多且需要换乘，考验调度能力',
            difficulty=2,
            target_income=500,
            max_complaints=10,
            time_limit=90,
            initial_ticket_price=12,
            initial_windows=2,
            car_capacity=8,
            tourist_rate=1.2,
        )
        l3 = Level.objects.create(
            name='磁器口-李子坝线',
            description='磁器口到李子坝的热门网红线路，客流高峰，票价敏感，投诉风险高',
            difficulty=3,
            target_income=800,
            max_complaints=8,
            time_limit=120,
            initial_ticket_price=15,
            initial_windows=3,
            car_capacity=8,
            tourist_rate=1.5,
        )
        self.stdout.write(f'  创建 {Level.objects.count()} 个关卡')

        self._seed_normal(l1)
        self._seed_exception(l2)
        self._seed_rollback(l3)

        self.stdout.write(self.style.SUCCESS('=== 种子数据初始化完成 ==='))

    def _seed_normal(self, level):
        self.stdout.write('  种子1: 票价调整影响排队长度 - 正常完成')

        random.seed(42)
        session = GameSession.objects.create(
            level=level,
            ticket_price=10,
            open_windows=2,
            car_capacity=6,
            dispatch_interval=5,
        )

        for _ in range(30):
            advance_tick(session)

        session.ticket_price = 15
        session.save()
        PatienceResult.objects.create(
            session=session,
            tick=session.current_tick,
            patience_before=6,
            patience_after=5,
            action='price_change:15',
            tourist_count=0,
            complaint_count=0,
            note='票价从10调至15，排队长度预期减少',
        )

        for _ in range(20):
            advance_tick(session)

        session.ticket_price = 8
        session.save()
        PatienceResult.objects.create(
            session=session,
            tick=session.current_tick,
            patience_before=5,
            patience_after=7,
            action='price_change:8',
            tourist_count=0,
            complaint_count=0,
            note='票价从15降至8，排队长度预期增加',
        )

        for _ in range(10):
            advance_tick(session)

        if session.status == 'active':
            session.status = 'completed'
            session.save()

        score, breakdown = finalize_session(session)
        self.stdout.write(f'    会话{session.id}: 分数={score}, 收入={session.total_income}, 投诉={session.total_complaints}')

    def _seed_exception(self, level):
        self.stdout.write('  种子2: 队列模拟触发异常')

        random.seed(99)
        session = GameSession.objects.create(
            level=level,
            ticket_price=12,
            open_windows=1,
            car_capacity=4,
            dispatch_interval=15,
        )

        for _ in range(20):
            advance_tick(session)
            if session.status != 'active':
                break

        PatienceResult.objects.create(
            session=session,
            tick=session.current_tick,
            patience_before=3,
            patience_after=1,
            action='exception:queue_overload',
            tourist_count=session.get_queue().__len__(),
            complaint_count=5,
            note='队列过载异常：单窗口+长间隔导致大量投诉',
        )

        for _ in range(70):
            advance_tick(session)
            if session.status != 'active':
                break

        if session.status == 'failed':
            self.stdout.write(f'    会话{session.id}: 因投诉过多而失败, 投诉={session.total_complaints}')
        else:
            if session.status == 'active':
                session.status = 'completed'
                session.save()
            score, breakdown = finalize_session(session)
            self.stdout.write(f'    会话{session.id}: 分数={score}, 投诉={session.total_complaints}')

    def _seed_rollback(self, level):
        self.stdout.write('  种子3: 投诉记录需要回滚或重算')

        random.seed(77)
        session = GameSession.objects.create(
            level=level,
            ticket_price=15,
            open_windows=3,
            car_capacity=8,
            dispatch_interval=5,
        )

        for _ in range(40):
            advance_tick(session)
            if session.status != 'active':
                break

        complaints_before = session.total_complaints
        self.stdout.write(f'    回滚前: 投诉数={complaints_before}, 状态={session.status}')

        rolled = rollback_complaints(session, 0)
        self.stdout.write(f'    回滚了 {rolled} 条投诉, 投诉数={session.total_complaints}, 状态={session.status}')

        score_before, _ = recalculate_from_details(session)
        self.stdout.write(f'    重算后: 分数={score_before}, 投诉={session.total_complaints}')

        for _ in range(40):
            advance_tick(session)
            if session.status != 'active':
                break

        if session.status == 'active':
            session.status = 'completed'
            session.save()

        score_after, breakdown = finalize_session(session)
        self.stdout.write(f'    最终: 分数={score_after}, 收入={session.total_income}, 投诉={session.total_complaints}')
