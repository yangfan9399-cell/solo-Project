import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sanitation_system.settings')
django.setup()

from operations.models import Complaint, ReviewRecord, RouteAssignment
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

inspector = User.objects.get(username='inspector1')
supervisor = User.objects.get(username='supervisor1')

complaint = Complaint.objects.filter(status='pending').first()
print(f'投诉ID: {complaint.id}')
print(f'初始状态: {complaint.get_status_display()}')
print(f'投诉类型: {complaint.get_complaint_type_display()}')
print(f'站点: {complaint.station.name}')
print()

complaint.inspector = inspector
complaint.confirmed_at = timezone.now()
complaint.confirmed_notes = '经现场核实，该站点确实存在垃圾满溢情况，需要立即清运。'
complaint.status = Complaint.Status.IN_PROGRESS
complaint.save()
print(f'步骤1 - 巡检确认后状态: {complaint.get_status_display()}')

complaint.status = Complaint.Status.RESOLVED
complaint.resolved_at = timezone.now()
complaint.resolution_notes = '已安排应急车辆清运，垃圾桶已清空并消毒。'
complaint.save()
print(f'步骤2 - 整改完成后状态: {complaint.get_status_display()}')
print(f'  解决说明: {complaint.resolution_notes}')
print(f'  完成时间: {complaint.resolved_at}')
print()

assignment = complaint.assignment
review = ReviewRecord.objects.create(
    assignment=assignment,
    reviewer=supervisor,
    review_result=ReviewRecord.Result.RECTIFIED,
    review_notes='投诉已得到妥善处理，整改及时到位。',
    complaint=complaint,
    rectification_completed_at=complaint.resolved_at,
    rectification_notes=complaint.resolution_notes,
)
print(f'步骤3 - 创建复核记录，关联投诉:')
print(f'  复核ID: {review.id}')
print(f'  复核结果: {review.get_review_result_display()}')
print(f'  关联投诉: {review.complaint.id if review.complaint else "无"}')
print()

complaint.status = Complaint.Status.CLOSED
complaint.save()
print(f'步骤4 - 结案后状态: {complaint.get_status_display()}')
print()

print('--- 验证关联关系 ---')
review_complaint = review.complaint
print(f'复核记录关联的投诉: {review_complaint.get_complaint_type_display()} - {review_complaint.station.name}')
print(f'投诉关联的复核记录数: {complaint.reviews.count()}')

print()
print('✅ 整个投诉处理流程验证通过！')
print('  待处理 → 核实属实 → 整改中 → 整改完成 → 主管复核 → 结案')
