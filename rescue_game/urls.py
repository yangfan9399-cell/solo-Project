from django.urls import path
from . import views

app_name = 'rescue_game'

urlpatterns = [
    path('', views.index, name='index'),
    path('game/<str:session_id>/', views.game_board, name='game_board'),
    path('replay/<str:session_id>/', views.replay_view, name='replay'),

    path('api/seeds/', views.api_seeds, name='api_seeds'),
    path('api/sessions/', views.api_session_list, name='api_session_list'),
    path('api/session/create/', views.api_create_session, name='api_create_session'),
    path('api/session/<str:session_id>/', views.api_session_state, name='api_session_state'),
    path('api/session/<str:session_id>/start/', views.api_start_game, name='api_start_game'),
    path('api/session/<str:session_id>/complete/', views.api_complete_game, name='api_complete_game'),
    path('api/session/<str:session_id>/recalculate/', views.api_recalculate_score, name='api_recalculate_score'),

    path('api/session/<str:session_id>/node/', views.api_add_node, name='api_add_node'),
    path('api/session/<str:session_id>/node/<str:node_id>/', views.api_remove_node, name='api_remove_node'),
    path('api/session/<str:session_id>/detail/', views.api_add_detail, name='api_add_detail'),
    path('api/session/<str:session_id>/calculate/', views.api_calculate_loads, name='api_calculate_loads'),

    path('api/session/<str:session_id>/weather/', views.api_weather_event, name='api_weather_event'),
    path('api/session/<str:session_id>/rollback/', views.api_rollback, name='api_rollback'),
    path('api/session/<str:session_id>/transfer/', views.api_execute_transfer, name='api_execute_transfer'),
    path('api/session/<str:session_id>/step/<int:step>/', views.api_get_transfer_step, name='api_get_transfer_step'),
    path('api/session/<str:session_id>/analysis/', views.api_score_analysis, name='api_score_analysis'),
]
