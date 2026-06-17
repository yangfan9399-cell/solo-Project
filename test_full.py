import os, django, json
os.environ['DJANGO_SETTINGS_MODULE'] = 'alpine_cal.settings'
django.setup()

from django.test import Client
from calibration.models import (
    Station, Instrument, CalibrationBatch, CalibrationRecord,
    TransportRecord, Certificate
)

client = Client(enforce_csrf_checks=False)

print("=== 1. 诊断 TransportUpdateView POST ===")
tr = TransportRecord.objects.first()
print(f"  使用运输记录: {tr.pk} | {tr.method}")

# Test GET edit page first
resp = client.get(f'/transports/{tr.pk}/edit/')
print(f"  GET /transports/{tr.pk}/edit/ -> {resp.status_code}")

# Collect form data from the transport record
tr_data = {
    'instrument': str(tr.instrument.pk),
    'from_station': str(tr.from_station.pk),
    'to_station': str(tr.to_station.pk),
    'transport_date': str(tr.transport_date),
    'arrival_date': str(tr.arrival_date or ''),
    'method': 'UPDATED-运输方式',
    'impact_score': 5.5,
    'pre_transport_reading': 10.0,
    'post_transport_reading': 10.5,
    'notes': '更新的备注测试',
}

resp = client.post(f'/transports/{tr.pk}/edit/', tr_data, follow=False)
print(f"  POST /transports/{tr.pk}/edit/ -> status={resp.status_code}")
if resp.status_code == 302:
    print(f"  Redirect to: {resp.url}")
elif resp.status_code == 200:
    # Check for form errors in rendered HTML
    content = resp.content.decode()
    if 'is-invalid' in content:
        print(f"  FORM VALIDATION FAILED")
        # Try to find error messages
        import re
        for m in re.findall(r'<div class="invalid-feedback">(.*?)</div>', content):
            print(f"    Error: {m.strip()}")
    else:
        print(f"  Returned 200 with {len(resp.content)} chars (re-rendered form?)")
else:
    print(f"  Content snippet: {resp.content.decode()[:300]}")

# Verify DB actually changed
try:
    tr.refresh_from_db()
    print(f"  DB update check: method={tr.method} | impact_score={tr.impact_score} | reading_deviation={tr.reading_deviation}")
except Exception as e:
    print(f"  DB check failed: {e}")


print("\n=== 2. 诊断 CertificateUpdateView POST ===")
cert = Certificate.objects.first()
print(f"  使用证书: {cert.pk} | {cert.certificate_number}")

resp = client.get(f'/certificates/{cert.pk}/edit/')
print(f"  GET /certificates/{cert.pk}/edit/ -> {resp.status_code}")

cert_data = {
    'certificate_number': cert.certificate_number,
    'record': str(cert.record.pk),
    'issued_date': str(cert.issued_date),
    'expiry_date': '2028-12-31',
    'issued_by': 'UPDATED-签发机构',
    'is_valid': True,
    'notes': '更新的证书备注',
}

resp = client.post(f'/certificates/{cert.pk}/edit/', cert_data, follow=False)
print(f"  POST /certificates/{cert.pk}/edit/ -> status={resp.status_code}")
if resp.status_code == 302:
    print(f"  Redirect to: {resp.url}")
elif resp.status_code == 200:
    content = resp.content.decode()
    if 'is-invalid' in content:
        print(f"  FORM VALIDATION FAILED")
        import re
        for m in re.findall(r'<div class="invalid-feedback">(.*?)</div>', content):
            print(f"    Error: {m.strip()}")
    else:
        print(f"  Returned 200 with {len(resp.content)} chars")
try:
    cert.refresh_from_db()
    print(f"  DB update check: expiry_date={cert.expiry_date} | issued_by={cert.issued_by}")
except Exception as e:
    print(f"  DB check failed: {e}")


print("\n=== 3. 离线同步完整测试 (模拟浏览器 localStorage -> 同步) ===")
# 模拟用户通过离线录入模态框暂存然后同步的流程
inst = Instrument.objects.filter(instrument_type='temperature').first()
batch = CalibrationBatch.objects.first()
test_point = f'离线同步测试-{inst.pk}'
count_before = CalibrationRecord.objects.count()

payload = json.dumps({
    'records': [
        {
            'instrument_serial': inst.serial_number,
            'batch_number': batch.batch_number,
            'test_point': test_point,
            'before_value': 0.8,
            'after_value': 0.15,
            'standard_value': 0.0,
            'tolerance': 0.3,
            'result': 'pass',
            'notes': '离线同步测试数据1',
            'timestamp': '2026-06-18T00:00:00.000Z',
        },
        {
            'instrument_serial': inst.serial_number,
            'batch_number': batch.batch_number,
            'test_point': f'{test_point}-批量',
            'before_value': 25.5,
            'after_value': 25.02,
            'standard_value': 25.0,
            'tolerance': 0.3,
            'result': 'pass',
            'notes': '离线同步测试数据2',
        },
    ]
})

resp = client.post('/offline-sync/', payload, content_type='application/json')
print(f"  POST /offline-sync/ -> {resp.status_code}")
data = json.loads(resp.content)
print(f"  Response: {json.dumps(data, ensure_ascii=False)}")
count_after = CalibrationRecord.objects.count()
created_records = CalibrationRecord.objects.filter(test_point__startswith=test_point).count()
print(f"  校准记录变化: {count_before} -> {count_after} (匹配test_point: {created_records})")
print(f"  同步后新记录:")
for r in CalibrationRecord.objects.filter(test_point__startswith=test_point):
    print(f"    - {r.test_point}: {r.before_value}->{r.after_value} (标准:{r.standard_value}, 偏差后:{r.deviation_after})")

print("\n=== 4. 清理测试数据 ===")
CalibrationRecord.objects.filter(test_point__startswith='离线同步测试-').delete()
print(f"  离线测试数据已清理")
