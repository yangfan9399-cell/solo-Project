from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from catalog.models import BookCategory, RareBook
from reservations.models import Reservation
from conservation.models import DamageAssessment, Decision
from circulation.models import CirculationLog
from accounts.models import User


@login_required
@user_passes_test(lambda u: u.is_supervisor)
def stats_dashboard(request):
    category_stats = BookCategory.objects.annotate(
        book_count=Count('books'),
        reservation_count=Count('books__reservations', distinct=True),
    ).values('name', 'rarity_level', 'book_count', 'reservation_count')
    
    reader_type_stats = User.objects.filter(role='reader').values('reader_type').annotate(
        count=Count('id'),
        reservation_count=Count('reservations', distinct=True),
    ).order_by('reader_type')
    
    damage_level_stats = DamageAssessment.objects.values('damage_level').annotate(
        count=Count('id'),
    ).order_by('damage_level')
    
    damage_type_stats = DamageAssessment.objects.values('damage_type').annotate(
        count=Count('id'),
    ).order_by('-count')
    
    decision_stats = Decision.objects.values('decision_type').annotate(
        count=Count('id'),
    ).order_by('decision_type')
    
    avg_processing_time = None
    completed_decisions = Decision.objects.filter(
        assessment__circulation__return_time__isnull=False
    ).annotate(
        processing_time=ExpressionWrapper(
            F('decided_at') - F('assessment__circulation__return_time'),
            output_field=DurationField()
        )
    )
    if completed_decisions.exists():
        total_hours = sum(
            (d.processing_time.total_seconds() / 3600) 
            for d in completed_decisions if d.processing_time
        )
        avg_processing_time = round(total_hours / len(completed_decisions), 1)
    
    total_books = RareBook.objects.count()
    total_reservations = Reservation.objects.count()
    total_assessments = DamageAssessment.objects.count()
    total_decisions = Decision.objects.count()
    
    monthly_reservations = Reservation.objects.annotate(
        month=TruncMonth('created_at')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')[:12]
    
    status_stats = RareBook.objects.values('status').annotate(
        count=Count('id')
    ).order_by('status')
    
    context = {
        'category_stats': list(category_stats),
        'reader_type_stats': list(reader_type_stats),
        'damage_level_stats': list(damage_level_stats),
        'damage_type_stats': list(damage_type_stats),
        'decision_stats': list(decision_stats),
        'avg_processing_time': avg_processing_time,
        'total_books': total_books,
        'total_reservations': total_reservations,
        'total_assessments': total_assessments,
        'total_decisions': total_decisions,
        'monthly_reservations': list(monthly_reservations),
        'status_stats': list(status_stats),
        'page_title': '数据统计',
    }
    return render(request, 'stats/dashboard.html', context)
