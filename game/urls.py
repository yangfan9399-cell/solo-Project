from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_or_create, name='login_or_create'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('start/<int:level_id>/', views.start_game, name='start_game'),
    path('game/<int:session_id>/', views.game_view, name='game_view'),
    path('api/state/<int:session_id>/', views.session_state, name='session_state'),
    path('api/place_trap/<int:session_id>/', views.place_trap, name='place_trap'),
    path('api/remove_trap/<int:session_id>/<int:trap_id>/', views.remove_trap, name='remove_trap'),
    path('api/start_task/<int:session_id>/', views.start_task, name='start_task'),
    path('api/start_attack/<int:session_id>/', views.start_attack, name='start_attack'),
    path('api/next_turn/<int:session_id>/', views.next_turn, name='next_turn'),
    path('report/<int:session_id>/', views.battle_report, name='battle_report'),
    path('replay/<int:session_id>/', views.replay_view, name='replay_view'),
    path('api/replay/<int:session_id>/', views.replay_frames, name='replay_frames'),
    path('api/resume/<int:session_id>/<int:turn>/', views.resume_from_history, name='resume_from_history'),
    path('api/validate_score/<int:session_id>/', views.validate_score, name='validate_score'),
    path('history/', views.history_view, name='history_view'),
    path('leaderboard/', views.leaderboard, name='leaderboard'),
]
