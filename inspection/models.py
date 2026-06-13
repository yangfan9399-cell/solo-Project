from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import uuid


class User(AbstractUser):
    ROLE_FIELD = (
        ('field', '现场人员'),
        ('supervisor', '主管复核人'),
        ('admin', '系统管理员'),
    )
    role = models.CharField('角色', max_length=20, choices=ROLE_FIELD, default='field')
    phone = models.CharField('联系电话', max_length=20, blank=True)
    department = models.CharField('所属部门', max_length=100, blank=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'


class CablewayEquipment(models.Model):
    STATUS_CHOICES = (
        ('running', '运行中'),
        ('stopped', '停运'),
        ('maintenance', '维护中'),
    )
    equipment_no = models.CharField('设备编号', max_length=50, unique=True)
    name = models.CharField('设备名称', max_length=100)
    location = models.CharField('所在位置', max_length=200)
    manufacturer = models.CharField('生产厂家', max_length=100, blank=True)
    install_date = models.DateField('安装日期', null=True, blank=True)
    status = models.CharField('设备状态', max_length=20, choices=STATUS_CHOICES, default='running')
    daily_inspection_items = models.JSONField('日检项配置', default=list, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '索道设备'
        verbose_name_plural = verbose_name
        ordering = ['equipment_no']

    def __str__(self):
        return f'{self.equipment_no} - {self.name}'


class DailyInspection(models.Model):
    SOURCE_CHOICES = (
        ('scheduled', '例行日检'),
        ('incident', '事件触发'),
        ('complaint', '投诉举报'),
        ('supervise', '上级督查'),
    )
    STATUS_CHOICES = (
        ('pending', '待受理'),
        ('processing', '处理中'),
        ('reviewing', '复核中'),
        ('approved', '正常放行'),
        ('rejected', '异常阻断'),
        ('returned', '退回补证'),
        ('archived', '已归档'),
        ('timeout', '审批超时'),
    )
    ABNORMAL_TYPE_CHOICES = (
        ('normal', '正常'),
        ('metric_exceed', '指标超限'),
        ('evidence_missing', '现场证据缺失'),
        ('approval_timeout', '审批超时'),
    )

    id = models.UUIDField('主键ID', primary_key=True, default=uuid.uuid4, editable=False)
    inspection_no = models.CharField('日检单号', max_length=50, unique=True)
    equipment = models.ForeignKey(CablewayEquipment, on_delete=models.PROTECT, verbose_name='索道设备', related_name='inspections')
    source = models.CharField('来源', max_length=30, choices=SOURCE_CHOICES, default='scheduled')
    inspection_date = models.DateField('日检日期')
    inspector = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='现场日检员', related_name='inspections')
    current_handler = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='当前责任人', related_name='handling_inspections', null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    abnormal_type = models.CharField('异常类型', max_length=30, choices=ABNORMAL_TYPE_CHOICES, default='normal')
    is_archived = models.BooleanField('是否归档', default=False)
    summary = models.TextField('日检摘要', blank=True)
    conclusion = models.TextField('最终结论', blank=True)
    block_reason = models.TextField('阻断原因', blank=True)
    remediation_path = models.TextField('补救路径', blank=True)
    estimated_loss = models.DecimalField('预估损失金额', max_digits=12, decimal_places=2, default=0)
    actual_loss = models.DecimalField('实际损失金额', max_digits=12, decimal_places=2, null=True, blank=True)
    responsible_party = models.CharField('责任对象', max_length=200, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    submitted_at = models.DateTimeField('提交时间', null=True, blank=True)
    reviewed_at = models.DateTimeField('复核时间', null=True, blank=True)
    archived_at = models.DateTimeField('归档时间', null=True, blank=True)
    deadline = models.DateTimeField('审批截止时间', null=True, blank=True)

    class Meta:
        verbose_name = '日检记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.inspection_no

    @property
    def is_readonly(self):
        return self.is_archived

    @property
    def abnormal_metrics(self):
        return self.metrics.filter(is_abnormal=True)

    @property
    def diff_fields(self):
        diffs = []
        for node in self.nodes.order_by('-created_at')[:2]:
            if node.snapshot:
                return node.snapshot.get('diff_fields', [])
        return diffs

    def get_latest_node(self):
        return self.nodes.order_by('-created_at').first()


class InspectionMetric(models.Model):
    CATEGORY_CHOICES = (
        ('mechanical', '机械系统'),
        ('electrical', '电气系统'),
        ('safety', '安全装置'),
        ('structure', '结构设施'),
    )
    inspection = models.ForeignKey(DailyInspection, on_delete=models.CASCADE, verbose_name='日检记录', related_name='metrics')
    metric_name = models.CharField('指标名称', max_length=100)
    category = models.CharField('指标类别', max_length=30, choices=CATEGORY_CHOICES, default='mechanical')
    standard_value = models.CharField('标准值', max_length=100)
    measured_value = models.CharField('实测值', max_length=100)
    unit = models.CharField('单位', max_length=20, blank=True)
    is_abnormal = models.BooleanField('是否异常', default=False)
    abnormal_desc = models.TextField('异常说明', blank=True)
    sort_order = models.IntegerField('排序', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '日检指标'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.metric_name}: {self.measured_value}'


class EvidenceAttachment(models.Model):
    TYPE_CHOICES = (
        ('photo', '现场照片'),
        ('video', '视频录像'),
        ('document', '文档资料'),
        ('report', '检测报告'),
    )
    inspection = models.ForeignKey(DailyInspection, on_delete=models.CASCADE, verbose_name='日检记录', related_name='evidences')
    node = models.ForeignKey('ApprovalNode', on_delete=models.SET_NULL, verbose_name='审批节点', related_name='evidences', null=True, blank=True)
    file_type = models.CharField('文件类型', max_length=20, choices=TYPE_CHOICES, default='photo')
    file = models.FileField('附件文件', upload_to='evidences/%Y/%m/%d/')
    file_name = models.CharField('文件名', max_length=200)
    description = models.TextField('证据说明', blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='上传人')
    created_at = models.DateTimeField('上传时间', auto_now_add=True)

    class Meta:
        verbose_name = '证据附件'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name


class ApprovalNode(models.Model):
    ACTION_CHOICES = (
        ('submit', '提交受理'),
        ('accept', '受理'),
        ('process', '处理补充'),
        ('submit_review', '提交复核'),
        ('approve', '正常放行'),
        ('reject', '异常阻断'),
        ('return', '退回补证'),
        ('archive', '归档'),
        ('reopen', '重新处理'),
        ('timeout', '审批超时'),
    )

    inspection = models.ForeignKey(DailyInspection, on_delete=models.CASCADE, verbose_name='日检记录', related_name='nodes')
    node_no = models.CharField('节点编号', max_length=50)
    action = models.CharField('操作动作', max_length=30, choices=ACTION_CHOICES)
    action_time = models.DateTimeField('操作时间', default=timezone.now)
    operator = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='操作人', related_name='approval_nodes')
    previous_status = models.CharField('上一状态', max_length=20, blank=True)
    next_status = models.CharField('下一状态', max_length=20)
    remarks = models.TextField('处理意见', blank=True)
    basis = models.TextField('采用依据', blank=True)
    snapshot = models.JSONField('数据快照', default=dict, blank=True)
    is_key_change = models.BooleanField('是否关键变更', default=False)
    key_change_desc = models.TextField('关键变更说明', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '审批节点'
        verbose_name_plural = verbose_name
        ordering = ['created_at', 'id']

    def __str__(self):
        return f'{self.get_action_display()} - {self.node_no}'

    def save(self, *args, **kwargs):
        if not self.node_no:
            count = self.inspection.nodes.count() + 1
            self.node_no = f'{self.inspection.inspection_no}-N{count:02d}'
        super().save(*args, **kwargs)


class BusinessRecord(models.Model):
    RECORD_TYPE_CHOICES = (
        ('fault', '故障记录'),
        ('maintenance', '维护记录'),
        ('incident', '事件记录'),
        ('other', '其他记录'),
    )
    inspection = models.ForeignKey(DailyInspection, on_delete=models.CASCADE, verbose_name='日检记录', related_name='business_records')
    node = models.ForeignKey(ApprovalNode, on_delete=models.SET_NULL, verbose_name='审批节点', related_name='business_records', null=True, blank=True)
    record_type = models.CharField('记录类型', max_length=20, choices=RECORD_TYPE_CHOICES, default='other')
    title = models.CharField('记录标题', max_length=200)
    content = models.TextField('记录内容')
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='记录人')
    record_time = models.DateTimeField('记录时间', default=timezone.now)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '业务记录'
        verbose_name_plural = verbose_name
        ordering = ['-record_time']

    def __str__(self):
        return self.title
