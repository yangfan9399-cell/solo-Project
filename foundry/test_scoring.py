import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'foundry.settings'
django.setup()

from workshop.models import Player, Level, Round, Operation
from workshop.scoring import server_recalculate

Player.objects.filter(name='test_player').delete()
p = Player.objects.create(name='test_player')
level = Level.objects.get(level_number=1)
r = Round.objects.create(player=p, level=level)
Operation.objects.create(round=r, op_type='place_char', position=0, char_value='春', seq=1)
Operation.objects.create(round=r, op_type='place_char', position=1, char_value='回', seq=2)
Operation.objects.create(round=r, op_type='place_char', position=2, char_value='大', seq=3)
Operation.objects.create(round=r, op_type='place_char', position=3, char_value='地', seq=4)
Operation.objects.create(round=r, op_type='adjust_ink', ink_delta=50, seq=5)
r.elapsed_seconds = 30
r.proofread_count = 1
r.save()

ev = server_recalculate(r)
print(f'Score: {ev.final_score}  Passed: {ev.passed}  Revenue: {ev.revenue}')
print(f'Accuracy: {ev.accuracy}%  Wrong: {ev.wrong_char_count}  ServerCalculated: {ev.server_calculated}')
print(f'Player revenue: {p.total_revenue}  Level: {p.current_level}')
p.delete()
