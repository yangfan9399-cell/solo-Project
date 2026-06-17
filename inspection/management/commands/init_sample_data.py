from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import date, timedelta, datetime
import random
from inspection.models import CrystallizationPool, InspectionRecord, RecordVersion, AnomalyAlert


POOL_DATA = [
    {'code': 'A-01', 'name': '东塘1号', 'group': 'A', 'area': 12.5, 'x': 10, 'y': 10, 'depth': 30},
    {'code': 'A-02', 'name': '东塘2号', 'group': 'A', 'area': 10.0, 'x': 35, 'y': 10, 'depth': 30},
    {'code': 'A-03', 'name': '东塘3号', 'group': 'A', 'area': 11.2, 'x': 60, 'y': 10, 'depth': 28},
    {'code': 'A-04', 'name': '东塘4号', 'group': 'A', 'area': 9.8, 'x': 85, 'y': 10, 'depth': 30},
    {'code': 'B-01', 'name': '中塘1号', 'group': 'B', 'area': 15.0, 'x': 10, 'y': 35, 'depth': 32},
    {'code': 'B-02', 'name': '中塘2号', 'group': 'B', 'area': 14.5, 'x': 35, 'y': 35, 'depth': 32},
    {'code': 'B-03', 'name': '中塘3号', 'group': 'B', 'area': 13.8, 'x': 60, 'y': 35, 'depth': 30},
    {'code': 'B-04', 'name': '中塘4号', 'group': 'B', 'area': 14.0, 'x': 85, 'y': 35, 'depth': 30},
    {'code': 'C-01', 'name': '西塘1号', 'group': 'C', 'area': 10.5, 'x': 10, 'y': 60, 'depth': 28, 'status': 'maintenance'},
    {'code': 'C-02', 'name': '西塘2号', 'group': 'C', 'area': 11.0, 'x': 35, 'y': 60, 'depth': 30},
    {'code': 'C-03', 'name': '西塘3号', 'group': 'C', 'area': 10.8, 'x': 60, 'y': 60, 'depth': 28},
    {'code': 'C-04', 'name': '西塘4号', 'group': 'C', 'area': 12.0, 'x': 85, 'y': 60, 'depth': 30},
    {'code': 'D-01', 'name': '南塘1号', 'group': 'D', 'area': 8.5, 'x': 10, 'y': 85, 'depth': 25},
    {'code': 'D-02', 'name': '南塘2号', 'group': 'D', 'area': 9.0, 'x': 35, 'y': 85, 'depth': 25, 'status': 'repair'},
    {'code': 'D-03', 'name': '南塘3号', 'group': 'D', 'area': 8.8, 'x': 60, 'y': 85, 'depth': 25},
    {'code': 'D-04', 'name': '南塘4号', 'group': 'D', 'area': 9.2, 'x': 85, 'y': 85, 'depth': 25},
]

INSPECTORS = ['张工', '李师傅', '王建国', '赵海洋', '陈主任', '刘班长']
WEATHER_PATTERN = [
    ('sunny', 28, 55, '3-4', '东南'),
    ('sunny', 32, 48, '5-6', '南'),
    ('cloudy', 26, 62, '1-2', '东'),
    ('cloudy', 25, 68, '3-4', '东北'),
    ('overcast', 23, 75, '3-4', '北'),
    ('rainy', 22, 85, '5-6', '西北'),
    ('sunny', 35, 42, '5-6', '西南'),
    ('foggy', 21, 90, '1-2', '东'),
]
SURFACE_LIST = ['normal', 'normal', 'normal', 'normal', 'crystallized', 'crystallized',
                'leaking', 'cracked', 'flooded', 'dirty']


class Command(BaseCommand):
    help = '初始化海盐晒场巡检台账样例数据'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='清空现有数据后重新生成')

    @transaction.atomic
    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('清空现有数据...')
            RecordVersion.objects.all().delete()
            AnomalyAlert.objects.all().delete()
            InspectionRecord.objects.all().delete()
            CrystallizationPool.objects.all().delete()

        if CrystallizationPool.objects.exists():
            self.stdout.write(self.style.WARNING('数据已存在，跳过初始化。使用 --reset 强制重置。'))
            return

        self.stdout.write('创建结晶池数据...')
        pools = []
        for idx, pdata in enumerate(POOL_DATA):
            pool = CrystallizationPool.objects.create(
                pool_code=pdata['code'],
                pool_name=pdata['name'],
                pool_group=pdata['group'],
                area=pdata['area'],
                position_x=pdata['x'],
                position_y=pdata['y'],
                depth_cm=pdata['depth'],
                status=pdata.get('status', 'active'),
                build_date=date(2018 + (idx % 5), 3 + (idx % 6), 15),
                remarks=f'{pdata["name"]}，位于{pdata["group"]}组区域，建成后稳定生产',
            )
            pools.append(pool)

        self.stdout.write('生成巡检记录历史（近90天）...')
        random.seed(42)
        today = timezone.localdate()
        start_date = today - timedelta(days=90)
        current_date = start_date

        cumulative = {p.id: 0.0 for p in pools}
        batch_counter = {p.pool_group: 1 for p in pools}

        while current_date <= today:
            weekday = current_date.weekday()
            active_pools = [p for p in pools if p.status == 'active']
            num_inspect = max(1, len(active_pools) - (weekday >= 5 and 2 or 0))
            today_pools = random.sample(active_pools, min(num_inspect, len(active_pools)))

            for pool in today_pools:
                for time_offset in [8, 14]:
                    w_idx = (current_date.toordinal() + pool.id) % len(WEATHER_PATTERN)
                    weather, temp, hum, wind, direction = WEATHER_PATTERN[w_idx]

                    base_conc = 25.0 + (current_date - start_date).days * 0.03
                    day_var = random.uniform(-1.5, 2.5)
                    concentration = round(base_conc + day_var + (pool.pool_group == 'B' and 1.2 or 0), 2)
                    concentration = max(18.5, min(31.8, concentration))

                    brine_depth = round(random.uniform(8, 22), 1)
                    crystal_thickness = round(max(0, (concentration - 22) * random.uniform(1.8, 3.2)), 1)

                    surface_weights = [4, 4, 4, 3, 3, 2, 1, 1, 1, 1]
                    surface = random.choices(SURFACE_LIST, weights=surface_weights, k=1)[0]

                    impurity = random.choices(['excellent', 'good', 'good', 'normal', 'normal', 'poor'],
                                              weights=[2, 4, 3, 3, 2, 1], k=1)[0]

                    salt_yield = round(max(0, (concentration - 24) * pool.area * 0.015 * random.uniform(0.6, 1.4)), 3)
                    if time_offset == 8:
                        salt_yield = salt_yield * 0.4
                    cumulative[pool.id] += salt_yield

                    if concentration >= 26 and (current_date.day % 5 == 0) and time_offset == 14:
                        batch_no = f'B{current_date.strftime("%Y%m%d")}-{pool.pool_group}-{batch_counter[pool.pool_group]:03d}'
                        batch_counter[pool.pool_group] += 1
                        salt_yield = round(pool.area * random.uniform(0.18, 0.32), 3)
                        cumulative[pool.id] += salt_yield * 5
                    else:
                        batch_no = ''

                    record = InspectionRecord.objects.create(
                        pool=pool,
                        inspection_date=current_date,
                        inspection_time=datetime.strptime(f'{time_offset}:{"30" if time_offset==14 else "00"}', '%H:%M').time(),
                        inspector=random.choice(INSPECTORS),
                        batch_no=batch_no,
                        brine_concentration=concentration,
                        brine_depth_cm=brine_depth,
                        crystal_thickness_mm=crystal_thickness,
                        surface_status=surface,
                        weather_type=weather,
                        temperature=round(temp + random.uniform(-2, 2), 1),
                        humidity=round(hum + random.uniform(-5, 5), 1),
                        wind_level=wind,
                        wind_direction=direction,
                        salt_yield=salt_yield,
                        cumulative_yield=round(cumulative[pool.id], 3),
                        ph_value=round(random.uniform(6.8, 8.2), 2),
                        impurity_level=impurity,
                        remarks=f'正常巡检，卤水{concentration}°Bé，结晶层厚度{crystal_thickness}mm' if surface in ('normal','crystallized') else f'观察到池面{dict(InspectionRecord.SURFACE_STATUS)[surface]}，需关注后续变化',
                        version=1,
                        is_latest=True,
                    )

                    snapshot = {
                        'concentration': float(record.brine_concentration),
                        'surface': record.surface_status,
                        'yield': float(record.salt_yield),
                        'weather': record.weather_type,
                    }
                    RecordVersion.objects.create(
                        record=record,
                        version_no=1,
                        action='create',
                        change_summary='创建巡检记录',
                        snapshot=snapshot,
                        changed_at=datetime.combine(current_date, record.inspection_time, tzinfo=timezone.get_current_timezone()),
                    )

                    if record.has_anomaly:
                        alerts = []
                        if concentration < 21 or concentration > 31:
                            sev = 'critical' if concentration < 19.5 or concentration > 31.5 else 'high'
                            alerts.append(('concentration', sev, f'{pool.pool_code}卤水浓度异常{concentration}°Bé'))
                        if surface in ('leaking', 'cracked'):
                            alerts.append(('surface', 'high' if surface == 'leaking' else 'medium',
                                           f'{pool.pool_code}池面{dict(InspectionRecord.SURFACE_STATUS)[surface]}'))
                        if weather in ('rainy', 'storm') and concentration < 24:
                            alerts.append(('weather', 'medium', f'{pool.pool_code}雨天浓度下降需关注'))
                        if salt_yield == 0 and concentration >= 27 and crystal_thickness > 5:
                            alerts.append(('yield', 'low', f'{pool.pool_code}符合收盐条件但未收盐'))

                        for atype, sev, title in alerts:
                            AnomalyAlert.objects.create(
                                pool=pool,
                                record=record,
                                anomaly_type=atype,
                                severity=sev,
                                title=title,
                                description=f'巡检时间{current_date} {record.inspection_time}，浓度{concentration}°Bé，池面{dict(InspectionRecord.SURFACE_STATUS)[surface]}',
                                status=random.choices(['open', 'processing', 'resolved', 'resolved', 'ignored'], weights=[2, 2, 4, 2, 1])[0],
                                handler=random.choice(INSPECTORS) if random.random() > 0.35 else '',
                                resolution='已加强监测并采取相应措施' if random.random() > 0.35 else '',
                            )

                    if random.random() < 0.08:
                        new_conc = round(concentration + random.uniform(-0.8, 0.8), 2)
                        new_yield = round(max(0, salt_yield + random.uniform(-0.02, 0.02)), 3)
                        old_conc = float(record.brine_concentration)
                        record.brine_concentration = new_conc
                        record.salt_yield = new_yield
                        record.version = 2
                        record.save()
                        RecordVersion.objects.create(
                            record=record,
                            version_no=2,
                            action='revise',
                            change_summary=f'修正浓度{old_conc}→{new_conc}°Bé，产量微调',
                            snapshot={'concentration': new_conc, 'yield': float(new_yield), 'surface': record.surface_status},
                        )

            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(
            f'初始化完成：{CrystallizationPool.objects.count()} 个结晶池，'
            f'{InspectionRecord.objects.count()} 条巡检记录，'
            f'{RecordVersion.objects.count()} 个版本，'
            f'{AnomalyAlert.objects.count()} 条异常告警。'
        ))
