"""
数据库模型定义
包含：推算记录、版本历史、批次管理、异常数据记录
"""
from django.db import models
from django.utils.timezone import now as tz_now


class CalculationRecord(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('calculated', '已推算'),
        ('verified', '已验证'),
        ('abnormal', '异常'),
    ]
    
    title = models.CharField(max_length=100, verbose_name='标题')
    description = models.TextField(blank=True, verbose_name='描述')
    
    target_date = models.DateField(verbose_name='目标日期')
    time_hour = models.IntegerField(default=12, verbose_name='时间(时)')
    time_minute = models.IntegerField(default=0, verbose_name='时间(分)')
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=39.9042, verbose_name='纬度')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=116.4074, verbose_name='经度')
    timezone_offset = models.IntegerField(default=8, verbose_name='时区')
    location_name = models.CharField(max_length=100, blank=True, verbose_name='地点名称')
    
    lunar_year = models.IntegerField(null=True, blank=True, verbose_name='农历年')
    lunar_month = models.IntegerField(null=True, blank=True, verbose_name='农历月')
    lunar_day = models.IntegerField(null=True, blank=True, verbose_name='农历日')
    lunar_month_name = models.CharField(max_length=20, null=True, blank=True, verbose_name='农历月名')
    lunar_day_name = models.CharField(max_length=20, null=True, blank=True, verbose_name='农历日名')
    is_leap_month = models.BooleanField(default=False, verbose_name='是否闰月')
    
    year_gan_zhi = models.CharField(max_length=10, null=True, blank=True, verbose_name='年干支')
    month_gan_zhi = models.CharField(max_length=10, null=True, blank=True, verbose_name='月干支')
    day_gan_zhi = models.CharField(max_length=10, null=True, blank=True, verbose_name='日干支')
    
    moon_phase = models.CharField(max_length=20, null=True, blank=True, verbose_name='月相')
    moon_phase_type = models.CharField(max_length=20, null=True, blank=True, verbose_name='月相类型')
    
    solar_terms = models.JSONField(null=True, blank=True, verbose_name='节气数据')
    calculation_steps = models.JSONField(null=True, blank=True, verbose_name='推算步骤')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    
    batch = models.ForeignKey('CalculationBatch', on_delete=models.SET_NULL, null=True, blank=True, related_name='records', verbose_name='所属批次')
    created_at = models.DateTimeField(default=tz_now, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    calculated_at = models.DateTimeField(null=True, blank=True, verbose_name='推算时间')
    
    def __str__(self):
        return f'{self.title} - {self.target_date}'
    
    class Meta:
        verbose_name = '推算记录'
        verbose_name_plural = '推算记录'
        ordering = ['-created_at']


class CalculationBatch(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('calculating', '推算中'),
        ('completed', '已完成'),
        ('error', '出错'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='批次名称')
    description = models.TextField(blank=True, verbose_name='批次描述')
    
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=39.9042, verbose_name='纬度')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=116.4074, verbose_name='经度')
    timezone_offset = models.IntegerField(default=8, verbose_name='时区')
    
    total_records = models.IntegerField(default=0, verbose_name='总记录数')
    success_count = models.IntegerField(default=0, verbose_name='成功数')
    error_count = models.IntegerField(default=0, verbose_name='异常数')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    
    created_at = models.DateTimeField(default=tz_now, verbose_name='创建时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = '推算批次'
        verbose_name_plural = '推算批次'
        ordering = ['-created_at']


class RecordVersion(models.Model):
    record = models.ForeignKey('CalculationRecord', on_delete=models.CASCADE, related_name='versions', verbose_name='关联记录')
    version_number = models.IntegerField(verbose_name='版本号')
    changes = models.TextField(verbose_name='变更说明')
    
    target_date = models.DateField(verbose_name='目标日期')
    time_hour = models.IntegerField(default=12, verbose_name='时间(时)')
    time_minute = models.IntegerField(default=0, verbose_name='时间(分)')
    
    latitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name='纬度')
    longitude = models.DecimalField(max_digits=9, decimal_places=6, verbose_name='经度')
    timezone_offset = models.IntegerField(default=8, verbose_name='时区')
    
    lunar_year = models.IntegerField(null=True, blank=True, verbose_name='农历年')
    lunar_month = models.IntegerField(null=True, blank=True, verbose_name='农历月')
    lunar_day = models.IntegerField(null=True, blank=True, verbose_name='农历日')
    year_gan_zhi = models.CharField(max_length=10, null=True, blank=True, verbose_name='年干支')
    month_gan_zhi = models.CharField(max_length=10, null=True, blank=True, verbose_name='月干支')
    day_gan_zhi = models.CharField(max_length=10, null=True, blank=True, verbose_name='日干支')
    moon_phase = models.CharField(max_length=20, null=True, blank=True, verbose_name='月相')
    
    created_at = models.DateTimeField(default=tz_now, verbose_name='创建时间')
    
    def __str__(self):
        return f'{self.record.title} - 版本 {self.version_number}'
    
    class Meta:
        verbose_name = '记录版本'
        verbose_name_plural = '记录版本'
        ordering = ['-version_number']


class AbnormalData(models.Model):
    TYPE_CHOICES = [
        ('calculation_error', '推算错误'),
        ('date_out_of_range', '日期超出范围'),
        ('location_invalid', '地点无效'),
        ('solar_term_conflict', '节气冲突'),
        ('lunar_date_error', '农历日期错误'),
        ('manual_flag', '手动标记'),
    ]
    
    record = models.ForeignKey('CalculationRecord', on_delete=models.CASCADE, related_name='abnormalities', null=True, blank=True, verbose_name='关联记录')
    batch = models.ForeignKey('CalculationBatch', on_delete=models.CASCADE, related_name='abnormalities', null=True, blank=True, verbose_name='关联批次')
    
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, verbose_name='异常类型')
    message = models.TextField(verbose_name='异常信息')
    details = models.JSONField(null=True, blank=True, verbose_name='详细数据')
    
    resolved = models.BooleanField(default=False, verbose_name='是否已处理')
    resolution_note = models.TextField(blank=True, verbose_name='处理备注')
    
    created_at = models.DateTimeField(default=tz_now, verbose_name='创建时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    
    def __str__(self):
        return f'{self.get_type_display()} - {self.created_at}'
    
    class Meta:
        verbose_name = '异常数据'
        verbose_name_plural = '异常数据'
        ordering = ['-created_at']
