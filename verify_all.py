import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse
from access_control.models import AccessRecoveryRecord
from accounts.models import User
from decimal import Decimal

def run_quick_tests():
    print('\n' + '='*70)
    print('快速验证：所有页面、API 和操作按钮')
    print('='*70)
    
    passed = 0
    failed = 0
    
    # 1. 验证登录跳转
    print('\n1. 登录跳转验证:')
    for username, password, expected_redirect in [
        ('admin', 'admin123', '/'),
        ('field01', 'field123', '/processing/'),
        ('reviewer01', 'review123', '/'),
    ]:
        c = Client()
        resp = c.post(reverse('accounts:login'), {'username': username, 'password': password}, follow=True)
        final = resp.request.get('PATH_INFO', '')
        ok = final == expected_redirect
        status = '✓' if ok else '✗'
        print(f'  {status} {username}: {final} {"==" if ok else "!="} {expected_redirect}')
        if ok: passed +=1
        else: failed +=1
    
    # 2. 验证所有页面加载
    print('\n2. 页面加载验证 (管理员):')
    c = Client()
    c.login(username='admin', password='admin123')
    for url_name, desc in [
        ('access_control:dashboard', '数据看板'),
        ('access_control:record_list', '记录列表'),
        ('access_control:processing_desk', '处理台'),
        ('access_control:review_page', '复核中心'),
        ('access_control:analytics_page', '复盘统计'),
    ]:
        url = reverse(url_name)
        resp = c.get(url)
        ok = resp.status_code == 200
        status = '✓' if ok else '✗'
        print(f'  {status} {desc}: HTTP {resp.status_code}')
        if ok: passed +=1
        else: failed +=1
    
    # 3. 创建测试记录并走完完整流程
    print('\n3. 业务流程验证 (完整流程):')
    
    admin = User.objects.get(username='admin')
    field = User.objects.get(username='field01')
    reviewer = User.objects.get(username='reviewer01')
    
    # 创建记录
    from datetime import date, timedelta
    from django.utils import timezone
    rec = AccessRecoveryRecord.objects.create(
        title='测试记录 - 生物实验室B305',
        sample_type='normal',
        source='system',
        status='pending_accept',
        applicant_name='李教授',
        applicant_dept='生命科学学院',
        applicant_id='BIO007',
        lab_name='生物实验室B305',
        lab_code='BIO-B305',
        access_area='B栋3层',
        original_authorized_date=date.today() - timedelta(days=365),
        expiry_date=date.today() + timedelta(days=30),
        deadline=timezone.now() + timedelta(days=7),
        authorized_person_count=12,
        involved_amount=Decimal('36000.00'),
        created_by=admin,
    )
    rec_id = rec.id
    print(f'  创建记录 #{rec_id}: {rec.record_no}')
    
    # 受理
    c = Client()
    c.login(username='field01', password='field123')
    resp = c.post(reverse('access_control:api_accept_record', kwargs={'pk': rec_id}), 
                  {'remarks': '测试受理'}, follow=True)
    rec.refresh_from_db()
    ok = rec.status == 'accepted' and resp.status_code == 200
    status = '✓' if ok else '✗'
    print(f'  {status} 受理: 状态={rec.status} (accepted)')
    if ok: passed +=1
    else: failed +=1
    
    # 处理
    resp = c.post(reverse('access_control:api_process_record', kwargs={'pk': rec_id}), {
        'business_note': '测试业务记录',
        'site_description': '测试现场说明',
        'conclusion': '测试处理结论'
    }, follow=True)
    rec.refresh_from_db()
    ok = rec.status == 'processing' and resp.status_code == 200
    status = '✓' if ok else '✗'
    print(f'  {status} 处理: 状态={rec.status} (processing)')
    if ok: passed +=1
    else: failed +=1
    
    # 提交复核
    resp = c.post(reverse('access_control:api_submit_review', kwargs={'pk': rec_id}),
                  {'remarks': '提交复核测试'}, follow=True)
    rec.refresh_from_db()
    ok = rec.status == 'reviewing' and resp.status_code == 200
    status = '✓' if ok else '✗'
    print(f'  {status} 提交复核: 状态={rec.status} (reviewing)')
    if ok: passed +=1
    else: failed +=1
    
    # 复核通过归档
    c = Client()
    c.login(username='reviewer01', password='review123')
    resp = c.post(reverse('access_control:api_review_approve', kwargs={'pk': rec_id}),
                  {'remarks': '复核通过测试'}, follow=True)
    rec.refresh_from_db()
    ok = rec.status == 'archived' and rec.is_archived and resp.status_code == 200
    status = '✓' if ok else '✗'
    print(f'  {status} 复核通过归档: 状态={rec.status}, archived={rec.is_archived}')
    if ok: passed +=1
    else: failed +=1
    
    # 重新处理
    resp = c.post(reverse('access_control:api_reopen_record', kwargs={'pk': rec_id}),
                  {'reason': '测试重新处理'}, follow=True)
    rec.refresh_from_db()
    ok = rec.status == 'processing' and not rec.is_archived and resp.status_code == 200
    status = '✓' if ok else '✗'
    print(f'  {status} 重新处理: 状态={rec.status}, archived={rec.is_archived}')
    if ok: passed +=1
    else: failed +=1
    
    # 4. 验证 HTMX 详情加载 (处理台)
    print('\n4. HTMX 详情加载验证:')
    c = Client()
    c.login(username='field01', password='field123')
    resp = c.get(reverse('access_control:processing_desk') + f'?record_id={rec_id}',
                 HTTP_HX_REQUEST='true')
    ok = resp.status_code == 200
    content = resp.content.decode('utf-8')
    has_alpine = 'x-data' in content and 'activeTab' in content
    has_buttons = '提交复核' in content or '处理' in content
    has_hx = 'hx-post' in content
    status = '✓' if ok and has_alpine and has_buttons and has_hx else '✗'
    print(f'  {status} 处理台 HTMX 加载: HTTP={resp.status_code}, Alpine={has_alpine}, 按钮={has_buttons}, hx-post={has_hx}')
    if ok and has_alpine and has_buttons and has_hx: passed +=1
    else: failed +=1
    
    # 5. 验证 HTMX 详情加载 (复核中心)
    # 先把记录移到复核中
    c = Client()
    c.login(username='field01', password='field123')
    c.post(reverse('access_control:api_submit_review', kwargs={'pk': rec_id}),
           {'remarks': '再次提交'})
    
    c = Client()
    c.login(username='reviewer01', password='review123')
    resp = c.get(reverse('access_control:review_page') + f'?record_id={rec_id}',
                 HTTP_HX_REQUEST='true')
    ok = resp.status_code == 200
    content = resp.content.decode('utf-8')
    has_review_buttons = '复核通过' in content or '退回补证' in content
    status = '✓' if ok and has_review_buttons else '✗'
    print(f'  {status} 复核中心 HTMX 加载: HTTP={resp.status_code}, 复核按钮={has_review_buttons}')
    if ok and has_review_buttons: passed +=1
    else: failed +=1
    
    # 6. 验证统计钻取
    print('\n5. 统计钻取验证:')
    c = Client()
    c.login(username='admin', password='admin123')
    for drill_type, drill_value, desc in [
        ('status', 'processing', '状态=处理中'),
        ('status', 'archived', '状态=已归档'),
        ('sample_type', 'over_limit', '类型=指标超限'),
    ]:
        url = reverse('access_control:analytics_page') + f'?drilldown=1&drill_type={drill_type}&drill_value={drill_value}'
        resp = c.get(url)
        ok = resp.status_code == 200
        status = '✓' if ok else '✗'
        print(f'  {status} 钻取{desc}: HTTP {resp.status_code}')
        if ok: passed +=1
        else: failed +=1
    
    # 清理
    rec.delete()
    print(f'\n  清理测试记录 #{rec_id}')
    
    print('\n' + '='*70)
    print(f'测试结果: {passed} 通过, {failed} 失败')
    print('='*70)
    
    return failed == 0

if __name__ == '__main__':
    success = run_quick_tests()
    exit(0 if success else 1)
