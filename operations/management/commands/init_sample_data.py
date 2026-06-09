from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta, time

from accounts.models import Role, UserProfile
from operations.models import (
    District, Vehicle, Route, Station, RouteAssignment,
    CheckIn, VehicleFault, Complaint, ReviewRecord, RouteEvent
)


class Command(BaseCommand):
    help = '初始化样本数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样本数据...')

        self._create_users()
        self._create_districts()
        self._create_vehicles()
        self._create_routes_and_stations()
        self._create_sample_assignments()

        self.stdout.write(self.style.SUCCESS('样本数据初始化完成！'))
        self.stdout.write('默认账号：admin / admin123')

    def _create_users(self):
        self.stdout.write('  - 创建用户...')

        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()
        admin_user.profile.real_name = '系统管理员'
        admin_user.profile.role = Role.SUPERVISOR
        admin_user.profile.phone = '13800000000'
        admin_user.profile.save()

        dispatcher1, _ = User.objects.get_or_create(
            username='dispatcher1',
            defaults={'email': 'dispatcher1@example.com'}
        )
        dispatcher1.set_password('123456')
        dispatcher1.save()
        dispatcher1.profile.real_name = '张调度'
        dispatcher1.profile.role = Role.DISPATCHER
        dispatcher1.profile.phone = '13800000001'
        dispatcher1.profile.save()

        driver1, _ = User.objects.get_or_create(
            username='driver1',
            defaults={'email': 'driver1@example.com'}
        )
        driver1.set_password('123456')
        driver1.save()
        driver1.profile.real_name = '李司机'
        driver1.profile.role = Role.DRIVER
        driver1.profile.phone = '13800000011'
        driver1.profile.save()

        driver2, _ = User.objects.get_or_create(
            username='driver2',
            defaults={'email': 'driver2@example.com'}
        )
        driver2.set_password('123456')
        driver2.save()
        driver2.profile.real_name = '王司机'
        driver2.profile.role = Role.DRIVER
        driver2.profile.phone = '13800000012'
        driver2.profile.save()

        inspector1, _ = User.objects.get_or_create(
            username='inspector1',
            defaults={'email': 'inspector1@example.com'}
        )
        inspector1.set_password('123456')
        inspector1.save()
        inspector1.profile.real_name = '赵巡检'
        inspector1.profile.role = Role.INSPECTOR
        inspector1.profile.phone = '13800000021'
        inspector1.profile.save()

        supervisor1, _ = User.objects.get_or_create(
            username='supervisor1',
            defaults={'email': 'supervisor1@example.com'}
        )
        supervisor1.set_password('123456')
        supervisor1.save()
        supervisor1.profile.real_name = '刘主管'
        supervisor1.profile.role = Role.SUPERVISOR
        supervisor1.profile.phone = '13800000031'
        supervisor1.profile.save()

        self.stdout.write('    完成：创建了 6 个用户（admin, dispatcher1, driver1, driver2, inspector1, supervisor1）')

    def _create_districts(self):
        self.stdout.write('  - 创建片区...')

        districts_data = [
            {'name': '东城区', 'code': 'DCQ01', 'description': '东部城区主要清运区域'},
            {'name': '西城区', 'code': 'XCQ01', 'description': '西部城区主要清运区域'},
            {'name': '南城区', 'code': 'NCQ01', 'description': '南部城区主要清运区域'},
            {'name': '北城区', 'code': 'BCQ01', 'description': '北部城区主要清运区域'},
        ]

        for data in districts_data:
            District.objects.get_or_create(code=data['code'], defaults=data)

        self.stdout.write('    完成：创建了 4 个片区')

    def _create_vehicles(self):
        self.stdout.write('  - 创建车辆...')

        district_dc = District.objects.get(code='DCQ01')
        district_xc = District.objects.get(code='XCQ01')
        district_nc = District.objects.get(code='NCQ01')
        district_bc = District.objects.get(code='BCQ01')

        driver1 = User.objects.get(username='driver1')
        driver2 = User.objects.get(username='driver2')

        vehicles_data = [
            {
                'plate_number': '粤A·12345',
                'vehicle_type': '压缩式垃圾车',
                'capacity': 8.0,
                'status': Vehicle.Status.AVAILABLE,
                'district': district_dc,
                'driver': driver1,
            },
            {
                'plate_number': '粤A·23456',
                'vehicle_type': '压缩式垃圾车',
                'capacity': 10.0,
                'status': Vehicle.Status.AVAILABLE,
                'district': district_dc,
                'driver': None,
            },
            {
                'plate_number': '粤A·34567',
                'vehicle_type': '餐厨垃圾车',
                'capacity': 5.0,
                'status': Vehicle.Status.AVAILABLE,
                'district': district_xc,
                'driver': driver2,
            },
            {
                'plate_number': '粤A·45678',
                'vehicle_type': '压缩式垃圾车',
                'capacity': 12.0,
                'status': Vehicle.Status.IN_SERVICE,
                'district': district_nc,
                'driver': None,
            },
            {
                'plate_number': '粤A·56789',
                'vehicle_type': '勾臂式垃圾车',
                'capacity': 6.0,
                'status': Vehicle.Status.AVAILABLE,
                'district': district_bc,
                'driver': None,
            },
            {
                'plate_number': '粤A·67890',
                'vehicle_type': '压缩式垃圾车',
                'capacity': 8.0,
                'status': Vehicle.Status.MAINTENANCE,
                'district': district_xc,
                'driver': None,
            },
        ]

        for data in vehicles_data:
            Vehicle.objects.get_or_create(plate_number=data['plate_number'], defaults=data)

        self.stdout.write('    完成：创建了 6 辆车')

    def _create_routes_and_stations(self):
        self.stdout.write('  - 创建路线和站点...')

        district_dc = District.objects.get(code='DCQ01')
        district_xc = District.objects.get(code='XCQ01')

        routes_data = [
            {
                'code': 'DC-001',
                'name': '东城一号路线',
                'district': district_dc,
                'estimated_duration': timedelta(hours=4, minutes=30),
                'distance_km': 25.5,
                'is_active': True,
                'description': '覆盖东城区主要商业区和居民区',
                'stations': [
                    {'name': '人民广场站', 'address': '东城区人民大道1号', 'order': 1, 'bin_count': 6},
                    {'name': '中山公园站', 'address': '东城区中山路23号', 'order': 2, 'bin_count': 4},
                    {'name': '新华小区站', 'address': '东城区新华路88号', 'order': 3, 'bin_count': 8},
                    {'name': '城东市场站', 'address': '东城区城东路156号', 'order': 4, 'bin_count': 10},
                    {'name': '朝阳花园站', 'address': '东城区朝阳路66号', 'order': 5, 'bin_count': 6},
                    {'name': '政府大院站', 'address': '东城区政府路1号', 'order': 6, 'bin_count': 5},
                ]
            },
            {
                'code': 'DC-002',
                'name': '东城二号路线',
                'district': district_dc,
                'estimated_duration': timedelta(hours=3, minutes=45),
                'distance_km': 18.0,
                'is_active': True,
                'description': '覆盖东城区工业园区',
                'stations': [
                    {'name': '工业园东门站', 'address': '东城区工业大道1号', 'order': 1, 'bin_count': 12},
                    {'name': '科技园站', 'address': '东城区科技路99号', 'order': 2, 'bin_count': 8},
                    {'name': '物流园站', 'address': '东城区物流大道200号', 'order': 3, 'bin_count': 15},
                    {'name': '保税区站', 'address': '东城区保税路1号', 'order': 4, 'bin_count': 6},
                ]
            },
            {
                'code': 'XC-001',
                'name': '西城一号路线',
                'district': district_xc,
                'estimated_duration': timedelta(hours=5, minutes=0),
                'distance_km': 30.0,
                'is_active': True,
                'description': '覆盖西城区老城区和居民区',
                'stations': [
                    {'name': '古城门站', 'address': '西城区古城路1号', 'order': 1, 'bin_count': 5},
                    {'name': '老街站', 'address': '西城区老街123号', 'order': 2, 'bin_count': 7},
                    {'name': '西湖公园站', 'address': '西城区西湖路1号', 'order': 3, 'bin_count': 4},
                    {'name': '师范附小站', 'address': '西城区教育路10号', 'order': 4, 'bin_count': 3},
                    {'name': '人民医院站', 'address': '西城区健康路1号', 'order': 5, 'bin_count': 10},
                    {'name': '城西小区站', 'address': '西城区城西大道666号', 'order': 6, 'bin_count': 9},
                    {'name': '火车站站', 'address': '西城区站前广场', 'order': 7, 'bin_count': 8},
                ]
            },
        ]

        for route_data in routes_data:
            stations_data = route_data.pop('stations')
            route, created = Route.objects.get_or_create(code=route_data['code'], defaults=route_data)
            if created:
                for s_data in stations_data:
                    Station.objects.create(route=route, **s_data)

        self.stdout.write('    完成：创建了 3 条路线，共 17 个站点')

    def _create_sample_assignments(self):
        self.stdout.write('  - 创建样本任务和数据...')

        dispatcher = User.objects.get(username='dispatcher1')
        driver1 = User.objects.get(username='driver1')
        driver2 = User.objects.get(username='driver2')
        inspector = User.objects.get(username='inspector1')
        supervisor = User.objects.get(username='supervisor1')

        route_dc001 = Route.objects.get(code='DC-001')
        route_dc002 = Route.objects.get(code='DC-002')
        route_xc001 = Route.objects.get(code='XC-001')

        vehicle1 = Vehicle.objects.get(plate_number='粤A·12345')
        vehicle2 = Vehicle.objects.get(plate_number='粤A·23456')
        vehicle3 = Vehicle.objects.get(plate_number='粤A·34567')

        today = timezone.localdate()

        # 样本1：正常完成的任务（昨天）
        self.stdout.write('    样本1：正常完成的任务')
        assignment1 = RouteAssignment.objects.create(
            route=route_dc001,
            vehicle=vehicle1,
            driver=driver1,
            dispatcher=dispatcher,
            assigned_date=today - timedelta(days=1),
            scheduled_start_time=time(8, 0),
            status=RouteAssignment.Status.COMPLETED,
            notes='日常清运任务'
        )
        assignment1.actual_start_time = timezone.make_aware(
            timezone.datetime.combine(today - timedelta(days=1), time(8, 15))
        )
        assignment1.actual_end_time = timezone.make_aware(
            timezone.datetime.combine(today - timedelta(days=1), time(12, 30))
        )
        assignment1.save()

        RouteEvent.objects.create(
            assignment=assignment1,
            event_type=RouteEvent.Type.ASSIGNED,
            description='调度员张调度分派任务',
            created_by=dispatcher,
            created_at=timezone.make_aware(
                timezone.datetime.combine(today - timedelta(days=1), time(7, 30))
            )
        )
        RouteEvent.objects.create(
            assignment=assignment1,
            event_type=RouteEvent.Type.STARTED,
            description='司机李司机开始作业',
            created_by=driver1,
            created_at=assignment1.actual_start_time
        )
        RouteEvent.objects.create(
            assignment=assignment1,
            event_type=RouteEvent.Type.COMPLETED,
            description='司机李司机完成作业',
            created_by=driver1,
            created_at=assignment1.actual_end_time
        )

        stations_dc001 = route_dc001.stations.order_by('order')
        for i, station in enumerate(stations_dc001):
            check_time = assignment1.actual_start_time + timedelta(minutes=30 + i * 40)
            CheckIn.objects.create(
                assignment=assignment1,
                station=station,
                driver=driver1,
                check_in_time=check_time,
                status=CheckIn.Status.NORMAL,
                waste_weight=500 + i * 50,
                notes=f'正常清运，共{station.bin_count}桶'
            )
            RouteEvent.objects.create(
                assignment=assignment1,
                event_type=RouteEvent.Type.CHECK_IN,
                description=f'站点签到：{station.name}，状态：正常',
                created_by=driver1,
                created_at=check_time
            )

        ReviewRecord.objects.create(
            assignment=assignment1,
            reviewer=supervisor,
            review_result=ReviewRecord.Result.PASS,
            review_notes='作业完成良好，所有站点正常清运，无投诉。',
            reviewed_at=assignment1.actual_end_time + timedelta(hours=2),
        )
        RouteEvent.objects.create(
            assignment=assignment1,
            event_type=RouteEvent.Type.REVIEW,
            description='主管复核结果：通过，意见：作业完成良好，所有站点正常清运，无投诉。',
            created_by=supervisor,
            created_at=assignment1.actual_end_time + timedelta(hours=2)
        )

        # 样本2：有站点漏收的任务（前天）
        self.stdout.write('    样本2：有站点漏收的任务')
        assignment2 = RouteAssignment.objects.create(
            route=route_xc001,
            vehicle=vehicle3,
            driver=driver2,
            dispatcher=dispatcher,
            assigned_date=today - timedelta(days=2),
            scheduled_start_time=time(7, 30),
            status=RouteAssignment.Status.COMPLETED,
            notes='老城区清运任务'
        )
        assignment2.actual_start_time = timezone.make_aware(
            timezone.datetime.combine(today - timedelta(days=2), time(7, 45))
        )
        assignment2.actual_end_time = timezone.make_aware(
            timezone.datetime.combine(today - timedelta(days=2), time(13, 0))
        )
        assignment2.save()

        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.ASSIGNED,
            description='调度员张调度分派任务',
            created_by=dispatcher,
            created_at=timezone.make_aware(
                timezone.datetime.combine(today - timedelta(days=2), time(7, 0))
            )
        )
        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.STARTED,
            description='司机王司机开始作业',
            created_by=driver2,
            created_at=assignment2.actual_start_time
        )
        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.COMPLETED,
            description='司机王司机完成作业',
            created_by=driver2,
            created_at=assignment2.actual_end_time
        )

        stations_xc001 = route_xc001.stations.order_by('order')
        for i, station in enumerate(stations_xc001):
            check_time = assignment2.actual_start_time + timedelta(minutes=30 + i * 35)
            if i in [3, 5]:  # 第4站和第6站漏收
                CheckIn.objects.create(
                    assignment=assignment2,
                    station=station,
                    driver=driver2,
                    check_in_time=check_time,
                    status=CheckIn.Status.MISSED,
                    waste_weight=0,
                    notes='站点漏收，未进行清运'
                )
                RouteEvent.objects.create(
                    assignment=assignment2,
                    event_type=RouteEvent.Type.CHECK_IN,
                    description=f'站点签到：{station.name}，状态：漏收',
                    created_by=driver2,
                    created_at=check_time
                )
            else:
                CheckIn.objects.create(
                    assignment=assignment2,
                    station=station,
                    driver=driver2,
                    check_in_time=check_time,
                    status=CheckIn.Status.NORMAL if i != 4 else CheckIn.Status.PARTIAL,
                    waste_weight=400 + i * 30,
                    notes='正常清运' if i != 4 else '部分清运，有2桶已满未清运'
                )
                RouteEvent.objects.create(
                    assignment=assignment2,
                    event_type=RouteEvent.Type.CHECK_IN,
                    description=f'站点签到：{station.name}，状态：{"正常" if i != 4 else "部分清运"}',
                    created_by=driver2,
                    created_at=check_time
                )

        # 漏收投诉
        missed_station = stations_xc001[3]  # 师范附小站
        complaint1 = Complaint.objects.create(
            station=missed_station,
            assignment=assignment2,
            complainant='王老师',
            complainant_phone='13900001111',
            complaint_type=Complaint.Type.MISSED_COLLECTION,
            description='今天垃圾没有清运，垃圾桶都满了，请尽快处理。',
            photo_evidence='https://picsum.photos/seed/complaint1/400/300',
            reported_at=assignment2.actual_end_time + timedelta(hours=1),
            status=Complaint.Status.CONFIRMED,
            inspector=inspector,
            confirmed_at=assignment2.actual_end_time + timedelta(hours=2),
            confirmed_notes='经核实，该站点确实未清运，已通知司机整改。'
        )
        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.COMPLAINT_RECEIVED,
            description=f'收到投诉：漏收投诉，站点：{missed_station.name}',
            created_by=inspector,
            created_at=complaint1.reported_at
        )
        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.COMPLAINT_CONFIRMED,
            description='巡检员确认投诉属实：经核实，该站点确实未清运，已通知司机整改。',
            created_by=inspector,
            created_at=complaint1.confirmed_at
        )

        # 漏收的另一个站点的满溢投诉
        missed_station2 = stations_xc001[5]  # 城西小区站
        complaint2 = Complaint.objects.create(
            station=missed_station2,
            assignment=assignment2,
            complainant='张女士',
            complainant_phone='13900002222',
            complaint_type=Complaint.Type.OVERFLOW,
            description='垃圾桶满溢，垃圾都堆到外面了，影响环境。',
            photo_evidence='https://picsum.photos/seed/overflow1/400/300',
            reported_at=assignment2.actual_end_time + timedelta(hours=2, minutes=30),
            status=Complaint.Status.PENDING,
        )
        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.COMPLAINT_RECEIVED,
            description=f'收到投诉：垃圾桶满溢，站点：{missed_station2.name}',
            created_by=inspector,
            created_at=complaint2.reported_at
        )

        # 主管复核
        review2 = ReviewRecord.objects.create(
            assignment=assignment2,
            reviewer=supervisor,
            review_result=ReviewRecord.Result.NEEDS_RECTIFICATION,
            review_notes='存在2个站点漏收和1起投诉，需立即整改。要求司机今日内完成补收，并提交整改说明。',
            reviewed_at=assignment2.actual_end_time + timedelta(hours=3),
            rectification_deadline=assignment2.actual_end_time + timedelta(hours=24),
        )
        RouteEvent.objects.create(
            assignment=assignment2,
            event_type=RouteEvent.Type.REVIEW,
            description='主管复核结果：需整改，意见：存在2个站点漏收和1起投诉，需立即整改。',
            created_by=supervisor,
            created_at=review2.reviewed_at
        )

        # 样本3：车辆故障的任务（今天的任务，进行中然后故障）
        self.stdout.write('    样本3：车辆故障的任务')
        assignment3 = RouteAssignment.objects.create(
            route=route_dc002,
            vehicle=vehicle2,
            driver=driver1,
            dispatcher=dispatcher,
            assigned_date=today,
            scheduled_start_time=time(9, 0),
            status=RouteAssignment.Status.SUSPENDED,
            notes='工业园清运任务'
        )
        assignment3.actual_start_time = timezone.make_aware(
            timezone.datetime.combine(today, time(9, 10))
        )
        assignment3.save()

        vehicle2.status = Vehicle.Status.FAULTY
        vehicle2.save()

        RouteEvent.objects.create(
            assignment=assignment3,
            event_type=RouteEvent.Type.ASSIGNED,
            description='调度员张调度分派任务',
            created_by=dispatcher,
            created_at=timezone.make_aware(
                timezone.datetime.combine(today, time(8, 30))
            )
        )
        RouteEvent.objects.create(
            assignment=assignment3,
            event_type=RouteEvent.Type.STARTED,
            description='司机李司机开始作业',
            created_by=driver1,
            created_at=assignment3.actual_start_time
        )

        stations_dc002 = route_dc002.stations.order_by('order')
        for i, station in enumerate(stations_dc002[:2]):  # 只完成前2个站
            check_time = assignment3.actual_start_time + timedelta(minutes=20 + i * 30)
            CheckIn.objects.create(
                assignment=assignment3,
                station=station,
                driver=driver1,
                check_in_time=check_time,
                status=CheckIn.Status.NORMAL,
                waste_weight=600 + i * 100,
                notes='正常清运'
            )
            RouteEvent.objects.create(
                assignment=assignment3,
                event_type=RouteEvent.Type.CHECK_IN,
                description=f'站点签到：{station.name}，状态：正常',
                created_by=driver1,
                created_at=check_time
            )

        fault = VehicleFault.objects.create(
            vehicle=vehicle2,
            assignment=assignment3,
            reporter=driver1,
            fault_type='液压系统故障',
            severity=VehicleFault.Severity.SEVERE,
            description='在工业园东门作业时液压系统突然失灵，无法继续压缩垃圾，已停靠在安全区域。',
            status=VehicleFault.Status.REPORTED,
        )
        RouteEvent.objects.create(
            assignment=assignment3,
            event_type=RouteEvent.Type.FAULT_REPORTED,
            description='车辆故障：液压系统故障，严重程度：严重。任务已暂停，请调度员改派或等待维修。',
            created_by=driver1,
            created_at=fault.reported_at
        )

        # 样本4：今天进行中的任务
        self.stdout.write('    样本4：今天进行中的任务')
        assignment4 = RouteAssignment.objects.create(
            route=route_dc001,
            vehicle=Vehicle.objects.get(plate_number='粤A·56789'),
            driver=driver2,
            dispatcher=dispatcher,
            assigned_date=today,
            scheduled_start_time=time(10, 0),
            status=RouteAssignment.Status.IN_PROGRESS,
            notes='替班任务'
        )
        assignment4.actual_start_time = timezone.make_aware(
            timezone.datetime.combine(today, time(10, 15))
        )
        assignment4.save()

        RouteEvent.objects.create(
            assignment=assignment4,
            event_type=RouteEvent.Type.ASSIGNED,
            description='调度员张调度分派任务',
            created_by=dispatcher,
            created_at=timezone.make_aware(
                timezone.datetime.combine(today, time(9, 30))
            )
        )
        RouteEvent.objects.create(
            assignment=assignment4,
            event_type=RouteEvent.Type.STARTED,
            description='司机王司机开始作业',
            created_by=driver2,
            created_at=assignment4.actual_start_time
        )

        for i, station in enumerate(stations_dc001[:3]):  # 完成了前3个站
            check_time = assignment4.actual_start_time + timedelta(minutes=25 + i * 35)
            CheckIn.objects.create(
                assignment=assignment4,
                station=station,
                driver=driver2,
                check_in_time=check_time,
                status=CheckIn.Status.NORMAL,
                waste_weight=550 + i * 30,
                notes='正常清运'
            )

        self.stdout.write('    完成：创建了 4 个样本任务')
        self.stdout.write('      - 正常完成任务：1 个')
        self.stdout.write('      - 漏收投诉任务：1 个（含 2 个漏收站点、2 起投诉）')
        self.stdout.write('      - 车辆故障任务：1 个（已暂停，待改派）')
        self.stdout.write('      - 进行中任务：1 个')
