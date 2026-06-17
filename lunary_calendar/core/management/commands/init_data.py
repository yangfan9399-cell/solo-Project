"""
初始化样例数据命令
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, datetime
from core.models import CalculationRecord, CalculationBatch, RecordVersion, AbnormalData
from core.calendar import calculate_calendar


class Command(BaseCommand):
    help = '初始化样例数据和版本数据'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('开始初始化样例数据...')
        
        sample_records = [
            {
                'title': '2024年春节推算',
                'description': '2024年农历新年春节推算',
                'target_date': date(2024, 2, 10),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 39.9042,
                'longitude': 116.4074,
                'timezone_offset': 8,
                'location_name': '北京',
            },
            {
                'title': '2024年夏至推算',
                'description': '2024年夏至节气推算',
                'target_date': date(2024, 6, 21),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 39.9042,
                'longitude': 116.4074,
                'timezone_offset': 8,
                'location_name': '北京',
            },
            {
                'title': '2024年秋分推算',
                'description': '2024年秋分节气推算',
                'target_date': date(2024, 9, 23),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 39.9042,
                'longitude': 116.4074,
                'timezone_offset': 8,
                'location_name': '北京',
            },
            {
                'title': '2024年冬至推算',
                'description': '2024年冬至节气推算',
                'target_date': date(2024, 12, 21),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 39.9042,
                'longitude': 116.4074,
                'timezone_offset': 8,
                'location_name': '北京',
            },
            {
                'title': '2025年元宵节推算',
                'description': '2025年农历正月十五元宵节',
                'target_date': date(2025, 2, 12),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 39.9042,
                'longitude': 116.4074,
                'timezone_offset': 8,
                'location_name': '北京',
            },
            {
                'title': '上海地区2024年立春推算',
                'description': '上海地区立春节气推算',
                'target_date': date(2024, 2, 4),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 31.2304,
                'longitude': 121.4737,
                'timezone_offset': 8,
                'location_name': '上海',
            },
            {
                'title': '广州地区2024年清明推算',
                'description': '广州地区清明节气推算',
                'target_date': date(2024, 4, 4),
                'time_hour': 12,
                'time_minute': 0,
                'latitude': 23.1291,
                'longitude': 113.2644,
                'timezone_offset': 8,
                'location_name': '广州',
            },
        ]
        
        for data in sample_records:
            record = CalculationRecord.objects.create(
                title=data['title'],
                description=data['description'],
                target_date=data['target_date'],
                time_hour=data['time_hour'],
                time_minute=data['time_minute'],
                latitude=data['latitude'],
                longitude=data['longitude'],
                timezone_offset=data['timezone_offset'],
                location_name=data['location_name'],
                status='draft',
            )
            
            try:
                dt = datetime(data['target_date'].year, data['target_date'].month, 
                             data['target_date'].day, data['time_hour'], data['time_minute'])
                result = calculate_calendar(dt, data['latitude'], data['longitude'], data['timezone_offset'])
                
                record.lunar_year = result['lunar']['year']
                record.lunar_month = result['lunar']['month']
                record.lunar_day = result['lunar']['day']
                record.lunar_month_name = result['lunar']['month_name']
                record.lunar_day_name = result['lunar']['day_name']
                record.is_leap_month = result['lunar']['is_leap']
                record.year_gan_zhi = result['gan_zhi']['year']
                record.month_gan_zhi = result['gan_zhi']['month']
                record.day_gan_zhi = result['gan_zhi']['day']
                record.moon_phase = result['moon_phase']
                record.moon_phase_type = result['moon_phase_type']
                record.solar_terms = result['solar_terms']
                record.calculation_steps = result['calculation_steps']
                record.status = 'calculated'
                record.calculated_at = timezone.now()
                record.save()
                
                RecordVersion.objects.create(
                    record=record,
                    version_number=1,
                    changes='初始推算',
                    target_date=record.target_date,
                    time_hour=record.time_hour,
                    time_minute=record.time_minute,
                    latitude=record.latitude,
                    longitude=record.longitude,
                    timezone_offset=record.timezone_offset,
                    lunar_year=record.lunar_year,
                    lunar_month=record.lunar_month,
                    lunar_day=record.lunar_day,
                    year_gan_zhi=record.year_gan_zhi,
                    month_gan_zhi=record.month_gan_zhi,
                    day_gan_zhi=record.day_gan_zhi,
                    moon_phase=record.moon_phase,
                )
                
                self.stdout.write(f'创建记录: {data["title"]}')
                
            except Exception as e:
                record.status = 'abnormal'
                record.error_message = str(e)
                record.save()
                self.stdout.write(f'记录异常: {data["title"]} - {str(e)}')
        
        batch = CalculationBatch.objects.create(
            name='2024年重要节气推算批次',
            description='2024年二十四节气推算',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            latitude=39.9042,
            longitude=116.4074,
            timezone_offset=8,
            status='draft',
        )
        self.stdout.write(f'创建批次: {batch.name}')
        
        abnormal_records = [
            {
                'record': CalculationRecord.objects.first(),
                'type': 'calculation',
                'message': '农历日期推算结果与参考数据存在微小偏差（约0.5天），建议验证',
                'details': {'source': '自动校验', 'threshold': 0.5},
            },
            {
                'record': CalculationRecord.objects.filter(title__contains='夏至').first(),
                'type': 'warning',
                'message': '夏至时刻处于时区边界，推算结果可能存在±1小时误差',
                'details': {'timezone_boundary': True, 'precision': 'hour'},
            },
            {
                'record': None,
                'type': 'system',
                'message': '系统检测到部分历史推算记录需要重新验证',
                'details': {'affected_count': 2, 'action': '建议执行验证'},
            },
        ]
        
        for abnormal_data in abnormal_records:
            AbnormalData.objects.create(
                record=abnormal_data['record'],
                type=abnormal_data['type'],
                message=abnormal_data['message'],
                details=abnormal_data['details'],
                resolved=False,
            )
        
        self.stdout.write('创建异常数据提示样例')
        self.stdout.write(self.style.SUCCESS('样例数据初始化完成！'))
