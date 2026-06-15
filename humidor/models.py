from django.db import models
from django.utils import timezone


class CigarTag(models.Model):
    name = models.CharField('标签名称', max_length=50)
    color = models.CharField('标签颜色', max_length=7, default='#667eea')
    description = models.TextField('标签描述', blank=True)

    class Meta:
        verbose_name = '雪茄标签'
        verbose_name_plural = '雪茄标签'

    def __str__(self):
        return self.name


class HumidorCabinet(models.Model):
    CABINET_STATUS_CHOICES = [
        ('normal', '正常运行'),
        ('warning', '异常告警'),
        ('maintenance', '维护中'),
    ]

    name = models.CharField('养护柜名称', max_length=100)
    cabinet_code = models.CharField('柜编号', max_length=50, unique=True)
    layers = models.IntegerField('总层数', default=5)
    slots_per_layer = models.IntegerField('每层格数', default=8)
    status = models.CharField('状态', max_length=20, choices=CABINET_STATUS_CHOICES, default='normal')
    target_temp_min = models.FloatField('目标温度下限(°C)', default=18.0)
    target_temp_max = models.FloatField('目标温度上限(°C)', default=22.0)
    target_humidity_min = models.FloatField('目标湿度下限(%)', default=65.0)
    target_humidity_max = models.FloatField('目标湿度上限(%)', default=75.0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '养护柜'
        verbose_name_plural = '养护柜'

    def __str__(self):
        return f'{self.name} ({self.cabinet_code})'


class CabinetRecord(models.Model):
    RECORD_STATUS_CHOICES = [
        ('draft', '草稿'),
        ('in_progress', '进行中'),
        ('completed', '已完成'),
        ('rolled_back', '已回滚'),
        ('exception', '异常'),
    ]

    cabinet = models.ForeignKey(HumidorCabinet, on_delete=models.CASCADE, verbose_name='所属养护柜')
    batch_no = models.CharField('批次号', max_length=50)
    version = models.IntegerField('版本号', default=1)
    collector = models.CharField('收藏者', max_length=100)
    cabinet_layer = models.IntegerField('柜层')
    record_date = models.DateField('记录日期', default=timezone.localdate)
    status = models.CharField('记录状态', max_length=20, choices=RECORD_STATUS_CHOICES, default='draft')
    tags = models.ManyToManyField(CigarTag, blank=True, verbose_name='标签')
    tasting_notes = models.TextField('品吸备注', blank=True)
    remarks = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '主记录'
        verbose_name_plural = '主记录'
        ordering = ['-created_at']
        unique_together = ['batch_no', 'version']

    def __str__(self):
        return f'{self.batch_no} - {self.collector} - 第{self.cabinet_layer}层'


class HumidityDetail(models.Model):
    record = models.ForeignKey(CabinetRecord, on_delete=models.CASCADE, related_name='humidity_details', verbose_name='主记录')
    temperature = models.FloatField('温度(°C)')
    humidity = models.FloatField('湿度(%)')
    measure_time = models.DateTimeField('测量时间', default=timezone.now)
    sensor_position = models.CharField('传感器位置', max_length=50, blank=True)
    is_alert = models.BooleanField('是否告警', default=False)
    alert_type = models.CharField('告警类型', max_length=50, blank=True)

    class Meta:
        verbose_name = '温湿度明细'
        verbose_name_plural = '温湿度明细'
        ordering = ['-measure_time']

    def __str__(self):
        return f'{self.record.batch_no} - {self.measure_time.strftime("%Y-%m-%d %H:%M")}'

    def save(self, *args, **kwargs):
        cabinet = self.record.cabinet
        temp_alert = self.temperature < cabinet.target_temp_min or self.temperature > cabinet.target_temp_max
        hum_alert = self.humidity < cabinet.target_humidity_min or self.humidity > cabinet.target_humidity_max

        if temp_alert and hum_alert:
            self.is_alert = True
            self.alert_type = '温湿度双异常'
        elif temp_alert:
            self.is_alert = True
            self.alert_type = '温度异常'
        elif hum_alert:
            self.is_alert = True
            self.alert_type = '湿度异常'
        else:
            self.is_alert = False
            self.alert_type = ''

        super().save(*args, **kwargs)


class CigarPosition(models.Model):
    POSITION_TYPE_CHOICES = [
        ('placed', '入柜'),
        ('moved', '移动'),
        ('rotated', '轮换'),
        ('removed', '取出'),
    ]

    record = models.ForeignKey(CabinetRecord, on_delete=models.CASCADE, related_name='cigar_positions', verbose_name='主记录')
    cigar_name = models.CharField('雪茄名称', max_length=100)
    cigar_code = models.CharField('雪茄编号', max_length=50)
    from_layer = models.IntegerField('起始柜层', null=True, blank=True)
    from_slot = models.IntegerField('起始格位', null=True, blank=True)
    to_layer = models.IntegerField('目标柜层')
    to_slot = models.IntegerField('目标格位')
    position_type = models.CharField('操作类型', max_length=20, choices=POSITION_TYPE_CHOICES, default='placed')
    operation_time = models.DateTimeField('操作时间', default=timezone.now)
    operator = models.CharField('操作人', max_length=50, blank=True)

    class Meta:
        verbose_name = '雪茄位置历史'
        verbose_name_plural = '雪茄位置历史'
        ordering = ['-operation_time']

    def __str__(self):
        return f'{self.cigar_name} - {self.get_position_type_display()}'


class RotationResult(models.Model):
    RESULT_CHOICES = [
        ('normal', '正常完成'),
        ('partial', '部分完成'),
        ('failed', '失败'),
        ('rolled_back', '已回滚'),
    ]

    record = models.OneToOneField(CabinetRecord, on_delete=models.CASCADE, related_name='rotation_result', verbose_name='主记录')
    rotation_date = models.DateField('轮换日期')
    result = models.CharField('轮换结果', max_length=20, choices=RESULT_CHOICES, default='normal')
    cigar_count = models.IntegerField('轮换雪茄数量', default=0)
    duration_minutes = models.IntegerField('轮换耗时(分钟)', default=0)
    executor = models.CharField('执行人', max_length=50, blank=True)
    summary = models.TextField('轮换总结', blank=True)
    export_version = models.CharField('导出版本', max_length=50, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '轮换结果'
        verbose_name_plural = '轮换结果'

    def __str__(self):
        return f'{self.record.batch_no} - {self.get_result_display()}'


class AlertReminder(models.Model):
    REMINDER_TYPE_CHOICES = [
        ('temperature', '温度告警'),
        ('humidity', '湿度告警'),
        ('rotation_due', '轮换到期'),
        ('position_anomaly', '位置异常'),
        ('system', '系统提醒'),
    ]

    SEVERITY_CHOICES = [
        ('info', '提示'),
        ('warning', '警告'),
        ('danger', '危险'),
    ]

    STATUS_CHOICES = [
        ('unread', '未读'),
        ('read', '已读'),
        ('resolved', '已处理'),
    ]

    cabinet = models.ForeignKey(HumidorCabinet, on_delete=models.CASCADE, verbose_name='养护柜', null=True, blank=True)
    record = models.ForeignKey(CabinetRecord, on_delete=models.CASCADE, verbose_name='主记录', null=True, blank=True)
    reminder_type = models.CharField('提醒类型', max_length=30, choices=REMINDER_TYPE_CHOICES)
    severity = models.CharField('严重程度', max_length=20, choices=SEVERITY_CHOICES, default='warning')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='unread')
    title = models.CharField('标题', max_length=200)
    content = models.TextField('内容')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    resolved_at = models.DateTimeField('处理时间', null=True, blank=True)

    class Meta:
        verbose_name = '告警提醒'
        verbose_name_plural = '告警提醒'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.get_severity_display()}] {self.title}'
