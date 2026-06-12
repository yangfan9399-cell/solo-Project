import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse
from access_control.models import AccessRecoveryRecord

def test_all_pages_and_apis():
    results = []
    errors = []
    
    c = Client()
    
    print('\n' + '='*70)
    print('1. TEST: Login as different roles')
    print('='*70)
    
    test_cases = [
        ('admin', 'admin123', '管理员', ['dashboard', 'record_list', 'processing_desk', 'review_page', 'analytics_page']),
        ('field01', 'field123', '现场人员', ['dashboard', 'record_list', 'processing_desk', 'analytics_page']),
        ('reviewer01', 'review123', '复核主管', ['dashboard', 'record_list', 'processing_desk', 'review_page', 'analytics_page']),
    ]
    
    for username, password, role, expected_pages in test_cases:
        c = Client()
        login_ok = c.login(username=username, password=password)
        status = '✓' if login_ok else '✗'
        print(f'{status} {role} ({username}) 登录: {"成功" if login_ok else "失败"}')
        if not login_ok:
            errors.append(f'{role} login failed')
            continue
        
        login_resp = c.post(reverse('accounts:login'), {'username': username, 'password': password}, follow=True)
        final_url = login_resp.request.get('PATH_INFO', '')
        if role == '现场人员':
            expected = '/processing/'
        else:
            expected = '/'
        status = '✓' if final_url == expected else '✗'
        print(f'  {status} 登录后跳转: {final_url} (期望: {expected})')
        if final_url != expected:
            errors.append(f'{role} wrong redirect: {final_url} != {expected}')
        results.append(login_ok)
    
    print('\n' + '='*70)
    print('2. TEST: Page loads for field staff (processing_desk)')
    print('='*70)
    
    c = Client()
    c.login(username='field01', password='field123')
    
    processing_url = reverse('access_control:processing_desk')
    resp = c.get(processing_url)
    status = '✓' if resp.status_code == 200 else '✗'
    print(f'{status} 处理台页面: HTTP {resp.status_code}')
    if resp.status_code != 200:
        errors.append('processing_desk page failed')
    results.append(resp.status_code == 200)
    
    # Test HTMX partial load for processing desk
    first_record = AccessRecoveryRecord.objects.filter(processed_by__username='field01').first()
    if first_record:
        resp = c.get(processing_url + f'?record_id={first_record.id}', HTTP_HX_REQUEST='true')
        status = '✓' if resp.status_code == 200 else '✗'
        print(f'{status} 处理台 HTMX 加载详情 record_id={first_record.id}: HTTP {resp.status_code}')
        if resp.status_code != 200:
            errors.append(f'processing_desk HTMX partial failed for id={first_record.id}')
        results.append(resp.status_code == 200)
        
        content = resp.content.decode('utf-8')
        has_alpine = 'x-data' in content and 'activeTab' in content
        has_hx_post = 'hx-post' in content or 'hx-get' in content
        has_buttons = '受理' in content or '处理' in content or '提交' in content or '退回' in content or '归档' in content
        status = '✓' if has_alpine and has_hx_post and has_buttons else '✗'
        print(f'{status} 详情内容包含 Alpine x-data={has_alpine}, hx-post={has_hx_post}, 操作按钮={has_buttons}')
        if not (has_alpine and has_hx_post and has_buttons):
            errors.append('detail content missing Alpine/hx-post/buttons')
        results.append(has_alpine and has_hx_post and has_buttons)
    
    print('\n' + '='*70)
    print('3. TEST: Page loads for reviewer (review_page)')
    print('='*70)
    
    c = Client()
    c.login(username='reviewer01', password='review123')
    
    review_url = reverse('access_control:review_page')
    resp = c.get(review_url)
    status = '✓' if resp.status_code == 200 else '✗'
    print(f'{status} 复核中心页面: HTTP {resp.status_code}')
    if resp.status_code != 200:
        errors.append('review_page failed')
    results.append(resp.status_code == 200)
    
    reviewing_record = AccessRecoveryRecord.objects.filter(status='reviewing').first()
    if reviewing_record:
        resp = c.get(review_url + f'?record_id={reviewing_record.id}', HTTP_HX_REQUEST='true')
        status = '✓' if resp.status_code == 200 else '✗'
        print(f'{status} 复核中心 HTMX 加载详情 record_id={reviewing_record.id}: HTTP {resp.status_code}')
        if resp.status_code != 200:
            errors.append(f'review_page HTMX partial failed for id={reviewing_record.id}')
        results.append(resp.status_code == 200)
        
        content = resp.content.decode('utf-8')
        has_review_buttons = '复核通过' in content or '退回补证' in content or '归档' in content
        status = '✓' if has_review_buttons else '✗'
        print(f'{status} 复核详情包含复核操作按钮: {has_review_buttons}')
        if not has_review_buttons:
            errors.append('review detail missing review buttons')
        results.append(has_review_buttons)
    
    print('\n' + '='*70)
    print('4. TEST: All API endpoints work on correct record')
    print('='*70)
    
    # First, let's create a fresh record for testing via shell to ensure clean state
    from access_control.services import WorkflowService
    from accounts.models import User
    
    admin_user = User.objects.get(username='admin')
    field_user = User.objects.get(username='field01')
    reviewer_user = User.objects.get(username='reviewer01')
    
    # Create a test record and move it through states
    from access_control.models import AccessRecoveryRecord
    from decimal import Decimal
    
    test_rec = AccessRecoveryRecord.objects.create(
        title='API TEST - 化学楼A201门禁回收',
        sample_type='normal',
        source='system',
        status='pending_accept',
        applicant_name='测试申请人',
        applicant_dept='化学学院',
        applicant_id='TEST001',
        lab_name='化学楼A201',
        lab_code='CHEM-A201',
        access_area='A栋2层',
        authorized_person_count=10,
        involved_amount=Decimal('10000.00'),
        created_by=admin_user,
    )
    test_rec_id = test_rec.id
    print(f'创建测试记录 #{test_rec_id}: {test_rec.record_no}')
    
    # Test 1: Accept (field staff)
    c = Client()
    c.login(username='field01', password='field123')
    
    accept_url = reverse('access_control:api_accept_record', kwargs={'pk': test_rec_id})
    resp = c.post(accept_url, {'remarks': '测试受理'}, follow=False)
    test_rec.refresh_from_db()
    expected = 'accepted'
    status = '✓' if test_rec.status == expected and resp.status_code in [200, 302] else '✗'
    print(f'{status} 受理 API: record={test_rec_id}, 状态={test_rec.status} (期望={expected}), HTTP={resp.status_code}')
    if test_rec.status != expected:
        errors.append(f'accept failed: {test_rec.status} != {expected}')
    results.append(test_rec.status == expected)
    
    # Test 2: Process
    process_url = reverse('access_control:api_process_record', kwargs={'pk': test_rec_id})
    resp = c.post(process_url, {
        'business_note': '测试业务记录',
        'site_description': '测试现场描述',
        'conclusion': '测试处理结论'
    }, follow=False)
    test_rec.refresh_from_db()
    expected = 'processing'
    status = '✓' if test_rec.status == expected and resp.status_code in [200, 302] else '✗'
    print(f'{status} 处理 API: record={test_rec_id}, 状态={test_rec.status} (期望={expected}), HTTP={resp.status_code}')
    if test_rec.status != expected:
        errors.append(f'process failed: {test_rec.status} != {expected}')
    results.append(test_rec.status == expected)
    
    # Test 3: Submit for review
    submit_url = reverse('access_control:api_submit_review', kwargs={'pk': test_rec_id})
    resp = c.post(submit_url, {'remarks': '测试提交复核'}, follow=False)
    test_rec.refresh_from_db()
    expected = 'reviewing'
    status = '✓' if test_rec.status == expected and resp.status_code in [200, 302] else '✗'
    print(f'{status} 提交复核 API: record={test_rec_id}, 状态={test_rec.status} (期望={expected}), HTTP={resp.status_code}')
    if test_rec.status != expected:
        errors.append(f'submit review failed: {test_rec.status} != {expected}')
    results.append(test_rec.status == expected)
    
    # Test 4: Review reject
    c = Client()
    c.login(username='reviewer01', password='review123')
    
    reject_url = reverse('access_control:api_review_reject', kwargs={'pk': test_rec_id})
    resp = c.post(reject_url, {
        'reject_reason': '测试退回原因',
        'remedial_path': '测试补救路径'
    }, follow=False)
    test_rec.refresh_from_db()
    expected = 'rejected'
    status = '✓' if test_rec.status == expected and resp.status_code in [200, 302] else '✗'
    print(f'{status} 退回补证 API: record={test_rec_id}, 状态={test_rec.status} (期望={expected}), HTTP={resp.status_code}')
    if test_rec.status != expected:
        errors.append(f'reject failed: {test_rec.status} != {expected}')
    results.append(test_rec.status == expected)
    
    # Test 5: Re-process after reject (field staff)
    c = Client()
    c.login(username='field01', password='field123')
    
    process_url = reverse('access_control:api_process_record', kwargs={'pk': test_rec_id})
    resp = c.post(process_url, {
        'business_note': '补充后业务记录',
        'site_description': '补充后现场描述',
        'conclusion': '补充后处理结论'
    }, follow=False)
    test_rec.refresh_from_db()
    expected = 'processing'
    status = '✓' if test_rec.status == expected and resp.status_code in [200, 302] else '✗'
    print(f'{status} 重新处理 API: record={test_rec_id}, 状态={test_rec.status} (期望={expected}), HTTP={resp.status_code}')
    if test_rec.status != expected:
        errors.append(f'reprocess failed: {test_rec.status} != {expected}')
    results.append(test_rec.status == expected)
    
    # Test 6: Submit for review again
    submit_url = reverse('access_control:api_submit_review', kwargs={'pk': test_rec_id})
    resp = c.post(submit_url, {'remarks': '重新提交复核'}, follow=False)
    test_rec.refresh_from_db()
    expected = 'reviewing'
    status = '✓' if test_rec.status == expected and resp.status_code in [200, 302] else '✗'
    print(f'{status} 再次提交复核 API: record={test_rec_id}, 状态={test_rec.status} (期望={expected}), HTTP={resp.status_code}')
    if test_rec.status != expected:
        errors.append(f'resubmit failed: {test_rec.status} != {expected}')
    results.append(test_rec.status == expected)
    
    # Test 7: Review approve & archive
    c = Client()
    c.login(username='reviewer01', password='review123')
    
    approve_url = reverse('access_control:api_review_approve', kwargs={'pk': test_rec_id})
    resp = c.post(approve_url, {'remarks': '测试复核通过'}, follow=False)
    test_rec.refresh_from_db()
    expected = 'archived'
    status = '✓' if test_rec.status == expected and test_rec.is_archived and resp.status_code in [200, 302] else '✗'
    print(f'{status} 复核通过归档 API: record={test_rec_id}, 状态={test_rec.status}, 已归档={test_rec.is_archived} (期望={expected}/True), HTTP={resp.status_code}')
    if not (test_rec.status == expected and test_rec.is_archived):
        errors.append(f'approve failed: status={test_rec.status}, archived={test_rec.is_archived}')
    results.append(test_rec.status == expected and test_rec.is_archived)
    
    # Test 8: Reopen
    reopen_url = reverse('access_control:api_reopen_record', kwargs={'pk': test_rec_id})
    resp = c.post(reopen_url, {'reason': '测试重新处理'}, follow=False)
    test_rec.refresh_from_db()
    expected = 'processing'
    status = '✓' if test_rec.status == expected and not test_rec.is_archived and resp.status_code in [200, 302] else '✗'
    print(f'{status} 重新处理 API: record={test_rec_id}, 状态={test_rec.status}, 已归档={test_rec.is_archived} (期望={expected}/False), HTTP={resp.status_code}')
    if not (test_rec.status == expected and not test_rec.is_archived):
        errors.append(f'reopen failed: status={test_rec.status}, archived={test_rec.is_archived}')
    results.append(test_rec.status == expected and not test_rec.is_archived)
    
    print('\n' + '='*70)
    print('5. TEST: Analytics drilldown returns correct list')
    print('='*70)
    
    c = Client()
    c.login(username='admin', password='admin123')
    
    analytics_url = reverse('access_control:analytics_page')
    
    drilldown_cases = [
        ('status', 'archived', '已归档'),
        ('status', 'processing', '处理中'),
        ('sample_type', 'over_limit', '指标超限'),
        ('sample_type', 'evidence_missing', '证据缺失'),
    ]
    
    for drill_type, drill_value, desc in drilldown_cases:
        url = analytics_url + f'?drilldown=1&drill_type={drill_type}&drill_value={drill_value}'
        resp = c.get(url)
        has_content = resp.status_code == 200 and 'drilldown' in resp.content.decode('utf-8').lower()
        status = '✓' if resp.status_code == 200 else '✗'
        print(f'{status} 钻取 {desc} ({drill_type}={drill_value}): HTTP {resp.status_code}')
        if resp.status_code != 200:
            errors.append(f'drilldown {drill_type}={drill_value} failed')
        results.append(resp.status_code == 200)
    
    # Cleanup
    test_rec.delete()
    print(f'\n清理测试记录 #{test_rec_id}')
    
    print('\n' + '='*70)
    total = len(results)
    passed = sum(1 for r in results if r)
    all_pass = passed == total
    print(f'测试结果: {passed}/{total} 通过')
    print('='*70)
    
    if errors:
        print('\n错误详情:')
        for err in errors:
            print(f'  - {err}')
    else:
        print('\n✓ 所有测试通过！')
    
    return all_pass

test_all_pages_and_apis()
