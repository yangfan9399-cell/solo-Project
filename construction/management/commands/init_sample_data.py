from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta

from construction.models import (
    BillboardLocation, Worker, Qualification,
    WeatherRecord, ConstructionPlan, PlanWorker,
    AuditNode, DelayRecord
)

User = get_user_model()


class Command(BaseCommand):
    help = '初始化样本数据：正常完工、大风延期、审批材料缺失、现场返工'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样本数据...')

        self._create_users()
        self._create_locations()
        self._create_workers()
        self._create_weather_records()
        self._create_sample_plans()

        self.stdout.write(self.style.SUCCESS('样本数据初始化完成！'))

    def _create_users(self):
        self.stdout.write('  创建用户账号...')
        users_data = [
            {'username': 'admin1', 'role': 'admin', 'real_name': '系统管理员', 'password': '123456'},
            {'username': 'constructor1', 'role': 'constructor', 'real_name': '张施工队', 'password': '123456'},
            {'username': 'constructor2', 'role': 'constructor', 'real_name': '李施工队', 'password': '123456'},
            {'username': 'pm1', 'role': 'project_manager', 'real_name': '王经理', 'password': '123456'},
            {'username': 'pm2', 'role': 'project_manager', 'real_name': '赵经理', 'password': '123456'},
            {'username': 'safety1', 'role': 'safety_officer', 'real_name': '陈安全', 'password': '123456'},
            {'username': 'safety2', 'role': 'safety_officer', 'real_name': '刘安全', 'password': '123456'},
            {'username': 'acceptor1', 'role': 'acceptor', 'real_name': '周验收', 'password': '123456'},
            {'username': 'acceptor2', 'role': 'acceptor', 'real_name': '吴验收', 'password': '123456'},
        ]

        for data in users_data:
            if not User.objects.filter(username=data['username']).exists():
                user = User.objects.create_user(
                    username=data['username'],
                    password=data['password'],
                    role=data['role'],
                    real_name=data['real_name'],
                    is_staff=True,
                )
                self.stdout.write(f'    创建用户: {user.username} ({user.real_name})')

    def _create_locations(self):
        self.stdout.write('  创建点位数据...')
        locations_data = [
            {
                'code': 'SH-L001', 'name': '南京路步行街楼顶广告牌',
                'city': '上海', 'address': '上海市黄浦区南京东路100号',
                'location_type': 'rooftop', 'height': 35.0, 'width': 18.0, 'height_dim': 6.0,
                'description': '位于步行街核心商圈楼顶，人流量大'
            },
            {
                'code': 'BJ-L001', 'name': '国贸桥单立柱广告牌',
                'city': '北京', 'address': '北京市朝阳区国贸桥东南角',
                'location_type': 'standalone', 'height': 25.0, 'width': 20.0, 'height_dim': 7.0,
                'description': 'CBD核心区域单立柱广告牌'
            },
            {
                'code': 'SZ-L001', 'name': '华强北墙面广告牌',
                'city': '深圳', 'address': '深圳市福田区华强北路赛格大厦',
                'location_type': 'wall', 'height': 50.0, 'width': 25.0, 'height_dim': 10.0,
                'description': '电子商圈核心位置墙面广告'
            },
            {
                'code': 'GZ-L001', 'name': '天河城公交站亭广告牌',
                'city': '广州', 'address': '广州市天河区天河路208号',
                'location_type': 'bus_stop', 'height': 3.0, 'width': 4.0, 'height_dim': 2.5,
                'description': '核心商圈公交站亭广告位'
            },
            {
                'code': 'HZ-L001', 'name': '西湖地铁站广告牌',
                'city': '杭州', 'address': '杭州市西湖区龙翔桥地铁站',
                'location_type': 'subway', 'height': 3.5, 'width': 6.0, 'height_dim': 2.0,
                'description': '西湖景区地铁站内灯箱广告'
            },
            {
                'code': 'CD-L001', 'name': '春熙路楼顶广告牌',
                'city': '成都', 'address': '成都市锦江区春熙路步行街',
                'location_type': 'rooftop', 'height': 28.0, 'width': 15.0, 'height_dim': 5.0,
                'description': '春熙路商圈楼顶广告位'
            },
        ]

        for data in locations_data:
            if not BillboardLocation.objects.filter(code=data['code']).exists():
                BillboardLocation.objects.create(**data)
                self.stdout.write(f'    创建点位: {data["code"]} - {data["name"]}')

    def _create_workers(self):
        self.stdout.write('  创建施工人员和资质...')
        workers_data = [
            {
                'name': '李大明', 'id_card': '110101199001010001', 'phone': '13800138001',
                'gender': 'male', 'certs': [
                    {'cert_type': 'high_altitude', 'cert_no': 'GA2023001', 'years': 3},
                    {'cert_type': 'electrician', 'cert_no': 'DQ2023001', 'years': 3},
                ]
            },
            {
                'name': '王小红', 'id_card': '110101199202020002', 'phone': '13800138002',
                'gender': 'female', 'certs': [
                    {'cert_type': 'high_altitude', 'cert_no': 'GA2023002', 'years': 2},
                ]
            },
            {
                'name': '张建国', 'id_card': '110101198803030003', 'phone': '13800138003',
                'gender': 'male', 'certs': [
                    {'cert_type': 'high_altitude', 'cert_no': 'GA2023003', 'years': 5},
                    {'cert_type': 'welding', 'cert_no': 'HJ2023001', 'years': 5},
                    {'cert_type': 'lifting', 'cert_no': 'QZ2023001', 'years': 4},
                ]
            },
            {
                'name': '刘志强', 'id_card': '110101199504040004', 'phone': '13800138004',
                'gender': 'male', 'certs': [
                    {'cert_type': 'electrician', 'cert_no': 'DQ2023002', 'years': 2},
                ]
            },
            {
                'name': '陈海涛', 'id_card': '110101199105050005', 'phone': '13800138005',
                'gender': 'male', 'certs': [
                    {'cert_type': 'high_altitude', 'cert_no': 'GA2023004', 'years': 4},
                    {'cert_type': 'safety', 'cert_no': 'AQ2023001', 'years': 3},
                ]
            },
            {
                'name': '赵丽华', 'id_card': '110101199306060006', 'phone': '13800138006',
                'gender': 'female', 'certs': []
            },
        ]

        today = timezone.now().date()
        for data in workers_data:
            if not Worker.objects.filter(id_card=data['id_card']).exists():
                worker = Worker.objects.create(
                    name=data['name'],
                    id_card=data['id_card'],
                    phone=data['phone'],
                    gender=data['gender'],
                    birth_date=today.replace(year=today.year - 30),
                )
                self.stdout.write(f'    创建施工人员: {worker.name}')

                for cert_data in data['certs']:
                    issue_date = today.replace(year=today.year - cert_data['years'])
                    expiry_date = today.replace(year=today.year + 2)
                    Qualification.objects.create(
                        worker=worker,
                        cert_type=cert_data['cert_type'],
                        cert_no=cert_data['cert_no'],
                        issue_date=issue_date,
                        expiry_date=expiry_date,
                        is_valid=True,
                    )

    def _create_weather_records(self):
        self.stdout.write('  创建天气记录...')
        locations = BillboardLocation.objects.all()
        today = timezone.now().date()

        weather_patterns = [
            {'weather': 'sunny', 'wind_level': 2, 'wind_speed': 2.5, 'temp_high': 28, 'temp_low': 18},
            {'weather': 'cloudy', 'wind_level': 3, 'wind_speed': 4.0, 'temp_high': 25, 'temp_low': 16},
            {'weather': 'rain', 'wind_level': 4, 'wind_speed': 6.0, 'temp_high': 22, 'temp_low': 15},
            {'weather': 'thunderstorm', 'wind_level': 7, 'wind_speed': 15.0, 'temp_high': 26, 'temp_low': 20, 'warning': True},
            {'weather': 'sunny', 'wind_level': 8, 'wind_speed': 18.0, 'temp_high': 30, 'temp_low': 20, 'warning': True},
        ]

        for i, location in enumerate(locations):
            for day_offset in range(-3, 5):
                record_date = today + timedelta(days=day_offset)
                pattern_idx = (i + day_offset + 5) % len(weather_patterns)
                pattern = weather_patterns[pattern_idx]

                if not WeatherRecord.objects.filter(location=location, record_date=record_date).exists():
                    WeatherRecord.objects.create(
                        location=location,
                        record_date=record_date,
                        weather=pattern['weather'],
                        temperature_high=pattern['temp_high'],
                        temperature_low=pattern['temp_low'],
                        wind_level=pattern['wind_level'],
                        wind_speed=pattern['wind_speed'],
                        wind_direction='东南风',
                        humidity=60 + pattern_idx * 5,
                        has_wind_warning=pattern.get('warning', False),
                        warning_level='黄色预警' if pattern.get('warning') else '',
                    )
        self.stdout.write('    天气记录创建完成')

    def _create_sample_plans(self):
        self.stdout.write('  创建样本施工计划...')

        constructor1 = User.objects.get(username='constructor1')
        constructor2 = User.objects.get(username='constructor2')
        pm1 = User.objects.get(username='pm1')
        safety1 = User.objects.get(username='safety1')
        acceptor1 = User.objects.get(username='acceptor1')

        loc_sh = BillboardLocation.objects.get(code='SH-L001')
        loc_bj = BillboardLocation.objects.get(code='BJ-L001')
        loc_sz = BillboardLocation.objects.get(code='SZ-L001')
        loc_gz = BillboardLocation.objects.get(code='GZ-L001')

        workers = list(Worker.objects.all()[:4])

        today = timezone.now()

        # 样本1: 正常完工
        self.stdout.write('    [样本1] 正常完工的施工计划')
        plan1 = ConstructionPlan.objects.create(
            plan_no='JH202506010001',
            title='南京路步行街楼顶广告牌更换画面',
            location=loc_sh,
            constructor_team=constructor1,
            project_manager=pm1,
            safety_officer=safety1,
            planned_start_date=today.date() - timedelta(days=10),
            planned_end_date=today.date() - timedelta(days=7),
            actual_start_date=today.date() - timedelta(days=10),
            actual_end_date=today.date() - timedelta(days=8),
            construction_content='更换楼顶广告牌画面，包括旧画面拆除、新画面安装、灯光调试等工作。',
            materials='广告喷绘布×1，钢丝绳×4，LED灯珠×50，电源×2',
            safety_measures='佩戴安全带，设置安全警示区，双人作业，配备安全员',
            budget=28000,
            status='accepted',
            accept_time=today - timedelta(days=7),
            submit_time=today - timedelta(days=15),
        )
        for w in workers[:3]:
            PlanWorker.objects.get_or_create(plan=plan1, worker=w, defaults={'role': '施工员'})

        AuditNode.objects.create(plan=plan1, node_type='submit', operator=constructor1, status='completed', comment='提交施工计划')
        AuditNode.objects.create(plan=plan1, node_type='pm_review', operator=pm1, status='approved', comment='材料齐全，审核通过')
        AuditNode.objects.create(plan=plan1, node_type='safety_review', operator=safety1, status='approved', comment='天气良好，人员资质齐全，通过安全审核')
        AuditNode.objects.create(plan=plan1, node_type='start_work', operator=constructor1, status='completed', comment='确认开工')
        AuditNode.objects.create(plan=plan1, node_type='complete', operator=constructor1, status='completed', comment='施工完成，申请验收')
        AuditNode.objects.create(plan=plan1, node_type='acceptance', operator=acceptor1, status='approved', comment='施工质量合格，验收通过，已归档')

        # 样本2: 大风延期
        self.stdout.write('    [样本2] 大风延期的施工计划')
        plan2 = ConstructionPlan.objects.create(
            plan_no='JH202506020002',
            title='国贸桥单立柱广告牌钢结构检修',
            location=loc_bj,
            constructor_team=constructor2,
            project_manager=pm1,
            safety_officer=safety1,
            planned_start_date=today.date() + timedelta(days=1),
            planned_end_date=today.date() + timedelta(days=5),
            construction_content='单立柱广告牌钢结构检修、防腐处理、螺栓紧固。',
            materials='防腐漆×5桶，螺栓×100套，防锈底漆×3桶',
            safety_measures='高空作业系双钩安全带，设置警戒区域，风速大于6级停止作业',
            budget=35000,
            status='safety_approved',
            submit_time=today - timedelta(days=3),
            rework_count=0,
            has_delay=True,
        )
        for w in workers[:4]:
            PlanWorker.objects.get_or_create(plan=plan2, worker=w, defaults={'role': '施工员'})

        AuditNode.objects.create(plan=plan2, node_type='submit', operator=constructor2, status='completed', comment='提交施工计划')
        AuditNode.objects.create(plan=plan2, node_type='pm_review', operator=pm1, status='approved', comment='审核通过')
        AuditNode.objects.create(plan=plan2, node_type='safety_review', operator=safety1, status='approved', comment='人员资质齐全。注意：计划开工当日有大风预警，需确认天气情况')

        delay1 = DelayRecord.objects.create(
            plan=plan2,
            delay_type='wind',
            delay_days=3,
            original_date=plan2.planned_start_date,
            new_date=plan2.planned_start_date + timedelta(days=3),
            reason='根据天气预报，计划开工当日有8级大风，不符合高空作业安全要求，申请延期3天。',
            applicant=constructor2,
            approved=True,
            approver=safety1,
            approved_at=today - timedelta(days=1),
        )
        AuditNode.objects.create(plan=plan2, node_type='delay', operator=constructor2, status='approved',
                                 comment='申请大风延期3天 - 已批准')

        # 样本3: 审批材料缺失（项目经理退回）
        self.stdout.write('    [样本3] 审批材料缺失被退回')
        plan3 = ConstructionPlan.objects.create(
            plan_no='JH202506030003',
            title='华强北墙面广告牌安装',
            location=loc_sz,
            constructor_team=constructor1,
            project_manager=pm1,
            planned_start_date=today.date() + timedelta(days=3),
            planned_end_date=today.date() + timedelta(days=8),
            construction_content='墙面广告牌整体安装，包括支架焊接、面板安装、布线等。',
            materials='',
            safety_measures='',
            budget=68000,
            status='pm_rejected',
            submit_time=today - timedelta(days=1),
            rework_count=0,
        )
        for w in workers[1:4]:
            PlanWorker.objects.get_or_create(plan=plan3, worker=w, defaults={'role': '施工员'})

        AuditNode.objects.create(plan=plan3, node_type='submit', operator=constructor1, status='completed', comment='提交施工计划')
        AuditNode.objects.create(
            plan=plan3, node_type='pm_review', operator=pm1, status='rejected',
            comment='材料不完整：1. 缺少详细材料清单；2. 缺少安全措施方案；3. 施工内容描述不够详细。请补充后重新提交。'
        )

        # 样本4: 现场返工（验收退回）
        self.stdout.write('    [样本4] 现场返工')
        plan4 = ConstructionPlan.objects.create(
            plan_no='JH202506040004',
            title='天河城公交站亭广告牌更新',
            location=loc_gz,
            constructor_team=constructor2,
            project_manager=pm1,
            safety_officer=safety1,
            planned_start_date=today.date() - timedelta(days=5),
            planned_end_date=today.date() - timedelta(days=2),
            actual_start_date=today.date() - timedelta(days=5),
            actual_end_date=today.date() - timedelta(days=3),
            construction_content='公交站亭广告牌画面更换、灯箱检修。',
            materials='灯箱片×2，LED灯带×2卷，镇流器×4',
            safety_measures='设置施工警示牌，穿着反光背心，注意行人安全',
            budget=15000,
            status='acceptance_rejected',
            submit_time=today - timedelta(days=8),
            rework_count=1,
        )
        for w in workers[2:5]:
            PlanWorker.objects.get_or_create(plan=plan4, worker=w, defaults={'role': '施工员'})

        AuditNode.objects.create(plan=plan4, node_type='submit', operator=constructor2, status='completed', comment='提交施工计划')
        AuditNode.objects.create(plan=plan4, node_type='pm_review', operator=pm1, status='approved', comment='审核通过')
        AuditNode.objects.create(plan=plan4, node_type='safety_review', operator=safety1, status='approved', comment='安全审核通过')
        AuditNode.objects.create(plan=plan4, node_type='start_work', operator=constructor2, status='completed', comment='开工')
        AuditNode.objects.create(plan=plan4, node_type='complete', operator=constructor2, status='completed', comment='施工完成，申请验收')
        AuditNode.objects.create(
            plan=plan4, node_type='acceptance', operator=acceptor1, status='rejected',
            comment='验收不合格：1. 灯箱画面有气泡，平整度不达标；2. 部分LED灯珠不亮；3. 边框密封不严。需返工。'
        )
        AuditNode.objects.create(plan=plan4, node_type='rework', operator=acceptor1, status='completed', comment='第1次返工')

        # 样本5: 进行中的计划
        self.stdout.write('    [样本5] 施工中的计划')
        plan5 = ConstructionPlan.objects.create(
            plan_no='JH202506050005',
            title='西湖地铁站灯箱广告安装',
            location=BillboardLocation.objects.get(code='HZ-L001'),
            constructor_team=constructor1,
            project_manager=pm1,
            safety_officer=safety1,
            planned_start_date=today.date() - timedelta(days=2),
            planned_end_date=today.date() + timedelta(days=1),
            actual_start_date=today.date() - timedelta(days=2),
            construction_content='地铁站内灯箱广告安装，包括支架固定、灯箱安装、电源接线。',
            materials='超薄灯箱×4，LED光源×4套，电源适配器×4',
            safety_measures='地铁站内施工需遵守地铁运营规定，夜间施工，设置围挡和警示灯',
            budget=22000,
            status='in_progress',
            submit_time=today - timedelta(days=7),
        )
        for w in workers[:3]:
            PlanWorker.objects.get_or_create(plan=plan5, worker=w, defaults={'role': '施工员'})

        AuditNode.objects.create(plan=plan5, node_type='submit', operator=constructor1, status='completed', comment='提交施工计划')
        AuditNode.objects.create(plan=plan5, node_type='pm_review', operator=pm1, status='approved', comment='审核通过')
        AuditNode.objects.create(plan=plan5, node_type='safety_review', operator=safety1, status='approved', comment='安全审核通过')
        AuditNode.objects.create(plan=plan5, node_type='start_work', operator=constructor1, status='completed', comment='确认开工')

        self.stdout.write('    共创建5个样本施工计划')
