import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()

from game.models import GameSession, RollbackSnapshot

s = GameSession.objects.filter(level__difficulty=3).latest('id')
print(f"会话ID: {s.id}")

snapshots = RollbackSnapshot.objects.filter(session=s).order_by('-rollback_tick')
print(f"回滚快照数: {snapshots.count()}")

for snap in snapshots:
    print(f"\n=== 回滚快照 ID={snap.id} ===")
    print(f"回滚发生回合: {snap.rollback_tick}, 撤销至回合: {snap.to_tick}")
    print(f"回滚投诉数: {snap.rolled_back_count} (换乘{snap.transfer_rolled_back}/普通{snap.normal_rolled_back})")
    print(f"恢复队列人数: {snap.restored_queue_count}")
    print(f"\n📸 回滚前:")
    print(f"  投诉={snap.before_complaints}, 分数={snap.before_score}, 收入={snap.before_income}, 罚分={snap.before_complaints*50}")
    print(f"\n📸 回滚后:")
    print(f"  投诉={snap.after_complaints}, 分数={snap.after_score}, 收入={snap.after_income}, 罚分={snap.after_complaints*50}")
    print(f"\n📊 差异:")
    print(f"  投诉变化={snap.delta_complaints} (期望=-{snap.rolled_back_count})")
    print(f"  罚分减少={snap.delta_penalty} (期望={snap.rolled_back_count*50})")
    print(f"  分数变化={snap.delta_score} (期望≈{snap.rolled_back_count*50})")
    print(f"  收入变化={snap.delta_income}")

    expected_delta_complaints = -snap.rolled_back_count
    expected_penalty = snap.rolled_back_count * 50
    check_pass = (
        snap.delta_complaints == expected_delta_complaints and
        snap.delta_penalty == expected_penalty and
        snap.delta_score >= 0 and
        snap.before_complaints >= snap.after_complaints
    )
    print(f"\n✅ 快照一致性: {check_pass}")

print(f"\n=== 最终状态 ===")
print(f"session.total_complaints = {s.total_complaints}")
from game.engine import calculate_score
score, bd = calculate_score(s)
print(f"当前分数={score}, 当前投诉={bd['complaint_count']}")
print(f"回滚快照中的 after_complaints={snapshots.first().after_complaints if snapshots.exists() else 'N/A'} 是回滚后立刻的数据")
print(f"注意：当前投诉数({bd['complaint_count']}) = 回滚后立刻投诉数({snapshots.first().after_complaints if snapshots.exists() else 'N/A'}) + 回滚后新产生的投诉")
