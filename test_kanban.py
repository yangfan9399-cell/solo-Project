import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procurement_system.settings')
django.setup()

from django.test import Client
from django.contrib.auth import get_user_model
import re

User = get_user_model()
c = Client()

user = User.objects.get(username='researcher')
c.force_login(user)

response = c.get('/kanban/')
print('Status:', response.status_code)
print()

content = response.content.decode()

# 查找状态分布部分
print('=== 状态分布部分 HTML ===')
idx = content.find('状态分布')
if idx >= 0:
    # 打印后续 2000 字符
    print(content[idx:idx+2000])

print()
print('=== 异常分布部分 HTML ===')
idx = content.find('异常分布')
if idx >= 0:
    print(content[idx:idx+2000])
