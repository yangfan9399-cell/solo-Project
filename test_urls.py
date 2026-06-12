import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import reverse, NoReverseMatch

test_urls = [
    ('access_control:dashboard', {}),
    ('access_control:record_list', {}),
    ('access_control:record_detail', {'pk': 1}),
    ('access_control:processing_desk', {}),
    ('access_control:review_page', {}),
    ('access_control:analytics_page', {}),
    ('access_control:api_accept_record', {'pk': 1}),
    ('access_control:api_process_record', {'pk': 1}),
    ('access_control:api_submit_review', {'pk': 1}),
    ('access_control:api_review_approve', {'pk': 1}),
    ('access_control:api_review_reject', {'pk': 1}),
    ('access_control:api_archive_record', {'pk': 1}),
    ('access_control:api_reopen_record', {'pk': 1}),
    ('access_control:api_upload_evidence', {'pk': 1}),
    ('access_control:api_record_summary', {'pk': 1}),
    ('access_control:api_dashboard_stats', {}),
    ('accounts:login', {}),
    ('accounts:logout', {}),
    ('accounts:profile', {}),
]

print('Testing URL reverses:')
print('=' * 60)
all_ok = True
for name, kwargs in test_urls:
    try:
        url = reverse(name, kwargs=kwargs)
        print(f'OK  {name} -> {url}')
    except NoReverseMatch as e:
        print(f'FAIL {name} -> {e}')
        all_ok = False

print('=' * 60)
if all_ok:
    print('SUCCESS: All URLs reversed successfully!')
else:
    print('FAILED: Some URLs could not be reversed!')
