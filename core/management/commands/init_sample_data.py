from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from core.models import (
    User, Role, College, ResearchProject, BudgetSubject,
    ProjectBudget, Supplier, Procurement, ProcurementStatus,
    ExceptionReason, Acceptance, Invoice, add_history_node
)


class Command(BaseCommand):
    help = '初始化样本数据'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write('开始初始化样本数据...')

        self._create_colleges()
        self._create_users()
        self._create_budget_subjects()
        self._create_projects()
        self._create_suppliers()
        self._create_sample_procurements()

        self.stdout.write(self.style.SUCCESS('样本数据初始化完成！'))

    def _create_colleges(self):
        self.stdout.write('  创建学院...')
        colleges_data = [
            {'name': '计算机科学与技术学院', 'code': 'CS'},
            {'name': '电子信息工程学院', 'code': 'EE'},
            {'name': '机械工程学院', 'code': 'ME'},
            {'name': '材料科学与工程学院', 'code': 'MS'},
        ]
        self.colleges = {}
        for data in colleges_data:
            college, _ = College.objects.get_or_create(
                code=data['code'],
                defaults={'name': data['name']}
            )
            self.colleges[data['code']] = college
        self.stdout.write('    学院创建完成')

    def _create_users(self):
        self.stdout.write('  创建用户...')
        self.users = {}

        cs_college = self.colleges['CS']

        users_data = [
            {
                'username': 'researcher',
                'password': 'test123456',
                'role': Role.RESEARCHER,
                'email': 'researcher@univ.edu',
                'college': cs_college,
                'first_name': '张',
                'last_name': '科研',
            },
            {
                'username': 'college_admin',
                'password': 'test123456',
                'role': Role.COLLEGE_ADMIN,
                'email': 'admin@cs.univ.edu',
                'college': cs_college,
                'first_name': '李',
                'last_name': '管理员',
            },
            {
                'username': 'asset_staff',
                'password': 'test123456',
                'role': Role.ASSET_STAFF,
                'email': 'asset@univ.edu',
                'first_name': '王',
                'last_name': '资产',
            },
            {
                'username': 'finance_staff',
                'password': 'test123456',
                'role': Role.FINANCE_STAFF,
                'email': 'finance@univ.edu',
                'first_name': '赵',
                'last_name': '财务',
            },
            {
                'username': 'researcher2',
                'password': 'test123456',
                'role': Role.RESEARCHER,
                'email': 'researcher2@univ.edu',
                'college': self.colleges['EE'],
                'first_name': '陈',
                'last_name': '科研',
            },
        ]

        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'role': data['role'],
                    'email': data['email'],
                    'college': data.get('college'),
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'is_staff': True,
                }
            )
            if created:
                user.set_password(data['password'])
                user.save()
            self.users[data['username']] = user
        self.stdout.write('    用户创建完成')

    def _create_budget_subjects(self):
        self.stdout.write('  创建预算科目...')
        subjects_data = [
            {'code': '01', 'name': '设备费', 'parent': None},
            {'code': '0101', 'name': '设备购置费', 'parent_code': '01'},
            {'code': '0102', 'name': '设备试制费', 'parent_code': '01'},
            {'code': '02', 'name': '材料费', 'parent': None},
            {'code': '03', 'name': '测试化验加工费', 'parent': None},
            {'code': '04', 'name': '差旅费', 'parent': None},
            {'code': '05', 'name': '会议费', 'parent': None},
            {'code': '06', 'name': '劳务费', 'parent': None},
        ]

        self.subjects = {}
        for data in subjects_data:
            parent = None
            if data.get('parent_code'):
                parent = self.subjects.get(data['parent_code'])
            subject, _ = BudgetSubject.objects.get_or_create(
                code=data['code'],
                defaults={
                    'name': data['name'],
                    'parent': parent,
                }
            )
            self.subjects[data['code']] = subject
        self.stdout.write('    预算科目创建完成')

    def _create_projects(self):
        self.stdout.write('  创建课题...')
        self.projects = {}

        projects_data = [
            {
                'project_no': 'KJ2024001',
                'name': '人工智能与机器学习研究',
                'college': self.colleges['CS'],
                'principal': self.users['researcher'],
                'start_date': timezone.now().date() - timedelta(days=180),
                'end_date': timezone.now().date() + timedelta(days=365 * 2),
                'total_budget': Decimal('500000.00'),
                'description': '研究人工智能在各领域的应用，重点关注深度学习算法优化。',
            },
            {
                'project_no': 'KJ2024002',
                'name': '5G通信关键技术研究',
                'college': self.colleges['EE'],
                'principal': self.users['researcher2'],
                'start_date': timezone.now().date() - timedelta(days=90),
                'end_date': timezone.now().date() + timedelta(days=365),
                'total_budget': Decimal('800000.00'),
                'description': '研究5G通信网络中的关键技术难题。',
            },
            {
                'project_no': 'KJ2024003',
                'name': '新型材料研发与应用',
                'college': self.colleges['MS'],
                'principal': self.users['researcher'],
                'start_date': timezone.now().date() - timedelta(days=30),
                'end_date': timezone.now().date() + timedelta(days=730),
                'total_budget': Decimal('1200000.00'),
                'description': '研发新型高性能复合材料。',
            },
        ]

        for data in projects_data:
            project, _ = ResearchProject.objects.get_or_create(
                project_no=data['project_no'],
                defaults=data
            )
            self.projects[data['project_no']] = project

            budget_items = [
                (self.subjects['0101'], Decimal(data['total_budget']) * Decimal('0.4')),
                (self.subjects['02'], Decimal(data['total_budget']) * Decimal('0.2')),
                (self.subjects['03'], Decimal(data['total_budget']) * Decimal('0.15')),
                (self.subjects['04'], Decimal(data['total_budget']) * Decimal('0.1')),
                (self.subjects['06'], Decimal(data['total_budget']) * Decimal('0.15')),
            ]
            for subject, amount in budget_items:
                ProjectBudget.objects.get_or_create(
                    project=project,
                    subject=subject,
                    defaults={
                        'planned_amount': amount,
                        'frozen_amount': Decimal('0'),
                        'used_amount': Decimal('0'),
                    }
                )
        self.stdout.write('    课题创建完成')

    def _create_suppliers(self):
        self.stdout.write('  创建供应商...')
        self.suppliers = {}

        suppliers_data = [
            {
                'name': '北京科技设备有限公司',
                'tax_no': '91110000MA01234567',
                'contact_person': '刘经理',
                'phone': '13800138001',
                'address': '北京市海淀区中关村大街1号',
                'bank_account': '6222021234567890123',
            },
            {
                'name': '上海精密仪器有限公司',
                'tax_no': '91310000MA01ABCDEF',
                'contact_person': '陈经理',
                'phone': '13800138002',
                'address': '上海市浦东新区张江高科技园区',
                'bank_account': '6222029876543210987',
            },
            {
                'name': '深圳电子科技有限公司',
                'tax_no': '91440300MA0XYZ1234',
                'contact_person': '黄经理',
                'phone': '13800138003',
                'address': '深圳市南山区科技园',
                'bank_account': '6222025678901234567',
            },
        ]

        for i, data in enumerate(suppliers_data):
            supplier, _ = Supplier.objects.get_or_create(
                tax_no=data['tax_no'],
                defaults=data
            )
            self.suppliers[f'supplier_{i+1}'] = supplier
        self.stdout.write('    供应商创建完成')

    def _create_sample_procurements(self):
        self.stdout.write('  创建样本采购数据...')

        project1 = self.projects['KJ2024001']
        subject_equip = self.subjects['0101']
        researcher = self.users['researcher']
        college_admin = self.users['college_admin']
        asset_staff = self.users['asset_staff']
        finance_staff = self.users['finance_staff']
        supplier1 = self.suppliers['supplier_1']
        supplier2 = self.suppliers['supplier_2']
        supplier3 = self.suppliers['supplier_3']

        now = timezone.now()

        self._create_normal_sample(
            project1, subject_equip, researcher, college_admin,
            asset_staff, finance_staff, supplier1, now
        )

        self._create_budget_insufficient_sample(
            project1, subject_equip, researcher, now
        )

        self._create_invoice_error_sample(
            project1, subject_equip, researcher, college_admin,
            asset_staff, finance_staff, supplier2, now
        )

        self._create_parameter_mismatch_sample(
            project1, subject_equip, researcher, college_admin,
            asset_staff, supplier3, now
        )

        self.stdout.write('    样本采购数据创建完成')

    def _create_normal_sample(self, project, subject, applicant, college_admin,
                               asset_staff, finance_staff, supplier, now):
        self.stdout.write('    创建【正常验收】样本...')

        budget = ProjectBudget.objects.get(project=project, subject=subject)

        procurement = Procurement.objects.create(
            title='高性能计算服务器采购',
            procurement_no='CG20240001NORMAL',
            project=project,
            budget_subject=subject,
            applicant=applicant,
            supplier=supplier,
            amount=Decimal('85000.00'),
            equipment_name='高性能计算服务器',
            equipment_model='Dell PowerEdge R750',
            equipment_params='CPU: Intel Xeon Gold 6338 * 2\n内存: 512GB DDR4\n存储: 2TB SSD + 8TB HDD\nGPU: NVIDIA A100 * 2',
            purpose='用于人工智能深度学习模型训练，提升科研计算能力。',
            status=ProcurementStatus.REIMBURSED,
            exception_reason=ExceptionReason.NONE,
            created_at=now - timedelta(days=15),
            submitted_at=now - timedelta(days=14),
            budget_frozen_at=now - timedelta(days=13),
            accepted_at=now - timedelta(days=10),
            reimbursed_at=now - timedelta(days=3),
        )

        budget.used_amount += procurement.amount
        budget.save()

        add_history_node(procurement, ProcurementStatus.DRAFT, applicant,
                        '创建采购申请', '高性能计算服务器采购申请')
        add_history_node(procurement, ProcurementStatus.SUBMITTED, applicant,
                        '提交采购申请', '提交至学院管理员审核')
        add_history_node(procurement, ProcurementStatus.BUDGET_FROZEN, college_admin,
                        '冻结预算', f'冻结设备购置费预算 {procurement.amount} 元')
        add_history_node(procurement, ProcurementStatus.ACCEPTED, asset_staff,
                        '设备验收通过', '设备参数符合要求，验收通过')
        add_history_node(procurement, ProcurementStatus.FINANCE_REVIEW, applicant,
                        '提交发票，进入财务复核', '已提交增值税专用发票')
        add_history_node(procurement, ProcurementStatus.REIMBURSED, finance_staff,
                        '财务复核通过，经费已核销', '发票信息无误，经费已核销')

        Acceptance.objects.create(
            procurement=procurement,
            asset_staff=asset_staff,
            acceptance_date=now.date() - timedelta(days=10),
            actual_params='CPU: Intel Xeon Gold 6338 * 2\n内存: 512GB DDR4\n存储: 2TB SSD + 8TB HDD\nGPU: NVIDIA A100 * 2',
            passed=True,
            remarks='设备参数与要求完全一致，运行正常。',
        )

        Invoice.objects.create(
            procurement=procurement,
            invoice_no='INV202401001',
            invoice_date=now.date() - timedelta(days=11),
            title='XX大学',
            amount=Decimal('85000.00'),
            tax_amount=Decimal('9775.00'),
            verified=True,
            finance_staff=finance_staff,
            verification_note='发票信息完整准确，予以核销。',
        )
        self.stdout.write('      【正常验收】样本创建完成')

    def _create_budget_insufficient_sample(self, project, subject, applicant, now):
        self.stdout.write('    创建【预算不足】样本...')

        budget = ProjectBudget.objects.get(project=project, subject=subject)

        procurement = Procurement.objects.create(
            title='超算中心年度服务费',
            procurement_no='CG20240002BUDGET',
            project=project,
            budget_subject=subject,
            applicant=applicant,
            supplier=self.suppliers['supplier_2'],
            amount=Decimal('500000.00'),
            equipment_name='超算中心计算服务',
            equipment_model='年度服务包',
            equipment_params='计算节点: 100核CPU\n存储: 100TB\n服务周期: 12个月\n7x24小时技术支持',
            purpose='使用超算中心资源进行大规模数值模拟计算。',
            status=ProcurementStatus.DRAFT,
            exception_reason=ExceptionReason.BUDGET_INSUFFICIENT,
            exception_note=f'预算不足：需要 500000.00 元，可用 {budget.available_amount} 元',
            created_at=now - timedelta(days=2),
        )

        add_history_node(procurement, ProcurementStatus.DRAFT, applicant,
                        '创建采购申请', '超算中心年度服务费采购')
        add_history_node(procurement, ProcurementStatus.DRAFT, applicant,
                        '提交失败-预算不足',
                        f'预算不足：需要 500000.00 元，可用 {budget.available_amount} 元')

        self.stdout.write('      【预算不足】样本创建完成')

    def _create_invoice_error_sample(self, project, subject, applicant, college_admin,
                                      asset_staff, finance_staff, supplier, now):
        self.stdout.write('    创建【发票抬头错误】样本...')

        budget = ProjectBudget.objects.get(project=project, subject=subject)

        procurement = Procurement.objects.create(
            title='高精度示波器采购',
            procurement_no='CG20240003INVOICE',
            project=project,
            budget_subject=subject,
            applicant=applicant,
            supplier=supplier,
            amount=Decimal('28000.00'),
            equipment_name='高精度数字示波器',
            equipment_model='Tektronix MSO64B',
            equipment_params='带宽: 2.5GHz\n采样率: 25GS/s\n通道数: 4模拟+16数字\n存储深度: 62.5M点',
            purpose='用于电子电路实验测试与信号分析。',
            status=ProcurementStatus.FINANCE_REVIEW,
            exception_reason=ExceptionReason.INVOICE_TITLE_ERROR,
            exception_note='发票抬头错误：应为「XX大学」，实际为「某某大学」',
            created_at=now - timedelta(days=8),
            submitted_at=now - timedelta(days=7),
            budget_frozen_at=now - timedelta(days=6),
            accepted_at=now - timedelta(days=4),
        )

        budget.frozen_amount += procurement.amount
        budget.save()

        add_history_node(procurement, ProcurementStatus.DRAFT, applicant,
                        '创建采购申请', '高精度示波器采购')
        add_history_node(procurement, ProcurementStatus.SUBMITTED, applicant,
                        '提交采购申请', '提交至学院管理员审核')
        add_history_node(procurement, ProcurementStatus.BUDGET_FROZEN, college_admin,
                        '冻结预算', f'冻结设备购置费预算 {procurement.amount} 元')
        add_history_node(procurement, ProcurementStatus.ACCEPTED, asset_staff,
                        '设备验收通过', '示波器参数符合要求')
        add_history_node(procurement, ProcurementStatus.FINANCE_REVIEW, applicant,
                        '提交发票，进入财务复核', '提交发票等待财务复核')
        add_history_node(procurement, ProcurementStatus.FINANCE_REVIEW, finance_staff,
                        '财务复核发现发票抬头有误', '发票抬头错误：应为「XX大学」，实际为「某某大学」')

        Acceptance.objects.create(
            procurement=procurement,
            asset_staff=asset_staff,
            acceptance_date=now.date() - timedelta(days=4),
            actual_params='带宽: 2.5GHz\n采样率: 25GS/s\n通道数: 4模拟+16数字\n存储深度: 62.5M点',
            passed=True,
            remarks='设备参数正确，外观完好。',
        )

        Invoice.objects.create(
            procurement=procurement,
            invoice_no='INV202401002',
            invoice_date=now.date() - timedelta(days=5),
            title='某某大学',
            amount=Decimal('28000.00'),
            tax_amount=Decimal('3221.24'),
            verified=False,
        )
        self.stdout.write('      【发票抬头错误】样本创建完成')

    def _create_parameter_mismatch_sample(self, project, subject, applicant, college_admin,
                                           asset_staff, supplier, now):
        self.stdout.write('    创建【设备参数不符】样本...')

        budget = ProjectBudget.objects.get(project=project, subject=subject)

        procurement = Procurement.objects.create(
            title='光学显微镜采购',
            procurement_no='CG20240004PARAM',
            project=project,
            budget_subject=subject,
            applicant=applicant,
            supplier=supplier,
            amount=Decimal('45000.00'),
            equipment_name='研究级金相显微镜',
            equipment_model='Olympus BX53M',
            equipment_params='放大倍率: 50x-1000x\n物镜: 5x, 10x, 20x, 50x, 100x\n目镜: 10x 宽视野\n照明: 反射LED照明\n带数码成像系统',
            purpose='用于材料微观组织结构观察与分析。',
            status=ProcurementStatus.REJECTED,
            exception_reason=ExceptionReason.PARAMETER_MISMATCH,
            exception_note='设备参数不符合要求：缺少50x物镜，放大倍率最高仅500x，无数码成像系统。',
            created_at=now - timedelta(days=5),
            submitted_at=now - timedelta(days=4),
            budget_frozen_at=now - timedelta(days=3),
        )

        add_history_node(procurement, ProcurementStatus.DRAFT, applicant,
                        '创建采购申请', '光学显微镜采购')
        add_history_node(procurement, ProcurementStatus.SUBMITTED, applicant,
                        '提交采购申请', '提交至学院管理员审核')
        add_history_node(procurement, ProcurementStatus.BUDGET_FROZEN, college_admin,
                        '冻结预算', f'冻结设备购置费预算 {procurement.amount} 元')
        add_history_node(procurement, ProcurementStatus.REJECTED, asset_staff,
                        '设备验收未通过',
                        '设备参数不符合要求：缺少50x物镜，放大倍率最高仅500x，无数码成像系统。')

        Acceptance.objects.create(
            procurement=procurement,
            asset_staff=asset_staff,
            acceptance_date=now.date() - timedelta(days=2),
            actual_params='放大倍率: 50x-500x\n物镜: 5x, 10x, 20x, 100x\n目镜: 10x\n照明: 普通透射光',
            passed=False,
            remarks='设备参数不符合要求：缺少50x物镜，放大倍率最高仅500x，无数码成像系统。与采购需求不符，验收不通过。',
        )
        self.stdout.write('      【设备参数不符】样本创建完成')
