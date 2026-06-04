from django.urls import path
from . import views

app_name = 'meter_review'

urlpatterns = [
    path('', views.queue_list, name='queue_list'),
    path('queue/load-more/', views.queue_load_more, name='queue_load_more'),
    path('reading/<int:pk>/', views.reading_detail, name='reading_detail'),
    path('reading/<int:pk>/assign/', views.assign_reading, name='assign_reading'),
    path('reading/<int:pk>/field-note/', views.add_field_note, name='add_field_note'),
    path('reading/<int:pk>/submit-for-review/', views.submit_for_review, name='submit_for_review'),
    path('reading/<int:pk>/adjust/', views.adjust_fee, name='adjust_fee'),
    path('reading/<int:pk>/return/', views.return_reading, name='return_reading'),
    path('reading/<int:pk>/archive/', views.archive_reading, name='archive_reading'),
    path('review/', views.review_dashboard, name='review_dashboard'),
    path('api/reading/<int:pk>/status/', views.get_reading_status, name='get_reading_status'),
]
