from django.db import transaction
from decimal import Decimal
from ..models import Travel, Booking, Reimbursement, HistoryNode


class BookingService:
    """预订服务"""

    @staticmethod
    @transaction.atomic
    def create_or_update_booking(travel, data, actor):
        """创建或更新预订"""
        if travel.status not in ['pending_booking', 'booked']:
            raise ValueError('当前状态不允许预订')

        flight_info = {}
        hotel_info = {}

        if data.get('flight_info'):
            lines = data['flight_info'].strip().split('\n')
            for line in lines:
                if '航班号' in line:
                    flight_info['flight_number'] = line.split(':')[-1].strip()
                elif '起飞时间' in line:
                    flight_info['departure_time'] = line.split(':')[-1].strip()
                elif '票价' in line:
                    flight_info['price'] = line.split(':')[-1].strip()

        if data.get('hotel_info'):
            lines = data['hotel_info'].strip().split('\n')
            for line in lines:
                if '酒店名称' in line:
                    hotel_info['name'] = line.split(':')[-1].strip()
                elif '入住' in line:
                    hotel_info['nights'] = line.split(':')[-1].strip()
                elif '单价' in line:
                    hotel_info['price_per_night'] = line.split(':')[-1].strip()

        actual_cost = Decimal(str(data.get('actual_cost', 0)))
        estimated_budget = travel.estimated_budget
        over_budget = actual_cost > estimated_budget

        booking, created = Booking.objects.update_or_create(
            travel=travel,
            defaults={
                'flight_info': flight_info,
                'hotel_info': hotel_info,
                'actual_cost': actual_cost,
                'over_budget_reason': data.get('over_budget_reason') if over_budget else None,
                'over_budget_reason_text': data.get('over_budget_reason_text', ''),
                'booking_status': data.get('booking_status', 'booked')
            }
        )

        if created:
            action_type = 'book'
            comment = '预订行程'
        else:
            action_type = 'update_booking'
            comment = '更新预订'

        HistoryNode.objects.create(
            travel=travel,
            action_type=action_type,
            actor=actor,
            comment=comment
        )

        travel.status = 'booked'
        travel.save()

        Reimbursement.objects.get_or_create(
            travel=travel,
            defaults={
                'total_actual_cost': actual_cost,
                'receipt_status': 'pending_supplement' if not all([
                    bool(flight_info), bool(hotel_info)
                ]) else 'complete'
            }
        )

        return booking

    @staticmethod
    def get_pending_bookings():
        """获取待预订列表"""
        return Travel.objects.filter(
            status='pending_booking'
        ).select_related('applicant', 'department')
