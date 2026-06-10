from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('login/', auth_views.LoginView.as_view(
        template_name='core/login.html',
        redirect_authenticated_user=True
    ), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('elders/', views.elder_list, name='elder_list'),
    path('elders/<int:pk>/', views.elder_detail, name='elder_detail'),
    path('elders/create/', views.elder_create, name='elder_create'),
    path('elders/<int:pk>/edit/', views.elder_edit, name='elder_edit'),
]