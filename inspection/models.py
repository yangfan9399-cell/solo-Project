from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('inspector', '巡检员'),
        ('reviewer', '能耗复核人'),
        ('admin', '管理员'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='inspector', verbose_name='角色')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    department = models.CharField(max_length=100, blank=True, verbose_name='所属部门')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'


class LightPole(models.Model):
    pole_number = models.CharField(max_length=50, unique=True, verbose_name='灯杆编号')
    area = models.CharField(max_length=100, verbose_name='片区')
    address = models.CharField(max_length=255, verbose_name='位置地址')
    longitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True, verbose_name='经度')
    latitude = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True, verbose_name='纬度')
    device_id = models.CharField(max_length=100, unique=True, verbose_name='设备编号')
    rated_power = models.IntegerField(validators=[MinValueValidator(0)], verbose_name='额定功率(W)')
    install_date = models.DateField(null=True, blank=True, verbose_name='安装日期')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '灯杆'
        verbose_name_plural = verbose_name
        ordering = ['pole_number']

    def __str__(self):
        return f'{self.pole_number} - {self.address}'


class EnergyReading(models.Model):
    light_pole = models.ForeignKey(LightPole, on_delete=models.CASCADE, related_name='energy_readings', verbose_name='灯杆')
    reading_date = models.DateField(verbose_name='读数日期')
    daily_energy = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='日耗电量(kWh)')
    cumulative_energy = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)], verbose_name='累计电量(kWh)')
    is_anomaly = models.BooleanField(default=False, verbose_name='是否异常')
    anomaly_type = models.CharField(max_length=50, blank=True, verbose_name='异常类型')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '能耗读数'
        verbose_name_plural = verbose_name
        unique_together = ['light_pole', 'reading_date']
        ordering = ['-reading_date']

    def __str__(self):
        return f'{self.light_pole.pole_number} - {self.reading_date}: {self.daily_energy}kWh'


class WorkOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('assigned', '已派单'),
        ('in_progress', '处理中'),
        ('inspected', '待复核'),
        ('reviewing', '复核中'),
        ('returned', '已退回'),
        ('archived', '已归档'),
    ]
    
    FAULT_SOURCE_CHOICES = [
        ('automatic', '系统自动检测'),
        ('manual', '人工上报'),
        ('patrol', '巡检发现'),
        ('citizen', '市民投诉'),
    ]
    
    FAULT_TYPE_CHOICES = [
        ('normal_repair', '正常修复'),
        ('energy_spike', '能耗突增'),
        ('location_error', '位置编号错误'),
        ('duplicate', '重复派单'),
        ('bulb_damage', '灯泡损坏'),
        ('circuit_fault', '电路故障'),
        ('control_issue', '控制问题'),
        ('other', '其他'),
    ]

    order_number = models.CharField(max_length=50, unique=True, verbose_name='工单编号')
    light_pole = models.ForeignKey(LightPole, on_delete=models.CASCADE, related_name='work_orders', verbose_name='灯杆')
    title = models.CharField(max_length=200, verbose_name='工单标题')
    fault_source = models.CharField(max_length=20, choices=FAULT_SOURCE_CHOICES, verbose_name='故障来源')
    fault_type = models.CharField(max_length=30, choices=FAULT_TYPE_CHOICES, verbose_name='故障类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    description = models.TextField(verbose_name='故障描述')
    reporter = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reported_orders', verbose_name='上报人')
    inspector = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inspected_orders', verbose_name='巡检员')
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_orders', verbose_name='复核人')
    energy_reading = models.ForeignKey(EnergyReading, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='关联能耗读数')
    expected_energy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='预期能耗(kWh)')
    actual_energy = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='实际能耗(kWh)')
    repair_description = models.TextField(blank=True, verbose_name='修复说明')
    anomaly_cause = models.TextField(blank=True, verbose_name='异常原因')
    review_comment = models.TextField(blank=True, verbose_name='复核意见')
    rework_count = models.IntegerField(default=0, verbose_name='返工次数')
    is_location_error = models.BooleanField(default=False, verbose_name='位置编号错误')
    location_error_note = models.TextField(blank=True, verbose_name='位置错误说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    inspected_at = models.DateTimeField(null=True, blank=True, verbose_name='巡检完成时间')
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='复核完成时间')
    archived_at = models.DateTimeField(null=True, blank=True, verbose_name='归档时间')

    class Meta:
        verbose_name = '工单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_number} - {self.title}'

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f'WO{timezone.now().strftime("%Y%m%d%H%M%S")}'
        super().save(*args, **kwargs)

    def can_archive(self):
        return not self.is_location_error and self.status == 'reviewing'

    def get_priority(self):
        if self.fault_type in ['energy_spike', 'circuit_fault']:
            return 'high'
        elif self.fault_type in ['location_error', 'duplicate']:
            return 'medium'
        return 'low'


class WorkOrderHistory(models.Model):
    ACTION_CHOICES = [
        ('create', '创建工单'),
        ('assign', '派单'),
        ('start', '开始处理'),
        ('complete_inspection', '完成巡检'),
        ('submit_review', '提交复核'),
        ('review_confirm', '复核确认'),
        ('return', '退回返工'),
        ('archive', '归档'),
        ('update', '更新信息'),
        ('add_evidence', '添加证据'),
        ('adopt_evidence', '采用证据'),
        ('unadopt_evidence', '取消采用证据'),
    ]

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='history', verbose_name='工单')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, verbose_name='操作')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    comment = models.TextField(blank=True, verbose_name='备注')
    old_status = models.CharField(max_length=20, blank=True, verbose_name='原状态')
    new_status = models.CharField(max_length=20, blank=True, verbose_name='新状态')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '工单历史'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.work_order.order_number} - {self.get_action_display()}'


class Evidence(models.Model):
    EVIDENCE_TYPE_CHOICES = [
        ('photo', '照片'),
        ('video', '视频'),
        ('document', '文档'),
        ('other', '其他'),
    ]

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='evidences', verbose_name='工单')
    evidence_type = models.CharField(max_length=20, choices=EVIDENCE_TYPE_CHOICES, verbose_name='证据类型')
    file = models.FileField(upload_to='evidences/%Y/%m/%d/', verbose_name='文件')
    description = models.CharField(max_length=255, blank=True, verbose_name='说明')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_evidences', verbose_name='上传人')
    is_adopted = models.BooleanField(default=False, verbose_name='是否采用')
    adopted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='adopted_evidences', verbose_name='采用人')
    adopted_at = models.DateTimeField(null=True, blank=True, verbose_name='采用时间')
    adopt_note = models.CharField(max_length=255, blank=True, verbose_name='采用说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')

    class Meta:
        verbose_name = '证据'
        verbose_name_plural = verbose_name
        ordering = ['-is_adopted', '-created_at']

    def __str__(self):
        status = '✓' if self.is_adopted else ''
        return f'{self.work_order.order_number} - {self.get_evidence_type_display()} {status}'
