from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal


class User(AbstractUser):
    ROLE_CHOICES = (
        ('reader', '抄表员'),
        ('reviewer', '复核员'),
        ('admin', '管理员'),
    )
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='reader')
    phone = models.CharField('联系电话', max_length=20, blank=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'


class District(models.Model):
    name = models.CharField('片区名称', max_length=100, unique=True)
    code = models.CharField('片区编码', max_length=20, unique=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='片区负责人', limit_choices_to={'role': 'reader'})

    class Meta:
        verbose_name = '片区'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class Customer(models.Model):
    customer_no = models.CharField('用户编号', max_length=50, unique=True)
    name = models.CharField('用户姓名', max_length=100)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    address = models.CharField('用户地址', max_length=200)
    meter_no = models.CharField('水表编号', max_length=50, unique=True)
    district = models.ForeignKey(District, on_delete=models.PROTECT, verbose_name='所属片区')
    water_price = models.DecimalField('水价(元/吨)', max_digits=10, decimal_places=2, default=Decimal('5.00'))
    is_active = models.BooleanField('是否在用', default=True)

    class Meta:
        verbose_name = '用户信息'
        verbose_name_plural = verbose_name
        ordering = ['customer_no']

    def __str__(self):
        return f'{self.customer_no} - {self.name}'


class AnomalyType(models.Model):
    code = models.CharField('异常编码', max_length=20, unique=True)
    name = models.CharField('异常名称', max_length=50, unique=True)
    description = models.TextField('异常描述', blank=True)
    block_adjustment = models.BooleanField('是否阻断费用调整', default=False)
    check_fields = models.TextField('需核对字段', blank=True, help_text='多个字段用逗号分隔')
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        verbose_name = '异常类型'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class MeterReading(models.Model):
    STATUS_CHOICES = (
        ('pending', '待处理'),
        ('reading', '抄表员处理中'),
        ('reviewing', '复核员处理中'),
        ('adjusted', '已调整'),
        ('returned', '已退回'),
        ('archived', '已归档'),
    )

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, verbose_name='用户')
    reading_date = models.DateField('抄表日期')
    last_reading = models.DecimalField('上期读数', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    current_reading = models.DecimalField('本期读数', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    adjusted_reading = models.DecimalField('调整后读数', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    usage = models.DecimalField('用水量(吨)', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    adjusted_usage = models.DecimalField('调整后用水量(吨)', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    original_fee = models.DecimalField('原始费用(元)', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    adjusted_fee = models.DecimalField('调整后费用(元)', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True)
    anomaly_type = models.ForeignKey(AnomalyType, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='异常类型')
    anomaly_detail = models.TextField('异常说明', blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    current_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_readings', verbose_name='当前责任人')
    assigned_reader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_readings', verbose_name='指派抄表员', limit_choices_to={'role': 'reader'})
    rework_count = models.IntegerField('返工次数', default=0)
    adjustment_basis = models.TextField('调整依据', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '抄表记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.customer.customer_no} - {self.reading_date}'

    def calculate_usage(self):
        return max(self.current_reading - self.last_reading, 0)

    def calculate_fee(self, usage=None):
        if usage is None:
            usage = self.calculate_usage()
        return usage * self.customer.water_price

    def save(self, *args, **kwargs):
        if self.usage is None or self.usage == 0:
            self.usage = self.calculate_usage()
        if self.original_fee is None or self.original_fee == 0:
            self.original_fee = self.calculate_fee()
        super().save(*args, **kwargs)


class FieldNote(models.Model):
    reading = models.ForeignKey(MeterReading, on_delete=models.CASCADE, related_name='field_notes', verbose_name='抄表记录')
    reader = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='抄表员', limit_choices_to={'role': 'reader'})
    note = models.TextField('现场说明')
    photo = models.ImageField('现场照片', upload_to='field_photos/', null=True, blank=True)
    created_at = models.DateTimeField('记录时间', auto_now_add=True)

    class Meta:
        verbose_name = '现场说明'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reading} - {self.created_at}'


class FeeAdjustment(models.Model):
    ACTION_CHOICES = (
        ('adjust', '调整'),
        ('return', '退回'),
        ('archive', '归档'),
    )

    reading = models.ForeignKey(MeterReading, on_delete=models.CASCADE, related_name='adjustments', verbose_name='抄表记录')
    reviewer = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='复核员', limit_choices_to={'role': 'reviewer'})
    action = models.CharField('处理动作', max_length=20, choices=ACTION_CHOICES)
    old_reading = models.DecimalField('原读数', max_digits=12, decimal_places=2, null=True, blank=True)
    new_reading = models.DecimalField('新读数', max_digits=12, decimal_places=2, null=True, blank=True)
    old_fee = models.DecimalField('原费用(元)', max_digits=12, decimal_places=2, null=True, blank=True)
    new_fee = models.DecimalField('新费用(元)', max_digits=12, decimal_places=2, null=True, blank=True)
    adjustment_reason = models.TextField('调整原因')
    created_at = models.DateTimeField('处理时间', auto_now_add=True)

    class Meta:
        verbose_name = '费用调整'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reading} - {self.get_action_display()}'


class HistoryLog(models.Model):
    reading = models.ForeignKey(MeterReading, on_delete=models.CASCADE, related_name='history_logs', verbose_name='抄表记录')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    old_status = models.CharField('原状态', max_length=20, choices=MeterReading.STATUS_CHOICES, blank=True)
    new_status = models.CharField('新状态', max_length=20, choices=MeterReading.STATUS_CHOICES)
    old_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='old_owner_logs', verbose_name='原责任人')
    new_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='new_owner_logs', verbose_name='新责任人')
    remark = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('操作时间', auto_now_add=True)

    class Meta:
        verbose_name = '历史变更'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reading} - {self.get_new_status_display()}'
