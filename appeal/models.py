from django.db import models
from django.contrib.auth.models import User
from datetime import datetime

class Site(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='managed_sites')
    
    def __str__(self):
        return self.name

class Rider(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True)
    phone = models.CharField(max_length=20)
    id_card = models.CharField(max_length=18)
    join_date = models.DateField()
    status = models.CharField(max_length=20, choices=[('active', '在职'), ('suspended', '停职'), ('resigned', '离职')], default='active')
    
    def __str__(self):
        return f"{self.user.username} - {self.site.name if self.site else '无站点'}"

class Order(models.Model):
    order_no = models.CharField(max_length=50, unique=True)
    rider = models.ForeignKey(Rider, on_delete=models.SET_NULL, null=True)
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True)
    customer_name = models.CharField(max_length=100)
    customer_phone = models.CharField(max_length=20)
    address = models.CharField(max_length=500)
    create_time = models.DateTimeField()
    expected_delivery_time = models.DateTimeField()
    actual_delivery_time = models.DateTimeField(null=True)
    status = models.CharField(max_length=20, choices=[('pending', '待配送'), ('delivering', '配送中'), ('completed', '已完成'), ('cancelled', '已取消')])
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return self.order_no

class PenaltyRule(models.Model):
    RULE_TYPES = [
        ('timeout', '超时配送'),
        ('location_drift', '定位漂移'),
        ('customer_complaint', '客户投诉'),
        ('food_damage', '餐品损坏'),
        ('service_issue', '服务问题'),
    ]
    
    name = models.CharField(max_length=100)
    rule_type = models.CharField(max_length=30, choices=RULE_TYPES)
    description = models.TextField()
    base_amount = models.DecimalField(max_digits=10, decimal_places=2)
    min_amount = models.DecimalField(max_digits=10, decimal_places=2)
    max_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Penalty(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    rule = models.ForeignKey(PenaltyRule, on_delete=models.CASCADE)
    rider = models.ForeignKey(Rider, on_delete=models.SET_NULL, null=True)
    site = models.ForeignKey(Site, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_penalties')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('pending', '待申诉'), ('appealing', '申诉中'), ('resolved', '已解决')], default='pending')
    
    def __str__(self):
        return f"{self.order.order_no} - {self.rule.name}"

class Appeal(models.Model):
    APPEAL_STATUS = [
        ('pending', '待初审'),
        ('first_review', '初审中'),
        ('first_approved', '初审通过'),
        ('first_rejected', '初审驳回'),
        ('arbitration', '仲裁中'),
        ('approved', '申诉通过'),
        ('rejected', '申诉驳回'),
        ('supplement', '待补证'),
    ]
    
    APPEAL_RESULT = [
        ('pending', '待处理'),
        ('revoked', '撤销扣罚'),
        ('maintained', '维持扣罚'),
        ('supplement', '要求补证'),
    ]
    
    penalty = models.OneToOneField(Penalty, on_delete=models.CASCADE)
    rider = models.ForeignKey(Rider, on_delete=models.SET_NULL, null=True)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=APPEAL_STATUS, default='pending')
    result = models.CharField(max_length=20, choices=APPEAL_RESULT, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"申诉-{self.penalty.order.order_no}"

class Evidence(models.Model):
    EVIDENCE_TYPES = [
        ('image', '图片'),
        ('video', '视频'),
        ('chat', '聊天记录'),
        ('trajectory', '轨迹数据'),
        ('other', '其他'),
    ]
    
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='evidences')
    file = models.FileField(upload_to='evidences/')
    evidence_type = models.CharField(max_length=20, choices=EVIDENCE_TYPES)
    description = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.description

class AppealHistory(models.Model):
    ACTION_TYPES = [
        ('create', '创建扣罚'),
        ('appeal', '提交申诉'),
        ('first_review_pass', '初审通过'),
        ('first_review_reject', '初审驳回'),
        ('arbitration_pass', '仲裁通过'),
        ('arbitration_reject', '仲裁驳回'),
        ('supplement', '要求补证'),
        ('resubmit', '补充证据'),
        ('trajectory_recalc', '轨迹重算'),
    ]
    
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=30, choices=ACTION_TYPES)
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_action_display()} - {self.created_at}"

class Trajectory(models.Model):
    rider = models.ForeignKey(Rider, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    timestamp = models.DateTimeField()
    accuracy = models.FloatField()
    is_recalculated = models.BooleanField(default=False)
    recalculated_at = models.DateTimeField(null=True)
    
    def __str__(self):
        return f"{self.rider.user.username} - {self.timestamp}"

class ChatEvidence(models.Model):
    appeal = models.ForeignKey(Appeal, on_delete=models.CASCADE, related_name='chat_evidences')
    sender = models.CharField(max_length=50)
    content = models.TextField()
    timestamp = models.DateTimeField()
    direction = models.CharField(max_length=10, choices=[('in', '收到'), ('out', '发送')])
    
    def __str__(self):
        return f"{self.sender}: {self.content[:50]}"