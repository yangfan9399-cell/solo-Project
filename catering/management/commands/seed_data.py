from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from catering.models import (
    User, Role, Airline, Flight, MealCategory, Allergen,
    MealBatch, BatchStatus, AnomalyType, TemperatureRecord,
    BatchHistory, RecallRecord
)


class Command(BaseCommand):
    help = '初始化样本数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样本数据...')

        self._create_users()
        self._create_airlines()
        self._create_meal_categories()
        self._create_allergens()
        self._create_flights()
        self._create_sample_batches()

        self.stdout.write(self.style.SUCCESS('样本数据初始化完成！'))

    def _create_users(self):
        users_data = [
            {'username': 'catering1', 'role': Role.CATERING_CLERK, 'password': 'test1234', 'email': 'catering1@example.com'},
            {'username': 'qc1', 'role': Role.QC_OFFICER, 'password': 'test1234', 'email': 'qc1@example.com'},
            {'username': 'cabin1', 'role': Role.CABIN_CREW, 'password': 'test1234', 'email': 'cabin1@example.com'},
            {'username': 'manager1', 'role': Role.DUTY_MANAGER, 'password': 'test1234', 'email': 'manager1@example.com'},
        ]

        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'role': data['role'],
                    'email': data['email'],
                    'is_staff': data['role'] == Role.DUTY_MANAGER,
                }
            )
            if created:
                user.set_password(data['password'])
                user.save()
                self.stdout.write(f'  创建用户: {data["username"]} ({data["role"]})')
            else:
                self.stdout.write(f'  用户已存在: {data["username"]}')

    def _create_airlines(self):
        airlines = [
            {'code': 'CA', 'name': '中国国际航空'},
            {'code': 'MU', 'name': '中国东方航空'},
            {'code': 'CZ', 'name': '中国南方航空'},
            {'code': 'HU', 'name': '海南航空'},
            {'code': '3U', 'name': '四川航空'},
        ]

        for data in airlines:
            airline, created = Airline.objects.get_or_create(
                code=data['code'],
                defaults={'name': data['name']}
            )
            if created:
                self.stdout.write(f'  创建航空公司: {airline.code} - {airline.name}')

    def _create_meal_categories(self):
        categories = [
            {'name': '经济舱正餐', 'description': '经济舱热食正餐'},
            {'name': '经济舱轻食', 'description': '经济舱轻食点心'},
            {'name': '商务舱正餐', 'description': '商务舱精选正餐'},
            {'name': '头等舱套餐', 'description': '头等舱尊享套餐'},
            {'name': '特殊餐食', 'description': '素食/清真/儿童等特殊餐食'},
            {'name': '点心餐', 'description': '短途航班点心'},
        ]

        for data in categories:
            cat, created = MealCategory.objects.get_or_create(
                name=data['name'],
                defaults={'description': data['description']}
            )
            if created:
                self.stdout.write(f'  创建餐食类别: {cat.name}')

    def _create_allergens(self):
        allergens = [
            {'name': '花生', 'icon': '🥜', 'description': '花生及花生制品'},
            {'name': '坚果', 'icon': '🌰', 'description': '树生坚果（杏仁、核桃等）'},
            {'name': '小麦', 'icon': '🌾', 'description': '小麦及麸质'},
            {'name': '牛奶', 'icon': '🥛', 'description': '牛乳及乳制品'},
            {'name': '鸡蛋', 'icon': '🥚', 'description': '鸡蛋及蛋制品'},
            {'name': '鱼类', 'icon': '🐟', 'description': '鱼类及鱼制品'},
            {'name': '甲壳类', 'icon': '🦐', 'description': '虾、蟹等甲壳类海鲜'},
            {'name': '大豆', 'icon': '🫘', 'description': '大豆及豆制品'},
        ]

        for data in allergens:
            allergen, created = Allergen.objects.get_or_create(
                name=data['name'],
                defaults={'icon': data['icon'], 'description': data['description']}
            )
            if created:
                self.stdout.write(f'  创建过敏源: {allergen.name}')

    def _create_flights(self):
        now = timezone.now()
        flights_data = [
            {'flight_number': 'CA1234', 'airline_code': 'CA', 'departure': '北京', 'destination': '上海', 'hours_from_now': 6, 'aircraft_type': '波音737', 'passenger_count': 156},
            {'flight_number': 'CA5678', 'airline_code': 'CA', 'departure': '北京', 'destination': '广州', 'hours_from_now': 8, 'aircraft_type': '空客A320', 'passenger_count': 162},
            {'flight_number': 'MU2345', 'airline_code': 'MU', 'departure': '上海', 'destination': '北京', 'hours_from_now': 5, 'aircraft_type': '波音737', 'passenger_count': 148},
            {'flight_number': 'CZ3456', 'airline_code': 'CZ', 'departure': '广州', 'destination': '成都', 'hours_from_now': 7, 'aircraft_type': '空客A321', 'passenger_count': 180},
            {'flight_number': 'HU4567', 'airline_code': 'HU', 'departure': '海口', 'destination': '北京', 'hours_from_now': 10, 'aircraft_type': '波音787', 'passenger_count': 228},
            {'flight_number': '3U5678', 'airline_code': '3U', 'departure': '成都', 'destination': '上海', 'hours_from_now': 4, 'aircraft_type': '空客A319', 'passenger_count': 128},
        ]

        for data in flights_data:
            airline = Airline.objects.get(code=data['airline_code'])
            flight, created = Flight.objects.get_or_create(
                flight_number=data['flight_number'],
                defaults={
                    'airline': airline,
                    'departure': data['departure'],
                    'destination': data['destination'],
                    'departure_time': now + timedelta(hours=data['hours_from_now']),
                    'aircraft_type': data['aircraft_type'],
                    'passenger_count': data['passenger_count'],
                }
            )
            if created:
                self.stdout.write(f'  创建航班: {flight.flight_number} {flight.departure}→{flight.destination}')

    def _create_sample_batches(self):
        now = timezone.now()
        catering_clerk = User.objects.get(username='catering1')
        qc_officer = User.objects.get(username='qc1')
        cabin_crew = User.objects.get(username='cabin1')
        manager = User.objects.get(username='manager1')

        peanut = Allergen.objects.get(name='花生')
        wheat = Allergen.objects.get(name='小麦')
        milk = Allergen.objects.get(name='牛奶')
        egg = Allergen.objects.get(name='鸡蛋')
        fish = Allergen.objects.get(name='鱼类')
        soy = Allergen.objects.get(name='大豆')

        econ_meal = MealCategory.objects.get(name='经济舱正餐')
        biz_meal = MealCategory.objects.get(name='商务舱正餐')
        snack_meal = MealCategory.objects.get(name='点心餐')
        special_meal = MealCategory.objects.get(name='特殊餐食')

        flight_ca1234 = Flight.objects.get(flight_number='CA1234')
        flight_mu2345 = Flight.objects.get(flight_number='MU2345')
        flight_cz3456 = Flight.objects.get(flight_number='CZ3456')
        flight_hu4567 = Flight.objects.get(flight_number='HU4567')

        self._create_normal_batch(
            batch_number='BATCH-CA1234-001',
            meal_category=econ_meal,
            flight=flight_ca1234,
            quantity=120,
            allergens=[wheat, milk, egg],
            created_by=catering_clerk,
            qc_officer=qc_officer,
            loaded_by=cabin_crew,
            now=now,
        )
        self.stdout.write('  ✅ 创建样本: 正常装机批次')

        self._create_allergen_missing_batch(
            batch_number='BATCH-MU2345-002',
            meal_category=biz_meal,
            flight=flight_mu2345,
            quantity=30,
            allergens=[peanut, wheat, soy],
            created_by=catering_clerk,
            qc_officer=qc_officer,
            now=now,
        )
        self.stdout.write('  ⚠️ 创建样本: 过敏源标识缺失批次')

        self._create_cold_storage_timeout_batch(
            batch_number='BATCH-CZ3456-003',
            meal_category=snack_meal,
            flight=flight_cz3456,
            quantity=80,
            allergens=[wheat, milk],
            created_by=catering_clerk,
            now=now,
        )
        self.stdout.write('  ❄️ 创建样本: 冷藏超时批次')

        self._create_flight_meal_change_batch(
            batch_number='BATCH-HU4567-004',
            meal_category=special_meal,
            flight=flight_hu4567,
            quantity=15,
            allergens=[fish, soy],
            created_by=catering_clerk,
            qc_officer=qc_officer,
            manager=manager,
            now=now,
        )
        self.stdout.write('  🔄 创建样本: 航班临时换餐批次')

        self._create_pending_qc_batch(
            batch_number='BATCH-CA1234-005',
            meal_category=econ_meal,
            flight=flight_ca1234,
            quantity=36,
            allergens=[wheat, milk],
            created_by=catering_clerk,
            now=now,
        )
        self.stdout.write('  📋 创建样本: 待品控批次')

        self._create_in_cold_storage_batch(
            batch_number='BATCH-CA5678-006',
            meal_category=econ_meal,
            flight=Flight.objects.get(flight_number='CA5678'),
            quantity=100,
            allergens=[wheat, egg],
            created_by=catering_clerk,
            now=now,
        )
        self.stdout.write('  🧊 创建样本: 冷藏中批次')

    def _create_normal_batch(self, **kwargs):
        now = kwargs['now']
        batch = MealBatch.objects.create(
            batch_number=kwargs['batch_number'],
            meal_category=kwargs['meal_category'],
            flight=kwargs['flight'],
            quantity=kwargs['quantity'],
            production_time=now - timedelta(hours=5),
            shelf_life_hours=24,
            status=BatchStatus.LOADED,
            anomaly_type=AnomalyType.NONE,
            allergen_label_verified=True,
            allergen_label_missing=False,
            created_by=kwargs['created_by'],
            qc_officer=kwargs['qc_officer'],
            qc_time=now - timedelta(hours=3),
            loaded_by=kwargs['loaded_by'],
            load_time=now - timedelta(hours=1),
            cold_storage_start=now - timedelta(hours=4.5),
            cold_storage_end=now - timedelta(hours=3.5),
            remarks='正常流程，无异常',
        )
        batch.allergens.set(kwargs['allergens'])

        for hours_ago, temp, loc in [
            (4.5, 4.2, '入库检测'),
            (4.0, 3.8, '冷藏巡检'),
            (3.5, 4.0, '出库检测'),
            (3.0, 4.5, '品控检测'),
            (1.0, 5.0, '装机前检测'),
        ]:
            TemperatureRecord.objects.create(
                batch=batch,
                temperature=temp,
                recorded_at=now - timedelta(hours=hours_ago),
                recorded_by=kwargs['qc_officer'] if '品控' in loc else kwargs['created_by'],
                location=loc,
            )

        BatchHistory.objects.create(
            batch=batch, action='创建批次', user=kwargs['created_by'],
            description=f'批次 {batch.batch_number} 创建完成',
            timestamp=now - timedelta(hours=5),
        )
        BatchHistory.objects.create(
            batch=batch, action='入库冷藏', user=kwargs['created_by'],
            description='开始冷藏',
            timestamp=now - timedelta(hours=4.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='出库', user=kwargs['created_by'],
            description='冷藏结束，时长：1.0小时',
            timestamp=now - timedelta(hours=3.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='品控通过', user=kwargs['qc_officer'],
            description='品控复核通过，温度：4.5℃',
            timestamp=now - timedelta(hours=3),
        )
        BatchHistory.objects.create(
            batch=batch, action='装机确认', user=kwargs['loaded_by'],
            description='装机确认，温度：5.0℃',
            timestamp=now - timedelta(hours=1),
        )

    def _create_allergen_missing_batch(self, **kwargs):
        now = kwargs['now']
        batch = MealBatch.objects.create(
            batch_number=kwargs['batch_number'],
            meal_category=kwargs['meal_category'],
            flight=kwargs['flight'],
            quantity=kwargs['quantity'],
            production_time=now - timedelta(hours=4),
            shelf_life_hours=24,
            status=BatchStatus.QC_FAILED,
            anomaly_type=AnomalyType.ALLERGEN_MISSING,
            allergen_label_verified=True,
            allergen_label_missing=True,
            created_by=kwargs['created_by'],
            qc_officer=kwargs['qc_officer'],
            qc_time=now - timedelta(hours=2),
            cold_storage_start=now - timedelta(hours=3.5),
            cold_storage_end=now - timedelta(hours=2.5),
            remarks='品控发现外包装花生过敏源标识缺失',
        )
        batch.allergens.set(kwargs['allergens'])

        TemperatureRecord.objects.create(
            batch=batch, temperature=4.0,
            recorded_at=now - timedelta(hours=2),
            recorded_by=kwargs['qc_officer'],
            location='品控检测',
        )

        BatchHistory.objects.create(
            batch=batch, action='创建批次', user=kwargs['created_by'],
            description=f'批次 {batch.batch_number} 创建完成',
            timestamp=now - timedelta(hours=4),
        )
        BatchHistory.objects.create(
            batch=batch, action='入库冷藏', user=kwargs['created_by'],
            description='开始冷藏',
            timestamp=now - timedelta(hours=3.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='出库', user=kwargs['created_by'],
            description='冷藏结束，时长：1.0小时',
            timestamp=now - timedelta(hours=2.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='品控不通过', user=kwargs['qc_officer'],
            description='品控不通过，温度：4.0℃，过敏源标识缺失',
            timestamp=now - timedelta(hours=2),
        )

    def _create_cold_storage_timeout_batch(self, **kwargs):
        now = kwargs['now']
        batch = MealBatch.objects.create(
            batch_number=kwargs['batch_number'],
            meal_category=kwargs['meal_category'],
            flight=kwargs['flight'],
            quantity=kwargs['quantity'],
            production_time=now - timedelta(hours=18),
            shelf_life_hours=24,
            status=BatchStatus.QC_PENDING,
            anomaly_type=AnomalyType.COLD_STORAGE_TIMEOUT,
            allergen_label_verified=False,
            allergen_label_missing=False,
            created_by=kwargs['created_by'],
            cold_storage_start=now - timedelta(hours=17),
            cold_storage_end=now - timedelta(hours=3),
            remarks='冷藏时间超过12小时，需品控确认是否可用',
        )
        batch.allergens.set(kwargs['allergens'])

        for hours_ago, temp in [(17, 3.5), (12, 3.8), (6, 4.0), (3, 4.2)]:
            TemperatureRecord.objects.create(
                batch=batch,
                temperature=temp,
                recorded_at=now - timedelta(hours=hours_ago),
                recorded_by=kwargs['created_by'],
                location='冷藏巡检',
            )

        BatchHistory.objects.create(
            batch=batch, action='创建批次', user=kwargs['created_by'],
            description=f'批次 {batch.batch_number} 创建完成',
            timestamp=now - timedelta(hours=18),
        )
        BatchHistory.objects.create(
            batch=batch, action='入库冷藏', user=kwargs['created_by'],
            description='开始冷藏（原计划4小时后使用）',
            timestamp=now - timedelta(hours=17),
        )
        BatchHistory.objects.create(
            batch=batch, action='出库', user=kwargs['created_by'],
            description='冷藏结束，时长：14.0小时（冷藏超时）',
            timestamp=now - timedelta(hours=3),
        )

    def _create_flight_meal_change_batch(self, **kwargs):
        now = kwargs['now']
        batch = MealBatch.objects.create(
            batch_number=kwargs['batch_number'],
            meal_category=kwargs['meal_category'],
            flight=kwargs['flight'],
            quantity=kwargs['quantity'],
            production_time=now - timedelta(hours=6),
            shelf_life_hours=24,
            status=BatchStatus.QC_PASSED,
            anomaly_type=AnomalyType.FLIGHT_MEAL_CHANGE,
            allergen_label_verified=True,
            allergen_label_missing=False,
            created_by=kwargs['created_by'],
            qc_officer=kwargs['qc_officer'],
            qc_time=now - timedelta(hours=4),
            cold_storage_start=now - timedelta(hours=5.5),
            cold_storage_end=now - timedelta(hours=4.5),
            remarks='航班临时增加15份素食特殊餐，原计划不含此批次',
        )
        batch.allergens.set(kwargs['allergens'])

        recall = RecallRecord.objects.create(
            batch=batch,
            reason='原计划普通餐更换为特殊餐，需确认过敏源信息完整',
            anomaly_type=AnomalyType.FLIGHT_MEAL_CHANGE,
            initiated_by=kwargs['manager'],
            handled_by=kwargs['manager'],
            initiated_at=now - timedelta(hours=5),
            resolved_at=now - timedelta(hours=4.5),
            resolution='已协调生产部紧急制作特殊餐，品控已复核过敏源标识，可装机',
            is_resolved=True,
        )

        TemperatureRecord.objects.create(
            batch=batch, temperature=3.9,
            recorded_at=now - timedelta(hours=4),
            recorded_by=kwargs['qc_officer'],
            location='品控检测',
        )

        BatchHistory.objects.create(
            batch=batch, action='创建批次', user=kwargs['created_by'],
            description=f'紧急加单：航班临时换餐，新增 {batch.quantity} 份特殊餐',
            timestamp=now - timedelta(hours=6),
        )
        BatchHistory.objects.create(
            batch=batch, action='发起召回', user=kwargs['manager'],
            description='召回原因：原计划普通餐更换为特殊餐，需确认过敏源信息完整',
            timestamp=now - timedelta(hours=5),
        )
        BatchHistory.objects.create(
            batch=batch, action='入库冷藏', user=kwargs['created_by'],
            description='开始冷藏',
            timestamp=now - timedelta(hours=5.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='退回待重新品控', user=kwargs['manager'],
            description='已协调生产部紧急制作特殊餐，品控已复核过敏源标识，可装机',
            timestamp=now - timedelta(hours=4.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='出库', user=kwargs['created_by'],
            description='冷藏结束，时长：1.0小时',
            timestamp=now - timedelta(hours=4.5),
        )
        BatchHistory.objects.create(
            batch=batch, action='品控通过', user=kwargs['qc_officer'],
            description='品控复核通过，温度：3.9℃，过敏源标识完整',
            timestamp=now - timedelta(hours=4),
        )

    def _create_pending_qc_batch(self, **kwargs):
        now = kwargs['now']
        batch = MealBatch.objects.create(
            batch_number=kwargs['batch_number'],
            meal_category=kwargs['meal_category'],
            flight=kwargs['flight'],
            quantity=kwargs['quantity'],
            production_time=now - timedelta(hours=2),
            shelf_life_hours=24,
            status=BatchStatus.QC_PENDING,
            anomaly_type=AnomalyType.NONE,
            allergen_label_verified=False,
            allergen_label_missing=False,
            created_by=kwargs['created_by'],
            cold_storage_start=now - timedelta(hours=1.5),
            remarks='待品控员复核',
        )
        batch.allergens.set(kwargs['allergens'])

        BatchHistory.objects.create(
            batch=batch, action='创建批次', user=kwargs['created_by'],
            description=f'批次 {batch.batch_number} 创建完成',
            timestamp=now - timedelta(hours=2),
        )
        BatchHistory.objects.create(
            batch=batch, action='入库冷藏', user=kwargs['created_by'],
            description='开始冷藏',
            timestamp=now - timedelta(hours=1.5),
        )

    def _create_in_cold_storage_batch(self, **kwargs):
        now = kwargs['now']
        batch = MealBatch.objects.create(
            batch_number=kwargs['batch_number'],
            meal_category=kwargs['meal_category'],
            flight=kwargs['flight'],
            quantity=kwargs['quantity'],
            production_time=now - timedelta(hours=3),
            shelf_life_hours=24,
            status=BatchStatus.IN_COLD_STORAGE,
            anomaly_type=AnomalyType.NONE,
            allergen_label_verified=False,
            allergen_label_missing=False,
            created_by=kwargs['created_by'],
            cold_storage_start=now - timedelta(hours=2.5),
            remarks='冷藏保存中，待航班时间临近出库',
        )
        batch.allergens.set(kwargs['allergens'])

        TemperatureRecord.objects.create(
            batch=batch, temperature=3.7,
            recorded_at=now - timedelta(hours=2.5),
            recorded_by=kwargs['created_by'],
            location='入库检测',
        )

        BatchHistory.objects.create(
            batch=batch, action='创建批次', user=kwargs['created_by'],
            description=f'批次 {batch.batch_number} 创建完成',
            timestamp=now - timedelta(hours=3),
        )
        BatchHistory.objects.create(
            batch=batch, action='入库冷藏', user=kwargs['created_by'],
            description='开始冷藏',
            timestamp=now - timedelta(hours=2.5),
        )
