from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('inspector', '检疫员'),
        ('quarantine_staff', '隔离场人员'),
        ('veterinarian', '兽医'),
        ('supervisor', '监管负责人'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='角色')
    full_name = models.CharField(max_length=100, verbose_name='姓名')
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['id']
    
    def __str__(self):
        return f"{self.full_name} ({self.get_role_display()})"
    
    def can_create_batch(self):
        return self.role == 'inspector'
    
    def can_write_observation(self):
        return self.role == 'quarantine_staff'
    
    def can_review_health(self):
        return self.role == 'veterinarian'
    
    def can_approve_release(self):
        return self.role == 'supervisor'