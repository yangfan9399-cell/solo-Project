from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class ExaminationType(models.Model):
    name = models.CharField(max_length=100, verbose_name='检查类型')
    department = models.CharField(max_length=100, verbose_name='科室')
    estimated_duration = models.IntegerField(default=30, verbose_name='预计时长(分钟)')

    class Meta:
        verbose_name = '检查类型'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', '男'),
        ('F', '女'),
    ]
    id_card = models.CharField(max_length=18, unique=True, verbose_name='身份证号')
    name = models.CharField(max_length=50, verbose_name='姓名')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name='性别')
    birth_date = models.DateField(verbose_name='出生日期')
    phone = models.CharField(max_length=11, verbose_name='联系电话')
    address = models.TextField(blank=True, verbose_name='住址')

    class Meta:
        verbose_name = '患者'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.name}({self.id_card})"


class AppointmentStatus(models.TextChoices):
    SCHEDULED = 'scheduled', '待检查'
    IN_PROGRESS = 'in_progress', '检查中'
    COMPLETED = 'completed', '已完成'
    RESCHEDULED = 'rescheduled', '已改期'
    CANCELLED = 'cancelled', '已取消'
    EXPIRED = 'expired', '已过期'


class ReportStatus(models.TextChoices):
    PENDING = 'pending', '待出报告'
    GENERATED = 'generated', '报告已生成'
    READY = 'ready', '待领取'
    CLAIMED = 'claimed', '已领取'
    STALLED = 'stalled', '报告滞留'
    RETURNED = 'returned', '已退回'
    VERIFIED = 'verified', '已复核'


class Appointment(models.Model):
    appointment_no = models.CharField(max_length=20, unique=True, verbose_name='预约编号')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, verbose_name='患者')
    examination_type = models.ForeignKey(ExaminationType, on_delete=models.PROTECT, verbose_name='检查类型')
    original_appointment_time = models.DateTimeField(verbose_name='原预约时间')
    current_appointment_time = models.DateTimeField(verbose_name='当前预约时间')
    check_in_time = models.DateTimeField(null=True, blank=True, verbose_name='签到时间')
    completion_time = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED, verbose_name='预约状态')
    report_status = models.CharField(max_length=20, choices=ReportStatus.choices, default=ReportStatus.PENDING, verbose_name='报告状态')
    room = models.CharField(max_length=50, blank=True, verbose_name='检查室')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_by = models.ForeignKey(User, related_name='created_appointments', on_delete=models.PROTECT, verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '检查预约'
        verbose_name_plural = verbose_name
        ordering = ['-current_appointment_time']

    def __str__(self):
        return self.appointment_no

    def is_rescheduled(self):
        return self.original_appointment_time != self.current_appointment_time

    def get_record_category(self):
        if self.report_status == ReportStatus.STALLED:
            return '报告滞留'
        if self.is_rescheduled():
            return '患者改期'
        if self.status == AppointmentStatus.COMPLETED:
            return '按时检查'
        return '其他'


class RescheduleRecord(models.Model):
    REASON_CHOICES = [
        ('patient', '患者原因'),
        ('hospital', '医院原因'),
        ('other', '其他原因'),
    ]
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reschedules', verbose_name='预约记录')
    old_time = models.DateTimeField(verbose_name='原时间')
    new_time = models.DateTimeField(verbose_name='新时间')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, verbose_name='改期原因')
    reason_detail = models.TextField(blank=True, verbose_name='详细原因')
    operator = models.ForeignKey(User, related_name='reschedules', on_delete=models.PROTECT, verbose_name='经办人')
    evidence = models.TextField(blank=True, verbose_name='佐证材料')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='改期时间')

    class Meta:
        verbose_name = '改期记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.appointment.appointment_no} - 改期"


class ReportClaimRecord(models.Model):
    CLAIM_TYPE_CHOICES = [
        ('self', '本人领取'),
        ('authorized', '授权领取'),
        ('mail', '邮寄'),
    ]
    VERIFICATION_RESULT = [
        ('match', '身份匹配'),
        ('mismatch', '身份不匹配'),
        ('pending', '待验证'),
    ]
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='claims', verbose_name='预约记录')
    claim_type = models.CharField(max_length=20, choices=CLAIM_TYPE_CHOICES, verbose_name='领取方式')
    claimant_name = models.CharField(max_length=50, verbose_name='领取人姓名')
    claimant_id_card = models.CharField(max_length=18, verbose_name='领取人身份证号')
    claimant_phone = models.CharField(max_length=11, verbose_name='领取人电话')
    verification_result = models.CharField(max_length=20, choices=VERIFICATION_RESULT, default='pending', verbose_name='身份验证结果')
    verification_notes = models.TextField(blank=True, verbose_name='验证说明')
    correction_path = models.TextField(blank=True, verbose_name='补正路径')
    is_blocked = models.BooleanField(default=False, verbose_name='是否阻断领取')
    operator = models.ForeignKey(User, related_name='claims', on_delete=models.PROTECT, verbose_name='经办人')
    reviewer = models.ForeignKey(User, related_name='reviewed_claims', on_delete=models.PROTECT, null=True, blank=True, verbose_name='复核人')
    review_status = models.CharField(max_length=20, choices=[('pending', '待复核'), ('approved', '已确认'), ('rejected', '已退回')], default='pending', verbose_name='复核状态')
    review_notes = models.TextField(blank=True, verbose_name='复核意见')
    evidence = models.TextField(blank=True, verbose_name='佐证材料')
    claimed_at = models.DateTimeField(null=True, blank=True, verbose_name='领取时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '报告领取记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.appointment.appointment_no} - 领取记录"


class AbnormalRecord(models.Model):
    ABNORMAL_TYPES = [
        ('identity_mismatch', '身份信息不匹配'),
        ('report_stalled', '报告滞留'),
        ('reschedule_abnormal', '改期异常'),
        ('other', '其他异常'),
    ]
    STATUS_CHOICES = [
        ('open', '待处理'),
        ('in_progress', '处理中'),
        ('resolved', '已解决'),
        ('closed', '已关闭'),
    ]
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='abnormal_records', verbose_name='预约记录')
    abnormal_type = models.CharField(max_length=30, choices=ABNORMAL_TYPES, verbose_name='异常类型')
    description = models.TextField(verbose_name='异常描述')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', verbose_name='处理状态')
    handler = models.ForeignKey(User, related_name='handled_abnormals', on_delete=models.PROTECT, null=True, blank=True, verbose_name='处理人')
    solution = models.TextField(blank=True, verbose_name='解决方案')
    review_summary = models.TextField(blank=True, verbose_name='复盘总结')
    preventive_measures = models.TextField(blank=True, verbose_name='预防措施')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')

    class Meta:
        verbose_name = '异常记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.appointment.appointment_no} - {self.get_abnormal_type_display()}"


class OperationLog(models.Model):
    OPERATION_TYPES = [
        ('create', '创建'),
        ('update', '更新'),
        ('reschedule', '改期'),
        ('claim', '领取'),
        ('review', '复核'),
        ('abnormal', '异常处理'),
    ]
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='logs', verbose_name='预约记录')
    operation_type = models.CharField(max_length=20, choices=OPERATION_TYPES, verbose_name='操作类型')
    operator = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='操作人')
    details = models.TextField(verbose_name='操作详情')
    evidence = models.TextField(blank=True, verbose_name='佐证材料')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '操作日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.appointment.appointment_no} - {self.get_operation_type_display()}"
