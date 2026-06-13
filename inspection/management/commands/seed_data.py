from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.hashers import make_password
from datetime import timedelta
from inspection.models import (
    User, CablewayEquipment, DailyInspection, InspectionMetric,
    ApprovalNode, EvidenceAttachment, BusinessRecord
)
import uuid


class Command(BaseCommand):
    help = '初始化演示数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化数据...')

        self._create_users()
        self._create_equipments()
        self._create_sample_records()

        self.stdout.write(self.style.SUCCESS('数据初始化完成！'))

    def _create_users(self):
        self.stdout.write('创建用户...')

        users_data = [
            {'username': 'admin', 'role': 'admin', 'first_name': '系统', 'last_name': '管理员', 'is_staff': True, 'is_superuser': True},
            {'username': 'field_zhang', 'role': 'field', 'first_name': '张', 'last_name': '明', 'department': '索道运营部'},
            {'username': 'field_li', 'role': 'field', 'first_name': '李', 'last_name': '华', 'department': '索道运营部'},
            {'username': 'field_wang', 'role': 'field', 'first_name': '王', 'last_name': '强', 'department': '设备维护部'},
            {'username': 'supervisor_chen', 'role': 'supervisor', 'first_name': '陈', 'last_name': '主任', 'department': '安全质量部'},
            {'username': 'supervisor_liu', 'role': 'supervisor', 'first_name': '刘', 'last_name': '总工', 'department': '技术部'},
        ]

        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'role': data['role'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'password': make_password('password123'),
                    'is_staff': data.get('is_staff', False),
                    'is_superuser': data.get('is_superuser', False),
                    'department': data.get('department', ''),
                    'phone': f'138{10000000 + hash(data["username"]) % 10000000}',
                }
            )
            if created:
                self.stdout.write(f'  创建用户: {user.username}')

    def _create_equipments(self):
        self.stdout.write('创建索道设备...')

        equipments_data = [
            {'equipment_no': 'SD-001', 'name': '一号索道', 'location': '主峰线', 'manufacturer': '某索道设备厂', 'status': 'running'},
            {'equipment_no': 'SD-002', 'name': '二号索道', 'location': '西坡线', 'manufacturer': '某索道设备厂', 'status': 'running'},
            {'equipment_no': 'SD-003', 'name': '三号索道', 'location': '南坡线', 'manufacturer': '进口索道公司', 'status': 'maintenance'},
            {'equipment_no': 'SD-004', 'name': '观光索道', 'location': '景区东门', 'manufacturer': '进口索道公司', 'status': 'running'},
        ]

        for data in equipments_data:
            eq, created = CablewayEquipment.objects.get_or_create(
                equipment_no=data['equipment_no'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  创建设备: {eq.equipment_no}')

    def _create_sample_records(self):
        self.stdout.write('创建日检样本记录...')

        self._create_normal_record()
        self._create_metric_exceed_record()
        self._create_evidence_missing_record()
        self._create_timeout_record()

    def _create_normal_record(self):
        self.stdout.write('  创建正常放行样本...')

        equipment = CablewayEquipment.objects.get(equipment_no='SD-001')
        inspector = User.objects.get(username='field_zhang')
        supervisor = User.objects.get(username='supervisor_chen')

        inspection = DailyInspection.objects.filter(inspection_no='RJ20240601001').first()
        if inspection:
            self.stdout.write('    已存在，跳过')
            return

        inspection = DailyInspection.objects.create(
            id=uuid.uuid4(),
            inspection_no='RJ20240601001',
            equipment=equipment,
            source='scheduled',
            inspection_date=timezone.now().date() - timedelta(days=3),
            inspector=inspector,
            current_handler=None,
            status='approved',
            abnormal_type='normal',
            is_archived=True,
            summary='一号索道日常巡检，各项指标正常，设备运行状态良好。',
            conclusion='所有日检项均符合标准，正常放行运行。',
            block_reason='',
            remediation_path='',
            estimated_loss=0,
            actual_loss=0,
            responsible_party='',
            submitted_at=timezone.now() - timedelta(days=3, hours=-2),
            reviewed_at=timezone.now() - timedelta(days=3, hours=-4),
            archived_at=timezone.now() - timedelta(days=2),
            deadline=timezone.now() - timedelta(days=2),
        )

        metrics_data = [
            ('主电机运行电流', 'mechanical', '≤80A', '65A', 'A', False, '', 1),
            ('减速机温度', 'mechanical', '≤75℃', '62℃', '℃', False, '', 2),
            ('钢丝绳磨损量', 'mechanical', '≤10%', '3%', '%', False, '', 3),
            ('抱索器夹持力', 'mechanical', '≥20kN', '25kN', 'kN', False, '', 4),
            ('制动系统压力', 'safety', '≥1.5MPa', '1.8MPa', 'MPa', False, '', 5),
            ('安全钳间隙', 'safety', '0.5-1.0mm', '0.7mm', 'mm', False, '', 6),
            ('避雷系统接地电阻', 'electrical', '≤4Ω', '2.5Ω', 'Ω', False, '', 7),
            ('控制柜温度', 'electrical', '≤40℃', '32℃', '℃', False, '', 8),
            ('支架基础沉降', 'structure', '无明显沉降', '无沉降', '', False, '', 9),
            ('站台结构', 'structure', '结构完好', '完好', '', False, '', 10),
        ]

        for name, cat, std, meas, unit, abnormal, desc, order in metrics_data:
            InspectionMetric.objects.create(
                inspection=inspection,
                metric_name=name,
                category=cat,
                standard_value=std,
                measured_value=meas,
                unit=unit,
                is_abnormal=abnormal,
                abnormal_desc=desc,
                sort_order=order,
            )

        submit_node = ApprovalNode.objects.create(
            inspection=inspection,
            action='submit',
            operator=inspector,
            previous_status='pending',
            next_status='processing',
            remarks='日检完成，各项指标正常，提交受理。',
            basis='《索道设备日常检修规程》第3.1条',
            action_time=timezone.now() - timedelta(days=3, hours=-2),
        )

        accept_node = ApprovalNode.objects.create(
            inspection=inspection,
            action='accept',
            operator=supervisor,
            previous_status='pending',
            next_status='processing',
            remarks='已受理，安排复核。',
            action_time=timezone.now() - timedelta(days=3, hours=-3),
        )

        review_node = ApprovalNode.objects.create(
            inspection=inspection,
            action='submit_review',
            operator=inspector,
            previous_status='processing',
            next_status='reviewing',
            remarks='日检数据完整，提交复核。',
            action_time=timezone.now() - timedelta(days=3, hours=-3, minutes=-30),
        )

        approve_node = ApprovalNode.objects.create(
            inspection=inspection,
            action='approve',
            operator=supervisor,
            previous_status='reviewing',
            next_status='approved',
            remarks='数据完整，指标正常，同意放行。',
            basis='《索道安全运营标准》GB 12352-2007',
            action_time=timezone.now() - timedelta(days=3, hours=-4),
        )

        archive_node = ApprovalNode.objects.create(
            inspection=inspection,
            action='archive',
            operator=supervisor,
            previous_status='approved',
            next_status='archived',
            remarks='记录归档。',
            action_time=timezone.now() - timedelta(days=2),
        )

        self.stdout.write('    完成')

    def _create_metric_exceed_record(self):
        self.stdout.write('  创建指标超限样本...')

        equipment = CablewayEquipment.objects.get(equipment_no='SD-002')
        inspector = User.objects.get(username='field_li')
        supervisor = User.objects.get(username='supervisor_chen')

        inspection = DailyInspection.objects.filter(inspection_no='RJ20240602001').first()
        if inspection:
            self.stdout.write('    已存在，跳过')
            return

        inspection = DailyInspection.objects.create(
            id=uuid.uuid4(),
            inspection_no='RJ20240602001',
            equipment=equipment,
            source='scheduled',
            inspection_date=timezone.now().date() - timedelta(days=2),
            inspector=inspector,
            current_handler=supervisor,
            status='reviewing',
            abnormal_type='metric_exceed',
            is_archived=False,
            summary='二号索道日常巡检，发现减速机温度超限，已安排复检。',
            conclusion='',
            block_reason='减速机运行温度超出标准限值，存在过热风险，可能导致设备故障停运。',
            remediation_path='1. 立即停运检查；2. 检查冷却系统；3. 检查润滑油油位和油质；4. 必要时更换轴承；5. 温度恢复正常后试运行2小时确认。',
            estimated_loss=50000,
            actual_loss=None,
            responsible_party='',
            submitted_at=timezone.now() - timedelta(days=2, hours=-3),
            reviewed_at=None,
            archived_at=None,
            deadline=timezone.now() + timedelta(hours=12),
        )

        metrics_data = [
            ('主电机运行电流', 'mechanical', '≤80A', '72A', 'A', False, '', 1),
            ('减速机温度', 'mechanical', '≤75℃', '82℃', '℃', True, '温度超出标准7℃', 2),
            ('钢丝绳磨损量', 'mechanical', '≤10%', '5%', '%', False, '', 3),
            ('抱索器夹持力', 'mechanical', '≥20kN', '23kN', 'kN', False, '', 4),
            ('制动系统压力', 'safety', '≥1.5MPa', '1.6MPa', 'MPa', False, '', 5),
            ('减速机润滑油油温', 'mechanical', '≤70℃', '78℃', '℃', True, '油温偏高，与温度超限相关', 6),
            ('冷却风扇转速', 'electrical', '正常运转', '转速偏低', '', True, '冷却效果不足', 7),
            ('控制柜温度', 'electrical', '≤40℃', '38℃', '℃', False, '', 8),
        ]

        for name, cat, std, meas, unit, abnormal, desc, order in metrics_data:
            InspectionMetric.objects.create(
                inspection=inspection,
                metric_name=name,
                category=cat,
                standard_value=std,
                measured_value=meas,
                unit=unit,
                is_abnormal=abnormal,
                abnormal_desc=desc,
                sort_order=order,
            )

        BusinessRecord.objects.create(
            inspection=inspection,
            record_type='fault',
            title='减速机温度异常记录',
            content='6月2日上午10:30巡检时发现二号索道减速机温度达到82℃，超过标准限值75℃。已立即上报主管，安排停运检查。',
            recorded_by=inspector,
            record_time=timezone.now() - timedelta(days=2, hours=-3),
        )

        BusinessRecord.objects.create(
            inspection=inspection,
            record_type='maintenance',
            title='冷却系统检查记录',
            content='检查冷却系统发现冷却风扇转速偏低，风扇皮带松弛。已调整皮带张紧度，风扇转速恢复正常。',
            recorded_by=inspector,
            record_time=timezone.now() - timedelta(days=2, hours=-5),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='submit',
            operator=inspector,
            previous_status='pending',
            next_status='processing',
            remarks='日检发现减速机温度超限，已记录异常并提交受理。',
            basis='《索道设备日常检修规程》第4.2条',
            action_time=timezone.now() - timedelta(days=2, hours=-3),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='accept',
            operator=supervisor,
            previous_status='pending',
            next_status='processing',
            remarks='已受理，请现场人员补充检查冷却系统。',
            action_time=timezone.now() - timedelta(days=2, hours=-4),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='process',
            operator=inspector,
            previous_status='processing',
            next_status='processing',
            remarks='已检查冷却系统，调整风扇皮带，温度有所下降但仍偏高。建议更换润滑油后观察。',
            is_key_change=True,
            key_change_desc='补充冷却系统检查记录，调整风扇皮带',
            action_time=timezone.now() - timedelta(days=1, hours=-6),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='submit_review',
            operator=inspector,
            previous_status='processing',
            next_status='reviewing',
            remarks='已完成初步处理，温度有所下降，提交复核。',
            action_time=timezone.now() - timedelta(days=1),
        )

        self.stdout.write('    完成')

    def _create_evidence_missing_record(self):
        self.stdout.write('  创建现场证据缺失样本...')

        equipment = CablewayEquipment.objects.get(equipment_no='SD-003')
        inspector = User.objects.get(username='field_wang')
        supervisor = User.objects.get(username='supervisor_liu')

        inspection = DailyInspection.objects.filter(inspection_no='RJ20240603001').first()
        if inspection:
            self.stdout.write('    已存在，跳过')
            return

        inspection = DailyInspection.objects.create(
            id=uuid.uuid4(),
            inspection_no='RJ20240603001',
            equipment=equipment,
            source='incident',
            inspection_date=timezone.now().date() - timedelta(days=1),
            inspector=inspector,
            current_handler=inspector,
            status='returned',
            abnormal_type='evidence_missing',
            is_archived=False,
            summary='三号索道维护期间发现制动系统异常，现场证据不足，需补充。',
            conclusion='',
            block_reason='制动系统压力检测记录不完整，缺少现场照片和视频证据，无法确认异常程度。',
            remediation_path='1. 补充拍摄制动系统整体照片；2. 录制制动测试过程视频；3. 提供压力表读数特写照片；4. 补充第三方检测报告（如有）。',
            estimated_loss=20000,
            actual_loss=None,
            responsible_party='',
            submitted_at=timezone.now() - timedelta(days=1, hours=-4),
            reviewed_at=None,
            archived_at=None,
            deadline=timezone.now() + timedelta(hours=24),
        )

        metrics_data = [
            ('制动系统压力', 'safety', '≥1.5MPa', '1.2MPa', 'MPa', True, '压力偏低，低于标准值', 1),
            ('制动片磨损量', 'safety', '≤3mm', '2.5mm', 'mm', False, '', 2),
            ('液压油液位', 'mechanical', '正常范围', '偏低', '', True, '液位偏低，可能影响制动效果', 3),
            ('管路密封性', 'safety', '无泄漏', '有轻微渗漏', '', True, '发现管路接口处有渗漏痕迹', 4),
        ]

        for name, cat, std, meas, unit, abnormal, desc, order in metrics_data:
            InspectionMetric.objects.create(
                inspection=inspection,
                metric_name=name,
                category=cat,
                standard_value=std,
                measured_value=meas,
                unit=unit,
                is_abnormal=abnormal,
                abnormal_desc=desc,
                sort_order=order,
            )

        BusinessRecord.objects.create(
            inspection=inspection,
            record_type='incident',
            title='制动系统压力异常事件',
            content='维护检查时发现三号索道制动系统压力偏低，压力表显示1.2MPa，低于标准值1.5MPa。已记录异常情况。',
            recorded_by=inspector,
            record_time=timezone.now() - timedelta(days=1, hours=-5),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='submit',
            operator=inspector,
            previous_status='pending',
            next_status='processing',
            remarks='维护检查发现制动系统压力异常，提交受理。',
            basis='《索道设备维护规程》第5.3条',
            action_time=timezone.now() - timedelta(days=1, hours=-4),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='accept',
            operator=supervisor,
            previous_status='pending',
            next_status='processing',
            remarks='已受理，请准备复核。',
            action_time=timezone.now() - timedelta(days=1, hours=-5),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='submit_review',
            operator=inspector,
            previous_status='processing',
            next_status='reviewing',
            remarks='已完成初步检查，提交复核。',
            action_time=timezone.now() - timedelta(days=1, hours=-6),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='return',
            operator=supervisor,
            previous_status='reviewing',
            next_status='returned',
            remarks='现场证据不足，缺少制动系统照片和视频证据。请补充：1. 制动系统整体照片；2. 制动测试视频；3. 压力表读数特写。',
            basis='《索道安全检查证据管理规范》第2.1条',
            is_key_change=True,
            key_change_desc='退回补证：需补充制动系统照片、视频证据',
            action_time=timezone.now() - timedelta(days=1),
        )

        self.stdout.write('    完成')

    def _create_timeout_record(self):
        self.stdout.write('  创建审批超时样本...')

        equipment = CablewayEquipment.objects.get(equipment_no='SD-004')
        inspector = User.objects.get(username='field_zhang')
        supervisor = User.objects.get(username='supervisor_liu')

        inspection = DailyInspection.objects.filter(inspection_no='RJ20240604001').first()
        if inspection:
            self.stdout.write('    已存在，跳过')
            return

        inspection = DailyInspection.objects.create(
            id=uuid.uuid4(),
            inspection_no='RJ20240604001',
            equipment=equipment,
            source='complaint',
            inspection_date=timezone.now().date() - timedelta(days=5),
            inspector=inspector,
            current_handler=supervisor,
            status='timeout',
            abnormal_type='approval_timeout',
            is_archived=False,
            summary='观光索道收到游客投诉运行有异响，日检后未及时审批。',
            conclusion='',
            block_reason='审批流程超时，超过规定的24小时审批时限，需立即处理。',
            remediation_path='1. 立即启动超时预警；2. 通知主管复核人优先处理；3. 如主管不在，通知上级主管；4. 记录超时原因；5. 优化审批流程。',
            estimated_loss=15000,
            actual_loss=None,
            responsible_party='',
            submitted_at=timezone.now() - timedelta(days=5),
            reviewed_at=None,
            archived_at=None,
            deadline=timezone.now() - timedelta(days=4),
        )

        metrics_data = [
            ('主电机运行电流', 'mechanical', '≤80A', '70A', 'A', False, '', 1),
            ('减速机温度', 'mechanical', '≤75℃', '70℃', '℃', False, '', 2),
            ('钢丝绳磨损量', 'mechanical', '≤10%', '8%', '%', False, '', 3),
            ('抱索器夹持力', 'mechanical', '≥20kN', '22kN', 'kN', False, '', 4),
            ('运行异响', 'mechanical', '无异常', '有轻微异响', '', True, '游客投诉有异响，现场检查确认存在轻微异响', 5),
            ('支架螺栓紧固', 'structure', '紧固良好', '部分松动', '', True, '3号支架有2颗螺栓扭矩偏低', 6),
        ]

        for name, cat, std, meas, unit, abnormal, desc, order in metrics_data:
            InspectionMetric.objects.create(
                inspection=inspection,
                metric_name=name,
                category=cat,
                standard_value=std,
                measured_value=meas,
                unit=unit,
                is_abnormal=abnormal,
                abnormal_desc=desc,
                sort_order=order,
            )

        BusinessRecord.objects.create(
            inspection=inspection,
            record_type='complaint',
            title='游客投诉索道异响',
            content='6月4日上午收到游客投诉，称乘坐观光索道时听到异常响声。已记录投诉单号：TS2024060401。',
            recorded_by=inspector,
            record_time=timezone.now() - timedelta(days=5, hours=-2),
        )

        BusinessRecord.objects.create(
            inspection=inspection,
            record_type='incident',
            title='异响检查记录',
            content='现场检查发现3号支架螺栓有松动，已初步紧固，异响有所减轻。建议进一步检查。',
            recorded_by=inspector,
            record_time=timezone.now() - timedelta(days=5),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='submit',
            operator=inspector,
            previous_status='pending',
            next_status='processing',
            remarks='游客投诉异响，已检查并初步处理，提交受理。',
            basis='《游客投诉处理规程》第3.2条',
            action_time=timezone.now() - timedelta(days=5),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='accept',
            operator=supervisor,
            previous_status='pending',
            next_status='processing',
            remarks='已受理。',
            action_time=timezone.now() - timedelta(days=5, hours=-1),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='submit_review',
            operator=inspector,
            previous_status='processing',
            next_status='reviewing',
            remarks='已完成初步处理，提交复核。',
            action_time=timezone.now() - timedelta(days=5, hours=-3),
        )

        ApprovalNode.objects.create(
            inspection=inspection,
            action='timeout',
            operator=User.objects.get(username='admin'),
            previous_status='reviewing',
            next_status='timeout',
            remarks='审批超时，超过24小时时限，系统自动标记。',
            basis='《审批时限管理规定》第4.1条',
            is_key_change=True,
            key_change_desc='审批超时：超过24小时审批时限',
            action_time=timezone.now() - timedelta(days=4),
        )

        self.stdout.write('    完成')
