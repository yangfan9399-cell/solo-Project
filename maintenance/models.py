from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class MaintenanceCompany(models.Model):
    name = models.CharField('维保单位名称', max_length=200)
    contact_person = models.CharField('联系人', max_length=100)
    contact_phone = models.CharField('联系电话', max_length=20)
    address = models.TextField('地址', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '维保单位'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Elevator(models.Model):
    STATUS_CHOICES = [
        ('running', '运行中'),
        ('stopped', '已停梯'),
        ('maintenance', '维保中'),
        ('fault', '故障中'),
    ]

    elevator_number = models.CharField('电梯编号', max_length=50, unique=True)
    building = models.CharField('所在楼宇', max_length=100)
    floor = models.CharField('所在楼层', max_length=50)
    manufacturer = models.CharField('生产厂家', max_length=100)
    install_date = models.DateField('安装日期')
    last_maintenance_date = models.DateField('上次维保日期', null=True, blank=True)
    next_maintenance_date = models.DateField('下次维保日期', null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='running')
    maintenance_company = models.ForeignKey(
        MaintenanceCompany,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='维保单位'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '电梯'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.elevator_number} - {self.building}"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('maintenance_staff', '维保人员'),
        ('property_handler', '物业经办人'),
        ('property_reviewer', '物业复核人'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    role = models.CharField('角色', max_length=30, choices=ROLE_CHOICES)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    company = models.ForeignKey(
        MaintenanceCompany,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='所属单位'
    )

    class Meta:
        verbose_name = '用户档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_role_display()}"


class MaintenancePlan(models.Model):
    TYPE_CHOICES = [
        ('regular', '按期维保'),
        ('emergency', '应急维保'),
    ]

    STATUS_CHOICES = [
        ('pending', '待执行'),
        ('in_progress', '执行中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    elevator = models.ForeignKey(Elevator, on_delete=models.CASCADE, verbose_name='电梯')
    plan_type = models.CharField('维保类型', max_length=20, choices=TYPE_CHOICES, default='regular')
    plan_date = models.DateField('计划日期')
    description = models.TextField('维保内容描述')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_plans',
        verbose_name='指派维保人员'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_plans',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    completed_at = models.DateTimeField('完成时间', null=True, blank=True)

    class Meta:
        verbose_name = '维保计划'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.elevator.elevator_number} - {self.get_plan_type_display()}"


class Part(models.Model):
    STATUS_CHOICES = [
        ('in_stock', '库存充足'),
        ('low_stock', '库存不足'),
        ('waiting', '待到货'),
        ('ordered', '已订购'),
    ]

    name = models.CharField('配件名称', max_length=200)
    part_number = models.CharField('配件编号', max_length=100, unique=True)
    specification = models.CharField('规格型号', max_length=200, blank=True)
    quantity = models.IntegerField('库存数量', default=0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='in_stock')
    unit = models.CharField('单位', max_length=20, default='个')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '配件'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.name} ({self.part_number})"


class FaultTicket(models.Model):
    SOURCE_CHOICES = [
        ('resident', '业主报修'),
        ('inspection', '巡检发现'),
        ('alarm', '系统告警'),
        ('maintenance', '维保发现'),
    ]

    STATUS_CHOICES = [
        ('reported', '已报修'),
        ('confirmed', '停梯已确认'),
        ('dispatched', '已派单'),
        ('parts_waiting', '配件待到'),
        ('in_repair', '维修中'),
        ('repaired', '维修完成待复核'),
        ('reviewing', '复核中'),
        ('returned', '已退回'),
        ('archived', '已归档'),
    ]

    PRIORITY_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    ]

    elevator = models.ForeignKey(Elevator, on_delete=models.CASCADE, verbose_name='电梯')
    fault_source = models.CharField('故障来源', max_length=30, choices=SOURCE_CHOICES)
    fault_description = models.TextField('故障描述')
    fault_location = models.CharField('故障位置', max_length=200, blank=True)
    priority = models.CharField('优先级', max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField('状态', max_length=30, choices=STATUS_CHOICES, default='reported')
    is_repeat_fault = models.BooleanField('是否重复故障', default=False)
    previous_ticket = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='上次故障工单'
    )
    repeat_difference = models.TextField('重复故障差异说明', blank=True)
    reporter_name = models.CharField('报修人姓名', max_length=100)
    reporter_phone = models.CharField('报修人电话', max_length=20)
    report_time = models.DateTimeField('报修时间', default=timezone.now)
    stop_confirmation_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='confirmed_tickets',
        verbose_name='停梯确认人'
    )
    stop_confirmation_time = models.DateTimeField('停梯确认时间', null=True, blank=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name='指派维保人员'
    )
    company_mismatch = models.BooleanField('维保单位不匹配', default=False)
    mismatch_note = models.TextField('单位不匹配说明', blank=True)
    assigned_time = models.DateTimeField('派单时间', null=True, blank=True)
    parts_needed = models.ManyToManyField(Part, through='TicketPart', blank=True, verbose_name='所需配件')
    repair_start_time = models.DateTimeField('维修开始时间', null=True, blank=True)
    repair_end_time = models.DateTimeField('维修完成时间', null=True, blank=True)
    repair_description = models.TextField('维修内容描述', blank=True)
    repair_parts_used = models.TextField('使用配件明细', blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_tickets',
        verbose_name='复核人'
    )
    review_time = models.DateTimeField('复核时间', null=True, blank=True)
    review_comment = models.TextField('复核意见', blank=True)
    current_responsible = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsible_tickets',
        verbose_name='当前责任人'
    )
    archived_at = models.DateTimeField('归档时间', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '故障工单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"工单#{self.id} - {self.elevator.elevator_number}"

    def can_archive(self):
        if self.is_repeat_fault and not self.previous_ticket:
            return False
        if self.is_repeat_fault and not self.repeat_difference:
            return False
        return True


class TicketPart(models.Model):
    ticket = models.ForeignKey(FaultTicket, on_delete=models.CASCADE, verbose_name='工单')
    part = models.ForeignKey(Part, on_delete=models.CASCADE, verbose_name='配件')
    quantity_needed = models.IntegerField('需要数量', default=1)
    quantity_used = models.IntegerField('已使用数量', default=0)
    status = models.CharField('状态', max_length=20, default='pending')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '工单配件'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.ticket} - {self.part}"


class ActionLog(models.Model):
    ACTION_CHOICES = [
        ('report', '报修'),
        ('confirm_stop', '确认停梯'),
        ('dispatch', '派单'),
        ('parts_wait', '配件待到'),
        ('start_repair', '开始维修'),
        ('complete_repair', '完成维修'),
        ('submit_check', '提交检查记录'),
        ('review_pass', '复核通过'),
        ('review_return', '复核退回'),
        ('archive', '归档'),
        ('note', '备注'),
        ('status_change', '状态变更'),
    ]

    ticket = models.ForeignKey(
        FaultTicket,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='action_logs',
        verbose_name='关联工单'
    )
    plan = models.ForeignKey(
        MaintenancePlan,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='action_logs',
        verbose_name='关联维保计划'
    )
    action_type = models.CharField('操作类型', max_length=30, choices=ACTION_CHOICES)
    description = models.TextField('操作描述')
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='操作人')
    performed_at = models.DateTimeField('操作时间', auto_now_add=True)
    from_status = models.CharField('变更前状态', max_length=30, blank=True)
    to_status = models.CharField('变更后状态', max_length=30, blank=True)

    class Meta:
        verbose_name = '操作日志'
        verbose_name_plural = verbose_name
        ordering = ['-performed_at']

    def __str__(self):
        return f"{self.get_action_type_display()} - {self.performed_by}"


class MaintenanceRecord(models.Model):
    plan = models.ForeignKey(MaintenancePlan, on_delete=models.CASCADE, verbose_name='维保计划')
    elevator = models.ForeignKey(Elevator, on_delete=models.CASCADE, verbose_name='电梯')
    check_items = models.JSONField('检查项目', default=dict)
    abnormal_items = models.TextField('异常项目', blank=True)
    handling_result = models.TextField('处理结果', blank=True)
    parts_replaced = models.TextField('更换配件', blank=True)
    maintenance_staff = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='maintenance_records',
        verbose_name='维保人员'
    )
    signature = models.TextField('签名', blank=True)
    record_time = models.DateTimeField('记录时间', default=timezone.now)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '维保记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f"{self.elevator.elevator_number} - {self.record_time}"
