from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver


class Exhibit(models.Model):
    LEVEL_CHOICES = [
        ('first', '一级文物'),
        ('second', '二级文物'),
        ('third', '三级文物'),
        ('general', '一般文物'),
    ]

    STATUS_CHOICES = [
        ('in_storage', '在库'),
        ('on_loan', '出借中'),
        ('in_transport', '运输中'),
        ('conserved', '修复中'),
    ]

    name = models.CharField('展品名称', max_length=200)
    accession_number = models.CharField('登记号', max_length=50, unique=True)
    level = models.CharField('文物级别', max_length=20, choices=LEVEL_CHOICES, default='general')
    category = models.CharField('类别', max_length=100, blank=True)
    era = models.CharField('年代', max_length=100, blank=True)
    description = models.TextField('描述', blank=True)
    estimated_value = models.DecimalField('估值(元)', max_digits=15, decimal_places=2, default=0)
    temperature_min = models.FloatField('最低温度(°C)', default=15.0)
    temperature_max = models.FloatField('最高温度(°C)', default=25.0)
    humidity_min = models.FloatField('最低湿度(%)', default=45.0)
    humidity_max = models.FloatField('最高湿度(%)', default=65.0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='in_storage')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '展品'
        verbose_name_plural = '展品'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.accession_number})'

    def get_level_display_short(self):
        return dict(self.LEVEL_CHOICES).get(self.level, self.level)


class Borrower(models.Model):
    TYPE_CHOICES = [
        ('museum', '博物馆'),
        ('gallery', '美术馆'),
        ('university', '高校'),
        ('research', '科研机构'),
        ('other', '其他'),
    ]

    name = models.CharField('借展方名称', max_length=200)
    type = models.CharField('机构类型', max_length=20, choices=TYPE_CHOICES, default='museum')
    contact_person = models.CharField('联系人', max_length=100)
    contact_phone = models.CharField('联系电话', max_length=50)
    contact_email = models.EmailField('邮箱', blank=True)
    address = models.TextField('地址', blank=True)
    credit_rating = models.IntegerField('信用评级(1-5)', default=3)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '借展方'
        verbose_name_plural = '借展方'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class LoanApplication(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('transport_registered', '运输已登记'),
        ('insurance_pending', '待保险复核'),
        ('insurance_approved', '保险已通过'),
        ('insurance_rejected', '保险未通过'),
        ('out_of_storage', '已出库'),
        ('in_transit', '运输中'),
        ('arrived', '已到达'),
        ('on_display', '展出中'),
        ('returning', '归还中'),
        ('returned', '已归还'),
        ('inspection_pending', '待鉴定'),
        ('inspection_done', '鉴定完成'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]

    loan_number = models.CharField('出借编号', max_length=50, unique=True)
    exhibit = models.ForeignKey(Exhibit, on_delete=models.CASCADE, related_name='loans', verbose_name='展品')
    borrower = models.ForeignKey(Borrower, on_delete=models.CASCADE, related_name='loans', verbose_name='借展方')
    purpose = models.TextField('出借目的')
    planned_start_date = models.DateField('计划开始日期')
    planned_end_date = models.DateField('计划结束日期')
    actual_start_date = models.DateField('实际开始日期', null=True, blank=True)
    actual_end_date = models.DateField('实际结束日期', null=True, blank=True)
    status = models.CharField('状态', max_length=30, choices=STATUS_CHOICES, default='draft')
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_loans', verbose_name='提交人')
    submitted_at = models.DateTimeField('提交时间', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '出借申请'
        verbose_name_plural = '出借申请'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.loan_number} - {self.exhibit.name}'

    def get_status_display_with_style(self):
        status_styles = {
            'draft': ('secondary', '草稿'),
            'submitted': ('info', '已提交'),
            'transport_registered': ('info', '运输已登记'),
            'insurance_pending': ('warning', '待保险复核'),
            'insurance_approved': ('success', '保险已通过'),
            'insurance_rejected': ('danger', '保险未通过'),
            'out_of_storage': ('info', '已出库'),
            'in_transit': ('primary', '运输中'),
            'arrived': ('info', '已到达'),
            'on_display': ('success', '展出中'),
            'returning': ('info', '归还中'),
            'returned': ('info', '已归还'),
            'inspection_pending': ('warning', '待鉴定'),
            'inspection_done': ('info', '鉴定完成'),
            'completed': ('success', '已完成'),
            'cancelled': ('secondary', '已取消'),
        }
        return status_styles.get(self.status, ('secondary', self.status))

    def can_submit(self):
        return self.status == 'draft'

    def can_register_transport(self):
        return self.status in ['submitted', 'transport_registered']

    def can_approve_insurance(self):
        return self.status in ['transport_registered', 'insurance_pending']

    def can_release(self):
        return self.status == 'insurance_approved'

    def can_inspect_return(self):
        return self.status in ['returned', 'inspection_pending']

    def get_total_insurance_amount(self):
        total = self.insurance_policies.aggregate(Sum('amount'))['amount__sum']
        return total or 0

    def is_insurance_sufficient(self):
        return self.get_total_insurance_amount() >= self.exhibit.estimated_value

    def has_environment_anomaly(self):
        return self.environment_data.filter(is_anomaly=True).exists()

    def get_return_days(self):
        if self.actual_start_date and self.actual_end_date:
            return (self.actual_end_date - self.actual_start_date).days
        return 0


class TransportRecord(models.Model):
    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='transport_records', verbose_name='出借单')
    route_from = models.CharField('出发地', max_length=200)
    route_to = models.CharField('目的地', max_length=200)
    transport_company = models.CharField('运输公司', max_length=200)
    vehicle_number = models.CharField('车辆编号', max_length=50, blank=True)
    driver_name = models.CharField('司机姓名', max_length=100, blank=True)
    driver_phone = models.CharField('司机电话', max_length=50, blank=True)
    packing_method = models.CharField('包装方式', max_length=200, blank=True)
    estimated_departure = models.DateTimeField('预计出发时间', null=True, blank=True)
    estimated_arrival = models.DateTimeField('预计到达时间', null=True, blank=True)
    actual_departure = models.DateTimeField('实际出发时间', null=True, blank=True)
    actual_arrival = models.DateTimeField('实际到达时间', null=True, blank=True)
    registered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='registered_transports', verbose_name='登记人')
    notes = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '运输记录'
        verbose_name_plural = '运输记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.route_from} → {self.route_to}'


class InsurancePolicy(models.Model):
    STATUS_CHOICES = [
        ('pending', '待复核'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
    ]

    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='insurance_policies', verbose_name='出借单')
    policy_number = models.CharField('保单号', max_length=100)
    insurance_company = models.CharField('保险公司', max_length=200)
    amount = models.DecimalField('保额(元)', max_digits=15, decimal_places=2)
    coverage_type = models.CharField('险种', max_length=200, blank=True)
    start_date = models.DateField('生效日期')
    end_date = models.DateField('到期日期')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_insurances', verbose_name='复核人')
    reviewed_at = models.DateTimeField('复核时间', null=True, blank=True)
    review_notes = models.TextField('复核意见', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '保险单'
        verbose_name_plural = '保险单'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.policy_number} ({self.amount}元)'


class EnvironmentData(models.Model):
    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='environment_data', verbose_name='出借单')
    record_time = models.DateTimeField('记录时间')
    temperature = models.FloatField('温度(°C)')
    humidity = models.FloatField('湿度(%)')
    location = models.CharField('位置', max_length=200, blank=True)
    is_anomaly = models.BooleanField('是否异常', default=False)
    anomaly_type = models.CharField('异常类型', max_length=50, blank=True)
    notes = models.TextField('备注', blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_environments', verbose_name='记录人')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '环境数据'
        verbose_name_plural = '环境数据'
        ordering = ['-record_time']

    def __str__(self):
        return f'{self.record_time} - {self.temperature}°C, {self.humidity}%'

    def check_anomaly(self, exhibit):
        anomalies = []
        if self.temperature < exhibit.temperature_min:
            anomalies.append('温度过低')
        if self.temperature > exhibit.temperature_max:
            anomalies.append('温度过高')
        if self.humidity < exhibit.humidity_min:
            anomalies.append('湿度过低')
        if self.humidity > exhibit.humidity_max:
            anomalies.append('湿度过高')
        if anomalies:
            self.is_anomaly = True
            self.anomaly_type = '、'.join(anomalies)
        else:
            self.is_anomaly = False
            self.anomaly_type = ''


class ReturnInspection(models.Model):
    CONDITION_CHOICES = [
        ('perfect', '完好'),
        ('minor_damage', '轻微损伤'),
        ('major_damage', '严重损伤'),
        ('lost', '丢失'),
    ]

    loan = models.OneToOneField(LoanApplication, on_delete=models.CASCADE, related_name='return_inspection', verbose_name='出借单')
    return_date = models.DateField('归还日期')
    condition = models.CharField('归还状况', max_length=20, choices=CONDITION_CHOICES)
    description = models.TextField('详细描述')
    photos = models.TextField('照片记录', blank=True)
    conservator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inspections', verbose_name='鉴定人')
    inspection_date = models.DateField('鉴定日期', null=True, blank=True)
    recommendations = models.TextField('处理建议', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '归还鉴定'
        verbose_name_plural = '归还鉴定'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.loan.loan_number} - {self.get_condition_display()}'

    def get_condition_display_with_style(self):
        styles = {
            'perfect': ('success', '完好'),
            'minor_damage': ('warning', '轻微损伤'),
            'major_damage': ('danger', '严重损伤'),
            'lost': ('danger', '丢失'),
        }
        return styles.get(self.condition, ('secondary', self.condition))


class StatusHistory(models.Model):
    loan = models.ForeignKey(LoanApplication, on_delete=models.CASCADE, related_name='status_history', verbose_name='出借单')
    from_status = models.CharField('原状态', max_length=30, blank=True)
    to_status = models.CharField('目标状态', max_length=30)
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='操作人')
    change_reason = models.TextField('变更原因', blank=True)
    changed_at = models.DateTimeField('变更时间', default=timezone.now)

    class Meta:
        verbose_name = '状态历史'
        verbose_name_plural = '状态历史'
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.loan.loan_number}: {self.from_status} → {self.to_status}'

    def get_to_status_display(self):
        return dict(LoanApplication.STATUS_CHOICES).get(self.to_status, self.to_status)

    def get_from_status_display(self):
        if not self.from_status:
            return '创建'
        return dict(LoanApplication.STATUS_CHOICES).get(self.from_status, self.from_status)


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('collection_clerk', '馆藏经办人'),
        ('transport_coordinator', '运输协调人'),
        ('insurance_reviewer', '保险复核人'),
        ('conservator', '文保人员'),
        ('admin', '系统管理员'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField('角色', max_length=30, choices=ROLE_CHOICES, default='collection_clerk')
    phone = models.CharField('电话', max_length=50, blank=True)
    department = models.CharField('部门', max_length=100, blank=True)

    class Meta:
        verbose_name = '用户档案'
        verbose_name_plural = '用户档案'

    def __str__(self):
        return f'{self.user.username} - {self.get_role_display()}'

    def is_collection_clerk(self):
        return self.role == 'collection_clerk' or self.role == 'admin'

    def is_transport_coordinator(self):
        return self.role == 'transport_coordinator' or self.role == 'admin'

    def is_insurance_reviewer(self):
        return self.role == 'insurance_reviewer' or self.role == 'admin'

    def is_conservator(self):
        return self.role == 'conservator' or self.role == 'admin'

    def is_admin(self):
        return self.role == 'admin'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
