from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class PlayerProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='player_profile',
        verbose_name='关联用户'
    )
    nickname = models.CharField(
        max_length=50,
        verbose_name='玩家昵称'
    )
    total_score = models.IntegerField(
        default=0,
        verbose_name='总得分'
    )
    play_count = models.IntegerField(
        default=0,
        verbose_name='游玩次数'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间'
    )

    class Meta:
        db_table = 'player_profile'
        verbose_name = '玩家档案'
        verbose_name_plural = '玩家档案'

    def __str__(self):
        return f'{self.nickname} (用户ID: {self.user_id})'


class Level(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name='关卡名称'
    )
    difficulty = models.IntegerField(
        validators=[
            MinValueValidator(1, message='难度最小为1'),
            MaxValueValidator(5, message='难度最大为5')
        ],
        verbose_name='难度等级'
    )
    grid_data = models.JSONField(
        verbose_name='网格数据'
    )
    best_steps = models.IntegerField(
        default=0,
        verbose_name='最佳步数'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间'
    )

    class Meta:
        db_table = 'level'
        verbose_name = '关卡'
        verbose_name_plural = '关卡'
        ordering = ['difficulty', 'id']

    def __str__(self):
        return f'关卡{self.id}: {self.name} (难度: {self.difficulty})'


class GameSession(models.Model):
    STATUS_CHOICES = [
        ('playing', '进行中'),
        ('won', '已通关'),
        ('lost', '已失败'),
    ]

    player = models.ForeignKey(
        PlayerProfile,
        on_delete=models.CASCADE,
        related_name='game_sessions',
        verbose_name='玩家'
    )
    level = models.ForeignKey(
        Level,
        on_delete=models.CASCADE,
        related_name='game_sessions',
        verbose_name='关卡'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='playing',
        verbose_name='游戏状态'
    )
    current_steps = models.IntegerField(
        default=0,
        verbose_name='当前步数'
    )
    start_time = models.DateTimeField(
        auto_now_add=True,
        verbose_name='开始时间'
    )
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='结束时间'
    )

    class Meta:
        db_table = 'game_session'
        verbose_name = '游戏局次'
        verbose_name_plural = '游戏局次'
        ordering = ['-start_time']

    def __str__(self):
        return f'局次{self.id} - {self.player.nickname} - {self.level.name} [{self.status}]'


class GameAction(models.Model):
    ACTION_TYPE_CHOICES = [
        ('move', '移动'),
        ('collapse', '坍缩'),
        ('undo', '撤销'),
    ]

    DIRECTION_CHOICES = [
        ('up', '上'),
        ('down', '下'),
        ('left', '左'),
        ('right', '右'),
    ]

    session = models.ForeignKey(
        GameSession,
        on_delete=models.CASCADE,
        related_name='actions',
        verbose_name='游戏局次'
    )
    action_number = models.IntegerField(
        verbose_name='操作序号'
    )
    action_type = models.CharField(
        max_length=10,
        choices=ACTION_TYPE_CHOICES,
        verbose_name='操作类型'
    )
    direction = models.CharField(
        max_length=5,
        choices=DIRECTION_CHOICES,
        null=True,
        blank=True,
        verbose_name='操作方向'
    )
    state_before = models.JSONField(
        verbose_name='操作前状态'
    )
    state_after = models.JSONField(
        verbose_name='操作后状态'
    )
    is_valid = models.BooleanField(
        default=True,
        verbose_name='是否有效'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='时间戳'
    )

    class Meta:
        db_table = 'game_action'
        verbose_name = '游戏操作'
        verbose_name_plural = '游戏操作'
        ordering = ['session_id', 'action_number']

    def __str__(self):
        direction_str = f' - {self.direction}' if self.direction else ''
        return f'操作{self.action_number}[{self.action_type}{direction_str}] (局次{self.session_id})'


class GameResult(models.Model):
    session = models.OneToOneField(
        GameSession,
        on_delete=models.CASCADE,
        related_name='result',
        verbose_name='游戏局次'
    )
    final_score = models.IntegerField(
        default=0,
        verbose_name='最终得分'
    )
    is_passed = models.BooleanField(
        default=False,
        verbose_name='是否通关'
    )
    steps_used = models.IntegerField(
        default=0,
        verbose_name='使用步数'
    )
    collapse_count = models.IntegerField(
        default=0,
        verbose_name='坍缩次数'
    )
    undo_count = models.IntegerField(
        default=0,
        verbose_name='撤销次数'
    )
    server_score = models.IntegerField(
        default=0,
        verbose_name='服务器重算分数'
    )
    detail = models.JSONField(
        default=dict,
        verbose_name='结算详情'
    )

    class Meta:
        db_table = 'game_result'
        verbose_name = '游戏结算'
        verbose_name_plural = '游戏结算'

    def __str__(self):
        status = '通关' if self.is_passed else '未通关'
        return f'结算 - 局次{self.session_id} [{status}] 得分: {self.final_score}'
