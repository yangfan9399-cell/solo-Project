import json
import copy
from typing import List, Tuple, Dict, Any, Optional


WALL = '#'
FLOOR = ' '
TARGET = '.'
BOX = '$'
BOX_ON_TARGET = '*'
PLAYER = '@'
PLAYER_ON_TARGET = '+'
QUANTUM_BOX = 'Q'
QUANTUM_BOX_ON_TARGET = 'q'

QUANTUM_COLLAPSE_THRESHOLD = 3

DIRECTIONS = {
    'up': (-1, 0),
    'down': (1, 0),
    'left': (0, -1),
    'right': (0, 1),
}


def parse_grid(grid_data):
    if isinstance(grid_data, str):
        rows = grid_data.strip().split('\n')
        grid = [list(row) for row in rows]
    else:
        grid = [list(row) for row in grid_data]

    walls = []
    targets = []
    boxes = []
    player_pos = None

    rows_count = len(grid)
    cols_count = max(len(row) for row in grid) if rows_count > 0 else 0

    for i in range(rows_count):
        while len(grid[i]) < cols_count:
            grid[i].append(FLOOR)

    for r in range(rows_count):
        for c in range(cols_count):
            cell = grid[r][c]
            if cell == WALL:
                walls.append((r, c))
            elif cell == TARGET:
                targets.append((r, c))
            elif cell == BOX:
                boxes.append({
                    'pos': (r, c),
                    'is_quantum': False,
                    'push_count': 0,
                    'collapsed': False,
                    'on_target': False,
                })
            elif cell == BOX_ON_TARGET:
                targets.append((r, c))
                boxes.append({
                    'pos': (r, c),
                    'is_quantum': False,
                    'push_count': 0,
                    'collapsed': False,
                    'on_target': True,
                })
            elif cell == QUANTUM_BOX:
                boxes.append({
                    'pos': (r, c),
                    'is_quantum': True,
                    'push_count': 0,
                    'collapsed': False,
                    'on_target': False,
                })
            elif cell == QUANTUM_BOX_ON_TARGET:
                targets.append((r, c))
                boxes.append({
                    'pos': (r, c),
                    'is_quantum': True,
                    'push_count': 0,
                    'collapsed': False,
                    'on_target': True,
                })
            elif cell == PLAYER:
                player_pos = (r, c)
            elif cell == PLAYER_ON_TARGET:
                targets.append((r, c))
                player_pos = (r, c)

    grid_size = (rows_count, cols_count)

    return grid, walls, targets, boxes, player_pos, grid_size


def serialize_state(state: Dict[str, Any]) -> Dict[str, Any]:
    data = {
        'grid': [list(row) for row in state['grid']],
        'player_pos': list(state['player_pos']),
        'boxes': [],
        'moves': state['moves'],
        'collapses': state['collapses'],
        'undos': state.get('undos', 0),
    }
    for box in state['boxes']:
        data['boxes'].append({
            'pos': list(box['pos']),
            'is_quantum': box['is_quantum'],
            'push_count': box['push_count'],
            'collapsed': box['collapsed'],
            'on_target': box['on_target'],
        })
    return data


def deserialize_state(data: Dict[str, Any]) -> Dict[str, Any]:
    state = {
        'grid': [list(row) for row in data['grid']],
        'player_pos': tuple(data['player_pos']),
        'boxes': [],
        'moves': data['moves'],
        'collapses': data['collapses'],
        'undos': data.get('undos', 0),
    }
    for box_data in data['boxes']:
        state['boxes'].append({
            'pos': tuple(box_data['pos']),
            'is_quantum': box_data['is_quantum'],
            'push_count': box_data['push_count'],
            'collapsed': box_data['collapsed'],
            'on_target': box_data['on_target'],
        })
    return state


class QuantumWarehouseEngine:
    def __init__(self, grid_data):
        self.original_grid_data = grid_data
        grid, walls, targets, boxes, player_pos, grid_size = parse_grid(grid_data)

        self.grid = grid
        self.walls = set(walls)
        self.targets = set(targets)
        self.boxes = boxes
        self.player_pos = player_pos
        self.grid_size = grid_size
        self.moves = 0
        self.collapses = 0
        self.undos = 0
        self.history = []

    def _box_at(self, pos: Tuple[int, int]) -> Optional[int]:
        for idx, box in enumerate(self.boxes):
            if box['pos'] == pos:
                return idx
        return None

    def _is_walkable(self, pos: Tuple[int, int]) -> bool:
        r, c = pos
        if r < 0 or r >= self.grid_size[0] or c < 0 or c >= self.grid_size[1]:
            return False
        if pos in self.walls:
            return False
        return True

    def _rebuild_grid(self):
        rows, cols = self.grid_size
        self.grid = [[FLOOR for _ in range(cols)] for _ in range(rows)]

        for (r, c) in self.walls:
            self.grid[r][c] = WALL

        for (r, c) in self.targets:
            self.grid[r][c] = TARGET

        for box in self.boxes:
            r, c = box['pos']
            if box['is_quantum'] and not box['collapsed']:
                self.grid[r][c] = QUANTUM_BOX_ON_TARGET if box['on_target'] else QUANTUM_BOX
            else:
                self.grid[r][c] = BOX_ON_TARGET if box['on_target'] else BOX

        pr, pc = self.player_pos
        if self.player_pos in self.targets:
            self.grid[pr][pc] = PLAYER_ON_TARGET
        else:
            self.grid[pr][pc] = PLAYER

        for box in self.boxes:
            box['on_target'] = box['pos'] in self.targets

    def get_state(self) -> Dict[str, Any]:
        self._rebuild_grid()
        boxes_copy = []
        for box in self.boxes:
            boxes_copy.append({
                'pos': tuple(box['pos']),
                'is_quantum': box['is_quantum'],
                'push_count': box['push_count'],
                'collapsed': box['collapsed'],
                'on_target': box['on_target'],
            })
        return {
            'grid': [list(row) for row in self.grid],
            'player_pos': tuple(self.player_pos),
            'boxes': boxes_copy,
            'moves': self.moves,
            'collapses': self.collapses,
            'undos': self.undos,
        }

    def load_state(self, state: Dict[str, Any]):
        self.grid = [list(row) for row in state['grid']]
        self.player_pos = tuple(state['player_pos'])
        self.boxes = []
        for box in state['boxes']:
            self.boxes.append({
                'pos': tuple(box['pos']),
                'is_quantum': box['is_quantum'],
                'push_count': box['push_count'],
                'collapsed': box['collapsed'],
                'on_target': box['on_target'],
            })
        self.moves = state['moves']
        self.collapses = state['collapses']
        self.undos = state.get('undos', 0)

        self.walls = set()
        self.targets = set()
        rows, cols = len(self.grid), max(len(r) for r in self.grid) if self.grid else 0
        self.grid_size = (rows, cols)
        for r in range(rows):
            for c in range(len(self.grid[r])):
                cell = self.grid[r][c]
                if cell == WALL:
                    self.walls.add((r, c))
                elif cell in (TARGET, BOX_ON_TARGET, PLAYER_ON_TARGET, QUANTUM_BOX_ON_TARGET):
                    self.targets.add((r, c))

    def move(self, direction: str) -> Tuple[bool, str, Dict[str, Any], Dict[str, Any]]:
        if direction not in DIRECTIONS:
            return False, f'无效方向: {direction}', self.get_state(), self.get_state()

        dr, dc = DIRECTIONS[direction]
        state_before = self.get_state()

        current_pos = self.player_pos
        next_pos = (current_pos[0] + dr, current_pos[1] + dc)

        if not self._is_walkable(next_pos):
            return False, '前方是墙壁，无法移动', state_before, state_before

        box_idx = self._box_at(next_pos)

        if box_idx is not None:
            box_next_pos = (next_pos[0] + dr, next_pos[1] + dc)

            if not self._is_walkable(box_next_pos):
                return False, '箱子前方是墙壁，无法推动', state_before, state_before

            if self._box_at(box_next_pos) is not None:
                return False, '箱子前方有另一个箱子，无法推动', state_before, state_before

            box = self.boxes[box_idx]
            box['pos'] = box_next_pos
            box['push_count'] += 1
            box['on_target'] = box_next_pos in self.targets

            if box['is_quantum'] and not box['collapsed'] and box['push_count'] >= QUANTUM_COLLAPSE_THRESHOLD:
                box['collapsed'] = True
                self.collapses += 1

        self.player_pos = next_pos
        self.moves += 1

        self.history.append(state_before)

        state_after = self.get_state()
        return True, '移动成功', state_before, state_after

    def undo(self) -> Tuple[bool, str]:
        if not self.history:
            return False, '没有可撤销的步骤'
        prev_state = self.history.pop()
        self.load_state(prev_state)
        self.undos += 1
        return True, '撤销成功'

    def check_win(self) -> bool:
        if not self.boxes or not self.targets:
            return False
        for box in self.boxes:
            if box['pos'] not in self.targets:
                return False
        return len(self.boxes) >= len(self.targets) or all(
            t in [b['pos'] for b in self.boxes] for t in self.targets
        )

    def is_deadlock(self) -> bool:
        for box in self.boxes:
            if box['on_target']:
                continue
            r, c = box['pos']

            up = (r - 1, c)
            down = (r + 1, c)
            left = (r, c - 1)
            right = (r, c + 1)

            up_blocked = up in self.walls or self._box_at(up) is not None
            down_blocked = down in self.walls or self._box_at(down) is not None
            left_blocked = left in self.walls or self._box_at(left) is not None
            right_blocked = right in self.walls or self._box_at(right) is not None

            if (up_blocked or down_blocked) and (left_blocked or right_blocked):
                return True

        return False

    def calculate_score(
        self,
        base_best_moves: int,
        actual_moves: int,
        collapses: int,
        undos: int,
    ) -> int:
        score = 1000
        extra_moves = max(0, actual_moves - base_best_moves)
        score -= extra_moves * 10
        score += collapses * 50
        score -= undos * 20
        return max(0, score)
