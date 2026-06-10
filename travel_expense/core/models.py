import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from decimal import Decimal


class Department(models.Model):
    """部门模型"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='部门名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='部门编码')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_department'
        verbose_name = '部门'
        verbose_name_plural = '部门'

    def __str__(self):
        return self.name


class User(AbstractUser):
    """用户模型"""
    ROLE_CHOICES = [
        ('employee', '员工'),
        ('manager', '部门经理'),
        ('admin', '行政'),
        ('finance', '财务'),
        ('superadmin', '管理员'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee', verbose_name='角色')
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name='部门'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='电话')

    class Meta:
        db_table = 'core_user'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.get_full_name() or self.username

    def is_manager(self):
        return self.role in ['manager', 'superadmin']

    def is_admin_staff(self):
        return self.role in ['admin', 'superadmin']

    def is_finance(self):
        return self.role in ['finance', 'superadmin']

    def is_superadmin(self):
        return self.role == 'superadmin'


class Travel(models.Model):
    """差旅申请模型"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('pending_approval', '待审批'),
        ('pending_booking', '待预订'),
        ('booked', '已预订'),
        ('pending_reimbursement', '待报销'),
        ('completed', '已完成'),
        ('rejected', '已驳回'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='travels',
        verbose_name='申请人'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        related_name='travels',
        verbose_name='部门'
    )
    destination_city = models.CharField(max_length=50, verbose_name='目的地城市')
    purpose = models.TextField(verbose_name='出差事由')
    estimated_budget = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name='预计预算'
    )
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_travel'
        verbose_name = '差旅申请'
        verbose_name_plural = '差旅申请'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.applicant.get_full_name()} - {self.destination_city}"

    @property
    def duration_days(self):
        return (self.end_date - self.start_date).days + 1

    @property
    def budget_difference(self):
        if hasattr(self, 'booking') and self.booking:
            return self.booking.actual_cost - self.estimated_budget
        return None


class Booking(models.Model):
    """行程预订模型"""
    BOOKING_STATUS_CHOICES = [
        ('pending', '待预订'),
        ('booked', '已预订'),
        ('confirmed', '已确认'),
    ]

    OVER_BUDGET_REASON_CHOICES = [
        ('seasonal_high', '旺季价格上调'),
        ('location_price', '地点价格差异'),
        ('emergency_trip', '紧急出差无法提前预订'),
        ('event_special', '展会/会议期间价格上浮'),
        ('quality_requirement', '业务需要的品质要求'),
        ('other', '其他原因'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    travel = models.OneToOneField(
        Travel,
        on_delete=models.CASCADE,
        related_name='booking',
        verbose_name='差旅申请'
    )
    flight_info = models.JSONField(default=dict, blank=True, verbose_name='航班信息')
    hotel_info = models.JSONField(default=dict, blank=True, verbose_name='酒店信息')
    actual_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='实际费用'
    )
    over_budget_reason = models.CharField(
        max_length=50,
        choices=OVER_BUDGET_REASON_CHOICES,
        blank=True,
        null=True,
        verbose_name='超标原因'
    )
    over_budget_reason_text = models.TextField(blank=True, verbose_name='超标原因说明')
    booking_status = models.CharField(
        max_length=20,
        choices=BOOKING_STATUS_CHOICES,
        default='pending',
        verbose_name='预订状态'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_booking'
        verbose_name = '行程预订'
        verbose_name_plural = '行程预订'

    def __str__(self):
        return f"预订 - {self.travel}"


class Reimbursement(models.Model):
    """报销单模型"""
    RECEIPT_STATUS_CHOICES = [
        ('complete', '完整'),
        ('missing', '缺失'),
        ('pending_supplement', '待补充'),
    ]

    REVIEW_STATUS_CHOICES = [
        ('pending', '待复核'),
        ('approved', '已通过'),
        ('returned', '已退回'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    travel = models.OneToOneField(
        Travel,
        on_delete=models.CASCADE,
        related_name='reimbursement',
        verbose_name='差旅申请'
    )
    total_actual_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='实际总费用'
    )
    receipt_status = models.CharField(
        max_length=20,
        choices=RECEIPT_STATUS_CHOICES,
        default='complete',
        verbose_name='票据状态'
    )
    has_flight_receipt = models.BooleanField(default=False, verbose_name='有机票票据')
    has_hotel_receipt = models.BooleanField(default=False, verbose_name='有酒店票据')
    has_meal_receipt = models.BooleanField(default=False, verbose_name='有餐饮票据')
    has_meal_expense = models.BooleanField(default=False, verbose_name='有餐饮报销')
    missing_receipts = models.TextField(blank=True, verbose_name='缺失票据描述')
    finance_comments = models.TextField(blank=True, verbose_name='财务复核意见')
    review_status = models.CharField(
        max_length=20,
        choices=REVIEW_STATUS_CHOICES,
        default='pending',
        verbose_name='复核状态'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'core_reimbursement'
        verbose_name = '报销单'
        verbose_name_plural = '报销单'

    def __str__(self):
        return f"报销 - {self.travel}"

    def validate_receipts(self):
        """验证票据完整性"""
        missing = []
        if self.has_flight_expense and not self.has_flight_receipt:
            missing.append('电子客票行程单')
        if self.has_hotel_expense and not self.has_hotel_receipt:
            missing.append('酒店发票')
        if self.has_meal_expense and not self.has_meal_receipt:
            missing.append('餐饮发票')
        return (len(missing) == 0, missing)

    @property
    def has_flight_expense(self):
        """是否有机票费用"""
        return self.travel.booking and self.travel.booking.flight_info

    @property
    def has_hotel_expense(self):
        """是否有酒店费用"""
        return self.travel.booking and self.travel.booking.hotel_info


class HistoryNode(models.Model):
    """历史节点模型"""
    ACTION_TYPE_CHOICES = [
        ('create', '创建申请'),
        ('submit', '提交申请'),
        ('approve', '审批通过'),
        ('reject', '审批驳回'),
        ('book', '预订行程'),
        ('update_booking', '更新预订'),
        ('create_reimbursement', '创建报销单'),
        ('approve_reimbursement', '报销通过'),
        ('return_reimbursement', '退回报销'),
        ('complete', '完成报销'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    travel = models.ForeignKey(
        Travel,
        on_delete=models.CASCADE,
        related_name='history_nodes',
        verbose_name='差旅申请'
    )
    action_type = models.CharField(max_length=50, choices=ACTION_TYPE_CHOICES, verbose_name='动作类型')
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='history_actions',
        verbose_name='操作人'
    )
    comment = models.TextField(blank=True, verbose_name='操作备注')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'core_history_node'
        verbose_name = '历史节点'
        verbose_name_plural = '历史节点'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.get_action_type_display()} - {self.created_at}"
