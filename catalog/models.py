from django.db import models


class BookCategory(models.Model):
    RARITY_COMMON = 'common'
    RARITY_RARE = 'rare'
    RARITY_PRECIOUS = 'precious'

    RARITY_CHOICES = [
        (RARITY_COMMON, '普通古籍'),
        (RARITY_RARE, '珍本'),
        (RARITY_PRECIOUS, '特藏珍本'),
    ]

    name = models.CharField(max_length=100, verbose_name='分类名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='分类代码')
    rarity_level = models.CharField(max_length=20, choices=RARITY_CHOICES, default=RARITY_COMMON, verbose_name='珍责等级')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        verbose_name = '馆藏分类'
        verbose_name_plural = '馆藏分类'
        ordering = ['code']

    def __str__(self):
        return self.name


class RareBook(models.Model):
    STATUS_IN_STACK = 'in_stack'
    STATUS_RESERVED = 'reserved'
    STATUS_CHECKED_OUT = 'checked_out'
    STATUS_IN_REPAIR = 'in_repair'
    STATUS_RESTRICTED = 'restricted'

    STATUS_CHOICES = [
        (STATUS_IN_STACK, '在库'),
        (STATUS_RESERVED, '已预约'),
        (STATUS_CHECKED_OUT, '已调出'),
        (STATUS_IN_REPAIR, '修复中'),
        (STATUS_RESTRICTED, '限制阅览'),
    ]

    CONDITION_EXCELLENT = 'excellent'
    CONDITION_GOOD = 'good'
    CONDITION_FAIR = 'fair'
    CONDITION_POOR = 'poor'

    CONDITION_CHOICES = [
        (CONDITION_EXCELLENT, '完好'),
        (CONDITION_GOOD, '良好'),
        (CONDITION_FAIR, '一般'),
        (CONDITION_POOR, '较差'),
    ]

    title = models.CharField(max_length=200, verbose_name='书名')
    author = models.CharField(max_length=200, verbose_name='作者')
    call_number = models.CharField(max_length=50, unique=True, verbose_name='索书号')
    category = models.ForeignKey(BookCategory, on_delete=models.PROTECT, related_name='books', verbose_name='馆藏分类')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_IN_STACK, verbose_name='馆藏状态')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default=CONDITION_GOOD, verbose_name='保存状况')
    description = models.TextField(blank=True, verbose_name='内容简介')
    published_date = models.DateField(blank=True, null=True, verbose_name='出版年代')
    publisher = models.CharField(max_length=200, blank=True, verbose_name='出版者')
    edition = models.CharField(max_length=100, blank=True, verbose_name='版本')
    pages = models.IntegerField(blank=True, null=True, verbose_name='页数')
    format_size = models.CharField(max_length=50, blank=True, verbose_name='开本')
    location = models.CharField(max_length=100, blank=True, verbose_name='馆藏位置')
    cover_image = models.CharField(max_length=255, blank=True, verbose_name='封面图片')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '珍本'
        verbose_name_plural = '珍本'
        ordering = ['call_number']

    def __str__(self):
        return f'[{self.call_number}] {self.title}'

    def get_current_reservation(self):
        return self.reservations.filter(
            status__in=['pending', 'approved']
        ).order_by('-created_at').first()

    def get_history_timeline(self):
        events = []
        for reservation in self.reservations.all().order_by('-created_at'):
            events.append({
                'type': 'reservation',
                'date': reservation.created_at,
                'title': f'预约申请 - {reservation.user.real_name}',
                'description': reservation.get_status_display(),
                'object': reservation,
            })
            if hasattr(reservation, 'circulation_log'):
                circulation = reservation.circulation_log
                if circulation.checkout_time:
                    events.append({
                        'type': 'checkout',
                        'date': circulation.checkout_time,
                        'title': '调阅出库',
                        'description': f'经手馆员: {circulation.librarian.real_name if circulation.librarian else "未知"}',
                        'object': circulation,
                    })
                if circulation.return_time:
                    events.append({
                        'type': 'return',
                        'date': circulation.return_time,
                        'title': '归还登记',
                        'description': f'归还状态: {circulation.get_condition_in_display()}',
                        'object': circulation,
                    })
                if hasattr(circulation, 'damage_assessment'):
                    assessment = circulation.damage_assessment
                    events.append({
                        'type': 'assessment',
                        'date': assessment.assessed_at,
                        'title': '损伤鉴定',
                        'description': f'损伤等级: {assessment.get_damage_level_display()}',
                        'object': assessment,
                    })
                    if hasattr(assessment, 'decision'):
                        decision = assessment.decision
                        events.append({
                            'type': 'decision',
                            'date': decision.decided_at,
                            'title': '归库决策',
                            'description': decision.get_decision_type_display(),
                            'object': decision,
                        })
        events.sort(key=lambda x: x['date'], reverse=True)
        return events


class DamageRecord(models.Model):
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

    book = models.ForeignKey(RareBook, on_delete=models.CASCADE, related_name='damage_records', verbose_name='珍本')
    damage_level = models.CharField(max_length=20, choices=LEVEL_CHOICES, verbose_name='损伤等级')
    description = models.TextField(verbose_name='损伤描述')
    discovered_date = models.DateField(auto_now_add=True, verbose_name='发现日期')
    recorded_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='+', verbose_name='记录人')

    class Meta:
        verbose_name = '损伤记录'
        verbose_name_plural = '损伤记录'
        ordering = ['-discovered_date']

    def __str__(self):
        return f'{self.book.title} - {self.get_damage_level_display()}'
