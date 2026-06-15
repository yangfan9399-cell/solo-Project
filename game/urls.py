from django.urls import path
from game import views

urlpatterns = [
    path('', views.home, name='home'),
    path('level/<int:level_id>/', views.level_detail, name='level_detail'),
    path('play/<int:session_id>/', views.play, name='play'),
    path('report/<int:session_id>/', views.report, name='report'),

    path('api/new-game/<int:level_id>/', views.api_new_game, name='api_new_game'),
    path('api/tick/<int:session_id>/', views.api_tick, name='api_tick'),
    path('api/set-price/<int:session_id>/', views.api_set_price, name='api_set_price'),
    path('api/set-windows/<int:session_id>/', views.api_set_windows, name='api_set_windows'),
    path('api/set-dispatch/<int:session_id>/', views.api_set_dispatch_interval, name='api_set_dispatch'),
    path('api/finalize/<int:session_id>/', views.api_finalize, name='api_finalize'),
    path('api/rollback/<int:session_id>/', views.api_rollback, name='api_rollback'),
    path('api/recalculate/<int:session_id>/', views.api_recalculate, name='api_recalculate'),
    path('api/state/<int:session_id>/', views.api_session_state, name='api_state'),
]
