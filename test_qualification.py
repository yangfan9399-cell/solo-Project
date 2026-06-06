import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from reservations.models import Reservation
from accounts.models import User

print('=== 资格不足预约测试 ===')
undergrad = User.objects.get(username='undergrad_reader')
siku_reservations = Reservation.objects.filter(user=undergrad)
for res in siku_reservations:
    print(f'预约ID: {res.pk}')
    print(f'书目: {res.book.title}')
    print(f'预约人: {res.user.real_name} ({res.user.get_reader_type_display()})')
    print(f'状态: {res.get_status_display()}')
    print(f'资格已核验: {res.qualification_checked}')
    print(f'资格是否通过: {res.is_qualification_passed}')
    print(f'资格说明: {res.qualification_notes}')
    print(f'所需证明材料: {res.required_proofs}')
    print(f'能否通过审核: {res.can_be_approved()}')
    print()

print('=== 正常预约测试 ===')
teacher = User.objects.get(username='teacher_reader')
shiji_reservations = Reservation.objects.filter(user=teacher, book__title='史记')
for res in shiji_reservations:
    print(f'预约ID: {res.pk}')
    print(f'书目: {res.book.title}')
    print(f'状态: {res.get_status_display()}')
    print(f'资格是否通过: {res.is_qualification_passed}')
    print(f'能否通过审核: {res.can_be_approved()}')
    print()

print('=== 待审核预约列表 ===')
pending = Reservation.objects.filter(status='pending').select_related('book', 'user')
for res in pending:
    status = '✓ 可通过' if res.can_be_approved() else '✕ 已阻断'
    print(f'{status} | {res.pk} | {res.book.title} | {res.user.real_name}')
