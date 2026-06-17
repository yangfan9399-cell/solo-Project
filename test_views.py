import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'alpine_cal.settings'
django.setup()

from django.test import Client
from calibration.models import Station, Instrument, TransportRecord, Certificate
from calibration.forms import InstrumentForm

client = Client(enforce_csrf_checks=False)

print("=== 补充测试: Instrument create/edit POST ===")
st = Station.objects.first()
inst_data = {
    'station': str(st.pk),
    'instrument_type': 'temperature',
    'model_name': 'TEST-MODEL',
    'serial_number': 'TEST-SERIAL-999',
    'manufacturer': '测试制造商',
    'install_date': '2026-01-01',
    'status': 'normal',
    'last_calibration_date': '2026-06-01',
    'next_calibration_due': '2027-06-01',
}
form = InstrumentForm(inst_data)
print(f"  InstrumentForm valid: {form.is_valid()}, errors: {form.errors}")

resp = client.post('/instruments/create/', inst_data, follow=False)
print(f"  InstrumentCreateView POST status: {resp.status_code}")
if resp.status_code == 302:
    print(f"  Redirect to: {resp.url}")

inst = Instrument.objects.filter(serial_number='TEST-SERIAL-999').first()
assert inst is not None, f"仪器未创建: {Instrument.objects.filter(serial_number='TEST-SERIAL-999')}"
print(f"  仪器创建成功: {inst}")

resp = client.get(f'/instruments/{inst.pk}/')
print(f"  InstrumentDetailView GET: {resp.status_code}")
resp = client.get(f'/instruments/{inst.pk}/edit/')
print(f"  InstrumentUpdateView GET: {resp.status_code}")

update_data = {**inst_data, 'model_name': 'UPDATED-MODEL', 'serial_number': 'TEST-SERIAL-999'}
resp = client.post(f'/instruments/{inst.pk}/edit/', update_data, follow=False)
print(f"  InstrumentUpdateView POST status: {resp.status_code}")
if resp.status_code == 302:
    print(f"  Redirect to: {resp.url}")
inst.refresh_from_db()
print(f"  更新后型号: {inst.model_name}")

print("\n=== 补充测试: Transport edit POST ===")
# 先创建一条运输记录用于测试
st1 = Station.objects.all()[0]
st2 = Station.objects.all()[1]
test_inst = Instrument.objects.first()
from calibration.models import TransportRecord as TR
tr, _ = TR.objects.get_or_create(
    instrument=test_inst, from_station=st1, to_station=st2,
    transport_date='2026-06-18',
    defaults={'method': '临时测试运输', 'impact_score': 2.0}
)
resp = client.get(f'/transports/{tr.pk}/')
print(f"  TransportDetailView GET: {resp.status_code}")
resp = client.get(f'/transports/{tr.pk}/edit/')
print(f"  TransportUpdateView GET: {resp.status_code}")

print("\n=== 补充测试: Certificate edit POST ===")
cert = Certificate.objects.first()
resp = client.get(f'/certificates/{cert.pk}/')
print(f"  CertificateDetailView GET: {resp.status_code}")
resp = client.get(f'/certificates/{cert.pk}/edit/')
print(f"  CertificateUpdateView GET: {resp.status_code}")

print("\n=== 清理测试数据 ===")
Instrument.objects.filter(serial_number='TEST-SERIAL-999').delete()
if tr.method == '临时测试运输':
    tr.delete()
print("  清理完成")
