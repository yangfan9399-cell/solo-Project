from django.urls import path
from . import views

app_name = 'circulation'

urlpatterns = [
    path('', views.checkout_list, name='checkout_list'),
    path('checkout/<int:reservation_id>/', views.checkout_book, name='checkout'),
    path('return/<int:log_id>/', views.return_book, name='return'),
]
