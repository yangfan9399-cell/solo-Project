from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [
        ('constructor', '施工队'),
        ('project_manager', '项目经理'),
        ('safety_officer', '安全员'),
        ('acceptor', '验收人'),
        ('admin', '系统管理员'),
    ]

    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='constructor')
    real_name = models.CharField('真实姓名', max_length=50, blank=True)
    phone = models.CharField('联系电话', max_length=20, blank=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.real_name or self.username


class BillboardLocation(models.Model):
    LOCATION_TYPE_CHOICES = [
        ('rooftop', '楼顶'),
        ('wall', '墙面'),
        ('standalone', '单立柱'),
        ('bus_stop', '公交站亭'),
        ('subway', '地铁站'),
    ]

    code = models.CharField('点位编号', max_length=30, unique=True)
    name = models.CharField('点位名称', max_length=100)
    city = models.CharField('所在城市', max_length=50)
    address = models.CharField('详细地址', max_length=200, blank=True)
    location_type = models.CharField('点位类型', max_length=20, choices=LOCATION_TYPE_CHOICES)
    height = models.DecimalField('安装高度(米)', max_digits=6, decimal_places=2, default=0)
    width = models.DecimalField('广告牌宽度(米)', max_digits=6, decimal_places=2, default=0)
    height_dim = models.DecimalField('广告牌高度(米)', max_digits=6, decimal_places=2, default=0)
    is_active = models.BooleanField('是否启用', default=True)
    description = models.TextField('点位描述', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '广告牌点位'
        verbose_name_plural = verbose_name
        ordering = ['city', 'code']

    def __str__(self):
        return f'[{self.code}] {self.name}'


class Worker(models.Model):
    name = models.CharField('姓名', max_length=50)
    id_card = models.CharField('身份证号', max_length=18, unique=True)
    phone = models.CharField('联系电话', max_length=20, blank=True)
    gender = models.CharField('性别', max_length=10, choices=[('male', '男'), ('female', '女')], default='male')
    birth_date = models.DateField('出生日期', null=True, blank=True)
    is_active = models.BooleanField('是否在职', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '施工人员'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def has_valid_high_altitude_cert(self):
        return self.qualification_set.filter(
            cert_type='high_altitude',
            is_valid=True,
            expiry_date__gte=timezone.now().date()
        ).exists()


class Qualification(models.Model):
    CERT_TYPE_CHOICES = [
        ('high_altitude', '高空作业证'),
        ('electrician', '电工证'),
        ('welding', '焊工证'),
        ('lifting', '起重作业证'),
        ('safety', '安全员证'),
    ]

    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, verbose_name='施工人员')
    cert_type = models.CharField('证书类型', max_length=20, choices=CERT_TYPE_CHOICES)
    cert_no = models.CharField('证书编号', max_length=50)
    issue_date = models.DateField('发证日期')
    expiry_date = models.DateField('到期日期')
    issuing_authority = models.CharField('发证机关', max_length=100, blank=True)
    is_valid = models.BooleanField('是否有效', default=True)
    remark = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '资质证书'
        verbose_name_plural = verbose_name
        ordering = ['worker', 'cert_type']

    def __str__(self):
        return f'{self.worker.name} - {self.get_cert_type_display()}'


class WeatherRecord(models.Model):
    WEATHER_CHOICES = [
        ('sunny', '晴'),
        ('cloudy', '多云'),
        ('overcast', '阴'),
        ('rain', '雨'),
        ('snow', '雪'),
        ('fog', '雾'),
        ('thunderstorm', '雷阵雨'),
    ]

    WIND_LEVEL_CHOICES = [
        (0, '0级（无风）'),
        (1, '1级（软风）'),
        (2, '2级（轻风）'),
        (3, '3级（微风）'),
        (4, '4级（和风）'),
        (5, '5级（清劲风）'),
        (6, '6级（强风）'),
        (7, '7级（疾风）'),
        (8, '8级（大风）'),
        (9, '9级（烈风）'),
        (10, '10级（狂风）'),
    ]

    location = models.ForeignKey(BillboardLocation, on_delete=models.CASCADE, verbose_name='点位')
    record_date = models.DateField('记录日期')
    weather = models.CharField('天气状况', max_length=20, choices=WEATHER_CHOICES)
    temperature_high = models.IntegerField('最高温度(℃)', null=True, blank=True)
    temperature_low = models.IntegerField('最低温度(℃)', null=True, blank=True)
    wind_level = models.IntegerField('风力等级', choices=WIND_LEVEL_CHOICES, default=0)
    wind_speed = models.DecimalField('风速(m/s)', max_digits=5, decimal_places=1, default=0)
    wind_direction = models.CharField('风向', max_length=10, blank=True)
    humidity = models.IntegerField('湿度(%)', null=True, blank=True)
    has_wind_warning = models.BooleanField('是否大风预警', default=False)
    warning_level = models.CharField('预警级别', max_length=20, blank=True)
    remark = models.TextField('备注', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '天气记录'
        verbose_name_plural = verbose_name
        unique_together = ['location', 'record_date']
        ordering = ['-record_date']

    def __str__(self):
        return f'{self.location.name} - {self.record_date}'


class ConstructionPlan(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('pm_reviewing', '项目经理审核中'),
        ('pm_rejected', '项目经理退回'),
        ('pm_approved', '项目经理通过'),
        ('safety_reviewing', '安全员审核中'),
        ('safety_rejected', '安全员退回'),
        ('safety_approved', '安全员通过'),
        ('ready', '待开工'),
        ('in_progress', '施工中'),
        ('completed', '已完工待验收'),
        ('acceptance_rejected', '验收退回'),
        ('accepted', '已验收归档'),
        ('cancelled', '已取消'),
    ]

    plan_no = models.CharField('计划编号', max_length=30, unique=True)
    title = models.CharField('施工计划标题', max_length=200)
    location = models.ForeignKey(BillboardLocation, on_delete=models.PROTECT, verbose_name='施工点位')
    constructor_team = models.ForeignKey(
        User, on_delete=models.PROTECT,
        verbose_name='施工队',
        limit_choices_to={'role': 'constructor'},
        related_name='construction_plans'
    )
    project_manager = models.ForeignKey(
        User, on_delete=models.PROTECT,
        verbose_name='项目经理',
        limit_choices_to={'role': 'project_manager'},
        related_name='managed_plans',
        null=True, blank=True
    )
    safety_officer = models.ForeignKey(
        User, on_delete=models.PROTECT,
        verbose_name='安全员',
        limit_choices_to={'role': 'safety_officer'},
        related_name='safety_plans',
        null=True, blank=True
    )

    planned_start_date = models.DateField('计划开工日期')
    planned_end_date = models.DateField('计划完工日期')
    actual_start_date = models.DateField('实际开工日期', null=True, blank=True)
    actual_end_date = models.DateField('实际完工日期', null=True, blank=True)

    workers = models.ManyToManyField(Worker, through='PlanWorker', verbose_name='施工人员')

    construction_content = models.TextField('施工内容')
    materials = models.TextField('主要材料清单', blank=True)
    safety_measures = models.TextField('安全措施', blank=True)
    budget = models.DecimalField('预算金额(元)', max_digits=12, decimal_places=2, default=0)

    status = models.CharField('状态', max_length=30, choices=STATUS_CHOICES, default='draft')
    rework_count = models.IntegerField('返工次数', default=0)
    has_delay = models.BooleanField('是否有延期', default=False)

    submit_time = models.DateTimeField('提交时间', null=True, blank=True)
    accept_time = models.DateTimeField('验收归档时间', null=True, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '施工计划'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.plan_no}] {self.title}'

    def can_submit(self, user):
        return self.status == 'draft' and user.role == 'constructor' and user == self.constructor_team

    def can_pm_review(self, user):
        return self.status == 'submitted' and user.role == 'project_manager'

    def can_safety_review(self, user):
        return self.status == 'pm_approved' and user.role == 'safety_officer'

    def can_accept(self, user):
        return self.status == 'completed' and user.role == 'acceptor'

    def can_start_work(self, user):
        risks = self.get_safety_risks()
        if self.status != 'safety_approved':
            return False, '未通过安全审核，无法开工'
        if user.role != 'constructor' or user != self.constructor_team:
            return False, '无权限开工'
        if risks:
            return False, '；'.join(risks)
        return True, '可以开工'

    def get_safety_risks(self):
        risks = []
        weather = WeatherRecord.objects.filter(
            location=self.location,
            record_date=self.planned_start_date
        ).first()
        if weather and weather.has_wind_warning:
            risks.append(f'大风预警（{weather.get_wind_level_display()}），禁止开工')
        elif weather and weather.wind_level >= 6:
            risks.append(f'风力过大（{weather.get_wind_level_display()}），禁止高空作业')

        if self.location.height >= 2:
            has_high_altitude_worker = False
            plan_workers = PlanWorker.objects.filter(plan=self).select_related('worker')
            for pw in plan_workers:
                if pw.worker.has_valid_high_altitude_cert:
                    has_high_altitude_worker = True
                    break
            if not has_high_altitude_worker and plan_workers.exists():
                risks.append('无有效高空作业证人员，高处作业存在安全隐患')
            elif not plan_workers.exists():
                risks.append('未配置施工人员')

        return risks

    @property
    def current_weather(self):
        return WeatherRecord.objects.filter(
            location=self.location,
            record_date=self.planned_start_date
        ).first()

    @property
    def delay_records(self):
        return DelayRecord.objects.filter(plan=self).order_by('-created_at')

    @property
    def audit_nodes(self):
        return AuditNode.objects.filter(plan=self).order_by('created_at')

    @property
    def status_display(self):
        return self.get_status_display()


class PlanWorker(models.Model):
    plan = models.ForeignKey(ConstructionPlan, on_delete=models.CASCADE, verbose_name='施工计划')
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, verbose_name='施工人员')
    role = models.CharField('岗位', max_length=50, blank=True)
    is_lead = models.BooleanField('是否负责人', default=False)

    class Meta:
        verbose_name = '计划施工人员'
        verbose_name_plural = verbose_name
        unique_together = ['plan', 'worker']

    def __str__(self):
        return f'{self.plan.plan_no} - {self.worker.name}'


class AuditNode(models.Model):
    NODE_TYPE_CHOICES = [
        ('submit', '提交计划'),
        ('pm_review', '项目经理审核'),
        ('safety_review', '安全员审核'),
        ('start_work', '确认开工'),
        ('complete', '施工完成'),
        ('acceptance', '验收归档'),
        ('rework', '退回返工'),
        ('delay', '延期申请'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('approved', '通过'),
        ('rejected', '驳回/退回'),
        ('completed', '已完成'),
    ]

    plan = models.ForeignKey(ConstructionPlan, on_delete=models.CASCADE, verbose_name='施工计划', related_name='nodes')
    node_type = models.CharField('节点类型', max_length=20, choices=NODE_TYPE_CHOICES)
    operator = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='操作人')
    status = models.CharField('处理结果', max_length=20, choices=STATUS_CHOICES, default='pending')
    comment = models.TextField('审核意见', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '审核节点'
        verbose_name_plural = verbose_name
        ordering = ['created_at']

    def __str__(self):
        return f'{self.plan.plan_no} - {self.get_node_type_display()}'


class DelayRecord(models.Model):
    DELAY_TYPE_CHOICES = [
        ('wind', '大风天气'),
        ('rain', '降雨天气'),
        ('material', '材料问题'),
        ('personnel', '人员问题'),
        ('site_issue', '现场问题'),
        ('other', '其他'),
    ]

    plan = models.ForeignKey(ConstructionPlan, on_delete=models.CASCADE, verbose_name='施工计划', related_name='delays')
    delay_type = models.CharField('延期原因', max_length=20, choices=DELAY_TYPE_CHOICES)
    delay_days = models.IntegerField('延期天数')
    original_date = models.DateField('原定日期')
    new_date = models.DateField('延期后日期')
    reason = models.TextField('延期说明')
    applicant = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='申请人', related_name='delay_applications')
    approved = models.BooleanField('是否批准', null=True, blank=True)
    approver = models.ForeignKey(
        User, on_delete=models.PROTECT,
        verbose_name='审批人',
        null=True, blank=True,
        related_name='delay_approvals'
    )
    approval_comment = models.TextField('审批意见', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    approved_at = models.DateTimeField('审批时间', null=True, blank=True)

    class Meta:
        verbose_name = '延期记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.plan.plan_no} - {self.get_delay_type_display()}延期{self.delay_days}天'
