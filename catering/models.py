from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class Role(models.TextChoices):
    CATERING_CLERK = 'catering_clerk', '配餐经办人'
    QC_OFFICER = 'qc_officer', '品控员'
    CABIN_CREW = 'cabin_crew', '机供人员'
    DUTY_MANAGER = 'duty_manager', '值班经理'


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CATERING_CLERK)
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'


class Airline(models.Model):
    name = models.CharField(max_length=100, verbose_name='航空公司名称')
    code = models.CharField(max_length=10, unique=True, verbose_name='航司代码')
    logo_url = models.URLField(blank=True, null=True, verbose_name='Logo')

    class Meta:
        verbose_name = '航空公司'
        verbose_name_plural = '航空公司'
        ordering = ['name']

    def __str__(self):
        return f'{self.code} - {self.name}'


class Flight(models.Model):
    flight_number = models.CharField(max_length=20, unique=True, verbose_name='航班号')
    airline = models.ForeignKey(Airline, on_delete=models.CASCADE, related_name='flights', verbose_name='航空公司')
    departure = models.CharField(max_length=50, verbose_name='出发地')
    destination = models.CharField(max_length=50, verbose_name='目的地')
    departure_time = models.DateTimeField(verbose_name='计划起飞时间')
    aircraft_type = models.CharField(max_length=50, blank=True, null=True, verbose_name='机型')
    passenger_count = models.IntegerField(default=0, verbose_name='载客量')

    class Meta:
        verbose_name = '航班'
        verbose_name_plural = '航班'
        ordering = ['-departure_time']

    def __str__(self):
        return self.flight_number


class MealCategory(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='餐食类别')
    description = models.TextField(blank=True, null=True, verbose_name='描述')

    class Meta:
        verbose_name = '餐食类别'
        verbose_name_plural = '餐食类别'
        ordering = ['name']

    def __str__(self):
        return self.name


class Allergen(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='过敏源名称')
    icon = models.CharField(max_length=20, blank=True, null=True, verbose_name='图标')
    description = models.TextField(blank=True, null=True, verbose_name='说明')

    class Meta:
        verbose_name = '过敏源'
        verbose_name_plural = '过敏源'
        ordering = ['name']

    def __str__(self):
        return self.name


class BatchStatus(models.TextChoices):
    CREATED = 'created', '已创建'
    PRODUCED = 'produced', '生产完成'
    IN_COLD_STORAGE = 'in_cold_storage', '冷藏中'
    QC_PENDING = 'qc_pending', '待品控复核'
    QC_PASSED = 'qc_passed', '品控通过'
    QC_FAILED = 'qc_failed', '品控不通过'
    LOADING = 'loading', '装机中'
    LOADED = 'loaded', '已装机'
    RETURNED = 'returned', '已退回'
    RECALLED = 'recalled', '已召回'
    CONSUMED = 'consumed', '已食用'


class AnomalyType(models.TextChoices):
    NONE = 'none', '无异常'
    ALLERGEN_MISSING = 'allergen_missing', '过敏源标识缺失'
    COLD_STORAGE_TIMEOUT = 'cold_storage_timeout', '冷藏超时'
    FLIGHT_MEAL_CHANGE = 'flight_meal_change', '航班临时换餐'
    TEMPERATURE_ABNORMAL = 'temperature_abnormal', '温度异常'
    LABEL_DAMAGED = 'label_damaged', '标签损坏'
    OTHER = 'other', '其他异常'


class MealBatch(models.Model):
    batch_number = models.CharField(max_length=50, unique=True, verbose_name='批次号')
    meal_category = models.ForeignKey(MealCategory, on_delete=models.PROTECT, related_name='batches', verbose_name='餐食类别')
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='meal_batches', verbose_name='航班')
    quantity = models.IntegerField(verbose_name='数量（份）')
    production_time = models.DateTimeField(verbose_name='生产时间')
    shelf_life_hours = models.IntegerField(default=24, verbose_name='保质期（小时）')
    allergens = models.ManyToManyField(Allergen, blank=True, related_name='batches', verbose_name='所含过敏源')
    allergen_label_verified = models.BooleanField(default=False, verbose_name='过敏源标识已复核')
    allergen_label_missing = models.BooleanField(default=False, verbose_name='过敏源标识缺失')
    status = models.CharField(max_length=20, choices=BatchStatus.choices, default=BatchStatus.CREATED, verbose_name='状态')
    anomaly_type = models.CharField(max_length=30, choices=AnomalyType.choices, default=AnomalyType.NONE, verbose_name='异常类型')
    remarks = models.TextField(blank=True, null=True, verbose_name='备注')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_batches', verbose_name='创建人')
    qc_officer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='qc_batches', verbose_name='品控员')
    qc_time = models.DateTimeField(null=True, blank=True, verbose_name='品控时间')
    loaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='loaded_batches', verbose_name='装机人')
    load_time = models.DateTimeField(null=True, blank=True, verbose_name='装机时间')
    cold_storage_start = models.DateTimeField(null=True, blank=True, verbose_name='冷藏开始时间')
    cold_storage_end = models.DateTimeField(null=True, blank=True, verbose_name='冷藏结束时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '餐食批次'
        verbose_name_plural = '餐食批次'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.batch_number} - {self.meal_category.name}'

    @property
    def is_cold_storage_overtime(self):
        if self.cold_storage_start and self.cold_storage_end:
            duration = (self.cold_storage_end - self.cold_storage_start).total_seconds() / 3600
            return duration > 12
        return False

    @property
    def current_temperature(self):
        latest = self.temperature_records.order_by('-recorded_at').first()
        return latest.temperature if latest else None

    @property
    def can_load(self):
        return (
            self.status == BatchStatus.QC_PASSED and
            self.allergen_label_verified and
            not self.allergen_label_missing and
            not self.is_cold_storage_overtime
        )

    @property
    def latest_recall(self):
        return self.recalls.first()

    @property
    def is_returned_for_qc(self):
        if self.status != BatchStatus.QC_PENDING:
            return False
        latest_history = self.history.first()
        return latest_history and latest_history.action == '退回待重新品控'

    @property
    def is_scrapped(self):
        if self.status != BatchStatus.RETURNED:
            return False
        latest_history = self.history.first()
        return latest_history and latest_history.action == '退回报废'

    def add_history(self, action, user, description=''):
        BatchHistory.objects.create(
            batch=self,
            action=action,
            user=user,
            description=description,
        )


class TemperatureRecord(models.Model):
    batch = models.ForeignKey(MealBatch, on_delete=models.CASCADE, related_name='temperature_records', verbose_name='批次')
    temperature = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='温度（℃）')
    recorded_at = models.DateTimeField(default=timezone.now, verbose_name='记录时间')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='记录人')
    location = models.CharField(max_length=50, blank=True, null=True, verbose_name='记录位置')

    class Meta:
        verbose_name = '温度记录'
        verbose_name_plural = '温度记录'
        ordering = ['-recorded_at']

    def __str__(self):
        return f'{self.batch.batch_number} - {self.temperature}℃'


class BatchHistory(models.Model):
    batch = models.ForeignKey(MealBatch, on_delete=models.CASCADE, related_name='history', verbose_name='批次')
    action = models.CharField(max_length=50, verbose_name='操作')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    description = models.TextField(blank=True, null=True, verbose_name='详细描述')
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='时间')

    class Meta:
        verbose_name = '批次历史'
        verbose_name_plural = '批次历史'
        ordering = ['-timestamp']

    def __str__(self):
        return f'{self.batch.batch_number} - {self.action}'


class RecallRecord(models.Model):
    batch = models.ForeignKey(MealBatch, on_delete=models.CASCADE, related_name='recalls', verbose_name='批次')
    reason = models.CharField(max_length=200, verbose_name='召回原因')
    anomaly_type = models.CharField(max_length=30, choices=AnomalyType.choices, verbose_name='异常类型')
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='initiated_recalls', verbose_name='发起人')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_recalls', verbose_name='处理人')
    initiated_at = models.DateTimeField(auto_now_add=True, verbose_name='发起时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')
    resolution = models.TextField(blank=True, null=True, verbose_name='处理结果')
    is_resolved = models.BooleanField(default=False, verbose_name='是否解决')

    class Meta:
        verbose_name = '召回记录'
        verbose_name_plural = '召回记录'
        ordering = ['-initiated_at']

    @property
    def handling_duration(self):
        if self.resolved_at:
            return self.resolved_at - self.initiated_at
        return None

    def __str__(self):
        return f'召回 - {self.batch.batch_number}'
