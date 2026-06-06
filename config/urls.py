"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.contrib.auth.decorators import login_required


@login_required
def dashboard_view(request):
    from catalog.models import RareBook
    from reservations.models import Reservation
    from circulation.models import CirculationLog
    from conservation.models import DamageAssessment
    
    total_books = RareBook.objects.count()
    pending_reservations = Reservation.objects.filter(status='pending').count()
    checked_out = CirculationLog.objects.filter(return_time__isnull=True).count()
    pending_assessments = DamageAssessment.objects.filter(
        needs_supervisor_review=True,
        decision__isnull=True
    ).count()
    
    from django.shortcuts import render
    recent_reservations = Reservation.objects.all().order_by('-created_at')[:5]
    
    context = {
        'total_books': total_books,
        'pending_reservations': pending_reservations,
        'checked_out': checked_out,
        'pending_assessments': pending_assessments,
        'recent_reservations': recent_reservations,
        'page_title': '首页概览',
    }
    return render(request, 'dashboard.html', context)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('catalog/', include('catalog.urls')),
    path('reservations/', include('reservations.urls')),
    path('circulation/', include('circulation.urls')),
    path('conservation/', include('conservation.urls')),
    path('stats/', include('stats.urls')),
    path('', dashboard_view, name='dashboard'),
]
