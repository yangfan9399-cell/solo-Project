import uuid
from django.db import models


class Station(models.Model):
    STATUS_CHOICES = [
        ('active', '运行中'),
        ('maintenance', '维护中'),
        ('offline', '离线'),
        ('decommissioned', '已退役'),
    ]
    REGION_CHOICES = [
        ('qinghai', '青海'),
        ('tibet', '西藏'),
        ('sichuan', '四川'),
        ('yunnan', '云南'),
        ('gansu', '甘肃'),
        ('xinjiang', '新疆'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField('站名', max_length=120)
    code = models.CharField('站点编号', max_length=30, unique=True)
    altitude = models.FloatField('海拔(m)')
    latitude = models.FloatField('纬度')
    longitude = models.FloatField('经度')
    region = models.CharField('所属区域', max_length=20, choices=REGION_CHOICES)
    status = models.CharField('运行状态', max_length=20, choices=STATUS_CHOICES, default='active')
    established_date = models.DateField('建站日期', null=True, blank=True)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-altitude']
        verbose_name = '气象站'
        verbose_name_plural = '气象站'

    def __str__(self):
        return f'{self.name} ({self.code})'

    @property
    def anomaly_count(self):
        return CalibrationRecord.objects.filter(
            instrument__station=self, is_anomaly=True
        ).count()


class Instrument(models.Model):
    TYPE_CHOICES = [
        ('temperature', '温度仪'),
        ('humidity', '湿度仪'),
        ('wind_speed', '风速仪'),
        ('wind_direction', '风向仪'),
        ('barometer', '气压仪'),
        ('rain_gauge', '雨量计'),
    ]
    STATUS_CHOICES = [
        ('normal', '正常'),
        ('needs_calibration', '待校准'),
        ('calibrating', '校准中'),
        ('faulty', '故障'),
        ('retired', '退役'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='instruments', verbose_name='所属站点')
    instrument_type = models.CharField('仪器类型', max_length=20, choices=TYPE_CHOICES)
    model_name = models.CharField('型号', max_length=80)
    serial_number = models.CharField('序列号', max_length=60, unique=True)
    manufacturer = models.CharField('制造商', max_length=100, blank=True)
    install_date = models.DateField('安装日期', null=True, blank=True)
    status = models.CharField('仪器状态', max_length=20, choices=STATUS_CHOICES, default='normal')
    last_calibration_date = models.DateField('上次校准日期', null=True, blank=True)
    next_calibration_due = models.DateField('下次校准到期', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['instrument_type', 'serial_number']
        verbose_name = '仪器'
        verbose_name_plural = '仪器'

    def __str__(self):
        return f'{self.get_instrument_type_display()} - {self.model_name} ({self.serial_number})'

    @property
    def is_overdue(self):
        from django.utils import timezone
        if self.next_calibration_due and self.next_calibration_due < timezone.now().date():
            return True
        return False


class CalibrationBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    batch_number = models.CharField('批次号', max_length=40)
    calibration_date = models.DateField('校准日期')
    operator = models.CharField('操作员', max_length=60)
    lab_location = models.CharField('实验室地点', max_length=120, blank=True)
    temperature_env = models.FloatField('环境温度(°C)', null=True, blank=True)
    humidity_env = models.FloatField('环境湿度(%RH)', null=True, blank=True)
    notes = models.TextField('备注', blank=True)
    version = models.PositiveIntegerField('版本号', default=1)
    is_superseded = models.BooleanField('已作废', default=False)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-calibration_date', '-version']
        verbose_name = '校准批次'
        verbose_name_plural = '校准批次'
        unique_together = [('batch_number', 'version')]

    def __str__(self):
        return f'{self.batch_number} v{self.version}'

    @property
    def record_count(self):
        return self.records.count()

    @property
    def anomaly_count(self):
        return self.records.filter(is_anomaly=True).count()


class CalibrationRecord(models.Model):
    RESULT_CHOICES = [
        ('pass', '合格'),
        ('fail', '不合格'),
        ('conditional', '有条件合格'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name='calibration_records', verbose_name='仪器')
    batch = models.ForeignKey(CalibrationBatch, on_delete=models.CASCADE, related_name='records', verbose_name='校准批次')
    test_point = models.CharField('测试点', max_length=60, help_text='如: -20°C, 50%RH, 10m/s')
    before_value = models.FloatField('校准前读数')
    after_value = models.FloatField('校准后读数')
    standard_value = models.FloatField('标准值', null=True, blank=True)
    deviation_before = models.FloatField('校准前偏差', null=True, blank=True)
    deviation_after = models.FloatField('校准后偏差', null=True, blank=True)
    tolerance = models.FloatField('允许误差', null=True, blank=True)
    result = models.CharField('校准结果', max_length=15, choices=RESULT_CHOICES)
    is_anomaly = models.BooleanField('异常标记', default=False)
    anomaly_note = models.TextField('异常说明', blank=True)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = '校准记录'
        verbose_name_plural = '校准记录'

    def __str__(self):
        inst_display = '未关联仪器'
        try:
            if self.instrument_id:
                inst_display = str(self.instrument)
        except Exception:
            pass
        return f'{inst_display} @ {self.test_point or "未设置测试点"}'

    def save(self, *args, **kwargs):
        if self.standard_value is not None:
            self.deviation_before = self.before_value - self.standard_value
            self.deviation_after = self.after_value - self.standard_value
        if self.tolerance is not None:
            if abs(self.deviation_after or 0) > self.tolerance:
                self.is_anomaly = True
        super().save(*args, **kwargs)


class TransportRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument = models.ForeignKey(Instrument, on_delete=models.CASCADE, related_name='transport_records', verbose_name='仪器')
    from_station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='transports_from', verbose_name='出发站')
    to_station = models.ForeignKey(Station, on_delete=models.CASCADE, related_name='transports_to', verbose_name='目的站')
    transport_date = models.DateField('运输日期')
    arrival_date = models.DateField('到达日期', null=True, blank=True)
    method = models.CharField('运输方式', max_length=40, blank=True)
    impact_score = models.FloatField('运输影响评分', null=True, blank=True, help_text='0-10, 0=无影响, 10=严重损坏')
    pre_transport_reading = models.FloatField('运输前读数', null=True, blank=True)
    post_transport_reading = models.FloatField('运输后读数', null=True, blank=True)
    reading_deviation = models.FloatField('读数偏差', null=True, blank=True)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-transport_date']
        verbose_name = '运输记录'
        verbose_name_plural = '运输记录'

    def __str__(self):
        try:
            inst = self.instrument_id and str(self.instrument) or '未关联仪器'
            from_name = self.from_station_id and self.from_station.name or '?'
            to_name = self.to_station_id and self.to_station.name or '?'
            return f'{inst} {from_name}→{to_name}'
        except Exception:
            return f'运输记录 {self.id}'

    def save(self, *args, **kwargs):
        if self.pre_transport_reading is not None and self.post_transport_reading is not None:
            self.reading_deviation = self.post_transport_reading - self.pre_transport_reading
        super().save(*args, **kwargs)


class Certificate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_number = models.CharField('证书编号', max_length=50, unique=True)
    record = models.ForeignKey(CalibrationRecord, on_delete=models.CASCADE, related_name='certificates', verbose_name='校准记录')
    issued_date = models.DateField('签发日期')
    expiry_date = models.DateField('有效期至')
    issued_by = models.CharField('签发机构', max_length=120)
    is_valid = models.BooleanField('有效', default=True)
    file_attachment = models.FileField('附件', upload_to='certificates/', blank=True, null=True)
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        ordering = ['-issued_date']
        verbose_name = '校准证书'
        verbose_name_plural = '校准证书'

    def __str__(self):
        return self.certificate_number

    @property
    def is_expired(self):
        from django.utils import timezone
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return True
        return False
