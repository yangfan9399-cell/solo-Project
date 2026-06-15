from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('game/<str:session_id>/', views.game_board, name='game_board'),
    path('levels/', views.level_list, name='level_list'),
    path('editor/', views.level_editor, name='level_editor'),
    
    path('api/game/start/<int:level_id>/', views.api_start_game, name='api_start_game'),
    path('api/game/<str:session_id>/state/', views.api_get_state, name='api_get_state'),
    path('api/game/<str:session_id>/move/', views.api_move_postman, name='api_move_postman'),
    path('api/game/<str:session_id>/deliver/', views.api_deliver_letter, name='api_deliver_letter'),
    path('api/game/<str:session_id>/fold/', views.api_fold_map, name='api_fold_map'),
    path('api/game/<str:session_id>/undo/', views.api_undo_action, name='api_undo_action'),
    path('api/game/<str:session_id>/history/', views.api_get_history, name='api_get_history'),
    path('api/game/<str:session_id>/compare/', views.api_compare_optimal, name='api_compare_optimal'),
    path('api/game/<str:session_id>/validate-route/', views.api_validate_route, name='api_validate_route'),
    
    path('api/levels/', views.api_level_list, name='api_level_list'),
    path('api/levels/<int:level_id>/', views.api_level_detail, name='api_level_detail'),
    path('api/levels/create/', views.api_create_level, name='api_create_level'),
]
