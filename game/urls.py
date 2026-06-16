from django.urls import path
from . import views

app_name = 'game'

urlpatterns = [
    path('', views.index, name='index'),
    path('start/<int:level_id>/', views.start_game, name='start_game'),
    path('play/<str:session_id>/', views.game_play, name='game_play'),
    path('api/move/<str:session_id>/', views.api_move, name='api_move'),
    path('api/undo/<str:session_id>/', views.api_undo, name='api_undo'),
    path('api/replay/<str:session_id>/', views.api_replay, name='api_replay'),
    path('api/settle/<str:session_id>/', views.api_settle, name='api_settle'),
]
