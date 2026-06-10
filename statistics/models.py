from django.db import models


class Statistics(models.Model):
    statistic_type = models.CharField(max_length=50, verbose_name='统计类型')
    dimension = models.CharField(max_length=100, verbose_name='统计维度')
    value = models.CharField(max_length=200, verbose_name='维度值')
    count = models.IntegerField(default=0, verbose_name='数量')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '统计数据'
        verbose_name_plural = '统计数据'
        unique_together = ['statistic_type', 'dimension', 'value']