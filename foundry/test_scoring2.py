import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'foundry.settings'
django.setup()

from workshop.models import Player, Level, Round, Operation
from workshop.scoring import server_recalculate

Player.objects.filter(name='fail_test').delete()
p = Player.objects.create(name='fail_test')
level = Level.objects.get(level_number=1)
r = Round.objects.create(player=p, level=level)
Operation.objects.create(round=r, op_type='place_char', position=0, char_value='夏', seq=1)
Operation.objects.create(round=r, op_type='place_char', position=1, char_value='风', seq=2)
Operation.objects.create(round=r, op_type='place_char', position=2, char_value='山', seq=3)
Operation.objects.create(round=r, op_type='adjust_ink', ink_delta=200, seq=4)
r.elapsed_seconds = 89
r.save()

ev = server_recalculate(r)
print(f'Score: {ev.final_score}  Passed: {ev.passed}  Revenue: {ev.revenue}')
print(f'Accuracy: {ev.accuracy}%  Wrong: {ev.wrong_char_count}  Missing: {ev.missing_char_count}')
print(f'Ink waste: {ev.ink_waste}  Ink efficiency: {ev.ink_efficiency}%')
print(f'ServerCalculated: {ev.server_calculated}  Status: {r.status}')
print(f'Player level: {p.current_level}  Revenue: {p.total_revenue}')
p.delete()
