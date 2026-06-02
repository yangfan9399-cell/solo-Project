import uuid

from django.db import models
from django.utils import timezone


class InstrumentPackage(models.Model):
    STATUS_CHOICES = [
        ('registered', '在库'),
        ('in_use', '使用中'),
        ('cleaning', '清洗中'),
        ('sterilizing', '灭菌中'),
        ('pending_release', '待放行'),
        ('expired', '已过期'),
        ('recalled', '已召回'),
    ]

    CATEGORY_CHOICES = [
        ('surgical', '手术包'),
        ('treatment', '诊疗包'),
        ('examination', '检查包'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField('器械包编号', max_length=50, unique=True)
    name = models.CharField('器械包名称', max_length=200)
    category = models.CharField('分类', max_length=20, choices=CATEGORY_CHOICES, default='treatment')
    contents = models.TextField('包含器械清单', help_text='每行一项器械名称')
    status = models.CharField('当前状态', max_length=20, choices=STATUS_CHOICES, default='registered')
    clinic = models.CharField('所属诊室', max_length=100, blank=True, default='')
    sterilization_expiry_days = models.PositiveIntegerField('灭菌有效期(天)', default=180)
    last_sterilized_at = models.DateTimeField('最近灭菌时间', null=True, blank=True)
    expire_at = models.DateTimeField('过期时间', null=True, blank=True)
    created_at = models.DateTimeField('建档时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '器械包'
        verbose_name_plural = '器械包'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} - {self.name}'

    @property
    def is_expired(self):
        if self.expire_at:
            return timezone.now() > self.expire_at
        return False

    @property
    def status_display_color(self):
        color_map = {
            'registered': 'green',
            'in_use': 'blue',
            'cleaning': 'yellow',
            'sterilizing': 'orange',
            'pending_release': 'purple',
            'expired': 'red',
            'recalled': 'red',
        }
        return color_map.get(self.status, 'gray')


class CleaningRecord(models.Model):
    METHOD_CHOICES = [
        ('manual', '手工清洗'),
        ('ultrasonic', '超声清洗'),
        ('mechanical', '机械清洗'),
    ]

    RESULT_CHOICES = [
        ('qualified', '合格'),
        ('unqualified', '不合格'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument_package = models.ForeignKey(
        InstrumentPackage, on_delete=models.CASCADE,
        related_name='cleaning_records', verbose_name='器械包'
    )
    method = models.CharField('清洗方式', max_length=20, choices=METHOD_CHOICES)
    cleaning_agent = models.CharField('清洗剂', max_length=200, blank=True, default='')
    cleaner = models.CharField('清洗人', max_length=100)
    started_at = models.DateTimeField('开始时间')
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)
    result = models.CharField('清洗结果', max_length=20, choices=RESULT_CHOICES, default='qualified')
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '清洗记录'
        verbose_name_plural = '清洗记录'
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.instrument_package.code} 清洗 - {self.get_method_display()}'


class SterilizationBatch(models.Model):
    METHOD_CHOICES = [
        ('high_pressure_steam', '高压蒸汽灭菌'),
        ('eto', '环氧乙烷灭菌'),
        ('low_temp_plasma', '低温等离子灭菌'),
    ]

    RESULT_CHOICES = [
        ('qualified', '合格'),
        ('unqualified', '不合格'),
        ('pending', '待检测'),
    ]

    batch_number = models.CharField('批次号', max_length=50, unique=True)
    method = models.CharField('灭菌方式', max_length=30, choices=METHOD_CHOICES)
    operator = models.CharField('操作人', max_length=100)
    started_at = models.DateTimeField('开始时间')
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)
    temperature = models.FloatField('灭菌温度(℃)', null=True, blank=True)
    pressure = models.FloatField('灭菌压力(kPa)', null=True, blank=True)
    duration_minutes = models.PositiveIntegerField('灭菌时长(分钟)', null=True, blank=True)
    result = models.CharField('灭菌结果', max_length=20, choices=RESULT_CHOICES, default='pending')
    physical_test = models.CharField('物理监测', max_length=20, choices=RESULT_CHOICES, default='pending')
    chemical_test = models.CharField('化学监测', max_length=20, choices=RESULT_CHOICES, default='pending')
    biological_test = models.CharField('生物监测', max_length=20, choices=RESULT_CHOICES, default='pending')
    notes = models.TextField('备注', blank=True, default='')
    instrument_packages = models.ManyToManyField(
        InstrumentPackage, related_name='sterilization_batches', verbose_name='器械包', blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '灭菌批次'
        verbose_name_plural = '灭菌批次'
        ordering = ['-started_at']

    def __str__(self):
        return self.batch_number

    @property
    def all_tests_passed(self):
        return (
            self.physical_test == 'qualified'
            and self.chemical_test == 'qualified'
            and self.biological_test == 'qualified'
        )


class ReleaseAudit(models.Model):
    RESULT_CHOICES = [
        ('approved', '通过'),
        ('rejected', '不通过'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument_package = models.ForeignKey(
        InstrumentPackage, on_delete=models.CASCADE,
        related_name='release_audits', verbose_name='器械包'
    )
    batch = models.ForeignKey(
        SterilizationBatch, on_delete=models.CASCADE,
        related_name='release_audits', verbose_name='灭菌批次'
    )
    auditor = models.CharField('审核人', max_length=100)
    packaging_intact = models.BooleanField('包装完好', default=True)
    indicator_changed = models.BooleanField('化学指示卡变色', default=True)
    label_clear = models.BooleanField('标识清晰', default=True)
    seal_intact = models.BooleanField('封口完好', default=True)
    audit_result = models.CharField('审核结果', max_length=20, choices=RESULT_CHOICES)
    audited_at = models.DateTimeField('审核时间', default=timezone.now)
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '放行审核'
        verbose_name_plural = '放行审核'
        ordering = ['-audited_at']

    def __str__(self):
        return f'{self.instrument_package.code} 放行审核 - {self.get_audit_result_display()}'


class ClinicalUsage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument_package = models.ForeignKey(
        InstrumentPackage, on_delete=models.CASCADE,
        related_name='clinical_usages', verbose_name='器械包'
    )
    patient_id = models.CharField('患者编号', max_length=100)
    patient_name = models.CharField('患者姓名', max_length=100)
    doctor = models.CharField('使用医生', max_length=100)
    clinic = models.CharField('使用诊室', max_length=100)
    procedure = models.CharField('诊疗项目', max_length=200)
    used_at = models.DateTimeField('使用时间', default=timezone.now)
    returned_at = models.DateTimeField('归还时间', null=True, blank=True)
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '诊疗使用记录'
        verbose_name_plural = '诊疗使用记录'
        ordering = ['-used_at']

    def __str__(self):
        return f'{self.instrument_package.code} - {self.patient_name} - {self.procedure}'


class ExpiryRecall(models.Model):
    REASON_CHOICES = [
        ('expired', '过期召回'),
        ('suspected_contamination', '可疑污染'),
        ('batch_issue', '批次问题'),
        ('other', '其他'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('recalled', '已召回'),
        ('destroyed', '已销毁'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument_package = models.ForeignKey(
        InstrumentPackage, on_delete=models.CASCADE,
        related_name='recalls', verbose_name='器械包'
    )
    reason = models.CharField('召回原因', max_length=30, choices=REASON_CHOICES)
    initiator = models.CharField('发起人', max_length=100)
    initiated_at = models.DateTimeField('发起时间', default=timezone.now)
    status = models.CharField('召回状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    handler = models.CharField('处理人', max_length=100, blank=True, default='')
    handled_at = models.DateTimeField('处理时间', null=True, blank=True)
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '过期召回'
        verbose_name_plural = '过期召回'
        ordering = ['-initiated_at']

    def __str__(self):
        return f'{self.instrument_package.code} 召回 - {self.get_reason_display()}'


class InfectionInspection(models.Model):
    TYPE_CHOICES = [
        ('instrument', '器械包抽查'),
        ('batch', '灭菌批次抽查'),
        ('environment', '环境监测'),
    ]

    RESULT_CHOICES = [
        ('qualified', '合格'),
        ('unqualified', '不合格'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    instrument_package = models.ForeignKey(
        InstrumentPackage, on_delete=models.SET_NULL,
        related_name='inspections', verbose_name='器械包', null=True, blank=True
    )
    batch = models.ForeignKey(
        SterilizationBatch, on_delete=models.SET_NULL,
        related_name='inspections', verbose_name='灭菌批次', null=True, blank=True
    )
    inspection_type = models.CharField('抽查类型', max_length=20, choices=TYPE_CHOICES)
    inspector = models.CharField('抽查人', max_length=100)
    inspected_at = models.DateTimeField('抽查时间', default=timezone.now)
    result = models.CharField('抽查结果', max_length=20, choices=RESULT_CHOICES, default='qualified')
    findings = models.TextField('发现问题', blank=True, default='')
    corrective_action = models.TextField('纠正措施', blank=True, default='')
    notes = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '院感抽查'
        verbose_name_plural = '院感抽查'
        ordering = ['-inspected_at']

    def __str__(self):
        return f'院感抽查 - {self.get_inspection_type_display()} - {self.inspector}'
