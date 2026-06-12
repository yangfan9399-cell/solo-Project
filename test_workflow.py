import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse
from access_control.models import AccessRecoveryRecord

client = Client()

print('\n' + '='*60)
print('测试业务流程操作（使用现场人员 field01）')
print('='*60)

client.login(username='field01', password='field123')

pending_record = AccessRecoveryRecord.objects.filter(
    status=AccessRecoveryRecord.Status.PENDING_ACCEPT
).first()

if pending_record:
    print(f'\n测试记录: {pending_record.record_no} (状态: {pending_record.get_status_display()})')
    
    accept_url = reverse('access_control:api_accept_record', kwargs={'pk': pending_record.pk})
    print(f'\n1. 测试受理操作: POST {accept_url}')
    response = client.post(accept_url, {'remarks': '测试受理'})
    print(f'   状态码: {response.status_code} (302=成功重定向)')
    
    pending_record.refresh_from_db()
    print(f'   受理后状态: {pending_record.get_status_display()}')
    
    if pending_record.status == AccessRecoveryRecord.Status.ACCEPTED:
        process_url = reverse('access_control:api_process_record', kwargs={'pk': pending_record.pk})
        print(f'\n2. 测试处理操作: POST {process_url}')
        response = client.post(process_url, {
            'business_note': '测试业务记录',
            'site_description': '测试现场说明',
            'conclusion': '测试处理结论'
        })
        print(f'   状态码: {response.status_code}')
        
        pending_record.refresh_from_db()
        print(f'   处理后状态: {pending_record.get_status_display()}')
        
        if pending_record.status == AccessRecoveryRecord.Status.PROCESSING:
            submit_url = reverse('access_control:api_submit_review', kwargs={'pk': pending_record.pk})
            print(f'\n3. 测试提交复核: POST {submit_url}')
            response = client.post(submit_url, {'remarks': '提交复核测试'})
            print(f'   状态码: {response.status_code}')
            
            pending_record.refresh_from_db()
            print(f'   提交后状态: {pending_record.get_status_display()}')

print('\n' + '='*60)
print('测试复核流程操作（使用复核主管 reviewer01）')
print('='*60)

client = Client()
client.login(username='reviewer01', password='review123')

reviewing_record = AccessRecoveryRecord.objects.filter(
    status=AccessRecoveryRecord.Status.REVIEWING
).first()

if reviewing_record:
    print(f'\n测试记录: {reviewing_record.record_no} (状态: {reviewing_record.get_status_display()})')
    
    reject_url = reverse('access_control:api_review_reject', kwargs={'pk': reviewing_record.pk})
    print(f'\n1. 测试退回补证: POST {reject_url}')
    response = client.post(reject_url, {
        'reject_reason': '测试退回原因',
        'remedial_path': '测试补救路径'
    })
    print(f'   状态码: {response.status_code}')
    
    reviewing_record.refresh_from_db()
    print(f'   退回后状态: {reviewing_record.get_status_display()}')

archived_test_record = AccessRecoveryRecord.objects.filter(
    status=AccessRecoveryRecord.Status.REVIEWING
).first()

if archived_test_record:
    approve_url = reverse('access_control:api_review_approve', kwargs={'pk': archived_test_record.pk})
    print(f'\n2. 测试复核通过并归档: POST {approve_url}')
    response = client.post(approve_url, {'remarks': '测试复核通过'})
    print(f'   状态码: {response.status_code}')
    
    archived_test_record.refresh_from_db()
    print(f'   归档后状态: {archived_test_record.get_status_display()}')
    print(f'   是否已归档: {archived_test_record.is_archived}')

print('\n测试完成！')
