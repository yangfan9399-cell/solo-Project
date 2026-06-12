import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client
from django.urls import reverse
from access_control.models import AccessRecoveryRecord

def test_all_workflows():
    c = Client()
    results = []
    
    reviewing_record = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.REVIEWING
    ).first()
    
    rejected_record = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.REJECTED
    ).first()
    
    archived_record = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.ARCHIVED
    ).first()
    
    processing_record = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.PROCESSING
    ).first()
    
    accepted_record = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.ACCEPTED
    ).first()
    
    pending_record = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.PENDING_ACCEPT
    ).first()

    print('\n=== Test: Reviewer01 reject a reviewing record ===')
    c.login(username='reviewer01', password='review123')
    if reviewing_record:
        url = reverse('access_control:api_review_reject', kwargs={'pk': reviewing_record.pk})
        resp = c.post(url, {'reject_reason': 'Test reject', 'remedial_path': 'Fix it'})
        status = 'PASS' if resp.status_code in [200, 302] else f'FAIL({resp.status_code})'
        reviewing_record.refresh_from_db()
        actual_status = reviewing_record.get_status_display()
        print(f'  {status}: reject reviewing -> {actual_status}')
        results.append(status == 'PASS')
    else:
        print('  SKIP: no reviewing record')
        results.append(True)

    print('\n=== Test: Field01 process an accepted/rejected record ===')
    c.login(username='field01', password='field123')
    
    test_process = rejected_record or accepted_record
    if test_process:
        url = reverse('access_control:api_process_record', kwargs={'pk': test_process.pk})
        resp = c.post(url, {
            'business_note': 'Test note',
            'site_description': 'Test desc', 
            'conclusion': 'Test conclusion'
        })
        status = 'PASS' if resp.status_code in [200, 302] else f'FAIL({resp.status_code})'
        test_process.refresh_from_db()
        actual_status = test_process.get_status_display()
        print(f'  {status}: process -> {actual_status}')
        results.append(status == 'PASS')
    else:
        print('  SKIP: no accepted/rejected record')
        results.append(True)

    print('\n=== Test: Field01 submit for review ===')
    processing_rec = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.PROCESSING
    ).first()
    if processing_rec:
        url = reverse('access_control:api_submit_review', kwargs={'pk': processing_rec.pk})
        resp = c.post(url, {'remarks': 'Submit for review'})
        status = 'PASS' if resp.status_code in [200, 302] else f'FAIL({resp.status_code})'
        processing_rec.refresh_from_db()
        actual_status = processing_rec.get_status_display()
        print(f'  {status}: submit review -> {actual_status}')
        results.append(status == 'PASS')
    else:
        print('  SKIP: no processing record')
        results.append(True)

    print('\n=== Test: Reviewer01 approve and archive ===')
    c.login(username='reviewer01', password='review123')
    reviewing_rec = AccessRecoveryRecord.objects.filter(
        status=AccessRecoveryRecord.Status.REVIEWING
    ).first()
    if reviewing_rec:
        url = reverse('access_control:api_review_approve', kwargs={'pk': reviewing_rec.pk})
        resp = c.post(url, {'remarks': 'Approved'})
        status = 'PASS' if resp.status_code in [200, 302] else f'FAIL({resp.status_code})'
        reviewing_rec.refresh_from_db()
        actual_status = reviewing_rec.get_status_display()
        is_archived = reviewing_rec.is_archived
        print(f'  {status}: approve -> {actual_status}, archived={is_archived}')
        results.append(status == 'PASS')
    else:
        print('  SKIP: no reviewing record')
        results.append(True)

    print('\n=== Test: Reopen archived record ===')
    archived_rec = AccessRecoveryRecord.objects.filter(
        is_archived=True
    ).first()
    if archived_rec:
        url = reverse('access_control:api_reopen_record', kwargs={'pk': archived_rec.pk})
        resp = c.post(url, {'reason': 'Need rework'})
        status = 'PASS' if resp.status_code in [200, 302] else f'FAIL({resp.status_code})'
        archived_rec.refresh_from_db()
        actual_status = archived_rec.get_status_display()
        is_archived = archived_rec.is_archived
        print(f'  {status}: reopen -> {actual_status}, archived={is_archived}')
        results.append(status == 'PASS')
    else:
        print('  SKIP: no archived record')
        results.append(True)

    print('\n=== Test: Drilldown analytics ===')
    c.login(username='admin', password='admin123')
    url = reverse('access_control:analytics_page')
    resp = c.get(url + '?drilldown=1&drill_type=status&drill_value=archived')
    status = 'PASS' if resp.status_code == 200 else f'FAIL({resp.status_code})'
    print(f'  {status}: drilldown by status=archived')
    results.append(status == 'PASS')

    resp = c.get(url + '?drilldown=1&drill_type=sample_type&drill_value=over_limit')
    status = 'PASS' if resp.status_code == 200 else f'FAIL({resp.status_code})'
    print(f'  {status}: drilldown by sample_type=over_limit')
    results.append(status == 'PASS')

    print('\n' + '='*60)
    all_pass = all(r == True for r in results)
    print(f'Total: {len(results)} tests, {"ALL PASSED" if all_pass else "SOME FAILED"}')
    return all_pass

test_all_workflows()
