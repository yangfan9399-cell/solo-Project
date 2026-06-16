from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from game.models import PlayerProfile, Level


class Command(BaseCommand):
    help = '初始化游戏测试数据：用户、管理员、关卡'

    def handle(self, *args, **options):
        stats = {
            'users_created': 0,
            'users_existed': 0,
            'profiles_created': 0,
            'profiles_existed': 0,
            'levels_created': 0,
            'levels_existed': 0,
        }

        self.stdout.write(self.style.WARNING('========== 开始初始化游戏数据 =========='))

        user_test, created = User.objects.get_or_create(
            username='testplayer',
            defaults={}
        )
        if created:
            user_test.set_password('test123456')
            user_test.save()
            stats['users_created'] += 1
            self.stdout.write(self.style.SUCCESS(f'[创建用户] testplayer'))
        else:
            stats['users_existed'] += 1
            self.stdout.write(self.style.WARNING(f'[已存在] testplayer'))

        _, profile_created = PlayerProfile.objects.get_or_create(
            user=user_test,
            defaults={'nickname': '测试玩家'}
        )
        if profile_created:
            stats['profiles_created'] += 1
            self.stdout.write(self.style.SUCCESS(f'[创建档案] 测试玩家 (testplayer)'))
        else:
            stats['profiles_existed'] += 1
            self.stdout.write(self.style.WARNING(f'[已存在] PlayerProfile for testplayer'))

        user_admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'is_superuser': True,
                'is_staff': True,
            }
        )
        if created:
            user_admin.set_password('admin123456')
            user_admin.save()
            stats['users_created'] += 1
            self.stdout.write(self.style.SUCCESS(f'[创建用户] admin (超级管理员)'))
        else:
            if not user_admin.is_superuser:
                user_admin.is_superuser = True
            if not user_admin.is_staff:
                user_admin.is_staff = True
            user_admin.save()
            stats['users_existed'] += 1
            self.stdout.write(self.style.WARNING(f'[已存在] admin (已确保管理员权限)'))

        _, profile_created = PlayerProfile.objects.get_or_create(
            user=user_admin,
            defaults={'nickname': '系统管理员'}
        )
        if profile_created:
            stats['profiles_created'] += 1
            self.stdout.write(self.style.SUCCESS(f'[创建档案] 系统管理员 (admin)'))
        else:
            stats['profiles_existed'] += 1
            self.stdout.write(self.style.WARNING(f'[已存在] PlayerProfile for admin'))

        self.stdout.write(self.style.WARNING('---------- 创建游戏关卡 ----------'))

        level1_grid = [
            '######',
            '# .  #',
            '#  Q #',
            '# @  #',
            '######',
        ]
        level, created = Level.objects.update_or_create(
            name='入门',
            defaults={
                'difficulty': 1,
                'grid_data': level1_grid,
                'best_steps': 5,
            }
        )
        if created:
            stats['levels_created'] += 1
            self.stdout.write(self.style.SUCCESS('[创建关卡] 第1关 - 入门 (难度1, 最佳步数5)'))
        else:
            stats['levels_existed'] += 1
            self.stdout.write(self.style.WARNING('[已更新] 第1关 - 入门'))

        level2_grid = [
            '#######',
            '#     #',
            '# @Q$.#',
            '#  .  #',
            '#     #',
            '#######',
        ]
        _, created = Level.objects.update_or_create(
            name='初级',
            defaults={
                'difficulty': 1,
                'grid_data': level2_grid,
                'best_steps': 8,
            }
        )
        if created:
            stats['levels_created'] += 1
            self.stdout.write(self.style.SUCCESS('[创建关卡] 第2关 - 初级 (难度1, 最佳步数8)'))
        else:
            stats['levels_existed'] += 1
            self.stdout.write(self.style.WARNING('[已更新] 第2关 - 初级'))

        level3_grid = [
            '########',
            '#      #',
            '# @ Q  #',
            '#  .Q  #',
            '#   .  #',
            '#      #',
            '########',
        ]
        _, created = Level.objects.update_or_create(
            name='中级',
            defaults={
                'difficulty': 2,
                'grid_data': level3_grid,
                'best_steps': 12,
            }
        )
        if created:
            stats['levels_created'] += 1
            self.stdout.write(self.style.SUCCESS('[创建关卡] 第3关 - 中级 (难度2, 最佳步数12)'))
        else:
            stats['levels_existed'] += 1
            self.stdout.write(self.style.WARNING('[已更新] 第3关 - 中级'))

        level4_grid = [
            '#########',
            '#   #   #',
            '# @ Q . #',
            '# # $ # #',
            '# . Q   #',
            '#   #   #',
            '#########',
        ]
        _, created = Level.objects.update_or_create(
            name='进阶',
            defaults={
                'difficulty': 3,
                'grid_data': level4_grid,
                'best_steps': 18,
            }
        )
        if created:
            stats['levels_created'] += 1
            self.stdout.write(self.style.SUCCESS('[创建关卡] 第4关 - 进阶 (难度3, 最佳步数18, 含死锁陷阱)'))
        else:
            stats['levels_existed'] += 1
            self.stdout.write(self.style.WARNING('[已更新] 第4关 - 进阶'))

        level5_grid = [
            '##########',
            '#        #',
            '# @  Q   #',
            '# $ ## . #',
            '# Q  . Q #',
            '# . ## $ #',
            '#    Q   #',
            '#        #',
            '##########',
        ]
        _, created = Level.objects.update_or_create(
            name='困难',
            defaults={
                'difficulty': 4,
                'grid_data': level5_grid,
                'best_steps': 25,
            }
        )
        if created:
            stats['levels_created'] += 1
            self.stdout.write(self.style.SUCCESS('[创建关卡] 第5关 - 困难 (难度4, 最佳步数25, 3量子箱+2普通箱)'))
        else:
            stats['levels_existed'] += 1
            self.stdout.write(self.style.WARNING('[已更新] 第5关 - 困难'))

        self.stdout.write(self.style.WARNING('========== 初始化完成 =========='))
        self.stdout.write('')
        self.stdout.write(self.style.MIGRATE_HEADING('创建统计:'))
        self.stdout.write(f'  用户:     新建 {stats["users_created"]} 个, 已存在 {stats["users_existed"]} 个')
        self.stdout.write(f'  玩家档案: 新建 {stats["profiles_created"]} 个, 已存在 {stats["profiles_existed"]} 个')
        self.stdout.write(f'  关卡:     新建 {stats["levels_created"]} 个, 已存在 {stats["levels_existed"]} 个')
        total_created = stats['users_created'] + stats['profiles_created'] + stats['levels_created']
        total_existed = stats['users_existed'] + stats['profiles_existed'] + stats['levels_existed']
        self.stdout.write(f'  总计:     新建 {total_created} 项, 已存在 {total_existed} 项')
        self.stdout.write('')
        self.stdout.write(self.style.SQL_KEYWORD('登录账号:'))
        self.stdout.write('  测试玩家:  username=testplayer, password=test123456')
        self.stdout.write('  管理员:    username=admin, password=admin123456')
