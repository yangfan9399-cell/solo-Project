"""
纸上邮差路线折叠游戏 - 核心游戏逻辑
"""
import copy
import uuid
from typing import Dict, List, Tuple, Optional, Any
from django.utils import timezone

from .models import Level, GameSession, FoldHistory, DeliveryDetail, GameResult


def create_initial_game_state(level: Level) -> Dict[str, Any]:
    """创建初始游戏状态"""
    grid_cells = {}
    for y in range(level.grid_height):
        for x in range(level.grid_width):
            cell_id = f"cell_{x}_{y}"
            grid_cells[cell_id] = {
                'id': cell_id,
                'x': x,
                'y': y,
                'original_x': x,
                'original_y': y,
                'visible': True,
                'fold_layer': 0,
                'merged_with': [],
            }
    
    adjacency = {}
    for road in level.roads:
        key1 = f"{road['from']}"
        key2 = f"{road['to']}"
        if key1 not in adjacency:
            adjacency[key1] = []
        if key2 not in adjacency:
            adjacency[key2] = []
        adjacency[key1].append(key2)
        adjacency[key2].append(key1)
    
    return {
        'grid_width': level.grid_width,
        'grid_height': level.grid_height,
        'cells': grid_cells,
        'adjacency': adjacency,
        'creases': [],
        'fold_directions_used': [],
    }


def are_cells_adjacent(state: Dict, cell1_id: str, cell2_id: str) -> bool:
    """检查两个单元格是否相邻（考虑折叠后的相邻关系）"""
    adjacency = state.get('adjacency', {})
    return cell2_id in adjacency.get(cell1_id, [])


def get_cell_position(state: Dict, cell_id: str) -> Optional[Tuple[int, int]]:
    """获取单元格当前位置"""
    cell = state['cells'].get(cell_id)
    if not cell or not cell['visible']:
        return None
    return (cell['x'], cell['y'])


def get_address_at_position(state: Dict, level: Level, x: int, y: int) -> Optional[Dict]:
    """获取指定位置的地址"""
    for addr in level.addresses:
        if addr['x'] == x and addr['y'] == y:
            return addr
    return None


def fold_paper(state: Dict, direction: str, fold_line: int, level: Level) -> Dict:
    """
    折叠纸张，返回新的状态和折叠信息
    direction: horizontal_up, horizontal_down, vertical_left, vertical_right
    """
    new_state = copy.deepcopy(state)
    cells = new_state['cells']
    adjacency = new_state['adjacency']
    
    merged_cells = []
    new_adjacencies = []
    removed_adjacencies = []
    crease_lines = []
    
    if direction in ['horizontal_up', 'horizontal_down']:
        is_up = direction == 'horizontal_up'
        crease_lines = [{'type': 'horizontal', 'position': fold_line}]
        
        for cell_id, cell in cells.items():
            if not cell['visible']:
                continue
            
            if is_up:
                if cell['y'] > fold_line:
                    new_y = 2 * fold_line - cell['y']
                    cell['y'] = new_y
                    cell['fold_layer'] += 1
            else:
                if cell['y'] < fold_line:
                    new_y = 2 * fold_line - cell['y']
                    cell['y'] = new_y
                    cell['fold_layer'] += 1
        
        position_map = {}
        for cell_id, cell in cells.items():
            if not cell['visible']:
                continue
            pos_key = f"{cell['x']}_{cell['y']}"
            if pos_key not in position_map:
                position_map[pos_key] = []
            position_map[pos_key].append(cell_id)
        
        for pos_key, cell_ids in position_map.items():
            if len(cell_ids) > 1:
                merged_cells.append(cell_ids)
                base_cell = cell_ids[0]
                for merged_id in cell_ids[1:]:
                    cells[merged_id]['visible'] = False
                    cells[base_cell]['merged_with'].append(merged_id)
                    
                    if merged_id in adjacency:
                        for neighbor in adjacency[merged_id]:
                            if neighbor != base_cell and neighbor not in adjacency[base_cell]:
                                adjacency[base_cell].append(neighbor)
                                new_adjacencies.append({'from': base_cell, 'to': neighbor})
                            if base_cell in adjacency.get(neighbor, []):
                                continue
                            if neighbor in adjacency:
                                if merged_id in adjacency[neighbor]:
                                    adjacency[neighbor].remove(merged_id)
                                    removed_adjacencies.append({'from': neighbor, 'to': merged_id})
                                if base_cell not in adjacency[neighbor]:
                                    adjacency[neighbor].append(base_cell)
    
    elif direction in ['vertical_left', 'vertical_right']:
        is_left = direction == 'vertical_left'
        crease_lines = [{'type': 'vertical', 'position': fold_line}]
        
        for cell_id, cell in cells.items():
            if not cell['visible']:
                continue
            
            if is_left:
                if cell['x'] > fold_line:
                    new_x = 2 * fold_line - cell['x']
                    cell['x'] = new_x
                    cell['fold_layer'] += 1
            else:
                if cell['x'] < fold_line:
                    new_x = 2 * fold_line - cell['x']
                    cell['x'] = new_x
                    cell['fold_layer'] += 1
        
        position_map = {}
        for cell_id, cell in cells.items():
            if not cell['visible']:
                continue
            pos_key = f"{cell['x']}_{cell['y']}"
            if pos_key not in position_map:
                position_map[pos_key] = []
            position_map[pos_key].append(cell_id)
        
        for pos_key, cell_ids in position_map.items():
            if len(cell_ids) > 1:
                merged_cells.append(cell_ids)
                base_cell = cell_ids[0]
                for merged_id in cell_ids[1:]:
                    cells[merged_id]['visible'] = False
                    cells[base_cell]['merged_with'].append(merged_id)
                    
                    if merged_id in adjacency:
                        for neighbor in adjacency[merged_id]:
                            if neighbor != base_cell and neighbor not in adjacency[base_cell]:
                                adjacency[base_cell].append(neighbor)
                                new_adjacencies.append({'from': base_cell, 'to': neighbor})
                            if neighbor in adjacency:
                                if merged_id in adjacency[neighbor]:
                                    adjacency[neighbor].remove(merged_id)
                                    removed_adjacencies.append({'from': neighbor, 'to': merged_id})
                                if base_cell not in adjacency[neighbor]:
                                    adjacency[neighbor].append(base_cell)
    
    new_state['creases'].extend(crease_lines)
    new_state['fold_directions_used'].append(direction)
    
    fold_info = {
        'crease_lines': crease_lines,
        'merged_cells': merged_cells,
        'new_adjacencies': new_adjacencies,
        'removed_adjacencies': removed_adjacencies,
    }
    
    return new_state, fold_info


def find_path(state: Dict, level: Level, start: Tuple[int, int], end: Tuple[int, int]) -> Optional[List[str]]:
    """使用BFS查找两点之间的路径"""
    start_cell_id = f"cell_{start[0]}_{start[1]}"
    end_cell_id = f"cell_{end[0]}_{end[1]}"
    
    if start_cell_id not in state['cells'] or end_cell_id not in state['cells']:
        return None
    
    if not state['cells'][start_cell_id]['visible'] or not state['cells'][end_cell_id]['visible']:
        return None
    
    visited = set()
    queue = [(start_cell_id, [start_cell_id])]
    
    while queue:
        current, path = queue.pop(0)
        if current == end_cell_id:
            return path
        
        if current in visited:
            continue
        visited.add(current)
        
        for neighbor in state['adjacency'].get(current, []):
            if neighbor not in visited and state['cells'].get(neighbor, {}).get('visible', False):
                queue.append((neighbor, path + [neighbor]))
    
    return None


def validate_move(state: Dict, level: Level, from_pos: Tuple[int, int], to_pos: Tuple[int, int]) -> Tuple[bool, str]:
    """验证移动是否合法"""
    from_cell_id = f"cell_{from_pos[0]}_{from_pos[1]}"
    to_cell_id = f"cell_{to_pos[0]}_{to_pos[1]}"
    
    if from_cell_id not in state['cells']:
        return False, f"起始位置无效: {from_pos}"
    
    if to_cell_id not in state['cells']:
        return False, f"目标位置无效: {to_pos}"
    
    if not state['cells'][from_cell_id]['visible']:
        return False, f"起始位置不可见（可能在折叠后隐藏）"
    
    if not state['cells'][to_cell_id]['visible']:
        return False, f"目标位置不可见（可能在折叠后隐藏）"
    
    if not are_cells_adjacent(state, from_cell_id, to_cell_id):
        path = find_path(state, level, from_pos, to_pos)
        if not path:
            return False, f"无法从 {from_pos} 到达 {to_pos}，道路不连通"
    
    return True, ""


def validate_delivery(state: Dict, level: Level, postman_pos: Tuple[int, int], letter: Dict) -> Tuple[bool, str]:
    """验证投递是否合法"""
    address = get_address_at_position(state, level, postman_pos[0], postman_pos[1])
    
    if not address:
        return False, f"邮差当前位置 ({postman_pos[0]}, {postman_pos[1]}) 没有地址"
    
    if address.get('color') != letter.get('color'):
        return False, f"地址颜色 ({address.get('color')}) 与信件颜色 ({letter.get('color')}) 不匹配"
    
    if address.get('requires_fold'):
        required_direction = address.get('requires_fold')
        fold_directions_used = state.get('fold_directions_used', [])
        if required_direction not in fold_directions_used:
            return False, f"该地址需要特定折叠方向 ({required_direction}) 后才能连通"
    
    return True, ""


def check_special_addresses_unlocked(state: Dict, level: Level) -> List[str]:
    """检查哪些特殊地址已被解锁"""
    unlocked = []
    fold_directions_used = state.get('fold_directions_used', [])
    
    for addr in level.addresses:
        if addr.get('requires_fold'):
            if addr['requires_fold'] in fold_directions_used:
                unlocked.append(addr['id'])
    
    return unlocked


def calculate_score(session: GameSession, level: Level) -> Tuple[int, Dict]:
    """
    结算分数 - 由后端按局次明细重新计算
    评分规则：
    1. 基础分：每送达一封信 100 分
    2. 步数奖励：剩余步数 * 10 分
    3. 折叠奖励：少于最少折叠次数 * 50 分
    4. 最短解奖励：达到最短解额外 500 分
    5. 惩罚：无效操作 -50 分
    """
    details = DeliveryDetail.objects.filter(game_session=session).order_by('step_number')
    
    base_score = 0
    step_bonus = 0
    fold_bonus = 0
    optimal_bonus = 0
    penalties = 0
    
    delivered_letters = session.delivered_letters
    base_score = len(delivered_letters) * 100
    
    remaining_steps = max(0, level.max_steps - session.step_count)
    step_bonus = remaining_steps * 10
    
    if level.min_folds > 0:
        saved_folds = max(0, level.min_folds - session.fold_count)
        fold_bonus = saved_folds * 50
    
    if level.min_solution:
        if session.step_count <= (level.min_solution.get('steps', 999) + 2) and \
           session.fold_count <= (level.min_solution.get('folds', 999) + 1):
            optimal_bonus = 500
    
    for detail in details:
        if not detail.is_valid:
            penalties += 50
    
    final_score = base_score + step_bonus + fold_bonus + optimal_bonus - penalties
    final_score = max(0, final_score)
    
    score_breakdown = {
        'base_score': base_score,
        'step_bonus': step_bonus,
        'fold_bonus': fold_bonus,
        'optimal_bonus': optimal_bonus,
        'penalties': penalties,
        'total': final_score,
    }
    
    return final_score, score_breakdown


def calculate_rank(score: int, total_letters: int, is_optimal: bool) -> str:
    """根据分数计算评级"""
    max_possible = total_letters * 100 + 500
    ratio = score / max_possible if max_possible > 0 else 0
    
    if is_optimal and ratio >= 0.9:
        return 'S'
    elif ratio >= 0.8:
        return 'A'
    elif ratio >= 0.6:
        return 'B'
    elif ratio >= 0.4:
        return 'C'
    else:
        return 'D'


def generate_session_id() -> str:
    """生成唯一的局次ID"""
    return f"SESSION_{uuid.uuid4().hex[:12].upper()}"
