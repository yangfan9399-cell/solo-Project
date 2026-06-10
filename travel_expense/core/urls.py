from django.urls import path
from . import views
from .htmx import handlers as htmx_handlers

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    path('', views.dashboard, name='dashboard'),

    path('travel/', views.travel_list, name='travel_list'),
    path('travel/create/', views.travel_create, name='travel_create'),
    path('travel/<uuid:travel_id>/', views.travel_detail, name='travel_detail'),
    path('travel/<uuid:travel_id>/submit/', views.travel_submit, name='travel_submit'),

    path('travel/approval/', views.approval_list, name='approval_list'),
    path('travel/<uuid:travel_id>/approve/', views.travel_approve, name='travel_approve'),

    path('travel/booking/', views.booking_list, name='booking_list'),
    path('travel/<uuid:travel_id>/booking/', views.travel_booking, name='travel_booking'),

    path('travel/reimbursement/', views.reimbursement_list, name='reimbursement_list'),
    path('travel/<uuid:travel_id>/reimburse/', views.travel_reimburse, name='travel_reimburse'),

    path('travel/statistics/', views.statistics, name='statistics'),

    path('api/travel/<uuid:travel_id>/detail/', htmx_handlers.travel_detail_partial, name='htmx_travel_detail'),
    path('api/travel/<uuid:travel_id>/receipt-check/', htmx_handlers.receipt_check_partial, name='htmx_receipt_check'),
    path('api/travel/<uuid:travel_id>/budget-diff/', htmx_handlers.budget_difference_partial, name='htmx_budget_diff'),
    path('api/travel/<uuid:travel_id>/history/', htmx_handlers.history_timeline_partial, name='htmx_history'),
    path('api/travel/<uuid:travel_id>/status/', htmx_handlers.status_badge_partial, name='htmx_status'),
]
