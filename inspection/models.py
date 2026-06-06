from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal


class Role(models.TextChoices):
    FORWARDER = 'forwarder', '货代经办人'
    YARD = 'yard', '场站人员'
    FEE_AUDITOR = 'fee_auditor', '费用复核人'


class AppointmentStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    SUBMITTED = 'submitted', '待查验'
    IN_INSPECTION = 'in_inspection', '查验中'
    NORMAL_RELEASE = 'normal_release', '正常放行'
    DOC_MISSING = 'doc_missing', '单证缺失'
    RESCHEDULED = 'rescheduled', '查验改期'
    PENDING_FEE = 'pending_fee', '待费用复核'
    FEE_CONFIRMED = 'fee_confirmed', '费用确认'
    FEE_DISPUTED = 'fee_disputed', '滞箱费异议'
    ARCHIVED = 'archived', '已归档'


class ContainerSize(models.TextChoices):
    SIZE_20GP = '20GP', '20GP'
    SIZE_40GP = '40GP', '40GP'
    SIZE_40HQ = '40HQ', '40HQ'
    SIZE_45HQ = '45HQ', '45HQ'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=Role.choices)
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f'{self.user.get_full_name()} - {self.get_role_display()}'

    class Meta:
        verbose_name = '用户档案'
        verbose_name_plural = '用户档案'


class Forwarder(models.Model):
    name = models.CharField(max_length=200, unique=True)
    contact_person = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = '货代公司'
        verbose_name_plural = '货代公司'
        ordering = ['name']


class ShippingLine(models.Model):
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.name} ({self.code})'

    class Meta:
        verbose_name = '航线/船公司'
        verbose_name_plural = '航线/船公司'
        ordering = ['name']


class Container(models.Model):
    container_no = models.CharField(max_length=20, unique=True)
    size = models.CharField(max_length=10, choices=ContainerSize.choices)
    shipping_line = models.ForeignKey(ShippingLine, on_delete=models.PROTECT)
    vessel_name = models.CharField(max_length=100, verbose_name='船名')
    voyage_no = models.CharField(max_length=30, verbose_name='航次')
    bl_no = models.CharField(max_length=50, blank=True, null=True, verbose_name='提单号')
    seal_no = models.CharField(max_length=30, blank=True, null=True, verbose_name='封条号')
    gross_weight = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='毛重(吨)')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.container_no} ({self.size})'

    class Meta:
        verbose_name = '集装箱'
        verbose_name_plural = '集装箱'
        ordering = ['-created_at']


class InspectionWindow(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='查验窗口名称')
    location = models.CharField(max_length=200, verbose_name='位置')
    is_active = models.BooleanField(default=True, verbose_name='启用')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = '查验窗口'
        verbose_name_plural = '查验窗口'
        ordering = ['name']


class DocumentType(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='单证名称')
    is_required = models.BooleanField(default=True, verbose_name='必备单证')
    description = models.TextField(blank=True, null=True, verbose_name='说明')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = '单证类型'
        verbose_name_plural = '单证类型'
        ordering = ['name']


class InspectionAppointment(models.Model):
    appointment_no = models.CharField(max_length=30, unique=True, verbose_name='预约编号')
    container = models.ForeignKey(Container, on_delete=models.PROTECT, related_name='appointments', verbose_name='集装箱')
    forwarder = models.ForeignKey(Forwarder, on_delete=models.PROTECT, related_name='appointments', verbose_name='货代公司')
    shipping_line = models.ForeignKey(ShippingLine, on_delete=models.PROTECT, related_name='appointments', verbose_name='船公司')
    route = models.CharField(max_length=100, verbose_name='航线')
    inspection_window = models.ForeignKey(InspectionWindow, on_delete=models.PROTECT, verbose_name='查验窗口')
    appointment_date = models.DateField(verbose_name='预约日期')
    appointment_time = models.TimeField(verbose_name='预约时间')
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.DRAFT, verbose_name='状态')
    contact_person = models.CharField(max_length=100, verbose_name='联系人')
    contact_phone = models.CharField(max_length=20, verbose_name='联系电话')
    inspection_reason = models.TextField(blank=True, null=True, verbose_name='查验原因')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_appointments', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    submitted_at = models.DateTimeField(blank=True, null=True, verbose_name='提交时间')
    inspection_started_at = models.DateTimeField(blank=True, null=True, verbose_name='查验开始时间')
    inspection_completed_at = models.DateTimeField(blank=True, null=True, verbose_name='查验完成时间')
    inspector = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='inspected_appointments', verbose_name='查验员')
    inspection_result = models.TextField(blank=True, null=True, verbose_name='查验结果')
    demurrage_days = models.IntegerField(default=0, verbose_name='滞箱天数')
    demurrage_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='滞箱费(元)')
    fee_reduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='减免金额(元)')
    final_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='最终费用(元)')
    fee_confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='confirmed_appointments', verbose_name='费用确认人')
    fee_confirmed_at = models.DateTimeField(blank=True, null=True, verbose_name='费用确认时间')
    fee_dispute_reason = models.TextField(blank=True, null=True, verbose_name='费用异议原因')
    archived_at = models.DateTimeField(blank=True, null=True, verbose_name='归档时间')
    archived_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='archived_appointments', verbose_name='归档人')

    def __str__(self):
        return f'{self.appointment_no} - {self.container.container_no}'

    def save(self, *args, **kwargs):
        if not self.appointment_no:
            self.appointment_no = self._generate_appointment_no()
        super().save(*args, **kwargs)

    def _generate_appointment_no(self):
        date_str = timezone.now().strftime('%Y%m%d')
        count = InspectionAppointment.objects.filter(
            appointment_no__startswith=f'INS{date_str}'
        ).count() + 1
        return f'INS{date_str}{count:04d}'

    @property
    def is_doc_complete(self):
        required_docs = DocumentType.objects.filter(is_required=True)
        submitted_docs = self.documents.filter(is_submitted=True).values_list('document_type_id', flat=True)
        return all(doc.id in submitted_docs for doc in required_docs)

    @property
    def missing_documents(self):
        required_docs = DocumentType.objects.filter(is_required=True)
        submitted_doc_ids = self.documents.filter(is_submitted=True).values_list('document_type_id', flat=True)
        return required_docs.exclude(id__in=submitted_doc_ids)

    @property
    def can_release(self):
        return self.is_doc_complete and self.status in [
            AppointmentStatus.IN_INSPECTION,
            AppointmentStatus.DOC_MISSING,
        ]

    def calculate_demurrage(self):
        if self.inspection_completed_at and self.submitted_at:
            days = (self.inspection_completed_at.date() - self.submitted_at.date()).days
            self.demurrage_days = max(0, days - 3)
            daily_rate = self._get_daily_rate()
            self.demurrage_fee = Decimal(str(self.demurrage_days)) * daily_rate
            self.final_fee = self.demurrage_fee - self.fee_reduction
        return self.demurrage_fee

    def _get_daily_rate(self):
        rates = {
            '20GP': Decimal('200.00'),
            '40GP': Decimal('350.00'),
            '40HQ': Decimal('400.00'),
            '45HQ': Decimal('500.00'),
        }
        return rates.get(self.container.size, Decimal('300.00'))

    class Meta:
        verbose_name = '查验预约'
        verbose_name_plural = '查验预约'
        ordering = ['-created_at']


class Document(models.Model):
    appointment = models.ForeignKey(InspectionAppointment, on_delete=models.CASCADE, related_name='documents', verbose_name='查验预约')
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT, verbose_name='单证类型')
    is_submitted = models.BooleanField(default=False, verbose_name='已提交')
    submitted_at = models.DateTimeField(blank=True, null=True, verbose_name='提交时间')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='提交人')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')

    def __str__(self):
        return f'{self.appointment.appointment_no} - {self.document_type.name}'

    class Meta:
        verbose_name = '单证'
        verbose_name_plural = '单证'
        unique_together = ('appointment', 'document_type')


class FeeItem(models.Model):
    appointment = models.ForeignKey(InspectionAppointment, on_delete=models.CASCADE, related_name='fee_items', verbose_name='查验预约')
    item_name = models.CharField(max_length=200, verbose_name='费用项目')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('1'), verbose_name='数量')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价(元)')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='金额(元)')
    is_reduction = models.BooleanField(default=False, verbose_name='减免项')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.unit_price
        if self.is_reduction:
            self.amount = -abs(self.amount)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.item_name} - {self.amount}元'

    class Meta:
        verbose_name = '费用明细'
        verbose_name_plural = '费用明细'
        ordering = ['created_at']


class InspectionHistory(models.Model):
    appointment = models.ForeignKey(InspectionAppointment, on_delete=models.CASCADE, related_name='history', verbose_name='查验预约')
    action = models.CharField(max_length=100, verbose_name='操作')
    status_from = models.CharField(max_length=20, choices=AppointmentStatus.choices, blank=True, null=True, verbose_name='原状态')
    status_to = models.CharField(max_length=20, choices=AppointmentStatus.choices, blank=True, null=True, verbose_name='新状态')
    operator = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='操作人')
    operated_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')
    remark = models.TextField(blank=True, null=True, verbose_name='备注')

    def __str__(self):
        return f'{self.appointment.appointment_no} - {self.action}'

    class Meta:
        verbose_name = '操作历史'
        verbose_name_plural = '操作历史'
        ordering = ['-operated_at']


class RescheduleRecord(models.Model):
    appointment = models.ForeignKey(InspectionAppointment, on_delete=models.CASCADE, related_name='reschedules', verbose_name='查验预约')
    original_date = models.DateField(verbose_name='原预约日期')
    original_time = models.TimeField(verbose_name='原预约时间')
    new_date = models.DateField(verbose_name='新预约日期')
    new_time = models.TimeField(verbose_name='新预约时间')
    reason = models.TextField(verbose_name='改期原因')
    operator = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='操作人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    def __str__(self):
        return f'{self.appointment.appointment_no} 改期'

    class Meta:
        verbose_name = '改期记录'
        verbose_name_plural = '改期记录'
        ordering = ['-created_at']
