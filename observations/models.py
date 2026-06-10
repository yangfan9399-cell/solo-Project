from django.db import models
from django.conf import settings


class ObservationRecord(models.Model):
    APPETITE_CHOICES = [
        ('normal', '正常'),
        ('decreased', '减少'),
        ('none', '无'),
    ]
    
    MENTAL_STATE_CHOICES = [
        ('active', '活跃'),
        ('normal', '正常'),
        ('lethargic', '萎靡'),
    ]
    
    EXCRETION_CHOICES = [
        ('normal', '正常'),
        ('abnormal', '异常'),
    ]
    
    batch = models.ForeignKey('batches.Batch', on_delete=models.CASCADE, related_name='observation_records', verbose_name='批次')
    observation_date = models.DateField(verbose_name='观察日期')
    observer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name='观察员')
    temperature = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='体温(℃)')
    appetite = models.CharField(max_length=20, choices=APPETITE_CHOICES, verbose_name='食欲')
    mental_state = models.CharField(max_length=20, choices=MENTAL_STATE_CHOICES, verbose_name='精神状态')
    excretion = models.CharField(max_length=20, choices=EXCRETION_CHOICES, verbose_name='排泄情况')
    abnormal_symptoms = models.TextField(blank=True, null=True, verbose_name='异常症状')
    feeding_record = models.TextField(verbose_name='饲养记录')
    water_intake = models.CharField(max_length=100, verbose_name='饮水情况')
    environment_temp = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='环境温度(℃)')
    environment_humidity = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='环境湿度(%)')
    is_abnormal = models.BooleanField(default=False, verbose_name='是否异常')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '观察记录'
        verbose_name_plural = '观察记录'
        ordering = ['-observation_date']
        unique_together = ['batch', 'observation_date']
        indexes = [
            models.Index(fields=['batch']),
            models.Index(fields=['observation_date']),
            models.Index(fields=['is_abnormal']),
        ]
    
    def __str__(self):
        return f"{self.batch.batch_number} - {self.observation_date}"
    
    def save(self, *args, **kwargs):
        if self.abnormal_symptoms or self.mental_state == 'lethargic' or self.excretion == 'abnormal':
            self.is_abnormal = True
        super().save(*args, **kwargs)


class ObservationPhoto(models.Model):
    observation = models.ForeignKey(ObservationRecord, on_delete=models.CASCADE, related_name='photos', verbose_name='观察记录')
    file_path = models.CharField(max_length=255, verbose_name='文件路径')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='上传时间')
    
    class Meta:
        verbose_name = '观察照片'
        verbose_name_plural = '观察照片'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.observation.batch.batch_number} - {self.observation.observation_date} - 照片"