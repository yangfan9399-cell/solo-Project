"""
game 应用 URL 配置
"""
from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('auth/register/', views.api_register, name='register'),
    path('auth/login/', views.api_login, name='login'),
    path('auth/logout/', views.api_logout, name='logout'),
    path('auth/current/', views.api_current_player, name='current_player'),
    path('auth/profile/', views.api_update_profile, name='update_profile'),

    path('levels/', views.api_levels, name='levels'),

    path('game/start/', views.api_start_game, name='start_game'),
    path('game/<int:session_id>/state/', views.api_game_state, name='game_state'),
    path('game/<int:session_id>/tick/', views.api_game_tick, name='game_tick'),
    path('game/<int:session_id>/prep/', views.api_start_preparation, name='start_preparation'),
    path('game/<int:session_id>/deliver/', views.api_start_delivery, name='start_delivery'),
    path('game/<int:session_id>/pause/', views.api_pause_game, name='pause_game'),
    path('game/<int:session_id>/resume/', views.api_resume_game, name='resume_game'),
    path('game/<int:session_id>/restore/', views.api_restore_game, name='restore_game'),
    path('game/<int:session_id>/abandon/', views.api_abandon_game, name='abandon_game'),
    path('game/<int:session_id>/settlement/', views.api_get_settlement, name='get_settlement'),
    path('game/<int:session_id>/verify/', views.api_verify_score, name='verify_score'),
    path('game/<int:session_id>/history/', views.api_get_action_history, name='action_history'),

    path('player/history/', views.api_game_history, name='game_history'),
    path('player/stats/', views.api_player_stats, name='player_stats'),
]
