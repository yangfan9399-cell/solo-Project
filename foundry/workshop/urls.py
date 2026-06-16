from django.urls import path
from . import views

app_name = 'workshop'

urlpatterns = [
    path('', views.index, name='index'),
    path('player/create/', views.create_player, name='create_player'),
    path('player/switch/', views.switch_player, name='switch_player'),
    path('player/profile/', views.player_profile, name='player_profile'),
    path('api/levels/', views.level_list, name='level_list'),
    path('api/round/start/<int:level_number>/', views.start_round, name='start_round'),
    path('api/round/<int:round_id>/resume/', views.resume_round, name='resume_round'),
    path('api/round/<int:round_id>/operation/', views.record_operation, name='record_operation'),
    path('api/round/<int:round_id>/undo/', views.undo_operation, name='undo_operation'),
    path('api/round/<int:round_id>/proofread/', views.proofread, name='proofread'),
    path('api/round/<int:round_id>/submit/', views.submit_round, name='submit_round'),
    path('api/round/<int:round_id>/history/', views.operation_history, name='operation_history'),
    path('game/<int:round_id>/', views.game_view, name='game'),
    path('result/<int:round_id>/', views.result_view, name='result'),
]
