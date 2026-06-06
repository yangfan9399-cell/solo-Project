from django.db import models
from django.utils import timezone


class DamageAssessment(models.Model):
    LEVEL_MINOR = 'minor'
    LEVEL_MODERATE = 'moderate'
    LEVEL_SEVERE = 'severe'
    LEVEL_CRITICAL = 'critical'

    LEVEL_CHOICES = [
        (LEVEL_MINOR, '轻微'),
        (LEVEL_MODERATE, '中度'),
        (LEVEL_SEVERE, '严重'),
        (LEVEL_CRITICAL, '损毁'),
    ]

    TYPE_PAGE = 'page_damage'
    TYPE_STAIN = 'stain'
    TYPE_TEAR = 'tear'
    TYPE_BINDING = 'binding'
    TYPE_MOLD = 'mold'
    TYPE_WORM = 'worm'
    TYPE_OTHER = 'other'

    TYPE_CHOICES = [
        (TYPE_PAGE, '页面破损'),
        (TYPE_STAIN, '污渍'),
        (TYPE_TEAR, '撕裂'),
        (TYPE_BINDING, '装订损坏'),
        (TYPE_MOLD, '霉变'),
        (TYPE_WORM, '虫蛀'),
        (TYPE_OTHER, '其他'),
    ]

    circulation = models.OneToOneField('circulation.CirculationLog', on_delete=models.CASCADE, related_name='damage_assessment', verbose_name='流通记录')
    conservator = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='assessments', verbose_name='鉴定人')
    damage_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, verbose_name='损伤等级')
    damage_type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='损伤类型')
    damage_description = models.TextField(verbose_name='损伤描述')
    damage_location = models.CharField(max_length=200, blank=True, verbose_name='损伤部位')
    previous_damage = models.BooleanField(default=False, verbose_name='是否为旧损')
    repair_suggestion = models.TextField(verbose_name='修复建议')
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='预估修复费用')
    assessed_at = models.DateTimeField(null=True, blank=True, verbose_name='鉴定时间')
    needs_supervisor_review = models.BooleanField(default=True, verbose_name='需主管审核')
    assessment_notes = models.TextField(blank=True, verbose_name='鉴定备注')

    class Meta:
        verbose_name = '损伤鉴定'
        verbose_name_plural = '损伤鉴定'
        ordering = ['-assessed_at']

    def __str__(self):
        return f'{self.circulation.book.title} - {self.get_damage_level_display()}'

    def save(self, *args, **kwargs):
        if not self.assessed_at:
            self.assessed_at = timezone.now()
        super().save(*args, **kwargs)


class RepairRecord(models.Model):
    assessment = models.ForeignKey(DamageAssessment, on_delete=models.CASCADE, related_name='repair_records', verbose_name='鉴定记录')
    repairer = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='repairs_done', verbose_name='修复人员')
    start_date = models.DateField(null=True, blank=True, verbose_name='修复开始日期')
    end_date = models.DateField(null=True, blank=True, verbose_name='修复完成日期')
    repair_description = models.TextField(verbose_name='修复内容')
    materials_used = models.TextField(blank=True, verbose_name='使用材料')
    actual_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='实际费用')
    repair_notes = models.TextField(blank=True, verbose_name='修复备注')
    is_completed = models.BooleanField(default=False, verbose_name='修复完成')

    class Meta:
        verbose_name = '修复记录'
        verbose_name_plural = '修复记录'
        ordering = ['-start_date']

    def __str__(self):
        return f'{self.assessment.circulation.book.title} - 修复记录'


class Decision(models.Model):
    TYPE_RETURN = 'return_to_stack'
    TYPE_REPAIR = 'send_for_repair'
    TYPE_COMPENSATION = 'compensation'
    TYPE_RESTRICT = 'restrict_access'

    TYPE_CHOICES = [
        (TYPE_RETURN, '正常归库'),
        (TYPE_REPAIR, '送修'),
        (TYPE_COMPENSATION, '赔付处理'),
        (TYPE_RESTRICT, '限制阅览'),
    ]

    assessment = models.OneToOneField(DamageAssessment, on_delete=models.CASCADE, related_name='decision', verbose_name='鉴定记录')
    supervisor = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='decisions_made', verbose_name='主管')
    decision_type = models.CharField(max_length=30, choices=TYPE_CHOICES, verbose_name='决策类型')
    decision_reason = models.TextField(verbose_name='决策理由')
    decided_at = models.DateTimeField(null=True, blank=True, verbose_name='决策时间')
    compensation_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='赔付金额')
    compensation_notes = models.TextField(blank=True, verbose_name='赔付备注')
    is_compensation_paid = models.BooleanField(default=False, verbose_name='赔付已支付')

    class Meta:
        verbose_name = '归库决策'
        verbose_name_plural = '归库决策'
        ordering = ['-decided_at']

    def __str__(self):
        return f'{self.assessment.circulation.book.title} - {self.get_decision_type_display()}'

    def save(self, *args, **kwargs):
        if not self.decided_at:
            self.decided_at = timezone.now()
        super().save(*args, **kwargs)
        self._update_book_status()

    def _update_book_status(self):
        book = self.assessment.circulation.book
        if self.decision_type == self.TYPE_RETURN:
            book.status = 'in_stack'
        elif self.decision_type == self.TYPE_REPAIR:
            book.status = 'in_repair'
        elif self.decision_type == self.TYPE_RESTRICT:
            book.status = 'restricted'
        book.save()
