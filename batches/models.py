from django.db import models
from django.conf import settings
from django.utils import timezone


class Batch(models.Model):
    STATUS_CHOICES = [
        ('pending', '待登记'),
        ('quarantining', '隔离中'),
        ('reviewing', '待复核'),
        ('approving', '待审批'),
        ('released', '已放行'),
        ('returned', '已退运'),
        ('extended', '延长隔离'),
    ]
    
    batch_number = models.CharField(max_length=20, unique=True, verbose_name='批次号')
    animal_type = models.CharField(max_length=50, verbose_name='动物种类')
    quantity = models.IntegerField(verbose_name='数量')
    origin_country = models.CharField(max_length=50, verbose_name='来源国')
    entry_date = models.DateField(verbose_name='入境日期')
    quarantine_site = models.CharField(max_length=100, verbose_name='隔离场')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    vaccine_certificate = models.BooleanField(default=False, verbose_name='疫苗证明')
    health_certificate = models.BooleanField(default=False, verbose_name='健康证明')
    quarantine_certificate = models.BooleanField(default=False, verbose_name='检疫证书')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_batches', verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '批次'
        verbose_name_plural = '批次'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['origin_country']),
            models.Index(fields=['entry_date']),
        ]
    
    def __str__(self):
        return self.batch_number
    
    def can_release(self):
        return self.vaccine_certificate
    
    def get_quarantine_days(self):
        if self.status in ['released', 'returned']:
            last_status = self.status_history.order_by('-changed_at').first()
            if last_status:
                return (last_status.changed_at.date() - self.entry_date).days
        return (timezone.now().date() - self.entry_date).days
    
    def has_missing_feeding_records(self):
        from observations.models import ObservationRecord
        expected_days = self.get_quarantine_days()
        actual_records = ObservationRecord.objects.filter(batch=self).count()
        return actual_records < expected_days


class Document(models.Model):
    DOCUMENT_TYPE_CHOICES = [
        ('vaccine_certificate', '疫苗证明'),
        ('health_certificate', '健康证明'),
        ('quarantine_certificate', '检疫证书'),
        ('photo', '照片'),
        ('other', '其他'),
    ]
    
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='documents', verbose_name='批次')
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES, verbose_name='文档类型')
    file_path = models.CharField(max_length=255, verbose_name='文件路径')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='上传人')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')
    
    class Meta:
        verbose_name = '文档'
        verbose_name_plural = '文档'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.batch.batch_number} - {self.get_document_type_display()}"


class ApprovalHistory(models.Model):
    ACTION_CHOICES = [
        ('release', '放行'),
        ('extend', '延长隔离'),
        ('return', '退运'),
        ('veterinary_review', '兽医复核'),
    ]
    
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='approval_history', verbose_name='批次')
    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='审批人')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='操作')
    reason = models.TextField(blank=True, null=True, verbose_name='原因')
    extend_days = models.IntegerField(blank=True, null=True, verbose_name='延长天数')
    action_time = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')
    
    class Meta:
        verbose_name = '审批历史'
        verbose_name_plural = '审批历史'
        ordering = ['-action_time']
    
    def __str__(self):
        return f"{self.batch.batch_number} - {self.get_action_display()} - {self.approver.full_name}"


class StatusHistory(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='status_history', verbose_name='批次')
    from_status = models.CharField(max_length=20, blank=True, null=True, verbose_name='原状态')
    to_status = models.CharField(max_length=20, verbose_name='新状态')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='变更人')
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name='变更时间')
    notes = models.TextField(blank=True, null=True, verbose_name='备注')
    
    class Meta:
        verbose_name = '状态历史'
        verbose_name_plural = '状态历史'
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.batch.batch_number} - {self.to_status}"