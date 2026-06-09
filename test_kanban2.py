import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procurement_system.settings')
django.setup()
from django.test import Client
from django.contrib.auth import get_user_model
User = get_user_model()
c = Client()
user = User.objects.get(username='researcher')
c.force_login(user)
response = c.get('/kanban/')
content = response.content.decode()
# 打印前1000字符
print(content[:1500])
