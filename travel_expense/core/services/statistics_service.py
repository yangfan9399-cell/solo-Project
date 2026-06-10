from django.db.models import Count, Sum, Avg, F
from django.db.models.functions import TruncMonth
from ..models import Travel, Booking, Reimbursement, Department


class StatisticsService:
    """统计服务"""

    @staticmethod
    def get_department_statistics():
        """按部门统计"""
        return Travel.objects.filter(
            status='completed'
        ).values(
            'department__name'
        ).annotate(
            travel_count=Count('id'),
            total_budget=Sum('estimated_budget'),
            total_actual=Sum('booking__actual_cost')
        ).order_by('-total_actual')

    @staticmethod
    def get_city_statistics():
        """按城市统计"""
        return Travel.objects.filter(
            status='completed'
        ).values(
            'destination_city'
        ).annotate(
            travel_count=Count('id'),
            total_budget=Sum('estimated_budget'),
            total_actual=Sum('booking__actual_cost')
        ).order_by('-travel_count')

    @staticmethod
    def get_over_budget_reason_statistics():
        """按超标原因统计"""
        return Booking.objects.filter(
            over_budget_reason__isnull=False
        ).values(
            'over_budget_reason'
        ).annotate(
            count=Count('id'),
            total_over_budget=Sum(F('actual_cost') - F('travel__estimated_budget'))
        ).order_by('-total_over_budget')

    @staticmethod
    def get_monthly_statistics():
        """按报销周期（月）统计"""
        return Reimbursement.objects.filter(
            review_status='approved'
        ).annotate(
            month=TruncMonth('created_at')
        ).values(
            'month'
        ).annotate(
            reimbursement_count=Count('id'),
            total_amount=Sum('total_actual_cost')
        ).order_by('-month')

    @staticmethod
    def get_summary():
        """获取汇总数据"""
        total_travels = Travel.objects.count()
        completed_travels = Travel.objects.filter(status='completed').count()
        pending_travels = Travel.objects.filter(
            status__in=['pending_approval', 'pending_booking', 'booked']
        ).count()

        total_actual_cost = Booking.objects.aggregate(
            total=Sum('actual_cost')
        )['total'] or 0

        over_budget_count = Booking.objects.filter(
            actual_cost__gt=F('travel__estimated_budget')
        ).count()

        missing_receipt_count = Reimbursement.objects.filter(
            receipt_status='missing'
        ).count()

        return {
            'total_travels': total_travels,
            'completed_travels': completed_travels,
            'pending_travels': pending_travels,
            'total_actual_cost': total_actual_cost,
            'over_budget_count': over_budget_count,
            'missing_receipt_count': missing_receipt_count
        }
