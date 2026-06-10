from django.db import transaction
from ..models import Travel, HistoryNode


class ApprovalService:
    """审批服务"""

    @staticmethod
    @transaction.atomic
    def approve_travel(travel, actor, comment=''):
        """审批通过"""
        if travel.status != 'pending_approval':
            raise ValueError('只有待审批状态的申请才能审批')

        travel.status = 'pending_booking'
        travel.save()

        HistoryNode.objects.create(
            travel=travel,
            action_type='approve',
            actor=actor,
            comment=comment or '审批通过'
        )

        return travel

    @staticmethod
    @transaction.atomic
    def reject_travel(travel, actor, comment):
        """审批驳回"""
        if travel.status != 'pending_approval':
            raise ValueError('只有待审批状态的申请才能驳回')

        if not comment:
            raise ValueError('驳回时必须填写原因')

        travel.status = 'rejected'
        travel.save()

        HistoryNode.objects.create(
            travel=travel,
            action_type='reject',
            actor=actor,
            comment=comment
        )

        return travel

    @staticmethod
    def get_pending_approvals(department):
        """获取待审批列表"""
        return Travel.objects.filter(
            status='pending_approval',
            department=department
        ).select_related('applicant', 'department')
