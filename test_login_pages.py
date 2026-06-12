import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse

client = Client()

test_users = [
    ('admin', 'admin123', '管理员'),
    ('field01', 'field123', '现场人员'),
    ('reviewer01', 'review123', '复核主管'),
]

for username, password, role in test_users:
    print(f'\n{"="*60}')
    print(f'测试用户: {username} ({role})')
    print('='*60)
    
    client = Client()
    
    login_url = reverse('accounts:login')
    response = client.post(login_url, {'username': username, 'password': password}, follow=True)
    print(f'登录状态码: {response.status_code}')
    print(f'登录后跳转: {response.request.get("PATH_INFO", "N/A")}')
    
    if response.status_code == 200 and response.wsgi_request.user.is_authenticated:
        print(f'✓ 登录成功，用户: {response.wsgi_request.user.get_full_name()}')
        
        test_pages = [
            ('access_control:dashboard', {}, '数据看板'),
            ('access_control:record_list', {}, '记录列表'),
            ('access_control:processing_desk', {}, '处理台'),
            ('access_control:analytics_page', {}, '复盘统计'),
        ]
        
        if role in ['管理员', '复核主管']:
            test_pages.append(('access_control:review_page', {}, '复核中心'))
        
        from access_control.models import AccessRecoveryRecord
        first_record = AccessRecoveryRecord.objects.first()
        if first_record:
            test_pages.append(('access_control:record_detail', {'pk': first_record.pk}, '记录详情'))
        
        for url_name, kwargs, page_name in test_pages:
            try:
                url = reverse(url_name, kwargs=kwargs)
                response = client.get(url)
                status = '✓' if response.status_code == 200 else '✗'
                print(f'{status} {page_name}: {url} -> HTTP {response.status_code}')
            except Exception as e:
                print(f'✗ {page_name}: 错误 - {e}')
    else:
        print('✗ 登录失败')

print('\n测试完成！')
