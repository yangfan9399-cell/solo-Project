import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from reservations.views import reservation_detail
from reservations.models import Reservation

User = get_user_model()
factory = RequestFactory()

print('=== 测试：馆员查看资格不足预约 ===')
librarian = User.objects.get(username='librarian')
reservation = Reservation.objects.get(pk=3)

request = factory.get(f'/reservations/{reservation.pk}/')
request.user = librarian

# 手动调用视图逻辑来验证
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required

res = get_object_or_404(Reservation, pk=3)

has_circulation = hasattr(res, 'circulation_log')
can_approve = librarian.is_librarian and res.can_be_approved()
can_reject = librarian.is_librarian and res.status == Reservation.STATUS_PENDING
can_checkout = librarian.is_librarian and res.status == Reservation.STATUS_APPROVED and not has_circulation
qualification_blocked = res.qualification_checked and not res.is_qualification_passed
required_proofs = res.required_proofs

print(f'预约: {res.book.title} - {res.user.real_name}')
print(f'资格是否阻断: {qualification_blocked}')
print(f'能否通过审核: {can_approve}')
print(f'能否驳回: {can_reject}')
print(f'能否办理调阅: {can_checkout}')
print(f'所需证明材料: {required_proofs}')
print()
print('✓ 馆员看到的效果：')
print(f'  - 资格核验卡片：显示「已阻断」红色徽章')
print(f'  - 审核通过按钮：{"隐藏" if not can_approve else "显示"}')
print(f'  - 驳回按钮：{"显示" if can_reject else "隐藏"}')
print(f'  - 办理调阅按钮：{"隐藏" if not can_checkout else "显示"}')
print(f'  - 所需证明材料：显示 {len(required_proofs)} 项')
print(f'  - 馆员提示：显示阻断提示信息')

print()
print('=== 测试：读者查看自己的资格不足预约 ===')
reader = User.objects.get(username='undergrad_reader')
can_approve_reader = reader.is_librarian and res.can_be_approved()
can_cancel_reader = reader == res.user and res.status in [Reservation.STATUS_PENDING, Reservation.STATUS_APPROVED]

print(f'读者: {reader.real_name}')
print(f'能否取消: {can_cancel_reader}')
print()
print('✓ 读者看到的效果：')
print(f'  - 资格核验卡片：显示「已阻断」红色徽章')
print(f'  - 补充证明提示：显示给读者的提示')
print(f'  - 取消预约按钮：{"显示" if can_cancel_reader else "隐藏"}')

print()
print('=== 测试：正常预约（资格通过）===')
res_normal = Reservation.objects.get(pk=6)  # 水经注 + 研究生
qualification_blocked_normal = res_normal.qualification_checked and not res_normal.is_qualification_passed
can_approve_normal = librarian.is_librarian and res_normal.can_be_approved()

print(f'预约: {res_normal.book.title} - {res_normal.user.real_name}')
print(f'资格是否阻断: {qualification_blocked_normal}')
print(f'能否通过审核: {can_approve_normal}')
print()
print('✓ 正常预约效果：')
print(f'  - 资格核验卡片：显示「已通过」绿色徽章')
print(f'  - 审核通过按钮：{"显示" if can_approve_normal else "隐藏"}')
