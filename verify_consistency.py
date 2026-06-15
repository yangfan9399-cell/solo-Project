import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()

from game.models import GameSession, Complaint, TouristHistory
from game.engine import calculate_score

s = GameSession.objects.filter(level__difficulty=3).latest('id')
print(f"验证会话ID: {s.id}")
score, breakdown = calculate_score(s)

print("\n=== 数据一致性验证 ===")
print(f"1. GameSession.total_complaints = {s.total_complaints}")
print(f"2. Complaint 生效记录(rolled_back=False) = {s.complaints.filter(rolled_back=False).count()}")
print(f"3. TouristHistory.complained=True = {s.tourists.filter(complained=True).count()}")
print(f"4. calculate_score breakdown complaint_count = {breakdown['complaint_count']}")

all_equal = (
    s.total_complaints == 
    s.complaints.filter(rolled_back=False).count() == 
    s.tourists.filter(complained=True).count() == 
    breakdown['complaint_count']
)
print(f"\n四者一致: {all_equal}")

print("\n=== 回滚状态 ===")
rolled = s.complaints.filter(rolled_back=True).count()
print(f"已回滚投诉数: {rolled}")
rollback_pr = s.patience_results.filter(action__startswith='rollback:').first()
if rollback_pr:
    print(f"回滚前投诉数(从PatienceResult): {rollback_pr.complaint_count}")

print("\n=== 换乘影响数据 ===")
prs = s.patience_results.filter(action='tick')
total_transfer_loss = sum(p.transfer_patience_loss for p in prs)
total_normal_loss = sum(p.normal_patience_loss for p in prs)
total_transfer_comp = sum(p.transfer_complaints for p in prs)
total_transfer_served = sum(p.transfer_served for p in prs)
total_transfer_bonus = sum(p.transfer_revenue_bonus for p in prs)
print(f"换乘游客耐心总损失: {total_transfer_loss}")
print(f"普通游客耐心总损失: {total_normal_loss}")
print(f"换乘投诉总数: {total_transfer_comp}")
print(f"换乘服务总数: {total_transfer_served}")
print(f"换乘收入补贴: {total_transfer_bonus}")

print("\n=== breakdown 完整字段 ===")
for k, v in breakdown.items():
    print(f"  {k}: {v}")
