from django.db import models
from django.core.exceptions import ValidationError
from core.models import User, Elder


class NursingLevel(models.Model):
    LEVEL_CHOICES = [
        (1, '一级护理'),
        (2, '二级护理'),
        (3, '三级护理'),
        (4, '四级护理'),
        (5, '五级护理'),
    ]

    level = models.IntegerField(choices=LEVEL_CHOICES, unique=True, verbose_name='护理等级')
    name = models.CharField(max_length=50, verbose_name='等级名称')
    description = models.TextField(blank=True, verbose_name='等级描述')
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='月费标准')
    services = models.TextField(blank=True, verbose_name='服务内容')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '护理等级'
        verbose_name_plural = '护理等级'
        ordering = ['level']

    def __str__(self):
        return f"{self.get_level_display()} - {self.name}"


class AssessmentDimension(models.Model):
    name = models.CharField(max_length=100, verbose_name='维度名称')
    description = models.TextField(blank=True, verbose_name='维度描述')
    max_score = models.IntegerField(default=100, verbose_name='最高分')
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=1.0, verbose_name='权重')
    order = models.IntegerField(default=0, verbose_name='排序')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '评估维度'
        verbose_name_plural = '评估维度'
        ordering = ['order', 'id']

    def __str__(self):
        return self.name


class AssessmentItem(models.Model):
    dimension = models.ForeignKey(
        AssessmentDimension,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='所属维度'
    )
    name = models.CharField(max_length=200, verbose_name='评估项目名称')
    description = models.TextField(blank=True, verbose_name='项目描述')
    max_score = models.IntegerField(default=10, verbose_name='最高分')
    order = models.IntegerField(default=0, verbose_name='排序')
    is_required = models.BooleanField(default=True, verbose_name='是否必填')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '评估项目'
        verbose_name_plural = '评估项目'
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.dimension.name} - {self.name}"


class Assessment(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('pending_doctor', '待医生确认'),
        ('pending_family', '待家属确认'),
        ('pending_director', '待院长复核'),
        ('approved', '已生效'),
        ('rejected', '已退回'),
    ]

    elder = models.ForeignKey(
        Elder,
        on_delete=models.CASCADE,
        related_name='assessments',
        verbose_name='长者'
    )
    nurse = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assessments_created',
        verbose_name='评估护士'
    )
    nursing_level = models.ForeignKey(
        NursingLevel,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='建议护理等级'
    )
    previous_nursing_level = models.ForeignKey(
        NursingLevel,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments_previous',
        verbose_name='原护理等级'
    )
    previous_monthly_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='原月费'
    )
    new_monthly_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='新月费'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='状态'
    )
    assessment_date = models.DateField(verbose_name='评估日期')
    assessment_reason = models.TextField(blank=True, verbose_name='评估原因')
    nurse_notes = models.TextField(blank=True, verbose_name='护士备注')
    
    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments_doctor',
        verbose_name='确认医生'
    )
    doctor_confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='医生确认时间')
    doctor_notes = models.TextField(blank=True, verbose_name='医生意见')
    
    family_member = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments_family',
        verbose_name='确认家属'
    )
    family_confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='家属确认时间')
    family_agreed = models.BooleanField(null=True, blank=True, verbose_name='家属是否同意')
    family_notes = models.TextField(blank=True, verbose_name='家属意见')
    objection_reason = models.TextField(blank=True, verbose_name='异议原因')
    
    director = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assessments_director',
        verbose_name='复核院长'
    )
    director_confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='院长复核时间')
    director_approved = models.BooleanField(null=True, blank=True, verbose_name='院长是否批准')
    director_notes = models.TextField(blank=True, verbose_name='院长意见')
    
    effective_at = models.DateTimeField(null=True, blank=True, verbose_name='生效时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '护理评估'
        verbose_name_plural = '护理评估'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.elder.name} - {self.get_status_display()} - {self.assessment_date}"

    def clean(self):
        if self.status == 'approved' and not self.is_complete():
            raise ValidationError('评估表存在缺项，无法生效')

    def is_complete(self):
        required_items = AssessmentItem.objects.filter(is_required=True, is_active=True)
        for item in required_items:
            if not self.scores.filter(item=item).exists():
                return False
        return True

    def get_missing_items(self):
        required_items = AssessmentItem.objects.filter(is_required=True, is_active=True)
        missing = []
        for item in required_items:
            if not self.scores.filter(item=item).exists():
                missing.append(item)
        return missing

    def get_total_score(self):
        total = 0
        for score in self.scores.all():
            dimension = score.item.dimension
            weighted_score = score.score * float(dimension.weight)
            total += weighted_score
        return round(total, 2)

    def get_fee_change(self):
        if self.previous_monthly_fee and self.new_monthly_fee:
            return self.new_monthly_fee - self.previous_monthly_fee
        return None

    def get_level_change_type(self):
        if not self.previous_nursing_level or not self.nursing_level:
            return None
        if self.previous_nursing_level.level == self.nursing_level.level:
            return 'unchanged'
        elif self.previous_nursing_level.level < self.nursing_level.level:
            return 'upgraded'
        else:
            return 'downgraded'


class AssessmentScore(models.Model):
    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='scores',
        verbose_name='评估记录'
    )
    item = models.ForeignKey(
        AssessmentItem,
        on_delete=models.CASCADE,
        related_name='scores',
        verbose_name='评估项目'
    )
    score = models.IntegerField(verbose_name='得分')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '评估得分'
        verbose_name_plural = '评估得分'
        unique_together = ['assessment', 'item']
        ordering = ['item__order', 'item__id']

    def __str__(self):
        return f"{self.assessment.elder.name} - {self.item.name}: {self.score}"

    def clean(self):
        if self.score < 0 or self.score > self.item.max_score:
            raise ValidationError(f'得分必须在 0-{self.item.max_score} 之间')


class AssessmentHistory(models.Model):
    ACTION_CHOICES = [
        ('create', '创建评估'),
        ('submit', '提交审核'),
        ('doctor_confirm', '医生确认'),
        ('family_confirm', '家属确认'),
        ('director_approve', '院长批准'),
        ('director_reject', '院长退回'),
        ('edit', '编辑'),
    ]

    assessment = models.ForeignKey(
        Assessment,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='评估记录'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='操作类型')
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='操作人'
    )
    from_status = models.CharField(max_length=20, blank=True, verbose_name='原状态')
    to_status = models.CharField(max_length=20, blank=True, verbose_name='新状态')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '评估历史'
        verbose_name_plural = '评估历史'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.assessment.elder.name} - {self.get_action_display()} - {self.created_at}"