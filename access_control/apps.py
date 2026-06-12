from django.apps import AppConfig


class AccessControlConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'access_control'
    verbose_name = '门禁授权回收管理'

    def ready(self):
        from . import signals
