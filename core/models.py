from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import json


class CoreSample(models.Model):
    PRIORITY_CHOICES = [
        ('urgent', '紧急'),
        ('high', '高'),
        ('medium', '中'),
        ('low', '低'),
    ]

    STATUS_CHOICES = [
        ('pending', '待切割'),
        ('in_progress', '切割中'),
        ('completed', '已完成'),
        ('on_hold', '暂停'),
        ('archived', '已归档'),
    ]

    sample_no = models.CharField('样本编号', max_length=50, unique=True)
    well_name = models.CharField('井号', max_length=100)
    depth_start = models.FloatField('起始深度(m)')
    depth_end = models.FloatField('结束深度(m)')
    total_length = models.FloatField('总长度(m)')
    remaining_length = models.FloatField('剩余长度(m)')
    lithology = models.CharField('岩性', max_length=100, blank=True)
    formation = models.CharField('地层', max_length=100, blank=True)
    priority = models.CharField('优先级', max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    storage_location = models.CharField('存放位置', max_length=200, blank=True)
    description = models.TextField('描述', blank=True)
    collected_date = models.DateField('采集日期', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-priority', 'sample_no']
        verbose_name = '岩心样本'
        verbose_name_plural = '岩心样本'

    def __str__(self):
        return f'{self.sample_no} - {self.well_name}'

    def clean(self):
        if self.depth_end <= self.depth_start:
            raise ValidationError('结束深度必须大于起始深度')
        if self.total_length <= 0:
            raise ValidationError('总长度必须大于0')
        if self.remaining_length < 0:
            raise ValidationError('剩余长度不能为负数')
        if self.remaining_length > self.total_length:
            raise ValidationError('剩余长度不能大于总长度')

    @property
    def usage_rate(self):
        if self.total_length == 0:
            return 0
        return round((1 - self.remaining_length / self.total_length) * 100, 1)

    @property
    def has_anomaly(self):
        return self.anomalies.filter(resolved=False).exists()


class Cutter(models.Model):
    STATUS_CHOICES = [
        ('available', '可用'),
        ('busy', '运行中'),
        ('maintenance', '维护中'),
        ('offline', '离线'),
    ]

    CUTTER_TYPE_CHOICES = [
        ('diamond', '金刚石切割机'),
        ('laser', '激光切割机'),
        ('band_saw', '带锯切割机'),
    ]

    cutter_no = models.CharField('设备编号', max_length=50, unique=True)
    name = models.CharField('设备名称', max_length=100)
    cutter_type = models.CharField('设备类型', max_length=30, choices=CUTTER_TYPE_CHOICES, default='diamond')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='available')
    max_cut_length = models.FloatField('最大切割长度(m)', default=1.0)
    min_cut_length = models.FloatField('最小切割长度(m)', default=0.01)
    daily_capacity = models.FloatField('日产能(m/天)', default=10.0)
    blade_loss_rate = models.FloatField('刀片损耗率(%)', default=2.5)
    work_start_time = models.TimeField('工作开始时间', default='08:00')
    work_end_time = models.TimeField('工作结束时间', default='18:00')
    location = models.CharField('位置', max_length=200, blank=True)
    description = models.TextField('描述', blank=True)
    last_maintenance = models.DateField('上次维护日期', null=True, blank=True)
    next_maintenance = models.DateField('下次维护日期', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['cutter_no']
        verbose_name = '切割机'
        verbose_name_plural = '切割机'

    def __str__(self):
        return f'{self.cutter_no} - {self.name}'


class CuttingPurpose(models.Model):
    code = models.CharField('目的代码', max_length=30, unique=True)
    name = models.CharField('切割目的', max_length=100)
    standard_loss_rate = models.FloatField('标准损耗率(%)', default=3.0)
    typical_length = models.FloatField('典型切片厚度(m)', default=0.05)
    requires_quality_check = models.BooleanField('需要质检', default=True)
    description = models.TextField('描述', blank=True)
    is_active = models.BooleanField('启用', default=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        ordering = ['sort_order', 'code']
        verbose_name = '切割目的'
        verbose_name_plural = '切割目的'

    def __str__(self):
        return self.name


class CuttingTask(models.Model):
    STATUS_CHOICES = [
        ('pending', '待执行'),
        ('scheduled', '已排程'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
        ('failed', '失败'),
    ]

    task_no = models.CharField('任务编号', max_length=50, unique=True)
    core_sample = models.ForeignKey(CoreSample, on_delete=models.CASCADE, related_name='cutting_tasks', verbose_name='岩心样本')
    cutter = models.ForeignKey(Cutter, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name='切割机')
    purpose = models.ForeignKey(CuttingPurpose, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='切割目的')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    planned_cut_length = models.FloatField('计划切割长度(m)')
    actual_cut_length = models.FloatField('实际切割长度(m)', null=True, blank=True)
    loss_length = models.FloatField('损耗长度(m)', default=0.0)
    slice_count = models.IntegerField('切片数量', default=1)
    slice_thickness = models.FloatField('切片厚度(m)', default=0.05)
    scheduled_date = models.DateField('计划日期', null=True, blank=True)
    scheduled_start_time = models.TimeField('计划开始时间', null=True, blank=True)
    scheduled_end_time = models.TimeField('计划结束时间', null=True, blank=True)
    actual_start_time = models.DateTimeField('实际开始时间', null=True, blank=True)
    actual_end_time = models.DateTimeField('实际结束时间', null=True, blank=True)
    operator = models.CharField('操作人员', max_length=100, blank=True)
    quality_checked = models.BooleanField('已质检', default=False)
    quality_result = models.CharField('质检结果', max_length=50, blank=True)
    remarks = models.TextField('备注', blank=True)
    batch_version = models.ForeignKey('BatchVersion', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks', verbose_name='所属批次')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-scheduled_date', '-scheduled_start_time']
        verbose_name = '切割任务'
        verbose_name_plural = '切割任务'

    def __str__(self):
        return self.task_no

    def clean(self):
        if self.planned_cut_length <= 0:
            raise ValidationError('计划切割长度必须大于0')
        if self.slice_count < 1:
            raise ValidationError('切片数量至少为1')

    @property
    def loss_rate(self):
        if self.planned_cut_length == 0:
            return 0
        return round((self.loss_length / self.planned_cut_length) * 100, 2)

    @property
    def expected_loss(self):
        rate = self.purpose.standard_loss_rate if self.purpose else 3.0
        return round(self.planned_cut_length * rate / 100, 4)

    @property
    def has_anomaly(self):
        return self.anomalies.filter(resolved=False).exists()


class BatchVersion(models.Model):
    BATCH_TYPE_CHOICES = [
        ('daily', '日批次'),
        ('weekly', '周批次'),
        ('project', '项目批次'),
        ('ad_hoc', '临时批次'),
    ]

    version_no = models.CharField('版本号', max_length=50, unique=True)
    batch_no = models.CharField('批次号', max_length=50)
    batch_type = models.CharField('批次类型', max_length=20, choices=BATCH_TYPE_CHOICES, default='daily')
    description = models.TextField('描述', blank=True)
    is_current = models.BooleanField('当前版本', default=False)
    snapshot_data = models.TextField('快照数据(JSON)', blank=True)
    created_by = models.CharField('创建人', max_length=100, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = '批次版本'
        verbose_name_plural = '批次版本'

    def __str__(self):
        return f'{self.version_no} ({self.batch_no})'

    def save_snapshot(self, tasks_qs=None):
        if tasks_qs is None:
            tasks_qs = self.tasks.all()
        snapshot = []
        for task in tasks_qs:
            snapshot.append({
                'task_no': task.task_no,
                'core_sample': task.core_sample.sample_no if task.core_sample else None,
                'cutter': task.cutter.cutter_no if task.cutter else None,
                'purpose': task.purpose.name if task.purpose else None,
                'planned_cut_length': task.planned_cut_length,
                'scheduled_date': task.scheduled_date.isoformat() if task.scheduled_date else None,
                'scheduled_start_time': task.scheduled_start_time.isoformat() if task.scheduled_start_time else None,
                'status': task.status,
            })
        self.snapshot_data = json.dumps(snapshot, ensure_ascii=False, indent=2)
        self.save()

    def get_snapshot(self):
        if not self.snapshot_data:
            return []
        try:
            return json.loads(self.snapshot_data)
        except json.JSONDecodeError:
            return []


class AnomalyRecord(models.Model):
    SEVERITY_CHOICES = [
        ('critical', '严重'),
        ('warning', '警告'),
        ('info', '提示'),
    ]

    TYPE_CHOICES = [
        ('length_mismatch', '长度不符'),
        ('over_scheduled', '排程冲突'),
        ('high_loss', '损耗过高'),
        ('low_remaining', '剩余不足'),
        ('priority_conflict', '优先级冲突'),
        ('capacity_exceeded', '产能超限'),
        ('data_incomplete', '数据不全'),
        ('quality_issue', '质量问题'),
        ('other', '其他'),
    ]

    anomaly_type = models.CharField('异常类型', max_length=30, choices=TYPE_CHOICES)
    severity = models.CharField('严重程度', max_length=20, choices=SEVERITY_CHOICES, default='warning')
    description = models.TextField('描述')
    core_sample = models.ForeignKey(CoreSample, on_delete=models.CASCADE, null=True, blank=True, related_name='anomalies', verbose_name='关联岩心')
    cutting_task = models.ForeignKey(CuttingTask, on_delete=models.CASCADE, null=True, blank=True, related_name='anomalies', verbose_name='关联任务')
    cutter = models.ForeignKey(Cutter, on_delete=models.CASCADE, null=True, blank=True, related_name='anomalies', verbose_name='关联设备')
    resolved = models.BooleanField('已解决', default=False)
    resolution = models.TextField('解决方案', blank=True)
    detected_at = models.DateTimeField('检测时间', auto_now_add=True)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)

    class Meta:
        ordering = ['-severity', '-detected_at']
        verbose_name = '异常记录'
        verbose_name_plural = '异常记录'

    def __str__(self):
        return f'{self.get_anomaly_type_display()} - {self.severity}'

    def save(self, *args, **kwargs):
        if self.resolved and not self.resolved_at:
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)
