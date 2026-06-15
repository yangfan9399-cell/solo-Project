"""
初始化三个种子关卡数据
样本1：需要折叠历史正常完成
样本2：路线验证触发异常
样本3：最短解对比和关卡编辑器需要回滚或重算
"""
from django.core.management.base import BaseCommand
from game.models import Level


class Command(BaseCommand):
    help = '初始化三个种子关卡数据'

    def handle(self, *args, **options):
        self.stdout.write('开始创建种子关卡数据...\n')
        
        Level.objects.all().delete()
        self.stdout.write('已清除现有关卡数据\n')
        
        self._create_sample_1()
        self._create_sample_2()
        self._create_sample_3()
        
        self.stdout.write(self.style.SUCCESS('成功创建3个种子关卡！'))
    
    def _create_sample_1(self):
        """样本1：需要折叠历史正常完成
        5x5网格，需要通过折叠连通不同区域，正常通关
        """
        addresses = [
            {'id': 'addr_1', 'x': 0, 'y': 0, 'color': 'red', 'name': '红房子'},
            {'id': 'addr_2', 'x': 4, 'y': 0, 'color': 'blue', 'name': '蓝房子'},
            {'id': 'addr_3', 'x': 0, 'y': 4, 'color': 'green', 'name': '绿房子'},
            {'id': 'addr_4', 'x': 4, 'y': 4, 'color': 'yellow', 'name': '黄房子'},
        ]
        
        roads = []
        for x in range(5):
            for y in range(5):
                if x < 4:
                    roads.append({'from': f'cell_{x}_{y}', 'to': f'cell_{x+1}_{y}'})
                if y < 4:
                    roads.append({'from': f'cell_{x}_{y}', 'to': f'cell_{x}_{y+1}'})
        
        letters = [
            {'id': 'letter_1', 'color': 'red', 'address_id': 'addr_1'},
            {'id': 'letter_2', 'color': 'blue', 'address_id': 'addr_2'},
            {'id': 'letter_3', 'color': 'green', 'address_id': 'addr_3'},
            {'id': 'letter_4', 'color': 'yellow', 'address_id': 'addr_4'},
        ]
        
        level = Level.objects.create(
            name='样本1：邻里送信',
            description='需要通过折叠缩短路线，正常完成所有信件投递。注意观察折叠后道路的连通变化。',
            grid_width=5,
            grid_height=5,
            addresses=addresses,
            roads=roads,
            letters=letters,
            post_office={'x': 2, 'y': 2},
            max_steps=25,
            min_folds=1,
            fold_directions=['horizontal_up', 'horizontal_down', 'vertical_left', 'vertical_right'],
            required_folds=[],
            min_solution={
                'steps': 12,
                'folds': 1,
                'description': '先向上折叠y=2，然后依次送达四个角落',
                'actions': [
                    {'action': 'fold', 'direction': 'horizontal_up', 'fold_line': 2},
                    {'action': 'move', 'to': [1, 2]},
                    {'action': 'move', 'to': [0, 2]},
                    {'action': 'move', 'to': [0, 1]},
                    {'action': 'deliver', 'letter_id': 'letter_1'},
                    {'action': 'move', 'to': [0, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_3'},
                    {'action': 'move', 'to': [1, 0]},
                    {'action': 'move', 'to': [2, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_4'},
                    {'action': 'move', 'to': [3, 0]},
                    {'action': 'move', 'to': [4, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_2'},
                ]
            }
        )
        self.stdout.write(f'创建样本1: {level.name}\n')
    
    def _create_sample_2(self):
        """样本2：路线验证触发异常
        包含需要特定折叠才能连通的地址，直接尝试移动会触发验证异常
        """
        addresses = [
            {'id': 'addr_1', 'x': 0, 'y': 0, 'color': 'red', 'name': '红房子'},
            {'id': 'addr_2', 'x': 4, 'y': 4, 'color': 'purple', 'name': '紫房子', 'requires_fold': 'vertical_right'},
            {'id': 'addr_3', 'x': 2, 'y': 4, 'color': 'orange', 'name': '橙房子', 'requires_fold': 'horizontal_down'},
        ]
        
        roads = []
        for x in range(5):
            for y in range(5):
                if x < 4:
                    if not (x == 1 and y in [2, 3]):
                        roads.append({'from': f'cell_{x}_{y}', 'to': f'cell_{x+1}_{y}'})
                if y < 4:
                    if not (y == 1 and x in [2, 3]):
                        roads.append({'from': f'cell_{x}_{y}', 'to': f'cell_{x}_{y+1}'})
        
        letters = [
            {'id': 'letter_1', 'color': 'red', 'address_id': 'addr_1'},
            {'id': 'letter_2', 'color': 'purple', 'address_id': 'addr_2'},
            {'id': 'letter_3', 'color': 'orange', 'address_id': 'addr_3'},
        ]
        
        level = Level.objects.create(
            name='样本2：迷宫信使',
            description='部分地址被障碍物阻隔，需要先折叠才能连通。直接移动会触发路线验证异常。紫房子需要向右折叠，橙房子需要向下折叠。',
            grid_width=5,
            grid_height=5,
            addresses=addresses,
            roads=roads,
            letters=letters,
            post_office={'x': 2, 'y': 2},
            max_steps=30,
            min_folds=2,
            fold_directions=['horizontal_up', 'horizontal_down', 'vertical_left', 'vertical_right'],
            required_folds=['vertical_right', 'horizontal_down'],
            min_solution={
                'steps': 18,
                'folds': 2,
                'description': '先向右折叠x=2连通紫房子，再向下折叠y=2连通橙房子',
                'actions': [
                    {'action': 'fold', 'direction': 'vertical_right', 'fold_line': 2},
                    {'action': 'fold', 'direction': 'horizontal_down', 'fold_line': 2},
                    {'action': 'move', 'to': [2, 1]},
                    {'action': 'move', 'to': [2, 0]},
                    {'action': 'move', 'to': [1, 0]},
                    {'action': 'move', 'to': [0, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_1'},
                    {'action': 'move', 'to': [1, 0]},
                    {'action': 'move', 'to': [2, 0]},
                    {'action': 'move', 'to': [2, 1]},
                    {'action': 'move', 'to': [2, 2]},
                    {'action': 'move', 'to': [2, 3]},
                    {'action': 'move', 'to': [2, 4]},
                    {'action': 'deliver', 'letter_id': 'letter_3'},
                    {'action': 'move', 'to': [3, 4]},
                    {'action': 'move', 'to': [4, 4]},
                    {'action': 'deliver', 'letter_id': 'letter_2'},
                ]
            }
        )
        self.stdout.write(f'创建样本2: {level.name}\n')
    
    def _create_sample_3(self):
        """样本3：最短解对比和关卡编辑器需要回滚或重算
        复杂关卡，有多种解法，需要对比最短解，支持撤销回滚
        """
        addresses = [
            {'id': 'addr_1', 'x': 0, 'y': 0, 'color': 'red', 'name': '红房子'},
            {'id': 'addr_2', 'x': 4, 'y': 0, 'color': 'blue', 'name': '蓝房子'},
            {'id': 'addr_3', 'x': 0, 'y': 4, 'color': 'green', 'name': '绿房子'},
            {'id': 'addr_4', 'x': 4, 'y': 4, 'color': 'yellow', 'name': '黄房子'},
            {'id': 'addr_5', 'x': 2, 'y': 0, 'color': 'purple', 'name': '紫房子'},
            {'id': 'addr_6', 'x': 2, 'y': 4, 'color': 'cyan', 'name': '青房子', 'requires_fold': 'horizontal_up'},
        ]
        
        roads = []
        for x in range(5):
            for y in range(5):
                if x < 4:
                    roads.append({'from': f'cell_{x}_{y}', 'to': f'cell_{x+1}_{y}'})
                if y < 4:
                    roads.append({'from': f'cell_{x}_{y}', 'to': f'cell_{x}_{y+1}'})
        
        letters = [
            {'id': 'letter_1', 'color': 'red', 'address_id': 'addr_1'},
            {'id': 'letter_2', 'color': 'blue', 'address_id': 'addr_2'},
            {'id': 'letter_3', 'color': 'green', 'address_id': 'addr_3'},
            {'id': 'letter_4', 'color': 'yellow', 'address_id': 'addr_4'},
            {'id': 'letter_5', 'color': 'purple', 'address_id': 'addr_5'},
            {'id': 'letter_6', 'color': 'cyan', 'address_id': 'addr_6'},
        ]
        
        level = Level.objects.create(
            name='样本3：最优路径挑战',
            description='有6封信件需要送达，有多种折叠策略。尝试找到最短路径，可使用撤销功能回滚错误操作。青房子需要向上折叠后才能连通。',
            grid_width=5,
            grid_height=5,
            addresses=addresses,
            roads=roads,
            letters=letters,
            post_office={'x': 2, 'y': 2},
            max_steps=40,
            min_folds=2,
            fold_directions=['horizontal_up', 'horizontal_down', 'vertical_left', 'vertical_right'],
            required_folds=['horizontal_up'],
            min_solution={
                'steps': 22,
                'folds': 2,
                'description': '先向上折叠y=2连通青房子，再向左折叠x=2缩短路线',
                'actions': [
                    {'action': 'fold', 'direction': 'horizontal_up', 'fold_line': 2},
                    {'action': 'fold', 'direction': 'vertical_left', 'fold_line': 2},
                    {'action': 'move', 'to': [2, 1]},
                    {'action': 'move', 'to': [2, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_5'},
                    {'action': 'move', 'to': [1, 0]},
                    {'action': 'move', 'to': [0, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_1'},
                    {'action': 'move', 'to': [1, 0]},
                    {'action': 'move', 'to': [2, 0]},
                    {'action': 'move', 'to': [3, 0]},
                    {'action': 'move', 'to': [4, 0]},
                    {'action': 'deliver', 'letter_id': 'letter_2'},
                    {'action': 'move', 'to': [3, 0]},
                    {'action': 'move', 'to': [2, 0]},
                    {'action': 'move', 'to': [2, 1]},
                    {'action': 'move', 'to': [2, 2]},
                    {'action': 'deliver', 'letter_id': 'letter_6'},
                    {'action': 'move', 'to': [2, 3]},
                    {'action': 'move', 'to': [2, 4]},
                    {'action': 'move', 'to': [1, 4]},
                    {'action': 'move', 'to': [0, 4]},
                    {'action': 'deliver', 'letter_id': 'letter_3'},
                    {'action': 'move', 'to': [1, 4]},
                    {'action': 'move', 'to': [2, 4]},
                    {'action': 'move', 'to': [3, 4]},
                    {'action': 'move', 'to': [4, 4]},
                    {'action': 'deliver', 'letter_id': 'letter_4'},
                ]
            }
        )
        self.stdout.write(f'创建样本3: {level.name}\n')
