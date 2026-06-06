import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User
from catalog.models import BookCategory, RareBook
from reservations.models import Reservation
from circulation.models import CirculationLog
from conservation.models import DamageAssessment, Decision

print('=== 数据统计 ===')
print('用户数:', User.objects.count())
print('馆藏分类数:', BookCategory.objects.count())
print('珍本书目数:', RareBook.objects.count())
print('预约记录数:', Reservation.objects.count())
print('流通记录数:', CirculationLog.objects.count())
print('损伤鉴定数:', DamageAssessment.objects.count())
print('归库决策数:', Decision.objects.count())

print()
print('=== 预约状态分布 ===')
for status, label in Reservation.STATUS_CHOICES:
    count = Reservation.objects.filter(status=status).count()
    if count > 0:
        print(f'  {label}: {count}')

print()
print('=== 珍本状态分布 ===')
for status, label in RareBook.STATUS_CHOICES:
    count = RareBook.objects.filter(status=status).count()
    if count > 0:
        print(f'  {label}: {count}')

print()
print('=== 业务场景样本 ===')
print('1. 正常归库样本: 史记 (已完成 + 已鉴定 + 归库决策)')
print('2. 页面污损样本: 永乐大典 (已完成 + 已鉴定 + 送修决策)')
print('3. 资格不足样本: 四库全书 (本科生预约 + 资格不足)')
print('4. 调阅冲突样本: 山海经 (两个同时段预约)')

print()
print('=== 测试账号 ===')
print('主管: supervisor / 123456')
print('馆员: librarian / 123456')
print('修复员: conservator / 123456')
print('教师读者: teacher_reader / 123456')
print('研究生读者: grad_reader / 123456')
print('本科生读者: undergrad_reader / 123456')
