from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import json


class Player(AbstractUser):
    """玩家模型"""
    nickname = models.CharField(max_length=50, blank=True, default='列车厨师')
    avatar = models.CharField(max_length=100, default='👨‍🍳')
    total_score = models.IntegerField(default=0)
    games_played = models.IntegerField(default=0)
    games_won = models.IntegerField(default=0)
    highest_level = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'player'

    def save(self, *args, **kwargs):
        if not self.nickname:
            self.nickname = self.username
        super().save(*args, **kwargs)


class Level(models.Model):
    """关卡模型"""
    level_number = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    difficulty = models.CharField(max_length=20, choices=[
        ('easy', '简单'),
        ('normal', '普通'),
        ('hard', '困难'),
        ('expert', '专家')
    ], default='normal')
    target_score = models.IntegerField(default=1000)
    max_orders = models.IntegerField(default=5)
    station_count = models.IntegerField(default=3)
    station_interval = models.IntegerField(default=60)
    carriages_count = models.IntegerField(default=3)
    time_limit = models.IntegerField(default=300)
    is_active = models.BooleanField(default=True)
    unlocked_by_default = models.BooleanField(default=True)

    class Meta:
        db_table = 'level'
        ordering = ['level_number']

    def __str__(self):
        return f"第{self.level_number}关: {self.name}"


class Station(models.Model):
    """站点模型"""
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='stations')
    station_number = models.IntegerField()
    name = models.CharField(max_length=50)
    arrival_time = models.IntegerField(default=0)
    departure_time = models.IntegerField(default=60)
    order_intensity = models.FloatField(default=1.0)

    class Meta:
        db_table = 'station'
        unique_together = ('level', 'station_number')
        ordering = ['station_number']

    def __str__(self):
        return self.name


class Carriage(models.Model):
    """车厢模型"""
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='carriages')
    carriage_number = models.IntegerField()
    name = models.CharField(max_length=50)
    distance_from_kitchen = models.IntegerField(default=1)
    carriage_type = models.CharField(max_length=20, choices=[
        ('economy', '硬座'),
        ('soft', '软座'),
        ('sleeper', '卧铺'),
        ('vip', '豪华包厢')
    ], default='economy')
    tip_multiplier = models.FloatField(default=1.0)

    class Meta:
        db_table = 'carriage'
        unique_together = ('level', 'carriage_number')
        ordering = ['carriage_number']

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    """食材模型"""
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=10, default='🥗')
    prep_time = models.IntegerField(default=5)
    heat_time = models.IntegerField(default=10)
    cost = models.IntegerField(default=10)
    category = models.CharField(max_length=20, choices=[
        ('vegetable', '蔬菜'),
        ('meat', '肉类'),
        ('staple', '主食'),
        ('soup', '汤品'),
        ('drink', '饮品'),
        ('dessert', '甜点')
    ], default='vegetable')

    class Meta:
        db_table = 'ingredient'

    def __str__(self):
        return self.name


class Recipe(models.Model):
    """菜品配方模型"""
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=10, default='🍽️')
    ingredients = models.ManyToManyField(Ingredient, through='RecipeIngredient')
    base_price = models.IntegerField(default=30)
    cook_time = models.IntegerField(default=15)
    category = models.CharField(max_length=20, choices=[
        ('breakfast', '早餐'),
        ('lunch', '午餐'),
        ('dinner', '晚餐'),
        ('snack', '小吃'),
        ('set', '套餐')
    ], default='lunch')

    class Meta:
        db_table = 'recipe'

    def __str__(self):
        return self.name


class RecipeIngredient(models.Model):
    """配方-食材关联"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)

    class Meta:
        db_table = 'recipe_ingredient'
        unique_together = ('recipe', 'ingredient')


class OrderTemplate(models.Model):
    """订单模板"""
    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='order_templates')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    carriage = models.ForeignKey(Carriage, on_delete=models.CASCADE)
    priority = models.CharField(max_length=20, choices=[
        ('normal', '普通'),
        ('vip', 'VIP'),
        ('urgent', '紧急')
    ], default='normal')
    weight = models.IntegerField(default=10)
    time_limit = models.IntegerField(default=120)

    class Meta:
        db_table = 'order_template'


class GameSession(models.Model):
    """游戏局次记录"""
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='sessions')
    level = models.ForeignKey(Level, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[
        ('playing', '进行中'),
        ('paused', '已暂停'),
        ('won', '通关'),
        ('lost', '失败'),
        ('abandoned', '放弃')
    ], default='playing')
    score = models.IntegerField(default=0)
    money = models.IntegerField(default=0)
    orders_completed = models.IntegerField(default=0)
    orders_failed = models.IntegerField(default=0)
    current_station = models.IntegerField(default=0)
    current_time = models.IntegerField(default=0)
    game_state = models.TextField(default='{}')

    class Meta:
        db_table = 'game_session'
        ordering = ['-start_time']

    def get_game_state(self):
        return json.loads(self.game_state)

    def set_game_state(self, state):
        self.game_state = json.dumps(state, ensure_ascii=False)


class Order(models.Model):
    """实时订单"""
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='orders')
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE)
    carriage = models.ForeignKey(Carriage, on_delete=models.CASCADE)
    priority = models.CharField(max_length=20, choices=[
        ('normal', '普通'),
        ('vip', 'VIP'),
        ('urgent', '紧急')
    ], default='normal')
    status = models.CharField(max_length=20, choices=[
        ('pending', '待处理'),
        ('preparing', '备料中'),
        ('cooking', '烹饪中'),
        ('ready', '待配送'),
        ('delivering', '配送中'),
        ('completed', '已完成'),
        ('failed', '已失败'),
        ('cancelled', '已取消')
    ], default='pending')
    created_at = models.IntegerField(default=0)
    time_limit = models.IntegerField(default=120)
    completed_at = models.IntegerField(null=True, blank=True)
    base_price = models.IntegerField(default=30)
    final_price = models.IntegerField(default=0)
    tip = models.IntegerField(default=0)

    class Meta:
        db_table = 'order'
        ordering = ['-created_at']


class Preparation(models.Model):
    """备料/烹饪任务"""
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='preparations')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='preparations')
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE, null=True, blank=True)
    task_type = models.CharField(max_length=20, choices=[
        ('prep', '备料'),
        ('heat', '加热'),
        ('cook', '烹饪'),
        ('plate', '装盘')
    ])
    status = models.CharField(max_length=20, choices=[
        ('queued', '队列中'),
        ('processing', '处理中'),
        ('completed', '已完成'),
        ('cancelled', '已取消')
    ], default='queued')
    start_time = models.IntegerField(default=0)
    duration = models.IntegerField(default=10)
    station_index = models.IntegerField(default=0)

    class Meta:
        db_table = 'preparation'


class Delivery(models.Model):
    """配送任务"""
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='deliveries')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='deliveries')
    carriage = models.ForeignKey(Carriage, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=[
        ('pending', '待出发'),
        ('delivering', '配送中'),
        ('delivered', '已送达'),
        ('returning', '返程中'),
        ('completed', '已完成'),
        ('failed', '失败')
    ], default='pending')
    start_time = models.IntegerField(default=0)
    travel_time = models.IntegerField(default=10)
    return_time = models.IntegerField(default=10)
    waiter_id = models.IntegerField(default=1)

    class Meta:
        db_table = 'delivery'


class ActionHistory(models.Model):
    """操作历史记录 - 用于游戏恢复"""
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='action_history')
    action_type = models.CharField(max_length=50)
    action_data = models.TextField(default='{}')
    game_time = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    sequence = models.IntegerField(default=0)

    class Meta:
        db_table = 'action_history'
        ordering = ['sequence']

    def get_action_data(self):
        return json.loads(self.action_data)

    def set_action_data(self, data):
        self.action_data = json.dumps(data, ensure_ascii=False)


class Settlement(models.Model):
    """结算记录"""
    session = models.OneToOneField(GameSession, on_delete=models.CASCADE, related_name='settlement')
    total_income = models.IntegerField(default=0)
    total_cost = models.IntegerField(default=0)
    total_tip = models.IntegerField(default=0)
    orders_completed = models.IntegerField(default=0)
    orders_failed = models.IntegerField(default=0)
    perfect_orders = models.IntegerField(default=0)
    late_orders = models.IntegerField(default=0)
    efficiency_score = models.IntegerField(default=0)
    speed_score = models.IntegerField(default=0)
    quality_score = models.IntegerField(default=0)
    final_score = models.IntegerField(default=0)
    star_rating = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    recalculated = models.BooleanField(default=False)

    class Meta:
        db_table = 'settlement'
