import json
import hashlib
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class PlayerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=50)
    gold = models.IntegerField(default=100)
    total_score = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    current_level = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.display_name


class Level(models.Model):
    number = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    enemy_waves = models.JSONField()
    base_reward = models.IntegerField(default=50)
    difficulty = models.FloatField(default=1.0)
    unlocked = models.BooleanField(default=True)

    def __str__(self):
        return f"Level {self.number}: {self.name}"


class TrapType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    cost = models.IntegerField()
    damage = models.IntegerField()
    range = models.IntegerField()
    cooldown = models.IntegerField(default=2)
    emoji = models.CharField(max_length=10, default='🏰')
    color = models.CharField(max_length=20, default='#4a5568')

    def __str__(self):
        return self.name


class Trap(models.Model):
    game_session = models.ForeignKey('GameSession', on_delete=models.CASCADE, related_name='traps')
    trap_type = models.ForeignKey(TrapType, on_delete=models.CASCADE)
    position_x = models.IntegerField()
    position_y = models.IntegerField()
    last_triggered = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('game_session', 'position_x', 'position_y')

    def __str__(self):
        return f"{self.trap_type.name} at ({self.position_x}, {self.position_y})"


class CraftsmanTask(models.Model):
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('failed', '已失败'),
    ]

    game_session = models.ForeignKey('GameSession', on_delete=models.CASCADE, related_name='tasks')
    name = models.CharField(max_length=100)
    description = models.TextField()
    required_gold = models.IntegerField()
    duration_turns = models.IntegerField()
    start_turn = models.IntegerField()
    end_turn = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reward_gold = models.IntegerField(default=0)
    reward_score = models.IntegerField(default=0)
    reward_trap_type = models.ForeignKey(TrapType, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.status})"


class GameSession(models.Model):
    STATUS_CHOICES = [
        ('setup', '布置阶段'),
        ('playing', '进行中'),
        ('won', '胜利'),
        ('lost', '失败'),
    ]

    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='sessions')
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='setup')
    current_turn = models.IntegerField(default=0)
    wall_health = models.IntegerField(default=100)
    max_wall_health = models.IntegerField(default=100)
    gold = models.IntegerField(default=100)
    score = models.IntegerField(default=0)
    enemies_killed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    client_checksum = models.CharField(max_length=64, blank=True, default='')
    server_checksum = models.CharField(max_length=64, blank=True, default='')

    def generate_server_checksum(self):
        data = {
            'session_id': self.id,
            'turn': self.current_turn,
            'wall_health': self.wall_health,
            'gold': self.gold,
            'score': self.score,
            'enemies_killed': self.enemies_killed,
            'trap_count': self.traps.count(),
            'status': self.status,
        }
        raw = json.dumps(data, sort_keys=True)
        return hashlib.sha256(raw.encode()).hexdigest()

    def validate_client(self, client_checksum):
        self.server_checksum = self.generate_server_checksum()
        self.save()
        return self.server_checksum == client_checksum

    def __str__(self):
        return f"Session {self.id} - {self.player.display_name} - Level {self.level.number}"


class Enemy(models.Model):
    TYPE_CHOICES = [
        ('grunt', '步兵'),
        ('fast', '快骑兵'),
        ('tank', '重装兵'),
        ('boss', 'BOSS'),
    ]

    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='enemies')
    enemy_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    health = models.IntegerField()
    max_health = models.IntegerField()
    speed = models.IntegerField(default=1)
    damage = models.IntegerField(default=10)
    position_x = models.FloatField(default=0)
    position_y = models.IntegerField()
    spawn_turn = models.IntegerField()
    is_alive = models.BooleanField(default=True)
    path_index = models.IntegerField(default=0)
    score_value = models.IntegerField(default=10)
    gold_value = models.IntegerField(default=5)

    def __str__(self):
        return f"{self.enemy_type} at ({self.position_x}, {self.position_y})"


class ActionHistory(models.Model):
    ACTION_TYPES = [
        ('place_trap', '放置陷阱'),
        ('remove_trap', '移除陷阱'),
        ('start_task', '开始任务'),
        ('complete_task', '完成任务'),
        ('next_turn', '下一回合'),
        ('start_attack', '开始进攻'),
        ('trigger_trap', '触发陷阱'),
        ('enemy_move', '敌人移动'),
        ('enemy_damage', '敌人受伤'),
        ('wall_damage', '城墙受伤'),
    ]

    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='history')
    turn = models.IntegerField()
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    details = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['turn', 'timestamp']

    def __str__(self):
        return f"Turn {self.turn}: {self.action_type}"


class BattleReport(models.Model):
    game_session = models.OneToOneField(GameSession, on_delete=models.CASCADE, related_name='report')
    title = models.CharField(max_length=200)
    summary = models.TextField()
    detailed_log = models.JSONField()
    final_score = models.IntegerField()
    gold_earned = models.IntegerField()
    enemies_killed = models.IntegerField()
    traps_used = models.IntegerField()
    tasks_completed = models.IntegerField()
    damage_to_wall = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ReplayFrame(models.Model):
    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='replay_frames')
    turn = models.IntegerField()
    frame_data = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['turn']

    def __str__(self):
        return f"Frame turn {self.turn} for session {self.game_session.id}"


class ScoreRecord(models.Model):
    player = models.ForeignKey(PlayerProfile, on_delete=models.CASCADE, related_name='score_records')
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='score_record')
    score = models.IntegerField()
    server_calculated_score = models.IntegerField(default=0)
    gold_earned = models.IntegerField(default=0)
    is_valid = models.BooleanField(default=True)
    validation_note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"{self.player.display_name} - Level {self.level.number}: {self.score}"

    def recalculate_score(self):
        session = self.game_session
        base_score = 0
        for enemy in session.enemies.filter(is_alive=False):
            base_score += enemy.score_value
        base_score += session.traps.count() * 20
        base_score += session.tasks.filter(status='completed').count() * 50
        if session.status == 'won':
            base_score += session.level.base_reward * 2
            base_score += int(session.wall_health * 2)
        if session.status == 'lost':
            base_score = int(base_score * 0.5)
        self.server_calculated_score = base_score
        self.is_valid = abs(self.score - base_score) <= 10
        if not self.is_valid:
            self.validation_note = f"分数异常: 上报={self.score}, 服务器计算={base_score}"
        self.save()
        return base_score
