import django, os, json
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()

from game.models import GameSession, RollbackSnapshot

s = GameSession.objects.get(id=22)
snap = RollbackSnapshot.objects.filter(session=s).first()

print(f"=== RollbackSnapshot (会话22) 完整验证 ===")
print(f"\n📸 回滚前快照:")
print(f"  before_complaints = {snap.before_complaints}")
print(f"  before_score = {snap.before_score}")
print(f"  before_income = {snap.before_income}")

print(f"\n📸 回滚后快照(回滚瞬间):")
print(f"  after_complaints = {snap.after_complaints}")
print(f"  after_score = {snap.after_score}")
print(f"  after_income = {snap.after_income}")

print(f"\n📊 差异:")
print(f"  delta_complaints = {snap.delta_complaints}")
print(f"  delta_score = {snap.delta_score}")
print(f"  delta_income = {snap.delta_income} (回滚瞬间收入不变=0)")

current_income = s.total_income
income_gained = current_income - snap.before_income
print(f"\n💰 收入增长(基于快照before_income):")
print(f"  当前收入 = ¥{current_income}")
print(f"  快照before_income = ¥{snap.before_income}")
print(f"  回滚后收入增长 = ¥{income_gained}")

if snap.income_curve_json:
    curve = json.loads(snap.income_curve_json)
    print(f"\n📈 income_curve_json 保存的数据:")
    print(f"  数据点数: {len(curve)}")
    if curve:
        print(f"  最后一个点: tick={curve[-1]['tick']}, cumulative=¥{curve[-1]['cumulative']}")
        print(f"  末尾累计收入 = ¥{curve[-1]['cumulative']} (应=before_income=¥{snap.before_income})")
        match = curve[-1]['cumulative'] == snap.before_income
        print(f"  ✅ 收入曲线末尾与 before_income 一致: {match}")
else:
    print(f"\n❌ income_curve_json 为空！")

print(f"\n✅ 三项差异全部来自同一个 RollbackSnapshot (ID={snap.id}):")
print(f"   投诉变化: delta_complaints = {snap.delta_complaints}")
print(f"   分数变化: delta_score = {snap.delta_score}")
print(f"   收入增长: income_gained_after = +¥{income_gained} (基于 before_income={snap.before_income})")
print(f"   收入曲线: 来自 income_curve_json ({len(json.loads(snap.income_curve_json)) if snap.income_curve_json else 0} 个数据点)")
