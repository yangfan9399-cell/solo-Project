from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, email, password, **extra_fields):
        if not username:
            raise ValueError('The given username must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self._create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        FIELD_STAFF = 'field_staff', _('现场人员')
        REVIEWER = 'reviewer', _('主管复核人')
        ADMIN = 'admin', _('系统管理员')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.FIELD_STAFF,
        verbose_name='用户角色'
    )
    department = models.CharField(max_length=100, blank=True, verbose_name='所属部门')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    employee_id = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='工号')

    objects = UserManager()

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'

    def get_full_name(self):
        full_name = f'{self.last_name}{self.first_name}'
        return full_name.strip() or self.username

    @property
    def is_field_staff(self):
        return self.role == self.Role.FIELD_STAFF

    @property
    def is_reviewer(self):
        return self.role == self.Role.REVIEWER

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN
