import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'snow_rescue.settings')
django.setup()

from rescue_game.models import (
    SeedSample, TerrainType, WeatherType, NodeType
)


def init_seed_samples():
    seed1, created = SeedSample.objects.get_or_create(
        seed_type='normal_complete',
        defaults={
            'name': '样本一：错误节点导致绳路失效正常完成',
            'description': '经典岩壁救援场景。玩家布置锚点和保护站，部分锚点因地形选择错误会导致绳路失效，但正确布置后可正常完成救援。',
            'terrain_type': TerrainType.ROCK,
            'weather': WeatherType.CLEAR,
            'difficulty': 1,
            'victim_x': 700,
            'victim_y': 150,
            'target_x': 100,
            'target_y': 400,
            'expected_outcome': 'success_normal',
        }
    )

    if created or True:
        terrain_map = {
            'width': 800,
            'height': 500,
            'zones': [
                {'type': 'rock', 'x': 0, 'y': 0, 'width': 200, 'height': 500},
                {'type': 'ice', 'x': 200, 'y': 100, 'width': 150, 'height': 300},
                {'type': 'rock', 'x': 350, 'y': 0, 'width': 200, 'height': 500},
                {'type': 'snow_cornice', 'x': 550, 'y': 50, 'width': 150, 'height': 200},
                {'type': 'rock', 'x': 700, 'y': 0, 'width': 100, 'height': 500},
            ]
        }
        seed1.terrain_map = str(terrain_map).replace("'", '"')

        preset_nodes = [
            {
                'node_type': NodeType.ANCHOR,
                'node_id': 'anchor_1',
                'x': 50,
                'y': 200,
                'terrain_type': TerrainType.ROCK,
                'properties': {'name': '起点锚点', 'is_start': True}
            },
            {
                'node_type': NodeType.VICTIM,
                'node_id': 'victim_start',
                'x': 700,
                'y': 150,
                'terrain_type': TerrainType.ROCK,
                'properties': {'name': '被困者位置'}
            },
        ]
        seed1.preset_nodes = str(preset_nodes).replace("'", '"')

        weather_events = []
        seed1.weather_events = str(weather_events).replace("'", '"')
        seed1.save()

    seed2, created = SeedSample.objects.get_or_create(
        seed_type='force_approximation',
        defaults={
            'name': '样本二：受力近似触发异常',
            'description': '混合地形救援场景。冰面与雪檐承力较低，玩家需要精确计算受力分布，近似临界值时会触发节点失效警告。',
            'terrain_type': TerrainType.ICE,
            'weather': WeatherType.SNOWFALL,
            'difficulty': 2,
            'victim_x': 650,
            'victim_y': 100,
            'target_x': 80,
            'target_y': 380,
            'expected_outcome': 'force_warning',
        }
    )

    if created or True:
        terrain_map = {
            'width': 800,
            'height': 500,
            'zones': [
                {'type': 'snow_cornice', 'x': 0, 'y': 0, 'width': 150, 'height': 180},
                {'type': 'ice', 'x': 0, 'y': 180, 'width': 200, 'height': 320},
                {'type': 'rock', 'x': 200, 'y': 200, 'width': 100, 'height': 300},
                {'type': 'ice', 'x': 300, 'y': 0, 'width': 200, 'height': 500},
                {'type': 'snow_cornice', 'x': 500, 'y': 0, 'width': 150, 'height': 150},
                {'type': 'ice', 'x': 500, 'y': 150, 'width': 150, 'height': 350},
                {'type': 'rock', 'x': 650, 'y': 50, 'width': 150, 'height': 450},
            ]
        }
        seed2.terrain_map = str(terrain_map).replace("'", '"')

        preset_nodes = [
            {
                'node_type': NodeType.ANCHOR,
                'node_id': 'anchor_weak',
                'x': 60,
                'y': 80,
                'terrain_type': TerrainType.SNOW_CORNICE,
                'properties': {'name': '雪檐锚点(低承力)', 'warning': '承力不足'}
            },
            {
                'node_type': NodeType.VICTIM,
                'node_id': 'victim_start',
                'x': 650,
                'y': 100,
                'terrain_type': TerrainType.ROCK,
                'properties': {'name': '被困者位置'}
            },
        ]
        seed2.preset_nodes = str(preset_nodes).replace("'", '"')

        weather_events = [
            {'step': 5, 'weather': WeatherType.WIND, 'description': '突然刮起强风'}
        ]
        seed2.weather_events = str(weather_events).replace("'", '"')
        seed2.save()

    seed3, created = SeedSample.objects.get_or_create(
        seed_type='weather_rollback',
        defaults={
            'name': '样本三：天气事件需要回滚或重算',
            'description': '高海拔复杂天气场景。救援过程中会遭遇暴风雪天气事件，导致部分节点失效，玩家需要选择回滚到安全步骤或重新计算受力。',
            'terrain_type': TerrainType.SNOW_CORNICE,
            'weather': WeatherType.CLEAR,
            'difficulty': 3,
            'victim_x': 720,
            'victim_y': 120,
            'target_x': 60,
            'target_y': 420,
            'expected_outcome': 'weather_rollback',
        }
    )

    if created or True:
        terrain_map = {
            'width': 800,
            'height': 500,
            'zones': [
                {'type': 'snow_cornice', 'x': 0, 'y': 0, 'width': 200, 'height': 200},
                {'type': 'ice', 'x': 0, 'y': 200, 'width': 150, 'height': 300},
                {'type': 'rock', 'x': 150, 'y': 250, 'width': 100, 'height': 250},
                {'type': 'snow_cornice', 'x': 250, 'y': 0, 'width': 150, 'height': 250},
                {'type': 'ice', 'x': 250, 'y': 250, 'width': 150, 'height': 250},
                {'type': 'rock', 'x': 400, 'y': 100, 'width': 120, 'height': 400},
                {'type': 'snow_cornice', 'x': 520, 'y': 0, 'width': 180, 'height': 200},
                {'type': 'ice', 'x': 520, 'y': 200, 'width': 180, 'height': 300},
                {'type': 'rock', 'x': 700, 'y': 50, 'width': 100, 'height': 450},
            ]
        }
        seed3.terrain_map = str(terrain_map).replace("'", '"')

        preset_nodes = [
            {
                'node_type': NodeType.ANCHOR,
                'node_id': 'anchor_1',
                'x': 40,
                'y': 300,
                'terrain_type': TerrainType.ICE,
                'properties': {'name': '冰面锚点1'}
            },
            {
                'node_type': NodeType.ANCHOR,
                'node_id': 'anchor_2',
                'x': 180,
                'y': 350,
                'terrain_type': TerrainType.ROCK,
                'properties': {'name': '岩壁锚点2'}
            },
            {
                'node_type': NodeType.VICTIM,
                'node_id': 'victim_start',
                'x': 720,
                'y': 120,
                'terrain_type': TerrainType.ROCK,
                'properties': {'name': '被困者位置'}
            },
        ]
        seed3.preset_nodes = str(preset_nodes).replace("'", '"')

        weather_events = [
            {'step': 6, 'weather': WeatherType.BLIZZARD, 'description': '暴风雪来袭！'}
        ]
        seed3.weather_events = str(weather_events).replace("'", '"')
        seed3.save()

    print(f'种子样本初始化完成，共 {SeedSample.objects.count()} 个样本')
    for seed in SeedSample.objects.all():
        print(f'  - {seed.name} ({seed.seed_type})')


if __name__ == '__main__':
    init_seed_samples()
