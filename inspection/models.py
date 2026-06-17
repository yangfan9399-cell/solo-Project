from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class CrystallizationPool(models.Model):
    POOL_STATUS = (
        ('active', '生产中'),
        ('idle', '闲置'),
        ('maintenance', '维护中'),
        ('repair', '抢修中'),
    )

    POOL_GROUP = (
        ('A', 'A组'),
        ('B', 'B组'),
        ('C', 'C组'),
        ('D', 'D组'),
    )

    pool_code = models.CharField('池号', max_length=20, unique=True)
    pool_name = models.CharField('池名', max_length=50, blank=True)
    pool_group = models.CharField('池组', max_length=2, choices=POOL_GROUP, default='A')
    area = models.DecimalField('面积(亩)', max_digits=6, decimal_places=2, default=0)
    position_x = models.FloatField('地图X坐标', default=0.0)
    position_y = models.FloatField('地图Y坐标', default=0.0)
    status = models.CharField('状态', max_length=20, choices=POOL_STATUS, default='active')
    build_date = models.DateField('建成日期', null=True, blank=True)
    depth_cm = models.DecimalField('池深(cm)', max_digits=5, decimal_places=1, default=30)
    remarks = models.TextField('备注', max_length=500, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'crystallization_pool'
        verbose_name = '结晶池'
        verbose_name_plural = verbose_name
        ordering = ['pool_code']

    def __str__(self):
        return f'{self.pool_code} {self.pool_name}'.strip()


class InspectionRecord(models.Model):
    SURFACE_STATUS = (
        ('normal', '正常'),
        ('leaking', '渗漏'),
        ('cracked', '开裂'),
        ('flooded', '积水'),
        ('dirty', '污染'),
        ('crystallized', '结晶完好'),
    )

    WEATHER_TYPE = (
        ('sunny', '晴'),
        ('cloudy', '多云'),
        ('overcast', '阴'),
        ('rainy', '雨'),
        ('storm', '暴雨'),
        ('foggy', '雾'),
    )

    WIND_LEVEL = (
        ('0', '无风'),
        ('1-2', '1-2级'),
        ('3-4', '3-4级'),
        ('5-6', '5-6级'),
        ('7+', '7级以上'),
    )

    pool = models.ForeignKey(CrystallizationPool, on_delete=models.CASCADE, verbose_name='结晶池', related_name='inspections')
    inspection_date = models.DateField('巡检日期', default=timezone.localdate)
    inspection_time = models.TimeField('巡检时间', default=timezone.localtime)
    inspector = models.CharField('巡检员', max_length=50, default='系统')
    batch_no = models.CharField('批次号', max_length=30, blank=True, db_index=True)

    brine_concentration = models.DecimalField('卤水浓度(°Bé)', max_digits=5, decimal_places=2, help_text='波美度，正常25-30')
    brine_depth_cm = models.DecimalField('卤水深度(cm)', max_digits=5, decimal_places=1, default=0)
    crystal_thickness_mm = models.DecimalField('结晶层厚度(mm)', max_digits=6, decimal_places=1, default=0)

    surface_status = models.CharField('池面状态', max_length=20, choices=SURFACE_STATUS, default='normal')
    surface_photo = models.ImageField('池面照片', upload_to='inspection/', blank=True, null=True)

    weather_type = models.CharField('天气', max_length=20, choices=WEATHER_TYPE, default='sunny')
    temperature = models.DecimalField('气温(℃)', max_digits=4, decimal_places=1, default=25.0)
    humidity = models.DecimalField('湿度(%)', max_digits=5, decimal_places=1, default=60.0)
    wind_level = models.CharField('风力', max_length=10, choices=WIND_LEVEL, default='3-4')
    wind_direction = models.CharField('风向', max_length=10, blank=True)

    salt_yield = models.DecimalField('本次收盐量(吨)', max_digits=10, decimal_places=3, default=0)
    cumulative_yield = models.DecimalField('累计产量(吨)', max_digits=12, decimal_places=3, default=0)

    ph_value = models.DecimalField('pH值', max_digits=4, decimal_places=2, null=True, blank=True)
    impurity_level = models.CharField('杂质等级', max_length=20, blank=True, choices=(
        ('excellent', '优级'), ('good', '一级'), ('normal', '二级'), ('poor', '等外'),
    ))

    has_anomaly = models.BooleanField('存在异常', default=False)
    anomaly_description = models.TextField('异常描述', max_length=1000, blank=True)
    handling_measures = models.TextField('处理措施', max_length=1000, blank=True)

    remarks = models.TextField('备注', max_length=1000, blank=True)
    version = models.IntegerField('当前版本号', default=1)
    is_latest = models.BooleanField('是否最新版本', default=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='创建人', related_name='+')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'inspection_record'
        verbose_name = '巡检记录'
        verbose_name_plural = verbose_name
        ordering = ['-inspection_date', '-inspection_time']
        indexes = [
            models.Index(fields=['pool', 'inspection_date']),
            models.Index(fields=['batch_no']),
            models.Index(fields=['has_anomaly']),
        ]

    def __str__(self):
        return f'{self.pool.pool_code} {self.inspection_date} 浓度{self.brine_concentration}°Bé'

    def save(self, *args, **kwargs):
        concentration = float(self.brine_concentration) if self.brine_concentration else 0
        surface_normal = self.surface_status in ('normal', 'crystallized')
        temp = float(self.temperature) if self.temperature else 25
        anomaly = False
        reasons = []
        if concentration < 20 or concentration > 32:
            anomaly = True
            reasons.append(f'浓度异常({concentration}°Bé)')
        if not surface_normal:
            anomaly = True
            reasons.append(f'池面{self.get_surface_status_display()}')
        if temp > 40:
            anomaly = True
            reasons.append(f'高温({temp}℃)')
        if self.salt_yield and float(self.salt_yield) < 0:
            anomaly = True
            reasons.append('收盐量异常')
        self.has_anomaly = anomaly
        if anomaly and reasons:
            existing = self.anomaly_description or ''
            new_desc = '；'.join(reasons)
            if new_desc not in existing:
                self.anomaly_description = new_desc + ('；' + existing if existing else '')
        super().save(*args, **kwargs)


class RecordVersion(models.Model):
    ACTION_CHOICES = (
        ('create', '创建'),
        ('update', '修改'),
        ('revise', '修正'),
        ('revert', '回滚'),
    )

    record = models.ForeignKey(InspectionRecord, on_delete=models.CASCADE, verbose_name='巡检记录', related_name='versions')
    version_no = models.IntegerField('版本号')
    action = models.CharField('操作类型', max_length=20, choices=ACTION_CHOICES, default='update')
    change_summary = models.TextField('变更摘要', max_length=1000, blank=True)
    snapshot = models.JSONField('数据快照', default=dict, blank=True)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='操作人')
    changed_at = models.DateTimeField('变更时间', default=timezone.now)

    class Meta:
        db_table = 'record_version'
        verbose_name = '版本历史'
        verbose_name_plural = verbose_name
        ordering = ['-version_no']
        unique_together = ('record', 'version_no')

    def __str__(self):
        return f'记录#{self.record_id} v{self.version_no}'


class AnomalyAlert(models.Model):
    SEVERITY = (
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('critical', '严重'),
    )

    STATUS = (
        ('open', '待处理'),
        ('processing', '处理中'),
        ('resolved', '已解决'),
        ('ignored', '忽略'),
    )

    ANOMALY_TYPE = (
        ('concentration', '浓度异常'),
        ('surface', '池面异常'),
        ('weather', '天气异常'),
        ('yield', '产量异常'),
        ('equipment', '设备异常'),
        ('other', '其他'),
    )

    pool = models.ForeignKey(CrystallizationPool, on_delete=models.CASCADE, verbose_name='结晶池', related_name='alerts')
    record = models.ForeignKey(InspectionRecord, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='关联巡检', related_name='alerts')
    anomaly_type = models.CharField('异常类型', max_length=30, choices=ANOMALY_TYPE, default='other')
    severity = models.CharField('严重程度', max_length=20, choices=SEVERITY, default='medium')
    title = models.CharField('异常标题', max_length=200)
    description = models.TextField('详细描述', max_length=2000, blank=True)
    status = models.CharField('处理状态', max_length=20, choices=STATUS, default='open')
    detected_at = models.DateTimeField('发现时间', default=timezone.now)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)
    handler = models.CharField('处理人', max_length=50, blank=True)
    resolution = models.TextField('解决方案', max_length=2000, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'anomaly_alert'
        verbose_name = '异常告警'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.get_severity_display()}] {self.title}'
