from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Station(models.Model):
    name = models.CharField("驿站名称", max_length=100)
    code = models.CharField("驿站编码", max_length=20, unique=True)
    address = models.TextField("地址")
    district = models.CharField("所属片区", max_length=50)
    phone = models.CharField("联系电话", max_length=20)
    is_active = models.BooleanField("是否营业", default=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        verbose_name = "驿站"
        verbose_name_plural = "驿站"
        ordering = ["code"]

    def __str__(self):
        return f"{self.code} - {self.name}"


class Staff(models.Model):
    ROLE_CHOICES = [
        ("clerk", "店员"),
        ("supervisor", "片区主管"),
        ("cs_specialist", "客服专员"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name="关联用户")
    name = models.CharField("姓名", max_length=50)
    role = models.CharField("角色", max_length=20, choices=ROLE_CHOICES, default="clerk")
    station = models.ForeignKey(Station, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="所属驿站")
    phone = models.CharField("手机号", max_length=20)
    is_active = models.BooleanField("在职", default=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        verbose_name = "员工"
        verbose_name_plural = "员工"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}({self.get_role_display()})"

    @property
    def role_display(self):
        return self.get_role_display()


class Package(models.Model):
    STATUS_CHOICES = [
        ("checked_in", "已入站"),
        ("pending_pickup", "待取件"),
        ("picked_up", "已取件"),
        ("retention", "滞留"),
        ("abnormal", "异常"),
        ("returned", "已退回"),
    ]
    CARRIER_CHOICES = [
        ("sf", "顺丰"),
        ("yt", "圆通"),
        ("zt", "中通"),
        ("st", "申通"),
        ("yd", "韵达"),
        ("ems", "EMS"),
        ("jd", "京东"),
        ("other", "其他"),
    ]
    tracking_number = models.CharField("快递单号", max_length=50, unique=True)
    sender_name = models.CharField("寄件人", max_length=50)
    sender_phone = models.CharField("寄件人电话", max_length=20)
    receiver_name = models.CharField("收件人", max_length=50)
    receiver_phone = models.CharField("收件人电话", max_length=20)
    station = models.ForeignKey(Station, on_delete=models.PROTECT, verbose_name="所属驿站")
    status = models.CharField("状态", max_length=20, choices=STATUS_CHOICES, default="checked_in")
    shelf_code = models.CharField("货架编码", max_length=20, blank=True, default="")
    carrier = models.CharField("快递公司", max_length=20, choices=CARRIER_CHOICES, default="other")
    checked_in_at = models.DateTimeField("入站时间", default=timezone.now)
    checked_in_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, verbose_name="入站操作员", related_name="checked_in_packages")
    picked_up_at = models.DateTimeField("取件时间", null=True, blank=True)
    picked_up_by_name = models.CharField("取件人姓名", max_length=50, blank=True, default="")
    remark = models.TextField("备注", blank=True, default="")
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        verbose_name = "包裹"
        verbose_name_plural = "包裹"
        ordering = ["-checked_in_at"]

    def __str__(self):
        return f"{self.tracking_number}({self.get_status_display()})"

    @property
    def status_display(self):
        return self.get_status_display()

    @property
    def carrier_display(self):
        return self.get_carrier_display()

    @property
    def days_at_station(self):
        from django.utils import timezone
        end = self.picked_up_at or self.returned_records.first().returned_at if hasattr(self, "returned_records") and self.returned_records.exists() else timezone.now()
        return (end - self.checked_in_at).days


class PickupReminder(models.Model):
    REMINDER_TYPE_CHOICES = [
        ("sms", "短信"),
        ("call", "电话"),
        ("app_notify", "APP通知"),
    ]
    STATUS_CHOICES = [
        ("sent", "已发送"),
        ("delivered", "已送达"),
        ("failed", "发送失败"),
    ]
    RESPONSE_CHOICES = [
        ("no_response", "无回应"),
        ("confirmed_pickup", "确认取件"),
        ("delayed_pickup", "延迟取件"),
        ("rejected", "拒收"),
    ]
    package = models.ForeignKey(Package, on_delete=models.CASCADE, verbose_name="包裹", related_name="reminders")
    reminder_type = models.CharField("提醒方式", max_length=20, choices=REMINDER_TYPE_CHOICES, default="sms")
    sent_at = models.DateTimeField("发送时间", auto_now_add=True)
    sent_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, verbose_name="发送人")
    status = models.CharField("发送状态", max_length=20, choices=STATUS_CHOICES, default="sent")
    response = models.CharField("客户回应", max_length=20, choices=RESPONSE_CHOICES, blank=True, default="")
    note = models.TextField("备注", blank=True, default="")

    class Meta:
        verbose_name = "取件提醒"
        verbose_name_plural = "取件提醒"
        ordering = ["-sent_at"]

    def __str__(self):
        return f"{self.package.tracking_number} - {self.get_reminder_type_display()} - {self.get_status_display()}"


class RetentionAlert(models.Model):
    ALERT_LEVEL_CHOICES = [
        ("warning", "预警(3天)"),
        ("critical", "严重(5天)"),
        ("urgent", "紧急(7天+)"),
    ]
    package = models.ForeignKey(Package, on_delete=models.CASCADE, verbose_name="包裹", related_name="retention_alerts")
    alert_level = models.CharField("预警等级", max_length=20, choices=ALERT_LEVEL_CHOICES, default="warning")
    days_retained = models.IntegerField("滞留天数")
    triggered_at = models.DateTimeField("触发时间", auto_now_add=True)
    is_resolved = models.BooleanField("是否已处理", default=False)
    resolved_at = models.DateTimeField("处理时间", null=True, blank=True)
    resolved_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="处理人", related_name="resolved_alerts")
    resolution_note = models.TextField("处理说明", blank=True, default="")

    class Meta:
        verbose_name = "滞留预警"
        verbose_name_plural = "滞留预警"
        ordering = ["-triggered_at"]

    def __str__(self):
        return f"{self.package.tracking_number} - {self.get_alert_level_display()} - {self.days_retained}天"

    @property
    def alert_level_display(self):
        return self.get_alert_level_display()

    @property
    def alert_level_color(self):
        colors = {"warning": "yellow", "critical": "orange", "urgent": "red"}
        return colors.get(self.alert_level, "gray")


class AbnormalPackage(models.Model):
    ABNORMAL_TYPE_CHOICES = [
        ("damaged", "破损"),
        ("lost", "丢失"),
        ("wrong_station", "错分驿站"),
        ("expired", "超期"),
        ("wrong_item", "错件"),
        ("other", "其他"),
    ]
    STATUS_CHOICES = [
        ("pending", "待处理"),
        ("processing", "处理中"),
        ("resolved", "已解决"),
    ]
    package = models.ForeignKey(Package, on_delete=models.CASCADE, verbose_name="包裹", related_name="abnormal_records")
    abnormal_type = models.CharField("异常类型", max_length=20, choices=ABNORMAL_TYPE_CHOICES, default="other")
    description = models.TextField("异常描述")
    registered_at = models.DateTimeField("登记时间", auto_now_add=True)
    registered_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, verbose_name="登记人", related_name="registered_abnormals")
    status = models.CharField("处理状态", max_length=20, choices=STATUS_CHOICES, default="pending")
    resolution = models.TextField("处理结果", blank=True, default="")
    resolved_at = models.DateTimeField("处理时间", null=True, blank=True)
    resolved_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="处理人", related_name="resolved_abnormals")

    class Meta:
        verbose_name = "异常件"
        verbose_name_plural = "异常件"
        ordering = ["-registered_at"]

    def __str__(self):
        return f"{self.package.tracking_number} - {self.get_abnormal_type_display()}"

    @property
    def abnormal_type_display(self):
        return self.get_abnormal_type_display()

    @property
    def status_display(self):
        return self.get_status_display()


class Complaint(models.Model):
    COMPLAINT_TYPE_CHOICES = [
        ("delayed_pickup", "取件延迟"),
        ("damaged", "包裹破损"),
        ("lost", "包裹丢失"),
        ("poor_service", "服务态度差"),
        ("wrong_item", "错件"),
        ("other", "其他"),
    ]
    STATUS_CHOICES = [
        ("pending", "待受理"),
        ("accepted", "已受理"),
        ("processing", "处理中"),
        ("resolved", "已解决"),
        ("closed", "已关闭"),
    ]
    complaint_number = models.CharField("投诉编号", max_length=30, unique=True)
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="关联包裹", related_name="complaints")
    complainant_name = models.CharField("投诉人姓名", max_length=50)
    complainant_phone = models.CharField("投诉人电话", max_length=20)
    complaint_type = models.CharField("投诉类型", max_length=20, choices=COMPLAINT_TYPE_CHOICES, default="other")
    description = models.TextField("投诉内容")
    station = models.ForeignKey(Station, on_delete=models.PROTECT, verbose_name="涉事驿站")
    status = models.CharField("状态", max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField("投诉时间", auto_now_add=True)
    accepted_at = models.DateTimeField("受理时间", null=True, blank=True)
    accepted_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="受理人", related_name="accepted_complaints")
    resolution = models.TextField("处理结果", blank=True, default="")
    resolved_at = models.DateTimeField("解决时间", null=True, blank=True)
    satisfaction = models.IntegerField("满意度评分(1-5)", null=True, blank=True)

    class Meta:
        verbose_name = "客户投诉"
        verbose_name_plural = "客户投诉"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.complaint_number} - {self.complainant_name}"

    @property
    def complaint_type_display(self):
        return self.get_complaint_type_display()

    @property
    def status_display(self):
        return self.get_status_display()

    def save(self, *args, **kwargs):
        if not self.complaint_number:
            import uuid
            self.complaint_number = f"TS{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class Responsibility(models.Model):
    RESPONSIBILITY_TYPE_CHOICES = [
        ("full", "全责"),
        ("partial", "部分责任"),
        ("none", "无责任"),
    ]
    PENALTY_TYPE_CHOICES = [
        ("warning", "警告"),
        ("fine", "罚款"),
        ("training", "培训"),
        ("demotion", "降级"),
        ("none", "无处罚"),
    ]
    STATUS_CHOICES = [
        ("pending", "待确认"),
        ("confirmed", "已确认"),
        ("executed", "已执行"),
        ("appealed", "已申诉"),
    ]
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, verbose_name="关联投诉", related_name="responsibilities")
    responsible_staff = models.ForeignKey(Staff, on_delete=models.PROTECT, verbose_name="责任人", related_name="responsibilities")
    responsibility_type = models.CharField("责任类型", max_length=20, choices=RESPONSIBILITY_TYPE_CHOICES, default="partial")
    penalty_type = models.CharField("处罚类型", max_length=20, choices=PENALTY_TYPE_CHOICES, default="warning")
    penalty_amount = models.DecimalField("罚款金额", max_digits=10, decimal_places=2, null=True, blank=True)
    description = models.TextField("责任说明")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    created_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, verbose_name="创建人", related_name="created_responsibilities")
    status = models.CharField("状态", max_length=20, choices=STATUS_CHOICES, default="pending")
    appeal_note = models.TextField("申诉说明", blank=True, default="")
    appeal_at = models.DateTimeField("申诉时间", null=True, blank=True)

    class Meta:
        verbose_name = "责任处理"
        verbose_name_plural = "责任处理"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.complaint.complaint_number} - {self.responsible_staff.name}"

    @property
    def responsibility_type_display(self):
        return self.get_responsibility_type_display()

    @property
    def penalty_type_display(self):
        return self.get_penalty_type_display()

    @property
    def status_display(self):
        return self.get_status_display()


class ReturnRecord(models.Model):
    RETURN_REASON_CHOICES = [
        ("retention_expired", "滞留超期"),
        ("customer_request", "客户要求退回"),
        ("wrong_station", "错分驿站"),
        ("damaged", "破损退回"),
        ("rejected", "拒收退回"),
        ("other", "其他"),
    ]
    package = models.ForeignKey(Package, on_delete=models.CASCADE, verbose_name="包裹", related_name="returned_records")
    return_reason = models.CharField("退回原因", max_length=20, choices=RETURN_REASON_CHOICES, default="other")
    returned_to = models.CharField("退回目的地", max_length=200)
    returned_at = models.DateTimeField("退回时间", auto_now_add=True)
    returned_by = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, verbose_name="退回操作员")
    return_carrier = models.CharField("退回承运商", max_length=50, blank=True, default="")
    return_tracking = models.CharField("退回单号", max_length=50, blank=True, default="")
    remark = models.TextField("备注", blank=True, default="")

    class Meta:
        verbose_name = "退回记录"
        verbose_name_plural = "退回记录"
        ordering = ["-returned_at"]

    def __str__(self):
        return f"{self.package.tracking_number} - {self.get_return_reason_display()}"

    @property
    def return_reason_display(self):
        return self.get_return_reason_display()
