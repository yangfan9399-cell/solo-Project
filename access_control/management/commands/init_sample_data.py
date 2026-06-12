from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from access_control.models import AccessRecoveryRecord
from access_control.services import WorkflowService
from datetime import date, timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = '初始化四类样本数据：正常放行、指标超限、现场证据缺失、审批超时'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样本数据...')

        admin_user, field_staff, reviewer = self._create_users()

        self._create_normal_release_sample(field_staff, reviewer, admin_user)
        self._create_over_limit_sample(field_staff, reviewer, admin_user)
        self._create_evidence_missing_sample(field_staff, reviewer, admin_user)
        self._create_timeout_sample(field_staff, reviewer, admin_user)

        self.stdout.write(self.style.SUCCESS('成功初始化4类样本数据！'))
        self.stdout.write(f'登录账号：')
        self.stdout.write(f'  管理员: admin / admin123')
        self.stdout.write(f'  现场人员: field01 / field123')
        self.stdout.write(f'  复核主管: reviewer01 / review123')

    def _create_users(self):
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': '管',
                'last_name': '理',
                'email': 'admin@university.edu',
                'role': User.Role.ADMIN,
                'department': '信息中心',
                'employee_id': 'ADM001',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        field_staff, _ = User.objects.get_or_create(
            username='field01',
            defaults={
                'first_name': '现',
                'last_name': '场',
                'email': 'field01@university.edu',
                'role': User.Role.FIELD_STAFF,
                'department': '实验室管理处',
                'employee_id': 'FLD001',
            }
        )
        field_staff.set_password('field123')
        field_staff.save()

        reviewer, _ = User.objects.get_or_create(
            username='reviewer01',
            defaults={
                'first_name': '复',
                'last_name': '核',
                'email': 'reviewer01@university.edu',
                'role': User.Role.REVIEWER,
                'department': '安全管理办公室',
                'employee_id': 'REV001',
            }
        )
        reviewer.set_password('review123')
        reviewer.save()

        return admin_user, field_staff, reviewer

    def _create_normal_release_sample(self, field_staff, reviewer, admin_user):
        self.stdout.write('创建【正常放行】样本...')

        today = date.today()

        record = AccessRecoveryRecord.objects.create(
            title='化学实验室A301门禁授权到期回收',
            source=AccessRecoveryRecord.SourceType.AUTO_SCAN,
            sample_type=AccessRecoveryRecord.SampleType.NORMAL_RELEASE,
            status=AccessRecoveryRecord.Status.PENDING_ACCEPT,
            applicant_name='张教授',
            applicant_dept='化学化工学院',
            applicant_id='PROF001',
            lab_name='化学实验室A301',
            lab_code='CHEM-A301',
            access_area='A栋3层公共实验区',
            original_authorized_date=today - timedelta(days=365),
            expiry_date=today - timedelta(days=7),
            deadline=timezone.now() - timedelta(days=3),
            authorized_person_count=12,
            involved_amount=Decimal('15000.00'),
            risk_level='low',
            created_by=admin_user,
        )
        record.save()

        WorkflowService.accept_record(record.id, field_staff, '系统自动扫描发现，受理成功。')
        WorkflowService.process_record(
            record.id, field_staff,
            business_note='该实验室为普通化学教学实验室，授权人员均为在校研究生和助教，共12人。授权于7天前到期，已按规定提前7天发出到期提醒。',
            site_description='现场核实门禁权限已回收，所有授权人员均已收到通知，无异常情况。',
            recovered_date=today - timedelta(days=5),
            conclusion='经现场核实，该批次授权已全部回收，人员均已通知到位，无遗留问题，同意归档。',
            recovery_basis='依据《高等学校实验室安全管理办法》第15条：实验室门禁授权有效期最长1年，到期自动回收。'
        )
        WorkflowService.submit_for_review(record.id, field_staff, '已完成现场核实，提交复核。')
        WorkflowService.review_approve(record.id, reviewer, '复核通过，同意归档。')

        self.stdout.write(self.style.SUCCESS(f'  已创建【正常放行】样本: {record.record_no}'))

    def _create_over_limit_sample(self, field_staff, reviewer, admin_user):
        self.stdout.write('创建【指标超限】样本...')

        today = date.today()

        record = AccessRecoveryRecord.objects.create(
            title='生物安全实验室P2-205授权到期回收',
            source=AccessRecoveryRecord.SourceType.AUTO_SCAN,
            sample_type=AccessRecoveryRecord.SampleType.OVER_LIMIT,
            status=AccessRecoveryRecord.Status.PENDING_ACCEPT,
            applicant_name='李研究员',
            applicant_dept='生命科学学院',
            applicant_id='RES002',
            lab_name='生物安全P2实验室',
            lab_code='BIO-P2-205',
            access_area='P2级生物安全实验区',
            original_authorized_date=today - timedelta(days=365),
            expiry_date=today - timedelta(days=3),
            deadline=timezone.now() + timedelta(days=2),
            authorized_person_count=78,
            involved_amount=Decimal('285000.00'),
            risk_level='high',
            created_by=admin_user,
        )
        record.save()

        WorkflowService.accept_record(record.id, field_staff, '系统自动扫描发现，高风险实验室。')
        WorkflowService.process_record(
            record.id, field_staff,
            business_note='该实验室为P2级生物安全实验室，涉及高致病性病原微生物研究。本次授权涉及78人，远超普通实验室50人标准，涉及金额28.5万元。',
            site_description='现场检查发现部分人员进出记录不完整，存在未授权人员进入记录3人次。',
            conclusion='该批次授权涉及人数和金额均超过阈值，已触发异常阻断，需补充审批材料。',
            recovery_basis='依据《生物安全实验室管理条例》第23条：P2实验室单次授权不得超过30人。',
            remedial_path='1. 核实超限原因并提交书面说明；2. 补充审批层级签字；3. 提交风险评估报告；4. 经部门主任审批后重新提交。'
        )

        self.stdout.write(self.style.SUCCESS(f'  已创建【指标超限】样本: {record.record_no}'))

    def _create_evidence_missing_sample(self, field_staff, reviewer, admin_user):
        self.stdout.write('创建【现场证据缺失】样本...')

        today = date.today()

        record = AccessRecoveryRecord.objects.create(
            title='物理实验中心B102机房门禁授权到期回收',
            source=AccessRecoveryRecord.SourceType.MANUAL_REPORT,
            sample_type=AccessRecoveryRecord.SampleType.EVIDENCE_MISSING,
            status=AccessRecoveryRecord.Status.PENDING_ACCEPT,
            applicant_name='王老师',
            applicant_dept='物理学院',
            applicant_id='TECH003',
            lab_name='物理实验中心B102',
            lab_code='PHY-B102',
            access_area='B栋1层计算机机房',
            original_authorized_date=today - timedelta(days=300),
            expiry_date=today - timedelta(days=10),
            deadline=timezone.now() + timedelta(days=5),
            authorized_person_count=25,
            involved_amount=Decimal('45000.00'),
            risk_level='medium',
            created_by=admin_user,
        )
        record.save()

        WorkflowService.accept_record(record.id, field_staff, '人工报备的机房授权到期。')
        WorkflowService.process_record(
            record.id, field_staff,
            business_note='该机房为本科教学用计算机机房，授权为本科生实验课程使用。',
            site_description='现场核实中，暂未收集到完整证据材料。',
            conclusion='缺少必需的现场证据，需补充材料。'
        )
        WorkflowService.submit_for_review(record.id, field_staff, '已完成初步处理，提交复核。')
        WorkflowService.review_reject(
            record.id, reviewer,
            reject_reason='缺少关键证据：现场照片、人员签字、门禁日志均未提供，无法确认回收情况。',
            remedial_path='请补充：1. 现场照片（含时间地点水印）；2. 相关人员签字确认；3. 对应时间段门禁日志。'
        )

        self.stdout.write(self.style.SUCCESS(f'  已创建【现场证据缺失】样本: {record.record_no}'))

    def _create_timeout_sample(self, field_staff, reviewer, admin_user):
        self.stdout.write('创建【审批超时】样本...')

        today = date.today()

        record = AccessRecoveryRecord.objects.create(
            title='材料科学实验室C501高温实验室授权到期回收',
            source=AccessRecoveryRecord.SourceType.AUDIT,
            sample_type=AccessRecoveryRecord.SampleType.TIMEOUT,
            status=AccessRecoveryRecord.Status.PENDING_ACCEPT,
            applicant_name='赵教授',
            applicant_dept='材料科学与工程学院',
            applicant_id='PROF004',
            lab_name='材料高温实验室C501',
            lab_code='MAT-C501',
            access_area='C栋5层高温实验区',
            original_authorized_date=today - timedelta(days=365),
            expiry_date=today - timedelta(days=20),
            deadline=timezone.now() - timedelta(days=15),
            authorized_person_count=18,
            involved_amount=Decimal('72000.00'),
            risk_level='high',
            created_by=admin_user,
        )
        record.save()

        WorkflowService.accept_record(record.id, field_staff, '审计发现高温实验室授权到期。')
        WorkflowService.process_record(
            record.id, field_staff,
            business_note='该实验室配备高温烧结炉、粉末冶金设备，存在高温、粉尘等安全风险。授权18人，金额7.2万元。',
            site_description='经现场检查，发现高温设备周边有违规操作记录3次，未穿戴防护装备情况2人次。',
            conclusion='已超过处理截止时间15天，存在重大安全隐患。',
            recovery_basis='依据《高温实验室安全管理规范》第8条：高温实验室授权必须在到期前完成回收。',
            remedial_path='1. 提交超时情况说明；2. 说明延迟原因及改进措施；3. 由主管复核人审批延期；4. 设定新的处理截止时间。'
        )
        WorkflowService.submit_for_review(record.id, field_staff, '已完成现场处理，提交复核。')

        self.stdout.write(self.style.SUCCESS(f'  已创建【审批超时】样本: {record.record_no}'))
