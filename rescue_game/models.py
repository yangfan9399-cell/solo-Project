from django.db import models
from django.utils import timezone
import json


class TerrainType(models.TextChoices):
    ICE = 'ice', '冰面'
    ROCK = 'rock', '岩壁'
    SNOW_CORNICE = 'snow_cornice', '雪檐'


class NodeType(models.TextChoices):
    ANCHOR = 'anchor', '锚点'
    PULLEY = 'pulley', '滑轮'
    PROTECTION = 'protection', '保护站'
    KNOT = 'knot', '绳结'
    VICTIM = 'victim', '被困者'
    RESCUER = 'rescuer', '救援者'


class WeatherType(models.TextChoices):
    CLEAR = 'clear', '晴朗'
    SNOWFALL = 'snowfall', '降雪'
    WIND = 'wind', '强风'
    BLIZZARD = 'blizzard', '暴风雪'
    AVALANCHE_RISK = 'avalanche_risk', '雪崩风险'


class GameStatus(models.TextChoices):
    PREPARING = 'preparing', '准备中'
    PLAYING = 'playing', '进行中'
    PAUSED = 'paused', '已暂停'
    COMPLETED = 'completed', '已完成'
    FAILED = 'failed', '已失败'
    ROLLED_BACK = 'rolled_back', '已回滚'


class RescueSession(models.Model):
    session_id = models.CharField(max_length=64, unique=True, verbose_name='局次ID')
    player_name = models.CharField(max_length=100, default='玩家', verbose_name='玩家名称')
    status = models.CharField(max_length=20, choices=GameStatus.choices, default=GameStatus.PREPARING, verbose_name='游戏状态')
    terrain_type = models.CharField(max_length=20, choices=TerrainType.choices, default=TerrainType.ROCK, verbose_name='地形类型')
    weather = models.CharField(max_length=20, choices=WeatherType.choices, default=WeatherType.CLEAR, verbose_name='天气')
    difficulty = models.IntegerField(default=1, verbose_name='难度等级')
    start_time = models.DateTimeField(default=timezone.now, verbose_name='开始时间')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    total_score = models.FloatField(default=0, verbose_name='总得分')
    safety_score = models.FloatField(default=0, verbose_name='安全评分')
    speed_score = models.FloatField(default=0, verbose_name='速度评分')
    anchor_count = models.IntegerField(default=0, verbose_name='锚点数量')
    failure_reason = models.TextField(null=True, blank=True, verbose_name='失败原因')
    seed_type = models.CharField(max_length=50, null=True, blank=True, verbose_name='种子样本类型')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rescue_session'
        verbose_name = '救援局次（主记录）'
        verbose_name_plural = '救援局次（主记录）'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.session_id} - {self.get_status_display()}'


class RescueNode(models.Model):
    session = models.ForeignKey(RescueSession, on_delete=models.CASCADE, related_name='nodes', verbose_name='所属局次')
    node_type = models.CharField(max_length=20, choices=NodeType.choices, verbose_name='节点类型')
    node_id = models.CharField(max_length=64, verbose_name='节点标识')
    x = models.FloatField(verbose_name='X坐标')
    y = models.FloatField(verbose_name='Y坐标')
    terrain_type = models.CharField(max_length=20, choices=TerrainType.choices, verbose_name='所在地形')
    load_capacity = models.FloatField(default=0, verbose_name='承力值(KN)')
    actual_load = models.FloatField(default=0, verbose_name='实际受力(KN)')
    is_valid = models.BooleanField(default=True, verbose_name='是否有效')
    failure_reason = models.CharField(max_length=200, null=True, blank=True, verbose_name='失效原因')
    order_index = models.IntegerField(default=0, verbose_name='顺序索引')
    properties = models.TextField(default='{}', verbose_name='扩展属性')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rescue_node'
        verbose_name = '救援节点（明细记录-锚点）'
        verbose_name_plural = '救援节点（明细记录-锚点）'
        ordering = ['session', 'order_index']

    def __str__(self):
        return f'{self.get_node_type_display()} - {self.node_id}'

    def get_properties(self):
        return json.loads(self.properties)

    def set_properties(self, props):
        self.properties = json.dumps(props, ensure_ascii=False)


class RescueDetail(models.Model):
    session = models.ForeignKey(RescueSession, on_delete=models.CASCADE, related_name='details', verbose_name='所属局次')
    detail_type = models.CharField(max_length=20, choices=[('pulley', '滑轮'), ('protection', '保护站')], verbose_name='明细类型')
    detail_id = models.CharField(max_length=64, verbose_name='明细标识')
    node = models.ForeignKey(RescueNode, on_delete=models.SET_NULL, null=True, blank=True, related_name='details', verbose_name='关联节点')
    x = models.FloatField(verbose_name='X坐标')
    y = models.FloatField(verbose_name='Y坐标')
    load_capacity = models.FloatField(default=0, verbose_name='承力值(KN)')
    actual_load = models.FloatField(default=0, verbose_name='实际受力(KN)')
    efficiency = models.FloatField(default=1.0, verbose_name='效率系数')
    is_valid = models.BooleanField(default=True, verbose_name='是否有效')
    order_index = models.IntegerField(default=0, verbose_name='顺序索引')
    properties = models.TextField(default='{}', verbose_name='扩展属性')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rescue_detail'
        verbose_name = '救援明细（滑轮/保护站）'
        verbose_name_plural = '救援明细（滑轮/保护站）'
        ordering = ['session', 'order_index']

    def __str__(self):
        return f'{self.get_detail_type_display()} - {self.detail_id}'

    def get_properties(self):
        return json.loads(self.properties)

    def set_properties(self, props):
        self.properties = json.dumps(props, ensure_ascii=False)


class RescueHistory(models.Model):
    session = models.ForeignKey(RescueSession, on_delete=models.CASCADE, related_name='histories', verbose_name='所属局次')
    step = models.IntegerField(verbose_name='步骤序号')
    action = models.CharField(max_length=100, verbose_name='动作描述')
    action_type = models.CharField(max_length=50, verbose_name='动作类型')
    victim_x = models.FloatField(verbose_name='被困者X坐标')
    victim_y = models.FloatField(verbose_name='被困者Y坐标')
    rescuer_x = models.FloatField(null=True, blank=True, verbose_name='救援者X坐标')
    rescuer_y = models.FloatField(null=True, blank=True, verbose_name='救援者Y坐标')
    weather = models.CharField(max_length=20, choices=WeatherType.choices, default=WeatherType.CLEAR, verbose_name='当时天气')
    rope_tension = models.FloatField(default=0, verbose_name='绳索张力(KN)')
    is_safe = models.BooleanField(default=True, verbose_name='是否安全')
    remark = models.TextField(null=True, blank=True, verbose_name='备注')
    timestamp = models.DateTimeField(default=timezone.now, verbose_name='时间戳')
    state_snapshot = models.TextField(default='{}', verbose_name='状态快照')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rescue_history'
        verbose_name = '救援历史（转移过程）'
        verbose_name_plural = '救援历史（转移过程）'
        ordering = ['session', 'step']

    def __str__(self):
        return f'步骤{self.step}: {self.action}'

    def get_state_snapshot(self):
        return json.loads(self.state_snapshot)

    def set_state_snapshot(self, state):
        self.state_snapshot = json.dumps(state, ensure_ascii=False)


class RescueResult(models.Model):
    session = models.OneToOneField(RescueSession, on_delete=models.CASCADE, related_name='result', verbose_name='所属局次')
    terrain_ice_load = models.FloatField(default=0, verbose_name='冰面承力(KN)')
    terrain_rock_load = models.FloatField(default=0, verbose_name='岩壁承力(KN)')
    terrain_snow_load = models.FloatField(default=0, verbose_name='雪檐承力(KN)')
    max_tension = models.FloatField(default=0, verbose_name='最大张力(KN)')
    avg_tension = models.FloatField(default=0, verbose_name='平均张力(KN)')
    safety_factor = models.FloatField(default=0, verbose_name='安全系数')
    transfer_distance = models.FloatField(default=0, verbose_name='转移距离')
    total_time = models.FloatField(default=0, verbose_name='总用时(秒)')
    nodes_valid = models.IntegerField(default=0, verbose_name='有效节点数')
    nodes_failed = models.IntegerField(default=0, verbose_name='失效节点数')
    weather_events = models.IntegerField(default=0, verbose_name='天气事件数')
    final_score = models.FloatField(default=0, verbose_name='最终得分')
    safety_score = models.FloatField(default=0, verbose_name='安全评分')
    speed_score = models.FloatField(default=0, verbose_name='速度评分')
    technique_score = models.FloatField(default=0, verbose_name='技术评分')
    grade = models.CharField(max_length=10, default='C', verbose_name='评级')
    evaluation = models.TextField(null=True, blank=True, verbose_name='评价')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'rescue_result'
        verbose_name = '救援结果（承力记录）'
        verbose_name_plural = '救援结果（承力记录）'

    def __str__(self):
        return f'{self.session.session_id} - 得分:{self.final_score}'


class SeedSample(models.Model):
    name = models.CharField(max_length=100, verbose_name='样本名称')
    seed_type = models.CharField(max_length=50, unique=True, verbose_name='样本类型')
    description = models.TextField(verbose_name='样本描述')
    terrain_type = models.CharField(max_length=20, choices=TerrainType.choices, verbose_name='地形类型')
    weather = models.CharField(max_length=20, choices=WeatherType.choices, verbose_name='初始天气')
    difficulty = models.IntegerField(default=1, verbose_name='难度')
    victim_x = models.FloatField(verbose_name='被困者初始X')
    victim_y = models.FloatField(verbose_name='被困者初始Y')
    target_x = models.FloatField(verbose_name='目标点X')
    target_y = models.FloatField(verbose_name='目标点Y')
    terrain_map = models.TextField(default='{}', verbose_name='地形地图数据')
    preset_nodes = models.TextField(default='[]', verbose_name='预设节点')
    weather_events = models.TextField(default='[]', verbose_name='天气事件序列')
    expected_outcome = models.CharField(max_length=50, verbose_name='预期结果')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'seed_sample'
        verbose_name = '种子样本'
        verbose_name_plural = '种子样本'

    def __str__(self):
        return self.name

    def _safe_json_load(self, text):
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            import ast
            try:
                data = ast.literal_eval(text)
                return data
            except Exception:
                return []

    def get_terrain_map(self):
        return self._safe_json_load(self.terrain_map)

    def get_preset_nodes(self):
        return self._safe_json_load(self.preset_nodes)

    def get_weather_events(self):
        return self._safe_json_load(self.weather_events)
