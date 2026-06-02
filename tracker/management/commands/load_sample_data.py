from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from tracker.models import (
    CleaningRecord,
    ClinicalUsage,
    ExpiryRecall,
    InfectionInspection,
    InstrumentPackage,
    ReleaseAudit,
    SterilizationBatch,
)


class Command(BaseCommand):
    help = '加载示例数据到数据库'

    def handle(self, *args, **options):
        self.stdout.write('开始加载示例数据...')

        InstrumentPackage.objects.all().delete()
        SterilizationBatch.objects.all().delete()

        now = timezone.now()

        instruments_data = [
            {
                'code': 'QP-2024-001', 'name': '拔牙手术包', 'category': 'surgical',
                'contents': '拔牙钳\n牙挺\n牙龈分离器\n刮匙\n缝合器械',
                'clinic': '口腔外科诊室', 'status': 'registered',
                'last_sterilized_at': now - timedelta(days=5),
                'expire_at': now + timedelta(days=175),
            },
            {
                'code': 'QP-2024-002', 'name': '根管治疗包', 'category': 'treatment',
                'contents': '根管锉\n扩大针\n根管充填器\n拔髓针\n冲洗器',
                'clinic': '牙体牙髓诊室', 'status': 'in_use',
                'last_sterilized_at': now - timedelta(days=2),
                'expire_at': now + timedelta(days=178),
            },
            {
                'code': 'QP-2024-003', 'name': '修复印模包', 'category': 'examination',
                'contents': '印模托盘\n调拌刀\n橡皮碗\n义齿试戴器',
                'clinic': '修复科诊室', 'status': 'cleaning',
                'last_sterilized_at': now - timedelta(days=10),
                'expire_at': now + timedelta(days=170),
            },
            {
                'code': 'QP-2024-004', 'name': '种植手术包', 'category': 'surgical',
                'contents': '种植机头\n种植窝预备器\n覆盖螺丝\n愈合基台\n种植体植入器',
                'clinic': '种植科诊室', 'status': 'sterilizing',
                'last_sterilized_at': now - timedelta(days=1),
                'expire_at': now + timedelta(days=179),
            },
            {
                'code': 'QP-2024-005', 'name': '正畸粘接包', 'category': 'treatment',
                'contents': '托槽定位器\n粘接剂\n酸蚀剂\n光固化灯头\n持针器',
                'clinic': '正畸科诊室', 'status': 'pending_release',
                'last_sterilized_at': now - timedelta(hours=6),
                'expire_at': now + timedelta(days=180),
            },
            {
                'code': 'QP-2024-006', 'name': '牙周治疗包', 'category': 'treatment',
                'contents': '牙周探针\n龈下刮治器\n超声洁治头\n牙周手术刀',
                'clinic': '牙周科诊室', 'status': 'expired',
                'last_sterilized_at': now - timedelta(days=200),
                'expire_at': now - timedelta(days=20),
            },
            {
                'code': 'QP-2024-007', 'name': '儿童齿科包', 'category': 'treatment',
                'contents': '儿童开口器\n乳牙拔除钳\n窝沟封闭器\n不锈钢冠修整器',
                'clinic': '儿童口腔诊室', 'status': 'recalled',
                'last_sterilized_at': now - timedelta(days=30),
                'expire_at': now - timedelta(days=5),
            },
            {
                'code': 'QP-2024-008', 'name': '口腔检查包', 'category': 'examination',
                'contents': '口镜\n探针\n镊子\n棉卷 holder',
                'clinic': '综合诊室', 'status': 'registered',
                'last_sterilized_at': now - timedelta(days=3),
                'expire_at': now + timedelta(days=177),
            },
        ]

        instruments = []
        for data in instruments_data:
            pkg = InstrumentPackage.objects.create(**data)
            instruments.append(pkg)
            self.stdout.write(f'  创建器械包: {pkg.code} - {pkg.name} [{pkg.get_status_display()}]')

        batch1 = SterilizationBatch.objects.create(
            batch_number='SM-2024-001',
            method='high_pressure_steam',
            operator='张护士',
            started_at=now - timedelta(hours=8),
            completed_at=now - timedelta(hours=7),
            temperature=134.0,
            pressure=205.0,
            duration_minutes=30,
            result='qualified',
            physical_test='qualified',
            chemical_test='qualified',
            biological_test='qualified',
        )
        batch1.instrument_packages.add(instruments[0], instruments[7])

        batch2 = SterilizationBatch.objects.create(
            batch_number='SM-2024-002',
            method='low_temp_plasma',
            operator='李护士',
            started_at=now - timedelta(hours=4),
            completed_at=now - timedelta(hours=3),
            temperature=50.0,
            pressure=80.0,
            duration_minutes=45,
            result='qualified',
            physical_test='qualified',
            chemical_test='qualified',
            biological_test='pending',
        )
        batch2.instrument_packages.add(instruments[4])

        batch3 = SterilizationBatch.objects.create(
            batch_number='SM-2024-003',
            method='high_pressure_steam',
            operator='张护士',
            started_at=now - timedelta(hours=2),
            completed_at=None,
            temperature=134.0,
            pressure=205.0,
            duration_minutes=None,
            result='pending',
            physical_test='pending',
            chemical_test='pending',
            biological_test='pending',
        )
        batch3.instrument_packages.add(instruments[3])

        self.stdout.write(f'  创建灭菌批次: {batch1.batch_number}, {batch2.batch_number}, {batch3.batch_number}')

        CleaningRecord.objects.create(
            instrument_package=instruments[2],
            method='ultrasonic',
            cleaning_agent='多酶清洗剂',
            cleaner='王护士',
            started_at=now - timedelta(hours=5),
            completed_at=now - timedelta(hours=4),
            result='qualified',
        )
        CleaningRecord.objects.create(
            instrument_package=instruments[0],
            method='mechanical',
            cleaning_agent='碱性清洗剂',
            cleaner='张护士',
            started_at=now - timedelta(days=5),
            completed_at=now - timedelta(days=5, hours=-1),
            result='qualified',
        )

        ReleaseAudit.objects.create(
            instrument_package=instruments[0],
            batch=batch1,
            auditor='陈主管',
            packaging_intact=True,
            indicator_changed=True,
            label_clear=True,
            seal_intact=True,
            audit_result='approved',
            audited_at=now - timedelta(days=5),
        )
        ReleaseAudit.objects.create(
            instrument_package=instruments[4],
            batch=batch2,
            auditor='陈主管',
            packaging_intact=True,
            indicator_changed=True,
            label_clear=True,
            seal_intact=True,
            audit_result='approved',
            audited_at=now - timedelta(hours=5),
        )

        ClinicalUsage.objects.create(
            instrument_package=instruments[1],
            patient_id='P-20240601',
            patient_name='张三',
            doctor='李医生',
            clinic='牙体牙髓诊室',
            procedure='根管治疗',
            used_at=now - timedelta(days=2),
            returned_at=None,
        )
        ClinicalUsage.objects.create(
            instrument_package=instruments[0],
            patient_id='P-20240602',
            patient_name='李四',
            doctor='王医生',
            clinic='口腔外科诊室',
            procedure='智齿拔除',
            used_at=now - timedelta(days=10),
            returned_at=now - timedelta(days=10, hours=-2),
        )

        ExpiryRecall.objects.create(
            instrument_package=instruments[6],
            reason='expired',
            initiator='陈主管',
            initiated_at=now - timedelta(days=5),
            status='recalled',
            handler='张护士',
            handled_at=now - timedelta(days=4),
        )
        ExpiryRecall.objects.create(
            instrument_package=instruments[5],
            reason='expired',
            initiator='赵院长',
            initiated_at=now - timedelta(hours=1),
            status='pending',
        )

        InfectionInspection.objects.create(
            instrument_package=instruments[0],
            batch=batch1,
            inspection_type='instrument',
            inspector='赵院长',
            inspected_at=now - timedelta(days=3),
            result='qualified',
        )
        InfectionInspection.objects.create(
            batch=batch1,
            inspection_type='batch',
            inspector='赵院长',
            inspected_at=now - timedelta(days=3),
            result='qualified',
        )
        InfectionInspection.objects.create(
            inspection_type='environment',
            inspector='赵院长',
            inspected_at=now - timedelta(days=1),
            result='unqualified',
            findings='消毒供应中心空气菌落数超标',
            corrective_action='加强通风换气，增加紫外线消毒频次，3天后复测',
        )

        self.stdout.write(self.style.SUCCESS('示例数据加载完成！'))
        self.stdout.write(f'  器械包: {InstrumentPackage.objects.count()} 条')
        self.stdout.write(f'  灭菌批次: {SterilizationBatch.objects.count()} 条')
        self.stdout.write(f'  清洗记录: {CleaningRecord.objects.count()} 条')
        self.stdout.write(f'  放行审核: {ReleaseAudit.objects.count()} 条')
        self.stdout.write(f'  诊疗使用: {ClinicalUsage.objects.count()} 条')
        self.stdout.write(f'  过期召回: {ExpiryRecall.objects.count()} 条')
        self.stdout.write(f'  院感抽查: {InfectionInspection.objects.count()} 条')
