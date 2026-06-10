from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta

DANGER_LEVEL_CHOICES = [
    ('I', 'I级 - 无危险'),
    ('II', 'II级 - 低度危险'),
    ('III', 'III级 - 中度危险'),
    ('IV', 'IV级 - 高度危险'),
]

APPLICATION_STATUS_CHOICES = [
    ('pending', '待审核'),
    ('inventory_checked', '库存已审核'),
    ('safety_checked', '安全已审核'),
    ('approved', '已批准'),
    ('issued', '已出库'),
    ('returned', '已归还'),
    ('overdue', '逾期未归还'),
    ('rejected', '已拒绝'),
]

EXCEPTION_REASON_CHOICES = [
    ('stock_shortage', '库存不足'),
    ('qualification_missing', '危险品资质缺失'),
    ('overdue', '逾期未归还'),
    ('other', '其他'),
]

COLLEGE_CHOICES = [
    ('engineering', '工程学院'),
    ('science', '理学院'),
    ('medicine', '医学院'),
    ('business', '商学院'),
    ('arts', '文学院'),
]

CATEGORY_CHOICES = [
    ('chemical', '化学试剂'),
    ('glass', '玻璃器皿'),
    ('instrument', '仪器设备'),
    ('biological', '生物材料'),
    ('safety', '安全防护'),
    ('other', '其他'),
]


class College(models.Model):
    name = models.CharField(max_length=100, choices=COLLEGE_CHOICES, unique=True)
    
    def __str__(self):
        return self.get_name_display()


class ConsumableCategory(models.Model):
    name = models.CharField(max_length=100, choices=CATEGORY_CHOICES, unique=True)
    
    def __str__(self):
        return self.get_name_display()


class Consumable(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(ConsumableCategory, on_delete=models.CASCADE, related_name='consumables')
    danger_level = models.CharField(max_length=10, choices=DANGER_LEVEL_CHOICES, default='I')
    unit = models.CharField(max_length=20, default='个')
    min_stock = models.IntegerField(default=10)
    max_stock = models.IntegerField(default=100)
    requires_qualification = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name


class Batch(models.Model):
    consumable = models.ForeignKey(Consumable, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=50, unique=True)
    quantity = models.IntegerField(default=0)
    expire_date = models.DateField()
    location = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.consumable.name} - {self.batch_number}"


class ResearchGroup(models.Model):
    name = models.CharField(max_length=200)
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='groups')
    leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='led_groups')
    
    def __str__(self):
        return self.name


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=[
        ('teacher', '教师'),
        ('stock_manager', '库管员'),
        ('safety_officer', '安全员'),
        ('lab_manager', '实验室负责人'),
    ])
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True)
    research_group = models.ForeignKey(ResearchGroup, on_delete=models.SET_NULL, null=True, blank=True)
    has_dangerous_qualification = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


class Application(models.Model):
    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    consumable = models.ForeignKey(Consumable, on_delete=models.CASCADE, related_name='applications')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')
    requested_quantity = models.IntegerField()
    actual_quantity = models.IntegerField(default=0)
    research_group = models.ForeignKey(ResearchGroup, on_delete=models.CASCADE, related_name='applications')
    purpose = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expected_return_date = models.DateField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    inventory_checker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_checks')
    safety_checker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='safety_checks')
    lab_checker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='lab_checks')
    exception_reason = models.CharField(max_length=50, choices=EXCEPTION_REASON_CHOICES, null=True, blank=True)
    exception_note = models.TextField(blank=True)
    
    def __str__(self):
        return f"申请 #{self.id} - {self.consumable.name}"
    
    @property
    def is_overdue(self):
        if self.status == 'issued' and self.expected_return_date:
            return timezone.now().date() > self.expected_return_date
        return False
    
    @property
    def turnover_days(self):
        if self.issued_at and self.returned_at:
            return (self.returned_at - self.issued_at).days
        return None


class ReturnRecord(models.Model):
    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='return_record')
    returned_quantity = models.IntegerField()
    returned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='returns')
    returned_at = models.DateTimeField(auto_now_add=True)
    condition = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"归还 #{self.id} - {self.application.consumable.name}"


class ApplicationHistory(models.Model):
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='history')
    status_before = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES)
    status_after = models.CharField(max_length=20, choices=APPLICATION_STATUS_CHOICES)
    operated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='history_records')
    operated_at = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.get_status_before_display()} -> {self.get_status_after_display()} at {self.operated_at}"
