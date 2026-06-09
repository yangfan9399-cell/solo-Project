import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'billboard_system.settings')
import django
django.setup()

from construction.models import ConstructionPlan, WeatherRecord, PlanWorker

plan = ConstructionPlan.objects.get(pk=2)
print(f'计划2: {plan.title}')
print(f'状态: {plan.get_status_display()}')
print(f'计划开工日期: {plan.planned_start_date}')
print(f'点位: {plan.location.name} ({plan.location.height}米)')

weathers = WeatherRecord.objects.filter(location=plan.location).order_by('record_date')
print(f'\n天气记录({weathers.count()}条):')
for w in weathers:
    print(f'  {w.record_date}: {w.get_weather_display()}, 风力{w.wind_level}级, 预警:{w.has_wind_warning}')

plan_workers = PlanWorker.objects.filter(plan=plan)
print(f'\n施工人员({plan_workers.count()}人):')
for pw in plan_workers:
    has_ha = pw.worker.has_valid_high_altitude_cert
    print(f'  {pw.worker.name}, 高空证:{has_ha}')

risks = plan.get_safety_risks()
print(f'\n安全风险({len(risks)}项):')
for r in risks:
    print(f'  - {r}')

print('\n=== 测试有大风预警的场景 ===')
from datetime import timedelta
plan2 = ConstructionPlan.objects.get(pk=2)
original_date = plan2.planned_start_date
plan2.planned_start_date = original_date - timedelta(days=3)
risks2 = plan2.get_safety_risks()
print(f'调整开工日期为 {plan2.planned_start_date} 后:')
print(f'安全风险({len(risks2)}项):')
for r in risks2:
    print(f'  - {r}')

print('\n=== 测试无高空作业证的场景 ===')
plan3 = ConstructionPlan.objects.get(pk=2)
plan3.planned_start_date = original_date
PlanWorker.objects.filter(plan=plan3).delete()
risks3 = plan3.get_safety_risks()
print(f'无施工人员时:')
print(f'安全风险({len(risks3)}项):')
for r in risks3:
    print(f'  - {r}')
