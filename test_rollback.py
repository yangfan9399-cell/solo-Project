import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()

from game.models import GameSession, Complaint, TouristHistory
from game.engine import calculate_score, rollback_complaints

s = GameSession.objects.get(id=11)
print("=== 回滚前 ===")
print(f"session.total_complaints = {s.total_complaints}")
print(f"Complaint 生效 = {s.complaints.filter(rolled_back=False).count()}")
print(f"TouristHistory complained = {s.tourists.filter(complained=True).count()}")
score, bd = calculate_score(s)
print(f"breakdown complaints = {bd['complaint_count']}")

print("\n=== 执行回滚(到回合0) ===")
rolled = rollback_complaints(s, 0)
print(f"回滚了 {rolled} 条投诉")

print("\n=== 回滚后 ===")
s.refresh_from_db()
print(f"session.total_complaints = {s.total_complaints}")
print(f"Complaint 生效 = {s.complaints.filter(rolled_back=False).count()}")
print(f"TouristHistory complained = {s.tourists.filter(complained=True).count()}")
score, bd = calculate_score(s)
print(f"breakdown complaints = {bd['complaint_count']}")

all_equal = (
    s.total_complaints == 
    s.complaints.filter(rolled_back=False).count() == 
    s.tourists.filter(complained=True).count() == 
    bd['complaint_count']
)
print(f"\n四者一致: {all_equal}")
print(f"队列长度: {len(s.get_queue())}")
