import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cableway_inspection.settings')
django.setup()

from inspection.models import DailyInspection, User, ApprovalNode
from inspection.views import ROLE_ACTION_MATRIX, STATUS_ACTION_MAP, _validate_action

print("=== 角色权限矩阵 ===")
for role, actions in ROLE_ACTION_MATRIX.items():
    print(f"  {role}: {sorted(actions)}")

print("\n=== 状态-动作映射 ===")
for status, actions in STATUS_ACTION_MAP.items():
    print(f"  {status}: {sorted(actions)}")

print("\n=== 验证角色+状态双重校验 ===")

field_user = User.objects.get(username='field_zhang')
supervisor_user = User.objects.get(username='supervisor_chen')

test_cases = [
    (field_user, 'pending', 'accept', False, '现场不能受理'),
    (supervisor_user, 'pending', 'accept', True, '主管可以受理'),
    (field_user, 'processing', 'submit_review', True, '现场可提交复核'),
    (field_user, 'processing', 'approve', False, '现场不能批准'),
    (field_user, 'processing', 'reject', False, '现场不能驳回'),
    (field_user, 'processing', 'archive', False, '现场不能归档'),
    (supervisor_user, 'reviewing', 'approve', True, '主管可以批准'),
    (supervisor_user, 'reviewing', 'reject', True, '主管可以驳回'),
    (supervisor_user, 'reviewing', 'return', True, '主管可以退回'),
    (supervisor_user, 'approved', 'archive', True, '批准后可归档'),
    (supervisor_user, 'rejected', 'archive', True, '驳回后可归档'),
    (supervisor_user, 'archived', 'reopen', True, '归档后可重新处理'),
    (field_user, 'archived', 'reopen', False, '现场不能重新处理'),
    (field_user, 'returned', 'process', True, '现场可处理补充退回记录'),
    (field_user, 'returned', 'submit_review', True, '现场可重新提交复核'),
    (field_user, 'approved', 'archive', False, '现场不能归档'),
    (supervisor_user, 'timeout', 'approve', True, '超时后主管可批准'),
    (supervisor_user, 'timeout', 'return', True, '超时后主管可退回'),
    (supervisor_user, 'approved', 'approve', False, '批准后不能再批准'),
    (field_user, 'archived', 'process', False, '归档后现场不能处理'),
]

all_pass = True
for user, status, action, expected, desc in test_cases:
    is_archived = (status == 'archived')
    inspection = DailyInspection(status=status, is_archived=is_archived)
    valid, msg = _validate_action(user, inspection, action)
    passed = valid == expected
    symbol = "✓" if passed else "✗"
    if not passed:
        all_pass = False
    print(f"  {symbol} {desc}: valid={valid}, expected={expected}, msg='{msg}'")

print(f"\n{'所有测试通过！' if all_pass else '存在测试失败！'}")

print("\n=== 验证完整流程: pending → processing → reviewing → approved → archived ===")
inspection = DailyInspection(
    status='pending', is_archived=False,
    inspector=field_user
)
inspection.save = lambda: None

flow_steps = [
    (supervisor_user, 'accept', 'processing', '主管受理'),
    (field_user, 'submit_review', 'reviewing', '现场提交复核'),
    (supervisor_user, 'approve', 'approved', '主管批准'),
    (supervisor_user, 'archive', 'archived', '主管归档'),
]

for user, action, expected_status, desc in flow_steps:
    valid, msg = _validate_action(user, inspection, action)
    if valid:
        inspection.status = expected_status
        if action == 'archive':
            inspection.is_archived = True
        print(f"  ✓ {desc}: 成功 → {expected_status}")
    else:
        print(f"  ✗ {desc}: 失败 → {msg}")

print("\n=== 验证归档后重新处理 ===")
valid, msg = _validate_action(supervisor_user, inspection, 'reopen')
print(f"  主管重新处理: valid={valid}, msg='{msg}'")
valid2, msg2 = _validate_action(field_user, inspection, 'reopen')
print(f"  现场重新处理: valid={valid2}, msg='{msg2}'")

print("\n=== 验证已归档记录实际数据 ===")
archived = DailyInspection.objects.filter(is_archived=True).first()
if archived:
    role_actions = ROLE_ACTION_MATRIX.get(supervisor_user.role, set())
    if archived.is_archived:
        allowed = role_actions & {'reopen'}
    else:
        status_actions = STATUS_ACTION_MAP.get(archived.status, set())
        allowed = role_actions & status_actions
    print(f"  已归档记录 {archived.inspection_no}: status={archived.status}")
    print(f"  主管可用动作: {sorted(allowed)}")
    print(f"  reopen 可见: {'reopen' in allowed}")

print("\n=== 全部验证完成！ ===")
