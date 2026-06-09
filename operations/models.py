from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class District(models.Model):
    name = models.CharField(max_length=100, verbose_name='片区名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='片区编码')
    description = models.TextField(blank=True, verbose_name='描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '片区'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return self.name


class Vehicle(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', '可用'
        IN_SERVICE = 'in_service', '作业中'
        MAINTENANCE = 'maintenance', '维保中'
        FAULTY = 'faulty', '故障'

    plate_number = models.CharField(max_length=20, unique=True, verbose_name='车牌号')
    vehicle_type = models.CharField(max_length=50, verbose_name='车型')
    capacity = models.FloatField(verbose_name='载重(吨)')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AVAILABLE, verbose_name='状态')
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='vehicles', verbose_name='所属片区')
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='vehicles', verbose_name='固定司机')
    last_maintenance_date = models.DateField(null=True, blank=True, verbose_name='上次维保日期')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '车辆'
        verbose_name_plural = verbose_name
        ordering = ['plate_number']

    def __str__(self):
        return f"{self.plate_number} ({self.vehicle_type})"


class Route(models.Model):
    name = models.CharField(max_length=100, verbose_name='路线名称')
    code = models.CharField(max_length=20, unique=True, verbose_name='路线编码')
    district = models.ForeignKey(District, on_delete=models.CASCADE,
                                 related_name='routes', verbose_name='所属片区')
    estimated_duration = models.DurationField(verbose_name='预计时长', help_text='格式：HH:MM:SS')
    distance_km = models.FloatField(default=0, verbose_name='里程(公里)')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    description = models.TextField(blank=True, verbose_name='路线描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '清运路线'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"

    @property
    def station_count(self):
        return self.stations.count()


class Station(models.Model):
    name = models.CharField(max_length=100, verbose_name='站点名称')
    address = models.CharField(max_length=255, verbose_name='地址')
    route = models.ForeignKey(Route, on_delete=models.CASCADE,
                              related_name='stations', verbose_name='所属路线')
    order = models.IntegerField(default=0, verbose_name='站点顺序')
    bin_count = models.IntegerField(default=1, verbose_name='垃圾桶数量')
    bin_capacity = models.FloatField(default=240, verbose_name='单桶容量(L)')
    longitude = models.FloatField(null=True, blank=True, verbose_name='经度')
    latitude = models.FloatField(null=True, blank=True, verbose_name='纬度')
    remarks = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '清运站点'
        verbose_name_plural = verbose_name
        ordering = ['route', 'order']

    def __str__(self):
        return self.name


class RouteAssignment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', '待出发'
        IN_PROGRESS = 'in_progress', '进行中'
        COMPLETED = 'completed', '已完成'
        SUSPENDED = 'suspended', '已暂停'
        FAILED = 'failed', '任务失败'

    route = models.ForeignKey(Route, on_delete=models.CASCADE,
                              related_name='assignments', verbose_name='路线')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE,
                                related_name='assignments', verbose_name='车辆')
    driver = models.ForeignKey(User, on_delete=models.CASCADE,
                               related_name='driver_assignments', verbose_name='司机')
    dispatcher = models.ForeignKey(User, on_delete=models.CASCADE,
                                   related_name='dispatched_assignments', verbose_name='调度员')
    assigned_date = models.DateField(default=timezone.localdate, verbose_name='派车日期')
    scheduled_start_time = models.TimeField(null=True, blank=True, verbose_name='计划发车时间')
    status = models.CharField(max_length=20, choices=Status.choices,
                              default=Status.PENDING, verbose_name='任务状态')
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='实际发车时间')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='实际结束时间')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '路线分派'
        verbose_name_plural = verbose_name
        ordering = ['-assigned_date', '-created_at']

    def __str__(self):
        return f"{self.route.code} - {self.vehicle.plate_number} - {self.assigned_date}"

    def total_stations(self):
        return self.route.stations.count()

    def checked_in_stations(self):
        return self.check_ins.count()

    def missed_stations(self):
        checked_ids = self.check_ins.values_list('station_id', flat=True)
        return self.route.stations.exclude(id__in=checked_ids).count()


class CheckIn(models.Model):
    class Status(models.TextChoices):
        NORMAL = 'normal', '正常'
        PARTIAL = 'partial', '部分清运'
        MISSED = 'missed', '漏收'

    assignment = models.ForeignKey(RouteAssignment, on_delete=models.CASCADE,
                                   related_name='check_ins', verbose_name='路线任务')
    station = models.ForeignKey(Station, on_delete=models.CASCADE,
                                related_name='check_ins', verbose_name='站点')
    driver = models.ForeignKey(User, on_delete=models.CASCADE,
                               related_name='check_ins', verbose_name='签到司机')
    check_in_time = models.DateTimeField(default=timezone.now, verbose_name='签到时间')
    status = models.CharField(max_length=20, choices=Status.choices,
                              default=Status.NORMAL, verbose_name='签到状态')
    waste_weight = models.FloatField(null=True, blank=True, verbose_name='清运重量(kg)')
    photo_url = models.URLField(blank=True, verbose_name='现场照片')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '站点签到'
        verbose_name_plural = verbose_name
        ordering = ['check_in_time']
        unique_together = ['assignment', 'station']

    def __str__(self):
        return f"{self.station.name} - {self.check_in_time.strftime('%Y-%m-%d %H:%M')}"


class VehicleFault(models.Model):
    class Status(models.TextChoices):
        REPORTED = 'reported', '已上报'
        BEING_REPAIRED = 'being_repaired', '维修中'
        RESOLVED = 'resolved', '已解决'

    class Severity(models.TextChoices):
        MINOR = 'minor', '轻微'
        MODERATE = 'moderate', '中等'
        SEVERE = 'severe', '严重'

    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE,
                                related_name='faults', verbose_name='车辆')
    assignment = models.ForeignKey(RouteAssignment, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='faults', verbose_name='关联任务')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE,
                                 related_name='reported_faults', verbose_name='上报人')
    reported_at = models.DateTimeField(default=timezone.now, verbose_name='上报时间')
    fault_type = models.CharField(max_length=100, verbose_name='故障类型')
    severity = models.CharField(max_length=20, choices=Severity.choices,
                                default=Severity.MODERATE, verbose_name='严重程度')
    description = models.TextField(verbose_name='故障描述')
    status = models.CharField(max_length=20, choices=Status.choices,
                              default=Status.REPORTED, verbose_name='处理状态')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')
    resolution_notes = models.TextField(blank=True, verbose_name='处理说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '车辆故障'
        verbose_name_plural = verbose_name
        ordering = ['-reported_at']

    def __str__(self):
        return f"{self.vehicle.plate_number} - {self.fault_type}"


class Complaint(models.Model):
    class Type(models.TextChoices):
        OVERFLOW = 'overflow', '垃圾桶满溢'
        MISSED_COLLECTION = 'missed_collection', '漏收投诉'
        ODOR = 'odor', '异味投诉'
        OTHER = 'other', '其他投诉'

    class Status(models.TextChoices):
        PENDING = 'pending', '待处理'
        CONFIRMED = 'confirmed', '已确认'
        IN_PROGRESS = 'in_progress', '整改中'
        RESOLVED = 'resolved', '已解决'
        CLOSED = 'closed', '已结案'

    station = models.ForeignKey(Station, on_delete=models.CASCADE,
                                related_name='complaints', verbose_name='站点')
    assignment = models.ForeignKey(RouteAssignment, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='complaints', verbose_name='关联任务')
    complainant = models.CharField(max_length=100, verbose_name='投诉人')
    complainant_phone = models.CharField(max_length=20, verbose_name='联系电话')
    complaint_type = models.CharField(max_length=30, choices=Type.choices,
                                      default=Type.OVERFLOW, verbose_name='投诉类型')
    description = models.TextField(verbose_name='投诉描述')
    photo_evidence = models.URLField(blank=True, verbose_name='投诉照片')
    reported_at = models.DateTimeField(default=timezone.now, verbose_name='投诉时间')
    status = models.CharField(max_length=20, choices=Status.choices,
                              default=Status.PENDING, verbose_name='处理状态')
    inspector = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='handled_complaints', verbose_name='处理巡检员')
    confirmed_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    confirmed_notes = models.TextField(blank=True, verbose_name='确认意见')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')
    resolution_notes = models.TextField(blank=True, verbose_name='解决说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '投诉记录'
        verbose_name_plural = verbose_name
        ordering = ['-reported_at']

    def __str__(self):
        return f"{self.get_complaint_type_display()} - {self.station.name}"


class ReviewRecord(models.Model):
    class Result(models.TextChoices):
        PASS = 'pass', '通过'
        NEEDS_RECTIFICATION = 'needs_rectification', '需整改'
        RECTIFIED = 'rectified', '已整改'

    complaint = models.ForeignKey(Complaint, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='reviews', verbose_name='关联投诉')
    check_in = models.ForeignKey(CheckIn, on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='reviews', verbose_name='关联签到')
    assignment = models.ForeignKey(RouteAssignment, on_delete=models.CASCADE,
                                   related_name='reviews', verbose_name='关联任务')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE,
                                 related_name='reviews', verbose_name='复核主管')
    review_result = models.CharField(max_length=30, choices=Result.choices,
                                     default=Result.PASS, verbose_name='复核结果')
    review_notes = models.TextField(verbose_name='复核意见')
    reviewed_at = models.DateTimeField(default=timezone.now, verbose_name='复核时间')
    rectification_deadline = models.DateTimeField(null=True, blank=True, verbose_name='整改期限')
    rectification_completed_at = models.DateTimeField(null=True, blank=True, verbose_name='整改完成时间')
    rectification_notes = models.TextField(blank=True, verbose_name='整改说明')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '复核记录'
        verbose_name_plural = verbose_name
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"复核 - {self.assignment.route.code} - {self.get_review_result_display()}"

    def rectification_duration_hours(self):
        if self.rectification_completed_at and self.reviewed_at:
            delta = self.rectification_completed_at - self.reviewed_at
            return round(delta.total_seconds() / 3600, 2)
        return None


class RouteEvent(models.Model):
    class Type(models.TextChoices):
        ASSIGNED = 'assigned', '任务分派'
        STARTED = 'started', '开始作业'
        CHECK_IN = 'check_in', '站点签到'
        FAULT_REPORTED = 'fault_reported', '故障上报'
        COMPLAINT_RECEIVED = 'complaint_received', '收到投诉'
        COMPLAINT_CONFIRMED = 'complaint_confirmed', '投诉确认'
        REVIEW = 'review', '复核记录'
        REASSIGNED = 'reassigned', '车辆改派'
        SUSPENDED = 'suspended', '任务暂停'
        RESUMED = 'resumed', '任务恢复'
        COMPLETED = 'completed', '任务完成'
        FAILED = 'failed', '任务失败'

    assignment = models.ForeignKey(RouteAssignment, on_delete=models.CASCADE,
                                   related_name='events', verbose_name='路线任务')
    event_type = models.CharField(max_length=30, choices=Type.choices, verbose_name='事件类型')
    description = models.TextField(verbose_name='事件描述')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE,
                                   related_name='events', verbose_name='操作人')
    created_at = models.DateTimeField(default=timezone.now, verbose_name='发生时间')

    class Meta:
        verbose_name = '路线事件'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_event_type_display()} - {self.assignment.route.code}"
