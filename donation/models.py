from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date

class Donor(models.Model):
    name = models.CharField(max_length=200)
    contact = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class MaterialCategory(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Material(models.Model):
    name = models.CharField(max_length=200)
    category = models.ForeignKey(MaterialCategory, on_delete=models.CASCADE)
    unit = models.CharField(max_length=20, default='件')
    specification = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.name} ({self.category.name})"

class Batch(models.Model):
    STATUS_CHOICES = [
        ('pending', '待入库'),
        ('in_stock', '已入库'),
        ('distributed', '已分配'),
        ('expired', '已过期'),
    ]
    
    donor = models.ForeignKey(Donor, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    received_quantity = models.IntegerField(default=0)
    distributed_quantity = models.IntegerField(default=0)
    expire_date = models.DateField()
    batch_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    storage_location = models.CharField(max_length=200, blank=True)
    received_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='batches')

    @property
    def is_expired(self):
        return self.expire_date < date.today() and self.status != 'expired'

    @property
    def available_quantity(self):
        return self.received_quantity - self.distributed_quantity

    def __str__(self):
        return f"{self.batch_number} - {self.material.name}"

class Recipient(models.Model):
    name = models.CharField(max_length=200)
    contact = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Project(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('active', '进行中'), ('completed', '已完成')], default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class DistributionPlan(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('approved', '已批准'),
        ('distributed', '已发放'),
        ('received', '已签收'),
        ('archived', '已归档'),
        ('rejected', '已退回'),
    ]
    
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    recipient = models.ForeignKey(Recipient, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    planned_date = models.DateField()
    actual_distributed_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='distributions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.batch.batch_number} -> {self.recipient.name}"

class Receipt(models.Model):
    distribution = models.OneToOneField(DistributionPlan, on_delete=models.CASCADE)
    quantity_received = models.IntegerField()
    signed_by = models.CharField(max_length=100)
    signed_at = models.DateTimeField(auto_now_add=True)
    evidence = models.ImageField(upload_to='receipts/', null=True, blank=True)
    notes = models.TextField(blank=True)

    @property
    def has_discrepancy(self):
        return self.quantity_received != self.distribution.quantity

    def __str__(self):
        return f"Receipt for {self.distribution.id}"

class AuditRecord(models.Model):
    ACTION_CHOICES = [
        ('archive', '归档'),
        ('investigate', '追查'),
        ('approve', '批准'),
        ('reject', '驳回'),
    ]
    
    distribution = models.ForeignKey(DistributionPlan, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    auditor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.auditor} on {self.distribution.id}"

class HistoryNode(models.Model):
    NODE_TYPE_CHOICES = [
        ('receive', '入库'),
        ('distribute', '分配'),
        ('sign', '签收'),
        ('audit', '审计'),
        ('archive', '归档'),
    ]
    
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True)
    distribution = models.ForeignKey(DistributionPlan, on_delete=models.CASCADE, null=True)
    node_type = models.CharField(max_length=20, choices=NODE_TYPE_CHOICES)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.node_type} - {self.created_at}"
