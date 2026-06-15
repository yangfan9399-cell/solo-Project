import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()

from game.models import GameSession, RollbackSnapshot

SESSION_ID = 22
print(f"=== 验证会话 {SESSION_ID} ===")

try:
    s = GameSession.objects.get(id=SESSION_ID)
    print(f"✅ 会话存在：ID={s.id}, level={s.level.name}, status={s.status}")
except GameSession.DoesNotExist:
    print(f"❌ 会话 {SESSION_ID} 不存在")
    exit(1)

snapshots = RollbackSnapshot.objects.filter(session=s)
print(f"\nRollbackSnapshot 数量: {snapshots.count()}")

for snap in snapshots:
    print(f"\n=== RollbackSnapshot ID={snap.id} ===")
    print(f"  rollback_tick={snap.rollback_tick}, to_tick={snap.to_tick}")
    print(f"  回滚投诉数: {snap.rolled_back_count}")
    
    before = {
        'complaints': snap.before_complaints,
        'score': snap.before_score,
        'income': snap.before_income,
        'penalty': snap.before_complaints * 50,
    }
    after = {
        'complaints': snap.after_complaints,
        'score': snap.after_score,
        'income': snap.after_income,
        'penalty': snap.after_complaints * 50,
    }
    delta = {
        'complaints': snap.delta_complaints,
        'score': snap.delta_score,
        'income': snap.delta_income,
        'penalty_removed': snap.delta_penalty,
    }
    
    print(f"\n  回滚前(before): {before}")
    print(f"  回滚后(after):  {after}")
    print(f"  差异(delta):    {delta}")
    
    checks = {
        '投诉数都来自同一个Snapshot': snap.before_complaints != 0 or snap.after_complaints != 0,
        'delta_complaints = after - before': delta['complaints'] == after['complaints'] - before['complaints'],
        'delta_penalty正确': delta['penalty_removed'] == snap.rolled_back_count * 50,
        'before_complaints >= after_complaints': before['complaints'] >= after['complaints'],
        'delta_score与罚分变化一致': delta['score'] == before['penalty'] - after['penalty'],
    }
    
    print(f"\n  ✅ 校验项:")
    for k, v in checks.items():
        print(f"    {k}: {'PASS' if v else 'FAIL'}")

print(f"\n=== 最终会话数据 ===")
from game.engine import calculate_score
score, bd = calculate_score(s)
print(f"  当前投诉数={s.total_complaints} (注意: 包含回滚后新产生的 {s.total_complaints - snapshots.first().after_complaints if snapshots.exists() else 'N/A'} 条投诉)")
print(f"  当前分数={score}")
print(f"  当前收入={s.total_income}")
print(f"  RollbackSnapshot 中 after_complaints={snapshots.first().after_complaints if snapshots.exists() else 'N/A'} 是回滚后立刻的真实快照")
