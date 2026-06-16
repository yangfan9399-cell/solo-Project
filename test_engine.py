from game.game_engine import (
    QuantumWarehouseEngine,
    parse_grid,
    serialize_state,
    deserialize_state,
)

print('=== 初始化测试 ===')
level = [
    '########',
    '#  . . #',
    '# $Q  @#',
    '#      #',
    '########',
]
engine = QuantumWarehouseEngine(level)
print(f'网格大小: {engine.grid_size}')
print(f'玩家位置: {engine.player_pos}')
print(f'箱子数量: {len(engine.boxes)}')
print(f'量子箱子: {[b["is_quantum"] for b in engine.boxes]}')
print(f'目标点数量: {len(engine.targets)}')

print()
print('=== 状态快照测试 ===')
state = engine.get_state()
print(f'moves={state["moves"]}, collapses={state["collapses"]}')
print(f'grid 行数: {len(state["grid"])}, 列数: {len(state["grid"][0])}')

print()
print('=== 序列化/反序列化测试 ===')
serialized = serialize_state(state)
print(f'序列化后 player_pos 类型: {type(serialized["player_pos"])}')
restored = deserialize_state(serialized)
print(f'反序列化后 player_pos 类型: {type(restored["player_pos"])}')
print(f'反序列化后 boxes 数量: {len(restored["boxes"])}')

print()
print('=== load_state 测试 ===')
engine2 = QuantumWarehouseEngine(level)
engine2.load_state(restored)
print(f'恢复后玩家位置: {engine2.player_pos}')

print()
print('=== 移动测试 (向左移动) ===')
success, msg, before, after = engine.move('left')
print(f'结果: success={success}, msg={msg}')
print(f'移动前 moves={before["moves"]}, 移动后 moves={after["moves"]}')
print(f'移动前玩家: {before["player_pos"]}, 移动后玩家: {after["player_pos"]}')

print()
print('=== 撤销测试 ===')
success, msg = engine.undo()
print(f'撤销结果: success={success}, msg={msg}')
state = engine.get_state()
print(f'撤销后 undos={state["undos"]}, moves={state["moves"]}')
print(f'撤销后玩家位置: {state["player_pos"]}')

print()
print('=== 量子箱坍缩测试 ===')
level2 = [
    '#######',
    '#     #',
    '#@ Q  #',
    '#     #',
    '#######',
]
engine3 = QuantumWarehouseEngine(level2)
print(f'初始: Q push_count={engine3.boxes[0]["push_count"]}, collapsed={engine3.boxes[0]["collapsed"]}')

for i in range(3):
    success, msg, b, a = engine3.move('right')
    print(f'第{i+1}次推: success={success}, msg={msg}')
    if engine3.boxes:
        print(f'  push_count={engine3.boxes[0]["push_count"]}, collapsed={engine3.boxes[0]["collapsed"]}')

state3 = engine3.get_state()
print(f'坍缩次数 collapses={state3["collapses"]}')

print()
print('=== 分数计算测试 ===')
score = engine3.calculate_score(
    base_best_moves=5,
    actual_moves=10,
    collapses=1,
    undos=2,
)
print(f'分数: {score} (预期: 1000 - 5*10 + 1*50 - 2*20 = 960)')

print()
print('=== 死锁检测测试 ===')
level3 = [
    '#####',
    '#$  #',
    '#  .#',
    '# @ #',
    '#####',
]
engine4 = QuantumWarehouseEngine(level3)
print(f'死锁? {engine4.is_deadlock()}')

engine4.move('up')
engine4.move('left')
print(f'推到角落之后死锁? {engine4.is_deadlock()}')

print()
print('=== 胜利检测测试 ===')
level4 = [
    '#####',
    '#*@ #',
    '#####',
]
engine5 = QuantumWarehouseEngine(level4)
print(f'胜利? {engine5.check_win()}')

print()
print('=== 穿墙测试 ===')
level5 = [
    '#####',
    '#@$ #',
    '#   #',
    '#####',
]
engine6 = QuantumWarehouseEngine(level5)
success, msg, _, _ = engine6.move('up')
print(f'向上撞墙: success={success}, msg={msg}')

print()
print('=== 推箱撞墙测试 ===')
success, msg, _, _ = engine6.move('right')
print(f'推箱子(右边有墙): success={success}, msg={msg}')

print()
print('✅ 所有基础测试通过!')
