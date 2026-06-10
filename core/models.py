from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    class Role(models.TextChoices):
        NURSE = 'nurse', _('护士')
        DOCTOR = 'doctor', _('医生')
        FAMILY = 'family', _('家属')
        DIRECTOR = 'director', _('院长')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.NURSE,
        verbose_name='角色'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def is_nurse(self):
        return self.role == self.Role.NURSE

    def is_doctor(self):
        return self.role == self.Role.DOCTOR

    def is_family(self):
        return self.role == self.Role.FAMILY

    def is_director(self):
        return self.role == self.Role.DIRECTOR

    def get_role_display_zh(self):
        role_map = {
            'nurse': '护士',
            'doctor': '医生',
            'family': '家属',
            'director': '院长'
        }
        return role_map.get(self.role, self.role)


class Elder(models.Model):
    GENDER_CHOICES = [
        ('M', '男'),
        ('F', '女'),
    ]

    name = models.CharField(max_length=100, verbose_name='姓名')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name='性别')
    birth_date = models.DateField(verbose_name='出生日期')
    id_number = models.CharField(max_length=18, unique=True, verbose_name='身份证号')
    floor = models.CharField(max_length=50, verbose_name='楼层')
    room_number = models.CharField(max_length=20, verbose_name='房间号')
    bed_number = models.CharField(max_length=10, verbose_name='床位号')
    admission_date = models.DateField(verbose_name='入住日期')
    medical_history = models.TextField(blank=True, verbose_name='病史')
    allergies = models.TextField(blank=True, verbose_name='过敏史')
    emergency_contact = models.CharField(max_length=100, verbose_name='紧急联系人')
    emergency_phone = models.CharField(max_length=20, verbose_name='紧急联系电话')
    family_members = models.ManyToManyField(
        User,
        blank=True,
        related_name='elders',
        limit_choices_to={'role': User.Role.FAMILY},
        verbose_name='家属成员'
    )
    current_nursing_level = models.ForeignKey(
        'assessments.NursingLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_elders',
        verbose_name='当前护理等级'
    )
    current_monthly_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='当前月费'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '长者'
        verbose_name_plural = '长者'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.room_number}-{self.bed_number})"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

    @property
    def location(self):
        return f"{self.floor} {self.room_number}房 {self.bed_number}床"