from django.urls import path
from .views import CustomLoginView, custom_logout_view, profile_view

app_name = 'accounts'

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', custom_logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
]
