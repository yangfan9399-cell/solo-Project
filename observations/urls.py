from django.urls import path
from . import views

app_name = 'observations'

urlpatterns = [
    path('', views.observation_list, name='list'),
    path('create/<int:batch_id>/', views.observation_create, name='create'),
    path('<int:pk>/', views.observation_detail, name='detail'),
]