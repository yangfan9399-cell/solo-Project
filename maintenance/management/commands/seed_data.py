from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta, date
from maintenance.models import (
    MaintenanceCompany,
    Elevator,
    UserProfile,
    MaintenancePlan,
    Part,
    FaultTicket,
    TicketPart,
    ActionLog,
)


class Command(BaseCommand):
    help = 'Seed database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')

        company1 = MaintenanceCompany.objects.create(
            name='安捷电梯维保有限公司',
            contact_person='张经理',
            contact_phone='13800138001',
            address='上海市浦东新区张江高科技园区'
        )
        company2 = MaintenanceCompany.objects.create(
            name='速达电梯工程有限公司',
            contact_person='李总',
            contact_phone='13800138002',
            address='上海市徐汇区漕河泾开发区'
        )
        self.stdout.write(f'Created maintenance companies')

        user_admin = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin123456',
            first_name='系统',
            last_name='管理员'
        )

        user_maintenance1 = User.objects.create_user(
            username='tech_zhang',
            email='zhang@anjie.com',
            password='tech123456',
            first_name='张',
            last_name='师傅'
        )
        UserProfile.objects.create(
            user=user_maintenance1,
            role='maintenance_staff',
            phone='13900139001',
            company=company1
        )

        user_maintenance2 = User.objects.create_user(
            username='tech_wang',
            email='wang@suda.com',
            password='tech123456',
            first_name='王',
            last_name='师傅'
        )
        UserProfile.objects.create(
            user=user_maintenance2,
            role='maintenance_staff',
            phone='13900139002',
            company=company2
        )

        user_handler = User.objects.create_user(
            username='property_li',
            email='li@property.com',
            password='property123456',
            first_name='李',
            last_name='经办'
        )
        UserProfile.objects.create(
            user=user_handler,
            role='property_handler',
            phone='13700137001'
        )

        user_reviewer = User.objects.create_user(
            username='reviewer_wang',
            email='wang@review.com',
            password='review123456',
            first_name='王',
            last_name='复核'
        )
        UserProfile.objects.create(
            user=user_reviewer,
            role='property_reviewer',
            phone='13700137002'
        )
        self.stdout.write(f'Created users and profiles')

        elevators_data = [
            {'num': 'A-001', 'building': 'A栋1单元', 'floor': '1-32层', 'company': company1},
            {'num': 'A-002', 'building': 'A栋1单元', 'floor': '1-32层', 'company': company1},
            {'num': 'B-001', 'building': 'B栋2单元', 'floor': '1-28层', 'company': company2},
            {'num': 'B-002', 'building': 'B栋2单元', 'floor': '1-28层', 'company': company2},
            {'num': 'C-001', 'building': 'C栋3单元', 'floor': '1-24层', 'company': company1},
        ]

        elevators = []
        for data in elevators_data:
            elevator = Elevator.objects.create(
                elevator_number=data['num'],
                building=data['building'],
                floor=data['floor'],
                manufacturer='三菱电梯',
                install_date=date(2020, 6, 15),
                last_maintenance_date=date(2026, 5, 1),
                next_maintenance_date=date(2026, 6, 15),
                status='running',
                maintenance_company=data['company']
            )
            elevators.append(elevator)
        self.stdout.write(f'Created {len(elevators)} elevators')

        parts_data = [
            {'name': '曳引机轴承', 'pn': 'BRG-001', 'spec': '6308-2RS', 'qty': 10, 'status': 'in_stock'},
            {'name': '门机变频器', 'pn': 'INV-001', 'spec': 'TD3200', 'qty': 5, 'status': 'in_stock'},
            {'name': '平层感应器', 'pn': 'SEN-001', 'spec': 'PSMO-25G1', 'qty': 0, 'status': 'waiting'},
            {'name': '限速器钢丝绳', 'pn': 'CBL-001', 'spec': '8mm', 'qty': 2, 'status': 'low_stock'},
            {'name': '控制板主板', 'pn': 'PCB-001', 'spec': 'P203718B000G03', 'qty': 0, 'status': 'ordered'},
        ]

        parts = []
        for data in parts_data:
            part = Part.objects.create(
                name=data['name'],
                part_number=data['pn'],
                specification=data['spec'],
                quantity=data['qty'],
                status=data['status']
            )
            parts.append(part)
        self.stdout.write(f'Created {len(parts)} parts')

        plan1 = MaintenancePlan.objects.create(
            elevator=elevators[0],
            plan_type='regular',
            plan_date=date(2026, 6, 15),
            description='按期维保：检查曳引系统、导轨润滑、安全装置测试、门系统检查',
            status='pending',
            assigned_to=user_maintenance1,
            created_by=user_admin,
            current_responsible=user_maintenance1
        )
        ActionLog.objects.create(
            plan=plan1,
            action_type='note',
            description='按期维保计划已创建，待维保人员执行',
            performed_by=user_admin
        )

        plan2 = MaintenancePlan.objects.create(
            elevator=elevators[2],
            plan_type='regular',
            plan_date=date(2026, 6, 10),
            description='按期维保：已完成月度常规检查',
            status='completed',
            assigned_to=user_maintenance2,
            created_by=user_admin,
            completed_at=timezone.now() - timedelta(days=2),
            archived_at=timezone.now() - timedelta(days=2)
        )
        ActionLog.objects.create(
            plan=plan2,
            action_type='plan_complete',
            description='按期维保完成，检查项目全部合格',
            performed_by=user_maintenance2
        )

        plan3 = MaintenancePlan.objects.create(
            elevator=elevators[1],
            plan_type='regular',
            plan_date=date(2026, 6, 12),
            description='按期维保：进行月度例行检查和维护',
            status='in_progress',
            assigned_to=user_maintenance1,
            created_by=user_admin,
            current_responsible=user_maintenance1
        )
        ActionLog.objects.create(
            plan=plan3,
            action_type='plan_start',
            description='维保人员已开始执行按期维保',
            performed_by=user_maintenance1,
            from_status='pending',
            to_status='in_progress'
        )

        plan4 = MaintenancePlan.objects.create(
            elevator=elevators[4],
            plan_type='regular',
            plan_date=date(2026, 6, 8),
            description='按期维保：已提交记录，等待物业复核',
            status='submitted',
            assigned_to=user_maintenance2,
            created_by=user_admin,
            submitted_at=timezone.now() - timedelta(hours=2),
            current_responsible=user_reviewer
        )
        ActionLog.objects.create(
            plan=plan4,
            action_type='plan_submit',
            description='维保记录已提交，等待物业复核',
            performed_by=user_maintenance2,
            from_status='in_progress',
            to_status='submitted'
        )

        plan5 = MaintenancePlan.objects.create(
            elevator=elevators[3],
            plan_type='regular',
            plan_date=date(2026, 6, 5),
            description='按期维保：复核退回，需要重新填写',
            status='returned',
            assigned_to=user_maintenance1,
            created_by=user_admin,
            submitted_at=timezone.now() - timedelta(days=1),
            reviewed_by=user_reviewer,
            reviewed_at=timezone.now() - timedelta(hours=6),
            review_comment='检查项目填写不完整，请补充曳引系统和安全装置的检查结果',
            current_responsible=user_maintenance1
        )
        ActionLog.objects.create(
            plan=plan5,
            action_type='plan_review_return',
            description='复核退回：检查项目填写不完整，请补充曳引系统和安全装置的检查结果',
            performed_by=user_reviewer,
            from_status='submitted',
            to_status='returned'
        )

        self.stdout.write(f'Created 5 maintenance plans with different statuses')

        ticket1 = FaultTicket.objects.create(
            elevator=elevators[1],
            fault_source='resident',
            fault_description='电梯运行时有异响，在5-10层之间明显感觉到震动',
            fault_location='A栋1单元2号梯轿厢',
            priority='high',
            status='repaired',
            is_repeat_fault=False,
            reporter_name='陈先生',
            reporter_phone='13600136001',
            report_time=timezone.now() - timedelta(hours=24),
            stop_confirmation_by=user_handler,
            stop_confirmation_time=timezone.now() - timedelta(hours=23),
            assigned_to=user_maintenance1,
            assigned_time=timezone.now() - timedelta(hours=22),
            current_responsible=user_reviewer,
            repair_start_time=timezone.now() - timedelta(hours=20),
            repair_end_time=timezone.now() - timedelta(hours=4),
            repair_description='检查发现导靴磨损严重，已更换新导靴，调整导轨垂直度',
            repair_parts_used='导靴 4个'
        )
        ActionLog.objects.create(
            ticket=ticket1,
            action_type='report',
            description='业主报修：电梯运行异响',
            performed_by=user_admin
        )
        ActionLog.objects.create(
            ticket=ticket1,
            action_type='confirm_stop',
            description='物业经办人已确认停梯，并发布通知',
            performed_by=user_handler,
            from_status='reported',
            to_status='confirmed'
        )
        ActionLog.objects.create(
            ticket=ticket1,
            action_type='dispatch',
            description='已派单给张师傅',
            performed_by=user_handler,
            from_status='confirmed',
            to_status='dispatched'
        )
        ActionLog.objects.create(
            ticket=ticket1,
            action_type='start_repair',
            description='张师傅已到达现场开始维修',
            performed_by=user_maintenance1,
            from_status='dispatched',
            to_status='in_repair'
        )
        ActionLog.objects.create(
            ticket=ticket1,
            action_type='complete_repair',
            description='维修完成，更换导靴4个，试运行正常',
            performed_by=user_maintenance1,
            from_status='in_repair',
            to_status='repaired'
        )

        ticket2 = FaultTicket.objects.create(
            elevator=elevators[3],
            fault_source='alarm',
            fault_description='电梯门无法正常关闭，系统自动报警',
            fault_location='B栋2单元2号梯',
            priority='urgent',
            status='parts_waiting',
            is_repeat_fault=False,
            reporter_name='系统告警',
            reporter_phone='021-88888888',
            report_time=timezone.now() - timedelta(hours=12),
            stop_confirmation_by=user_handler,
            stop_confirmation_time=timezone.now() - timedelta(hours=11),
            assigned_to=user_maintenance2,
            assigned_time=timezone.now() - timedelta(hours=10),
            current_responsible=user_maintenance2,
            repair_start_time=timezone.now() - timedelta(hours=8)
        )
        TicketPart.objects.create(
            ticket=ticket2,
            part=parts[2],
            quantity_needed=2,
            status='waiting'
        )
        ActionLog.objects.create(
            ticket=ticket2,
            action_type='report',
            description='系统告警：电梯门机故障',
            performed_by=user_admin
        )
        ActionLog.objects.create(
            ticket=ticket2,
            action_type='confirm_stop',
            description='物业已确认停梯',
            performed_by=user_handler,
            from_status='reported',
            to_status='confirmed'
        )
        ActionLog.objects.create(
            ticket=ticket2,
            action_type='dispatch',
            description='派单给王师傅',
            performed_by=user_handler,
            from_status='confirmed',
            to_status='dispatched'
        )
        ActionLog.objects.create(
            ticket=ticket2,
            action_type='parts_wait',
            description='平层感应器缺货，待到货后继续维修',
            performed_by=user_maintenance2,
            from_status='dispatched',
            to_status='parts_waiting'
        )

        ticket3_prev = FaultTicket.objects.create(
            elevator=elevators[0],
            fault_source='inspection',
            fault_description='电梯按钮不灵敏，部分楼层按钮需要用力按',
            fault_location='A栋1单元1号梯轿厢面板',
            priority='medium',
            status='archived',
            is_repeat_fault=False,
            reporter_name='巡检员赵',
            reporter_phone='13500135001',
            report_time=timezone.now() - timedelta(days=30),
            stop_confirmation_by=user_handler,
            stop_confirmation_time=timezone.now() - timedelta(days=30, hours=1),
            assigned_to=user_maintenance1,
            assigned_time=timezone.now() - timedelta(days=30, hours=2),
            current_responsible=None,
            repair_start_time=timezone.now() - timedelta(days=30, hours=3),
            repair_end_time=timezone.now() - timedelta(days=29),
            repair_description='清洁按钮触点',
            repair_parts_used='无',
            reviewed_by=user_reviewer,
            review_time=timezone.now() - timedelta(days=28),
            review_comment='维修合格，同意恢复运行',
            archived_at=timezone.now() - timedelta(days=28)
        )
        ActionLog.objects.create(
            ticket=ticket3_prev,
            action_type='archive',
            description='工单已归档',
            performed_by=user_reviewer
        )

        ticket3 = FaultTicket.objects.create(
            elevator=elevators[0],
            fault_source='resident',
            fault_description='多个楼层按钮又出现不灵敏情况，3楼、8楼、15楼按钮无反应',
            fault_location='A栋1单元1号梯轿厢面板',
            priority='high',
            status='reviewing',
            is_repeat_fault=True,
            previous_ticket=ticket3_prev,
            repeat_difference='上次仅清洁处理，这次多个按钮完全失效，可能是面板电路问题',
            reporter_name='刘女士',
            reporter_phone='13600136002',
            report_time=timezone.now() - timedelta(hours=6),
            stop_confirmation_by=user_handler,
            stop_confirmation_time=timezone.now() - timedelta(hours=5),
            assigned_to=user_maintenance1,
            assigned_time=timezone.now() - timedelta(hours=4),
            current_responsible=user_reviewer,
            repair_start_time=timezone.now() - timedelta(hours=3),
            repair_end_time=timezone.now() - timedelta(hours=1),
            repair_description='更换按钮面板电路板，所有按钮测试正常',
            repair_parts_used='按钮面板电路板 1块'
        )
        ActionLog.objects.create(
            ticket=ticket3,
            action_type='report',
            description='业主报修：按钮再次失灵',
            performed_by=user_admin
        )
        ActionLog.objects.create(
            ticket=ticket3,
            action_type='confirm_stop',
            description='已确认停梯，标记为重复故障',
            performed_by=user_handler,
            from_status='reported',
            to_status='confirmed'
        )
        ActionLog.objects.create(
            ticket=ticket3,
            action_type='dispatch',
            description='派单给张师傅处理重复故障',
            performed_by=user_handler,
            from_status='confirmed',
            to_status='dispatched'
        )
        ActionLog.objects.create(
            ticket=ticket3,
            action_type='complete_repair',
            description='已更换电路板，重复故障已处理',
            performed_by=user_maintenance1,
            from_status='dispatched',
            to_status='repaired'
        )

        ticket4 = FaultTicket.objects.create(
            elevator=elevators[4],
            fault_source='maintenance',
            fault_description='维保检查发现控制板显示异常，需要专业人员处理',
            fault_location='C栋3单元1号梯机房',
            priority='high',
            status='dispatched',
            is_repeat_fault=False,
            reporter_name='张维保',
            reporter_phone='13900139001',
            report_time=timezone.now() - timedelta(hours=2),
            stop_confirmation_by=user_handler,
            stop_confirmation_time=timezone.now() - timedelta(hours=1),
            assigned_to=user_maintenance2,
            company_mismatch=True,
            mismatch_note='该电梯由安捷公司维保，但控制板问题需要速达公司技术支持',
            assigned_time=timezone.now() - timedelta(minutes=30),
            current_responsible=user_maintenance2
        )
        TicketPart.objects.create(
            ticket=ticket4,
            part=parts[4],
            quantity_needed=1,
            status='ordered'
        )
        ActionLog.objects.create(
            ticket=ticket4,
            action_type='report',
            description='维保发现控制板问题',
            performed_by=user_maintenance1
        )
        ActionLog.objects.create(
            ticket=ticket4,
            action_type='confirm_stop',
            description='已确认停梯',
            performed_by=user_handler,
            from_status='reported',
            to_status='confirmed'
        )
        ActionLog.objects.create(
            ticket=ticket4,
            action_type='dispatch',
            description='跨单位派单：安捷转派速达处理',
            performed_by=user_handler,
            from_status='confirmed',
            to_status='dispatched'
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all data'))
        self.stdout.write(f'Created: 2维保公司, 5电梯, 4维保/物业人员, 2维保计划, 5配件, 4故障工单样本')
        self.stdout.write(f'Sample scenarios:')
        self.stdout.write(f'  - 按期维保: A-001梯待执行, B-001梯已完成')
        self.stdout.write(f'  - 配件待到: B-002梯平层感应器缺货')
        self.stdout.write(f'  - 重复故障: A-001梯按钮问题再次发生')
        self.stdout.write(f'  - 维保单位不匹配: C-001梯跨公司派单')
