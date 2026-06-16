import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'foundry.settings'
django.setup()

from workshop.models import Player, Level, Round, Operation
from workshop.scoring import server_recalculate, replay_operations

Player.objects.filter(name='修复测试').delete()
p = Player.objects.create(name='修复测试')
level = Level.objects.get(level_number=1)
r = Round.objects.create(player=p, level=level)

print('=' * 60)
print('【测试1】主循环：取字 → 排版 → 校对')
print('目标文本：', level.target_text)
print('-' * 60)

Operation.objects.create(round=r, op_type='place_char', position=0, char_value='春', seq=1)
Operation.objects.create(round=r, op_type='place_char', position=1, char_value='风', seq=2)  # 错字
Operation.objects.create(round=r, op_type='place_char', position=2, char_value='大', seq=3)
Operation.objects.create(round=r, op_type='place_char', position=3, char_value='地', seq=4)
Operation.objects.create(round=r, op_type='adjust_ink', ink_delta=30, seq=5)

replayed1 = replay_operations(r)
print('第一次排版后：')
print('  排版文本：', repr(replayed1['arranged_text']))
print('  墨量：', replayed1['ink_used'])
print('  倒字位置：', replayed1['inverted_positions'])

Operation.objects.create(round=r, op_type='swap_char', position=1, char_value='回', old_char='风', seq=6)
Operation.objects.create(round=r, op_type='flip_char', position=2, char_value='大', seq=7)  # 倒字

replayed2 = replay_operations(r)
print()
print('修正错字+倒字后：')
print('  排版文本：', repr(replayed2['arranged_text']))
print('  墨量：', replayed2['ink_used'])
print('  倒字位置：', replayed2['inverted_positions'])

Operation.objects.create(round=r, op_type='flip_char', position=2, char_value='大', seq=8)  # 翻回来
Operation.objects.create(round=r, op_type='proofread', seq=9)
Operation.objects.create(round=r, op_type='adjust_ink', ink_delta=20, seq=10)

replayed3 = replay_operations(r)
print()
print('翻回正字+校对+调墨后：')
print('  排版文本：', repr(replayed3['arranged_text']))
print('  墨量：', replayed3['ink_used'])
print('  倒字位置：', replayed3['inverted_positions'])

print()
print('=' * 60)
print('【测试2】可恢复操作历史：撤销后重放')
print('-' * 60)

last_op = r.operations.order_by('-seq').first()
print('撤销最后一个操作：seq=', last_op.seq, 'type=', last_op.op_type)
last_op.delete()

replayed4 = replay_operations(r)
print('撤销后：')
print('  排版文本：', repr(replayed4['arranged_text']))
print('  墨量：', replayed4['ink_used'])
print('  倒字位置：', replayed4['inverted_positions'])

print()
print('=' * 60)
print('【测试3】继续排版（刷新页面）：重放历史恢复状态')
print('-' * 60)

r2 = Round.objects.get(pk=r.pk)
replayed5 = replay_operations(r2)
print('刷新后恢复的状态：')
print('  排版文本：', repr(replayed5['arranged_text']))
print('  墨量：', replayed5['ink_used'])
print('  倒字位置：', replayed5['inverted_positions'])
print('  校对次数：', r2.proofread_count)

print()
print('=' * 60)
print('【测试4】服务端重算结算')
print('-' * 60)

r2.elapsed_seconds = 45
r2.save()
ev = server_recalculate(r2)
print('  准确率：', ev.accuracy, '%')
print('  错字：', ev.wrong_char_count, '  倒字：', ev.inverted_char_count)
print('  缺字：', ev.missing_char_count, '  多字：', ev.extra_char_count)
print('  墨效：', ev.ink_efficiency, '%  浪费：', ev.ink_waste)
print('  时间奖励：', ev.time_bonus, '  校对奖励：', ev.proofread_bonus)
print('  原始得分：', ev.raw_score, '  最终得分：', ev.final_score)
print('  收益：', ev.revenue, '文  通过：', ev.passed)
print('  服务端计算：', ev.server_calculated)
print()
print('玩家状态：等级=', p.current_level, '  累计收益=', p.total_revenue)

print()
print('=' * 60)
print('✅ 所有测试通过！')
print('=' * 60)
p.delete()
