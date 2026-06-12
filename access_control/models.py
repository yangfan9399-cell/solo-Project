from django.db import models
from django.db.models import JSONField, Max
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from accounts.models import User


class AccessRecoveryRecord(models.Model):
    class Status(models.TextChoices):
        PENDING_ACCEPT = 'pending_accept', _('待受理')
        ACCEPTED = 'accepted', _('已受理')
        PROCESSING = 'processing', _('处理中')
        REVIEWING = 'reviewing', _('复核中')
        ARCHIVED = 'archived', _('已归档')
        REJECTED = 'rejected', _('已退回')

    class SampleType(models.TextChoices):
        NORMAL_RELEASE = 'normal_release', _('正常放行')
        OVER_LIMIT = 'over_limit', _('指标超限')
        EVIDENCE_MISSING = 'evidence_missing', _('现场证据缺失')
        TIMEOUT = 'timeout', _('审批超时')

    class SourceType(models.TextChoices):
        AUTO_SCAN = 'auto_scan', _('系统自动扫描')
        MANUAL_REPORT = 'manual_report', _('人工报备')
        COMPLAINT = 'complaint', _('投诉举报')
        AUDIT = 'audit', _('审计发现')

    record_no = models.CharField(max_length=50, unique=True, verbose_name='记录编号')
    title = models.CharField(max_length=200, verbose_name='标题')
    source = models.CharField(max_length=30, choices=SourceType.choices, default=SourceType.AUTO_SCAN, verbose_name='来源')
    sample_type = models.CharField(max_length=30, choices=SampleType.choices, verbose_name='样本类型')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.PENDING_ACCEPT, verbose_name='状态')

    applicant_name = models.CharField(max_length=100, verbose_name='申请人姓名')
    applicant_dept = models.CharField(max_length=100, verbose_name='申请人部门')
    applicant_id = models.CharField(max_length=50, verbose_name='申请人工号')

    lab_name = models.CharField(max_length=150, verbose_name='实验室名称')
    lab_code = models.CharField(max_length=50, verbose_name='实验室编号')
    access_area = models.CharField(max_length=150, verbose_name='授权区域')

    original_authorized_date = models.DateField(verbose_name='原授权日期')
    expiry_date = models.DateField(verbose_name='到期日期')
    recovered_date = models.DateField(null=True, blank=True, verbose_name='实际回收日期')
    deadline = models.DateTimeField(null=True, blank=True, verbose_name='处理截止时间')

    authorized_person_count = models.IntegerField(default=0, verbose_name='授权人数')
    involved_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='涉及金额')
    risk_level = models.CharField(max_length=20, default='medium', choices=[
        ('low', '低风险'), ('medium', '中风险'), ('high', '高风险'), ('critical', '极高风险')
    ], verbose_name='风险等级')

    business_note = models.TextField(blank=True, verbose_name='业务记录')
    site_description = models.TextField(blank=True, verbose_name='现场说明')
    conclusion = models.TextField(blank=True, verbose_name='处理结论')
    recovery_basis = models.TextField(blank=True, verbose_name='采用依据')
    remedial_path = models.TextField(blank=True, verbose_name='补救路径')
    block_reason = models.TextField(blank=True, verbose_name='阻断原因')

    current_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_records', verbose_name='当前责任人')
    accepted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='accepted_records', verbose_name='受理人')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_records', verbose_name='处理人')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reviewed_records', verbose_name='复核人')
    archived_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='archived_records', verbose_name='归档人')

    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name='受理时间')
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='复核时间')
    archived_at = models.DateTimeField(null=True, blank=True, verbose_name='归档时间')

    is_archived = models.BooleanField(default=False, verbose_name='是否已归档')
    is_blocked = models.BooleanField(default=False, verbose_name='是否被阻断')
    has_anomaly = models.BooleanField(default=False, verbose_name='是否存在异常')

    diff_fields = JSONField(default=dict, blank=True, verbose_name='差异字段')
    snapshot_before = JSONField(default=dict, blank=True, verbose_name='处理前快照')
    snapshot_after = JSONField(default=dict, blank=True, verbose_name='处理后快照')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_records', verbose_name='创建人')

    class Meta:
        verbose_name = '门禁授权回收记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'sample_type']),
            models.Index(fields=['expiry_date', 'recovered_date']),
            models.Index(fields=['current_owner', 'is_archived']),
        ]

    def __str__(self):
        return f'{self.record_no} - {self.title}'

    @property
    def is_overdue(self):
        if self.deadline and self.status not in [self.Status.ARCHIVED, self.Status.REJECTED]:
            return timezone.now() > self.deadline
        return False

    @property
    def days_overdue(self):
        if self.is_overdue and self.deadline:
            return (timezone.now() - self.deadline).days
        return 0

    @property
    def processing_days(self):
        if self.accepted_at:
            end_time = self.archived_at or timezone.now()
            return (end_time - self.accepted_at).days
        return 0

    def get_status_display_class(self):
        status_classes = {
            self.Status.PENDING_ACCEPT: 'bg-warning',
            self.Status.ACCEPTED: 'bg-info',
            self.Status.PROCESSING: 'bg-primary',
            self.Status.REVIEWING: 'bg-secondary',
            self.Status.ARCHIVED: 'bg-success',
            self.Status.REJECTED: 'bg-danger',
        }
        return status_classes.get(self.status, 'bg-secondary')

    def get_risk_display_class(self):
        risk_classes = {
            'low': 'text-success',
            'medium': 'text-warning',
            'high': 'text-orange',
            'critical': 'text-danger',
        }
        return risk_classes.get(self.risk_level, 'text-secondary')

    def can_edit(self, user):
        if self.is_archived:
            return False
        if user.is_superuser or user.is_admin:
            return True
        if user.is_reviewer:
            return self.status in [self.Status.REVIEWING, self.Status.PROCESSING]
        if user.is_field_staff:
            return self.status in [self.Status.ACCEPTED, self.Status.PROCESSING, self.Status.REJECTED]
        return False

    def can_archive(self, user):
        if self.is_archived:
            return False
        return self.status == self.Status.REVIEWING and (user.is_reviewer or user.is_admin or user.is_superuser)

    def save(self, *args, **kwargs):
        if not self.record_no:
            import random
            today = timezone.now().strftime('%Y%m%d')
            timestamp = timezone.now().strftime('%H%M%S')
            random_suffix = random.randint(1000, 9999)
            self.record_no = f'ARR-{today}-{timestamp}-{random_suffix}'
        super().save(*args, **kwargs)


class ProcessingNode(models.Model):
    class NodeType(models.TextChoices):
        ACCEPT = 'accept', _('受理')
        PROCESS = 'process', _('处理')
        SUBMIT_REVIEW = 'submit_review', _('提交复核')
        REVIEW_PASS = 'review_pass', _('复核通过')
        REVIEW_REJECT = 'review_reject', _('复核退回')
        ARCHIVE = 'archive', _('归档')
        SUPPLEMENT = 'supplement', _('补充材料')
        REOPEN = 'reopen', _('重新处理')
        BLOCK = 'block', _('异常阻断')
        UNBLOCK = 'unblock', _('解除阻断')

    record = models.ForeignKey(AccessRecoveryRecord, on_delete=models.CASCADE, related_name='nodes', verbose_name='关联记录')
    node_type = models.CharField(max_length=30, choices=NodeType.choices, verbose_name='节点类型')
    node_title = models.CharField(max_length=200, verbose_name='节点标题')
    description = models.TextField(blank=True, verbose_name='节点描述')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='operated_nodes', verbose_name='操作人')
    previous_status = models.CharField(max_length=30, choices=AccessRecoveryRecord.Status.choices, verbose_name='变更前状态')
    new_status = models.CharField(max_length=30, choices=AccessRecoveryRecord.Status.choices, verbose_name='变更后状态')

    field_changes = JSONField(default=dict, blank=True, verbose_name='字段变更')
    remarks = models.TextField(blank=True, verbose_name='备注')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    sequence = models.IntegerField(default=0, verbose_name='节点序号')

    class Meta:
        verbose_name = '处理节点'
        verbose_name_plural = verbose_name
        ordering = ['record', 'sequence', '-created_at']
        indexes = [
            models.Index(fields=['record', 'node_type']),
        ]

    def __str__(self):
        return f'{self.record.record_no} - {self.get_node_type_display()}'

    def save(self, *args, **kwargs):
        if self.sequence == 0:
            max_sequence = ProcessingNode.objects.filter(record=self.record).aggregate(
                max_seq=models.Max('sequence')
            )['max_seq'] or 0
            self.sequence = max_sequence + 1
        super().save(*args, **kwargs)


class EvidenceAttachment(models.Model):
    class EvidenceType(models.TextChoices):
        PHOTO = 'photo', _('现场照片')
        VIDEO = 'video', _('视频录像')
        DOCUMENT = 'document', _('书面文档')
        SIGNATURE = 'signature', _('签字确认')
        ACCESS_LOG = 'access_log', _('门禁日志')
        OTHER = 'other', _('其他')

    record = models.ForeignKey(AccessRecoveryRecord, on_delete=models.CASCADE, related_name='evidences', verbose_name='关联记录')
    node = models.ForeignKey(ProcessingNode, on_delete=models.SET_NULL, null=True, blank=True, related_name='evidences', verbose_name='关联节点')
    evidence_type = models.CharField(max_length=30, choices=EvidenceType.choices, verbose_name='证据类型')
    title = models.CharField(max_length=200, verbose_name='证据标题')
    description = models.TextField(blank=True, verbose_name='证据描述')
    file = models.FileField(upload_to='evidences/%Y/%m/%d/', verbose_name='附件文件')
    file_name = models.CharField(max_length=255, blank=True, verbose_name='原始文件名')
    file_size = models.BigIntegerField(default=0, verbose_name='文件大小(字节)')

    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_evidences', verbose_name='上传人')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')

    is_valid = models.BooleanField(default=True, verbose_name='是否有效')
    invalid_reason = models.TextField(blank=True, verbose_name='失效原因')

    class Meta:
        verbose_name = '证据附件'
        verbose_name_plural = verbose_name
        ordering = ['-uploaded_at']

    def __str__(self):
        return f'{self.evidence_type} - {self.title}'


class FieldChangeLog(models.Model):
    record = models.ForeignKey(AccessRecoveryRecord, on_delete=models.CASCADE, related_name='change_logs', verbose_name='关联记录')
    node = models.ForeignKey(ProcessingNode, on_delete=models.SET_NULL, null=True, related_name='change_logs', verbose_name='关联节点')
    field_name = models.CharField(max_length=100, verbose_name='字段名称')
    field_label = models.CharField(max_length=100, verbose_name='字段显示名')
    old_value = models.TextField(blank=True, verbose_name='原值')
    new_value = models.TextField(blank=True, verbose_name='新值')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='修改人')
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name='修改时间')

    class Meta:
        verbose_name = '字段变更日志'
        verbose_name_plural = verbose_name
        ordering = ['-changed_at']
        indexes = [
            models.Index(fields=['record', 'field_name']),
        ]

    def __str__(self):
        return f'{self.record.record_no} - {self.field_label}'


class AnomalyBlockRecord(models.Model):
    record = models.ForeignKey(AccessRecoveryRecord, on_delete=models.CASCADE, related_name='anomaly_blocks', verbose_name='关联记录')
    node = models.ForeignKey(ProcessingNode, on_delete=models.SET_NULL, null=True, related_name='anomaly_blocks', verbose_name='关联节点')
    block_code = models.CharField(max_length=50, verbose_name='阻断代码')
    block_reason = models.TextField(verbose_name='阻断原因')
    diff_fields = JSONField(default=dict, blank=True, verbose_name='差异字段详情')
    remedial_path = models.TextField(verbose_name='补救路径')
    blocked_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='blocked_records', verbose_name='阻断人')
    blocked_at = models.DateTimeField(auto_now_add=True, verbose_name='阻断时间')
    resolved = models.BooleanField(default=False, verbose_name='是否已解决')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='resolved_blocks', verbose_name='解决人')
    resolution_note = models.TextField(blank=True, verbose_name='解决说明')

    class Meta:
        verbose_name = '异常阻断记录'
        verbose_name_plural = verbose_name
        ordering = ['-blocked_at']

    def __str__(self):
        return f'{self.record.record_no} - {self.block_code}'
