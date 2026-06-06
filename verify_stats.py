import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'library_project.settings')
django.setup()

from conservation.models import DamageAssessment, Decision
from circulation.models import CirculationLog

total_dec = Decision.objects.count()
print(f'总决策数: {total_dec}')

repair_count = Decision.objects.filter(decision_type='send_for_repair').count()
print(f'送修数: {repair_count}')
print(f'送修率: {repair_count/total_dec*100:.1f}%')

pending = DamageAssessment.objects.filter(needs_supervisor_review=True).exclude(
    id__in=Decision.objects.values_list('assessment_id', flat=True)
).count()
print(f'待决策鉴定: {pending}')

print()
print('处理时长分布:')
decisions = Decision.objects.select_related('assessment__circulation_log').all()
for d in decisions:
    if hasattr(d.assessment, 'circulation_log') and d.assessment.circulation_log.return_date:
        hours = (d.decision_date - d.assessment.circulation_log.return_date).total_seconds() / 3600
        print(f'  决策ID {d.id}: {hours:.1f} 小时')
