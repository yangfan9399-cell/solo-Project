from django.db import transaction
from ..models import Travel, Reimbursement, HistoryNode


class ReimbursementService:
    """报销服务"""

    @staticmethod
    def get_pending_reimbursements():
        """获取待复核报销单"""
        return Travel.objects.filter(
            status='booked'
        ).select_related(
            'applicant', 'department', 'booking', 'reimbursement'
        )

    @staticmethod
    @transaction.atomic
    def update_reimbursement(travel, data, actor):
        """更新报销单"""
        if not hasattr(travel, 'reimbursement'):
            raise ValueError('该差旅申请没有报销单')

        reimbursement = travel.reimbursement

        reimbursement.has_flight_receipt = data.get('has_flight_receipt', False)
        reimbursement.has_hotel_receipt = data.get('has_hotel_receipt', False)
        reimbursement.has_meal_receipt = data.get('has_meal_receipt', False)
        reimbursement.has_meal_expense = data.get('has_meal_expense', False)
        reimbursement.missing_receipts = data.get('missing_receipts', '')
        reimbursement.finance_comments = data.get('finance_comments', '')

        missing_receipts = []
        if reimbursement.has_flight_expense and not reimbursement.has_flight_receipt:
            missing_receipts.append('电子客票行程单')
        if reimbursement.has_hotel_expense and not reimbursement.has_hotel_receipt:
            missing_receipts.append('酒店发票')
        if reimbursement.has_meal_expense and not reimbursement.has_meal_receipt:
            missing_receipts.append('餐饮发票')

        if missing_receipts:
            reimbursement.receipt_status = 'missing'
            reimbursement.missing_receipts = ', '.join(missing_receipts)
        else:
            reimbursement.receipt_status = 'complete'
            reimbursement.missing_receipts = ''

        reimbursement.save()

        return reimbursement

    @staticmethod
    @transaction.atomic
    def approve_reimbursement(travel, actor, comment=''):
        """通过报销"""
        if not hasattr(travel, 'reimbursement'):
            raise ValueError('该差旅申请没有报销单')

        reimbursement = travel.reimbursement

        if reimbursement.receipt_status == 'missing':
            raise ValueError('票据缺失，禁止通过报销')

        travel.status = 'completed'
        travel.save()

        reimbursement.review_status = 'approved'
        reimbursement.save()

        HistoryNode.objects.create(
            travel=travel,
            action_type='approve_reimbursement',
            actor=actor,
            comment=comment or '报销通过'
        )

        HistoryNode.objects.create(
            travel=travel,
            action_type='complete',
            actor=actor,
            comment='差旅完成'
        )

        return reimbursement

    @staticmethod
    @transaction.atomic
    def return_reimbursement(travel, actor, comment):
        """退回报销单"""
        if not hasattr(travel, 'reimbursement'):
            raise ValueError('该差旅申请没有报销单')

        if not comment:
            raise ValueError('退回时必须填写原因')

        reimbursement = travel.reimbursement
        reimbursement.review_status = 'returned'
        reimbursement.receipt_status = 'pending_supplement'
        reimbursement.save()

        HistoryNode.objects.create(
            travel=travel,
            action_type='return_reimbursement',
            actor=actor,
            comment=comment
        )

        return reimbursement
