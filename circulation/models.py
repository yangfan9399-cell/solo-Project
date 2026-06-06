from django.db import models
from django.utils import timezone


class CirculationLog(models.Model):
    CONDITION_EXCELLENT = 'excellent'
    CONDITION_GOOD = 'good'
    CONDITION_FAIR = 'fair'
    CONDITION_POOR = 'poor'
    CONDITION_DAMAGED = 'damaged'

    CONDITION_CHOICES = [
        (CONDITION_EXCELLENT, '完好'),
        (CONDITION_GOOD, '良好'),
        (CONDITION_FAIR, '一般'),
        (CONDITION_POOR, '较差'),
        (CONDITION_DAMAGED, '有损伤'),
    ]

    reservation = models.OneToOneField('reservations.Reservation', on_delete=models.CASCADE, related_name='circulation_log', verbose_name='预约记录')
    book = models.ForeignKey('catalog.RareBook', on_delete=models.CASCADE, related_name='circulation_logs', verbose_name='珍本')
    librarian = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='circulation_handled', verbose_name='经手馆员')
    checkout_time = models.DateTimeField(null=True, blank=True, verbose_name='出库时间')
    return_time = models.DateTimeField(null=True, blank=True, verbose_name='归还时间')
    condition_out = models.CharField(max_length=20, choices=CONDITION_CHOICES, default=CONDITION_GOOD, verbose_name='出库状况')
    condition_out_notes = models.TextField(blank=True, verbose_name='出库状况说明')
    condition_in = models.CharField(max_length=20, choices=CONDITION_CHOICES, blank=True, null=True, verbose_name='归还状况')
    condition_in_notes = models.TextField(blank=True, verbose_name='归还状况说明')
    reader_signature = models.CharField(max_length=50, blank=True, verbose_name='读者签收')
    return_receiver = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='returns_received', verbose_name='归还接收人')

    class Meta:
        verbose_name = '流通记录'
        verbose_name_plural = '流通记录'
        ordering = ['-checkout_time']

    def __str__(self):
        return f'{self.book.title} - {self.reservation.user.real_name}'

    @property
    def is_returned(self):
        return self.return_time is not None

    @property
    def duration_hours(self):
        if self.checkout_time and self.return_time:
            delta = self.return_time - self.checkout_time
            return round(delta.total_seconds() / 3600, 1)
        return 0

    def checkout(self, librarian):
        self.checkout_time = timezone.now()
        self.librarian = librarian
        self.book.status = 'checked_out'
        self.book.save()
        self.reservation.status = 'checked_out'
        self.reservation.save()
        self.save()

    def return_book(self, receiver, condition_in, notes=''):
        self.return_time = timezone.now()
        self.return_receiver = receiver
        self.condition_in = condition_in
        self.condition_in_notes = notes
        self.reservation.status = 'completed'
        self.reservation.save()
        self.save()
