from construction.models import ConstructionPlan

plans = ConstructionPlan.objects.filter(status='pm_approved').order_by('pk')
print(f'待安全审核的计划({plans.count()}个):')
for plan in plans:
    risks = plan.get_safety_risks()
    print(f'\n  计划{plan.pk}: {plan.title}')
    print(f'    点位: {plan.location.name} ({plan.location.height}米)')
    print(f'    开工日期: {plan.planned_start_date}')
    print(f'    安全风险({len(risks)}项):')
    for r in risks:
        print(f'      - {r}')

print('\n=== 所有计划状态 ===')
all_plans = ConstructionPlan.objects.all().order_by('pk')
for plan in all_plans:
    print(f'  计划{plan.pk}: {plan.status} - {plan.title}')
