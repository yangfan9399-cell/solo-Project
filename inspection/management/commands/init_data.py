from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from inspection.models import (
    UserProfile, Role, Forwarder, ShippingLine, Container,
    InspectionWindow, DocumentType, InspectionAppointment,
    AppointmentStatus, Document, FeeItem, InspectionHistory,
    RescheduleRecord,
)


class Command(BaseCommand):
    help = '初始化演示数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化数据...')

        self._create_users()
        self._create_forwarders()
        self._create_shipping_lines()
        self._create_windows()
        self._create_document_types()
        self._create_sample_appointments()

        self.stdout.write(self.style.SUCCESS('数据初始化完成！'))

    def _create_users(self):
        self.stdout.write('  创建用户...')

        users_data = [
            {
                'username': 'forwarder',
                'password': 'password123',
                'first_name': '张',
                'last_name': '明华',
                'role': Role.FORWARDER,
                'phone': '13800138001',
                'department': '业务一部',
            },
            {
                'username': 'yard',
                'password': 'password123',
                'first_name': '李',
                'last_name': '志强',
                'role': Role.YARD,
                'phone': '13800138002',
                'department': '场站运营部',
            },
            {
                'username': 'fee_auditor',
                'password': 'password123',
                'first_name': '王',
                'last_name': '丽娟',
                'role': Role.FEE_AUDITOR,
                'phone': '13800138003',
                'department': '费用复核部',
            },
            {
                'username': 'admin',
                'password': 'admin123',
                'first_name': '系统',
                'last_name': '管理员',
                'role': Role.FEE_AUDITOR,
                'phone': '13800138000',
                'department': '系统部',
            },
        ]

        for data in users_data:
            user, created = User.objects.get_or_create(
                username=data['username'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'is_staff': True,
                    'is_superuser': data['username'] == 'admin',
                }
            )
            if created:
                user.set_password(data['password'])
                user.save()

            UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': data['role'],
                    'phone': data['phone'],
                    'department': data['department'],
                }
            )

        self.stdout.write('  ✓ 用户创建完成')

    def _create_forwarders(self):
        self.stdout.write('  创建货代公司...')
        forwarders = [
            {'name': '中远海运货代有限公司', 'contact_person': '陈经理', 'phone': '021-88888881', 'email': 'chen@cosco-freight.com'},
            {'name': '中外运货代有限公司', 'contact_person': '刘经理', 'phone': '021-88888882', 'email': 'liu@sinotrans.com'},
            {'name': '嘉里大通物流', 'contact_person': '王经理', 'phone': '021-88888883', 'email': 'wang@kerryeas.com'},
            {'name': '德迅货运代理', 'contact_person': '赵经理', 'phone': '021-88888884', 'email': 'zhao@kuehne-nagel.com'},
        ]
        for f in forwarders:
            Forwarder.objects.get_or_create(name=f['name'], defaults=f)
        self.stdout.write('  ✓ 货代公司创建完成')

    def _create_shipping_lines(self):
        self.stdout.write('  创建船公司...')
        lines = [
            {'name': '马士基航运', 'code': 'MAEU'},
            {'name': '中远海运', 'code': 'COSU'},
            {'name': '地中海航运', 'code': 'MSCU'},
            {'name': '赫伯罗特', 'code': 'HLCU'},
            {'name': '达飞轮船', 'code': 'CMAU'},
        ]
        for l in lines:
            ShippingLine.objects.get_or_create(code=l['code'], defaults=l)
        self.stdout.write('  ✓ 船公司创建完成')

    def _create_windows(self):
        self.stdout.write('  创建查验窗口...')
        windows = [
            {'name': '查验1号窗', 'location': 'A区-1号查验台', 'is_active': True},
            {'name': '查验2号窗', 'location': 'A区-2号查验台', 'is_active': True},
            {'name': '查验3号窗', 'location': 'B区-3号查验台', 'is_active': True},
            {'name': '危化品查验窗', 'location': 'C区-专用查验台', 'is_active': True},
        ]
        for w in windows:
            InspectionWindow.objects.get_or_create(name=w['name'], defaults=w)
        self.stdout.write('  ✓ 查验窗口创建完成')

    def _create_document_types(self):
        self.stdout.write('  创建单证类型...')
        doc_types = [
            {'name': '提货单(D/O)', 'is_required': True, 'description': '船公司签发的提货单'},
            {'name': '商业发票', 'is_required': True, 'description': '货物商业发票'},
            {'name': '装箱单', 'is_required': True, 'description': '货物装箱明细单'},
            {'name': '报关单', 'is_required': True, 'description': '海关进口货物报关单'},
            {'name': '报检委托书', 'is_required': True, 'description': '报检单位授权委托书'},
            {'name': '原产地证', 'is_required': False, 'description': '货物原产地证明'},
            {'name': '保险单', 'is_required': False, 'description': '货物运输保险单'},
            {'name': '商检证书', 'is_required': False, 'description': '商品检验证书'},
        ]
        for d in doc_types:
            DocumentType.objects.get_or_create(name=d['name'], defaults=d)
        self.stdout.write('  ✓ 单证类型创建完成')

    def _create_sample_appointments(self):
        self.stdout.write('  创建样本预约...')

        forwarder1 = Forwarder.objects.get(name='中远海运货代有限公司')
        forwarder2 = Forwarder.objects.get(name='中外运货代有限公司')
        forwarder3 = Forwarder.objects.get(name='嘉里大通物流')
        forwarder4 = Forwarder.objects.get(name='德迅货运代理')

        shipping_line1 = ShippingLine.objects.get(code='MAEU')
        shipping_line2 = ShippingLine.objects.get(code='COSU')
        shipping_line3 = ShippingLine.objects.get(code='MSCU')
        shipping_line4 = ShippingLine.objects.get(code='CMAU')

        window1 = InspectionWindow.objects.get(name='查验1号窗')
        window2 = InspectionWindow.objects.get(name='查验2号窗')
        window3 = InspectionWindow.objects.get(name='查验3号窗')
        window4 = InspectionWindow.objects.get(name='危化品查验窗')

        user_forwarder = User.objects.get(username='forwarder')
        user_yard = User.objects.get(username='yard')
        user_fee = User.objects.get(username='fee_auditor')

        # 样本1: 正常放行 - 已归档
        self._create_normal_release_appointment(
            container_no='MSKU1234567',
            size='40HQ',
            vessel_name='马士基-埃德蒙顿',
            voyage_no='V.2501E',
            bl_no='BL-MSK-2025-0001',
            shipping_line=shipping_line1,
            forwarder=forwarder1,
            route='欧洲-远东航线',
            window=window1,
            contact_person='张明华',
            contact_phone='13800138001',
            user_forwarder=user_forwarder,
            user_yard=user_yard,
            user_fee=user_fee,
            days_ago=5,
        )

        # 样本2: 查验改期
        self._create_rescheduled_appointment(
            container_no='CSLU7654321',
            size='20GP',
            vessel_name='中远-上海',
            voyage_no='V.2502S',
            bl_no='BL-COS-2025-0023',
            shipping_line=shipping_line2,
            forwarder=forwarder2,
            route='美西航线',
            window=window2,
            contact_person='刘芳',
            contact_phone='13900139002',
            user_forwarder=user_forwarder,
            user_yard=user_yard,
        )

        # 样本3: 单证缺失
        self._create_doc_missing_appointment(
            container_no='MEDU2345678',
            size='40GP',
            vessel_name='地中海-热那亚',
            voyage_no='V.2503G',
            bl_no='BL-MSC-2025-0045',
            shipping_line=shipping_line3,
            forwarder=forwarder3,
            route='地中海航线',
            window=window3,
            contact_person='王伟',
            contact_phone='13700137003',
            user_forwarder=user_forwarder,
            user_yard=user_yard,
        )

        # 样本4: 滞箱费异议
        self._create_fee_disputed_appointment(
            container_no='CMAU8765432',
            size='40HQ',
            vessel_name='达飞-马赛',
            voyage_no='V.2504M',
            bl_no='BL-CMA-2025-0067',
            shipping_line=shipping_line4,
            forwarder=forwarder4,
            route='非洲航线',
            window=window4,
            contact_person='赵强',
            contact_phone='13600136004',
            user_forwarder=user_forwarder,
            user_yard=user_yard,
            user_fee=user_fee,
        )

        self.stdout.write('  ✓ 样本预约创建完成')

    def _create_normal_release_appointment(self, **kwargs):
        days_ago = kwargs.pop('days_ago', 0)
        now = timezone.now()
        appointment_date = now.date() - timedelta(days=days_ago)

        container = Container.objects.create(
            container_no=kwargs['container_no'],
            size=kwargs['size'],
            shipping_line=kwargs['shipping_line'],
            vessel_name=kwargs['vessel_name'],
            voyage_no=kwargs['voyage_no'],
            bl_no=kwargs['bl_no'],
            gross_weight=Decimal('18.5'),
        )

        appointment = InspectionAppointment.objects.create(
            appointment_no=f'INS{appointment_date.strftime("%Y%m%d")}0001',
            container=container,
            forwarder=kwargs['forwarder'],
            shipping_line=kwargs['shipping_line'],
            route=kwargs['route'],
            inspection_window=kwargs['window'],
            appointment_date=appointment_date,
            appointment_time='09:30',
            status=AppointmentStatus.ARCHIVED,
            contact_person=kwargs['contact_person'],
            contact_phone=kwargs['contact_phone'],
            inspection_reason='海关布控查验',
            created_by=kwargs['user_forwarder'],
            submitted_at=now - timedelta(days=days_ago, hours=2),
            inspection_started_at=now - timedelta(days=days_ago, hours=1),
            inspection_completed_at=now - timedelta(days=days_ago, hours=0, minutes=30),
            inspector=kwargs['user_yard'],
            inspection_result='货物查验正常，与申报一致，予以放行。',
            demurrage_days=2,
            demurrage_fee=Decimal('800.00'),
            fee_reduction=Decimal('0.00'),
            final_fee=Decimal('800.00'),
            fee_confirmed_by=kwargs['user_fee'],
            fee_confirmed_at=now - timedelta(days=days_ago, hours=0, minutes=10),
            archived_at=now - timedelta(days=days_ago, hours=0, minutes=5),
            archived_by=kwargs['user_fee'],
        )

        for doc_type in DocumentType.objects.filter(is_required=True):
            Document.objects.create(
                appointment=appointment,
                document_type=doc_type,
                is_submitted=True,
                submitted_at=now - timedelta(days=days_ago, hours=3),
                submitted_by=kwargs['user_forwarder'],
            )

        for doc_type in DocumentType.objects.filter(is_required=False)[:2]:
            Document.objects.create(
                appointment=appointment,
                document_type=doc_type,
                is_submitted=True,
                submitted_at=now - timedelta(days=days_ago, hours=3),
                submitted_by=kwargs['user_forwarder'],
            )

        FeeItem.objects.create(
            appointment=appointment,
            item_name='滞箱费',
            quantity=Decimal('2'),
            unit_price=Decimal('400.00'),
            amount=Decimal('800.00'),
            is_reduction=False,
        )

        InspectionHistory.objects.create(
            appointment=appointment,
            action='创建预约',
            status_to=AppointmentStatus.DRAFT,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=days_ago, hours=4),
            remark='创建查验预约草稿',
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='提交预约',
            status_from=AppointmentStatus.DRAFT,
            status_to=AppointmentStatus.SUBMITTED,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=days_ago, hours=2),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='开始查验',
            status_from=AppointmentStatus.SUBMITTED,
            status_to=AppointmentStatus.IN_INSPECTION,
            operator=kwargs['user_yard'],
            operated_at=now - timedelta(days=days_ago, hours=1),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='正常放行',
            status_from=AppointmentStatus.IN_INSPECTION,
            status_to=AppointmentStatus.PENDING_FEE,
            operator=kwargs['user_yard'],
            operated_at=now - timedelta(days=days_ago, hours=0, minutes=30),
            remark='货物查验正常，予以放行',
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='费用确认',
            status_from=AppointmentStatus.PENDING_FEE,
            status_to=AppointmentStatus.FEE_CONFIRMED,
            operator=kwargs['user_fee'],
            operated_at=now - timedelta(days=days_ago, hours=0, minutes=10),
            remark='确认滞箱费 800 元',
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='归档',
            status_from=AppointmentStatus.FEE_CONFIRMED,
            status_to=AppointmentStatus.ARCHIVED,
            operator=kwargs['user_fee'],
            operated_at=now - timedelta(days=days_ago, hours=0, minutes=5),
        )

    def _create_rescheduled_appointment(self, **kwargs):
        now = timezone.now()

        container = Container.objects.create(
            container_no=kwargs['container_no'],
            size=kwargs['size'],
            shipping_line=kwargs['shipping_line'],
            vessel_name=kwargs['vessel_name'],
            voyage_no=kwargs['voyage_no'],
            bl_no=kwargs['bl_no'],
            gross_weight=Decimal('12.3'),
        )

        appointment = InspectionAppointment.objects.create(
            appointment_no=f'INS{now.strftime("%Y%m%d")}0002',
            container=container,
            forwarder=kwargs['forwarder'],
            shipping_line=kwargs['shipping_line'],
            route=kwargs['route'],
            inspection_window=kwargs['window'],
            appointment_date=now.date() + timedelta(days=3),
            appointment_time='14:00',
            status=AppointmentStatus.RESCHEDULED,
            contact_person=kwargs['contact_person'],
            contact_phone=kwargs['contact_phone'],
            inspection_reason='随机抽检',
            created_by=kwargs['user_forwarder'],
            submitted_at=now - timedelta(days=1),
        )

        for doc_type in DocumentType.objects.filter(is_required=True):
            Document.objects.create(
                appointment=appointment,
                document_type=doc_type,
                is_submitted=True,
                submitted_at=now - timedelta(days=1, hours=1),
                submitted_by=kwargs['user_forwarder'],
            )

        RescheduleRecord.objects.create(
            appointment=appointment,
            original_date=now.date() + timedelta(days=1),
            original_time='10:00',
            new_date=now.date() + timedelta(days=3),
            new_time='14:00',
            reason='货代公司业务调整，申请改期至后天下午',
            operator=kwargs['user_forwarder'],
        )

        InspectionHistory.objects.create(
            appointment=appointment,
            action='创建预约',
            status_to=AppointmentStatus.DRAFT,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=2),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='提交预约',
            status_from=AppointmentStatus.DRAFT,
            status_to=AppointmentStatus.SUBMITTED,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=1),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='查验改期',
            status_from=AppointmentStatus.SUBMITTED,
            status_to=AppointmentStatus.RESCHEDULED,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(hours=2),
            remark='货代公司业务调整，申请改期',
        )

    def _create_doc_missing_appointment(self, **kwargs):
        now = timezone.now()

        container = Container.objects.create(
            container_no=kwargs['container_no'],
            size=kwargs['size'],
            shipping_line=kwargs['shipping_line'],
            vessel_name=kwargs['vessel_name'],
            voyage_no=kwargs['voyage_no'],
            bl_no=kwargs['bl_no'],
            gross_weight=Decimal('25.0'),
        )

        appointment = InspectionAppointment.objects.create(
            appointment_no=f'INS{now.strftime("%Y%m%d")}0003',
            container=container,
            forwarder=kwargs['forwarder'],
            shipping_line=kwargs['shipping_line'],
            route=kwargs['route'],
            inspection_window=kwargs['window'],
            appointment_date=now.date(),
            appointment_time='11:00',
            status=AppointmentStatus.DOC_MISSING,
            contact_person=kwargs['contact_person'],
            contact_phone=kwargs['contact_phone'],
            inspection_reason='海关查验指令',
            created_by=kwargs['user_forwarder'],
            submitted_at=now - timedelta(hours=5),
            inspection_started_at=now - timedelta(hours=2),
            inspection_completed_at=now - timedelta(hours=1),
            inspector=kwargs['user_yard'],
            inspection_result='查验发现单证不全，缺少报关单和报检委托书，已通知货代补证。货物暂存查验区。',
            demurrage_days=0,
            demurrage_fee=Decimal('0.00'),
        )

        doc_types = list(DocumentType.objects.filter(is_required=True))
        for i, doc_type in enumerate(doc_types):
            if i < 3:
                Document.objects.create(
                    appointment=appointment,
                    document_type=doc_type,
                    is_submitted=True,
                    submitted_at=now - timedelta(hours=6),
                    submitted_by=kwargs['user_forwarder'],
                )
            else:
                Document.objects.create(
                    appointment=appointment,
                    document_type=doc_type,
                    is_submitted=False,
                )

        InspectionHistory.objects.create(
            appointment=appointment,
            action='创建预约',
            status_to=AppointmentStatus.DRAFT,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(hours=7),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='提交预约',
            status_from=AppointmentStatus.DRAFT,
            status_to=AppointmentStatus.SUBMITTED,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(hours=5),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='开始查验',
            status_from=AppointmentStatus.SUBMITTED,
            status_to=AppointmentStatus.IN_INSPECTION,
            operator=kwargs['user_yard'],
            operated_at=now - timedelta(hours=2),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='单证缺失',
            status_from=AppointmentStatus.IN_INSPECTION,
            status_to=AppointmentStatus.DOC_MISSING,
            operator=kwargs['user_yard'],
            operated_at=now - timedelta(hours=1),
            remark='缺少报关单、报检委托书，请尽快补证',
        )

    def _create_fee_disputed_appointment(self, **kwargs):
        now = timezone.now()

        container = Container.objects.create(
            container_no=kwargs['container_no'],
            size=kwargs['size'],
            shipping_line=kwargs['shipping_line'],
            vessel_name=kwargs['vessel_name'],
            voyage_no=kwargs['voyage_no'],
            bl_no=kwargs['bl_no'],
            gross_weight=Decimal('15.8'),
        )

        appointment = InspectionAppointment.objects.create(
            appointment_no=f'INS{now.strftime("%Y%m%d")}0004',
            container=container,
            forwarder=kwargs['forwarder'],
            shipping_line=kwargs['shipping_line'],
            route=kwargs['route'],
            inspection_window=kwargs['window'],
            appointment_date=now.date() - timedelta(days=10),
            appointment_time='08:30',
            status=AppointmentStatus.FEE_DISPUTED,
            contact_person=kwargs['contact_person'],
            contact_phone=kwargs['contact_phone'],
            inspection_reason='危化品专项查验',
            created_by=kwargs['user_forwarder'],
            submitted_at=now - timedelta(days=10, hours=1),
            inspection_started_at=now - timedelta(days=10),
            inspection_completed_at=now - timedelta(days=3),
            inspector=kwargs['user_yard'],
            inspection_result='危化品查验，因需等待检测报告，查验周期较长。货物经检验合格，准予放行。',
            demurrage_days=12,
            demurrage_fee=Decimal('4800.00'),
            fee_reduction=Decimal('0.00'),
            final_fee=Decimal('4800.00'),
            fee_dispute_reason='滞箱费计算存在异议。查验周期长是因为需要等待第三方检测报告，属于不可控因素，不应由货代承担全部滞箱费用。申请减免至少50%的滞箱费。',
        )

        for doc_type in DocumentType.objects.all():
            Document.objects.create(
                appointment=appointment,
                document_type=doc_type,
                is_submitted=True,
                submitted_at=now - timedelta(days=10, hours=2),
                submitted_by=kwargs['user_forwarder'],
            )

        FeeItem.objects.create(
            appointment=appointment,
            item_name='滞箱费',
            quantity=Decimal('12'),
            unit_price=Decimal('400.00'),
            amount=Decimal('4800.00'),
            is_reduction=False,
            remark='40HQ集装箱，超期12天',
        )

        InspectionHistory.objects.create(
            appointment=appointment,
            action='创建预约',
            status_to=AppointmentStatus.DRAFT,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=10, hours=3),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='提交预约',
            status_from=AppointmentStatus.DRAFT,
            status_to=AppointmentStatus.SUBMITTED,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=10, hours=1),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='开始查验',
            status_from=AppointmentStatus.SUBMITTED,
            status_to=AppointmentStatus.IN_INSPECTION,
            operator=kwargs['user_yard'],
            operated_at=now - timedelta(days=10),
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='正常放行',
            status_from=AppointmentStatus.IN_INSPECTION,
            status_to=AppointmentStatus.PENDING_FEE,
            operator=kwargs['user_yard'],
            operated_at=now - timedelta(days=3),
            remark='检验合格，予以放行。滞箱12天。',
        )
        InspectionHistory.objects.create(
            appointment=appointment,
            action='滞箱费异议',
            status_from=AppointmentStatus.PENDING_FEE,
            status_to=AppointmentStatus.FEE_DISPUTED,
            operator=kwargs['user_forwarder'],
            operated_at=now - timedelta(days=2),
            remark='对滞箱费计算存在异议，申请减免',
        )
