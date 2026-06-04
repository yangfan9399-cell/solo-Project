import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'water_meter.settings'
import django
django.setup()
from django.db.models import Count, F, Case, When, Value, Sum, Avg, DecimalField, ExpressionWrapper
from django.db.models.functions import Coalesce
from decimal import Decimal
from meter_review.models import MeterReading

adjustment_diff = Coalesce(
    Sum(Case(
        When(adjusted_fee__isnull=False, then=ExpressionWrapper(
            F('adjusted_fee') - F('original_fee'),
            output_field=DecimalField()
        )),
        default=Value(Decimal('0')),
        output_field=DecimalField()
    )),
    Decimal('0')
)

# 按异常
by_anomaly = MeterReading.objects.all().filter(anomaly_type__isnull=False).values(
    'anomaly_type__name'
).annotate(
    count=Count('id'),
    total_adjustment=adjustment_diff,
)
for r in by_anomaly:
    print(r['anomaly_type__name'], r['count'], r['total_adjustment'])
print('---')
# 总数
agg = MeterReading.objects.all().aggregate(
    total_adjustment=adjustment_diff,
    avg_rework=Coalesce(Avg('rework_count'), Decimal('0'))
)
print('total', agg['total_adjustment'], 'avg_rework', agg['avg_rework'])
print('All queries OK')
