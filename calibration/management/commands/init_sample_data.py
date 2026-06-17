import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from calibration.models import (
    Station, Instrument, CalibrationBatch, CalibrationRecord,
    TransportRecord, Certificate
)


class Command(BaseCommand):
    help = '初始化高山气象站仪器校准日志系统样例数据'

    def handle(self, *args, **options):
        if Station.objects.exists():
            self.stdout.write(self.style.WARNING('数据已存在，跳过初始化'))
            return

        stations_data = [
            ('五道梁气象站', 'QH-001', 4612, 35.2167, 93.0667, 'qinghai', 'active', datetime.date(2008, 6, 15)),
            ('沱沱河气象站', 'QH-002', 4533, 34.2167, 92.4333, 'qinghai', 'active', datetime.date(2007, 3, 20)),
            ('安多气象站', 'XZ-001', 4800, 32.2667, 91.6833, 'tibet', 'active', datetime.date(2009, 5, 10)),
            ('那曲气象站', 'XZ-002', 4507, 31.4833, 92.0667, 'tibet', 'active', datetime.date(2006, 8, 22)),
            ('理塘气象站', 'SC-001', 3949, 30.0000, 100.2833, 'sichuan', 'active', datetime.date(2010, 4, 12)),
            ('稻城气象站', 'SC-002', 3728, 29.0500, 100.3000, 'sichuan', 'maintenance', datetime.date(2011, 7, 8)),
            ('德钦气象站', 'YN-001', 3315, 28.4833, 98.9167, 'yunnan', 'active', datetime.date(2012, 1, 15)),
            ('玛多气象站', 'QH-003', 4272, 34.9167, 98.2167, 'qinghai', 'active', datetime.date(2005, 9, 3)),
            ('乌恰气象站', 'XJ-001', 2137, 39.7167, 75.2500, 'xinjiang', 'active', datetime.date(2013, 11, 20)),
            ('合作气象站', 'GS-001', 2916, 35.0000, 102.9167, 'gansu', 'offline', datetime.date(2004, 2, 28)),
        ]

        stations = []
        for name, code, alt, lat, lng, region, status, est in stations_data:
            s = Station.objects.create(
                name=name, code=code, altitude=alt, latitude=lat, longitude=lng,
                region=region, status=status, established_date=est,
                notes=f'{name}位于海拔{alt}m的高原地区'
            )
            stations.append(s)

        self.stdout.write(f'创建 {len(stations)} 个气象站')

        instruments_data = [
            (stations[0], 'temperature', 'PT100-A', 'TEMP-QH001-001', '希玛', '2020-03-15', 'normal', '2025-12-01', '2026-12-01'),
            (stations[0], 'humidity', 'HC2-S3', 'HUM-QH001-001', '罗卓尼克', '2020-03-15', 'normal', '2025-11-20', '2026-11-20'),
            (stations[0], 'wind_speed', 'WS-500', 'WSP-QH001-001', 'VAISALA', '2020-03-15', 'needs_calibration', '2025-06-01', '2026-06-01'),
            (stations[1], 'temperature', 'PT100-A', 'TEMP-QH002-001', '希玛', '2019-07-20', 'normal', '2025-10-15', '2026-10-15'),
            (stations[1], 'humidity', 'HC2-S3', 'HUM-QH002-001', '罗卓尼克', '2019-07-20', 'normal', '2025-09-10', '2026-09-10'),
            (stations[1], 'wind_direction', 'WD-520', 'WDR-QH002-001', 'VAISALA', '2019-07-20', 'faulty', '2024-03-01', '2025-03-01'),
            (stations[2], 'temperature', 'PT100-B', 'TEMP-XZ001-001', '希玛', '2021-01-10', 'normal', '2025-12-20', '2026-12-20'),
            (stations[2], 'wind_speed', 'WS-500', 'WSP-XZ001-001', 'VAISALA', '2021-01-10', 'normal', '2025-08-15', '2026-08-15'),
            (stations[2], 'barometer', 'PTB330', 'BAR-XZ001-001', 'VAISALA', '2021-01-10', 'normal', '2025-12-01', '2026-12-01'),
            (stations[3], 'temperature', 'PT100-A', 'TEMP-XZ002-001', '希玛', '2018-05-05', 'needs_calibration', '2024-06-01', '2025-06-01'),
            (stations[3], 'humidity', 'HC2-S3', 'HUM-XZ002-001', '罗卓尼克', '2018-05-05', 'normal', '2025-11-10', '2026-11-10'),
            (stations[4], 'temperature', 'PT100-B', 'TEMP-SC001-001', '希玛', '2022-04-20', 'normal', '2026-01-15', '2027-01-15'),
            (stations[4], 'wind_speed', 'WS-500', 'WSP-SC001-001', 'VAISALA', '2022-04-20', 'normal', '2026-02-01', '2027-02-01'),
            (stations[5], 'temperature', 'PT100-A', 'TEMP-SC002-001', '希玛', '2019-09-15', 'calibrating', '2025-05-20', '2026-05-20'),
            (stations[6], 'rain_gauge', 'RG-200', 'RAI-YN001-001', '天津气象仪器', '2020-12-01', 'normal', '2025-10-01', '2026-10-01'),
            (stations[6], 'wind_direction', 'WD-520', 'WDR-YN001-001', 'VAISALA', '2020-12-01', 'normal', '2025-09-15', '2026-09-15'),
            (stations[7], 'temperature', 'PT100-B', 'TEMP-QH003-001', '希玛', '2021-06-10', 'normal', '2025-12-01', '2026-12-01'),
            (stations[8], 'barometer', 'PTB330', 'BAR-XJ001-001', 'VAISALA', '2023-02-15', 'normal', '2026-03-01', '2027-03-01'),
            (stations[9], 'temperature', 'PT100-A', 'TEMP-GS001-001', '希玛', '2017-11-20', 'faulty', '2024-01-01', '2025-01-01'),
        ]

        instruments = []
        for station, itype, model, serial, mfg, install, status, last_cal, next_cal in instruments_data:
            i = Instrument.objects.create(
                station=station, instrument_type=itype, model_name=model,
                serial_number=serial, manufacturer=mfg,
                install_date=datetime.date.fromisoformat(install),
                status=status,
                last_calibration_date=datetime.date.fromisoformat(last_cal),
                next_calibration_due=datetime.date.fromisoformat(next_cal),
            )
            instruments.append(i)

        self.stdout.write(f'创建 {len(instruments)} 个仪器')

        batches_data = [
            ('CAL-2025-A001', '2025-12-15', '张伟', '西宁校准实验室', 22.5, 45.0, '年度例行校准', 1, False),
            ('CAL-2025-A001', '2025-12-15', '张伟', '西宁校准实验室', 22.5, 45.0, '修正: 温度仪标准值更新', 2, False),
            ('CAL-2025-B002', '2025-11-20', '李芳', '成都校准中心', 20.0, 50.0, '批次校准含异常', 1, False),
            ('CAL-2025-C003', '2025-10-08', '王强', '拉萨计量站', 18.5, 35.0, '风仪专项校准', 1, True),
            ('CAL-2026-D001', '2026-01-10', '张伟', '西宁校准实验室', 21.0, 42.0, '新年度首批校准', 1, False),
        ]

        batches = []
        for bn, date, op, lab, temp, hum, notes, ver, sup in batches_data:
            b = CalibrationBatch.objects.create(
                batch_number=bn,
                calibration_date=datetime.date.fromisoformat(date),
                operator=op, lab_location=lab,
                temperature_env=temp, humidity_env=hum,
                notes=notes, version=ver, is_superseded=sup,
            )
            batches.append(b)

        self.stdout.write(f'创建 {len(batches)} 个校准批次')

        records_data = [
            (instruments[0], batches[0], '-30°C', -30.35, -30.02, -30.0, 0.5, 'pass', False, ''),
            (instruments[0], batches[0], '0°C', 0.12, 0.01, 0.0, 0.2, 'pass', False, ''),
            (instruments[0], batches[0], '30°C', 30.28, 30.05, 30.0, 0.3, 'pass', False, ''),
            (instruments[0], batches[1], '-30°C', -30.40, -30.01, -30.0, 0.5, 'pass', False, '版本2修正标准值'),
            (instruments[1], batches[0], '20%RH', 20.8, 20.1, 20.0, 2.0, 'pass', False, ''),
            (instruments[1], batches[0], '50%RH', 50.5, 50.2, 50.0, 2.0, 'pass', False, ''),
            (instruments[1], batches[0], '80%RH', 81.3, 80.4, 80.0, 2.0, 'pass', False, ''),
            (instruments[2], batches[2], '5m/s', 5.8, 5.1, 5.0, 0.5, 'pass', False, ''),
            (instruments[2], batches[2], '15m/s', 16.2, 15.3, 15.0, 0.5, 'conditional', False, '偏差略大但在允许范围内'),
            (instruments[2], batches[2], '30m/s', 33.1, 30.8, 30.0, 0.5, 'fail', True, '校准后偏差0.8超过允许误差0.5'),
            (instruments[3], batches[2], '-20°C', -20.55, -20.05, -20.0, 0.5, 'pass', False, ''),
            (instruments[3], batches[2], '0°C', 0.18, 0.03, 0.0, 0.2, 'pass', False, ''),
            (instruments[5], batches[3], '0°', 2.5, 1.2, 0.0, 5.0, 'conditional', False, '风向仪偏差较大'),
            (instruments[5], batches[3], '90°', 92.1, 90.8, 90.0, 5.0, 'pass', False, ''),
            (instruments[5], batches[3], '180°', 183.5, 181.2, 180.0, 5.0, 'conditional', False, ''),
            (instruments[5], batches[3], '270°', 275.0, 272.3, 270.0, 5.0, 'fail', True, '风向偏差5°超过允许范围'),
            (instruments[6], batches[4], '-40°C', -40.8, -40.1, -40.0, 0.5, 'pass', False, ''),
            (instruments[6], batches[4], '0°C', -0.05, 0.02, 0.0, 0.2, 'pass', False, ''),
            (instruments[6], batches[4], '40°C', 40.35, 40.08, 40.0, 0.3, 'pass', False, ''),
            (instruments[8], batches[4], '500hPa', 499.2, 500.1, 500.0, 0.5, 'pass', False, ''),
            (instruments[9], batches[2], '-30°C', -31.2, -30.5, -30.0, 0.5, 'fail', True, '超期仪器偏差显著'),
            (instruments[9], batches[2], '0°C', -0.8, -0.3, 0.0, 0.2, 'fail', True, '超期仪器偏差显著'),
            (instruments[12], batches[4], '-20°C', -20.15, -20.02, -20.0, 0.3, 'pass', False, ''),
            (instruments[12], batches[4], '20°C', 20.10, 20.03, 20.0, 0.3, 'pass', False, ''),
            (instruments[15], batches[2], '0mm/h', 0.3, 0.1, 0.0, 0.5, 'pass', False, ''),
            (instruments[15], batches[2], '10mm/h', 10.8, 10.2, 10.0, 1.0, 'pass', False, ''),
        ]

        records = []
        for inst, batch, tp, before, after, std, tol, result, anomaly, anote in records_data:
            r = CalibrationRecord.objects.create(
                instrument=inst, batch=batch, test_point=tp,
                before_value=before, after_value=after,
                standard_value=std, tolerance=tol,
                result=result, is_anomaly=anomaly, anomaly_note=anote,
            )
            records.append(r)

        self.stdout.write(f'创建 {len(records)} 条校准记录')

        transports_data = [
            (instruments[2], stations[0], stations[1], '2025-11-01', '2025-11-03', '越野车', 2.5, 5.1, 5.2),
            (instruments[5], stations[1], stations[2], '2025-10-10', '2025-10-14', '卡车+人工搬运', 7.8, 92.0, 93.5),
            (instruments[9], stations[3], stations[4], '2025-09-15', '2025-09-18', '厢式货车', 3.2, -20.5, -20.8),
            (instruments[13], stations[4], stations[5], '2025-08-20', '2025-08-22', '皮卡', 4.1, 15.3, 15.0),
            (instruments[18], stations[9], stations[7], '2025-07-10', '2025-07-15', '长途运输', 6.3, 18.5, 19.2),
        ]

        transports = []
        for inst, from_s, to_s, tdate, adate, method, impact, pre, post in transports_data:
            t = TransportRecord.objects.create(
                instrument=inst, from_station=from_s, to_station=to_s,
                transport_date=datetime.date.fromisoformat(tdate),
                arrival_date=datetime.date.fromisoformat(adate),
                method=method, impact_score=impact,
                pre_transport_reading=pre, post_transport_reading=post,
                notes=f'{method}运输，影响评分{impact}'
            )
            transports.append(t)

        self.stdout.write(f'创建 {len(transports)} 条运输记录')

        certs_data = [
            (records[0], 'CERT-2025-001', '2025-12-16', '2026-12-16', '青海省计量检定测试院', True),
            (records[1], 'CERT-2025-002', '2025-12-16', '2026-12-16', '青海省计量检定测试院', True),
            (records[4], 'CERT-2025-003', '2025-12-16', '2026-12-16', '青海省计量检定测试院', True),
            (records[7], 'CERT-2025-004', '2025-11-21', '2026-11-21', '四川省计量检定院', True),
            (records[11], 'CERT-2025-005', '2025-10-09', '2026-10-09', '西藏自治区计量测试所', True),
            (records[12], 'CERT-2025-006', '2025-10-09', '2026-10-09', '西藏自治区计量测试所', True),
            (records[15], 'CERT-2025-007', '2025-10-09', '2025-10-09', '西藏自治区计量测试所', True),
            (records[16], 'CERT-2026-001', '2026-01-11', '2027-01-11', '青海省计量检定测试院', True),
            (records[19], 'CERT-2026-002', '2026-01-11', '2027-01-11', '青海省计量检定测试院', True),
        ]

        certs = []
        for rec, cnum, idate, edate, issued_by, valid in certs_data:
            c = Certificate.objects.create(
                record=rec, certificate_number=cnum,
                issued_date=datetime.date.fromisoformat(idate),
                expiry_date=datetime.date.fromisoformat(edate),
                issued_by=issued_by, is_valid=valid,
            )
            certs.append(c)

        self.stdout.write(f'创建 {len(certs)} 份校准证书')

        self.stdout.write(self.style.SUCCESS('✅ 样例数据初始化完成'))
        self.stdout.write(f'  气象站: {len(stations)}')
        self.stdout.write(f'  仪器: {len(instruments)}')
        self.stdout.write(f'  校准批次: {len(batches)}')
        self.stdout.write(f'  校准记录: {len(records)}')
        self.stdout.write(f'  运输记录: {len(transports)}')
        self.stdout.write(f'  校准证书: {len(certs)}')
