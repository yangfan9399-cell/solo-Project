import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse
from access_control.models import AccessRecoveryRecord
from accounts.models import User
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone

def test_detail_form_refresh():
    print('\n' + '='*70)
    print('深度验证：HTMX 加载详情后提交表单 -> 刷新详情内容')
    print('='*70)
    
    results = []
    
    # 1. 创建测试记录
    admin = User.objects.get(username='admin')
    rec = AccessRecoveryRecord.objects.create(
        title='HTMX详情刷新测试 - 物理楼A101',
        sample_type='normal',
        source='system',
        status='pending_accept',
        applicant_name='张教授',
        applicant_dept='物理学院',
        applicant_id='PHY009',
        lab_name='物理楼A101',
        lab_code='PHY-A101',
        access_area='A栋1层',
        original_authorized_date=date.today() - timedelta(days=365),
        expiry_date=date.today() + timedelta(days=30),
        deadline=timezone.now() + timedelta(days=7),
        authorized_person_count=15,
        involved_amount=Decimal('45000.00'),
        created_by=admin,
    )
    rec_id = rec.id
    print(f'\n创建测试记录 #{rec_id}: {rec.record_no}')
    
    # 2. 现场人员登录
    c = Client()
    login_ok = c.login(username='field01', password='field123')
    print(f'现场人员登录: {"✓" if login_ok else "✗"}')
    
    # 3. 模拟 HTMX 方式加载处理台详情 (带 HX-Request 头)
    processing_url = reverse('access_control:processing_desk') + f'?record_id={rec_id}'
    resp = c.get(processing_url, HTTP_HX_REQUEST='true')
    ok = resp.status_code == 200
    content = resp.content.decode('utf-8')
    has_detail_content_id = 'id="record-detail-content"' in content
    has_accept_form = f'/api/records/{rec_id}/accept' in content
    print(f'处理台 HTMX 加载详情: HTTP={resp.status_code}')
    print(f'  - 包含 id="record-detail-content": {"✓" if has_detail_content_id else "✗"}')
    print(f'  - 包含 accept 表单 (/api/records/{rec_id}/accept): {"✓" if has_accept_form else "✗"}')
    results.append(ok and has_detail_content_id and has_accept_form)
    
    # 4. 提交受理表单 (HTMX POST), 期望返回新的详情内容
    accept_url = reverse('access_control:api_accept_record', kwargs={'pk': rec_id})
    resp = c.post(accept_url, {'remarks': '测试受理-HTMX'})
    ok = resp.status_code in [200, 302]
    rec.refresh_from_db()
    print(f'\n提交受理表单: HTTP={resp.status_code}')
    print(f'  - 记录状态: {rec.status} {"✓" if rec.status == "accepted" else "✗"}')
    results.append(rec.status == 'accepted')
    
    # 5. 再次 HTMX 加载详情, 检查是否显示"处理"按钮而不是"受理"按钮
    resp = c.get(processing_url, HTTP_HX_REQUEST='true')
    content = resp.content.decode('utf-8')
    has_process_form = f'/api/records/{rec_id}/process' in content
    has_submit_form = f'/api/records/{rec_id}/submit-review' in content
    print(f'\n受理后再次加载详情:')
    print(f'  - 包含 process 表单: {"✓" if has_process_form else "✗"}')
    print(f'  - 包含 submit-review 表单: {"✓" if has_submit_form else "✗"}')
    results.append(has_process_form)
    
    # 6. 提交处理表单
    process_url = reverse('access_control:api_process_record', kwargs={'pk': rec_id})
    resp = c.post(process_url, {
        'business_note': '测试业务记录',
        'site_description': '测试现场说明',
        'conclusion': '测试处理结论'
    })
    rec.refresh_from_db()
    print(f'\n提交处理表单: HTTP={resp.status_code}')
    print(f'  - 记录状态: {rec.status} {"✓" if rec.status == "processing" else "✗"}')
    results.append(rec.status == 'processing')
    
    # 7. 再次加载详情, 检查是否显示"提交复核"按钮
    resp = c.get(processing_url, HTTP_HX_REQUEST='true')
    content = resp.content.decode('utf-8')
    has_submit_form_after = f'/api/records/{rec_id}/submit-review' in content
    print(f'\n处理后加载详情:')
    print(f'  - 包含 submit-review 表单: {"✓" if has_submit_form_after else "✗"}')
    results.append(has_submit_form_after)
    
    # 8. 复核主管登录, 复核中心加载详情
    c2 = Client()
    c2.login(username='reviewer01', password='review123')
    
    # 先提交复核
    c.post(reverse('access_control:api_submit_review', kwargs={'pk': rec_id}), {'remarks': '提交复核测试'})
    rec.refresh_from_db()
    
    review_url = reverse('access_control:review_page') + f'?record_id={rec_id}'
    resp = c2.get(review_url, HTTP_HX_REQUEST='true')
    content = resp.content.decode('utf-8')
    has_approve = f'/api/records/{rec_id}/review-approve' in content
    has_reject = f'/api/records/{rec_id}/review-reject' in content
    print(f'\n复核中心 HTMX 加载详情:')
    print(f'  - 包含 review-approve 表单: {"✓" if has_approve else "✗"}')
    print(f'  - 包含 review-reject 表单: {"✓" if has_reject else "✗"}')
    results.append(has_approve and has_reject)
    
    # 9. 复核通过
    approve_url = reverse('access_control:api_review_approve', kwargs={'pk': rec_id})
    resp = c2.post(approve_url, {'remarks': '复核通过测试'})
    rec.refresh_from_db()
    print(f'\n提交复核通过表单:')
    print(f'  - 记录状态: {rec.status} {"✓" if rec.status == "archived" else "✗"}')
    print(f'  - 已归档: {rec.is_archived} {"✓" if rec.is_archived else "✗"}')
    results.append(rec.status == 'archived' and rec.is_archived)
    
    # 10. 归档后加载详情, 检查显示"重新处理"按钮和归档状态
    resp = c2.get(review_url, HTTP_HX_REQUEST='true')
    content = resp.content.decode('utf-8')
    has_reopen = f'/api/records/{rec_id}/reopen' in content
    has_archive_status = '已归档' in content
    print(f'\n归档后加载详情:')
    print(f'  - 包含 reopen 表单: {"✓" if has_reopen else "✗"}')
    print(f'  - 显示"已归档"状态: {"✓" if has_archive_status else "✗"}')
    results.append(has_reopen and has_archive_status)
    
    # 11. 统计钻取测试
    c3 = Client()
    c3.login(username='admin', password='admin123')
    analytics_url = reverse('access_control:analytics_page')
    resp = c3.get(analytics_url + '?drilldown=1&drill_type=status&drill_value=archived', HTTP_HX_REQUEST='true')
    drill_ok = resp.status_code == 200 and 'drilldown' in resp.content.decode('utf-8').lower()
    print(f'\n统计钻取(已归档): HTTP={resp.status_code} {"✓" if drill_ok else "✗"}')
    results.append(drill_ok)
    
    # 清理
    rec.delete()
    print(f'\n清理测试记录 #{rec_id}')
    
    total = len(results)
    passed = sum(1 for r in results if r)
    print('\n' + '='*70)
    print(f'深度验证结果: {passed}/{total} 通过')
    print('='*70)
    
    return passed == total

if __name__ == '__main__':
    ok = test_detail_form_refresh()
    exit(0 if ok else 1)
