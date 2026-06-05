from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from inspection.models import LightPole, EnergyReading, WorkOrder, WorkOrderHistory
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed initial data for the inspection system'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')

        self.create_users()
        self.create_light_poles()
        self.create_energy_readings()
        self.create_work_orders()

        self.stdout.write(self.style.SUCCESS('Data seeded successfully!'))

    def create_users(self):
        users_data = [
            {'username': 'admin', 'password': 'admin123', 'role': 'admin', 'first_name': '系统', 'last_name': '管理员', 'is_staff': True, 'is_superuser': True},
            {'username': 'inspector', 'password': 'inspector123', 'role': 'inspector', 'first_name': '张', 'last_name': '巡检'},
            {'username': 'inspector2', 'password': 'inspector123', 'role': 'inspector', 'first_name': '李', 'last_name': '巡检'},
            {'username': 'reviewer', 'password': 'reviewer123', 'role': 'reviewer', 'first_name': '王', 'last_name': '复核'},
            {'username': 'reviewer2', 'password': 'reviewer123', 'role': 'reviewer', 'first_name': '赵', 'last_name': '复核'},
        ]

        for data in users_data:
            if not User.objects.filter(username=data['username']).exists():
                user = User.objects.create_user(
                    username=data['username'],
                    password=data['password'],
                    role=data['role'],
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    is_staff=data.get('is_staff', False),
                    is_superuser=data.get('is_superuser', False),
                )
                self.stdout.write(f'Created user: {user.username}')

    def create_light_poles(self):
        areas = ['东城区', '西城区', '朝阳区', '海淀区', '丰台区']
        addresses = {
            '东城区': ['东长安街1号', '王府井大街88号', '东直门南大街1号'],
            '西城区': ['西单北大街120号', '金融街1号', '宣武门外大街8号'],
            '朝阳区': ['建国门外大街1号', '三里屯路19号', '望京soho塔1'],
            '海淀区': ['中关村大街1号', '颐和园路5号', '上地十街10号'],
            '丰台区': ['丰台北路18号', '石榴庄路5号', '马家堡西路15号'],
        }

        for i, area in enumerate(areas):
            for j, addr in enumerate(addresses[area]):
                pole_number = f'LP-{area[:2]}-{j+1:03d}'
                device_id = f'DEV-{area[:2]}-{i*3 + j + 1:04d}'
                
                LightPole.objects.get_or_create(
                    pole_number=pole_number,
                    defaults={
                        'area': area,
                        'address': addr,
                        'longitude': 116.3 + i * 0.1 + j * 0.01,
                        'latitude': 39.9 + i * 0.05 + j * 0.01,
                        'device_id': device_id,
                        'rated_power': 100 if j % 2 == 0 else 150,
                        'is_active': True,
                    }
                )
                self.stdout.write(f'Created/Updated light pole: {pole_number}')

    def create_energy_readings(self):
        poles = LightPole.objects.all()
        base_date = timezone.now().date() - timedelta(days=30)

        for pole in poles:
            cumulative = 1000.0
            for i in range(30):
                reading_date = base_date + timedelta(days=i)
                daily = 4.0 + (i % 5) * 0.5
                
                is_anomaly = False
                if pole.pole_number.endswith('002') and i == 15:
                    daily = 15.0
                    is_anomaly = True

                cumulative += daily

                EnergyReading.objects.get_or_create(
                    light_pole=pole,
                    reading_date=reading_date,
                    defaults={
                        'daily_energy': daily,
                        'cumulative_energy': cumulative,
                        'is_anomaly': is_anomaly,
                        'anomaly_type': '能耗突增' if is_anomaly else '',
                    }
                )

    def create_work_orders(self):
        admin = User.objects.get(username='admin')
        inspector = User.objects.get(username='inspector')
        inspector2 = User.objects.get(username='inspector2')
        reviewer = User.objects.get(username='reviewer')

        pole1 = LightPole.objects.get(pole_number='LP-东城-001')
        pole2 = LightPole.objects.get(pole_number='LP-东城-002')
        pole3 = LightPole.objects.get(pole_number='LP-朝阳-001')
        pole4 = LightPole.objects.get(pole_number='LP-海淀-001')

        orders_data = [
            {
                'order_number': 'WO202401010001',
                'light_pole': pole1,
                'title': '路灯不亮修复',
                'fault_source': 'patrol',
                'fault_type': 'normal_repair',
                'description': '夜间巡逻发现该路灯不亮，需要检查灯泡和电路。',
                'status': 'archived',
                'reporter': admin,
                'inspector': inspector,
                'reviewer': reviewer,
                'repair_description': '更换LED灯泡，测试电路正常。',
                'anomaly_cause': '灯泡老化损坏',
                'review_comment': '修复合格，同意归档',
                'expected_energy': 4.5,
                'actual_energy': 4.3,
            },
            {
                'order_number': 'WO202401020002',
                'light_pole': pole2,
                'title': '能耗异常突增',
                'fault_source': 'automatic',
                'fault_type': 'energy_spike',
                'description': '系统检测到该灯杆近期能耗突增，从日均4kWh增至15kWh，请检查。',
                'status': 'reviewing',
                'reporter': admin,
                'inspector': inspector,
                'reviewer': reviewer,
                'repair_description': '检查发现控制器故障，导致常亮不灭。已更换控制器。',
                'anomaly_cause': '',
                'review_comment': '',
                'expected_energy': 4.5,
                'actual_energy': 15.2,
            },
            {
                'order_number': 'WO202401030003',
                'light_pole': pole3,
                'title': '位置编号错误',
                'fault_source': 'patrol',
                'fault_type': 'location_error',
                'description': '现场巡检发现该灯杆编号与系统记录不符，实际为另一灯杆。',
                'status': 'inspected',
                'reporter': admin,
                'inspector': inspector2,
                'reviewer': None,
                'repair_description': '现场核对发现灯杆编号与系统中不符，GPS坐标偏差约500米。',
                'anomaly_cause': '',
                'review_comment': '',
                'is_location_error': True,
                'location_error_note': '实际位置与系统记录的GPS坐标不符，设备绑定错误。',
            },
            {
                'order_number': 'WO202401040004',
                'light_pole': pole4,
                'title': '重复派单-路灯闪烁',
                'fault_source': 'citizen',
                'fault_type': 'duplicate',
                'description': '市民投诉该路灯频繁闪烁，影响夜间照明。（重复工单）',
                'status': 'returned',
                'reporter': admin,
                'inspector': inspector,
                'reviewer': reviewer,
                'repair_description': '检查了灯杆，未发现明显问题。',
                'anomaly_cause': '',
                'review_comment': '修复不彻底，需要重新检查电压稳定性。',
                'rework_count': 1,
                'expected_energy': 4.0,
                'actual_energy': 6.8,
            },
            {
                'order_number': 'WO202401050005',
                'light_pole': pole1,
                'title': '电路故障报修',
                'fault_source': 'manual',
                'fault_type': 'circuit_fault',
                'description': '电路跳闸，无法恢复供电。',
                'status': 'in_progress',
                'reporter': admin,
                'inspector': inspector2,
                'reviewer': None,
            },
        ]

        for data in orders_data:
            is_location_error = data.pop('is_location_error', False)
            location_error_note = data.pop('location_error_note', '')
            rework_count = data.pop('rework_count', 0)
            
            order, created = WorkOrder.objects.get_or_create(
                order_number=data['order_number'],
                defaults=data
            )
            
            if is_location_error:
                order.is_location_error = True
                order.location_error_note = location_error_note
                order.save()
            
            if rework_count > 0:
                order.rework_count = rework_count
                order.save()

            if created:
                WorkOrderHistory.objects.create(
                    work_order=order,
                    action='create',
                    operator=order.reporter,
                    comment='创建工单',
                    new_status=order.status
                )
                self.stdout.write(f'Created work order: {order.order_number}')
