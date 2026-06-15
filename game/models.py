from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import json


class Level(models.Model):
    """关卡数据模型 - 定义地图网格、地址、道路、信件、步数限制"""
    name = models.CharField(max_length=100, verbose_name='关卡名称')
    description = models.TextField(blank=True, verbose_name='关卡描述')
    
    grid_width = models.IntegerField(default=5, verbose_name='网格宽度')
    grid_height = models.IntegerField(default=5, verbose_name='网格高度')
    
    addresses = models.JSONField(verbose_name='地址列表')
    roads = models.JSONField(verbose_name='道路连接')
    letters = models.JSONField(verbose_name='待送信件')
    post_office = models.JSONField(verbose_name='邮局位置')
    
    max_steps = models.IntegerField(default=20, verbose_name='最大步数')
    min_solution = models.JSONField(null=True, blank=True, verbose_name='最短解')
    min_folds = models.IntegerField(default=0, verbose_name='最少折叠次数')
    
    fold_directions = models.JSONField(default=list, verbose_name='允许的折叠方向')
    required_folds = models.JSONField(default=list, verbose_name='必须的折叠方向')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        return f"[{self.id}] {self.name}"


class GameSession(models.Model):
    """主记录 - 玩家通过折叠纸地图改变道路相邻关系的局次记录"""
    STATUS_CHOICES = [
        ('playing', '进行中'),
        ('won', '胜利'),
        ('lost', '失败'),
        ('abandoned', '已放弃'),
    ]
    
    level = models.ForeignKey(Level, on_delete=models.CASCADE, verbose_name='关卡')
    player = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='玩家')
    session_id = models.CharField(max_length=64, unique=True, verbose_name='局次ID')
    
    current_state = models.JSONField(verbose_name='当前地图状态')
    fold_count = models.IntegerField(default=0, verbose_name='折叠次数')
    step_count = models.IntegerField(default=0, verbose_name='已用步数')
    postman_position = models.JSONField(verbose_name='邮差当前位置')
    delivered_letters = models.JSONField(default=list, verbose_name='已送达信件')
    remaining_letters = models.JSONField(default=list, verbose_name='剩余信件')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='playing', verbose_name='游戏状态')
    score = models.IntegerField(default=0, verbose_name='分数')
    
    started_at = models.DateTimeField(auto_now_add=True, verbose_name='开始时间')
    ended_at = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"局次 {self.session_id} - {self.level.name}"


class FoldHistory(models.Model):
    """历史记录 - 每次折叠都会留下折痕并影响后续路线"""
    DIRECTION_CHOICES = [
        ('horizontal_up', '向上折叠'),
        ('horizontal_down', '向下折叠'),
        ('vertical_left', '向左折叠'),
        ('vertical_right', '向右折叠'),
    ]
    
    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='fold_histories', verbose_name='局次')
    fold_number = models.IntegerField(verbose_name='折叠序号')
    direction = models.CharField(max_length=20, choices=DIRECTION_CHOICES, verbose_name='折叠方向')
    fold_line = models.IntegerField(verbose_name='折叠线位置')
    
    crease_lines = models.JSONField(verbose_name='折痕位置')
    merged_cells = models.JSONField(verbose_name='合并的单元格')
    new_adjacencies = models.JSONField(verbose_name='新增相邻关系')
    removed_adjacencies = models.JSONField(verbose_name='移除的相邻关系')
    
    state_before = models.JSONField(verbose_name='折叠前状态')
    state_after = models.JSONField(verbose_name='折叠后状态')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='折叠时间')
    
    class Meta:
        ordering = ['game_session', 'fold_number']
    
    def __str__(self):
        return f"[{self.game_session.session_id}] 第{self.fold_number}次折叠 - {self.get_direction_display()}"


class DeliveryDetail(models.Model):
    """明细记录 - 让邮差在有限步数内送完不同颜色的信件"""
    ACTION_CHOICES = [
        ('move', '移动'),
        ('deliver', '投递'),
        ('fold', '折叠'),
        ('undo', '撤销'),
    ]
    
    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='delivery_details', verbose_name='局次')
    step_number = models.IntegerField(verbose_name='步骤序号')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='动作类型')
    
    from_position = models.JSONField(null=True, blank=True, verbose_name='起始位置')
    to_position = models.JSONField(null=True, blank=True, verbose_name='目标位置')
    
    letter_color = models.CharField(max_length=20, null=True, blank=True, verbose_name='信件颜色')
    address_id = models.CharField(max_length=50, null=True, blank=True, verbose_name='地址ID')
    
    fold_history = models.ForeignKey(FoldHistory, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='关联折叠记录')
    
    step_cost = models.IntegerField(default=1, verbose_name='步数消耗')
    is_valid = models.BooleanField(default=True, verbose_name='是否有效')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    
    state_before = models.JSONField(verbose_name='动作前状态')
    state_after = models.JSONField(verbose_name='动作后状态')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='执行时间')
    
    class Meta:
        ordering = ['game_session', 'step_number']
    
    def __str__(self):
        return f"[{self.game_session.session_id}] 步骤{self.step_number} - {self.get_action_display()}"


class GameResult(models.Model):
    """结果记录 - 部分地址只在特定折叠方向后连通"""
    game_session = models.OneToOneField(GameSession, on_delete=models.CASCADE, related_name='result', verbose_name='局次')
    
    is_success = models.BooleanField(verbose_name='是否成功')
    final_score = models.IntegerField(verbose_name='最终分数')
    steps_used = models.IntegerField(verbose_name='使用步数')
    folds_used = models.IntegerField(verbose_name='使用折叠次数')
    
    delivered_count = models.IntegerField(verbose_name='送达信件数')
    total_letters = models.IntegerField(verbose_name='总信件数')
    
    optimal_steps = models.IntegerField(null=True, blank=True, verbose_name='最短解步数')
    optimal_folds = models.IntegerField(null=True, blank=True, verbose_name='最短解折叠次数')
    is_optimal = models.BooleanField(default=False, verbose_name='是否达到最短解')
    
    special_addresses_unlocked = models.JSONField(default=list, verbose_name='解锁的特殊地址')
    required_folds_used = models.JSONField(default=list, verbose_name='使用的必需折叠')
    
    score_breakdown = models.JSONField(verbose_name='分数明细')
    final_rank = models.CharField(max_length=20, null=True, blank=True, verbose_name='评级')
    
    validated_at = models.DateTimeField(auto_now_add=True, verbose_name='验证时间')
    
    def __str__(self):
        return f"[{self.game_session.session_id}] {'成功' if self.is_success else '失败'} - {self.final_score}分"
