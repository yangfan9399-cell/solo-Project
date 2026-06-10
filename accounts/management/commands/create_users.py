from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = '创建预置用户数据'

    def handle(self, *args, **options):
        users_data = [
            {'username': 'inspector1', 'password': 'password123', 'role': 'inspector', 'full_name': '张检疫'},
            {'username': 'staff1', 'password': 'password123', 'role': 'quarantine_staff', 'full_name': '李场员'},
            {'username': 'vet1', 'password': 'password123', 'role': 'veterinarian', 'full_name': '王兽医'},
            {'username': 'supervisor1', 'password': 'password123', 'role': 'supervisor', 'full_name': '赵监管'},
        ]
        
        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    password=user_data['password'],
                    role=user_data['role'],
                    full_name=user_data['full_name']
                )
                self.stdout.write(self.style.SUCCESS(f'成功创建用户: {user.full_name} ({user.username})'))
            else:
                self.stdout.write(self.style.WARNING(f'用户已存在: {user_data["username"]}'))
        
        self.stdout.write(self.style.SUCCESS('预置用户数据创建完成'))