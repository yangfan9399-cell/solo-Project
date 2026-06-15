import json
from django.db import models


class Level(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(default='')
    difficulty = models.IntegerField(default=1)
    target_income = models.IntegerField(default=500)
    max_complaints = models.IntegerField(default=10)
    time_limit = models.IntegerField(default=120)
    initial_ticket_price = models.IntegerField(default=10)
    initial_windows = models.IntegerField(default=2)
    car_capacity = models.IntegerField(default=6)
    tourist_rate = models.FloatField(default=1.0)

    class Meta:
        ordering = ['difficulty']

    def __str__(self):
        return f'L{self.difficulty}-{self.name}'


class GameSession(models.Model):
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('paused', '已暂停'),
        ('completed', '已完成'),
        ('failed', '已失败'),
    ]

    level = models.ForeignKey(Level, on_delete=models.CASCADE, related_name='sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    ticket_price = models.IntegerField(default=10)
    open_windows = models.IntegerField(default=2)
    car_capacity = models.IntegerField(default=6)
    dispatch_interval = models.IntegerField(default=10)
    current_tick = models.IntegerField(default=0)
    total_income = models.IntegerField(default=0)
    total_complaints = models.IntegerField(default=0)
    total_served = models.IntegerField(default=0)
    total_departed = models.IntegerField(default=0)
    final_score = models.IntegerField(default=0)
    queue_json = models.TextField(default='[]')
    income_history_json = models.TextField(default='[]')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Session-{self.id}-L{self.level_id}'

    def get_queue(self):
        return json.loads(self.queue_json)

    def set_queue(self, q):
        self.queue_json = json.dumps(q, ensure_ascii=False)

    def get_income_history(self):
        return json.loads(self.income_history_json)

    def set_income_history(self, h):
        self.income_history_json = json.dumps(h, ensure_ascii=False)


class DispatchDetail(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='dispatches')
    tick = models.IntegerField()
    car_index = models.IntegerField()
    passenger_count = models.IntegerField(default=0)
    revenue = models.IntegerField(default=0)
    wait_times_json = models.TextField(default='[]')
    destinations_json = models.TextField(default='[]')

    def get_wait_times(self):
        return json.loads(self.wait_times_json)

    def set_wait_times(self, v):
        self.wait_times_json = json.dumps(v)

    def get_destinations(self):
        return json.loads(self.destinations_json)

    def set_destinations(self, v):
        self.destinations_json = json.dumps(v, ensure_ascii=False)


class TouristHistory(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='tourists')
    tick_entered = models.IntegerField()
    destination = models.CharField(max_length=50)
    patience = models.IntegerField(default=5)
    needs_transfer = models.BooleanField(default=False)
    ticket_price_at_entry = models.IntegerField(default=10)
    served = models.BooleanField(default=False)
    complained = models.BooleanField(default=False)
    wait_ticks = models.IntegerField(default=0)
    revenue = models.IntegerField(default=0)

    class Meta:
        ordering = ['tick_entered']


class PatienceResult(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='patience_results')
    tick = models.IntegerField()
    patience_before = models.IntegerField()
    patience_after = models.IntegerField()
    action = models.CharField(max_length=50)
    tourist_count = models.IntegerField(default=0)
    complaint_count = models.IntegerField(default=0)
    transfer_patience_loss = models.IntegerField(default=0)
    normal_patience_loss = models.IntegerField(default=0)
    transfer_complaints = models.IntegerField(default=0)
    normal_complaints = models.IntegerField(default=0)
    transfer_served = models.IntegerField(default=0)
    normal_served = models.IntegerField(default=0)
    transfer_revenue_bonus = models.IntegerField(default=0)
    note = models.TextField(default='')


class Complaint(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='complaints')
    tick = models.IntegerField()
    tourist = models.ForeignKey(TouristHistory, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=200)
    severity = models.IntegerField(default=1)
    rolled_back = models.BooleanField(default=False)
    rollback_tick = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['tick']


class IncomeSnapshot(models.Model):
    session = models.ForeignKey(GameSession, on_delete=models.CASCADE, related_name='income_snapshots')
    tick = models.IntegerField()
    cumulative_income = models.IntegerField(default=0)
    tick_income = models.IntegerField(default=0)
    ticket_price = models.IntegerField(default=10)
    queue_length = models.IntegerField(default=0)

    class Meta:
        ordering = ['tick']
        unique_together = ['session', 'tick']
