from django.db import models
from django.utils import timezone
from datetime import timedelta


class Reservation(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHECKED_OUT = 'checked_out'

    STATUS_CHOICES = [
        (STATUS_PENDING, '待审核'),
        (STATUS_APPROVED, '已通过'),
        (STATUS_REJECTED, '已驳回'),
        (STATUS_CHECKED_OUT, '已调出'),
        (STATUS_COMPLETED, '已完成'),
        (STATUS_CANCELLED, '已取消'),
    ]

    PURPOSE_RESEARCH = 'research'
    PURPOSE_STUDY = 'study'
    PURPOSE_TEACHING = 'teaching'
    PURPOSE_EXHIBITION = 'exhibition'
    PURPOSE_OTHER = 'other'

    PURPOSE_CHOICES = [
        (PURPOSE_RESEARCH, '学术研究'),
        (PURPOSE_STUDY, '学习参考'),
        (PURPOSE_TEACHING, '教学使用'),
        (PURPOSE_EXHIBITION, '展览展示'),
        (PURPOSE_OTHER, '其他'),
    ]

    book = models.ForeignKey('catalog.RareBook', on_delete=models.CASCADE, related_name='reservations', verbose_name='珍本')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='reservations', verbose_name='预约人')
    reserved_date = models.DateField(verbose_name='预约日期')
    start_time = models.TimeField(verbose_name='开始时间')
    end_time = models.TimeField(verbose_name='结束时间')
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES, default=PURPOSE_RESEARCH, verbose_name='阅览目的')
    purpose_detail = models.TextField(blank=True, verbose_name='目的说明')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='状态')
    reject_reason = models.TextField(blank=True, verbose_name='驳回原因')
    approved_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_reservations', verbose_name='审核人')
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    qualification_checked = models.BooleanField(default=False, verbose_name='资格已核验')
    qualification_notes = models.TextField(blank=True, verbose_name='资格核验说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='提交时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '预约申请'
        verbose_name_plural = '预约申请'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.book.title} - {self.user.real_name}'

    @property
    def is_qualification_passed(self):
        if not self.qualification_checked:
            return None
        return self.qualification_notes == '资格核验通过' or not self.qualification_notes

    @property
    def required_proofs(self):
        proofs = []
        if not self.qualification_checked:
            return proofs
        if not self.user.has_proof and self.book.category.rarity_level == 'precious':
            proofs.append('有效身份证件')
            proofs.append('研究单位介绍信')
        if self.user.reader_type == 'undergrad' and self.book.category.rarity_level in ['rare', 'precious']:
            proofs.append('所在学院出具的研究证明')
        if self.user.reader_type == 'graduate' and self.book.category.rarity_level == 'precious':
            proofs.append('导师推荐信')
        return proofs

    def can_be_approved(self):
        if self.status != self.STATUS_PENDING:
            return False
        if self.has_time_conflict():
            return False
        if self.qualification_checked and not self.is_qualification_passed:
            return False
        return True

    def has_time_conflict(self):
        conflicts = Reservation.objects.filter(
            book=self.book,
            reserved_date=self.reserved_date,
            status__in=[self.STATUS_APPROVED, self.STATUS_CHECKED_OUT],
        ).exclude(pk=self.pk)

        for other in conflicts:
            if self.times_overlap(other):
                return True
        return False

    def times_overlap(self, other):
        start1 = self.start_time
        end1 = self.end_time
        start2 = other.start_time
        end2 = other.end_time
        return start1 < end2 and start2 < end1

    def get_conflicting_reservations(self):
        conflicts = []
        others = Reservation.objects.filter(
            book=self.book,
            reserved_date=self.reserved_date,
            status__in=[self.STATUS_APPROVED, self.STATUS_CHECKED_OUT],
        ).exclude(pk=self.pk)
        for other in others:
            if self.times_overlap(other):
                conflicts.append(other)
        return conflicts

    def check_qualification(self):
        issues = []
        if self.user.is_suspended:
            issues.append(f'账号已暂停: {self.user.suspend_reason}')

        if not self.user.has_proof and self.book.category.rarity_level == 'precious':
            issues.append('预约特藏珍本需提交资格证明文件')

        if self.user.reader_type == 'undergrad' and self.book.category.rarity_level in ['rare', 'precious']:
            issues.append('本科生读者仅可预约普通古籍，如需预约珍本请提供学院出具的研究证明')

        if self.user.reader_type == 'graduate' and self.book.category.rarity_level == 'precious':
            issues.append('研究生读者预约特藏珍本需提供导师推荐信')

        self.qualification_checked = True
        self.qualification_notes = '; '.join(issues) if issues else '资格核验通过'
        return len(issues) == 0, issues

    def get_timeline(self):
        events = []
        events.append({
            'type': 'submitted',
            'date': self.created_at,
            'title': '预约提交',
            'description': f'由 {self.user.real_name} 提交',
            'status': 'completed',
        })

        if self.status in [self.STATUS_APPROVED, self.STATUS_REJECTED, self.STATUS_CHECKED_OUT, self.STATUS_COMPLETED]:
            if self.approved_at:
                events.append({
                    'type': 'reviewed',
                    'date': self.approved_at,
                    'title': '馆员审核',
                    'description': f'审核人: {self.approved_by.real_name if self.approved_by else "未知"}',
                    'status': 'completed' if self.status != self.STATUS_REJECTED else 'failed',
                    'detail': self.reject_reason if self.status == self.STATUS_REJECTED else None,
                })

        if hasattr(self, 'circulation_log'):
            circulation = self.circulation_log
            if circulation.checkout_time:
                events.append({
                    'type': 'checkout',
                    'date': circulation.checkout_time,
                    'title': '调阅出库',
                    'description': f'经手馆员: {circulation.librarian.real_name if circulation.librarian else "未知"}',
                    'status': 'completed',
                    'object': circulation,
                })
            if circulation.return_time:
                events.append({
                    'type': 'return',
                    'date': circulation.return_time,
                    'title': '归还登记',
                    'description': f'归还状态: {circulation.get_condition_in_display()}',
                    'status': 'completed',
                    'object': circulation,
                })
            if hasattr(circulation, 'damage_assessment'):
                assessment = circulation.damage_assessment
                events.append({
                    'type': 'assessment',
                    'date': assessment.assessed_at,
                    'title': '损伤鉴定',
                    'description': f'损伤等级: {assessment.get_damage_level_display()}',
                    'status': 'completed',
                    'object': assessment,
                })
                if hasattr(assessment, 'decision'):
                    decision = assessment.decision
                    events.append({
                        'type': 'decision',
                        'date': decision.decided_at,
                        'title': '归库决策',
                        'description': decision.get_decision_type_display(),
                        'status': 'completed',
                        'object': decision,
                    })

        events.sort(key=lambda x: x['date'])
        return events
