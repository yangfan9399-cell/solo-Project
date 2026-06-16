"""
初始化游戏数据
包含关卡、站点、车厢、食材、配方、订单模板等
以及示例局次和分数记录
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from game.models import (
    Level, Station, Carriage, Ingredient, Recipe,
    RecipeIngredient, OrderTemplate, Player,
    GameSession, Order, Preparation, Delivery,
    ActionHistory, Settlement
)


class Command(BaseCommand):
    help = '初始化游戏数据 - 关卡、食材、配方等'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化游戏数据...')

        try:
            with transaction.atomic():
                self._create_ingredients()
                self._create_recipes()
                self._create_levels()
                self._create_test_player()
                self._create_sample_sessions()

            self.stdout.write(self.style.SUCCESS('游戏数据初始化完成！'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'初始化失败: {e}'))
            import traceback
            traceback.print_exc()

    def _create_ingredients(self):
        """创建食材数据"""
        self.stdout.write('创建食材数据...')

        ingredients_data = [
            {'name': '白菜', 'icon': '🥬', 'prep_time': 3, 'heat_time': 5, 'cost': 5, 'category': 'vegetable'},
            {'name': '青菜', 'icon': '🥦', 'prep_time': 4, 'heat_time': 4, 'cost': 6, 'category': 'vegetable'},
            {'name': '番茄', 'icon': '🍅', 'prep_time': 2, 'heat_time': 3, 'cost': 4, 'category': 'vegetable'},
            {'name': '土豆', 'icon': '🥔', 'prep_time': 5, 'heat_time': 8, 'cost': 3, 'category': 'vegetable'},
            {'name': '胡萝卜', 'icon': '🥕', 'prep_time': 3, 'heat_time': 6, 'cost': 4, 'category': 'vegetable'},

            {'name': '猪肉', 'icon': '🥩', 'prep_time': 5, 'heat_time': 10, 'cost': 15, 'category': 'meat'},
            {'name': '牛肉', 'icon': '🥩', 'prep_time': 6, 'heat_time': 12, 'cost': 25, 'category': 'meat'},
            {'name': '鸡肉', 'icon': '🍗', 'prep_time': 4, 'heat_time': 8, 'cost': 12, 'category': 'meat'},
            {'name': '鸡蛋', 'icon': '🥚', 'prep_time': 1, 'heat_time': 3, 'cost': 3, 'category': 'meat'},

            {'name': '米饭', 'icon': '🍚', 'prep_time': 2, 'heat_time': 10, 'cost': 2, 'category': 'staple'},
            {'name': '面条', 'icon': '🍜', 'prep_time': 3, 'heat_time': 5, 'cost': 3, 'category': 'staple'},
            {'name': '馒头', 'icon': '🥟', 'prep_time': 5, 'heat_time': 8, 'cost': 2, 'category': 'staple'},

            {'name': '紫菜蛋花汤', 'icon': '🍲', 'prep_time': 3, 'heat_time': 5, 'cost': 5, 'category': 'soup'},
            {'name': '番茄蛋汤', 'icon': '🥣', 'prep_time': 3, 'heat_time': 4, 'cost': 4, 'category': 'soup'},

            {'name': '矿泉水', 'icon': '💧', 'prep_time': 0, 'heat_time': 0, 'cost': 2, 'category': 'drink'},
            {'name': '可乐', 'icon': '🥤', 'prep_time': 0, 'heat_time': 0, 'cost': 4, 'category': 'drink'},
            {'name': '热茶', 'icon': '🍵', 'prep_time': 1, 'heat_time': 2, 'cost': 3, 'category': 'drink'},
            {'name': '咖啡', 'icon': '☕', 'prep_time': 1, 'heat_time': 2, 'cost': 8, 'category': 'drink'},

            {'name': '蛋糕', 'icon': '🍰', 'prep_time': 2, 'heat_time': 0, 'cost': 10, 'category': 'dessert'},
            {'name': '水果', 'icon': '🍎', 'prep_time': 2, 'heat_time': 0, 'cost': 8, 'category': 'dessert'},
        ]

        for data in ingredients_data:
            Ingredient.objects.get_or_create(name=data['name'], defaults=data)

        self.stdout.write(f'  已创建 {Ingredient.objects.count()} 种食材')

    def _create_recipes(self):
        """创建菜品配方"""
        self.stdout.write('创建菜品配方...')

        recipes_data = [
            {
                'name': '清炒时蔬',
                'icon': '🥗',
                'base_price': 25,
                'cook_time': 8,
                'category': 'lunch',
                'ingredients': [
                    ('青菜', 1),
                    ('白菜', 1),
                ]
            },
            {
                'name': '番茄炒蛋',
                'icon': '🍳',
                'base_price': 28,
                'cook_time': 10,
                'category': 'lunch',
                'ingredients': [
                    ('番茄', 2),
                    ('鸡蛋', 2),
                ]
            },
            {
                'name': '红烧肉',
                'icon': '🍖',
                'base_price': 45,
                'cook_time': 20,
                'category': 'dinner',
                'ingredients': [
                    ('猪肉', 2),
                    ('土豆', 1),
                    ('胡萝卜', 1),
                ]
            },
            {
                'name': '土豆烧牛肉',
                'icon': '🥘',
                'base_price': 58,
                'cook_time': 25,
                'category': 'dinner',
                'ingredients': [
                    ('牛肉', 2),
                    ('土豆', 2),
                    ('胡萝卜', 1),
                ]
            },
            {
                'name': '宫保鸡丁',
                'icon': '🌶️',
                'base_price': 38,
                'cook_time': 12,
                'category': 'lunch',
                'ingredients': [
                    ('鸡肉', 2),
                    ('胡萝卜', 1),
                ]
            },
            {
                'name': '蛋炒饭',
                'icon': '🍛',
                'base_price': 20,
                'cook_time': 8,
                'category': 'lunch',
                'ingredients': [
                    ('米饭', 1),
                    ('鸡蛋', 2),
                    ('胡萝卜', 1),
                ]
            },
            {
                'name': '牛肉面',
                'icon': '🍜',
                'base_price': 35,
                'cook_time': 15,
                'category': 'lunch',
                'ingredients': [
                    ('面条', 1),
                    ('牛肉', 1),
                    ('青菜', 1),
                ]
            },
            {
                'name': '营养早餐',
                'icon': '🍳',
                'base_price': 18,
                'cook_time': 6,
                'category': 'breakfast',
                'ingredients': [
                    ('鸡蛋', 2),
                    ('馒头', 1),
                    ('热茶', 1),
                ]
            },
            {
                'name': '豪华套餐',
                'icon': '🍱',
                'base_price': 88,
                'cook_time': 30,
                'category': 'set',
                'ingredients': [
                    ('米饭', 1),
                    ('牛肉', 2),
                    ('青菜', 1),
                    ('番茄', 1),
                    ('鸡蛋', 1),
                    ('紫菜蛋花汤', 1),
                    ('水果', 1),
                ]
            },
            {
                'name': '经济套餐',
                'icon': '🥡',
                'base_price': 38,
                'cook_time': 15,
                'category': 'set',
                'ingredients': [
                    ('米饭', 1),
                    ('鸡肉', 1),
                    ('青菜', 1),
                    ('番茄蛋汤', 1),
                ]
            },
            {
                'name': '下午茶套餐',
                'icon': '🍰',
                'base_price': 28,
                'cook_time': 5,
                'category': 'snack',
                'ingredients': [
                    ('蛋糕', 1),
                    ('咖啡', 1),
                ]
            },
            {
                'name': '饮料组合',
                'icon': '🥤',
                'base_price': 15,
                'cook_time': 2,
                'category': 'snack',
                'ingredients': [
                    ('矿泉水', 2),
                    ('可乐', 1),
                ]
            },
        ]

        for recipe_data in recipes_data:
            ingredients_list = recipe_data.pop('ingredients')
            recipe, created = Recipe.objects.get_or_create(
                name=recipe_data['name'],
                defaults=recipe_data
            )

            if created:
                for ing_name, quantity in ingredients_list:
                    try:
                        ingredient = Ingredient.objects.get(name=ing_name)
                        RecipeIngredient.objects.create(
                            recipe=recipe,
                            ingredient=ingredient,
                            quantity=quantity
                        )
                    except Ingredient.DoesNotExist:
                        self.stdout.write(self.style.WARNING(f'  警告: 食材 {ing_name} 不存在'))

        self.stdout.write(f'  已创建 {Recipe.objects.count()} 个菜品')

    def _create_levels(self):
        """创建关卡数据"""
        self.stdout.write('创建关卡数据...')

        levels_data = [
            {
                'level_number': 1,
                'name': '京津城际快线',
                'description': '北京到天津的短途列车，熟悉游戏基本操作。3个站点，简单订单，轻松上手！',
                'difficulty': 'easy',
                'target_score': 800,
                'max_orders': 4,
                'station_count': 3,
                'station_interval': 50,
                'carriages_count': 3,
                'time_limit': 200,
                'stations': [
                    {'station_number': 1, 'name': '北京南站', 'arrival_time': 0, 'departure_time': 40, 'order_intensity': 0.8},
                    {'station_number': 2, 'name': '廊坊站', 'arrival_time': 60, 'departure_time': 100, 'order_intensity': 1.0},
                    {'station_number': 3, 'name': '天津站', 'arrival_time': 120, 'departure_time': 180, 'order_intensity': 1.2},
                ],
                'carriages': [
                    {'carriage_number': 1, 'name': '1号硬座车厢', 'distance_from_kitchen': 1, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 2, 'name': '2号硬座车厢', 'distance_from_kitchen': 2, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 3, 'name': '3号软座车厢', 'distance_from_kitchen': 3, 'carriage_type': 'soft', 'tip_multiplier': 1.3},
                ],
            },
            {
                'level_number': 2,
                'name': '京沪高铁',
                'description': '连接北京和上海的黄金线路，客流量大，订单多样。4个站点，注意时间管理！',
                'difficulty': 'normal',
                'target_score': 1500,
                'max_orders': 5,
                'station_count': 4,
                'station_interval': 55,
                'carriages_count': 4,
                'time_limit': 280,
                'stations': [
                    {'station_number': 1, 'name': '北京南站', 'arrival_time': 0, 'departure_time': 45, 'order_intensity': 1.0},
                    {'station_number': 2, 'name': '济南西站', 'arrival_time': 60, 'departure_time': 105, 'order_intensity': 1.2},
                    {'station_number': 3, 'name': '徐州东站', 'arrival_time': 120, 'departure_time': 170, 'order_intensity': 1.3},
                    {'station_number': 4, 'name': '上海虹桥站', 'arrival_time': 185, 'departure_time': 260, 'order_intensity': 1.5},
                ],
                'carriages': [
                    {'carriage_number': 1, 'name': '1号硬座', 'distance_from_kitchen': 1, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 2, 'name': '2号硬座', 'distance_from_kitchen': 2, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 3, 'name': '3号软座', 'distance_from_kitchen': 3, 'carriage_type': 'soft', 'tip_multiplier': 1.3},
                    {'carriage_number': 4, 'name': '4号卧铺', 'distance_from_kitchen': 4, 'carriage_type': 'sleeper', 'tip_multiplier': 1.5},
                ],
            },
            {
                'level_number': 3,
                'name': '京广高铁',
                'description': '纵贯南北的大动脉，VIP订单开始出现。5个站点，挑战你的协调能力！',
                'difficulty': 'normal',
                'target_score': 2500,
                'max_orders': 6,
                'station_count': 5,
                'station_interval': 60,
                'carriages_count': 5,
                'time_limit': 360,
                'stations': [
                    {'station_number': 1, 'name': '北京西站', 'arrival_time': 0, 'departure_time': 50, 'order_intensity': 1.0},
                    {'station_number': 2, 'name': '石家庄站', 'arrival_time': 65, 'departure_time': 115, 'order_intensity': 1.1},
                    {'station_number': 3, 'name': '郑州东站', 'arrival_time': 130, 'departure_time': 185, 'order_intensity': 1.3},
                    {'station_number': 4, 'name': '武汉站', 'arrival_time': 200, 'departure_time': 260, 'order_intensity': 1.4},
                    {'station_number': 5, 'name': '广州南站', 'arrival_time': 275, 'departure_time': 340, 'order_intensity': 1.6},
                ],
                'carriages': [
                    {'carriage_number': 1, 'name': '1号硬座', 'distance_from_kitchen': 1, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 2, 'name': '2号硬座', 'distance_from_kitchen': 2, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 3, 'name': '3号软座', 'distance_from_kitchen': 3, 'carriage_type': 'soft', 'tip_multiplier': 1.3},
                    {'carriage_number': 4, 'name': '4号卧铺', 'distance_from_kitchen': 4, 'carriage_type': 'sleeper', 'tip_multiplier': 1.5},
                    {'carriage_number': 5, 'name': '5号VIP包厢', 'distance_from_kitchen': 5, 'carriage_type': 'vip', 'tip_multiplier': 2.0},
                ],
            },
            {
                'level_number': 4,
                'name': '沪昆高铁',
                'description': '东西向的旅游热线，紧急订单频繁出现。5个站点，考验你的应变能力！',
                'difficulty': 'hard',
                'target_score': 3500,
                'max_orders': 7,
                'station_count': 5,
                'station_interval': 65,
                'carriages_count': 5,
                'time_limit': 420,
                'stations': [
                    {'station_number': 1, 'name': '上海虹桥站', 'arrival_time': 0, 'departure_time': 55, 'order_intensity': 1.2},
                    {'station_number': 2, 'name': '杭州东站', 'arrival_time': 70, 'departure_time': 130, 'order_intensity': 1.4},
                    {'station_number': 3, 'name': '南昌西站', 'arrival_time': 145, 'departure_time': 210, 'order_intensity': 1.5},
                    {'station_number': 4, 'name': '长沙南站', 'arrival_time': 225, 'departure_time': 295, 'order_intensity': 1.6},
                    {'station_number': 5, 'name': '昆明南站', 'arrival_time': 310, 'departure_time': 400, 'order_intensity': 1.8},
                ],
                'carriages': [
                    {'carriage_number': 1, 'name': '1号硬座', 'distance_from_kitchen': 1, 'carriage_type': 'economy', 'tip_multiplier': 1.0},
                    {'carriage_number': 2, 'name': '2号软座', 'distance_from_kitchen': 2, 'carriage_type': 'soft', 'tip_multiplier': 1.3},
                    {'carriage_number': 3, 'name': '3号卧铺', 'distance_from_kitchen': 3, 'carriage_type': 'sleeper', 'tip_multiplier': 1.5},
                    {'carriage_number': 4, 'name': '4号VIP包厢', 'distance_from_kitchen': 4, 'carriage_type': 'vip', 'tip_multiplier': 2.0},
                    {'carriage_number': 5, 'name': '5号VIP包厢', 'distance_from_kitchen': 5, 'carriage_type': 'vip', 'tip_multiplier': 2.0},
                ],
            },
            {
                'level_number': 5,
                'name': '京哈高铁',
                'description': '穿越山海关的冰雪之旅，全程VIP服务。6个站点，终极挑战！',
                'difficulty': 'expert',
                'target_score': 5000,
                'max_orders': 8,
                'station_count': 6,
                'station_interval': 70,
                'carriages_count': 6,
                'time_limit': 500,
                'stations': [
                    {'station_number': 1, 'name': '北京站', 'arrival_time': 0, 'departure_time': 60, 'order_intensity': 1.3},
                    {'station_number': 2, 'name': '秦皇岛站', 'arrival_time': 75, 'departure_time': 140, 'order_intensity': 1.5},
                    {'station_number': 3, 'name': '沈阳北站', 'arrival_time': 155, 'departure_time': 225, 'order_intensity': 1.6},
                    {'station_number': 4, 'name': '长春西站', 'arrival_time': 240, 'departure_time': 315, 'order_intensity': 1.7},
                    {'station_number': 5, 'name': '哈尔滨西站', 'arrival_time': 330, 'departure_time': 410, 'order_intensity': 1.8},
                    {'station_number': 6, 'name': '佳木斯站', 'arrival_time': 425, 'departure_time': 480, 'order_intensity': 2.0},
                ],
                'carriages': [
                    {'carriage_number': 1, 'name': '1号软座', 'distance_from_kitchen': 1, 'carriage_type': 'soft', 'tip_multiplier': 1.3},
                    {'carriage_number': 2, 'name': '2号卧铺', 'distance_from_kitchen': 2, 'carriage_type': 'sleeper', 'tip_multiplier': 1.5},
                    {'carriage_number': 3, 'name': '3号卧铺', 'distance_from_kitchen': 3, 'carriage_type': 'sleeper', 'tip_multiplier': 1.5},
                    {'carriage_number': 4, 'name': '4号VIP包厢', 'distance_from_kitchen': 4, 'carriage_type': 'vip', 'tip_multiplier': 2.0},
                    {'carriage_number': 5, 'name': '5号VIP包厢', 'distance_from_kitchen': 5, 'carriage_type': 'vip', 'tip_multiplier': 2.0},
                    {'carriage_number': 6, 'name': '6号总统包厢', 'distance_from_kitchen': 6, 'carriage_type': 'vip', 'tip_multiplier': 2.5},
                ],
            },
        ]

        for level_data in levels_data:
            stations_data = level_data.pop('stations')
            carriages_data = level_data.pop('carriages')

            level, created = Level.objects.get_or_create(
                level_number=level_data['level_number'],
                defaults=level_data
            )

            if created:
                for st_data in stations_data:
                    Station.objects.create(level=level, **st_data)

                for car_data in carriages_data:
                    Carriage.objects.create(level=level, **car_data)

                self._create_order_templates(level)

        self.stdout.write(f'  已创建 {Level.objects.count()} 个关卡')
        self.stdout.write(f'  已创建 {Station.objects.count()} 个站点')
        self.stdout.write(f'  已创建 {Carriage.objects.count()} 节车厢')
        self.stdout.write(f'  已创建 {OrderTemplate.objects.count()} 个订单模板')

    def _create_order_templates(self, level: Level):
        """为关卡创建订单模板"""
        recipes = Recipe.objects.all()
        carriages = level.carriages.all()

        priorities = ['normal', 'normal', 'normal', 'urgent', 'vip']
        if level.difficulty == 'hard':
            priorities = ['normal', 'normal', 'urgent', 'urgent', 'vip']
        elif level.difficulty == 'expert':
            priorities = ['normal', 'urgent', 'urgent', 'vip', 'vip']

        time_limits = {
            'easy': {'normal': 120, 'urgent': 80, 'vip': 100},
            'normal': {'normal': 110, 'urgent': 70, 'vip': 90},
            'hard': {'normal': 100, 'urgent': 60, 'vip': 80},
            'expert': {'normal': 90, 'urgent': 50, 'vip': 70},
        }

        limits = time_limits.get(level.difficulty, time_limits['normal'])

        for recipe in recipes:
            for carriage in carriages:
                for priority in set(priorities):
                    weight = priorities.count(priority) * 2

                    if carriage.carriage_type == 'vip' and priority != 'vip':
                        weight = max(1, weight // 2)
                    if carriage.carriage_type == 'economy' and priority == 'vip':
                        weight = 1

                    OrderTemplate.objects.create(
                        level=level,
                        recipe=recipe,
                        carriage=carriage,
                        priority=priority,
                        weight=weight,
                        time_limit=limits[priority]
                    )

    def _create_test_player(self):
        """创建测试玩家"""
        self.stdout.write('创建测试玩家...')

        if not Player.objects.filter(username='demo').exists():
            player = Player.objects.create_user(
                username='demo',
                password='demo123456',
                nickname='测试厨师',
                avatar='👨‍🍳'
            )
            self.stdout.write(f'  已创建测试玩家: demo / demo123456')
        else:
            self.stdout.write('  测试玩家已存在')

    def _create_sample_sessions(self):
        """创建示例游戏会话和分数记录"""
        self.stdout.write('创建示例游戏会话和分数记录...')

        player = Player.objects.get(username='demo')
        levels = Level.objects.order_by('level_number')[:3]

        sample_results = [
            {'status': 'won', 'score': 1250, 'money': 380, 'completed': 8, 'failed': 2, 'star': 3},
            {'status': 'won', 'score': 2180, 'money': 650, 'completed': 12, 'failed': 3, 'star': 4},
            {'status': 'lost', 'score': 780, 'money': 220, 'completed': 5, 'failed': 6, 'star': 1},
        ]

        session_count = 0
        for i, (level, result) in enumerate(zip(levels, sample_results)):
            session_id = i + 1
            if GameSession.objects.filter(id=session_id).exists():
                continue

            start_time = timezone.now() - timedelta(days=3 - i, hours=2 + i)
            end_time = start_time + timedelta(seconds=level.time_limit)

            session = GameSession.objects.create(
                id=session_id,
                player=player,
                level=level,
                status=result['status'],
                score=result['score'],
                money=result['money'],
                orders_completed=result['completed'],
                orders_failed=result['failed'],
                current_time=level.time_limit,
                current_station=level.station_count - 1,
                start_time=start_time,
                end_time=end_time
            )
            session_count += 1

            self._create_sample_orders_and_history(session, level, result)
            self._create_sample_settlement(session, result)

        self.stdout.write(f'  已创建 {session_count} 个示例游戏会话')
        self.stdout.write(f'  已创建 {Order.objects.filter(session__player=player).count()} 个示例订单')
        self.stdout.write(f'  已创建 {Settlement.objects.filter(session__player=player).count()} 个结算记录')
        self.stdout.write(f'  已创建 {ActionHistory.objects.filter(session__player=player).count()} 条操作历史')

    def _create_sample_orders_and_history(self, session, level, result):
        """为示例会话创建订单和操作历史"""
        recipes = Recipe.objects.all()[:6]
        carriages = level.carriages.all()
        priorities = ['normal', 'urgent', 'vip']
        stations = level.stations.all()

        stations_data = list(stations.values('id', 'station_number', 'name', 'arrival_time', 'departure_time'))

        for st in stations_data:
            ActionHistory.objects.create(
                session=session,
                action_type='station_arrive',
                game_time=st['arrival_time'],
                sequence=st['station_number'] * 10,
                action_data={
                    'station_id': st['id'],
                    'station_name': st['name'],
                    'station_number': st['station_number']
                }
            )

        total_orders = result['completed'] + result['failed']
        seq = len(stations_data) * 10 + 10
        current_time = 10

        for i in range(total_orders):
            recipe = recipes[i % len(recipes)]
            carriage = carriages[i % len(carriages)]
            priority = priorities[i % len(priorities)]
            is_completed = i < result['completed']

            base_price = recipe.base_price
            time_limit = {'normal': 120, 'urgent': 80, 'vip': 100}[priority]

            order = Order.objects.create(
                session=session,
                recipe=recipe,
                carriage=carriage,
                priority=priority,
                status='completed' if is_completed else 'failed',
                base_price=base_price,
                time_limit=time_limit,
                created_at=current_time,
                final_price=base_price * 1.5 if is_completed else 0,
                tip=int(base_price * 0.3) if is_completed else 0
            )

            ActionHistory.objects.create(
                session=session,
                action_type='order_created',
                game_time=current_time,
                sequence=seq,
                action_data={
                    'order_id': order.id,
                    'recipe_name': recipe.name,
                    'carriage': carriage.name,
                    'priority': priority,
                    'time_limit': time_limit
                }
            )
            seq += 1

            if is_completed:
                ActionHistory.objects.create(
                    session=session,
                    action_type='start_prep',
                    game_time=current_time + 5,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'recipe_name': recipe.name,
                        'prep_station': 0,
                        'duration': 30
                    }
                )
                seq += 1

                prep_duration = 0
                for ri in recipe.recipeingredient_set.all():
                    p_time = ri.ingredient.prep_time * ri.quantity
                    h_time = ri.ingredient.heat_time * ri.quantity
                    prep_duration = max(prep_duration, p_time + h_time)

                    ActionHistory.objects.create(
                        session=session,
                        action_type='ingredient_prep_complete',
                        game_time=current_time + 5 + p_time,
                        sequence=seq,
                        action_data={
                            'order_id': order.id,
                            'ingredient': ri.ingredient.name,
                            'task_type': 'prep'
                        }
                    )
                    seq += 1

                    ActionHistory.objects.create(
                        session=session,
                        action_type='ingredient_heat_complete',
                        game_time=current_time + 5 + p_time + h_time,
                        sequence=seq,
                        action_data={
                            'order_id': order.id,
                            'ingredient': ri.ingredient.name,
                            'task_type': 'heat'
                        }
                    )
                    seq += 1

                ActionHistory.objects.create(
                    session=session,
                    action_type='cooking_complete',
                    game_time=current_time + 5 + prep_duration,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'task_type': 'cook'
                    }
                )
                seq += 1

                ActionHistory.objects.create(
                    session=session,
                    action_type='plating_complete',
                    game_time=current_time + 5 + prep_duration + recipe.cook_time,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'task_type': 'plate'
                    }
                )
                seq += 1

                ActionHistory.objects.create(
                    session=session,
                    action_type='order_ready',
                    game_time=current_time + 5 + prep_duration + recipe.cook_time + 5,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'recipe_name': recipe.name
                    }
                )
                seq += 1

                delivery_time = carriage.distance_from_kitchen * 5
                ActionHistory.objects.create(
                    session=session,
                    action_type='start_delivery',
                    game_time=current_time + 5 + prep_duration + recipe.cook_time + 8,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'recipe_name': recipe.name,
                        'waiter_id': 1,
                        'carriage': carriage.name,
                        'distance': carriage.distance_from_kitchen,
                        'travel_time': delivery_time
                    }
                )
                seq += 1

                final_score = int(base_price * 1.5 * {'normal': 1.0, 'urgent': 1.5, 'vip': 2.0}[priority])
                time_remaining = time_limit - (prep_duration + recipe.cook_time + 5 + delivery_time + 15)

                ActionHistory.objects.create(
                    session=session,
                    action_type='order_complete',
                    game_time=current_time + 5 + prep_duration + recipe.cook_time + 8 + delivery_time,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'recipe_name': recipe.name,
                        'score': final_score,
                        'money': int(base_price * 1.5),
                        'tip': int(base_price * 0.3),
                        'time_remaining': time_remaining,
                        'time_limit': time_limit
                    }
                )
                seq += 1

                current_time += 25
            else:
                penalty = {'normal': 50, 'urgent': 100, 'vip': 150}[priority]
                ActionHistory.objects.create(
                    session=session,
                    action_type='order_failed',
                    game_time=current_time + time_limit + 1,
                    sequence=seq,
                    action_data={
                        'order_id': order.id,
                        'recipe_name': recipe.name,
                        'priority': priority,
                        'penalty': penalty
                    }
                )
                seq += 1
                current_time += 15

        for st in stations_data:
            ActionHistory.objects.create(
                session=session,
                action_type='station_depart',
                game_time=st['departure_time'],
                sequence=seq + st['station_number'],
                action_data={
                    'station_id': st['id'],
                    'station_name': st['name'],
                    'station_number': st['station_number']
                }
            )

    def _create_sample_settlement(self, session, result):
        """为示例会话创建结算记录"""
        level = session.level

        order_income = int(result['score'] * 0.6)
        tips = int(result['score'] * 0.3)
        ingredient_cost = int(order_income * 0.3)
        fines = result['failed'] * 25

        efficiency = min(1000, int((result['completed'] / max(1, result['completed'] + result['failed'])) * 1000))
        speed = min(1000, int(800 + result['completed'] * 10))
        perfect = max(0, result['completed'] - result['failed'])
        quality = min(1000, int((perfect / max(1, result['completed'])) * 1000))

        final_score = int(result['score'] * 0.6 + efficiency * 0.2 + speed * 0.1 + quality * 0.1)

        Settlement.objects.create(
            session=session,
            total_income=order_income,
            total_cost=ingredient_cost,
            total_tip=tips,
            orders_completed=result['completed'],
            orders_failed=result['failed'],
            perfect_orders=perfect,
            late_orders=max(0, result['failed'] - 1),
            efficiency_score=efficiency,
            speed_score=speed,
            quality_score=quality,
            final_score=final_score,
            star_rating=result['star'],
            recalculated=True
        )
