from django.urls import path
from . import views

app_name = 'batches'

urlpatterns = [
    path('', views.batch_list, name='list'),
    path('create/', views.batch_create, name='create'),
    path('<int:pk>/', views.batch_detail, name='detail'),
    path('<int:pk>/update-status/', views.batch_update_status, name='update_status'),
    path('<int:pk>/upload-document/', views.upload_document, name='upload_document'),
    path('<int:pk>/approve-release/', views.approve_release, name='approve_release'),
    path('<int:pk>/approve-extend/', views.approve_extend, name='approve_extend'),
    path('<int:pk>/approve-return/', views.approve_return, name='approve_return'),
]