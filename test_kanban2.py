import django, os
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
content = response.content.decode()

# 找到异常种类附近的内容
idx = content.find('异常种类')
if idx >= 0:
    # 往前找200字符，往后找100字符
    snippet = content[max(0,idx-200):idx+200]
    print(snippet)
    print()
    # 查找 stat-number 中的数字
    # 从异常种类往回找 stat-number
    before = content[max(0,idx-300):idx]
    # 找最后一个 stat-number
    m = re.findall(r'stat-number[^>]*>([^<]+)<', before)
    if m:
        print(f'异常种类对应的stat-number: {m[-1]}')

print()
print('=== 所有 stat-number 数值 ===')
for m in re.finditer(r'stat-number[^>]*>([^<]+)<', content):
    print(f'  {m.group(1).strip()}')

print()
print('=== exception_data 长度验证 ===')
# 直接调用视图看context
from core.views import kanban
from django.test import RequestFactory
from django.contrib.sessions.middleware import SessionMiddleware
from django.contrib.auth.middleware import AuthenticationMiddleware
from django.contrib.messages.middleware import MessageMiddleware

factory = RequestFactory()
request = factory.get('/kanban/')

# 添加 session
from django.contrib.sessions.backends.db import SessionStore
request.session = SessionStore()
request.session.create()

# 添加 user
request.user = user

# 调用视图
from django.contrib import messages
from django.contrib.messages.storage.fallback import FallbackStorage
setattr(request, '_messages', FallbackStorage(request))

from django.template.response import TemplateResponse
resp = kanban(request)
if hasattr(resp, 'context_data'):
    ctx = resp.context_data
    print(f'exception_data 长度: {len(ctx.get("exception_data", []))}')
    print(f'exception_data 内容: {ctx.get("exception_data")}')
    print(f'status_data 长度: {len(ctx.get("status_data", []))}')
    print(f'status_data 内容: {ctx.get("status_data")}')
