from game.game_engine import (
    QuantumWarehouseEngine,
    parse_grid,
    serialize_state,
    deserialize_state,
)

print('=== 量子箱坍缩精准测试 ===')
level = [
    '#######',
    '#     #',
    '#@Q   #',
    '#     #',
    '#######',
]
engine = QuantumWarehouseEngine(level)
print(f'初始玩家: {engine.player_pos}, Q位置: {engine.boxes[0]["pos"]}')
print(f'Q push_count={engine.boxes[0]["push_count"]}, collapsed={engine.boxes[0]["collapsed"]}')
print(f'collapses={engine.collapses}')

for i in range(3):
    success, msg, b, a = engine.move('right')
    print(f'第{i+1}次右移: success={success}')
    print(f'  玩家位置: {engine.player_pos}')
    print(f'  Q push_count={engine.boxes[0]["push_count"]}, collapsed={engine.boxes[0]["collapsed"]}')
    print(f'  全局collapses={engine.collapses}')

assert engine.boxes[0]['collapsed'] == True, 'ERROR: 量子箱推3次后应该坍缩!'
assert engine.collapses == 1, 'ERROR: 坍缩次数应该为1!'
print('✅ 量子箱坍缩测试通过!')

print()
print('=== 推箱撞墙精准测试 ===')
level2 = [
    '#####',
    '#@$ #',
    '#   #',
    '#####',
]
engine2 = QuantumWarehouseEngine(level2)
print(f'关卡布局: 玩家{engine2.player_pos}, 箱{engine2.boxes[0]["pos"]}')

success, msg, _, _ = engine2.move('right')
print(f'第1次推(箱->空格): success={success}, msg={msg}')
assert success == True

success, msg, _, _ = engine2.move('right')
print(f'第2次推(箱->墙): success={success}, msg={msg}')
assert success == False, 'ERROR: 箱子前方是墙，应该无法推动!'
print('✅ 推箱撞墙测试通过!')

print()
print('=== 推箱撞另一个箱子测试 ===')
level3 = [
    '#######',
    '#@$$  #',
    '#######',
]
engine3 = QuantumWarehouseEngine(level3)
print(f'箱1: {engine3.boxes[0]["pos"]}, 箱2: {engine3.boxes[1]["pos"]}')

success, msg, _, _ = engine3.move('right')
print(f'推箱撞另箱: success={success}, msg={msg}')
assert success == False, 'ERROR: 箱子前方有另一个箱子，应该无法推动!'
print('✅ 推箱撞箱测试通过!')

print()
print('=== 完整游戏通关测试 ===')
level4 = [
    '#####',
    '#.  #',
    '#$  #',
    '#@  #',
    '#####',
]
engine4 = QuantumWarehouseEngine(level4)
print(f'初始: 玩家{engine4.player_pos}, 目标点{engine4.targets}')
print(f'箱位置: {engine4.boxes[0]["pos"]}, 箱在目标上? {engine4.boxes[0]["on_target"]}')
print(f'胜利? {engine4.check_win()}')

success, msg, _, _ = engine4.move('up')
print(f'向上推: success={success}, msg={msg}')
print(f'箱位置: {engine4.boxes[0]["pos"]}, 箱在目标上? {engine4.boxes[0]["on_target"]}')
print(f'胜利? {engine4.check_win()}')
assert engine4.check_win() == True, 'ERROR: 箱子推到目标上应该胜利!'
print('✅ 通关测试通过!')

print()
print('=== 死锁初始状态分析 ===')
level5 = [
    '#####',
    '#$  #',
    '#  .#',
    '# @ #',
    '#####',
]
engine5 = QuantumWarehouseEngine(level5)
r, c = engine5.boxes[0]['pos']
print(f'箱子在({r},{c})')
print(f'  上方(0,1)是墙? {(0,1) in engine5.walls}')
print(f'  下方(2,1)是? 墙={(2,1) in engine5.walls}, 箱={engine5._box_at((2,1))}')
print(f'  左方(1,0)是墙? {(1,0) in engine5.walls}')
print(f'  右方(1,2)是? 墙={(1,2) in engine5.walls}, 箱={engine5._box_at((1,2))}')
print(f'  箱子在目标上? {engine5.boxes[0]["on_target"]}')
print(f'死锁检测: {engine5.is_deadlock()} (应该是True, 因为箱子初始就在左上角)')
print('✅ 死锁分析完成')

print()
print('🎉 所有测试通过!')
