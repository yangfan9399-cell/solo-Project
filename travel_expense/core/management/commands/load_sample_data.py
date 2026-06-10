from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal

from core.models import Department, User, Travel, Booking, Reimbursement, HistoryNode


class Command(BaseCommand):
    help = '加载预置样本数据'

    def handle(self, *args, **options):
        self.stdout.write('开始加载样本数据...')

        departments = self.create_departments()
        users = self.create_users(departments)
        travels = self.create_travels(users, departments)

        self.stdout.write(self.style.SUCCESS(f'成功加载 {len(departments)} 个部门'))
        self.stdout.write(self.style.SUCCESS(f'成功加载 {len(users)} 个用户'))
        self.stdout.write(self.style.SUCCESS(f'成功加载 {len(travels)} 个差旅申请'))
        self.stdout.write(self.style.SUCCESS('样本数据加载完成！'))

    def create_departments(self):
        departments_data = [
            ('销售部', 'SALES'),
            ('市场部', 'MARKETING'),
            ('技术部', 'TECH'),
            ('运营部', 'OPS'),
            ('行政部', 'ADMIN'),
            ('财务部', 'FINANCE'),
        ]

        departments = []
        for name, code in departments_data:
            dept, created = Department.objects.get_or_create(
                code=code,
                defaults={'name': name}
            )
            departments.append(dept)
            if created:
                self.stdout.write(f'  创建部门: {name}')

        return departments

    def create_users(self, departments):
        dept_map = {d.code: d for d in departments}

        users_data = [
            ('employee_zhang', '张三', 'employee', 'SALES'),
            ('employee_li', '李四', 'employee', 'MARKETING'),
            ('employee_wang', '王五', 'employee', 'TECH'),
            ('employee_zhao', '赵六', 'employee', 'OPS'),
            ('manager_chen', '陈经理', 'manager', 'SALES'),
            ('admin_wu', '吴行政', 'admin', 'ADMIN'),
            ('finance_xu', '徐财务', 'finance', 'FINANCE'),
        ]

        users = []
        for username, full_name, role, dept_code in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'first_name': full_name,
                    'email': f'{username}@example.com',
                    'role': role,
                    'department': dept_map[dept_code],
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(f'  创建用户: {username} ({full_name})')
            users.append(user)

        return users

    def create_travels(self, users, departments):
        user_map = {u.username: u for u in users}
        dept_map = {d.code: d for d in departments}

        today = date.today()

        travels_data = [
            {
                'username': 'employee_zhang',
                'destination_city': '上海',
                'purpose': '拜访重要客户，讨论年度采购合同',
                'estimated_budget': Decimal('5000.00'),
                'start_date': today - timedelta(days=10),
                'end_date': today - timedelta(days=7),
                'status': 'completed',
                'department_code': 'SALES',
                'has_booking': True,
                'booking': {
                    'flight_info': {'flight_number': 'MU5121', 'departure_time': '08:30', 'price': '680'},
                    'hotel_info': {'name': '上海外滩酒店', 'nights': '3晚', 'price_per_night': '450'},
                    'actual_cost': Decimal('4800.00'),
                    'over_budget_reason': None,
                    'booking_status': 'confirmed',
                },
                'has_reimbursement': True,
                'reimbursement': {
                    'total_actual_cost': Decimal('4800.00'),
                    'receipt_status': 'complete',
                    'has_flight_receipt': True,
                    'has_hotel_receipt': True,
                    'has_meal_receipt': False,
                    'has_meal_expense': False,
                    'review_status': 'approved',
                }
            },
            {
                'username': 'employee_li',
                'destination_city': '北京',
                'purpose': '参加国际营销峰会',
                'estimated_budget': Decimal('6000.00'),
                'start_date': today - timedelta(days=5),
                'end_date': today - timedelta(days=2),
                'status': 'booked',
                'department_code': 'MARKETING',
                'has_booking': True,
                'booking': {
                    'flight_info': {'flight_number': 'CA1234', 'departure_time': '09:00', 'price': '750'},
                    'hotel_info': {'name': '北京王府井饭店', 'nights': '3晚', 'price_per_night': '650'},
                    'actual_cost': Decimal('7200.00'),
                    'over_budget_reason': 'seasonal_high',
                    'over_budget_reason_text': '展会期间，酒店价格上浮50%',
                    'booking_status': 'confirmed',
                },
                'has_reimbursement': True,
                'reimbursement': {
                    'total_actual_cost': Decimal('7200.00'),
                    'receipt_status': 'complete',
                    'has_flight_receipt': True,
                    'has_hotel_receipt': True,
                    'has_meal_receipt': True,
                    'has_meal_expense': True,
                    'review_status': 'pending',
                }
            },
            {
                'username': 'employee_wang',
                'destination_city': '深圳',
                'purpose': '技术交流与合作伙伴洽谈',
                'estimated_budget': Decimal('4000.00'),
                'start_date': today - timedelta(days=7),
                'end_date': today - timedelta(days=2),
                'status': 'booked',
                'department_code': 'TECH',
                'has_booking': True,
                'booking': {
                    'flight_info': {'flight_number': 'CZ3456', 'departure_time': '07:30', 'price': '620'},
                    'hotel_info': {'name': '深圳华侨城酒店', 'nights': '5晚', 'price_per_night': '380'},
                    'actual_cost': Decimal('6200.00'),
                    'over_budget_reason': 'event_special',
                    'over_budget_reason_text': '行程变更，原定3天因项目需要延期2天',
                    'booking_status': 'confirmed',
                },
                'has_reimbursement': True,
                'reimbursement': {
                    'total_actual_cost': Decimal('6200.00'),
                    'receipt_status': 'complete',
                    'has_flight_receipt': True,
                    'has_hotel_receipt': True,
                    'has_meal_receipt': False,
                    'has_meal_expense': False,
                    'review_status': 'pending',
                }
            },
            {
                'username': 'employee_zhao',
                'destination_city': '广州',
                'purpose': '运营流程优化调研',
                'estimated_budget': Decimal('3500.00'),
                'start_date': today - timedelta(days=5),
                'end_date': today - timedelta(days=2),
                'status': 'booked',
                'department_code': 'OPS',
                'has_booking': True,
                'booking': {
                    'flight_info': {'flight_number': 'CZ3210', 'departure_time': '14:30', 'price': '580'},
                    'hotel_info': {'name': '广州天河城酒店', 'nights': '3晚', 'price_per_night': '420'},
                    'actual_cost': Decimal('3840.00'),
                    'over_budget_reason': None,
                    'over_budget_reason_text': '',
                    'booking_status': 'confirmed',
                },
                'has_reimbursement': True,
                'reimbursement': {
                    'total_actual_cost': Decimal('3840.00'),
                    'receipt_status': 'missing',
                    'has_flight_receipt': True,
                    'has_hotel_receipt': False,
                    'has_meal_receipt': False,
                    'has_meal_expense': False,
                    'review_status': 'pending',
                }
            },
            {
                'username': 'employee_zhang',
                'destination_city': '杭州',
                'purpose': '新产品市场调研',
                'estimated_budget': Decimal('3000.00'),
                'start_date': today + timedelta(days=5),
                'end_date': today + timedelta(days=7),
                'status': 'pending_approval',
                'department_code': 'SALES',
                'has_booking': False,
                'booking': None,
                'has_reimbursement': False,
                'reimbursement': None,
            },
        ]

        travels = []
        for data in travels_data:
            user = user_map[data['username']]
            dept = dept_map[data['department_code']]

            travel, created = Travel.objects.get_or_create(
                applicant=user,
                destination_city=data['destination_city'],
                start_date=data['start_date'],
                defaults={
                    'department': dept,
                    'purpose': data['purpose'],
                    'estimated_budget': data['estimated_budget'],
                    'end_date': data['end_date'],
                    'status': data['status'],
                }
            )

            if created:
                self.stdout.write(f'  创建差旅: {user.username} -> {data["destination_city"]}')

                HistoryNode.objects.create(
                    travel=travel,
                    action_type='create',
                    actor=user,
                    comment='创建差旅申请'
                )

                if data['status'] != 'draft':
                    HistoryNode.objects.create(
                        travel=travel,
                        action_type='submit',
                        actor=user,
                        comment='提交差旅申请'
                    )

                    if data['status'] not in ['pending_approval', 'draft']:
                        manager = user_map['manager_chen']
                        HistoryNode.objects.create(
                            travel=travel,
                            action_type='approve',
                            actor=manager,
                            comment='审批通过'
                        )

                if data['has_booking']:
                    booking_data = data['booking']
                    booking = Booking.objects.create(
                        travel=travel,
                        flight_info=booking_data['flight_info'],
                        hotel_info=booking_data['hotel_info'],
                        actual_cost=booking_data['actual_cost'],
                        over_budget_reason=booking_data['over_budget_reason'],
                        over_budget_reason_text=booking_data.get('over_budget_reason_text', ''),
                        booking_status=booking_data['booking_status'],
                    )

                    admin_user = user_map['admin_wu']
                    HistoryNode.objects.create(
                        travel=travel,
                        action_type='book',
                        actor=admin_user,
                        comment='完成行程预订'
                    )

                if data['has_reimbursement']:
                    reimb_data = data['reimbursement']
                    reimbursement = Reimbursement.objects.create(
                        travel=travel,
                        total_actual_cost=reimb_data['total_actual_cost'],
                        receipt_status=reimb_data['receipt_status'],
                        has_flight_receipt=reimb_data['has_flight_receipt'],
                        has_hotel_receipt=reimb_data['has_hotel_receipt'],
                        has_meal_receipt=reimb_data['has_meal_receipt'],
                        has_meal_expense=reimb_data['has_meal_expense'],
                        review_status=reimb_data['review_status'],
                    )

                    if reimb_data['review_status'] == 'approved':
                        finance_user = user_map['finance_xu']
                        HistoryNode.objects.create(
                            travel=travel,
                            action_type='approve_reimbursement',
                            actor=finance_user,
                            comment='报销通过'
                        )
                        HistoryNode.objects.create(
                            travel=travel,
                            action_type='complete',
                            actor=finance_user,
                            comment='差旅完成'
                        )

            travels.append(travel)

        return travels
