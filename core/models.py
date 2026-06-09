from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from decimal import Decimal


class Role(models.TextChoices):
    RESEARCHER = 'researcher', '课题组经办人'
    COLLEGE_ADMIN = 'college_admin', '学院管理员'
    ASSET_STAFF = 'asset_staff', '资产人员'
    FINANCE_STAFF = 'finance_staff', '财务人员'


class ProcurementStatus(models.TextChoices):
    DRAFT = 'draft', '草稿'
    SUBMITTED = 'submitted', '已提交'
    BUDGET_FROZEN = 'budget_frozen', '预算已冻结'
    ACCEPTED = 'accepted', '已验收'
    FINANCE_REVIEW = 'finance_review', '财务复核中'
    REIMBURSED = 'reimbursed', '已核销'
    REJECTED = 'rejected', '已驳回'


class ExceptionReason(models.TextChoices):
    NONE = 'none', '无异常'
    BUDGET_INSUFFICIENT = 'budget_insufficient', '预算不足'
    INVOICE_TITLE_ERROR = 'invoice_title_error', '发票抬头错误'
    PARAMETER_MISMATCH = 'parameter_mismatch', '设备参数不符'


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.RESEARCHER)
    phone = models.CharField(max_length=20, blank=True, null=True)
    college = models.ForeignKey('College', on_delete=models.SET_NULL, blank=True, null=True, related_name='members')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.username} - {self.get_role_display()}'


class College(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='学院名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='学院代码')
    dean = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='dean_colleges', verbose_name='院长')

    class Meta:
        verbose_name = '学院'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class ResearchProject(models.Model):
    name = models.CharField(max_length=200, verbose_name='课题名称')
    project_no = models.CharField(max_length=50, unique=True, verbose_name='课题编号')
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='projects', verbose_name='所属学院')
    principal = models.ForeignKey(User, on_delete=models.CASCADE, related_name='managed_projects', verbose_name='课题负责人')
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    total_budget = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='总预算')
    description = models.TextField(blank=True, verbose_name='课题描述')

    class Meta:
        verbose_name = '课题'
        verbose_name_plural = verbose_name
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.project_no} - {self.name}'

    @property
    def used_budget(self):
        result = self.budget_items.aggregate(
            total_used=models.Sum('used_amount'),
            total_frozen=models.Sum('frozen_amount')
        )
        total_used = result['total_used'] or Decimal('0')
        total_frozen = result['total_frozen'] or Decimal('0')
        return total_used + total_frozen

    @property
    def available_budget(self):
        return self.total_budget - self.used_budget


class BudgetSubject(models.Model):
    name = models.CharField(max_length=100, verbose_name='预算科目名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='科目代码')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='children', verbose_name='上级科目')

    class Meta:
        verbose_name = '预算科目'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.code} - {self.name}'


class ProjectBudget(models.Model):
    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='budget_items', verbose_name='课题')
    subject = models.ForeignKey(BudgetSubject, on_delete=models.CASCADE, verbose_name='预算科目')
    planned_amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='计划金额')
    frozen_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), verbose_name='已冻结金额')
    used_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), verbose_name='已使用金额')

    class Meta:
        verbose_name = '课题预算'
        verbose_name_plural = verbose_name
        unique_together = ['project', 'subject']

    def __str__(self):
        return f'{self.project.project_no} - {self.subject.name}'

    @property
    def available_amount(self):
        return self.planned_amount - self.frozen_amount


class Supplier(models.Model):
    name = models.CharField(max_length=200, verbose_name='供应商名称')
    tax_no = models.CharField(max_length=50, unique=True, verbose_name='税号')
    contact_person = models.CharField(max_length=50, verbose_name='联系人')
    phone = models.CharField(max_length=20, verbose_name='联系电话')
    address = models.CharField(max_length=300, blank=True, verbose_name='地址')
    bank_account = models.CharField(max_length=100, blank=True, verbose_name='银行账号')

    class Meta:
        verbose_name = '供应商'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Procurement(models.Model):
    title = models.CharField(max_length=200, verbose_name='采购标题')
    procurement_no = models.CharField(max_length=50, unique=True, verbose_name='采购编号')
    project = models.ForeignKey(ResearchProject, on_delete=models.CASCADE, related_name='procurements', verbose_name='所属课题')
    budget_subject = models.ForeignKey(BudgetSubject, on_delete=models.CASCADE, verbose_name='预算科目')
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applied_procurements', verbose_name='申请人')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='procurements', verbose_name='供应商')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='采购金额')
    equipment_name = models.CharField(max_length=200, verbose_name='设备名称')
    equipment_model = models.CharField(max_length=100, verbose_name='设备型号')
    equipment_params = models.TextField(verbose_name='设备参数要求')
    purpose = models.TextField(verbose_name='采购用途')
    status = models.CharField(max_length=20, choices=ProcurementStatus.choices, default=ProcurementStatus.DRAFT, verbose_name='状态')
    exception_reason = models.CharField(max_length=30, choices=ExceptionReason.choices, default=ExceptionReason.NONE, verbose_name='异常原因')
    exception_note = models.TextField(blank=True, verbose_name='异常说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    submitted_at = models.DateTimeField(blank=True, null=True, verbose_name='提交时间')
    budget_frozen_at = models.DateTimeField(blank=True, null=True, verbose_name='预算冻结时间')
    accepted_at = models.DateTimeField(blank=True, null=True, verbose_name='验收时间')
    reimbursed_at = models.DateTimeField(blank=True, null=True, verbose_name='核销时间')

    class Meta:
        verbose_name = '采购申请'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.procurement_no} - {self.title}'

    @property
    def reimbursement_duration(self):
        if self.submitted_at and self.reimbursed_at:
            return (self.reimbursed_at - self.submitted_at).days
        return None

    @property
    def current_node(self):
        return self.history_nodes.order_by('-created_at').first()


class Acceptance(models.Model):
    procurement = models.OneToOneField(Procurement, on_delete=models.CASCADE, related_name='acceptance', verbose_name='采购申请')
    asset_staff = models.ForeignKey(User, on_delete=models.CASCADE, related_name='acceptances', verbose_name='验收人员')
    acceptance_date = models.DateField(verbose_name='验收日期')
    actual_params = models.TextField(verbose_name='实际设备参数')
    passed = models.BooleanField(default=False, verbose_name='是否通过')
    remarks = models.TextField(blank=True, verbose_name='验收备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '设备验收'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.procurement.procurement_no} - 验收'


class Invoice(models.Model):
    procurement = models.OneToOneField(Procurement, on_delete=models.CASCADE, related_name='invoice', verbose_name='采购申请')
    invoice_no = models.CharField(max_length=50, unique=True, verbose_name='发票号码')
    invoice_date = models.DateField(verbose_name='开票日期')
    title = models.CharField(max_length=200, verbose_name='发票抬头')
    amount = models.DecimalField(max_digits=15, decimal_places=2, verbose_name='发票金额')
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'), verbose_name='税额')
    verified = models.BooleanField(default=False, verbose_name='是否复核通过')
    finance_staff = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='verified_invoices', verbose_name='复核人员')
    verification_note = models.TextField(blank=True, verbose_name='复核备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '发票'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.invoice_no} - {self.title}'


class HistoryNode(models.Model):
    procurement = models.ForeignKey(Procurement, on_delete=models.CASCADE, related_name='history_nodes', verbose_name='采购申请')
    status = models.CharField(max_length=20, choices=ProcurementStatus.choices, verbose_name='状态')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, verbose_name='操作人')
    action = models.CharField(max_length=100, verbose_name='操作')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '历史节点'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.procurement.procurement_no} - {self.get_status_display()}'


def add_history_node(procurement, status, operator, action, remark=''):
    HistoryNode.objects.create(
        procurement=procurement,
        status=status,
        operator=operator,
        action=action,
        remark=remark
    )
