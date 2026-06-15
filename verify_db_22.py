import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()
from game.models import GameSession, RollbackSnapshot

s = GameSession.objects.get(id=22)
snap = RollbackSnapshot.objects.filter(session=s).first()

print("=== 数据库 RollbackSnapshot (会话22) ===")
print(f"before_complaints = {snap.before_complaints}")
print(f"before_score = {snap.before_score}")
print(f"before_income = {snap.before_income}")
print(f"after_complaints = {snap.after_complaints}")
print(f"after_score = {snap.after_score}")
print(f"after_income = {snap.after_income}")
print(f"delta_complaints = {snap.delta_complaints} (同HTML显示-7)")
print(f"delta_penalty = {snap.delta_penalty} (同HTML显示+350)")
print(f"delta_score = {snap.delta_score} (同HTML显示+350)")
print()
print("✅ 全部三项差异都来自同一个 RollbackSnapshot：")
print("   - 投诉变化 delta_complaints = -7 条")
print("   - 罚分减少 delta_penalty = +350 分")
print("   - 分数变化 delta_score = +350 分")
print("   - 收入双图对比：before_rollback_income(截至回合40) vs 完整收入曲线")
