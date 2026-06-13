import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cableway_inspection.settings')
django.setup()

from inspection.models import User, DailyInspection
from django.test import RequestFactory
from inspection.views import api_upload_evidence, api_add_business_record

factory = RequestFactory()

field_user = User.objects.get(username='field_zhang')
supervisor_user = User.objects.get(username='supervisor_chen')
inspection = DailyInspection.objects.filter(is_archived=False).first()

print('=== 接口层角色限制验证 ===')

req = factory.post('/api/inspection/{}/upload-evidence/'.format(inspection.pk))
req.user = supervisor_user
resp = api_upload_evidence(req, inspection.pk)
print('主管上传证据: status={} (期望403)'.format(resp.status_code))

req.user = field_user
resp = api_upload_evidence(req, inspection.pk)
print('现场上传证据: status={} (期望非403)'.format(resp.status_code))

req = factory.post('/api/inspection/{}/add-record/'.format(inspection.pk), {
    'record_type': 'fault', 'title': 'test', 'content': 'test'
})
req.user = supervisor_user
resp = api_add_business_record(req, inspection.pk)
print('主管添加记录: status={} (期望403)'.format(resp.status_code))

req.user = field_user
resp = api_add_business_record(req, inspection.pk)
print('现场添加记录: status={} (期望200)'.format(resp.status_code))

passed = True
if resp.status_code == 200:
    print('\n现场人员业务记录已创建，清理测试数据...')
    BusinessRecord = django.apps.apps.get_model('inspection', 'BusinessRecord')
    BusinessRecord.objects.filter(title='test', recorded_by=field_user).delete()

print('\n=== 验证完成 ===')
