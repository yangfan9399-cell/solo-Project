import os, django, json
os.environ['DJANGO_SETTINGS_MODULE'] = 'alpine_cal.settings'
django.setup()

from django.test import Client
from calibration.models import (
    Station, Instrument, CalibrationBatch, CalibrationRecord,
    TransportRecord, Certificate
)

client = Client(enforce_csrf_checks=False)

results = []
def test(name, fn):
    try:
        ok = fn()
        results.append((name, ok, ''))
        print(f"{'✅' if ok else '❌'} {name}")
        if not ok: print(f"   FAIL")
    except Exception as e:
        results.append((name, False, str(e)))
        print(f"❌ {name}: {e}")

print("=" * 60)
print(" 完整工作台端到端测试")
print("=" * 60)

# --- 1. 首页工作台 GET ---
def test_homepage():
    resp = client.get('/')
    content = resp.content.decode()
    return resp.status_code == 200 and '快捷新增入口' in content and '离线录入同步验证卡' in content
test("1. 首页工作台 GET (含快捷入口+离线同步卡)", test_homepage)

# --- 2. 所有模块 CreateView GET ---
for name, path in [
    ('气象站', '/stations/create/'),
    ('仪器', '/instruments/create/'),
    ('校准记录', '/calibrations/create/'),
    ('校准批次', '/batches/create/'),
    ('运输记录', '/transports/create/'),
    ('证书', '/certificates/create/'),
]:
    def make_test(p):
        def _t(): return client.get(p).status_code == 200
        return _t
    test(f"2.{name} 创建页 GET", make_test(path))

# --- 3. 所有模块 CreateView POST + 重定向 ---
print("\n--- Create POST + Redirect ---")

test_station_pk = None
def test_create_station():
    global test_station_pk
    data = {
        'name': 'E2E-测试气象站', 'code': 'E2E-001', 'altitude': 5200,
        'latitude': 33.5, 'longitude': 97.2, 'region': 'qinghai',
        'status': 'active', 'established_date': '2026-01-01', 'notes': '端到端测试'
    }
    resp = client.post('/stations/create/', data, follow=False)
    if resp.status_code != 302:
        return False
    if not resp.url and not hasattr(resp, 'url'):
        return False
    s = Station.objects.filter(code='E2E-001').first()
    if not s: return False
    test_station_pk = s.pk
    return resp.status_code == 302
test("3.1. 创建气象站 POST → 302跳转", test_create_station)

test_instrument_pk = None
def test_create_instrument():
    global test_instrument_pk
    if not test_station_pk: return False
    data = {
        'station': str(test_station_pk), 'instrument_type': 'wind_speed',
        'model_name': 'E2E-WS-001', 'serial_number': 'E2E-SERIAL-001',
        'manufacturer': '端到端厂商', 'install_date': '2026-01-15',
        'status': 'normal',
        'last_calibration_date': '2026-03-01', 'next_calibration_due': '2027-03-01',
    }
    resp = client.post('/instruments/create/', data, follow=False)
    inst = Instrument.objects.filter(serial_number='E2E-SERIAL-001').first()
    if not inst: return False
    test_instrument_pk = inst.pk
    return resp.status_code == 302 and '/instruments/' in resp.url
test("3.2. 创建仪器 POST → 302跳转(列表)", test_create_instrument)

test_batch_pk = None
def test_create_batch():
    global test_batch_pk
    data = {
        'batch_number': 'E2E-BATCH-001', 'calibration_date': '2026-06-18',
        'operator': 'E2E-测试员', 'lab_location': 'E2E-实验室',
        'temperature_env': 22.0, 'humidity_env': 45.0, 'notes': '端到端测试批次',
    }
    resp = client.post('/batches/create/', data, follow=False)
    b = CalibrationBatch.objects.filter(batch_number='E2E-BATCH-001').first()
    if not b: return False
    test_batch_pk = b.pk
    return resp.status_code == 302 and '/batches/' in resp.url
test("3.3. 创建校准批次 POST → 302跳转", test_create_batch)

test_record_pk = None
def test_create_calibration():
    global test_record_pk
    if not (test_instrument_pk and test_batch_pk): return False
    data = {
        'instrument': str(test_instrument_pk), 'batch': str(test_batch_pk),
        'test_point': '15m/s [E2E测试]',
        'before_value': 16.2, 'after_value': 15.05, 'standard_value': 15.0,
        'tolerance': 0.5, 'result': 'pass', 'is_anomaly': False,
        'anomaly_note': '', 'notes': '端到端测试校准记录',
    }
    resp = client.post('/calibrations/create/', data, follow=False)
    r = CalibrationRecord.objects.filter(test_point='15m/s [E2E测试]').first()
    if not r: return False
    test_record_pk = r.pk
    return resp.status_code == 302 and '/calibrations/' in resp.url
test("3.4. 创建校准记录 POST → 302跳转", test_create_calibration)

test_transport_pk = None
def test_create_transport():
    global test_transport_pk
    if not test_instrument_pk: return False
    s1 = Station.objects.all()[0]
    s2 = Station.objects.all()[1]
    data = {
        'instrument': str(test_instrument_pk),
        'from_station': str(s1.pk), 'to_station': str(s2.pk),
        'transport_date': '2026-06-18', 'arrival_date': '2026-06-19',
        'method': 'E2E-测试运输', 'impact_score': 2.5,
        'pre_transport_reading': 5.0, 'post_transport_reading': 5.05,
        'notes': '端到端运输测试',
    }
    resp = client.post('/transports/create/', data, follow=False)
    tr = TransportRecord.objects.filter(method='E2E-测试运输').first()
    if not tr: return False
    test_transport_pk = tr.pk
    return resp.status_code == 302 and '/transports/' in resp.url and abs(tr.reading_deviation - 0.05) < 0.001
test("3.5. 创建运输记录 POST → 302跳转(自动计算偏差)", test_create_transport)

test_certificate_pk = None
def test_create_certificate():
    global test_certificate_pk
    if not test_record_pk: return False
    data = {
        'certificate_number': 'E2E-CERT-001',
        'record': str(test_record_pk),
        'issued_date': '2026-06-18', 'expiry_date': '2027-06-18',
        'issued_by': 'E2E-测试签发机构',
        'is_valid': True, 'notes': '端到端测试证书',
    }
    resp = client.post('/certificates/create/', data, follow=False)
    c = Certificate.objects.filter(certificate_number='E2E-CERT-001').first()
    if not c: return False
    test_certificate_pk = c.pk
    return resp.status_code == 302 and '/certificates/' in resp.url
test("3.6. 创建校准证书 POST → 302跳转", test_create_certificate)

# --- 4. 所有模块 DetailView GET ---
print("\n--- DetailView GET ---")
for name, pk_var in [
    ('气象站', 'test_station_pk'),
    ('仪器', 'test_instrument_pk'),
    ('校准记录', 'test_record_pk'),
    ('批次', 'test_batch_pk'),
    ('运输记录', 'test_transport_pk'),
    ('证书', 'test_certificate_pk'),
]:
    def make_detail_test(pkv, n):
        def _t():
            pk = globals().get(pkv)
            if not pk: return False
            prefix = {
                '气象站': '/stations/', '仪器': '/instruments/',
                '校准记录': '/calibrations/', '批次': '/batches/',
                '运输记录': '/transports/', '证书': '/certificates/',
            }[n]
            resp = client.get(f'{prefix}{pk}/')
            return resp.status_code == 200
        return _t
    test(f"4.{name} 详情页 GET", make_detail_test(pk_var, name))

# --- 5. 所有模块 UpdateView GET + POST ---
print("\n--- UpdateView GET + POST ---")
def test_station_update():
    if not test_station_pk: return False
    resp = client.get(f'/stations/{test_station_pk}/edit/')
    if resp.status_code != 200: return False
    data = {
        'name': 'E2E-测试气象站-已更新', 'code': 'E2E-001',
        'altitude': 5250, 'latitude': 33.5, 'longitude': 97.2,
        'region': 'qinghai', 'status': 'maintenance',
        'established_date': '2026-01-01', 'notes': '更新过的站点',
    }
    resp = client.post(f'/stations/{test_station_pk}/edit/', data, follow=False)
    if resp.status_code != 302: return False
    s = Station.objects.get(pk=test_station_pk)
    return s.name == 'E2E-测试气象站-已更新' and s.altitude == 5250 and s.status == 'maintenance'
test("5.1. 编辑气象站 → 跳转详情页并写入DB", test_station_update)

def test_instrument_update():
    if not test_instrument_pk: return False
    resp = client.get(f'/instruments/{test_instrument_pk}/edit/')
    if resp.status_code != 200: return False
    s = Station.objects.get(pk=test_station_pk)
    data = {
        'station': str(test_station_pk), 'instrument_type': 'wind_speed',
        'model_name': 'E2E-WS-UPDATED', 'serial_number': 'E2E-SERIAL-001',
        'manufacturer': 'E2E-厂商', 'install_date': '2026-01-15',
        'status': 'needs_calibration',
        'last_calibration_date': '2026-03-01', 'next_calibration_due': '2027-06-01',
    }
    resp = client.post(f'/instruments/{test_instrument_pk}/edit/', data, follow=False)
    if resp.status_code != 302: return False
    inst = Instrument.objects.get(pk=test_instrument_pk)
    return inst.model_name == 'E2E-WS-UPDATED' and inst.status == 'needs_calibration'
test("5.2. 编辑仪器 → 跳转详情页并写入DB", test_instrument_update)

def test_transport_update():
    if not test_transport_pk: return False
    resp = client.get(f'/transports/{test_transport_pk}/edit/')
    if resp.status_code != 200: return False
    s1 = Station.objects.all()[0]; s2 = Station.objects.all()[2]
    data = {
        'instrument': str(test_instrument_pk),
        'from_station': str(s1.pk), 'to_station': str(s2.pk),
        'transport_date': '2026-06-18', 'arrival_date': '2026-06-20',
        'method': 'E2E-已更新运输', 'impact_score': 7.0,
        'pre_transport_reading': 5.0, 'post_transport_reading': 5.5,
        'notes': '更新后的运输，影响评分更大',
    }
    resp = client.post(f'/transports/{test_transport_pk}/edit/', data, follow=False)
    if resp.status_code != 302: return False
    tr = TransportRecord.objects.get(pk=test_transport_pk)
    return tr.method == 'E2E-已更新运输' and tr.impact_score == 7.0 and abs(tr.reading_deviation - 0.5) < 0.001
test("5.3. 编辑运输记录 → 跳转详情页并写入DB(自动重算偏差)", test_transport_update)

def test_certificate_update():
    if not test_certificate_pk: return False
    resp = client.get(f'/certificates/{test_certificate_pk}/edit/')
    if resp.status_code != 200: return False
    data = {
        'certificate_number': 'E2E-CERT-001',
        'record': str(test_record_pk),
        'issued_date': '2026-06-18', 'expiry_date': '2028-12-31',
        'issued_by': 'E2E-更新后的机构',
        'is_valid': False, 'notes': '证书更新，延长有效期至2028',
    }
    resp = client.post(f'/certificates/{test_certificate_pk}/edit/', data, follow=False)
    if resp.status_code != 302: return False
    c = Certificate.objects.get(pk=test_certificate_pk)
    return str(c.expiry_date) == '2028-12-31' and c.issued_by == 'E2E-更新后的机构' and c.is_valid == False
test("5.4. 编辑证书 → 跳转详情页并写入DB", test_certificate_update)

def test_calibration_update():
    if not test_record_pk: return False
    resp = client.get(f'/calibrations/{test_record_pk}/edit/')
    if resp.status_code != 200: return False
    data = {
        'instrument': str(test_instrument_pk), 'batch': str(test_batch_pk),
        'test_point': '15m/s [E2E更新]',
        'before_value': 16.0, 'after_value': 15.1, 'standard_value': 15.0,
        'tolerance': 0.5, 'result': 'conditional', 'is_anomaly': True,
        'anomaly_note': '异常：校准后偏差略大', 'notes': '端到端测试更新',
    }
    resp = client.post(f'/calibrations/{test_record_pk}/edit/', data, follow=False)
    if resp.status_code != 302: return False
    r = CalibrationRecord.objects.get(pk=test_record_pk)
    return r.result == 'conditional' and r.is_anomaly and r.anomaly_note.startswith('异常') and abs(r.deviation_after - 0.1) < 0.001
test("5.5. 编辑校准记录 → 跳转详情页并写入DB(自动重算偏差)", test_calibration_update)

# --- 6. 离线同步 endpoint ---
print("\n--- Offline Sync ---")
synced_pks = []
def test_offline_sync():
    global synced_pks
    inst = Instrument.objects.filter(instrument_type='temperature').first()
    batch = CalibrationBatch.objects.filter(is_superseded=False).first()
    payload = json.dumps({
        'records': [
            {
                'instrument_serial': inst.serial_number,
                'batch_number': batch.batch_number,
                'test_point': 'E2E-离线同步测试-0°C',
                'before_value': 0.8, 'after_value': 0.1,
                'standard_value': 0.0, 'tolerance': 0.3,
                'result': 'pass', 'notes': 'E2E离线同步样例1',
            },
            {
                'instrument_serial': inst.serial_number,
                'batch_number': batch.batch_number,
                'test_point': 'E2E-离线同步测试-20°C',
                'before_value': 20.5, 'after_value': 20.15,
                'standard_value': 20.0, 'tolerance': 0.3,
                'result': 'pass', 'notes': 'E2E离线同步样例2',
            }
        ]
    })
    before = CalibrationRecord.objects.count()
    resp = client.post('/offline-sync/', payload, content_type='application/json')
    if resp.status_code != 200: return False
    data = json.loads(resp.content)
    after = CalibrationRecord.objects.count()
    if data.get('status') != 'ok' or data.get('created') != 2: return False
    synced_pks = data.get('created_pks', [])
    return len(synced_pks) == 2 and after == before + 2
test("6. 离线同步 POST → 服务端生成2条校准记录", test_offline_sync)

# --- 7. 导出 ---
print("\n--- Export ---")
def test_calibration_csv():
    resp = client.get('/calibrations/?export=csv')
    return resp.status_code == 200 and 'text/csv' in resp['Content-Type'] and len(resp.content) > 200
test("7.1. 校准记录 CSV 导出", test_calibration_csv)

def test_calibration_json():
    resp = client.get('/calibrations/?export=json')
    return resp.status_code == 200 and 'application/json' in resp['Content-Type']
test("7.2. 校准记录 JSON 导出", test_calibration_json)

def test_summary_csv():
    resp = client.get('/export-summary/?format=csv')
    return resp.status_code == 200 and 'text/csv' in resp['Content-Type']
test("7.3. 全局摘要 CSV 导出", test_summary_csv)

def test_summary_json():
    resp = client.get('/export-summary/?format=json')
    if resp.status_code != 200 or 'application/json' not in resp['Content-Type']: return False
    data = json.loads(resp.content)
    return 'summary' in data and 'by_instrument_type' in data and 'by_result' in data
test("7.4. 全局摘要 JSON 导出(含by_instrument_type/by_result)", test_summary_json)

# --- 8. 其它列表页和功能页 ---
print("\n--- Other Pages ---")
for name, path in [
    ('站点地图', '/station-map/'),
    ('异常监控', '/anomalies/'),
    ('站点列表', '/stations/'),
    ('仪器列表', '/instruments/'),
    ('校准列表(带筛选)', '/calibrations/?result=pass&instrument_type=temperature'),
    ('批次列表', '/batches/'),
    ('运输列表', '/transports/'),
    ('证书列表', '/certificates/'),
    ('离线同步 GET (元数据)', '/offline-sync/'),
]:
    def make_test(p):
        def _t():
            resp = client.get(p)
            return resp.status_code == 200
        return _t
    test(f"8.{name} GET", make_test(path))

# --- 汇总 ---
print("\n" + "=" * 60)
ok_count = sum(1 for _, ok, _ in results if ok)
total = len(results)
print(f" 测试结果: {ok_count}/{total} 通过")
if ok_count != total:
    print("  失败项:")
    for name, ok, err in results:
        if not ok:
            print(f"    - {name} {err}")
print("=" * 60)

# 清理测试数据
Station.objects.filter(code='E2E-001').delete()
Instrument.objects.filter(serial_number='E2E-SERIAL-001').delete()
CalibrationBatch.objects.filter(batch_number='E2E-BATCH-001').delete()
CalibrationRecord.objects.filter(test_point__startswith='15m/s [E2E').delete()
CalibrationRecord.objects.filter(test_point__startswith='E2E-离线同步测试').delete()
TransportRecord.objects.filter(method__startswith='E2E-').delete()
Certificate.objects.filter(certificate_number='E2E-CERT-001').delete()
print("\nE2E测试数据已清理")

assert ok_count == total, f"有 {total - ok_count} 项测试失败"
