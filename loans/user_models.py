from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('collection_clerk', '馆藏经办人'),
        ('transport_coordinator', '运输协调人'),
        ('insurance_reviewer', '保险复核人'),
        ('conservator', '文保人员'),
        ('admin', '系统管理员'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField('角色', max_length=30, choices=ROLE_CHOICES, default='collection_clerk')
    phone = models.CharField('电话', max_length=50, blank=True)
    department = models.CharField('部门', max_length=100, blank=True)

    class Meta:
        verbose_name = '用户档案'
        verbose_name_plural = '用户档案'

    def __str__(self):
        return f'{self.user.username} - {self.get_role_display()}'

    def get_role_display_short(self):
        return dict(self.ROLE_CHOICES).get(self.role, self.role)

    def is_collection_clerk(self):
        return self.role == 'collection_clerk' or self.role == 'admin'

    def is_transport_coordinator(self):
        return self.role == 'transport_coordinator' or self.role == 'admin'

    def is_insurance_reviewer(self):
        return self.role == 'insurance_reviewer' or self.role == 'admin'

    def is_conservator(self):
        return self.role == 'conservator' or self.role == 'admin'

    def is_admin(self):
        return self.role == 'admin'


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()
