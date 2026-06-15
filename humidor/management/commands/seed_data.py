from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from humidor.models import (
    CigarTag,
    HumidorCabinet,
    CabinetRecord,
    HumidityDetail,
    CigarPosition,
    RotationResult,
    AlertReminder,
)


class Command(BaseCommand):
    help = '加载雪茄养护柜种子数据'

    def handle(self, *args, **options):
        self.stdout.write('开始加载种子数据...')

        self._create_tags()
        self._create_cabinets()
        self._create_sample_1_normal()
        self._create_sample_2_position_anomaly()
        self._create_sample_3_alert_rollback()

        self.stdout.write(self.style.SUCCESS('种子数据加载完成！'))

    def _create_tags(self):
        tags_data = [
            {'name': '古巴原产', 'color': '#e74c3c', 'description': '古巴原产地雪茄'},
            {'name': '陈年珍品', 'color': '#f39c12', 'description': '存放超过5年的珍品雪茄'},
            {'name': '待品吸', 'color': '#3498db', 'description': '准备品吸的雪茄'},
            {'name': '养护中', 'color': '#2ecc71', 'description': '正常养护中的雪茄'},
            {'name': '重点观察', 'color': '#9b59b6', 'description': '需要重点观察状态的雪茄'},
        ]
        for tag_data in tags_data:
            CigarTag.objects.get_or_create(name=tag_data['name'], defaults=tag_data)
        self.stdout.write('标签数据已加载')

    def _create_cabinets(self):
        cabinets_data = [
            {
                'name': '主养护柜A',
                'cabinet_code': 'CAB-A-001',
                'layers': 5,
                'slots_per_layer': 8,
                'status': 'normal',
                'target_temp_min': 18.0,
                'target_temp_max': 22.0,
                'target_humidity_min': 65.0,
                'target_humidity_max': 75.0,
            },
            {
                'name': '珍品柜B',
                'cabinet_code': 'CAB-B-002',
                'layers': 4,
                'slots_per_layer': 6,
                'status': 'warning',
                'target_temp_min': 19.0,
                'target_temp_max': 21.0,
                'target_humidity_min': 68.0,
                'target_humidity_max': 72.0,
            },
        ]
        for cab_data in cabinets_data:
            HumidorCabinet.objects.get_or_create(
                cabinet_code=cab_data['cabinet_code'],
                defaults=cab_data
            )
        self.stdout.write('养护柜数据已加载')

    def _create_sample_1_normal(self):
        cabinet = HumidorCabinet.objects.get(cabinet_code='CAB-A-001')
        record_date = timezone.localdate() - timedelta(days=3)

        record = CabinetRecord.objects.create(
            cabinet=cabinet,
            batch_no='BATCH-2024-001',
            version=2,
            collector='张先生',
            cabinet_layer=3,
            record_date=record_date,
            status='completed',
            tasting_notes='本次品吸的高希霸鱼雷口感醇厚，前段有明显的豆香和雪松味，中段出现咖啡和巧克力的层次感，后段绵长持久，余味带有淡淡的花香。整体燃烧均匀，抽吸顺畅，是一款值得长期养护的经典雪茄。养护环境稳定对风味的提升有明显帮助。',
            remarks='该批次为2024年首批轮换，整体养护状态良好，温湿度波动在可控范围内。',
        )

        tag_cuba = CigarTag.objects.get(name='古巴原产')
        tag_aged = CigarTag.objects.get(name='陈年珍品')
        tag_curing = CigarTag.objects.get(name='养护中')
        record.tags.add(tag_cuba, tag_aged, tag_curing)

        base_time = timezone.now() - timedelta(days=3)
        for i in range(24):
            measure_time = base_time + timedelta(hours=i)
            temp = 20.0 + 0.5 * (i % 4) - 0.25 * (i % 6)
            humidity = 70.0 + 1.5 * (i % 3) - 0.8 * (i % 5)
            HumidityDetail.objects.create(
                record=record,
                temperature=round(temp, 1),
                humidity=round(humidity, 1),
                measure_time=measure_time,
                sensor_position=f'第3层传感器',
            )

        cigars = [
            {'name': '高希霸 鱼雷', 'code': 'COH-T-001'},
            {'name': '高希霸 鱼雷', 'code': 'COH-T-002'},
            {'name': '高希霸 鱼雷', 'code': 'COH-T-003'},
            {'name': '蒙特 2号', 'code': 'MON-2-001'},
            {'name': '蒙特 2号', 'code': 'MON-2-002'},
            {'name': '帕特加斯 D4', 'code': 'PAR-D4-001'},
        ]

        for idx, cigar in enumerate(cigars):
            slot = idx + 1
            CigarPosition.objects.create(
                record=record,
                cigar_name=cigar['name'],
                cigar_code=cigar['code'],
                from_layer=2,
                from_slot=slot + 2,
                to_layer=3,
                to_slot=slot,
                position_type='rotated',
                operation_time=base_time + timedelta(minutes=10 * idx),
                operator='张先生',
            )

        RotationResult.objects.create(
            record=record,
            rotation_date=record_date,
            result='normal',
            cigar_count=6,
            duration_minutes=45,
            executor='张先生',
            summary='本次轮换顺利完成，6支雪茄从第2层轮换至第3层。温湿度在整个轮换过程中保持稳定，未出现异常波动。雪茄外观状态良好，无发霉、干裂等问题。',
            export_version='v2.0-export',
        )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record,
            reminder_type='system',
            severity='info',
            status='resolved',
            title='轮换任务已完成',
            content=f'批次 BATCH-2024-001 轮换已完成，共轮换6支雪茄，耗时45分钟。',
        )

        self.stdout.write('样本1(正常完成)已加载')

    def _create_sample_2_position_anomaly(self):
        cabinet = HumidorCabinet.objects.get(cabinet_code='CAB-B-002')
        record_date = timezone.localdate() - timedelta(days=1)

        record = CabinetRecord.objects.create(
            cabinet=cabinet,
            batch_no='BATCH-2024-002',
            version=1,
            collector='李女士',
            cabinet_layer=2,
            record_date=record_date,
            status='exception',
            tasting_notes='',
            remarks='柜位图检查时发现位置异常，需要重新核查雪茄摆放情况。部分雪茄可能存在重叠放置问题。',
        )

        tag_cuba = CigarTag.objects.get(name='古巴原产')
        tag_watch = CigarTag.objects.get(name='重点观察')
        record.tags.add(tag_cuba, tag_watch)

        base_time = timezone.now() - timedelta(days=1)
        for i in range(12):
            measure_time = base_time + timedelta(hours=i * 2)
            temp = 20.5 + 0.3 * (i % 3)
            humidity = 69.0 + 1.0 * (i % 4)
            HumidityDetail.objects.create(
                record=record,
                temperature=round(temp, 1),
                humidity=round(humidity, 1),
                measure_time=measure_time,
                sensor_position=f'第2层传感器',
            )

        cigars = [
            {'name': '特立尼达 雷耶斯', 'code': 'TRI-R-001', 'slot': 1},
            {'name': '特立尼达 雷耶斯', 'code': 'TRI-R-002', 'slot': 2},
            {'name': '玻利瓦尔 皇家科罗娜', 'code': 'BOL-RC-001', 'slot': 4},
            {'name': '玻利瓦尔 皇家科罗娜', 'code': 'BOL-RC-002', 'slot': 5},
            {'name': '乌普曼 玛瑙46', 'code': 'HUP-M46-001', 'slot': 3},
            {'name': '乌普曼 玛瑙46', 'code': 'HUP-M46-002', 'slot': 3},
        ]

        for idx, cigar in enumerate(cigars):
            CigarPosition.objects.create(
                record=record,
                cigar_name=cigar['name'],
                cigar_code=cigar['code'],
                from_layer=1,
                from_slot=idx + 1,
                to_layer=2,
                to_slot=cigar['slot'],
                position_type='placed',
                operation_time=base_time + timedelta(minutes=5 * idx),
                operator='李女士',
            )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record,
            reminder_type='position_anomaly',
            severity='warning',
            status='unread',
            title='柜位图位置异常 - 格位重叠',
            content=f'批次 {record.batch_no} 在第2层第3格检测到2支雪茄（HUP-M46-001 和 HUP-M46-002）放置在同一格位，请核实摆放情况并及时调整。重叠放置可能影响雪茄养护效果和通风。',
        )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record,
            reminder_type='position_anomaly',
            severity='info',
            status='read',
            title='柜位图空缺提示',
            content=f'批次 {record.batch_no} 在第2层第6格为空位，建议合理安排空间利用或补充雪茄。',
        )

        self.stdout.write('样本2(柜位图异常)已加载')

    def _create_sample_3_alert_rollback(self):
        cabinet = HumidorCabinet.objects.get(cabinet_code='CAB-A-001')
        record_date = timezone.localdate()

        record_v1 = CabinetRecord.objects.create(
            cabinet=cabinet,
            batch_no='BATCH-2024-003',
            version=1,
            collector='王先生',
            cabinet_layer=4,
            record_date=record_date - timedelta(days=1),
            status='rolled_back',
            tasting_notes='',
            remarks='版本1因湿度超标已回滚，需要重新计算轮换方案。原始数据保留用于对比分析。',
        )

        tag_cuba = CigarTag.objects.get(name='古巴原产')
        tag_watch = CigarTag.objects.get(name='重点观察')
        tag_pending = CigarTag.objects.get(name='待品吸')
        record_v1.tags.add(tag_cuba, tag_watch)

        base_time_v1 = timezone.now() - timedelta(days=1, hours=12)
        alert_times = [2, 3, 4, 5, 6, 7]
        for i in range(12):
            measure_time = base_time_v1 + timedelta(hours=i)
            if i in alert_times:
                temp = 23.5 + 0.2 * (i % 2)
                humidity = 78.0 + 1.5 * (i % 3)
            else:
                temp = 21.0 + 0.3 * (i % 3)
                humidity = 72.0 + 1.0 * (i % 4)

            HumidityDetail.objects.create(
                record=record_v1,
                temperature=round(temp, 1),
                humidity=round(humidity, 1),
                measure_time=measure_time,
                sensor_position=f'第4层传感器',
            )

        cigars_v1 = [
            {'name': '罗密欧 朱丽叶 2号', 'code': 'R&J-2-001', 'from_slot': 1, 'to_slot': 3},
            {'name': '罗密欧 朱丽叶 2号', 'code': 'R&J-2-002', 'from_slot': 2, 'to_slot': 4},
            {'name': '好友 里约 赛拉纳', 'code': 'HDRS-S-001', 'from_slot': 3, 'to_slot': 1},
            {'name': '好友 里约 赛拉纳', 'code': 'HDRS-S-002', 'from_slot': 4, 'to_slot': 2},
            {'name': '埃尔雷 德尔蒙多 特选', 'code': 'HRM-S-001', 'from_slot': 5, 'to_slot': 5},
        ]

        for idx, cigar in enumerate(cigars_v1):
            CigarPosition.objects.create(
                record=record_v1,
                cigar_name=cigar['name'],
                cigar_code=cigar['code'],
                from_layer=4,
                from_slot=cigar['from_slot'],
                to_layer=4,
                to_slot=cigar['to_slot'],
                position_type='rotated',
                operation_time=base_time_v1 + timedelta(minutes=5 * idx),
                operator='王先生',
            )

        RotationResult.objects.create(
            record=record_v1,
            rotation_date=record_date - timedelta(days=1),
            result='rolled_back',
            cigar_count=5,
            duration_minutes=30,
            executor='王先生',
            summary='版本1因连续6小时湿度超标（最高达80.5%）已执行回滚操作。雪茄已移回原位置，等待环境稳定后重新安排轮换。建议检查加湿系统并校准传感器。',
            export_version='v1.0-rolledback',
        )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record_v1,
            reminder_type='humidity',
            severity='danger',
            status='resolved',
            title='湿度严重超标告警',
            content=f'批次 BATCH-2024-003 第4层连续6小时湿度超过阈值上限(75%)，最高达80.5%，已触发自动回滚机制。请检查加湿系统是否故障。',
            resolved_at=timezone.now() - timedelta(days=1),
        )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record_v1,
            reminder_type='temperature',
            severity='warning',
            status='resolved',
            title='温度偏高警告',
            content=f'批次 BATCH-2024-003 第4层温度达到23.9°C，超过目标上限(22°C)，伴随湿度异常，怀疑设备故障。',
            resolved_at=timezone.now() - timedelta(days=1),
        )

        record_v2 = CabinetRecord.objects.create(
            cabinet=cabinet,
            batch_no='BATCH-2024-003',
            version=2,
            collector='王先生',
            cabinet_layer=4,
            record_date=record_date,
            status='in_progress',
            tasting_notes='',
            remarks='版本2为回滚后重算版本，调整了轮换时间和摆放位置，避开温湿度波动高峰时段。',
        )
        record_v2.tags.add(tag_cuba, tag_watch, tag_pending)

        base_time_v2 = timezone.now() - timedelta(hours=6)
        for i in range(8):
            measure_time = base_time_v2 + timedelta(hours=i)
            temp = 20.0 + 0.2 * (i % 3)
            humidity = 70.5 + 0.8 * (i % 4)
            HumidityDetail.objects.create(
                record=record_v2,
                temperature=round(temp, 1),
                humidity=round(humidity, 1),
                measure_time=measure_time,
                sensor_position=f'第4层传感器',
            )

        cigars_v2 = [
            {'name': '罗密欧 朱丽叶 2号', 'code': 'R&J-2-001', 'slot': 1},
            {'name': '罗密欧 朱丽叶 2号', 'code': 'R&J-2-002', 'slot': 2},
            {'name': '好友 里约 赛拉纳', 'code': 'HDRS-S-001', 'slot': 4},
            {'name': '好友 里约 赛拉纳', 'code': 'HDRS-S-002', 'slot': 5},
            {'name': '埃尔雷 德尔蒙多 特选', 'code': 'HRM-S-001', 'slot': 7},
        ]

        for idx, cigar in enumerate(cigars_v2):
            CigarPosition.objects.create(
                record=record_v2,
                cigar_name=cigar['name'],
                cigar_code=cigar['code'],
                from_layer=4,
                from_slot=idx + 1,
                to_layer=4,
                to_slot=cigar['slot'],
                position_type='moved',
                operation_time=base_time_v2 + timedelta(minutes=8 * idx),
                operator='王先生',
            )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record_v2,
            reminder_type='system',
            severity='info',
            status='unread',
            title='重算版本已创建',
            content=f'批次 BATCH-2024-003 版本2已创建，基于版本1回滚数据重新计算轮换方案。温湿度阈值已临时调整为更保守的范围，待环境稳定后恢复标准阈值。',
        )

        AlertReminder.objects.create(
            cabinet=cabinet,
            record=record_v2,
            reminder_type='rotation_due',
            severity='warning',
            status='unread',
            title='轮换到期提醒',
            content=f'批次 BATCH-2024-003 雪茄将于7天后达到建议轮换周期，请提前做好轮换准备。建议选择温湿度稳定的时段进行操作。',
        )

        self.stdout.write('样本3(报警阈值回滚重算)已加载')
