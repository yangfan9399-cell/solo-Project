from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('', views.dashboard, name='dashboard'),
    
    path('orders/', views.work_order_list, name='work_order_list'),
    path('orders/create/', views.work_order_create, name='work_order_create'),
    path('orders/<int:pk>/', views.work_order_detail, name='work_order_detail'),
    path('orders/<int:pk>/partial/', views.work_order_detail_partial, name='work_order_detail_partial'),
    path('orders/<int:pk>/assign-inspector/', views.work_order_assign_inspector, name='work_order_assign_inspector'),
    path('orders/<int:pk>/assign-reviewer/', views.work_order_assign_reviewer, name='work_order_assign_reviewer'),
    path('orders/<int:pk>/start/', views.work_order_start, name='work_order_start'),
    path('orders/<int:pk>/complete-inspection/', views.work_order_complete_inspection, name='work_order_complete_inspection'),
    path('orders/<int:pk>/return/', views.work_order_return, name='work_order_return'),
    path('orders/<int:pk>/archive/', views.work_order_archive, name='work_order_archive'),
    path('orders/<int:pk>/upload-evidence/', views.evidence_upload, name='evidence_upload'),
    
    path('review/', views.review_page, name='review'),
    
    path('poles/', views.light_pole_list, name='light_pole_list'),
    path('poles/<int:pk>/', views.light_pole_detail, name='light_pole_detail'),
]
