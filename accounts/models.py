from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_READER = 'reader'
    ROLE_LIBRARIAN = 'librarian'
    ROLE_CONSERVATOR = 'conservator'
    ROLE_SUPERVISOR = 'supervisor'

    ROLE_CHOICES = [
        (ROLE_READER, '读者'),
        (ROLE_LIBRARIAN, '馆员'),
        (ROLE_CONSERVATOR, '修复员'),
        (ROLE_SUPERVISOR, '主管'),
    ]

    READER_TYPE_UNDERGRAD = 'undergrad'
    READER_TYPE_GRADUATE = 'graduate'
    READER_TYPE_TEACHER = 'teacher'
    READER_TYPE_RESEARCHER = 'researcher'

    READER_TYPE_CHOICES = [
        (READER_TYPE_UNDERGRAD, '本科生'),
        (READER_TYPE_GRADUATE, '研究生'),
        (READER_TYPE_TEACHER, '教师'),
        (READER_TYPE_RESEARCHER, '研究员'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_READER, verbose_name='角色')
    real_name = models.CharField(max_length=50, verbose_name='真实姓名')
    reader_type = models.CharField(max_length=20, choices=READER_TYPE_CHOICES, blank=True, null=True, verbose_name='读者类型')
    institution = models.CharField(max_length=100, blank=True, verbose_name='所属机构')
    has_proof = models.BooleanField(default=False, verbose_name='已提交资格证明')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    is_suspended = models.BooleanField(default=False, verbose_name='是否暂停资格')
    suspend_reason = models.TextField(blank=True, verbose_name='暂停原因')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.real_name or self.username

    @property
    def is_reader(self):
        return self.role == self.ROLE_READER

    @property
    def is_librarian(self):
        return self.role in [self.ROLE_LIBRARIAN, self.ROLE_SUPERVISOR]

    @property
    def is_conservator(self):
        return self.role in [self.ROLE_CONSERVATOR, self.ROLE_SUPERVISOR]

    @property
    def is_supervisor(self):
        return self.role == self.ROLE_SUPERVISOR
