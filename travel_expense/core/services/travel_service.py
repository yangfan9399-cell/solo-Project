from django.db import transaction
from django.contrib.auth import get_user_model
from ..models import Travel, HistoryNode

User = get_user_model()


class TravelService:
    """差旅申请服务"""

    @staticmethod
    @transaction.atomic
    def create_travel(applicant, data):
        """创建差旅申请"""
        travel = Travel.objects.create(
            applicant=applicant,
            department=applicant.department,
            destination_city=data['destination_city'],
            purpose=data['purpose'],
            estimated_budget=data['estimated_budget'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            status='draft'
        )

        HistoryNode.objects.create(
            travel=travel,
            action_type='create',
            actor=applicant,
            comment='创建差旅申请'
        )

        return travel

    @staticmethod
    @transaction.atomic
    def submit_travel(travel, actor):
        """提交差旅申请"""
        if travel.status != 'draft':
            raise ValueError('只有草稿状态的申请才能提交')

        travel.status = 'pending_approval'
        travel.save()

        HistoryNode.objects.create(
            travel=travel,
            action_type='submit',
            actor=actor,
            comment='提交差旅申请'
        )

        return travel

    @staticmethod
    def get_travels_for_user(user):
        """获取用户可见的差旅申请列表"""
        if user.is_superadmin():
            return Travel.objects.all()
        elif user.is_manager():
            return Travel.objects.filter(department=user.department)
        else:
            return Travel.objects.filter(applicant=user)

    @staticmethod
    def get_travel_detail(travel_id, user):
        """获取差旅详情"""
        try:
            travel = Travel.objects.select_related(
                'applicant', 'department', 'booking', 'reimbursement'
            ).prefetch_related('history_nodes__actor').get(id=travel_id)

            if user.is_superadmin():
                return travel
            elif user.is_manager() and travel.department == user.department:
                return travel
            elif travel.applicant == user:
                return travel
            elif user.is_admin_staff() or user.is_finance():
                return travel

            raise PermissionError('无权限查看此申请')
        except Travel.DoesNotExist:
            return None
