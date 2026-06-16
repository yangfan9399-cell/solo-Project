import json
from django.db import models


class Player(models.Model):
    name = models.CharField(max_length=64, unique=True)
    current_level = models.PositiveIntegerField(default=1)
    total_revenue = models.IntegerField(default=0)
    total_rounds = models.PositiveIntegerField(default=0)
    best_score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Level(models.Model):
    DIFFICULTY_CHOICES = [
        (1, '学徒'),
        (2, '匠人'),
        (3, '大师'),
    ]
    level_number = models.PositiveIntegerField(unique=True)
    title = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    target_text = models.TextField()
    difficulty = models.PositiveIntegerField(choices=DIFFICULTY_CHOICES, default=1)
    time_limit = models.PositiveIntegerField(default=120)
    ink_budget = models.PositiveIntegerField(default=100)
    pass_score = models.PositiveIntegerField(default=60)
    error_penalty = models.PositiveIntegerField(default=5)
    inverted_penalty = models.PositiveIntegerField(default=8)
    ink_waste_penalty = models.PositiveIntegerField(default=2)
    base_reward = models.PositiveIntegerField(default=100)
    char_pool = models.TextField(default='[]')

    def __str__(self):
        return f"第{self.level_number}关 - {self.title}"


class Round(models.Model):
    STATUS_CHOICES = [
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('failed', '已失败'),
        ('abandoned', '已放弃'),
    ]
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='rounds')
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='rounds')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    arranged_text = models.TextField(default='')
    ink_used = models.PositiveIntegerField(default=0)
    proofread_count = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    elapsed_seconds = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.player.name} - 第{self.level.level_number}关 ({self.status})"


class Operation(models.Model):
    OP_TYPE_CHOICES = [
        ('pick_char', '取字'),
        ('place_char', '放字'),
        ('swap_char', '换字'),
        ('remove_char', '删字'),
        ('adjust_ink', '调墨'),
        ('proofread', '校对'),
        ('flip_char', '翻字'),
    ]
    round = models.ForeignKey(Round, on_delete=models.CASCADE, related_name='operations')
    op_type = models.CharField(max_length=20, choices=OP_TYPE_CHOICES)
    position = models.PositiveIntegerField(null=True, blank=True)
    char_value = models.CharField(max_length=4, blank=True)
    old_char = models.CharField(max_length=4, blank=True)
    ink_delta = models.IntegerField(default=0)
    data_json = models.TextField(default='{}')
    created_at = models.DateTimeField(auto_now_add=True)
    seq = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['seq']

    def __str__(self):
        return f"Round {self.round_id} - {self.get_op_type_display()}"

    @property
    def data(self):
        return json.loads(self.data_json)

    @data.setter
    def data(self, value):
        self.data_json = json.dumps(value, ensure_ascii=False)


class OrderEvaluation(models.Model):
    round = models.OneToOneField(Round, on_delete=models.CASCADE, related_name='evaluation')
    accuracy = models.FloatField(default=0.0)
    wrong_char_count = models.PositiveIntegerField(default=0)
    inverted_char_count = models.PositiveIntegerField(default=0)
    missing_char_count = models.PositiveIntegerField(default=0)
    extra_char_count = models.PositiveIntegerField(default=0)
    ink_efficiency = models.FloatField(default=0.0)
    ink_waste = models.PositiveIntegerField(default=0)
    time_bonus = models.FloatField(default=0.0)
    proofread_bonus = models.FloatField(default=0.0)
    raw_score = models.FloatField(default=0.0)
    final_score = models.FloatField(default=0.0)
    revenue = models.IntegerField(default=0)
    passed = models.BooleanField(default=False)
    server_calculated = models.BooleanField(default=False)
    calculated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"评价: {self.round} - {self.final_score}分 ({'通过' if self.passed else '未通过'})"
